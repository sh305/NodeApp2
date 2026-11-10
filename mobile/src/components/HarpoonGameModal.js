import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  useWindowDimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import {
  GoldenMermaidGraphic,
  GreatWhiteSharkGraphic,
  GiantKrakenGraphic,
  SpikyPufferfishGraphic,
  GoldenCrabGraphic,
  GoldenLaserHarpoonGraphic,
} from './HarpoonIcons';
import { ShinyCoinIcon } from './FoodIcons';

const CHIPS = [100, 500, 1000, 5000, 10000, 25000];

const CREATURES_PREVIEW = [
  { id: 'mermaid', name: 'Golden Mermaid', multiplier: 30, color: '#F59E0B' },
  { id: 'shark', name: 'Great White Shark', multiplier: 12, color: '#06B6D4' },
  { id: 'kraken', name: 'Giant Kraken', multiplier: 5, color: '#A855F7' },
  { id: 'puffer', name: 'Spiky Pufferfish', multiplier: 2.5, color: '#10B981' },
  { id: 'crab', name: 'Beach Crab', multiplier: 0.6, color: '#F43F5E' },
];

export default function HarpoonGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // State
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [isFiring, setIsFiring] = useState(false);

  // Caught Creature & Win Result
  const [caughtCreature, setCaughtCreature] = useState(null);
  const [winResult, setWinResult] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Auto-Fire State
  const [autoShotsLeft, setAutoShotsLeft] = useState(0);
  const autoFireTimerRef = useRef(null);

  // Animations
  const spearYAnim = useRef(new Animated.Value(0)).current;
  const spearScaleAnim = useRef(new Animated.Value(1)).current;
  const gunRecoilAnim = useRef(new Animated.Value(0)).current;
  const catchBobAnim = useRef(new Animated.Value(0)).current;
  const fireBtnPulse = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isFiringRef = useRef(isFiring);
  isFiringRef.current = isFiring;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/harpoon/state');
      if (res.data?.success && isMountedRef.current) {
        if (res.data.userCoins !== undefined) {
          setUserCoins(res.data.userCoins);
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(res.data.userCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
        if (res.data.history) setHistory(res.data.history);
        if (res.data.recentWinners) setRecentWinners(res.data.recentWinners);
      }
    } catch (err) {
      console.error('fetchGameState Harpoon error:', err);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      isMountedRef.current = true;
      fetchGameState();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(fireBtnPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(fireBtnPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      return () => {
        isMountedRef.current = false;
        pulseLoop.stop();
        if (autoFireTimerRef.current) clearTimeout(autoFireTimerRef.current);
      };
    }
  }, [visible, fetchGameState, fireBtnPulse]);

  // Handle Bet Adjustments
  const handleHalfBet = () => {
    if (isFiring) return;
    setBetAmount((prev) => Math.max(100, Math.floor(prev / 2)));
  };

  const handleDoubleBet = () => {
    if (isFiring) return;
    setBetAmount((prev) => Math.min(Math.max(100, userCoins), prev * 2));
  };

  const handleMaxBet = () => {
    if (isFiring) return;
    const maxVal = Math.min(50000, userCoins);
    setBetAmount(maxVal >= 100 ? maxVal : 100);
  };

  // Main Harpoon Fire Shot
  const handleFireHarpoon = async () => {
    if (isFiringRef.current) return;
    if (userCoins < betAmount) {
      showToast(t('Insufficient coins! Please recharge.'), 'error');
      setAutoShotsLeft(0);
      return;
    }

    setIsFiring(true);
    setWinResult(null);

    // Optimistically deduct bet
    const prevCoins = userCoins;
    const optimisticCoins = Math.max(0, userCoins - betAmount);
    setUserCoins(optimisticCoins);
    if (onCoinBalanceUpdate) onCoinBalanceUpdate(optimisticCoins);

    // Spear Fire Animation: spear shoots upwards, recoil on gun
    spearYAnim.setValue(0);
    gunRecoilAnim.setValue(0);
    catchBobAnim.setValue(0);

    Animated.parallel([
      Animated.timing(gunRecoilAnim, {
        toValue: 12,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(spearYAnim, {
        toValue: -110,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(gunRecoilAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    });

    try {
      const res = await api.post('/games/harpoon/fire', { betAmount });
      if (!res.data?.success) {
        setUserCoins(prevCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
        showToast(t(res.data?.message || 'Hunt failed'), 'error');
        setIsFiring(false);
        setAutoShotsLeft(0);
        return;
      }

      const {
        creature,
        creatureName,
        multiplier,
        color,
        wonCoins,
        spentCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        history: newHistory,
        recentWinners: newWinners,
      } = res.data;

      // Reel spear and caught creature back down
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setCaughtCreature(creature);

        Animated.sequence([
          Animated.timing(spearYAnim, {
            toValue: -20,
            duration: 350,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(catchBobAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setUserCoins(remainingCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(remainingCoins);
        if (newTodayEarnings !== undefined) setTodayEarnings(newTodayEarnings);
        if (newHistory) setHistory(newHistory);
        if (newWinners) setRecentWinners(newWinners);

        setIsFiring(false);

        // Win result
        const resultData = {
          creature,
          creatureName,
          multiplier,
          color,
          wonCoins,
          spentCoins,
          profit: wonCoins - spentCoins,
        };
        setWinResult(resultData);

        // Haptic feedback
        try {
          Vibration.vibrate(multiplier >= 5 ? 100 : 40);
        } catch (e) {}

        // Celebration popup if multiplier >= 5X
        if (multiplier >= 5) {
          setCelebrationVisible(true);
          celebrationScale.setValue(0.3);
          celebrationOpacity.setValue(0);
          Animated.parallel([
            Animated.spring(celebrationScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
            Animated.timing(celebrationOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();

          setTimeout(() => {
            if (isMountedRef.current) {
              setCelebrationVisible(false);
            }
          }, 2400);
        }

        // Auto-fire handler
        setAutoShotsLeft((prev) => {
          const nextCount = prev > 1 ? prev - 1 : 0;
          if (nextCount > 0) {
            autoFireTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) handleFireHarpoon();
            }, 1200);
          }
          return nextCount;
        });
      }, 350);
    } catch (err) {
      console.error('handleFireHarpoon error:', err);
      setUserCoins(prevCoins);
      if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
      showToast(t(err.response?.data?.message || 'Hunt request failed'), 'error');
      setIsFiring(false);
      setAutoShotsLeft(0);
    }
  };

  // Toggle Auto Fire
  const handleToggleAutoFire = (count) => {
    if (autoShotsLeft > 0) {
      setAutoShotsLeft(0);
      if (autoFireTimerRef.current) clearTimeout(autoFireTimerRef.current);
      showToast(t('Auto-hunt stopped'), 'info');
    } else {
      if (userCoins < betAmount) {
        showToast(t('Insufficient coins! Please recharge.'), 'error');
        return;
      }
      setAutoShotsLeft(count);
      showToast(t('Auto-hunt started'), 'success');
      if (!isFiring) {
        handleFireHarpoon();
      }
    }
  };

  // Render Caught Creature Graphic
  const renderCreature = (creatureId) => {
    switch (creatureId) {
      case 'mermaid':
        return <GoldenMermaidGraphic size={86} />;
      case 'shark':
        return <GreatWhiteSharkGraphic size={86} />;
      case 'kraken':
        return <GiantKrakenGraphic size={86} />;
      case 'puffer':
        return <SpikyPufferfishGraphic size={86} />;
      case 'crab':
      default:
        return <GoldenCrabGraphic size={86} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            {
              height: Math.min(800, Math.floor(windowHeight * 0.90)),
              paddingBottom:
                Platform.OS === 'android'
                  ? Math.max(28, insets.bottom + 16)
                  : Math.max(16, insets.bottom),
            },
          ]}
        >
          {/* Header Bar */}
          <LinearGradient
            colors={['#083344', '#0F172A', '#020617']}
            style={styles.headerBar}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🔱 HARPOON</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                <T>Golden Harpoon</T>
              </Text>
            </View>

            {/* User Coin Balance Pill */}
            <TouchableOpacity
              style={styles.coinBalancePill}
              activeOpacity={0.75}
              onPress={onRechargePress}
            >
              <ShinyCoinIcon size={20} />
              <Text style={styles.coinBalanceText}>
                {userCoins.toLocaleString()}
              </Text>
              <View style={styles.rechargeBtn}>
                <Text style={styles.rechargeBtnText}>+</Text>
              </View>
            </TouchableOpacity>

            {/* Help & Close Actions */}
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.headerActionBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.headerActionBtnText}>?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtn, styles.headerCloseBtn]}
                activeOpacity={0.75}
                onPress={onClose}
              >
                <Text style={styles.headerCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Subheader: Today Earnings & Multiplier Info */}
          <View style={styles.subHeader}>
            <View style={styles.subHeaderLeft}>
              <Text style={styles.subHeaderLabel}><T>Today Won</T>:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <ShinyCoinIcon size={14} />
                <Text style={styles.subHeaderValue}>+{todayEarnings.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.subHeaderBadge}>
              <Text style={styles.subHeaderBadgeText}>🧜‍♀️ 30X MERMAID JACKPOT</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  Platform.OS === 'android'
                    ? Math.max(36, insets.bottom + 24)
                    : Math.max(24, insets.bottom),
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ ARENA: DEEP OCEAN REEF SPEARFISHING ══ */}
            <View style={styles.arenaCard}>
              <LinearGradient
                colors={['#082F49', '#075985', '#0C4A6E', '#031726']}
                style={StyleSheet.absoluteFill}
              />

              {/* Water Wave Effect Guides */}
              <View style={styles.bubbleLayer}>
                <View style={[styles.bubble, { top: 20, left: '15%', width: 10, height: 10 }]} />
                <View style={[styles.bubble, { top: 50, left: '78%', width: 14, height: 14 }]} />
                <View style={[styles.bubble, { top: 90, left: '30%', width: 8, height: 8 }]} />
                <View style={[styles.bubble, { top: 130, left: '85%', width: 12, height: 12 }]} />
              </View>

              {/* Ocean Target Creature Display */}
              <View style={styles.targetAquariumArea}>
                {caughtCreature ? (
                  <Animated.View
                    style={[
                      styles.caughtCreatureWrap,
                      {
                        transform: [
                          {
                            scale: catchBobAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.05],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {renderCreature(caughtCreature)}
                    {winResult && (
                      <View
                        style={[
                          styles.caughtMultiplierPill,
                          { backgroundColor: winResult.color },
                        ]}
                      >
                        <Text style={styles.caughtMultiplierText}>
                          {winResult.multiplier}X {winResult.creatureName}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                ) : (
                  <View style={styles.swimmingPreviewRow}>
                    <View style={styles.previewCreatureBox}>
                      <GoldenMermaidGraphic size={52} />
                      <Text style={styles.previewTagGold}>30X</Text>
                    </View>
                    <View style={styles.previewCreatureBox}>
                      <GreatWhiteSharkGraphic size={52} />
                      <Text style={styles.previewTagCyan}>12X</Text>
                    </View>
                    <View style={styles.previewCreatureBox}>
                      <GiantKrakenGraphic size={52} />
                      <Text style={styles.previewTagPurple}>5X</Text>
                    </View>
                    <View style={styles.previewCreatureBox}>
                      <SpikyPufferfishGraphic size={52} />
                      <Text style={styles.previewTagGreen}>2.5X</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Animated Flying Harpoon Spear */}
              <Animated.View
                style={[
                  styles.spearProjectile,
                  {
                    transform: [{ translateY: spearYAnim }],
                    opacity: isFiring || caughtCreature ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.laserTridentBeam} />
              </Animated.View>

              {/* Gun Turret Mounted at Bottom */}
              <Animated.View
                style={[
                  styles.harpoonGunBase,
                  { transform: [{ translateY: gunRecoilAnim }] },
                ]}
              >
                <GoldenLaserHarpoonGraphic size={64} />
              </Animated.View>
            </View>

            {/* ══ WIN OUTCOME STRIP ══ */}
            {winResult && (
              <View
                style={[
                  styles.winResultBanner,
                  winResult.profit > 0
                    ? styles.winResultSuccess
                    : winResult.wonCoins > 0
                    ? styles.winResultNeutral
                    : styles.winResultLoss,
                ]}
              >
                <Text style={styles.winResultEmoji}>
                  {winResult.multiplier >= 30 ? '🧜‍♀️' : winResult.multiplier >= 12 ? '🦈' : winResult.multiplier >= 5 ? '🐙' : winResult.multiplier >= 1 ? '✨' : '🦀'}
                </Text>
                <View style={styles.winResultTextWrap}>
                  <Text style={styles.winResultTitle}>
                    {winResult.multiplier >= 30
                      ? t('30X MERMAID GRAND JACKPOT!')
                      : winResult.multiplier >= 12
                      ? t('12X SHARK MEGA CATCH!')
                      : winResult.multiplier >= 5
                      ? t('5X KRAKEN BIG WIN!')
                      : winResult.multiplier >= 1
                      ? t('NICE CATCH!')
                      : t('CRAB CONSOLATION RETURN')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Text style={styles.winResultDetails}><T>Won</T> </Text>
                    <ShinyCoinIcon size={14} />
                    <Text style={styles.winCoinsHighlight}>
                      +{winResult.wonCoins.toLocaleString()}
                    </Text>
                    <Text style={styles.winResultDetails}>{' • '}<T>Bet</T>: {winResult.spentCoins.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ══ CONTROLS: CHIP SELECTOR & ACTIONS ══ */}
            <View style={styles.controlsSection}>
              <View style={styles.controlsHeader}>
                <Text style={styles.controlsTitle}><T>Select Chip</T></Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.currentBetLabel}><T>Current Bet</T>:</Text>
                  <ShinyCoinIcon size={14} />
                  <Text style={styles.currentBetValue}>{betAmount.toLocaleString()}</Text>
                </View>
              </View>

              {/* Chips Row */}
              <View style={styles.chipsRow}>
                {CHIPS.map((chip) => {
                  const isSelected = betAmount === chip;
                  return (
                    <TouchableOpacity
                      key={`chip_${chip}`}
                      style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                      activeOpacity={0.75}
                      onPress={() => !isFiring && setBetAmount(chip)}
                      disabled={isFiring}
                    >
                      <Text style={[styles.chipBtnText, isSelected && styles.chipBtnTextActive]}>
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Multiplier Adjusters & Auto-Hunt */}
              <View style={styles.multiplierAdjustRow}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  activeOpacity={0.75}
                  onPress={handleHalfBet}
                  disabled={isFiring}
                >
                  <Text style={styles.adjustBtnText}>1/2</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  activeOpacity={0.75}
                  onPress={handleDoubleBet}
                  disabled={isFiring}
                >
                  <Text style={styles.adjustBtnText}>2X</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adjustBtn, styles.adjustBtnMax]}
                  activeOpacity={0.75}
                  onPress={handleMaxBet}
                  disabled={isFiring}
                >
                  <Text style={styles.adjustBtnTextMax}>MAX</Text>
                </TouchableOpacity>

                {/* Auto Hunt Toggle */}
                <TouchableOpacity
                  style={[
                    styles.autoBtn,
                    autoShotsLeft > 0 && styles.autoBtnActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleToggleAutoFire(10)}
                >
                  <Text
                    style={[
                      styles.autoBtnText,
                      autoShotsLeft > 0 && styles.autoBtnTextActive,
                    ]}
                  >
                    {autoShotsLeft > 0 ? `${t('STOP')} (${autoShotsLeft})` : t('Auto 10')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ══ BIG FIRE HARPOON BUTTON ══ */}
            <Animated.View style={{ transform: [{ scale: isFiring ? 1 : fireBtnPulse }] }}>
              <TouchableOpacity
                style={[styles.fireBtn, isFiring && styles.fireBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleFireHarpoon}
                disabled={isFiring}
              >
                <LinearGradient
                  colors={isFiring ? ['#4B5563', '#374151'] : ['#06B6D4', '#0891B2', '#0E7490']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.fireBtnGradient}
                >
                  <Text style={styles.fireBtnIcon}>🔱</Text>
                  <Text style={styles.fireBtnText}>
                    {isFiring ? t('HUNTING...') : t('FIRE HARPOON!')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ══ RECENT CATCHES HISTORY BREADCRUMBS ══ */}
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}><T>Recent Catches</T></Text>
                <Text style={styles.historySub}><T>Last 15 rounds</T></Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {history.length === 0 ? (
                  <Text style={styles.emptyHistoryText}><T>No catches yet. Fire your first harpoon!</T></Text>
                ) : (
                  history.map((item, idx) => {
                    const match = CREATURES_PREVIEW.find((c) => c.id === item.creature) || CREATURES_PREVIEW[4];
                    return (
                      <View
                        key={`hist_${item.roundId || idx}`}
                        style={[
                          styles.historyPill,
                          { borderColor: match.color, backgroundColor: 'rgba(255,255,255,0.06)' },
                        ]}
                      >
                        <Text style={[styles.historyPillText, { color: match.color }]}>
                          {match.multiplier}X {match.id === 'mermaid' ? '🧜‍♀️' : match.id === 'shark' ? '🦈' : match.id === 'kraken' ? '🐙' : match.id === 'puffer' ? '🐡' : '🦀'}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {/* ══ TOP WINNERS TICKER ══ */}
            {recentWinners.length > 0 && (
              <View style={styles.winnersCard}>
                <Text style={styles.winnersTitle}><T>Top Ocean Hunters</T></Text>
                {recentWinners.slice(0, 4).map((winner, idx) => (
                  <View key={`win_${idx}`} style={styles.winnerRow}>
                    <View style={styles.winnerLeft}>
                      <Text style={styles.winnerRank}>#{idx + 1}</Text>
                      <Text style={styles.winnerName}>{winner.name}</Text>
                    </View>
                    <View style={styles.winnerRight}>
                      <Text style={styles.winnerMultiplier}>{winner.multiplier}X</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.winnerAmount}>+{winner.amount.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ══ CELEBRATION MODAL OVERLAY (5X - 30X WINS) ══ */}
          {celebrationVisible && winResult && (
            <Animated.View
              style={[
                styles.celebrationOverlay,
                {
                  opacity: celebrationOpacity,
                  transform: [{ scale: celebrationScale }],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['rgba(8, 145, 178, 0.95)', 'rgba(14, 116, 144, 0.95)']}
                style={styles.celebrationCard}
              >
                {winResult.multiplier >= 30 ? (
                  <GoldenMermaidGraphic size={70} />
                ) : winResult.multiplier >= 12 ? (
                  <GreatWhiteSharkGraphic size={70} />
                ) : (
                  <GiantKrakenGraphic size={70} />
                )}
                <Text style={styles.celebrationHeader}>
                  {winResult.multiplier >= 30
                    ? t('30X MERMAID JACKPOT!')
                    : winResult.multiplier >= 12
                    ? t('12X SHARK MEGA CATCH!')
                    : t('OCEAN HUNTER WINNER!')}
                </Text>
                <Text style={styles.celebrationSub}>
                  <T>Congratulations! You won</T>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ShinyCoinIcon size={26} />
                  <Text style={styles.celebrationAmount}>
                    +{winResult.wonCoins.toLocaleString()}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ══ RULES MODAL ══ */}
          <Modal
            visible={rulesVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setRulesVisible(false)}
          >
            <View style={styles.rulesOverlay}>
              <View style={styles.rulesCard}>
                <LinearGradient
                  colors={['#083344', '#020617']}
                  style={styles.rulesHeader}
                >
                  <Text style={styles.rulesTitle}><T>Golden Harpoon Rules</T></Text>
                  <TouchableOpacity
                    style={styles.rulesCloseBtn}
                    activeOpacity={0.75}
                    onPress={() => setRulesVisible(false)}
                  >
                    <Text style={styles.rulesCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView style={styles.rulesBody}>
                  <Text style={styles.rulesHeading}><T>How to Play</T></Text>
                  <Text style={styles.rulesPara}>
                    <T>1. Select your bet amount from the chips bar (min 100 coins).</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>2. Tap FIRE HARPOON! to shoot your laser spear into the deep ocean.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>3. The harpoon captures a swimming sea creature and reels it up in a gold net.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>4. You instantly win your bet multiplied by the creature's multiplier!</T>
                  </Text>

                  <Text style={styles.rulesHeading}><T>Sea Creatures & Multipliers</T></Text>
                  <View style={styles.rulesTable}>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#F59E0B' }]}>30X</Text>
                      <Text style={styles.rulesTableDesc}><T>🧜‍♀️ Golden Mermaid: Super Ocean Jackpot!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#06B6D4' }]}>12X</Text>
                      <Text style={styles.rulesTableDesc}><T>🦈 Great White Shark: Mega Fierce Catch!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#A855F7' }]}>5X</Text>
                      <Text style={styles.rulesTableDesc}><T>🐙 Giant Kraken: Big Tentacle Win!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#10B981' }]}>2.5X</Text>
                      <Text style={styles.rulesTableDesc}><T>🐡 Spiky Pufferfish: Solid Profit Catch!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#F43F5E' }]}>0.6X</Text>
                      <Text style={styles.rulesTableDesc}><T>🦀 Beach Crab: Safe Consolation Shell Return.</T></Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#041322',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(6, 182, 212, 0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  headerBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  coinBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    gap: 6,
  },
  coinBalanceIcon: {
    fontSize: 14,
  },
  coinBalanceText: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '700',
  },
  rechargeBtn: {
    backgroundColor: '#06B6D4',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  headerCloseBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerCloseBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#032034',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subHeaderLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  subHeaderValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  subHeaderBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subHeaderBadgeText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  arenaCard: {
    width: '100%',
    height: 230,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 16,
  },
  bubbleLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: 'rgba(186, 230, 253, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  targetAquariumArea: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  swimmingPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  previewCreatureBox: {
    alignItems: 'center',
  },
  previewTagGold: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  previewTagCyan: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  previewTagPurple: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  previewTagGreen: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  caughtCreatureWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caughtMultiplierPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    elevation: 4,
  },
  caughtMultiplierText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  spearProjectile: {
    position: 'absolute',
    bottom: 70,
    alignItems: 'center',
    zIndex: 10,
  },
  laserTridentBeam: {
    width: 4,
    height: 50,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  harpoonGunBase: {
    alignItems: 'center',
    zIndex: 15,
    marginTop: 'auto',
  },
  winResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    gap: 10,
    borderWidth: 1,
  },
  winResultSuccess: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: '#06B6D4',
  },
  winResultNeutral: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  winResultLoss: {
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    borderColor: '#64748B',
  },
  winResultEmoji: {
    fontSize: 24,
  },
  winResultTextWrap: {
    flex: 1,
  },
  winResultTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  winResultDetails: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  winCoinsHighlight: {
    color: '#FDE047',
    fontWeight: '800',
  },
  controlsSection: {
    width: '100%',
    backgroundColor: '#0F1E2E',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  controlsTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  currentBetLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  currentBetValue: {
    color: '#FDE047',
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chipBtn: {
    flex: 1,
    minWidth: 46,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    borderColor: '#06B6D4',
  },
  chipBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '900',
  },
  multiplierAdjustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adjustBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  adjustBtnMax: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  adjustBtnTextMax: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  autoBtn: {
    flex: 1.4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  autoBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  autoBtnText: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '800',
  },
  autoBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  fireBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
  },
  fireBtnDisabled: {
    opacity: 0.6,
  },
  fireBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  fireBtnIcon: {
    fontSize: 18,
  },
  fireBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  historyCard: {
    width: '100%',
    backgroundColor: '#0F1E2E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  historySub: {
    color: '#64748B',
    fontSize: 11,
  },
  historyScroll: {
    flexDirection: 'row',
  },
  emptyHistoryText: {
    color: '#64748B',
    fontSize: 12,
    paddingVertical: 4,
  },
  historyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  historyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  winnersCard: {
    width: '100%',
    backgroundColor: '#0F1E2E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  winnersTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  winnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerRank: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  winnerName: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  winnerRight: {
    alignItems: 'flex-end',
  },
  winnerMultiplier: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '800',
  },
  winnerAmount: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '700',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  celebrationCard: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 20,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  celebrationHeader: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  celebrationSub: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  celebrationAmount: {
    color: '#FEF08A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  rulesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#02182B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rulesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rulesCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rulesBody: {
    padding: 16,
  },
  rulesHeading: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  rulesPara: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  rulesTable: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
  },
  rulesTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rulesTableCol: {
    width: 50,
    fontSize: 13,
    fontWeight: '900',
  },
  rulesTableDesc: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
  },
});


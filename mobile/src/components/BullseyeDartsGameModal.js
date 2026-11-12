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
  TournamentDartboardGraphic,
  BullseyeTargetIcon,
  GoldenDartIcon,
} from './BullseyeDartsIcons';
import { ShinyCoinIcon } from './FoodIcons';

// Available Chip Denominations
const CHIPS = [100, 500, 1000, 5000, 10000];

export default function BullseyeDartsGameModal({
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
  const [selectedChip, setSelectedChip] = useState(100);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Bets state on 6 betting options:
  // goldenEye (25X), bullseye (10X), precision (3X), outer (1.5X), red (2X), black (2X)
  const [bets, setBets] = useState({
    goldenEye: 0,
    bullseye: 0,
    precision: 0,
    outer: 0,
    red: 0,
    black: 0,
  });
  const [lastPlacedBets, setLastPlacedBets] = useState(null);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Loop & Reveal Phases: 'BETTING' (12s) -> 'FLYING' (1.5s) -> 'RESULT' (4s)
  const [gamePhase, setGamePhase] = useState('BETTING');
  const [countdown, setCountdown] = useState(12);
  const [landedDart, setLandedDart] = useState(null);
  const [winResult, setWinResult] = useState(null);

  // Animations
  const dartFlightAnim = useRef(new Animated.Value(0)).current;
  const boardScaleAnim = useRef(new Animated.Value(1)).current;
  const winPopupAnim = useRef(new Animated.Value(0)).current;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/bullseye-darts/state');
      if (res.data?.success) {
        if (res.data.userCoins !== undefined) {
          setUserCoins(res.data.userCoins);
          onCoinBalanceUpdate?.(res.data.userCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
        if (res.data.history) {
          setHistory(res.data.history);
        }
        if (res.data.recentWinners) {
          setRecentWinners(res.data.recentWinners);
        }
      }
    } catch (err) {
      console.warn('Failed to load Bullseye Darts state:', err.message);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
    }
  }, [visible, fetchGameState]);

  // Total bet amount calculation
  const totalBetAmount = Object.values(bets).reduce((acc, v) => acc + (v || 0), 0);

  // Place bet on a zone
  const handlePlaceBet = (zoneKey) => {
    if (gamePhase !== 'BETTING') {
      showToast(t('Betting closed for this round!'), 'info');
      return;
    }
    if (userCoins < selectedChip) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }
    Vibration.vibrate(25);
    setUserCoins((prev) => {
      const next = prev - selectedChip;
      onCoinBalanceUpdate?.(next);
      return next;
    });
    setBets((prev) => ({
      ...prev,
      [zoneKey]: (prev[zoneKey] || 0) + selectedChip,
    }));
  };

  // Clear all bets and refund locally
  const handleClearBets = () => {
    if (totalBetAmount === 0) return;
    if (gamePhase !== 'BETTING') {
      showToast(t('Cannot clear bets during throw!'), 'info');
      return;
    }
    setUserCoins((prev) => {
      const restored = prev + totalBetAmount;
      onCoinBalanceUpdate?.(restored);
      return restored;
    });
    setBets({
      goldenEye: 0,
      bullseye: 0,
      precision: 0,
      outer: 0,
      red: 0,
      black: 0,
    });
    showToast(t('Bets cleared! Coins refunded.'), 'info');
  };

  // Rebet previous amounts
  const handleRebet = () => {
    if (!lastPlacedBets) {
      showToast(t('No previous bets to repeat'), 'info');
      return;
    }
    if (gamePhase !== 'BETTING') return;

    const prevTotal = Object.values(lastPlacedBets).reduce((acc, v) => acc + (v || 0), 0);
    if (userCoins < prevTotal) {
      showToast(t('Insufficient coins for Rebet'), 'error');
      return;
    }

    handleClearBets();
    setUserCoins((prev) => {
      const next = prev - prevTotal;
      onCoinBalanceUpdate?.(next);
      return next;
    });
    setBets({ ...lastPlacedBets });
    showToast(t('Previous bets placed!'), 'success');
  };

  // Execute dart throw round
  const executeDartThrow = async (currentBets) => {
    try {
      setGamePhase('FLYING');

      // Dart flight animation
      dartFlightAnim.setValue(0);
      Animated.timing(dartFlightAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const hasBets = Object.values(currentBets).some((v) => (v || 0) > 0);

      if (hasBets) {
        setLastPlacedBets({ ...currentBets });

        const res = await api.post('/games/bullseye-darts/play', { bets: currentBets });
        if (!res.data?.success) {
          showToast(t(res.data?.message || 'Failed to throw dart'), 'error');
          setGamePhase('BETTING');
          setCountdown(12);
          return;
        }

        const {
          zone,
          zoneMultiplier,
          segmentNumber,
          segmentColor,
          hitX,
          hitY,
          wonCoins,
          remainingCoins,
          todayEarnings: newEarnings,
          history: updatedHistory,
        } = res.data;

        setTimeout(() => {
          Vibration.vibrate(zone === 'goldenEye' ? [0, 80, 40, 150] : 60);

          // Impact board shake
          Animated.sequence([
            Animated.timing(boardScaleAnim, {
              toValue: 1.08,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(boardScaleAnim, {
              toValue: 0.96,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.timing(boardScaleAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();

          setLandedDart({
            zone,
            zoneMultiplier,
            segmentNumber,
            segmentColor,
            hitX,
            hitY,
          });
          setGamePhase('RESULT');

          if (remainingCoins !== undefined) {
            setUserCoins(remainingCoins);
            onCoinBalanceUpdate?.(remainingCoins);
          }
          if (newEarnings !== undefined) {
            setTodayEarnings(newEarnings);
          }
          if (updatedHistory) {
            setHistory(updatedHistory);
          }

          if (wonCoins > 0) {
            setWinResult({
              won: true,
              wonCoins,
              zone,
              zoneMultiplier,
            });
            Animated.spring(winPopupAnim, {
              toValue: 1,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }).start();
            showToast(
              `🎯 ${t('BULLSEYE! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`,
              'success'
            );
          }

          // Reset for next round after 4.5s
          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(12);
            setLandedDart(null);
            setBets({
              goldenEye: 0,
              bullseye: 0,
              precision: 0,
              outer: 0,
              red: 0,
              black: 0,
            });
            setWinResult(null);
          }, 4500);
        }, 850);
      } else {
        // Spectator mode simulation
        const r = Math.random() * 85;
        const theta = Math.random() * 2 * Math.PI;
        const simHitX = Math.round(r * Math.cos(theta));
        const simHitY = Math.round(r * Math.sin(theta));
        let simZone = 'outer';
        let simMult = 1.5;
        if (r < 8) {
          simZone = 'goldenEye';
          simMult = 25;
        } else if (r < 20) {
          simZone = 'bullseye';
          simMult = 10;
        } else if (r < 55) {
          simZone = 'precision';
          simMult = 3;
        }

        setTimeout(() => {
          setLandedDart({
            zone: simZone,
            zoneMultiplier: simMult,
            hitX: simHitX,
            hitY: simHitY,
          });
          setGamePhase('RESULT');
          setHistory((prev) => [
            {
              roundId: 'BD' + Math.floor(1000 + Math.random() * 9000),
              zone: simZone,
              multiplier: simMult,
              hitX: simHitX,
              hitY: simHitY,
              timestamp: Date.now(),
            },
            ...prev.slice(0, 14),
          ]);

          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(12);
            setLandedDart(null);
          }, 4000);
        }, 850);
      }
    } catch (err) {
      console.warn('executeDartThrow error:', err.message);
      showToast(t('Error resolving round. Please try again.'), 'error');
      setGamePhase('BETTING');
      setCountdown(12);
    }
  };

  // 12-second Automatic Betting Loop
  useEffect(() => {
    if (!visible) return;

    if (gamePhase === 'BETTING') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            executeDartThrow(bets);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, gamePhase, bets]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
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
            colors={['#1E1128', '#14081E', '#0B0512']}
            style={styles.headerBar}
          >
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.75}
              onPress={() => setRulesVisible(true)}
            >
              <Text style={styles.infoBtnText}>❓</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.gameTitle}><T>Bullseye Darts</T></Text>
              <Text style={styles.gameSubtitle}>
                <T>1-Shot Target Precision • 25X Golden Eye</T>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.75}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

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
            {/* Top User Balance & Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.balancePill}>
                <ShinyCoinIcon size={20} />
                <Text style={styles.balanceText}>{userCoins.toLocaleString()}</Text>
                <TouchableOpacity
                  style={styles.rechargeBtn}
                  activeOpacity={0.75}
                  onPress={onRechargePress}
                >
                  <Text style={styles.rechargeBtnText}>+ <T>Recharge</T></Text>
                </TouchableOpacity>
              </View>

              <View style={styles.betStatsGroup}>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}><T>Total Bet</T>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <ShinyCoinIcon size={12} />
                    <Text style={styles.statChipVal}>{totalBetAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}><T>Today Won</T>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <ShinyCoinIcon size={12} />
                    <Text style={styles.statChipWon}>{todayEarnings.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Dartboard Arena Centerpiece */}
            <View style={styles.dartArenaContainer}>
              <LinearGradient
                colors={['#1E1435', '#2B1238', '#11091F']}
                style={styles.arenaGradient}
              >
                {/* Phase Status Banner */}
                <View style={styles.phaseBannerWrapper}>
                  {gamePhase === 'RESULT' && landedDart ? (
                    <View
                      style={[
                        styles.resultPill,
                        landedDart.zone === 'goldenEye'
                          ? styles.pillGold
                          : landedDart.zone === 'bullseye'
                          ? styles.pillRed
                          : landedDart.zone === 'precision'
                          ? styles.pillTeal
                          : styles.pillSlate,
                      ]}
                    >
                      <Text style={styles.phaseBannerText}>
                        {landedDart.zone === 'goldenEye'
                          ? `👑 ${t('GOLDEN EYE HIT!')} (25X)`
                          : landedDart.zone === 'bullseye'
                          ? `🎯 ${t('BULLSEYE HIT!')} (10X)`
                          : landedDart.zone === 'precision'
                          ? `⭕ ${t('PRECISION RING HIT!')} (3X)`
                          : `⚪ ${t('OUTER BOARD HIT!')} (1.5X)`}
                      </Text>
                    </View>
                  ) : gamePhase === 'FLYING' ? (
                    <View style={styles.flyingPill}>
                      <Text style={styles.phaseBannerText}>
                        🏹 <T>DART IN FLIGHT...</T> 🎯
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bettingPill}>
                      <Text style={styles.phaseBannerText}>
                        🎯 <T>CHOOSE TARGET ZONE & BET</T> ({countdown}s)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Animated Dartboard */}
                <Animated.View
                  style={[
                    styles.boardHolder,
                    { transform: [{ scale: boardScaleAnim }] },
                  ]}
                >
                  <TournamentDartboardGraphic
                    size={210}
                    hitX={landedDart?.hitX ?? null}
                    hitY={landedDart?.hitY ?? null}
                    isFlying={gamePhase === 'FLYING'}
                  />
                </Animated.View>
              </LinearGradient>
            </View>

            {/* Target Zones Betting Grid (4 Main Zones + 2 Colors) */}
            <View style={styles.zonesGrid}>
              {/* Row 1: High Multipliers (Golden Eye 25X & Bullseye 10X) */}
              <View style={styles.zonesRow}>
                {/* 1. Golden Eye (25X) */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardGoldenEye,
                    bets.goldenEye > 0 && styles.activeBetBorderGold,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('goldenEye')}
                >
                  <LinearGradient
                    colors={['#78350F', '#B45309', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.zoneGradient}
                  >
                    <Text style={styles.zoneEmoji}>👑</Text>
                    <Text style={styles.zoneTitle}><T>Golden Eye</T></Text>
                    <Text style={styles.zoneMultiplier}>25X</Text>
                    {bets.goldenEye > 0 && (
                      <View style={styles.betBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betBadgeText}>{bets.goldenEye.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. Bullseye (10X) */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardBullseye,
                    bets.bullseye > 0 && styles.activeBetBorderRed,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('bullseye')}
                >
                  <LinearGradient
                    colors={['#7F1D1D', '#DC2626', '#EF4444']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.zoneGradient}
                  >
                    <Text style={styles.zoneEmoji}>🎯</Text>
                    <Text style={styles.zoneTitle}><T>Bullseye</T></Text>
                    <Text style={styles.zoneMultiplier}>10X</Text>
                    {bets.bullseye > 0 && (
                      <View style={styles.betBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betBadgeText}>{bets.bullseye.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Row 2: Steady Multipliers (Precision 3X & Outer 1.5X) */}
              <View style={[styles.zonesRow, { marginTop: 8 }]}>
                {/* 3. Precision Ring (3X) */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardPrecision,
                    bets.precision > 0 && styles.activeBetBorderTeal,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('precision')}
                >
                  <LinearGradient
                    colors={['#064E3B', '#059669', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.zoneGradient}
                  >
                    <Text style={styles.zoneEmoji}>⭕</Text>
                    <Text style={styles.zoneTitle}><T>Precision Ring</T></Text>
                    <Text style={styles.zoneMultiplier}>3X</Text>
                    {bets.precision > 0 && (
                      <View style={styles.betBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betBadgeText}>{bets.precision.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* 4. Outer Board (1.5X) */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardOuter,
                    bets.outer > 0 && styles.activeBetBorderSlate,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('outer')}
                >
                  <LinearGradient
                    colors={['#1E293B', '#334155', '#475569']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.zoneGradient}
                  >
                    <Text style={styles.zoneEmoji}>⚪</Text>
                    <Text style={styles.zoneTitle}><T>Outer Board</T></Text>
                    <Text style={styles.zoneMultiplier}>1.5X</Text>
                    {bets.outer > 0 && (
                      <View style={styles.betBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betBadgeText}>{bets.outer.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Row 3: Color Side Bets (Red 2X & Black 2X) */}
              <View style={[styles.zonesRow, { marginTop: 8 }]}>
                {/* Red Wedge 2X */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardRedColor,
                    bets.red > 0 && styles.activeBetBorderRed,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('red')}
                >
                  <LinearGradient
                    colors={['#991B1B', '#BE123C']}
                    style={styles.colorSideGradient}
                  >
                    <Text style={styles.colorSideTitle}>🔴 <T>RED</T> (2X)</Text>
                    {bets.red > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.colorSideBetVal}>{bets.red.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Black Wedge 2X */}
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    styles.cardBlackColor,
                    bets.black > 0 && styles.activeBetBorderSlate,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handlePlaceBet('black')}
                >
                  <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    style={styles.colorSideGradient}
                  >
                    <Text style={styles.colorSideTitle}>⚫ <T>BLACK</T> (2X)</Text>
                    {bets.black > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.colorSideBetVal}>{bets.black.toLocaleString()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* History Roadmap */}
            <View style={styles.roadmapCard}>
              <View style={styles.roadmapHeader}>
                <Text style={styles.roadmapTitle}>📊 <T>Target Hit Log</T></Text>
                <Text style={styles.roadmapSub}><T>Last 15 Throws</T></Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadmapScroll}
              >
                {history.map((item, idx) => {
                  let badgeBg = '#334155';
                  let icon = '⚪';
                  if (item.zone === 'goldenEye') {
                    badgeBg = '#D97706';
                    icon = '👑';
                  } else if (item.zone === 'bullseye') {
                    badgeBg = '#DC2626';
                    icon = '🎯';
                  } else if (item.zone === 'precision') {
                    badgeBg = '#059669';
                    icon = '⭕';
                  }

                  return (
                    <View key={`hist-${idx}`} style={styles.roadmapItem}>
                      <View style={[styles.historyBadge, { backgroundColor: badgeBg }]}>
                        <Text style={styles.historyBadgeIcon}>{icon}</Text>
                      </View>
                      <Text style={styles.historyMultTag}>{item.multiplier}X</Text>
                      <Text style={styles.historyRoundTag}>
                        {item.roundId ? item.roundId.slice(-3) : `#${idx + 1}`}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Chips Selector Row + Action Buttons */}
            <View style={styles.chipsSection}>
              <View style={styles.chipsRow}>
                {CHIPS.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <TouchableOpacity
                      key={`chip-${chip}`}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.chipBtnSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedChip(chip)}
                    >
                      <ShinyCoinIcon size={13} />
                      <Text
                        style={[
                          styles.chipBtnText,
                          isSelected && styles.chipBtnTextSelected,
                        ]}
                      >
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Win Celebration Dialog */}
          {winResult && (
            <Animated.View
              style={[
                styles.winOverlay,
                {
                  opacity: winPopupAnim,
                  transform: [
                    {
                      scale: winPopupAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#78350F', '#B45309', '#1E1B4B']}
                style={styles.winDialogCard}
              >
                <Text style={styles.winEmojiHeader}>🎯 👑 ✨</Text>
                <Text style={styles.winDialogTitle}>
                  <T>BULLSEYE VICTORY!</T>
                </Text>
                <Text style={styles.winDialogSubtitle}>
                  {winResult.zone?.toUpperCase()} • {winResult.zoneMultiplier}X
                </Text>

                <View style={styles.wonAmountBadge}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ShinyCoinIcon size={24} />
                    <Text style={styles.wonAmountText}>
                      +{winResult.wonCoins.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.winCollectBtn}
                  activeOpacity={0.8}
                  onPress={() => setWinResult(null)}
                >
                  <Text style={styles.winCollectBtnText}>🎁 <T>COLLECT</T></Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Rules / Paytable Modal */}
          <Modal
            visible={rulesVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setRulesVisible(false)}
          >
            <View style={styles.rulesBackdrop}>
              <View style={styles.rulesCard}>
                <Text style={styles.rulesTitle}>🎯 <T>Bullseye Darts Rules</T> 🎯</Text>
                <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.rulesSubheading}>🎯 <T>Target Zones & Payouts</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#FDE047', fontWeight: 'bold' }}>👑 <T>Golden Eye (25X)</T></Text>: <T>Dead center gold core. Massive 25X super jackpot!</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>🎯 <T>Bullseye (10X)</T></Text>: <T>Center bullseye red ring. Pays 10X (Golden Eye also counts as Bullseye).</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#10B981', fontWeight: 'bold' }}>⭕ <T>Precision Ring (3X)</T></Text>: <T>Double & Triple wire rings band. Pays 3X.</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#94A3B8', fontWeight: 'bold' }}>⚪ <T>Outer Board (1.5X)</T></Text>: <T>Wide outer wedge single section. Pays 1.5X.</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#F87171', fontWeight: 'bold' }}>🔴/⚫ <T>Red & Black (2X)</T></Text>: <T>Bet on the landed segment color. Pays 2X.</T>
                  </Text>

                  <Text style={styles.rulesSubheading}>⏱️ <T>Round Time</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <T>12-second betting window. When timer hits 0, a golden dart flies across the screen and strikes the target in 1-shot!</T>
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeRulesBtn}
                  activeOpacity={0.8}
                  onPress={() => setRulesVisible(false)}
                >
                  <Text style={styles.closeRulesBtnText}><T>Got It!</T></Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F0918',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    fontSize: 16,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  gameSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 1,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.4)',
  },
  balanceCoinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  balanceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FEF08A',
    marginRight: 8,
  },
  rechargeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rechargeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
  },
  betStatsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statChipLabel: {
    fontSize: 9,
    color: '#A5B4FC',
  },
  statChipVal: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statChipWon: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34D399',
  },
  dartArenaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    marginBottom: 12,
  },
  arenaGradient: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  phaseBannerWrapper: {
    marginBottom: 8,
  },
  bettingPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  flyingPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  resultPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pillGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
    borderColor: '#FEF08A',
  },
  pillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: '#F87171',
  },
  pillTeal: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    borderColor: '#34D399',
  },
  pillSlate: {
    backgroundColor: 'rgba(100, 116, 139, 0.35)',
    borderColor: '#CBD5E1',
  },
  phaseBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  boardHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonesGrid: {
    marginBottom: 10,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 4,
  },
  cardGoldenEye: {
    borderColor: '#F59E0B',
  },
  cardBullseye: {
    borderColor: '#DC2626',
  },
  cardPrecision: {
    borderColor: '#059669',
  },
  cardOuter: {
    borderColor: '#475569',
  },
  cardRedColor: {
    borderColor: '#BE123C',
  },
  cardBlackColor: {
    borderColor: '#334155',
  },
  activeBetBorderGold: {
    borderColor: '#FEF08A',
    borderWidth: 2.5,
  },
  activeBetBorderRed: {
    borderColor: '#F87171',
    borderWidth: 2.5,
  },
  activeBetBorderTeal: {
    borderColor: '#6EE7B7',
    borderWidth: 2.5,
  },
  activeBetBorderSlate: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
  },
  zoneGradient: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  zoneEmoji: {
    fontSize: 18,
  },
  zoneTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  zoneMultiplier: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FEF08A',
    marginTop: 1,
  },
  betBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  betBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FEF08A',
  },
  colorSideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  colorSideTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  colorSideBetVal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
  },
  roadmapCard: {
    backgroundColor: '#170E24',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 10,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roadmapSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  roadmapScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  roadmapItem: {
    alignItems: 'center',
  },
  historyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  historyBadgeIcon: {
    fontSize: 12,
  },
  historyMultTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FEF08A',
    marginTop: 2,
  },
  historyRoundTag: {
    fontSize: 8,
    color: '#94A3B8',
  },
  chipsSection: {
    backgroundColor: '#170E24',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 8,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: '#241438',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipBtnSelected: {
    backgroundColor: '#B45309',
    borderColor: '#FEF08A',
    borderWidth: 1.5,
  },
  chipBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  chipBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F87171',
  },
  rebetBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  rebetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#60A5FA',
  },
  winOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  winDialogCard: {
    width: '90%',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE047',
    elevation: 10,
  },
  winEmojiHeader: {
    fontSize: 32,
    marginBottom: 6,
  },
  winDialogTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 1,
  },
  winDialogSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  wonAmountBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.6)',
  },
  wonAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FDE047',
  },
  winCollectBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 4,
  },
  winCollectBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1C1028',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  rulesTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FEF08A',
    textAlign: 'center',
    marginBottom: 12,
  },
  rulesScroll: {
    marginBottom: 14,
  },
  rulesSubheading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FDE047',
    marginTop: 8,
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 6,
  },
  closeRulesBtn: {
    backgroundColor: '#B45309',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});


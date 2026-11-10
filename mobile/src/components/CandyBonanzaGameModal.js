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
  CandySymbolRenderer,
} from './CandyBonanzaIcons';
import { ShinyCoinIcon } from './FoodIcons';

const CHIPS = [50, 100, 500, 1000, 5000, 10000, 25000];
const ALL_SYMBOLS = ['jelly_bean', 'gummy_bear', 'grape_gummy', 'donut', 'lollipop', 'bomb'];

export default function CandyBonanzaGameModal({
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
  const [isSpinning, setIsSpinning] = useState(false);

  // Active 3 Reels visible
  const [reels, setReels] = useState(['lollipop', 'donut', 'grape_gummy']);
  const [winResult, setWinResult] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Auto-Spin State
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const autoSpinTimerRef = useRef(null);

  // Reel Animations (translates vertical offset during spin)
  const reel1Anim = useRef(new Animated.Value(0)).current;
  const reel2Anim = useRef(new Animated.Value(0)).current;
  const reel3Anim = useRef(new Animated.Value(0)).current;

  // Spin Button Glow pulse
  const spinPulseAnim = useRef(new Animated.Value(1)).current;

  // Celebration Animation
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/candy-bonanza/state');
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
      console.error('fetchGameState Candy Bonanza error:', err);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    isMountedRef.current = true;
    if (visible) {
      fetchGameState();
    }
    return () => {
      isMountedRef.current = false;
      if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current);
    };
  }, [visible, fetchGameState]);

  // Spin pulse animation loop
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(spinPulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(spinPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [spinPulseAnim]);

  // Trigger Win Celebration Dialog
  const triggerWinCelebration = useCallback((amount, multiplier, winType) => {
    setCelebrationVisible(true);
    celebrationScale.setValue(0.2);
    celebrationOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const titleMsg =
      winType === 'jackpot'
        ? t('30X SWEET BOMB JACKPOT!')
        : multiplier >= 8
        ? t('MEGA CANDY WIN!')
        : t('SWEET WIN!');

    showToast(`${titleMsg} +${amount.toLocaleString()} 🪙`, 'success');
  }, [celebrationScale, celebrationOpacity, showToast, t]);

  // Main Spin Handler
  const handleSpin = useCallback(async () => {
    if (isSpinningRef.current) return;
    if (betAmount > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      setAutoSpinsLeft(0);
      return;
    }

    setIsSpinning(true);
    setWinResult(null);
    setCelebrationVisible(false);
    Vibration.vibrate(30);

    // Optimistically deduct bet coins locally
    setUserCoins((prev) => Math.max(0, prev - betAmount));

    // Reset reel animation values
    reel1Anim.setValue(0);
    reel2Anim.setValue(0);
    reel3Anim.setValue(0);

    // Start reel spin animations (staggered stopping)
    Animated.parallel([
      Animated.timing(reel1Anim, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(reel2Anim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(reel3Anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const res = await api.post('/games/candy-bonanza/spin', { betAmount });
      if (res.data?.success) {
        const data = res.data;

        // Wait for reel 3 animation to complete (~1.4s) before revealing symbols
        setTimeout(() => {
          if (!isMountedRef.current) return;

          setReels(data.reels);
          setIsSpinning(false);
          setWinResult(data);

          // Update final user balance and stats
          if (data.remainingCoins !== undefined) {
            setUserCoins(data.remainingCoins);
            if (onCoinBalanceUpdate) onCoinBalanceUpdate(data.remainingCoins);
          }
          if (data.todayEarnings !== undefined) {
            setTodayEarnings(data.todayEarnings);
          }
          if (data.history) setHistory(data.history);
          if (data.recentWinners) setRecentWinners(data.recentWinners);

          // Check win
          if (data.wonCoins > 0) {
            Vibration.vibrate([0, 60, 40, 80]);
            triggerWinCelebration(data.wonCoins, data.multiplier, data.winType);
          }

          // Handle Auto-spin sequence
          if (autoSpinsLeft > 1) {
            setAutoSpinsLeft((prev) => prev - 1);
            autoSpinTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) handleSpin();
            }, 1800);
          } else {
            setAutoSpinsLeft(0);
          }
        }, 1450);
      }
    } catch (err) {
      console.error('spinCandyBonanza API error:', err);
      setIsSpinning(false);
      setAutoSpinsLeft(0);
      showToast(t(err.response?.data?.message || 'Failed to spin candy reels'), 'error');
      // Re-fetch correct state in case of error
      fetchGameState();
    }
  }, [betAmount, userCoins, showToast, t, onCoinBalanceUpdate, triggerWinCelebration, autoSpinsLeft, fetchGameState, reel1Anim, reel2Anim, reel3Anim]);

  // Quick Bet Multiplier (1X, 2X, 5X, 10X of base 100)
  const handleQuickMultiplier = (mult) => {
    if (isSpinning) return;
    const newBet = 100 * mult;
    setBetAmount(newBet);
    Vibration.vibrate(15);
  };

  // Toggle Auto-spin
  const handleToggleAutoSpin = (count) => {
    if (isSpinning) return;
    if (autoSpinsLeft > 0) {
      setAutoSpinsLeft(0);
      if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current);
      showToast(t('Auto-spin stopped'), 'info');
    } else {
      setAutoSpinsLeft(count);
      showToast(`${t('Auto-spin started')}: ${count} ${t('spins')}`, 'success');
      handleSpin();
    }
  };

  // Interpolated spin jitter transforms
  const reel1TranslateY = reel1Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -45, 45, -30, 20, 0],
  });
  const reel2TranslateY = reel2Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, 50, -40, 30, -15, 0],
  });
  const reel3TranslateY = reel3Anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -55, 45, -35, 20, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.container,
            { paddingTop: Math.max(16, insets.top), paddingBottom: Math.max(16, insets.bottom) },
          ]}
        >
          {/* ══ TOP BAR: BACK, TITLE, RULES ══ */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.circleButton}
              activeOpacity={0.75}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.titleBadgeContainer}>
              <Text style={styles.titleBadgeMain}><T>Candy Bonanza</T></Text>
              <Text style={styles.titleBadgeSub}><T>Sweet Gems & 30X Sugar Bomb</T></Text>
            </View>

            <TouchableOpacity
              style={styles.ruleBadgeBtn}
              activeOpacity={0.75}
              onPress={() => setRulesVisible(true)}
            >
              <Text style={styles.ruleBadgeText}>❓ <T>Rules</T></Text>
            </TouchableOpacity>
          </View>

          {/* ══ BALANCE BAR ══ */}
          <View style={styles.balanceBar}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}><T>My Coins</T></Text>
              <View style={styles.coinValueRow}>
                <ShinyCoinIcon size={20} />
                <Text style={styles.coinValueText}>{userCoins.toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rechargeBtnSmall}
              activeOpacity={0.8}
              onPress={onRechargePress}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={styles.rechargeBtnGrad}
              >
                <Text style={styles.rechargeBtnText}>+ <T>Recharge</T></Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.balanceItemRight}>
              <Text style={styles.balanceLabel}><T>Today Won</T></Text>
              <Text style={styles.todayWonValue}>+{todayEarnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* ══ MAIN SCROLLABLE CONTENT ══ */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ 3-REEL CANDY SLOTS MACHINE ══ */}
            <View style={styles.slotMachineOuter}>
              <LinearGradient
                colors={['#831843', '#500724', '#2A0818', '#180620']}
                style={styles.slotMachineGrad}
              >
                {/* Top Candy Palace Marquee */}
                <View style={styles.marqueeRow}>
                  <Text style={styles.marqueeStar}>✨</Text>
                  <Text style={styles.marqueeTitle}><T>SUGAR REELS</T></Text>
                  <Text style={styles.marqueeJackpotBadge}>30X JACKPOT</Text>
                  <Text style={styles.marqueeStar}>✨</Text>
                </View>

                {/* Reels Frame Window */}
                <View style={styles.reelsWindowFrame}>
                  {/* Left & Right Payline Guide Indicators */}
                  <View style={styles.paylineIndicatorLeft}>
                    <Text style={styles.paylineArrow}>▶</Text>
                  </View>
                  <View style={styles.paylineIndicatorRight}>
                    <Text style={styles.paylineArrow}>◀</Text>
                  </View>

                  {/* Reel 1 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#2D0A3D', '#1A0426', '#2D0A3D']}
                      style={styles.reelGlassInner}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolContainer,
                          { transform: [{ translateY: reel1TranslateY }] },
                        ]}
                      >
                        <CandySymbolRenderer id={reels[0]} size={58} />
                      </Animated.View>
                    </LinearGradient>
                  </View>

                  {/* Reel Divider */}
                  <View style={styles.reelDivider} />

                  {/* Reel 2 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#2D0A3D', '#1A0426', '#2D0A3D']}
                      style={styles.reelGlassInner}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolContainer,
                          { transform: [{ translateY: reel2TranslateY }] },
                        ]}
                      >
                        <CandySymbolRenderer id={reels[1]} size={58} />
                      </Animated.View>
                    </LinearGradient>
                  </View>

                  {/* Reel Divider */}
                  <View style={styles.reelDivider} />

                  {/* Reel 3 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#2D0A3D', '#1A0426', '#2D0A3D']}
                      style={styles.reelGlassInner}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolContainer,
                          { transform: [{ translateY: reel3TranslateY }] },
                        ]}
                      >
                        <CandySymbolRenderer id={reels[2]} size={58} />
                      </Animated.View>
                    </LinearGradient>
                  </View>
                </View>

                {/* Bottom Machine Base Trim */}
                <View style={styles.slotBaseTrim}>
                  <Text style={styles.slotBaseTrimText}>
                    🍭 <T>MATCH 3 TO WIN UP TO 30X MULTIPLIER</T>
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* ══ WIN RESULT DISPLAY BANNER ══ */}
            {winResult && (
              <View
                style={[
                  styles.winResultBanner,
                  winResult.wonCoins > 0 ? styles.bannerWon : styles.bannerLost,
                ]}
              >
                <Text style={styles.winResultEmoji}>
                  {winResult.winType === 'jackpot'
                    ? '💣'
                    : winResult.wonCoins > 0
                    ? '🍭'
                    : '🍂'}
                </Text>
                <View style={styles.winResultTextContainer}>
                  <Text style={styles.winResultTitle}>
                    {winResult.winType === 'jackpot'
                      ? '30X GRAND SUGAR BOMB!'
                      : winResult.winType === 'match3'
                      ? `3 OF A KIND! ${winResult.multiplier}X WIN`
                      : winResult.winType === 'match2'
                      ? '2 CANDY MATCH (1.2X)'
                      : 'NO MATCH • TRY AGAIN'}
                  </Text>
                  <Text style={styles.winResultSub}>
                    {winResult.wonCoins > 0
                      ? `+${winResult.wonCoins.toLocaleString()} Coins`
                      : 'Sweet fortune awaits your next spin!'}
                  </Text>
                </View>
              </View>
            )}

            {/* ══ BET CONTROLS ══ */}
            <View style={styles.betControlsCard}>
              <View style={styles.betControlsHeader}>
                <Text style={styles.betControlLabel}><T>Current Bet</T>:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ShinyCoinIcon size={16} />
                  <Text style={styles.betControlValue}>{betAmount.toLocaleString()}</Text>
                </View>
              </View>

              {/* Quick Multiplier Buttons */}
              <View style={styles.quickMultRow}>
                <TouchableOpacity
                  style={[styles.multBtn, betAmount === 100 && styles.multBtnActive]}
                  onPress={() => handleQuickMultiplier(1)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.multBtnText}>100</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.multBtn, betAmount === 500 && styles.multBtnActive]}
                  onPress={() => handleQuickMultiplier(5)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.multBtnText}>500</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.multBtn, betAmount === 1000 && styles.multBtnActive]}
                  onPress={() => handleQuickMultiplier(10)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.multBtnText}>1,000</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.multBtn, betAmount === 5000 && styles.multBtnActive]}
                  onPress={() => handleQuickMultiplier(50)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.multBtnText}>5,000</Text>
                </TouchableOpacity>
              </View>

              {/* Chip Selector Row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {CHIPS.map((chipVal) => {
                  const isSelected = betAmount === chipVal;
                  return (
                    <TouchableOpacity
                      key={`cb_chip_${chipVal}`}
                      activeOpacity={0.75}
                      onPress={() => setBetAmount(chipVal)}
                      style={[styles.chipPill, isSelected && styles.chipPillSelected]}
                    >
                      <LinearGradient
                        colors={
                          isSelected
                            ? ['#EC4899', '#BE185D']
                            : ['#2D0A3D', '#1A0426']
                        }
                        style={styles.chipPillGrad}
                      >
                        <ShinyCoinIcon size={14} />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {chipVal >= 1000 ? `${chipVal / 1000}k` : chipVal}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ══ BIG PULSATING SPIN & AUTO-SPIN BUTTONS ══ */}
            <View style={styles.spinActionRow}>
              {/* Auto-Spin Button */}
              <TouchableOpacity
                style={[
                  styles.autoSpinBtn,
                  autoSpinsLeft > 0 && styles.autoSpinBtnActive,
                ]}
                activeOpacity={0.75}
                onPress={() => handleToggleAutoSpin(autoSpinsLeft > 0 ? 0 : 10)}
              >
                <Text style={styles.autoSpinEmoji}>🔁</Text>
                <Text style={styles.autoSpinText}>
                  {autoSpinsLeft > 0 ? `${autoSpinsLeft} <T>Left</T>` : <T>Auto 10</T>}
                </Text>
              </TouchableOpacity>

              {/* Big Vibrant SPIN Button */}
              <Animated.View
                style={[
                  styles.spinBtnWrapper,
                  { transform: [{ scale: isSpinning ? 0.96 : spinPulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.spinTouchable}
                  activeOpacity={0.8}
                  disabled={isSpinning}
                  onPress={handleSpin}
                >
                  <LinearGradient
                    colors={
                      isSpinning
                        ? ['#475569', '#334155']
                        : ['#EC4899', '#D946EF', '#8B5CF6']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.spinBtnGrad}
                  >
                    <Text style={styles.spinBtnText}>
                      {isSpinning ? <T>SPINNING...</T> : <T>SPIN!</T>}
                    </Text>
                    <Text style={styles.spinBtnSubText}>
                      {betAmount.toLocaleString()} 🪙
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* ══ PAYTABLE PREVIEW CHIPS ══ */}
            <View style={styles.paytablePreviewContainer}>
              <Text style={styles.sectionHeaderTitle}><T>Paytable & Multipliers</T></Text>
              <View style={styles.paytableGrid}>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>💣</Text>
                  <Text style={styles.paytableItemName}><T>Bomb</T></Text>
                  <Text style={styles.paytableItemMultGold}>30X</Text>
                </View>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>🍭</Text>
                  <Text style={styles.paytableItemName}><T>Lollipop</T></Text>
                  <Text style={styles.paytableItemMult}>15X</Text>
                </View>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>🍩</Text>
                  <Text style={styles.paytableItemName}><T>Donut</T></Text>
                  <Text style={styles.paytableItemMult}>8X</Text>
                </View>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>🍇</Text>
                  <Text style={styles.paytableItemName}><T>Grape</T></Text>
                  <Text style={styles.paytableItemMult}>5X</Text>
                </View>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>🐻</Text>
                  <Text style={styles.paytableItemName}><T>Bear</T></Text>
                  <Text style={styles.paytableItemMult}>3X</Text>
                </View>
                <View style={styles.paytableItem}>
                  <Text style={styles.paytableItemEmoji}>🍬</Text>
                  <Text style={styles.paytableItemName}><T>Jelly</T></Text>
                  <Text style={styles.paytableItemMult}>2X</Text>
                </View>
              </View>
            </View>

            {/* ══ RECENT SPINS HISTORY ROADMAP ══ */}
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>📜 <T>Recent Spins</T></Text>
                <Text style={styles.historySubtitle}><T>Last 15 Rounds</T></Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyScroll}
              >
                {history.map((item, idx) => (
                  <View key={`cb_hist_${item.roundId || idx}`} style={styles.historyPill}>
                    <View
                      style={[
                        styles.historyStatusDot,
                        item.won ? styles.dotWon : styles.dotLost,
                      ]}
                    />
                    <Text style={styles.historyRoundText}>{item.roundId || `R${idx + 1}`}</Text>
                    <Text style={styles.historyMultBadge}>
                      {item.multiplier > 0 ? `${item.multiplier}X` : '0X'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ══ TOP CANDY MASTERS LEADERBOARD ══ */}
            {recentWinners.length > 0 && (
              <View style={styles.winnersContainer}>
                <Text style={styles.winnersTitle}>🏆 <T>Top Candy Masters</T></Text>
                {recentWinners.slice(0, 4).map((w, i) => (
                  <View key={`cb_w_${i}`} style={styles.winnerRow}>
                    <Text style={styles.winnerName}>{w.name}</Text>
                    <Text style={styles.winnerPrizeBadge}>{w.multiplier}X Win</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ShinyCoinIcon size={12} />
                      <Text style={styles.winnerAmount}>+{w.amount?.toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ══ WIN CELEBRATION MODAL ══ */}
          {celebrationVisible && winResult && (
            <Animated.View
              style={[
                styles.celebrationOverlay,
                {
                  opacity: celebrationOpacity,
                  transform: [{ scale: celebrationScale }],
                },
              ]}
            >
              <LinearGradient
                colors={['#831843', '#500724', '#180620']}
                style={styles.celebrationCard}
              >
                <Text style={styles.celebrationTitleEmoji}>
                  {winResult.winType === 'jackpot' ? '💣💥🍭' : '🍭✨🍩'}
                </Text>
                <Text style={styles.celebrationHeading}>
                  {winResult.winType === 'jackpot' ? (
                    <T>30X SWEET BOMB JACKPOT!</T>
                  ) : (
                    <T>CANDY BONANZA WINNER!</T>
                  )}
                </Text>
                <Text style={styles.celebrationAmount}>
                  +{winResult.wonCoins?.toLocaleString()} <T>Coins</T>
                </Text>
                <TouchableOpacity
                  style={styles.celebrationCollectBtn}
                  activeOpacity={0.8}
                  onPress={() => setCelebrationVisible(false)}
                >
                  <LinearGradient
                    colors={['#EC4899', '#DB2777']}
                    style={styles.collectGrad}
                  >
                    <Text style={styles.collectBtnText}>✨ <T>Awesome!</T></Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ══ RULES DIALOG ══ */}
          <Modal
            visible={rulesVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setRulesVisible(false)}
          >
            <View style={styles.rulesModalOverlay}>
              <View style={styles.rulesCard}>
                <LinearGradient
                  colors={['#2D0A3D', '#1A0426']}
                  style={styles.rulesCardGrad}
                >
                  <View style={styles.rulesHeader}>
                    <Text style={styles.rulesTitleEmoji}>🍭</Text>
                    <Text style={styles.rulesTitle}><T>Candy Bonanza Rules</T></Text>
                  </View>

                  <ScrollView style={styles.rulesScroll}>
                    <Text style={styles.ruleSectionHeading}><T>Symbols & Payouts (3 Matching)</T></Text>
                    
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>💣</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Golden Sugar Bomb (30X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Super Grand Jackpot! Pays 30X your bet.</T></Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🍭</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Swirl Lollipop (15X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Carnival rainbow lollipop. Pays 15X your bet.</T></Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🍩</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Donut Sprinkles (8X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Glazed rainbow donut. Pays 8X your bet.</T></Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🍇</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Grape Gem (5X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Purple faceted sweet gem. Pays 5X your bet.</T></Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🐻</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Gummy Bear (3X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Orange sweet bear. Pays 3X your bet.</T></Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🍬</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Jelly Bean (2X)</T></Text>
                        <Text style={styles.ruleItemDesc}><T>Classic pink jelly bean. Pays 2X your bet.</T></Text>
                      </View>
                    </View>

                    <Text style={[styles.ruleSectionHeading, { marginTop: 12 }]}>
                      <T>Consolation 2-Match Return</T>
                    </Text>
                    <Text style={styles.ruleItemDesc}>
                      <T>Any 2 matching symbols on the reels pay 1.2X consolation return!</T>
                    </Text>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.rulesCloseBtn}
                    activeOpacity={0.8}
                    onPress={() => setRulesVisible(false)}
                  >
                    <LinearGradient
                      colors={['#EC4899', '#BE185D']}
                      style={styles.rulesCloseGrad}
                    >
                      <Text style={styles.rulesCloseBtnText}><T>Got It!</T></Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#120318',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleBadgeContainer: {
    alignItems: 'center',
  },
  titleBadgeMain: {
    color: '#F472B6',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleBadgeSub: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '600',
  },
  ruleBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  ruleBadgeText: {
    color: '#F472B6',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#260633',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '600',
  },
  coinValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coinEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  coinValueText: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '800',
  },
  rechargeBtnSmall: {
    marginHorizontal: 8,
  },
  rechargeBtnGrad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rechargeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  balanceItemRight: {
    alignItems: 'flex-end',
  },
  todayWonValue: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  slotMachineOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#EC4899',
    marginVertical: 8,
  },
  slotMachineGrad: {
    paddingTop: 12,
    alignItems: 'center',
  },
  marqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  marqueeStar: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  marqueeTitle: {
    color: '#FDE047',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  marqueeJackpotBadge: {
    backgroundColor: '#BE185D',
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  reelsWindowFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    backgroundColor: '#0F0214',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F472B6',
    position: 'relative',
  },
  paylineIndicatorLeft: {
    position: 'absolute',
    left: -8,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 5,
  },
  paylineIndicatorRight: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 5,
  },
  paylineArrow: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '900',
  },
  reelColumn: {
    flex: 1,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  reelGlassInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelSymbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelDivider: {
    width: 2,
    height: 70,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    marginHorizontal: 4,
  },
  slotBaseTrim: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(236, 72, 153, 0.3)',
  },
  slotBaseTrimText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  winResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    marginVertical: 6,
  },
  bannerWon: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  bannerLost: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  winResultEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  winResultTextContainer: {
    flex: 1,
  },
  winResultTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  winResultSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  betControlsCard: {
    backgroundColor: '#260633',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
  },
  betControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  betControlLabel: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  betControlValue: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: '900',
  },
  quickMultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  multBtn: {
    flex: 1,
    backgroundColor: '#180620',
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  multBtnActive: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
  },
  multBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chipsScroll: {
    paddingVertical: 2,
  },
  chipPill: {
    marginRight: 8,
    borderRadius: 18,
    overflow: 'hidden',
  },
  chipPillSelected: {
    borderWidth: 1.5,
    borderColor: '#F472B6',
  },
  chipPillGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  chipText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  spinActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  autoSpinBtn: {
    backgroundColor: '#260633',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.35)',
    minWidth: 90,
  },
  autoSpinBtnActive: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
  },
  autoSpinEmoji: {
    fontSize: 18,
  },
  autoSpinText: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  spinBtnWrapper: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 22,
    overflow: 'hidden',
  },
  spinTouchable: {
    width: '100%',
  },
  spinBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  spinBtnSubText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  paytablePreviewContainer: {
    backgroundColor: '#260633',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  sectionHeaderTitle: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  paytableGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paytableItem: {
    alignItems: 'center',
    flex: 1,
  },
  paytableItemEmoji: {
    fontSize: 20,
  },
  paytableItemName: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  paytableItemMult: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  paytableItemMultGold: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  historyContainer: {
    backgroundColor: '#260633',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  historySubtitle: {
    color: '#C084FC',
    fontSize: 10,
  },
  historyScroll: {
    paddingVertical: 2,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#180620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  dotWon: {
    backgroundColor: '#4ADE80',
  },
  dotLost: {
    backgroundColor: '#64748B',
  },
  historyRoundText: {
    color: '#C084FC',
    fontSize: 10,
    marginRight: 4,
  },
  historyMultBadge: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  winnersContainer: {
    backgroundColor: '#260633',
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
  },
  winnersTitle: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  winnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  winnerName: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  winnerPrizeBadge: {
    color: '#F472B6',
    fontSize: 10,
    fontWeight: '700',
  },
  winnerAmount: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '800',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '35%',
    left: 20,
    right: 20,
    zIndex: 99,
    alignItems: 'center',
  },
  celebrationCard: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  celebrationTitleEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  celebrationHeading: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  celebrationAmount: {
    color: '#FEF08A',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 12,
  },
  celebrationCollectBtn: {
    width: '80%',
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  collectGrad: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  collectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  rulesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  rulesCardGrad: {
    padding: 20,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rulesTitleEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  rulesTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  rulesScroll: {
    maxHeight: 320,
  },
  ruleSectionHeading: {
    color: '#F472B6',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ruleEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleItemTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ruleItemDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  rulesCloseBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  rulesCloseGrad: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  rulesCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});


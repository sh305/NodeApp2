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
  Platform,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useToast } from './Toast';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { ShinyCoinIcon } from './FoodIcons';
import {
  CherryIcon,
  OrangeIcon,
  LemonIcon,
  GrapesIcon,
  WatermelonIcon,
  BellIcon,
  StarIcon,
  GoldenBarIcon,
  FruitCocktailIcon,
} from './FruitPartyIcons';

// 8 Arcade Fruit Items
export const FRUIT_ITEMS = [
  { id: 'cherry', name: 'Cherry', multiplier: 2, color: '#EF4444', icon: CherryIcon, bgGrad: ['#7F1D1D', '#991B1B', '#B91C1C'] },
  { id: 'orange', name: 'Orange', multiplier: 3, color: '#F97316', icon: OrangeIcon, bgGrad: ['#7C2D12', '#9A3412', '#C2410C'] },
  { id: 'lemon', name: 'Lemon', multiplier: 5, color: '#EAB308', icon: LemonIcon, bgGrad: ['#713F12', '#854D0E', '#A16207'] },
  { id: 'grapes', name: 'Grapes', multiplier: 10, color: '#A855F7', icon: GrapesIcon, bgGrad: ['#581C87', '#6B21A8', '#7E22CE'] },
  { id: 'watermelon', name: 'Watermelon', multiplier: 15, color: '#10B981', icon: WatermelonIcon, bgGrad: ['#064E3B', '#047857', '#059669'] },
  { id: 'bell', name: 'Bell', multiplier: 25, color: '#F59E0B', icon: BellIcon, bgGrad: ['#78350F', '#B45309', '#D97706'] },
  { id: 'star', name: 'Star', multiplier: 50, color: '#38BDF8', icon: StarIcon, bgGrad: ['#0C4A6E', '#0369A1', '#0284C7'] },
  { id: 'bar', name: 'BAR', multiplier: 100, color: '#EC4899', icon: GoldenBarIcon, bgGrad: ['#831843', '#9D174D', '#BE185D'] },
];

const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

export default function FruitPartyGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Core Game State
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'SPINNING' | 'RESULT'
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { [fruitId]: amount }
  const betsRef = useRef(bets);
  betsRef.current = bets;

  const [lastBets, setLastBets] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [partyFeverActive, setPartyFeverActive] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentWinners, setRecentWinners] = useState(['cherry', 'watermelon', 'orange', 'grapes', 'bar', 'lemon', 'bell', 'cherry']);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Result dialog state
  const [winResult, setWinResult] = useState(null);

  // Animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feverGlowAnim = useRef(new Animated.Value(0)).current;
  const marqueeRotation = useRef(new Animated.Value(0)).current;

  // Sync prop coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/fruit-party/state');
      if (res.data?.success) {
        if (res.data.userCoins !== undefined) {
          setUserCoins(res.data.userCoins);
          onCoinBalanceUpdate?.(res.data.userCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
        if (res.data.recentWinners?.length) {
          setRecentWinners(res.data.recentWinners);
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
      setCountdown(15);
      setGamePhase('BETTING');
      setIsSpinning(false);
      setPartyFeverActive(1);
    }
  }, [visible, fetchGameState]);

  // Countdown Pulse Animation
  useEffect(() => {
    if (countdown <= 5 && countdown > 0 && gamePhase === 'BETTING') {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      if (soundEnabled && Platform.OS === 'android') {
        Vibration.vibrate(25);
      }
    }
  }, [countdown, gamePhase, pulseAnim, soundEnabled]);

  // Neon marquee continuous loop
  useEffect(() => {
    const marqueeLoop = Animated.loop(
      Animated.timing(marqueeRotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    marqueeLoop.start();
    return () => marqueeLoop.stop();
  }, [marqueeRotation]);

  // Total bet calculation & real-time display coins
  const totalBetAmount = Object.values(bets).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const displayCoins = Math.max(0, userCoins - totalBetAmount);

  // Place bet on a fruit
  const handlePlaceBet = (fruitId) => {
    if (gamePhase !== 'BETTING' || isSpinning) return;

    if (totalBetAmount + selectedChip > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    setBets((prev) => ({
      ...prev,
      [fruitId]: (prev[fruitId] || 0) + selectedChip,
    }));

    if (soundEnabled && Platform.OS === 'android') {
      Vibration.vibrate(15);
    }
  };

  // Clear current round bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING' || isSpinning || totalBetAmount === 0) return;
    setBets({});
    showToast(t('Bets cleared!'), 'info');
  };

  // Rebet previous bets
  const handleRebet = () => {
    if (gamePhase !== 'BETTING' || isSpinning || !lastBets) return;

    const rebetTotal = Object.values(lastBets).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (rebetTotal === 0) return;

    if (totalBetAmount + rebetTotal > userCoins) {
      showToast(t('Insufficient coins for Rebet'), 'error');
      return;
    }

    setBets({ ...lastBets });
    showToast(t('Previous bets placed!'), 'success');
  };

  // Max bet distributed across creatures
  const handleMaxBet = () => {
    if (gamePhase !== 'BETTING' || isSpinning) return;
    const affordable = [...CHIP_VALUES].reverse().find((c) => userCoins >= c) || CHIP_VALUES[0];
    setSelectedChip(affordable);
    showToast(`${t('Max Chip Set')}: ${affordable.toLocaleString()} 🪙`, 'info');
  };

  // Arcade LED chase deceleration animation
  const runArcadeSpinAnimation = (winnerIndex, onComplete) => {
    let currentIdx = 0;
    let stepCount = 0;
    const totalSteps = 24 + winnerIndex;
    let currentDelay = 45;

    const step = () => {
      currentIdx = (currentIdx + 1) % FRUIT_ITEMS.length;
      setActiveHighlightIndex(currentIdx);
      stepCount++;

      if (soundEnabled && Platform.OS === 'android' && stepCount % 2 === 0) {
        Vibration.vibrate(10);
      }

      if (stepCount >= totalSteps) {
        setActiveHighlightIndex(winnerIndex);
        onComplete();
      } else {
        if (stepCount > totalSteps - 8) {
          currentDelay += 35;
        } else if (stepCount > totalSteps - 14) {
          currentDelay += 15;
        }
        setTimeout(step, currentDelay);
      }
    };

    step();
  };

  // Execute Spin Round automatically when 15s timer hits 0
  const handleStartSpin = useCallback(async () => {
    if (isSpinning || gamePhase !== 'BETTING') return;

    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((sum, v) => sum + (Number(v) || 0), 0);

    if (currentTotal === 0) {
      // Auto-simulate round if no bets placed
      setGamePhase('SPINNING');
      setIsSpinning(true);
      const randomWinnerIndex = Math.floor(Math.random() * FRUIT_ITEMS.length);
      const winnerFruit = FRUIT_ITEMS[randomWinnerIndex];

      runArcadeSpinAnimation(randomWinnerIndex, () => {
        setRecentWinners((prev) => [winnerFruit.id, ...prev.slice(0, 9)]);
        setGamePhase('RESULT');

        setTimeout(() => {
          setCountdown(15);
          setIsSpinning(false);
          setGamePhase('BETTING');
          setPartyFeverActive(1);
        }, 3000);
      });
      return;
    }

    try {
      setIsSpinning(true);
      setGamePhase('SPINNING');
      setLastBets({ ...currentBets });

      const res = await api.post('/games/fruit-party/play', { bets: currentBets });
      if (!res.data?.success) {
        showToast(t(res.data?.message || 'Failed to start fruit spin'), 'error');
        setIsSpinning(false);
        setGamePhase('BETTING');
        return;
      }

      const {
        winningFruit,
        partyFever,
        feverMultiplier,
        effectiveMultiplier,
        wonCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        recentWinners: newHistory,
      } = res.data;

      // Update local balance
      setUserCoins(remainingCoins);
      onCoinBalanceUpdate?.(remainingCoins);
      if (newTodayEarnings !== undefined) {
        setTodayEarnings(newTodayEarnings);
      }

      const targetIndex = FRUIT_ITEMS.findIndex((f) => f.id === winningFruit.id);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      runArcadeSpinAnimation(safeIndex, () => {
        setGamePhase('RESULT');

        if (partyFever && feverMultiplier > 1) {
          setPartyFeverActive(feverMultiplier);
          Animated.sequence([
            Animated.timing(feverGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(feverGlowAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
            Animated.timing(feverGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
        }

        if (newHistory?.length) {
          setRecentWinners(newHistory);
        } else {
          setRecentWinners((prev) => [winningFruit.id, ...prev.slice(0, 9)]);
        }

        const userWon = wonCoins > 0;
        setWinResult({
          won: userWon,
          fruit: FRUIT_ITEMS[safeIndex],
          effectiveMultiplier,
          wonCoins,
          spentCoins: currentTotal,
          partyFever,
          feverMultiplier,
        });

        if (userWon) {
          showToast(`🎉 ${t('Congratulations! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`, 'success');
          if (soundEnabled && Platform.OS === 'android') {
            Vibration.vibrate([0, 100, 50, 200]);
          }
        }

        setTimeout(() => {
          setCountdown(15);
          setIsSpinning(false);
          setGamePhase('BETTING');
          setBets({});
          setWinResult(null);
          setPartyFeverActive(1);
        }, userWon ? 3800 : 2500);
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Round execution error';
      showToast(t(msg), 'error');
      setIsSpinning(false);
      setGamePhase('BETTING');
    }
  }, [isSpinning, gamePhase, t, showToast, onCoinBalanceUpdate, soundEnabled, feverGlowAnim]);

  // 15-Second Master Countdown Loop
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING' && !isSpinning) {
            handleStartSpin();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, gamePhase, isSpinning, handleStartSpin]);

  if (!visible) return null;

  const currentHighlightFruit = FRUIT_ITEMS[activeHighlightIndex] || FRUIT_ITEMS[0];
  const HighlightIconComp = currentHighlightFruit.icon;

  const marqueeSpin = marqueeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.container, { paddingTop: Math.max(12, insets.top) }]}>
          {/* ══ HEADER BAR ══ */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <FruitCocktailIcon size={34} />
              </View>
              <View style={styles.headerTextGroup}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.gameTitle}><T>Fruit Party</T></Text>
                  <View style={styles.feverTag}>
                    <Text style={styles.feverTagText}>100X 👑</Text>
                  </View>
                </View>
                <Text style={styles.gameSubtitle}>
                  <T>Lucky Fruit Wheel • Arcade Fever</T>
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Rules Button */}
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.iconBtnText}>❓</Text>
              </TouchableOpacity>

              {/* Sound Toggle */}
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.75}
                onPress={() => setSoundEnabled(!soundEnabled)}
              >
                <Text style={styles.iconBtnText}>{soundEnabled ? '🔊' : '🔇'}</Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.75}
                onPress={onClose}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ BALANCE & STATS BAR ══ */}
          <View style={styles.statsBar}>
            <View style={styles.coinBalanceBox}>
              <ShinyCoinIcon size={20} />
              <Text style={styles.coinBalanceText}>{displayCoins.toLocaleString()}</Text>
              <TouchableOpacity
                style={styles.rechargeBtn}
                activeOpacity={0.8}
                onPress={onRechargePress}
              >
                <Text style={styles.rechargeBtnText}>+ <T>Recharge</T></Text>
              </TouchableOpacity>
            </View>

            {totalBetAmount > 0 && (
              <View style={styles.totalBetPill}>
                <Text style={styles.totalBetText}>
                  <T>Bet</T>: {totalBetAmount.toLocaleString()} 🪙
                </Text>
              </View>
            )}

            <View style={styles.todayEarningsBox}>
              <Text style={styles.earningsLabel}><T>Today Won</T>:</Text>
              <Text style={styles.earningsValue}>+{todayEarnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* ══ NEON ARCADE MARQUEE / SHOWCASE WINDOW ══ */}
          <View style={styles.arcadeWindowArea}>
            <LinearGradient
              colors={['#1E1B4B', '#2E1065', '#170529']}
              style={styles.arcadeWindowGradient}
            >
              {/* Top Status Strip */}
              <View style={styles.arcadeStatusStrip}>
                {partyFeverActive > 1 ? (
                  <Animated.View style={[styles.partyFeverBanner, { opacity: feverGlowAnim }]}>
                    <Text style={styles.partyFeverText}>
                      🍹 PARTY FEVER: {partyFeverActive}X MULTIPLIER BOOST! 🍹
                    </Text>
                  </Animated.View>
                ) : gamePhase === 'SPINNING' ? (
                  <View style={styles.spinningStatusPill}>
                    <Text style={styles.spinningStatusText}>⚡ ARCADE WHEEL SPINNING! ⚡</Text>
                  </View>
                ) : (
                  <View style={styles.readyStatusPill}>
                    <Text style={styles.readyStatusText}>🍉 PLACE YOUR FRUIT BETS 🍉</Text>
                  </View>
                )}
              </View>

              {/* Center Highlight Showcase */}
              <View style={styles.marqueeCenterBox}>
                {/* Rotating Neon Ring */}
                <Animated.View
                  style={[
                    styles.marqueeGlowRing,
                    { transform: [{ rotate: marqueeSpin }] },
                  ]}
                />

                {/* Fruit Icon & Multiplier */}
                <View style={styles.highlightIconContainer}>
                  <HighlightIconComp size={64} />
                  <Text style={[styles.highlightNameText, { color: currentHighlightFruit.color }]}>
                    {currentHighlightFruit.name} ({currentHighlightFruit.multiplier}X)
                  </Text>
                </View>

                {/* Corner Neon Dots */}
                <View style={[styles.neonDot, styles.dotTL]} />
                <View style={[styles.neonDot, styles.dotTR]} />
                <View style={[styles.neonDot, styles.dotBL]} />
                <View style={[styles.neonDot, styles.dotBR]} />
              </View>

              {/* Countdown Pill Indicator */}
              <Animated.View style={[styles.countdownBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.countdownLabel}>
                  {gamePhase === 'BETTING' ? `⏳ ${countdown}s` : `🎯 SPIN`}
                </Text>
              </Animated.View>
            </LinearGradient>
          </View>

          {/* ══ 8-FRUIT BETTING GRID (4x2) ══ */}
          <View style={styles.bettingGridContainer}>
            <View style={styles.gridRow}>
              {FRUIT_ITEMS.slice(0, 4).map((fruit, index) => {
                const FruitIcon = fruit.icon;
                const betOnIt = bets[fruit.id] || 0;
                const isHighlighted = activeHighlightIndex === index;
                return (
                  <TouchableOpacity
                    key={fruit.id}
                    style={[
                      styles.fruitCard,
                      { borderColor: fruit.color },
                      isHighlighted && styles.fruitCardHighlighted,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handlePlaceBet(fruit.id)}
                    disabled={gamePhase !== 'BETTING' || isSpinning}
                  >
                    <View style={styles.fruitCardIconWrap}>
                      <FruitIcon size={34} />
                    </View>
                    <Text style={styles.fruitCardName} numberOfLines={1}>
                      {fruit.name}
                    </Text>
                    <Text style={[styles.fruitCardMult, { color: fruit.color }]}>
                      {fruit.multiplier}X
                    </Text>

                    {/* Placed Bet Badge */}
                    {betOnIt > 0 && (
                      <View style={styles.betBadgeOnCard}>
                        <Text style={styles.betBadgeText}>
                          {betOnIt >= 1000 ? `${betOnIt / 1000}K` : betOnIt} 🪙
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.gridRow}>
              {FRUIT_ITEMS.slice(4, 8).map((fruit, index) => {
                const actualIdx = index + 4;
                const FruitIcon = fruit.icon;
                const betOnIt = bets[fruit.id] || 0;
                const isHighlighted = activeHighlightIndex === actualIdx;
                return (
                  <TouchableOpacity
                    key={fruit.id}
                    style={[
                      styles.fruitCard,
                      { borderColor: fruit.color },
                      isHighlighted && styles.fruitCardHighlighted,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handlePlaceBet(fruit.id)}
                    disabled={gamePhase !== 'BETTING' || isSpinning}
                  >
                    <View style={styles.fruitCardIconWrap}>
                      <FruitIcon size={34} />
                    </View>
                    <Text style={styles.fruitCardName} numberOfLines={1}>
                      {fruit.name}
                    </Text>
                    <Text style={[styles.fruitCardMult, { color: fruit.color }]}>
                      {fruit.multiplier}X
                    </Text>

                    {/* Placed Bet Badge */}
                    {betOnIt > 0 && (
                      <View style={styles.betBadgeOnCard}>
                        <Text style={styles.betBadgeText}>
                          {betOnIt >= 1000 ? `${betOnIt / 1000}K` : betOnIt} 🪙
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ══ RECENT FRUIT RECORD ══ */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyLabel}><T>Recent</T>:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {recentWinners.map((fruitId, index) => {
                const f = FRUIT_ITEMS.find((item) => item.id === fruitId);
                if (!f) return null;
                const FIcon = f.icon;
                const isLatest = index === 0;
                return (
                  <View
                    key={`${fruitId}-${index}`}
                    style={[
                      styles.historyBadge,
                      { borderColor: f.color },
                      isLatest && styles.historyBadgeLatest,
                    ]}
                  >
                    <View style={styles.historyBadgeIconWrap}>
                      <FIcon size={20} />
                    </View>
                    <View style={styles.historyBadgeInfo}>
                      <Text style={styles.historyBadgeName} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={[styles.historyBadgeMult, { color: f.color }]}>
                        {f.multiplier}X
                      </Text>
                    </View>
                    {isLatest && <View style={styles.latestDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ FOOTER CONTROLS ══ */}
          <View
            style={[
              styles.footerControls,
              {
                paddingBottom:
                  Platform.OS === 'android'
                    ? Math.max(28, insets.bottom + 16)
                    : Math.max(16, insets.bottom),
              },
            ]}
          >
            {/* Chips Row */}
            <View style={styles.chipsRow}>
              {CHIP_VALUES.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.chipBtn,
                    selectedChip === chip && styles.chipBtnSelected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedChip(chip)}
                  disabled={gamePhase !== 'BETTING' || isSpinning}
                >
                  <ShinyCoinIcon size={14} />
                  <Text style={[styles.chipText, selectedChip === chip && styles.chipTextSelected]}>
                    {chip >= 1000 ? `${chip / 1000}K` : chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ══ WIN CELEBRATION MODAL ══ */}
        {winResult && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.winModalBackdrop}>
              <View style={styles.winDialogCard}>
                <LinearGradient
                  colors={
                    winResult.won
                      ? ['#4C0519', '#831843', '#BE185D']
                      : ['#1E1B4B', '#0F172A', '#020617']
                  }
                  style={styles.winDialogGradient}
                >
                  <Text style={styles.winBigTitle}>
                    {winResult.won
                      ? winResult.partyFever
                        ? `🍹 ${t('PARTY FEVER MEGA SURGE!')} 🍹`
                        : `🎉 ${t('FRUIT PARTY WINNER!')} 🎉`
                      : `🍉 ${t('BETTER LUCK NEXT SPIN')} 🍉`}
                  </Text>

                  {/* Fruit Icon */}
                  <View style={styles.winFruitIconWrap}>
                    <winResult.fruit.icon size={68} />
                  </View>

                  <Text style={[styles.winFruitName, { color: winResult.fruit.color }]}>
                    {winResult.fruit.name}
                  </Text>
                  <Text style={styles.winMultiplierTag}>
                    {winResult.effectiveMultiplier}X MULTIPLIER
                  </Text>

                  {winResult.won ? (
                    <View style={styles.winCoinsPill}>
                      <ShinyCoinIcon size={26} />
                      <Text style={styles.winCoinsText}>
                        +{winResult.wonCoins.toLocaleString()}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.winLostText}>
                      <T>Spin again to win big!</T>
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.collectBtn}
                    activeOpacity={0.85}
                    onPress={() => setWinResult(null)}
                  >
                    <Text style={styles.collectBtnText}>
                      {winResult.won ? `💰 ${t('COLLECT')}` : `✕ ${t('CLOSE')}`}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        )}

        {/* ══ RULES & PAYTABLE MODAL ══ */}
        <Modal
          visible={rulesVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRulesVisible(false)}
        >
          <View style={styles.rulesBackdrop}>
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>🍹 <T>Fruit Party Paytable & Rules</T></Text>
              <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.rulesSubheading}>⚡ <T>Dynamic Special Features</T>:</Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#F43F5E', fontWeight: 'bold' }}>Party Fever Surge</Text>: During any spin, Party Fever can randomly ignite, granting an instant <Text style={{ color: '#FEF08A', fontWeight: 'bold' }}>2X or 3X Multiplier Boost</Text> to the winning fruit!
                </Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#EC4899', fontWeight: 'bold' }}>Golden BAR Jackpot</Text>: Hitting the Lucky BAR Crown awards a whopping <Text style={{ color: '#FDE047', fontWeight: 'bold' }}>100X Payout</Text>!
                </Text>

                <Text style={styles.rulesSubheading}>🏆 <T>Fruit Multipliers</T>:</Text>
                {FRUIT_ITEMS.map((f) => {
                  const IconComp = f.icon;
                  return (
                    <View key={f.id} style={styles.paytableItemRow}>
                      <View style={styles.paytableItemLeft}>
                        <IconComp size={28} />
                        <Text style={styles.paytableItemName}>{f.name}</Text>
                      </View>
                      <View style={[styles.paytableItemRight, { backgroundColor: f.color + '22', borderColor: f.color }]}>
                        <Text style={[styles.paytableItemMult, { color: f.color }]}>{f.multiplier}X</Text>
                      </View>
                    </View>
                  );
                })}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F091E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#281745',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#23123D',
    borderWidth: 1.5,
    borderColor: '#FF007F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  feverTag: {
    backgroundColor: '#FF007F',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  feverTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameSubtitle: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#23123D',
    borderWidth: 1,
    borderColor: '#4A1D75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#160C2C',
    borderBottomWidth: 1,
    borderBottomColor: '#281745',
  },
  coinBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#241445',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  coinBalanceText: {
    color: '#FEF08A',
    fontWeight: 'bold',
    fontSize: 13,
    marginHorizontal: 6,
  },
  rechargeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rechargeBtnText: {
    color: '#1C1917',
    fontSize: 10,
    fontWeight: '900',
  },
  totalBetPill: {
    backgroundColor: 'rgba(255, 0, 127, 0.15)',
    borderWidth: 1,
    borderColor: '#FF007F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  totalBetText: {
    color: '#FF70A6',
    fontSize: 11,
    fontWeight: 'bold',
  },
  todayEarningsBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginRight: 4,
  },
  earningsValue: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 12,
  },
  arcadeWindowArea: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  arcadeWindowGradient: {
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  arcadeStatusStrip: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyFeverBanner: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  partyFeverText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  spinningStatusPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  spinningStatusText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: 'bold',
  },
  readyStatusPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  readyStatusText: {
    color: '#D8B4FE',
    fontSize: 11,
    fontWeight: 'bold',
  },
  marqueeCenterBox: {
    width: 140,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  marqueeGlowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#EC4899',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  highlightIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  neonDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE600',
  },
  dotTL: { top: 6, left: 10 },
  dotTR: { top: 6, right: 10 },
  dotBL: { bottom: 6, left: 10 },
  dotBR: { bottom: 6, right: 10 },
  countdownBadge: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: '#4C1D95',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  countdownLabel: {
    color: '#F5D0FE',
    fontWeight: '900',
    fontSize: 12,
  },
  bettingGridContainer: {
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fruitCard: {
    flex: 1,
    backgroundColor: '#1E1238',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fruitCardHighlighted: {
    backgroundColor: '#3B186B',
    borderWidth: 2.5,
    borderColor: '#FFE600',
  },
  fruitCardIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitCardName: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  fruitCardMult: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },
  betBadgeOnCard: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  betBadgeText: {
    color: '#1C1917',
    fontSize: 9,
    fontWeight: '900',
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  historyLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  historyScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A0E33',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'relative',
  },
  historyBadgeLatest: {
    backgroundColor: '#2A1752',
    borderWidth: 1.5,
  },
  historyBadgeIconWrap: {
    marginRight: 4,
  },
  historyBadgeInfo: {
    alignItems: 'flex-start',
  },
  historyBadgeName: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '600',
  },
  historyBadgeMult: {
    fontSize: 9,
    fontWeight: '900',
  },
  latestDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  footerControls: {
    backgroundColor: '#120826',
    borderTopWidth: 1,
    borderTopColor: '#281745',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    marginTop: 'auto',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21103F',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  chipBtnSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#FFE600',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  chipTextSelected: {
    color: '#FFE600',
    fontWeight: '900',
  },
  utilityBtn: {
    backgroundColor: '#26134B',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  utilityBtnText: {
    fontSize: 12,
  },
  winModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  winDialogCard: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F43F5E',
  },
  winDialogGradient: {
    padding: 22,
    alignItems: 'center',
  },
  winBigTitle: {
    color: '#FFE4E6',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  winFruitIconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  winFruitName: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  winMultiplierTag: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  winCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  winCoinsText: {
    color: '#FEF08A',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8,
  },
  winLostText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  collectBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  collectBtnText: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '900',
  },
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    backgroundColor: '#1E1238',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '75%',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  rulesTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesScroll: {
    marginBottom: 14,
  },
  rulesSubheading: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  rulesText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  paytableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#281745',
  },
  paytableItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paytableItemName: {
    color: '#F1F5F9',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
  paytableItemRight: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  paytableItemMult: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeRulesBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

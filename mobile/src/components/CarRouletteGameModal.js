import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Platform,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import { ShinyCoinIcon } from './FoodIcons';
import {
  FerrariIcon,
  LamborghiniIcon,
  MaseratiIcon,
  PorscheIcon,
  MercedesIcon,
  BmwIcon,
  AudiIcon,
  VolkswagenIcon,
  SteeringWheelIcon,
  SpeedometerDialIcon,
  RacingFlagIcon,
} from './CarIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 8 Luxury Car Brands Configuration
const CAR_BRANDS = [
  { id: 'ferrari', name: 'Ferrari', multiplier: 40, tier: 'supercar', icon: FerrariIcon, color: '#EF4444', darkColor: '#7F1D1D', emoji: '🏎️' },
  { id: 'lamborghini', name: 'Lamborghini', multiplier: 30, tier: 'supercar', icon: LamborghiniIcon, color: '#F59E0B', darkColor: '#78350F', emoji: '🐂' },
  { id: 'maserati', name: 'Maserati', multiplier: 20, tier: 'supercar', icon: MaseratiIcon, color: '#3B82F6', darkColor: '#1E3A8A', emoji: '🔱' },
  { id: 'porsche', name: 'Porsche', multiplier: 10, tier: 'supercar', icon: PorscheIcon, color: '#EAB308', darkColor: '#713F12', emoji: '🐎' },
  { id: 'mercedes', name: 'Mercedes-Benz', multiplier: 5, tier: 'luxury', icon: MercedesIcon, color: '#94A3B8', darkColor: '#334155', emoji: '⭐' },
  { id: 'bmw', name: 'BMW', multiplier: 5, tier: 'luxury', icon: BmwIcon, color: '#0EA5E9', darkColor: '#0369A1', emoji: '⚡' },
  { id: 'audi', name: 'Audi', multiplier: 5, tier: 'luxury', icon: AudiIcon, color: '#CBD5E1', darkColor: '#475569', emoji: '⭕' },
  { id: 'volkswagen', name: 'Volkswagen', multiplier: 5, tier: 'luxury', icon: VolkswagenIcon, color: '#6366F1', darkColor: '#3730A3', emoji: '🚙' },
];

const CHIP_VALUES = [10, 50, 100, 1000, 10000];

export default function CarRouletteGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Balance & Stats
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  // Betting & Roulette Loop State
  const [countdown, setCountdown] = useState(15);
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'SPINNING' | 'RESULT'
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { [brandId]: amount }
  const betsRef = useRef(bets);
  betsRef.current = bets;

  const [lastBets, setLastBets] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentWinners, setRecentWinners] = useState(['mercedes', 'bmw', 'audi', 'porsche', 'volkswagen', 'maserati']);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Result Dialog
  const [winResult, setWinResult] = useState(null);

  // Pulsing Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const winnerGlowAnim = useRef(new Animated.Value(0)).current;
  const speedGaugeAnim = useRef(new Animated.Value(0)).current;

  // Sync coins from currentUser prop
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/car-roulette/state');
      if (res.data?.success) {
        if (res.data.coins !== undefined) {
          setUserCoins(res.data.coins);
          onCoinBalanceUpdate?.(res.data.coins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
        if (res.data.recentWinners?.length) {
          setRecentWinners(res.data.recentWinners);
        }
      }
    } catch (err) {
      // Graceful fallback to prop coins
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
      setCountdown(15);
      setGamePhase('BETTING');
      setIsSpinning(false);
      setSpeedKmh(0);
    }
  }, [visible, fetchGameState]);

  // Red Pulse Animation when Countdown <= 5s
  useEffect(() => {
    if (gamePhase === 'BETTING' && countdown <= 5 && countdown > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 250, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [countdown, gamePhase, pulseAnim]);

  // 15-Second Automatic Betting Loop
  useEffect(() => {
    if (!visible || gamePhase !== 'BETTING') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, gamePhase]);

  // Perform Roulette Deceleration Animation to target winner index
  const runRouletteAnimation = useCallback(
    (targetWinnerIndex, onComplete) => {
      let currentIdx = activeHighlightIndex;
      const totalItems = CAR_BRANDS.length;
      // Do at least 3 full laps (24 steps) + distance to target index
      const minLaps = 3;
      const targetStep = minLaps * totalItems + ((targetWinnerIndex - currentIdx + totalItems) % totalItems);

      let step = 0;
      let currentDelay = 45; // Start super fast (45ms per shift)

      // Speedometer needle revs up to max 280 km/h
      Animated.timing(speedGaugeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      const spinInterval = () => {
        currentIdx = (currentIdx + 1) % totalItems;
        setActiveHighlightIndex(currentIdx);
        step++;

        // Rev speed display
        const progress = Math.min(1, step / (targetStep * 0.7));
        setSpeedKmh(Math.floor(progress * 280));

        if (soundEnabled && step % 2 === 0) {
          if (Platform.OS === 'android') {
            Vibration.vibrate(10);
          }
        }

        if (step >= targetStep) {
          // Reached target winner!
          setActiveHighlightIndex(targetWinnerIndex);
          setSpeedKmh(0);

          // Speedometer needle drops
          Animated.timing(speedGaugeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start();

          // Winner Glow Burst Animation
          Animated.sequence([
            Animated.timing(winnerGlowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(winnerGlowAnim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
            Animated.timing(winnerGlowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start();

          if (soundEnabled && Platform.OS === 'android') {
            Vibration.vibrate([0, 100, 50, 150]);
          }

          onComplete?.();
          return;
        }

        // Deceleration curve for realistic mechanical roulette wheel feel
        const remainingSteps = targetStep - step;
        if (remainingSteps < 14) {
          currentDelay += 26; // Slow down gracefully near the end
        } else if (remainingSteps < 6) {
          currentDelay += 60;
        }

        setTimeout(spinInterval, currentDelay);
      };

      spinInterval();
    },
    [activeHighlightIndex, soundEnabled, speedGaugeAnim, winnerGlowAnim]
  );

  // Simulated Visual Spin when user hasn't bet
  const runSimulatedSpin = useCallback(() => {
    setIsSpinning(true);
    setGamePhase('SPINNING');

    const randomWinnerIndex = Math.floor(Math.random() * CAR_BRANDS.length);
    const winnerBrand = CAR_BRANDS[randomWinnerIndex];

    runRouletteAnimation(randomWinnerIndex, () => {
      setRecentWinners((prev) => [winnerBrand.id, ...prev.slice(0, 9)]);
      setGamePhase('RESULT');

      setTimeout(() => {
        setCountdown(15);
        setIsSpinning(false);
        setGamePhase('BETTING');
      }, 3500);
    });
  }, [runRouletteAnimation]);

  // Execute the Real Car Roulette Spin with Bets
  const handleStartSpin = useCallback(async () => {
    if (isSpinning) return;

    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((s, v) => s + (Number(v) || 0), 0);

    if (currentTotal <= 0) {
      showToast(t('Please place your bet on at least one car brand!'), 'info');
      return;
    }

    if (currentTotal > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    try {
      setIsSpinning(true);
      setGamePhase('SPINNING');
      setWinResult(null);
      setLastBets({ ...currentBets });

      // Call backend to settle spin atomically
      const res = await api.post('/games/car-roulette/spin', { bets: currentBets });
      if (!res.data?.success) {
        showToast(t(res.data?.message || 'Failed to start roulette spin'), 'error');
        setIsSpinning(false);
        setGamePhase('BETTING');
        return;
      }

      const {
        winner,
        winnerDetails,
        wonCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        recentWinners: newHistory,
      } = res.data;

      // Update local balance immediately
      setUserCoins(remainingCoins);
      onCoinBalanceUpdate?.(remainingCoins);
      if (newTodayEarnings !== undefined) {
        setTodayEarnings(newTodayEarnings);
      }

      const winnerIndex = CAR_BRANDS.findIndex((b) => b.id === winner);

      // Run roulette animation to the chosen winner
      runRouletteAnimation(winnerIndex >= 0 ? winnerIndex : 0, () => {
        setIsSpinning(false);
        setGamePhase('RESULT');

        if (newHistory) {
          setRecentWinners(newHistory);
        } else {
          setRecentWinners((prev) => [winner, ...prev.slice(0, 9)]);
        }

        const userWon = wonCoins > 0;
        setWinResult({
          won: userWon,
          amount: wonCoins,
          netProfit: wonCoins - currentTotal,
          winner: winnerDetails || CAR_BRANDS.find((b) => b.id === winner),
        });

        if (userWon) {
          showToast(`🎉 ${t('Congratulations! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`, 'success');
        }

        // Reset after 4.5 seconds to start the next round
        setTimeout(() => {
          setBets({});
          setWinResult(null);
          setCountdown(15);
          setGamePhase('BETTING');
        }, 4500);
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Roulette spin error. Please try again.';
      showToast(t(msg), 'error');
      setIsSpinning(false);
      setGamePhase('BETTING');
    }
  }, [isSpinning, userCoins, t, showToast, onCoinBalanceUpdate, runRouletteAnimation]);

  // When 15s Timer expires
  const handleTimerEnd = useCallback(() => {
    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((s, v) => s + (Number(v) || 0), 0);

    if (currentTotal > 0) {
      handleStartSpin();
    } else {
      runSimulatedSpin();
    }
  }, [handleStartSpin, runSimulatedSpin]);

  // Place Bet on a Car Brand
  const handlePlaceBet = (brandId) => {
    if (gamePhase !== 'BETTING' || isSpinning) return;

    const currentTotal = Object.values(bets).reduce((s, v) => s + (Number(v) || 0), 0);
    if (currentTotal + selectedChip > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    setBets((prev) => ({
      ...prev,
      [brandId]: (prev[brandId] || 0) + selectedChip,
    }));

    if (Platform.OS === 'android') {
      Vibration.vibrate(15);
    }
  };

  // Clear all current bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING' || isSpinning) return;
    setBets({});
  };

  // Re-bet (repeat previous bets)
  const handleRebet = () => {
    if (gamePhase !== 'BETTING' || isSpinning) return;
    if (!lastBets || Object.keys(lastBets).length === 0) {
      showToast(t('No previous bets to repeat'), 'info');
      return;
    }

    const lastTotal = Object.values(lastBets).reduce((s, v) => s + (Number(v) || 0), 0);
    if (lastTotal > userCoins) {
      showToast(t('Insufficient coins balance to repeat bet.'), 'error');
      return;
    }

    setBets({ ...lastBets });
    showToast(t('Previous bets restored!'), 'success');
  };

  const totalCurrentBet = Object.values(bets).reduce((s, v) => s + (Number(v) || 0), 0);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.container, { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          {/* ══ HEADER BAR ══ */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <SteeringWheelIcon size={32} />
              </View>
              <View style={styles.headerTextGroup}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>
                    <T>Car Roulette</T>
                  </Text>
                  <View style={styles.vipTag}>
                    <Text style={styles.vipTagText}>VIP CLUB</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>
                  <T>Luxury Brand Spin • 40X Supercars</T>
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Rules Button */}
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.iconBtnText}>ℹ️</Text>
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
              <Text style={styles.coinBalanceText}>{userCoins.toLocaleString()}</Text>
              <TouchableOpacity
                style={styles.rechargeBtn}
                activeOpacity={0.8}
                onPress={onRechargePress}
              >
                <Text style={styles.rechargeBtnText}>+ <T>Recharge</T></Text>
              </TouchableOpacity>
            </View>

            <View style={styles.todayEarningsBox}>
              <Text style={styles.earningsLabel}><T>Today Won</T>:</Text>
              <Text style={styles.earningsValue}>+{todayEarnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* ══ ROULETTE TRACK & SPEEDOMETER CENTER DISPLAY ══ */}
          <View style={styles.rouletteArea}>
            <LinearGradient
              colors={['#0F172A', '#1E1B4B', '#020617']}
              style={styles.rouletteGradientBg}
            >
              {/* Central Speedometer & Countdown Dashboard */}
              <View style={styles.dashboardCenter}>
                {gamePhase === 'BETTING' && (
                  <Animated.View style={[styles.timerBadge, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={[styles.timerText, countdown <= 5 && styles.timerTextDanger]}>
                      ⏳ {countdown}s
                    </Text>
                    <Text style={styles.timerSubText}>
                      {countdown <= 5 ? t('FINAL CALL!') : t('PLACE BETS')}
                    </Text>
                  </Animated.View>
                )}

                {gamePhase === 'SPINNING' && (
                  <View style={styles.speedometerContainer}>
                    <SpeedometerDialIcon size={64} speedPct={Math.min(1, speedKmh / 280)} />
                    <Text style={styles.speedKmhText}>{speedKmh} <Text style={styles.kmhUnit}>KM/H</Text></Text>
                    <Text style={styles.speedLabel}>TURBO RACING 🔥</Text>
                  </View>
                )}

                {gamePhase === 'RESULT' && winResult && (
                  <Animated.View style={[styles.resultCenterBadge, { opacity: winnerGlowAnim }]}>
                    {(() => {
                      const WinnerIcon = winResult.winner?.icon;
                      return WinnerIcon ? (
                        <View style={styles.winnerIconWrap}>
                          <WinnerIcon size={38} />
                        </View>
                      ) : (
                        <Text style={styles.winnerEmoji}>{winResult.winner?.emoji || '🏆'}</Text>
                      );
                    })()}
                    <Text style={styles.winnerText}>{winResult.winner?.name} {winResult.winner?.multiplier}X</Text>
                    {winResult.won ? (
                      <Text style={styles.winPrizeText}>+🪙 {winResult.amount.toLocaleString()}</Text>
                    ) : (
                      <Text style={styles.nextRoundNote}><T>Next Round In 3s</T></Text>
                    )}
                  </Animated.View>
                )}
              </View>

              {/* 8 Car Spotlight Ring (2 Rows of 4 around center) */}
              <View style={styles.spotlightGrid}>
                {CAR_BRANDS.map((brand, index) => {
                  const BrandIconComponent = brand.icon;
                  const isHighlighted = activeHighlightIndex === index;
                  const isWinner = gamePhase === 'RESULT' && winResult?.winner?.id === brand.id;

                  return (
                    <Animated.View
                      key={brand.id}
                      style={[
                        styles.spotlightTile,
                        isHighlighted && styles.spotlightTileActive,
                        isWinner && styles.spotlightTileWinner,
                      ]}
                    >
                      <BrandIconComponent size={28} />
                      <Text style={styles.spotlightMultiplier}>{brand.multiplier}X</Text>
                      {isHighlighted && <View style={styles.activeSpotlightDot} />}
                    </Animated.View>
                  );
                })}
              </View>
            </LinearGradient>
          </View>

          {/* ══ BETTING TABLE (8 CAR BRANDS) ══ */}
          <ScrollView
            style={styles.bettingScrollView}
            contentContainerStyle={styles.bettingScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Supercars (40x - 10x) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>🏎️ <T>Supercars (High Multipliers)</T></Text>
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>UP TO 40X</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              {CAR_BRANDS.slice(0, 4).map((brand) => {
                const BrandIconComponent = brand.icon;
                const betAmount = bets[brand.id] || 0;
                const isWinner = gamePhase === 'RESULT' && winResult?.winner?.id === brand.id;

                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.betCard,
                      { borderColor: brand.color },
                      betAmount > 0 && styles.betCardActive,
                      isWinner && styles.betCardWinner,
                    ]}
                    activeOpacity={0.78}
                    onPress={() => handlePlaceBet(brand.id)}
                    disabled={gamePhase !== 'BETTING' || isSpinning}
                  >
                    <View style={styles.cardIconWrap}>
                      <BrandIconComponent size={40} />
                    </View>
                    <Text style={styles.cardBrandName} numberOfLines={1}>{brand.name}</Text>
                    <View style={[styles.multiplierBadge, { backgroundColor: brand.darkColor }]}>
                      <Text style={styles.multiplierText}>{brand.multiplier}X</Text>
                    </View>

                    {/* Placed Bet Chip */}
                    {betAmount > 0 && (
                      <View style={styles.betChipBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betChipText}>{betAmount.toLocaleString()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Luxury Cars (5X Multipliers) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>⭐ <T>Luxury Cars (Safe 5X Multipliers)</T></Text>
              <View style={styles.silverBadge}>
                <Text style={styles.silverBadgeText}>5X RETURN</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              {CAR_BRANDS.slice(4, 8).map((brand) => {
                const BrandIconComponent = brand.icon;
                const betAmount = bets[brand.id] || 0;
                const isWinner = gamePhase === 'RESULT' && winResult?.winner?.id === brand.id;

                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.betCard,
                      { borderColor: brand.color },
                      betAmount > 0 && styles.betCardActive,
                      isWinner && styles.betCardWinner,
                    ]}
                    activeOpacity={0.78}
                    onPress={() => handlePlaceBet(brand.id)}
                    disabled={gamePhase !== 'BETTING' || isSpinning}
                  >
                    <View style={styles.cardIconWrap}>
                      <BrandIconComponent size={40} />
                    </View>
                    <Text style={styles.cardBrandName} numberOfLines={1}>{brand.name}</Text>
                    <View style={[styles.multiplierBadge, { backgroundColor: brand.darkColor }]}>
                      <Text style={styles.multiplierText}>{brand.multiplier}X</Text>
                    </View>

                    {/* Placed Bet Chip */}
                    {betAmount > 0 && (
                      <View style={styles.betChipBadge}>
                        <ShinyCoinIcon size={12} />
                        <Text style={styles.betChipText}>{betAmount.toLocaleString()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recent Winning History Record */}
            <View style={styles.historyContainer}>
              <Text style={styles.historyLabel}><T>Recent</T>:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                {recentWinners.map((brandId, index) => {
                  const b = CAR_BRANDS.find((c) => c.id === brandId);
                  if (!b) return null;
                  const BrandIcon = b.icon;
                  const isLatest = index === 0;
                  return (
                    <View
                      key={`${brandId}-${index}`}
                      style={[
                        styles.historyBadge,
                        { borderColor: b.color },
                        isLatest && styles.historyBadgeLatest,
                      ]}
                    >
                      <View style={styles.historyBadgeIconWrap}>
                        <BrandIcon size={22} />
                      </View>
                      <View style={styles.historyBadgeInfo}>
                        <Text style={styles.historyBadgeName} numberOfLines={1}>
                          {b.name === 'Mercedes-Benz' ? 'Benz' : b.name}
                        </Text>
                        <Text style={[styles.historyBadgeMult, { color: b.color }]}>
                          {b.multiplier}X
                        </Text>
                      </View>
                      {isLatest && <View style={styles.latestDot} />}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>

          {/* ══ CHIPS & ACTION CONTROLS FOOTER ══ */}
          <View style={styles.footerControls}>
            {/* Chips Row */}
            <View style={styles.chipsRow}>
              {CHIP_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.chipBtn,
                    selectedChip === val && styles.chipBtnSelected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedChip(val)}
                  disabled={gamePhase !== 'BETTING' || isSpinning}
                >
                  <ShinyCoinIcon size={14} />
                  <Text style={[styles.chipText, selectedChip === val && styles.chipTextSelected]}>
                    {val >= 1000 ? `${val / 1000}K` : val}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Clear Button */}
              <TouchableOpacity
                style={[styles.utilityBtn, totalCurrentBet === 0 && styles.utilityBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleClearBets}
                disabled={gamePhase !== 'BETTING' || isSpinning || totalCurrentBet === 0}
              >
                <Text style={styles.utilityBtnText}>🗑️ <T>Clear</T></Text>
              </TouchableOpacity>

              {/* Rebet Button */}
              <TouchableOpacity
                style={[styles.utilityBtn, !lastBets && styles.utilityBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleRebet}
                disabled={gamePhase !== 'BETTING' || isSpinning || !lastBets}
              >
                <Text style={styles.utilityBtnText}>🔁 <T>Rebet</T></Text>
              </TouchableOpacity>
            </View>

            {/* Spin / Start Now Button */}
            <TouchableOpacity
              style={[
                styles.spinActionBtn,
                (isSpinning || gamePhase !== 'BETTING') && styles.spinActionBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleStartSpin}
              disabled={isSpinning || gamePhase !== 'BETTING'}
            >
              <LinearGradient
                colors={isSpinning ? ['#475569', '#334155'] : ['#EF4444', '#DC2626', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.spinGradient}
              >
                <Text style={styles.spinActionBtnText}>
                  {isSpinning ? (
                    `⚡ ${t('RACING...')} ${speedKmh} KM/H`
                  ) : totalCurrentBet > 0 ? (
                    `🚀 ${t('SPIN NOW')} (${totalCurrentBet.toLocaleString()} 🪙)`
                  ) : (
                    `⏳ ${t('SPIN')} (${countdown}s)`
                  )}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ RULES MODAL ══ */}
        <Modal
          visible={rulesVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRulesVisible(false)}
        >
          <View style={styles.rulesBackdrop}>
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>🏁 <T>Car Roulette Rules</T></Text>
              <ScrollView style={styles.rulesScroll}>
                <Text style={styles.rulesText}>
                  1. <T>Place your Gold Coins bet on any of the 8 Luxury Car brands.</T>
                </Text>
                <Text style={styles.rulesSubheading}>🏎️ <T>Supercars (High Payouts)</T>:</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#EF4444' }}>Ferrari</Text>: 40X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#F59E0B' }}>Lamborghini</Text>: 30X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#3B82F6' }}>Maserati</Text>: 20X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#EAB308' }}>Porsche</Text>: 10X</Text>

                <Text style={styles.rulesSubheading}>⭐ <T>Luxury Cars (Steady Payouts)</T>:</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#94A3B8' }}>Mercedes-Benz</Text>: 5X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#0EA5E9' }}>BMW</Text>: 5X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#CBD5E1' }}>Audi</Text>: 5X</Text>
                <Text style={styles.rulesSubItem}>• <Text style={{ color: '#6366F1' }}>Volkswagen</Text>: 5X</Text>

                <Text style={styles.rulesText}>
                  2. <T>Every 15 seconds, the roulette spotlight spins around the track and decelerates on the winning brand.</T>
                </Text>
                <Text style={styles.rulesText}>
                  3. <T>If the spotlight stops on a car you bet on, you instantly win: Your Bet × Multiplier!</T>
                </Text>
                <Text style={styles.rulesText}>
                  4. <T>Winnings are credited to your Gold Coins balance immediately.</T>
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

        {/* ══ WINNER CELEBRATION MODAL ══ */}
        {winResult && winResult.won && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.winModalBackdrop}>
              <View style={styles.winDialogCard}>
                <LinearGradient
                  colors={['#7F1D1D', '#991B1B', '#1E1B4B']}
                  style={styles.winDialogGradient}
                >
                  <Text style={styles.winBigTitle}>🎉 <T>BIG WIN!</T> 🎉</Text>
                  {(() => {
                    const WinnerIcon = winResult.winner?.icon;
                    return WinnerIcon ? (
                      <View style={styles.winCarIconContainer}>
                        <WinnerIcon size={64} />
                      </View>
                    ) : (
                      <Text style={styles.winCarEmoji}>{winResult.winner?.emoji}</Text>
                    );
                  })()}
                  <Text style={styles.winCarName}>{winResult.winner?.name}</Text>
                  <Text style={styles.winMultiplierTag}>{winResult.winner?.multiplier}X MULTIPLIER</Text>

                  <View style={styles.winCoinsPill}>
                    <ShinyCoinIcon size={26} />
                    <Text style={styles.winCoinsText}>+{winResult.amount.toLocaleString()}</Text>
                  </View>

                  <Text style={styles.netProfitNote}>
                    <T>Net Profit</T>: +{winResult.netProfit.toLocaleString()} <T>Coins</T>
                  </Text>

                  <TouchableOpacity
                    style={styles.collectBtn}
                    activeOpacity={0.85}
                    onPress={() => setWinResult(null)}
                  >
                    <Text style={styles.collectBtnText}>💰 <T>COLLECT</T></Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        )}
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
  container: {
    backgroundColor: '#0A0A14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.94,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginRight: 10,
  },
  headerTextGroup: {},
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  vipTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 8,
  },
  vipTagText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    marginLeft: 6,
  },
  iconBtnText: {
    fontSize: 14,
  },
  closeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#2D1B2D',
    borderRadius: 14,
    marginLeft: 8,
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
    backgroundColor: '#111122',
  },
  coinBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E32',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  coinBalanceText: {
    color: '#FEF08A',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  rechargeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  rechargeBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
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
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rouletteArea: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#312E81',
  },
  rouletteGradientBg: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  dashboardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 65,
    marginBottom: 8,
  },
  timerBadge: {
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  timerText: {
    color: '#FEF08A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerTextDanger: {
    color: '#EF4444',
  },
  timerSubText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 1,
  },
  speedometerContainer: {
    alignItems: 'center',
  },
  speedKmhText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: -8,
  },
  kmhUnit: {
    fontSize: 10,
    color: '#F59E0B',
  },
  speedLabel: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultCenterBadge: {
    alignItems: 'center',
  },
  winnerEmoji: {
    fontSize: 24,
  },
  winnerText: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: '900',
  },
  winPrizeText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  nextRoundNote: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  spotlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  spotlightTile: {
    width: (SCREEN_WIDTH - 76) / 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    position: 'relative',
  },
  spotlightTileActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#2A1F45',
    transform: [{ scale: 1.05 }],
  },
  spotlightTileWinner: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
    transform: [{ scale: 1.1 }],
  },
  spotlightMultiplier: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 3,
  },
  activeSpotlightDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  bettingScrollView: {
    flex: 1,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  bettingScrollContent: {
    paddingBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  goldBadge: {
    backgroundColor: '#78350F',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  goldBadgeText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
  },
  silverBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  silverBadgeText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '900',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  betCard: {
    flex: 1,
    backgroundColor: '#131326',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
    minHeight: 102,
    justifyContent: 'space-between',
  },
  betCardActive: {
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
  },
  betCardWinner: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  cardIconWrap: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBrandName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  multiplierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  multiplierText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
  },
  betChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    position: 'absolute',
    top: -5,
    right: -3,
    borderWidth: 1,
    borderColor: '#000000',
  },
  betChipText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 2,
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#0F111E',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E32',
  },
  historyLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
  },
  historyScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161628',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  historyBadgeLatest: {
    backgroundColor: '#2A1F45',
  },
  historyBadgeIconWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  historyBadgeInfo: {
    justifyContent: 'center',
  },
  historyBadgeName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
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
  winnerIconWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  winCarIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  historyBadgeText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: 'bold',
  },
  footerControls: {
    backgroundColor: '#0D0D1A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E32',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  chipBtnSelected: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  chipTextSelected: {
    color: '#FEF08A',
  },
  utilityBtn: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  utilityBtnDisabled: {
    opacity: 0.4,
  },
  utilityBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  spinActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  spinActionBtnDisabled: {
    opacity: 0.65,
  },
  spinGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  rulesTitle: {
    color: '#FEF08A',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesScroll: {
    marginBottom: 12,
  },
  rulesText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  rulesSubheading: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  rulesSubItem: {
    color: '#CBD5E1',
    fontSize: 11,
    marginLeft: 8,
    lineHeight: 16,
  },
  closeRulesBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  winModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  winDialogCard: {
    width: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  winDialogGradient: {
    padding: 24,
    alignItems: 'center',
  },
  winBigTitle: {
    color: '#FEF08A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  winCarEmoji: {
    fontSize: 48,
    marginVertical: 4,
  },
  winCarName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winMultiplierTag: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  winCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  winCoinsText: {
    color: '#FEF08A',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8,
  },
  netProfitNote: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
  },
  collectBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 16,
  },
  collectBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});


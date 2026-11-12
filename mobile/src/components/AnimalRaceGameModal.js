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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import { ShinyCoinIcon } from './FoodIcons';
import {
  LionIcon,
  TigerIcon,
  CheetahIcon,
  ElephantIcon,
  PandaIcon,
  RabbitIcon,
  FinishFlagIcon,
  TrophyGoldIcon,
} from './AnimalIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 6 Animal Racers Configuration
const ANIMAL_RACERS = [
  { id: 'lion', name: 'Lion', multiplier: 25, icon: LionIcon, color: '#F59E0B', darkColor: '#78350F', emoji: '🦁' },
  { id: 'tiger', name: 'Tiger', multiplier: 15, icon: TigerIcon, color: '#EF4444', darkColor: '#7F1D1D', emoji: '🐯' },
  { id: 'cheetah', name: 'Cheetah', multiplier: 10, icon: CheetahIcon, color: '#F97316', darkColor: '#7C2D12', emoji: '🐆' },
  { id: 'elephant', name: 'Elephant', multiplier: 5, icon: ElephantIcon, color: '#3B82F6', darkColor: '#1E3A8A', emoji: '🐘' },
  { id: 'panda', name: 'Panda', multiplier: 3, icon: PandaIcon, color: '#10B981', darkColor: '#064E3B', emoji: '🐼' },
  { id: 'rabbit', name: 'Rabbit', multiplier: 2, icon: RabbitIcon, color: '#EC4899', darkColor: '#831843', emoji: '🐰' },
];

const CHIP_VALUES = [10, 50, 100, 1000, 10000];

export default function AnimalRaceGameModal({
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

  // Betting & Game Loop State
  const [countdown, setCountdown] = useState(15);
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'RACING' | 'RESULT'
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { [animalId]: amount }
  const betsRef = useRef(bets);
  betsRef.current = bets;

  const [lastBets, setLastBets] = useState(null);
  const [isRacing, setIsRacing] = useState(false);
  const [recentWinners, setRecentWinners] = useState(['rabbit', 'panda', 'elephant', 'tiger', 'rabbit', 'cheetah']);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Result Dialog
  const [winResult, setWinResult] = useState(null);

  // Race Animations (Horizontal translation 0 to 1 for each lane)
  const laneAnims = useRef(ANIMAL_RACERS.map(() => new Animated.Value(0))).current;
  const finishGlowAnim = useRef(new Animated.Value(0)).current;

  // Track Layout Width
  const [trackWidth, setTrackWidth] = useState(SCREEN_WIDTH - 120);

  // Sync coins from currentUser prop
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/animal-race/state');
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
      laneAnims.forEach((anim) => anim.setValue(0));
      setCountdown(15);
      setGamePhase('BETTING');
      setIsRacing(false);
    }
  }, [visible, fetchGameState]);

  // Total bet calculation
  const totalBet = Object.values(bets).reduce((sum, v) => sum + (Number(v) || 0), 0);

  // Handle Bet placement on an animal
  const handlePlaceBet = (animalId) => {
    if (isRacing || gamePhase !== 'BETTING') return;

    const currentAmount = bets[animalId] || 0;
    const newTotal = totalBet + selectedChip;

    if (newTotal > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    setBets((prev) => ({
      ...prev,
      [animalId]: currentAmount + selectedChip,
    }));
  };

  // Clear all current bets
  const handleClearBets = () => {
    if (isRacing || gamePhase !== 'BETTING') return;
    setBets({});
  };

  // Double all bets
  const handleDoubleBets = () => {
    if (isRacing || gamePhase !== 'BETTING' || totalBet <= 0) return;

    if (totalBet * 2 > userCoins) {
      showToast(t('Insufficient coins to double bets.'), 'error');
      return;
    }

    setBets((prev) => {
      const doubled = {};
      for (const [id, amt] of Object.entries(prev)) {
        doubled[id] = amt * 2;
      }
      return doubled;
    });
  };

  // Repeat previous bets
  const handleRepeatBets = () => {
    if (isRacing || gamePhase !== 'BETTING' || !lastBets) return;

    const repeatTotal = Object.values(lastBets).reduce((s, v) => s + (Number(v) || 0), 0);
    if (repeatTotal > userCoins) {
      showToast(t('Insufficient coins to repeat bets.'), 'error');
      return;
    }
    setBets({ ...lastBets });
  };

  // Run a visual simulated sprint if user didn't place bets before timer ended
  const handleSimulatedRace = useCallback(() => {
    setIsRacing(true);
    setGamePhase('RACING');

    const randomWinnerIndex = Math.floor(Math.random() * ANIMAL_RACERS.length);
    const winner = ANIMAL_RACERS[randomWinnerIndex];

    laneAnims.forEach((anim) => anim.setValue(0));

    const anims = ANIMAL_RACERS.map((racer, index) => {
      const isWinner = index === randomWinnerIndex;
      const toValue = isWinner ? 1 : 0.8 + Math.random() * 0.14;
      const duration = isWinner ? 2800 : 2900 + Math.random() * 400;

      return Animated.timing(laneAnims[index], {
        toValue,
        duration,
        easing: isWinner ? Easing.out(Easing.quad) : Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    });

    Animated.parallel(anims).start(() => {
      setRecentWinners((prev) => [winner.id, ...prev.slice(0, 9)]);

      Animated.sequence([
        Animated.timing(finishGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(finishGlowAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        laneAnims.forEach((anim) => anim.setValue(0));
        setCountdown(15);
        setIsRacing(false);
        setGamePhase('BETTING');
      }, 2500);
    });
  }, [finishGlowAnim, laneAnims]);

  // Execute the Real Animal Race with Bets!
  const handleStartRace = useCallback(async () => {
    if (isRacing) return;

    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((s, v) => s + (Number(v) || 0), 0);

    if (currentTotal <= 0) {
      showToast(t('Please place your bet on at least one animal!'), 'info');
      return;
    }

    if (currentTotal > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    try {
      setIsRacing(true);
      setGamePhase('RACING');
      setWinResult(null);
      setLastBets({ ...currentBets });

      // Reset starting lines
      laneAnims.forEach((anim) => anim.setValue(0));

      // Call backend to settle race atomically
      const res = await api.post('/games/animal-race/run', { bets: currentBets });
      if (!res.data?.success) {
        showToast(t(res.data?.message || 'Failed to start race'), 'error');
        setIsRacing(false);
        setGamePhase('BETTING');
        return;
      }

      const { winner, winnerDetails, wonCoins, remainingCoins, todayEarnings: newTodayEarnings, recentWinners: newHistory } = res.data;

      // Update local balance immediately
      setUserCoins(remainingCoins);
      onCoinBalanceUpdate?.(remainingCoins);
      if (newTodayEarnings !== undefined) {
        setTodayEarnings(newTodayEarnings);
      }

      // Run race animation
      const winnerIndex = ANIMAL_RACERS.findIndex((a) => a.id === winner);

      const anims = ANIMAL_RACERS.map((racer, index) => {
        const isWinner = index === winnerIndex;
        const toValue = isWinner ? 1 : 0.82 + Math.random() * 0.12;
        const duration = isWinner ? 3000 : 3100 + Math.random() * 500;

        return Animated.timing(laneAnims[index], {
          toValue,
          duration,
          easing: isWinner ? Easing.out(Easing.quad) : Easing.inOut(Easing.ease),
          useNativeDriver: true,
        });
      });

      Animated.parallel(anims).start(() => {
        setIsRacing(false);
        setGamePhase('RESULT');

        Animated.sequence([
          Animated.timing(finishGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(finishGlowAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();

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
          winner: winnerDetails || ANIMAL_RACERS.find((a) => a.id === winner),
        });

        setBets({});

        // Automatically start the next round countdown after 4.5 seconds
        setTimeout(() => {
          setWinResult(null);
          laneAnims.forEach((anim) => anim.setValue(0));
          setCountdown(15);
          setIsRacing(false);
          setGamePhase('BETTING');
        }, 4500);
      });
    } catch (error) {
      console.error('handleStartRace error:', error);
      showToast(t(error.response?.data?.message || 'Failed to start race. Please try again.'), 'error');
      setIsRacing(false);
      setGamePhase('BETTING');
    }
  }, [finishGlowAnim, isRacing, laneAnims, onCoinBalanceUpdate, showToast, t, userCoins]);

  // Handle auto race when countdown ends
  const handleTimerEnd = useCallback(() => {
    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((s, v) => s + (Number(v) || 0), 0);
    if (currentTotal > 0) {
      handleStartRace();
    } else {
      handleSimulatedRace();
    }
  }, [handleSimulatedRace, handleStartRace]);

  // Game Loop Countdown Timer (like Greedy Baby)
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
  }, [visible, gamePhase, handleTimerEnd]);

  // Dismiss win result early
  const handleDismissResult = () => {
    setWinResult(null);
    laneAnims.forEach((anim) => anim.setValue(0));
    setCountdown(15);
    setIsRacing(false);
    setGamePhase('BETTING');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fullScreenContainer}>
        <LinearGradient
          colors={['#061A0C', '#0A2518', '#0D1B2A', '#060B14']}
          style={styles.fullScreenGradient}
        >
          {/* Header Row */}
          <View style={[styles.headerRow, { paddingTop: Math.max(12, insets.top + 6) }]}>
            {/* Left: Close & Title */}
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.75}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.titleWrap}>
                <Text style={styles.headerTitle}>🌴 <T>Animal Race</T></Text>
                <Text style={styles.headerSub}><T>Jungle Safari</T></Text>
              </View>
            </View>

            {/* Right: Coins Balance & Recharge */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.coinsPill}
                activeOpacity={0.8}
                onPress={onRechargePress}
              >
                <ShinyCoinIcon size={18} />
                <Text style={styles.coinsText}>
                  {Number(userCoins || 0).toLocaleString()}
                </Text>
                <View style={styles.rechargePlusBadge}>
                  <Text style={styles.rechargePlusText}>+</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rulesBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.rulesBtnText}>?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Earnings Bar & Recent Winners Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.todayEarningsTag}>
              <TrophyGoldIcon size={18} />
              <Text style={styles.todayEarningsLabel}><T>Today</T>:</Text>
              <Text style={styles.todayEarningsValue}>
                +{Number(todayEarnings || 0).toLocaleString()} 🪙
              </Text>
            </View>

            {/* Recent Winners History */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentWinnersScroll}
            >
              <Text style={styles.recentLabel}><T>History</T>:</Text>
              {recentWinners.slice(0, 8).map((wId, i) => {
                const racer = ANIMAL_RACERS.find((a) => a.id === wId) || ANIMAL_RACERS[0];
                return (
                  <View key={`${wId}_${i}`} style={[styles.recentPill, { borderColor: racer.color }]}>
                    <Text style={styles.recentEmoji}>{racer.emoji}</Text>
                    <Text style={[styles.recentMult, { color: racer.color }]}>{racer.multiplier}x</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ SCROLLABLE RACING ARENA & BETTING GRID ══ */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ THE ANIMATED SAFARI RACE TRACK ══ */}
            <View
              style={styles.raceTrackCard}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - 90)}
            >
            {/* Track Header with Live Countdown Timer */}
            <View style={styles.trackHeaderRow}>
              <View style={styles.trackTitleRow}>
                <Text style={styles.trackTitle}>🏁 <T>Safari Live Track</T></Text>
                {gamePhase === 'BETTING' && (
                  <View style={[styles.timerBadge, countdown <= 5 && styles.timerBadgeUrgent]}>
                    <Text style={styles.timerBadgeText}>⏳ {countdown}s</Text>
                  </View>
                )}
              </View>

              <Text style={styles.trackStatusText}>
                {isRacing ? t('RACE IN PROGRESS!') : t('BETTING TIME')}
              </Text>
            </View>

            {/* 6 Running Lanes */}
            <View style={styles.lanesWrapper}>
              {ANIMAL_RACERS.map((racer, index) => {
                const laneTranslateX = laneAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, trackWidth],
                });
                const RacerIconComponent = racer.icon;

                return (
                  <View key={racer.id} style={styles.laneRow}>
                    {/* Lane Info Badge */}
                    <View style={[styles.laneBadge, { backgroundColor: racer.color }]}>
                      <Text style={styles.laneNumText}>{index + 1}</Text>
                    </View>

                    {/* Lane Track Line */}
                    <View style={styles.laneGround}>
                      <View style={styles.laneTrackLine} />

                      {/* Animated Running Animal */}
                      <Animated.View
                        style={[
                          styles.runnerBox,
                          {
                            transform: [{ translateX: laneTranslateX }],
                          },
                        ]}
                      >
                        <RacerIconComponent size={28} />
                      </Animated.View>
                    </View>

                    {/* Finish Line Checkered Strip */}
                    <View style={styles.finishLine}>
                      <FinishFlagIcon size={18} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ══ INTERACTIVE BETTING GRID (6 ANIMALS) ══ */}
          <View style={styles.bettingSection}>
            <Text style={styles.sectionTitle}>
              🎯 <T>Pick Your Winning Animal</T>
            </Text>

            <View style={styles.animalGrid}>
              {ANIMAL_RACERS.map((racer) => {
                const RacerIcon = racer.icon;
                const betAmount = bets[racer.id] || 0;
                const hasBet = betAmount > 0;

                return (
                  <TouchableOpacity
                    key={racer.id}
                    style={[
                      styles.animalCard,
                      hasBet && { borderColor: racer.color, borderWidth: 2 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handlePlaceBet(racer.id)}
                  >
                    <LinearGradient
                      colors={hasBet ? [racer.darkColor, '#111827'] : ['#1E293B', '#0F172A']}
                      style={styles.cardGradient}
                    >
                      {/* Multiplier Badge */}
                      <View style={[styles.multBadge, { backgroundColor: racer.color }]}>
                        <Text style={styles.multBadgeText}>{racer.multiplier}x</Text>
                      </View>

                      {/* Animal Icon */}
                      <View style={styles.animalIconBox}>
                        <RacerIcon size={38} />
                      </View>

                      {/* Animal Name */}
                      <Text style={styles.animalCardName} numberOfLines={1}>
                        <T>{racer.name}</T>
                      </Text>

                      {/* Active Bet Badge */}
                      {hasBet ? (
                        <View style={[styles.betAmountPill, { backgroundColor: racer.color }]}>
                          <Text style={styles.betAmountText}>
                            {Number(betAmount).toLocaleString()} 🪙
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.tapToBetHint}><T>Tap to Bet</T></Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

          {/* ══ CHIPS & ACTION CONTROLS ══ */}
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
            {/* Chip Selection Bar */}
            <View style={styles.chipsRow}>
              {CHIP_VALUES.map((chip) => {
                const isSelected = selectedChip === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedChip(chip)}
                  >
                    <LinearGradient
                      colors={isSelected ? ['#F59E0B', '#D97706'] : ['#334155', '#1E293B']}
                      style={styles.chipGrad}
                    >
                      <ShinyCoinIcon size={14} />
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Start Race Button with Countdown Info */}
            <TouchableOpacity
              style={[
                styles.startRaceBtn,
                isRacing && styles.startRaceBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (totalBet > 0) {
                  handleStartRace();
                } else {
                  showToast(t('Please place your bet on at least one animal!'), 'info');
                }
              }}
              disabled={isRacing}
            >
              <LinearGradient
                colors={
                  isRacing
                    ? ['#475569', '#334155']
                    : totalBet > 0
                    ? ['#10B981', '#059669', '#047857']
                    : ['#D97706', '#B45309']
                }
                style={styles.startRaceGrad}
              >
                <Text style={styles.startRaceText}>
                  {isRacing ? (
                    <T>RACING...</T>
                  ) : totalBet > 0 ? (
                    `🏁 START NOW (${totalBet.toLocaleString()} Coins • ${countdown}s)`
                  ) : (
                    `⏳ RACE STARTS IN ${countdown}s`
                  )}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ══ WIN / LOSS CELEBRATION MODAL ══ */}
        {winResult && (
          <Modal transparent animationType="fade" visible={!!winResult}>
            <View style={styles.resultBackdrop}>
              <View style={styles.resultCard}>
                <LinearGradient
                  colors={
                    winResult.won
                      ? ['#065F46', '#047857', '#064E3B']
                      : ['#881337', '#701A75', '#3B0764']
                  }
                  style={styles.resultCardGrad}
                >
                  <Text style={styles.resultEmoji}>
                    {winResult.won ? '🏆' : '🏁'}
                  </Text>
                  <Text style={styles.resultHeading}>
                    {winResult.won ? <T>CONGRATULATIONS!</T> : <T>RACE FINISHED</T>}
                  </Text>
                  <Text style={styles.resultWinnerName}>
                    {winResult.winner?.emoji} <T>{winResult.winner?.name}</T> <T>WON</T> ({winResult.winner?.multiplier}x)!
                  </Text>

                  {winResult.won ? (
                    <View style={styles.wonAmountBox}>
                      <Text style={styles.wonAmountText}>
                        +{Number(winResult.amount).toLocaleString()} <T>Coins Won</T>! 🪙
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.lostText}>
                      <T>Better luck in the next safari race!</T>
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.resultCloseBtn}
                    activeOpacity={0.8}
                    onPress={handleDismissResult}
                  >
                    <Text style={styles.resultCloseBtnText}><T>CONTINUE</T></Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        )}

        {/* ══ RULES MODAL ══ */}
        {rulesVisible && (
          <Modal transparent animationType="fade" visible={rulesVisible} onRequestClose={() => setRulesVisible(false)}>
            <View style={styles.resultBackdrop}>
              <View style={styles.rulesCard}>
                <Text style={styles.rulesTitle}>📜 <T>Animal Race Rules</T></Text>
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  <Text style={styles.rulesBody}>
                    <T>1. Select your betting chip and tap on any animal to place your coins.</T>{'\n\n'}
                    <T>2. A 15-second countdown timer runs automatically for placing bets.</T>{'\n\n'}
                    <T>3. You can tap 'START NOW' to race immediately, or wait for timer to reach 0!</T>{'\n\n'}
                    <T>4. If your chosen animal wins the race, you win multiplied coins:</T>{'\n'}
                    • 🦁 Lion: 25x Multiplier{'\n'}
                    • 🐯 Tiger: 15x Multiplier{'\n'}
                    • 🐆 Cheetah: 10x Multiplier{'\n'}
                    • 🐘 Elephant: 5x Multiplier{'\n'}
                    • 🐼 Panda: 3x Multiplier{'\n'}
                    • 🐰 Rabbit: 2x Multiplier{'\n\n'}
                    <T>5. Winnings are automatically added to your wallet balance instantly!</T>
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  style={styles.rulesCloseBtn}
                  onPress={() => setRulesVisible(false)}
                >
                  <Text style={styles.rulesCloseBtnText}><T>GOT IT</T></Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#060B14',
  },
  fullScreenGradient: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  titleWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FDE047',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 5,
  },
  coinsText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '800',
  },
  rechargePlusBadge: {
    backgroundColor: '#10B981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargePlusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  rulesBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  todayEarningsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  todayEarningsLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  todayEarningsValue: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '800',
  },
  recentWinnersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 2,
  },
  recentEmoji: {
    fontSize: 10,
  },
  recentMult: {
    fontSize: 9,
    fontWeight: '800',
  },
  /* ══ Track Styling ══ */
  raceTrackCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    marginHorizontal: 14,
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  trackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '800',
  },
  timerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  timerBadgeText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '900',
  },
  trackStatusText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lanesWrapper: {
    gap: 4,
  },
  laneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    position: 'relative',
  },
  laneBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  laneNumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  laneGround: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  laneTrackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  runnerBox: {
    position: 'absolute',
    left: 0,
    zIndex: 5,
  },
  finishLine: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  /* ══ Betting Grid ══ */
  bettingSection: {
    flex: 1,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  animalCard: {
    width: (SCREEN_WIDTH - 44) / 3,
    height: 98,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  multBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  multBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  animalIconBox: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalCardName: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  betAmountPill: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  betAmountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  tapToBetHint: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 3,
    fontWeight: '600',
  },
  /* ══ Footer Controls ══ */
  footerControls: {
    paddingHorizontal: 14,
    backgroundColor: 'rgba(10, 15, 29, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionSmallBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionSmallText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  chipBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chipBtnSelected: {
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  chipGrad: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  startRaceBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  startRaceBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  startRaceGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRaceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  /* ══ Result Modal ══ */
  resultBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultCardGrad: {
    alignItems: 'center',
    padding: 24,
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultHeading: {
    color: '#FEF08A',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resultWinnerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  wonAmountBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  wonAmountText: {
    color: '#FDE047',
    fontSize: 15,
    fontWeight: '900',
  },
  lostText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  resultCloseBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 18,
    marginTop: 18,
  },
  resultCloseBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  /* ══ Rules Modal ══ */
  rulesCard: {
    backgroundColor: '#0F172A',
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rulesTitle: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesBody: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  rulesCloseBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  rulesCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import {
  ChocolateIcon,
  PastryIcon,
  BurgerIcon,
  PaniPuriIcon,
  ChholaBhaturaIcon,
  NoodlesIcon,
  IdliIcon,
  DosaIcon,
  GreedyBabyCharacter,
  ShinyCoinIcon,
} from './FoodIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 8 Food items configuration with exact user rules
const FOOD_SLOTS = [
  { id: 'chocolate', name: 'Chocolate', multiplier: 5, icon: ChocolateIcon, weight: 22 },
  { id: 'pastry', name: 'Pastry', multiplier: 5, icon: PastryIcon, weight: 22 },
  { id: 'burger', name: 'Burger', multiplier: 5, icon: BurgerIcon, weight: 22 },
  { id: 'pani_puri', name: 'Pani Puri', multiplier: 5, icon: PaniPuriIcon, weight: 22 },
  { id: 'chhola_bhatura', name: 'Chhola Bhatura', multiplier: 10, icon: ChholaBhaturaIcon, weight: 10 },
  { id: 'noodles', name: 'Noodles', multiplier: 15, icon: NoodlesIcon, weight: 6 },
  { id: 'idli', name: 'Idli', multiplier: 25, icon: IdliIcon, weight: 3 },
  { id: 'dosa', name: 'Dosa', multiplier: 45, icon: DosaIcon, weight: 2 },
];

const BET_CHIPS = [10, 50, 100, 1000, 10000];

export default function GreedyBabyGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Balance & Earnings State
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  // Betting & Game Round State
  const [selectedChip, setSelectedChip] = useState(10);
  const [currentBets, setCurrentBets] = useState({}); // { [foodId]: amount }
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'SPINNING' | 'PAYOUT'
  const [countdown, setCountdown] = useState(15);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(null);
  const [winningSlot, setWinningSlot] = useState(null);
  const [recentResults, setRecentResults] = useState([
    'pani_puri',
    'burger',
    'chhola_bhatura',
    'chocolate',
    'pastry',
    'noodles',
    'dosa',
  ]);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [winDialog, setWinDialog] = useState({ visible: false, amount: 0, foodName: '' });

  // Animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const babyAnim = useRef(new Animated.Value(0)).current;

  // Sync user coins whenever currentUser prop updates
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial state & today earnings
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/greedy-baby/state');
      if (res.data?.success) {
        if (res.data.userCoins !== undefined) {
          setUserCoins(res.data.userCoins);
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(res.data.userCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
        if (Array.isArray(res.data.recentResults) && res.data.recentResults.length > 0) {
          setRecentResults(res.data.recentResults);
        }
      }
    } catch (e) {
      console.warn('fetchGameState error:', e.message);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
      startBabyEatingAnimation();
    }
  }, [visible, fetchGameState]);

  // Cute baby wobble animation
  const startBabyEatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(babyAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(babyAnim, {
          toValue: -1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(babyAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Game Loop Countdown Timer
  useEffect(() => {
    if (!visible) return;

    let timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, gamePhase]);

  // Transition between game phases
  const handleTimerEnd = () => {
    if (gamePhase === 'BETTING') {
      triggerSpinningPhase();
    }
  };

  // Select random winner based on weighted probabilities
  const pickWinningFood = () => {
    const totalWeight = FOOD_SLOTS.reduce((acc, f) => acc + f.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < FOOD_SLOTS.length; i++) {
      if (rand < FOOD_SLOTS[i].weight) {
        return i;
      }
      rand -= FOOD_SLOTS[i].weight;
    }
    return 0;
  };

  // Execute spinning animation around the 8 food slots
  const triggerSpinningPhase = () => {
    setGamePhase('SPINNING');
    setActiveHighlightIndex(0);

    const winnerIndex = pickWinningFood();
    const winningFood = FOOD_SLOTS[winnerIndex];

    const totalSteps = 8 * 3 + winnerIndex; // 3 full rounds + final slot
    let step = 0;
    let speed = 60; // fast initial speed

    const runStep = () => {
      setActiveHighlightIndex(step % 8);
      step++;

      if (step < totalSteps) {
        // Decelerate on final stretch
        if (step > totalSteps - 8) {
          speed += 35;
        } else if (step > totalSteps - 14) {
          speed += 15;
        }
        setTimeout(runStep, speed);
      } else {
        // Landed on winner!
        setActiveHighlightIndex(winnerIndex);
        setWinningSlot(winningFood);
        triggerPayoutPhase(winnerIndex, winningFood);
      }
    };

    setTimeout(runStep, 100);
  };

  // Evaluate Payout
  const triggerPayoutPhase = async (winnerIndex, winningFood) => {
    setGamePhase('PAYOUT');

    // Pulse animation on winner
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Check if user won
    const userBetOnWinner = currentBets[winningFood.id] || 0;
    let totalWon = 0;

    if (userBetOnWinner > 0) {
      totalWon = userBetOnWinner * winningFood.multiplier;
    }

    // Call backend to credit coins & record result
    try {
      const res = await api.post('/games/greedy-baby/payout', {
        winningFoodId: winningFood.id,
        totalWon,
      });

      if (res.data?.success) {
        if (res.data.remainingCoins !== undefined) {
          setUserCoins(res.data.remainingCoins);
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(res.data.remainingCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
      }
    } catch (e) {
      console.warn('Payout API error:', e.message);
      // Fallback local update
      if (totalWon > 0) {
        setUserCoins((prev) => {
          const next = prev + totalWon;
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(next);
          return next;
        });
        setTodayEarnings((prev) => prev + totalWon);
      }
    }

    // Update recent results
    setRecentResults((prev) => [winningFood.id, ...prev.slice(0, 9)]);

    // Show celebration dialog if won
    if (totalWon > 0) {
      setWinDialog({
        visible: true,
        amount: totalWon,
        foodName: winningFood.name,
      });
      showToast(`${t('🎉 Congratulations! You won')} ${totalWon} ${t('coins!')}`, 'success');
    }

    // Reset for next round after 4.5 seconds
    setTimeout(() => {
      setWinDialog({ visible: false, amount: 0, foodName: '' });
      setCurrentBets({});
      setWinningSlot(null);
      setActiveHighlightIndex(null);
      setGamePhase('BETTING');
      setCountdown(15);
    }, 4500);
  };

  // Place Bet Handler
  const handlePlaceBet = async (food) => {
    if (gamePhase !== 'BETTING') {
      showToast(t('Betting is locked for this round. Please wait for the next round!'), 'info');
      return;
    }

    // STRICT CHECK: Insufficient Coins
    if (userCoins < selectedChip) {
      showToast(t('Insufficient coins! Please recharge first.'), 'error');
      // Prompt user and redirect to Wallet
      if (onRechargePress) {
        onRechargePress();
      }
      return;
    }

    // Optimistically update UI
    const updatedUserCoins = userCoins - selectedChip;
    setUserCoins(updatedUserCoins);
    if (onCoinBalanceUpdate) onCoinBalanceUpdate(updatedUserCoins);

    setCurrentBets((prev) => ({
      ...prev,
      [food.id]: (prev[food.id] || 0) + selectedChip,
    }));

    // Send bet to backend
    try {
      const res = await api.post('/games/greedy-baby/bet', {
        bets: { [food.id]: selectedChip },
      });

      if (res.data?.success && res.data.remainingCoins !== undefined) {
        setUserCoins(res.data.remainingCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(res.data.remainingCoins);
      }
    } catch (err) {
      const isInsufficient =
        err.response?.data?.code === 'INSUFFICIENT_COINS' ||
        (err.response?.data?.message && err.response.data.message.toLowerCase().includes('insufficient'));

      if (isInsufficient) {
        showToast(t('Insufficient coins! Please recharge first.'), 'error');
        // Rollback bet
        setUserCoins(userCoins);
        setCurrentBets((prev) => ({
          ...prev,
          [food.id]: Math.max(0, (prev[food.id] || 0) - selectedChip),
        }));
        if (onRechargePress) onRechargePress();
      } else {
        showToast(t(err.response?.data?.message || 'Failed to place bet'), 'error');
      }
    }
  };

  // Quick action: Clear current bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING') return;
    const totalPlaced = Object.values(currentBets).reduce((acc, v) => acc + v, 0);
    if (totalPlaced <= 0) return;

    setUserCoins((prev) => {
      const next = prev + totalPlaced;
      if (onCoinBalanceUpdate) onCoinBalanceUpdate(next);
      return next;
    });
    setCurrentBets({});
    showToast(t('Bets cleared'), 'info');
  };

  // Baby rotation interpolate
  const babyRotate = babyAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}>
        {/* ══ HEADER ══ */}
        <View style={styles.header}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.headerTitle}>
            <T>Greedy Baby</T>
          </Text>

          {/* Right Action Icons: Rules & Share */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.75}
              onPress={() => setRulesVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.rulesIconText}>?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ COINS & EARNINGS STATUS PILLS ══ */}
        <View style={styles.statusPillsRow}>
          {/* Coins Balance Pill (Tapping redirects to Wallet Recharge) */}
          <TouchableOpacity
            style={styles.coinsPill}
            activeOpacity={0.8}
            onPress={() => {
              if (onRechargePress) onRechargePress();
            }}
          >
            <Text style={styles.coinsLabel}><T>Coins:</T></Text>
            <ShinyCoinIcon size={18} />
            <Text style={styles.coinsAmount}>
              {Number(userCoins).toLocaleString()}
            </Text>
            <Text style={styles.coinsArrow}>›</Text>
          </TouchableOpacity>

          {/* Today Earnings Pill */}
          <View style={styles.earningsPill}>
            <Text style={styles.earningsLabel}><T>Today Earnings</T></Text>
            <View style={styles.earningsValRow}>
              <ShinyCoinIcon size={14} />
              <Text style={styles.earningsAmount}>
                {Number(todayEarnings).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ══ FERRIS WHEEL / ROULETTE BOARD ══ */}
        <View style={styles.wheelSection}>
          {/* Circular Wheel Outline Spoke Lines */}
          <View style={styles.wheelBackdropCircle}>
            <View style={styles.wheelSpokeH} />
            <View style={styles.wheelSpokeV} />
            <View style={styles.wheelSpokeD1} />
            <View style={styles.wheelSpokeD2} />
          </View>

          {/* Center Hub: Animated Greedy Baby & Status Marquee */}
          <View style={styles.centerBabyHub}>
            <Animated.View style={{ transform: [{ rotate: babyRotate }] }}>
              <GreedyBabyCharacter size={78} />
            </Animated.View>

            {/* Glowing Marquee Box with Countdown */}
            <LinearGradient
              colors={
                gamePhase === 'PAYOUT'
                  ? ['#059669', '#10B981']
                  : gamePhase === 'SPINNING'
                  ? ['#DC2626', '#EF4444']
                  : ['#6D28D9', '#8B5CF6']
              }
              style={styles.marqueeBox}
            >
              <Text style={styles.marqueeStatusText}>
                {gamePhase === 'PAYOUT' ? (
                  <T>Winner!</T>
                ) : gamePhase === 'SPINNING' ? (
                  <T>Spinning...</T>
                ) : (
                  <T>Select Food Now</T>
                )}
              </Text>
              <Text style={styles.marqueeCountdownText}>
                {gamePhase === 'BETTING' ? countdown : '★'}
              </Text>
            </LinearGradient>
          </View>

          {/* 8 Food Slots in a 3x3 Grid Layout around the Center */}
          <View style={styles.foodGridWrapper}>
            {/* Top Row: Slot 7 (Dosa 45x), Slot 0 (Chocolate 5x), Slot 1 (Pastry 5x) */}
            <View style={styles.foodRow}>
              {renderFoodCard(FOOD_SLOTS[7], 7)}
              {renderFoodCard(FOOD_SLOTS[0], 0)}
              {renderFoodCard(FOOD_SLOTS[1], 1)}
            </View>

            {/* Middle Row: Slot 6 (Idli 25x), [Center Gap for Baby Hub], Slot 2 (Burger 5x) */}
            <View style={[styles.foodRow, { justifyContent: 'space-between' }]}>
              {renderFoodCard(FOOD_SLOTS[6], 6)}
              <View style={styles.centerGapSpacer} />
              {renderFoodCard(FOOD_SLOTS[2], 2)}
            </View>

            {/* Bottom Row: Slot 5 (Noodles 15x), Slot 4 (Chhola Bhatura 10x), Slot 3 (Pani Puri 5x) */}
            <View style={styles.foodRow}>
              {renderFoodCard(FOOD_SLOTS[5], 5)}
              {renderFoodCard(FOOD_SLOTS[4], 4)}
              {renderFoodCard(FOOD_SLOTS[3], 3)}
            </View>
          </View>
        </View>

        {/* ══ WAGER INSTRUCTION & CHIPS SELECTOR ══ */}
        <View style={styles.controlsSection}>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionText}>
              <T>Choose the amount of wager &gt; Choose food</T>
            </Text>
            {Object.keys(currentBets).length > 0 && gamePhase === 'BETTING' && (
              <TouchableOpacity onPress={handleClearBets} style={styles.clearBtn} activeOpacity={0.75}>
                <Text style={styles.clearBtnText}><T>Clear</T></Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bet Chips Row: 10, 50, 100, 1000, 10000 */}
          <View style={styles.chipsRow}>
            {BET_CHIPS.map((chipVal) => {
              const isSelected = selectedChip === chipVal;
              return (
                <TouchableOpacity
                  key={chipVal}
                  activeOpacity={0.8}
                  style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                  onPress={() => setSelectedChip(chipVal)}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ['#F59E0B', '#D97706', '#B45309']
                        : ['#312E81', '#1E1B4B']
                    }
                    style={styles.chipGradient}
                  >
                    <ShinyCoinIcon size={20} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {chipVal >= 1000 ? `${chipVal / 1000}K` : chipVal}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ══ RECENT RESULTS ROW ══ */}
          <View style={styles.resultsRow}>
            <Text style={styles.resultsLabel}><T>Result:</T></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resultsScroll}>
              {recentResults.map((foodId, idx) => {
                const found = FOOD_SLOTS.find((f) => f.id === foodId) || FOOD_SLOTS[0];
                const IconComponent = found.icon;
                return (
                  <View key={`${foodId}_${idx}`} style={styles.resultItem}>
                    <IconComponent size={24} />
                    {idx === 0 && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ══ LEADERBOARD TICKER FOOTER ══ */}
        <LinearGradient
          colors={['#EC4899', '#8B5CF6', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.leaderboardFooter, { paddingBottom: Math.max(12, insets.bottom) }]}
        >
          <View style={styles.footerPrizeBlock}>
            <Text style={styles.footerPrizeTitle}>🌍 <T>Weekly Prize</T></Text>
            <View style={styles.coinValRow}>
              <ShinyCoinIcon size={12} />
              <Text style={styles.footerPrizeVal}>300K</Text>
            </View>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerWinnerBlock}>
            <View style={styles.topBadge}><Text style={styles.topBadgeText}>TOP 1</Text></View>
            <View style={styles.coinValRow}>
              <ShinyCoinIcon size={12} />
              <Text style={styles.footerWinnerCoins}>69,251,000</Text>
            </View>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerWinnerBlock}>
            <Text style={styles.todayLabel}><T>Today</T></Text>
            <View style={styles.coinValRow}>
              <ShinyCoinIcon size={12} />
              <Text style={styles.footerWinnerCoins}>4,648,800</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ══ WIN CELEBRATION POPUP ══ */}
        {winDialog.visible && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.winCelebrationOverlay}>
              <LinearGradient colors={['#F59E0B', '#EF4444', '#7C3AED']} style={styles.winCard}>
                <Text style={styles.winTitle}>🎉 <T>BIG WIN!</T> 🎉</Text>
                <Text style={styles.winSubtitle}>
                  <T>Greedy Baby ate</T> <Text style={{ fontWeight: '900', color: '#FEF08A' }}>{winDialog.foodName}</Text>!
                </Text>
                <View style={styles.winAmountBox}>
                  <ShinyCoinIcon size={34} />
                  <Text style={styles.winAmountText}>+{winDialog.amount.toLocaleString()}</Text>
                </View>
                <Text style={styles.winCoinsAddedText}>
                  <T>Coins added to your wallet successfully!</T>
                </Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* ══ RULES MODAL ══ */}
        <Modal
          visible={rulesVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRulesVisible(false)}
        >
          <View style={styles.rulesBackdrop}>
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}><T>Greedy Baby Rules</T></Text>
              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={styles.ruleLine}>• <T>Select your coin bet chip (10, 50, 100, 1K, 10K).</T></Text>
                <Text style={styles.ruleLine}>• <T>Tap on any food items before the timer runs out.</T></Text>
                <Text style={styles.ruleLine}>• <T>Chocolate, Pastry, Burger, Pani Puri pay 5x.</T></Text>
                <Text style={styles.ruleLine}>• <T>Chhola Bhatura pays 10x.</T></Text>
                <Text style={styles.ruleLine}>• <T>Noodles pays 15x.</T></Text>
                <Text style={styles.ruleLine}>• <T>Idli pays 25x.</T></Text>
                <Text style={styles.ruleLine}>• <T>Dosa pays 45x jackpot!</T></Text>
                <Text style={styles.ruleLine}>• <T>Coins are automatically deducted and winnings are credited instantly to your wallet.</T></Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeRulesBtn}
                onPress={() => setRulesVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.closeRulesBtnText}><T>Got It!</T></Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );

  // Helper: Render individual food card
  function renderFoodCard(food, index) {
    const isHighlighted = activeHighlightIndex === index;
    const isWinner = winningSlot?.id === food.id;
    const betAmount = currentBets[food.id] || 0;
    const IconComponent = food.icon;

    return (
      <TouchableOpacity
        key={food.id}
        activeOpacity={0.8}
        onPress={() => handlePlaceBet(food)}
        style={[
          styles.foodCard,
          isHighlighted && styles.foodCardHighlighted,
          isWinner && styles.foodCardWinner,
        ]}
      >
        {/* Popular flame indicator on Pani Puri & Burger */}
        {(food.id === 'pani_puri' || food.id === 'burger') && (
          <View style={styles.foodHotBadge}>
            <Text style={{ fontSize: 9 }}>🔥</Text>
          </View>
        )}

        {/* User Placed Bet Badge */}
        {betAmount > 0 && (
          <View style={styles.placedBetBadge}>
            <ShinyCoinIcon size={10} />
            <Text style={styles.placedBetText}>{betAmount}</Text>
          </View>
        )}

        {/* Food Illustration */}
        <View style={styles.foodIconWrap}>
          <IconComponent size={38} />
        </View>

        {/* Multiplier Tag */}
        <View
          style={[
            styles.multiplierBadge,
            food.multiplier >= 25 && styles.multiplierBadgeJackpot,
          ]}
        >
          <Text
            style={[
              styles.multiplierText,
              food.multiplier >= 25 && styles.multiplierTextJackpot,
            ]}
          >
            Win {food.multiplier} times
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B0764', // Deep Royal Violet matching Screenshot 2
    justifyContent: 'space-between',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesIconText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Status Pills (Coins & Earnings) ── */
  statusPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  coinsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F',
  },
  coinsAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#78350F',
  },
  coinsArrow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#78350F',
    marginLeft: 2,
  },
  earningsPill: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#FDE047',
    fontWeight: '700',
  },
  earningsValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  earningsAmount: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* ── Ferris Wheel Section ── */
  wheelSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  wheelBackdropCircle: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.76,
    height: SCREEN_WIDTH * 0.76,
    borderRadius: (SCREEN_WIDTH * 0.76) / 2,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSpokeH: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  wheelSpokeV: {
    position: 'absolute',
    height: '100%',
    width: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  wheelSpokeD1: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    transform: [{ rotate: '45deg' }],
  },
  wheelSpokeD2: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    transform: [{ rotate: '-45deg' }],
  },

  /* ── Center Baby Hub & Marquee ── */
  centerBabyHub: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  marqueeBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    alignItems: 'center',
    marginTop: -8,
    shadowColor: '#FACC15',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  marqueeStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  marqueeCountdownText: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: '900',
  },

  /* ── Food Slots Grid Wrapper ── */
  foodGridWrapper: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_WIDTH * 0.92,
    justifyContent: 'space-between',
    zIndex: 5,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerGapSpacer: {
    width: 80,
  },

  /* ── Food Card Component ── */
  foodCard: {
    width: (SCREEN_WIDTH * 0.92) / 3.4,
    height: (SCREEN_WIDTH * 0.92) / 3.4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  foodCardHighlighted: {
    borderColor: '#FACC15',
    borderWidth: 3.5,
    backgroundColor: '#FEF9C3',
    transform: [{ scale: 1.08 }],
    shadowColor: '#FACC15',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  foodCardWinner: {
    borderColor: '#22C55E',
    borderWidth: 4,
    backgroundColor: '#DCFCE7',
    transform: [{ scale: 1.12 }],
    shadowColor: '#22C55E',
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  foodHotBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  placedBetBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    zIndex: 5,
  },
  placedBetText: {
    color: '#FDE047',
    fontSize: 9,
    fontWeight: '900',
  },
  foodIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierBadge: {
    width: '100%',
    backgroundColor: '#0284C7',
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiplierBadgeJackpot: {
    backgroundColor: '#7C3AED',
  },
  multiplierText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  multiplierTextJackpot: {
    color: '#FDE047',
  },

  /* ── Wager Controls & Chips ── */
  controlsSection: {
    backgroundColor: '#4C1D95',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  instructionText: {
    color: '#DDD6FE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clearBtnText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chipBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipBtnSelected: {
    borderColor: '#FACC15',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  chipGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    gap: 3,
  },
  chipText: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#78350F',
    fontWeight: '900',
  },

  /* ── Recent Results Row ── */
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  resultsLabel: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '800',
  },
  resultsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  newBadgeText: {
    color: '#000000',
    fontSize: 7,
    fontWeight: '900',
  },

  /* ── Leaderboard Footer ── */
  leaderboardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  footerPrizeBlock: {
    alignItems: 'center',
  },
  footerPrizeTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footerPrizeVal: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
  },
  coinValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  footerWinnerBlock: {
    alignItems: 'center',
  },
  topBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  topBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
  },
  todayLabel: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  footerWinnerCoins: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* ── Win Celebration Modal ── */
  winCelebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  winCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  winTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  winSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  winAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    marginBottom: 14,
  },
  winAmountText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FEF08A',
  },
  winCoinsAddedText: {
    fontSize: 12,
    color: '#DDD6FE',
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ── Rules Modal ── */
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#1E1B4B',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FACC15',
    marginBottom: 14,
    textAlign: 'center',
  },
  ruleLine: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8,
  },
  closeRulesBtn: {
    marginTop: 16,
    backgroundColor: '#8B5CF6',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});


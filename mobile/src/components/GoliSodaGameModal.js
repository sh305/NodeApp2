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
  GoliSodaBottleGraphic,
  WoodenOpenerGraphic,
} from './GoliSodaIcons';
import { ShinyCoinIcon } from './FoodIcons';

// Available Chip Denominations
const CHIPS = [100, 500, 1000, 5000, 10000, 50000];

export default function GoliSodaGameModal({
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

  // Bets state on 3 bottles: bottle1, bottle2, bottle3
  const [bets, setBets] = useState({
    bottle1: 0,
    bottle2: 0,
    bottle3: 0,
  });
  const [lastPlacedBets, setLastPlacedBets] = useState(null);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Loop & Reveal Phases: 'BETTING' (12s) -> 'POPPING' (1.2s) -> 'RESULT' (4.5s)
  const [gamePhase, setGamePhase] = useState('BETTING');
  const [countdown, setCountdown] = useState(12);

  // Current Round Results
  const [bottlePops, setBottlePops] = useState({
    bottle1: { state: 'sealed', prize: null },
    bottle2: { state: 'sealed', prize: null },
    bottle3: { state: 'sealed', prize: null },
  });
  const [winningInfo, setWinningInfo] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // Animations
  const openerAnimY = useRef(new Animated.Value(-120)).current;
  const openerScale = useRef(new Animated.Value(0.9)).current;
  const openerOpacity = useRef(new Animated.Value(0)).current;

  const bottle1Shake = useRef(new Animated.Value(0)).current;
  const bottle2Shake = useRef(new Animated.Value(0)).current;
  const bottle3Shake = useRef(new Animated.Value(0)).current;

  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Refs for tracking unmounted and intervals
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);
  const betsRef = useRef(bets);
  betsRef.current = bets;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/goli-soda/state');
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
      console.error('fetchGameState Goli Soda error:', err);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    isMountedRef.current = true;
    if (visible) {
      fetchGameState();
      startBettingPhase();
    }
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, fetchGameState]);

  // Phase 1: Start 12s Betting Loop
  const startBettingPhase = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGamePhase('BETTING');
    setCountdown(12);

    // Reset bottle states to sealed
    setBottlePops({
      bottle1: { state: 'sealed', prize: null },
      bottle2: { state: 'sealed', prize: null },
      bottle3: { state: 'sealed', prize: null },
    });
    setWinningInfo(null);
    setCelebrationVisible(false);

    // Reset opener animation
    openerAnimY.setValue(-120);
    openerOpacity.setValue(0);
    openerScale.setValue(0.9);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerPopPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Phase 2: Trigger Wooden Opener Pop Phase (1.2s)
  const triggerPopPhase = useCallback(async () => {
    setGamePhase('POPPING');
    Vibration.vibrate(40);

    const currentBets = betsRef.current;
    const totalBet = (currentBets.bottle1 || 0) + (currentBets.bottle2 || 0) + (currentBets.bottle3 || 0);

    let roundResult = null;

    // Call backend if bets were placed
    if (totalBet > 0) {
      try {
        const res = await api.post('/games/goli-soda/play', { bets: currentBets });
        if (res.data?.success) {
          roundResult = res.data;
          setLastPlacedBets({ ...currentBets });
          // Deduct / update user coins locally
          if (roundResult.remainingCoins !== undefined) {
            setUserCoins(roundResult.remainingCoins);
            if (onCoinBalanceUpdate) onCoinBalanceUpdate(roundResult.remainingCoins);
          }
          if (roundResult.todayEarnings !== undefined) {
            setTodayEarnings(roundResult.todayEarnings);
          }
        }
      } catch (err) {
        console.error('playGoliSoda API error:', err);
        showToast(t(err.response?.data?.message || 'Failed to pop soda bottles'), 'error');
      }
    }

    // If no bets or API error, create a client-side visual demo shuffle
    if (!roundResult) {
      const prizes = ['mega', 'super', 'flat'].sort(() => Math.random() - 0.5);
      roundResult = {
        bottleResults: {
          bottle1: prizes[0],
          bottle2: prizes[1],
          bottle3: prizes[2],
        },
        wonCoins: 0,
      };
    }

    // Set bottle shaking and popping
    setBottlePops({
      bottle1: { state: 'popping', prize: null },
      bottle2: { state: 'popping', prize: null },
      bottle3: { state: 'popping', prize: null },
    });

    // 1. Wooden Opener swoop down animation
    Animated.parallel([
      Animated.timing(openerOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(openerAnimY, {
        toValue: 20,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Sudden Palm Press "POP & FIZZ!" impact
      Vibration.vibrate([0, 50, 40, 60]);

      Animated.sequence([
        Animated.timing(openerScale, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(openerScale, {
          toValue: 0.9,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      // Shake bottles on pop impact
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bottle1Shake, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle1Shake, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle1Shake, { toValue: -4, duration: 50, useNativeDriver: true }),
          Animated.timing(bottle1Shake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(bottle2Shake, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle2Shake, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle2Shake, { toValue: 4, duration: 50, useNativeDriver: true }),
          Animated.timing(bottle2Shake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(bottle3Shake, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle3Shake, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(bottle3Shake, { toValue: -3, duration: 50, useNativeDriver: true }),
          Animated.timing(bottle3Shake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
      ]).start(() => {
        // Pop marbles down and shoot fountains!
        setBottlePops({
          bottle1: { state: 'popped', prize: roundResult.bottleResults.bottle1 },
          bottle2: { state: 'popped', prize: roundResult.bottleResults.bottle2 },
          bottle3: { state: 'popped', prize: roundResult.bottleResults.bottle3 },
        });

        // Opener retracts back up
        Animated.timing(openerAnimY, {
          toValue: -120,
          duration: 350,
          useNativeDriver: true,
        }).start();

        // 3. Move to RESULT phase
        setGamePhase('RESULT');
        if (roundResult.wonCoins > 0) {
          setWinningInfo(roundResult);
          triggerWinCelebration(roundResult.wonCoins);
        }

        if (roundResult.history) setHistory(roundResult.history);
        if (roundResult.recentWinners) setRecentWinners(roundResult.recentWinners);

        // Reset bets after round
        setBets({ bottle1: 0, bottle2: 0, bottle3: 0 });

        // Wait 4.5 seconds to show results then start next betting round
        setTimeout(() => {
          if (isMountedRef.current) {
            startBettingPhase();
          }
        }, 4500);
      });
    });
  }, [openerAnimY, openerOpacity, openerScale, bottle1Shake, bottle2Shake, bottle3Shake, onCoinBalanceUpdate, showToast, startBettingPhase, t]);

  // Trigger Win Celebration Dialog
  const triggerWinCelebration = useCallback((amount) => {
    setCelebrationVisible(true);
    celebrationScale.setValue(0.2);
    celebrationOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    showToast(`${t('FOUNTAIN FIZZ WIN!')} +${amount.toLocaleString()} 🪙`, 'success');
  }, [celebrationScale, celebrationOpacity, showToast, t]);

  // Place bet on a bottle
  const handlePlaceBet = (bottleKey) => {
    if (gamePhase !== 'BETTING') {
      showToast(t('Betting is closed for this pop!'), 'info');
      return;
    }
    const currentBet = bets[bottleKey] || 0;
    const totalCurrentBet = bets.bottle1 + bets.bottle2 + bets.bottle3;
    const newTotal = totalCurrentBet + selectedChip;

    if (newTotal > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    Vibration.vibrate(15);
    setBets((prev) => ({
      ...prev,
      [bottleKey]: prev[bottleKey] + selectedChip,
    }));
  };

  // Clear bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING') {
      showToast(t('Cannot clear bets during soda pop!'), 'info');
      return;
    }
    setBets({ bottle1: 0, bottle2: 0, bottle3: 0 });
    showToast(t('Bets cleared!'), 'info');
  };

  // Rebet previous round's bets
  const handleRebet = () => {
    if (gamePhase !== 'BETTING') return;
    if (!lastPlacedBets) {
      showToast(t('No previous bets to repeat'), 'info');
      return;
    }
    const needed = (lastPlacedBets.bottle1 || 0) + (lastPlacedBets.bottle2 || 0) + (lastPlacedBets.bottle3 || 0);
    if (needed > userCoins) {
      showToast(t('Insufficient coins for Rebet'), 'error');
      return;
    }
    setBets({ ...lastPlacedBets });
    showToast(t('Previous bets reloaded!'), 'success');
  };

  const totalCurrentBet = bets.bottle1 + bets.bottle2 + bets.bottle3;

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
          {/* ══ TOP BAR: BACK, BALANCE, TODAY EARNINGS, RULES ══ */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.circleButton}
              activeOpacity={0.75}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* Title Badge */}
            <View style={styles.titleBadgeContainer}>
              <Text style={styles.titleBadgeMain}><T>Goli Soda Pop</T></Text>
              <Text style={styles.titleBadgeSub}><T>5X Mega Fizz • 1-Shot Marble Pop</T></Text>
            </View>

            {/* Header Right Actions */}
            <View style={styles.headerRightRow}>
              {/* Rules Icon */}
              <TouchableOpacity
                style={styles.ruleBadgeBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.ruleBadgeText}>❓ <T>Rules</T></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Bar */}
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
                colors={['#10B981', '#059669']}
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

          {/* Main Scrollable Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ 1-SHOT SODA POPPING ARENA ══ */}
            <View style={styles.arenaContainer}>
              <LinearGradient
                colors={['#064E3B', '#022C22', '#041F18', '#000000']}
                style={styles.arenaGradient}
              >
                {/* Status & Timer Ribbon */}
                <View style={styles.timerRibbon}>
                  {gamePhase === 'BETTING' && (
                    <View style={styles.phaseIndicatorRow}>
                      <View style={styles.pulseDotGreen} />
                      <Text style={styles.timerRibbonText}>
                        <T>CHOOSE YOUR LUCKY BOTTLE</T>: <Text style={styles.timerDigits}>{countdown}s</Text>
                      </Text>
                    </View>
                  )}
                  {gamePhase === 'POPPING' && (
                    <View style={styles.phaseIndicatorRow}>
                      <View style={styles.pulseDotYellow} />
                      <Text style={styles.timerRibbonTextPopping}>
                        💥 <T>POPPING THE MARBLE...</T>
                      </Text>
                    </View>
                  )}
                  {gamePhase === 'RESULT' && (
                    <View style={styles.phaseIndicatorRow}>
                      <View style={styles.pulseDotBlue} />
                      <Text style={styles.timerRibbonTextResult}>
                        🍾 <T>FOUNTAIN REVEALED!</T>
                      </Text>
                    </View>
                  )}
                </View>

                {/* Animated Flying Wooden Opener (T-Tool) */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.openerOverlay,
                    {
                      transform: [
                        { translateY: openerAnimY },
                        { scale: openerScale },
                      ],
                      opacity: openerOpacity,
                    },
                  ]}
                >
                  <WoodenOpenerGraphic width={64} height={64} />
                  <Text style={styles.openerFloatingText}>POP! 💥</Text>
                </Animated.View>

                {/* 3 Authentic Bottles Stage Shelf */}
                <View style={styles.bottlesRow}>
                  {/* Bottle 1: Nimbu Masala (Lemon 🍋) */}
                  <Animated.View
                    style={[
                      styles.bottleCol,
                      { transform: [{ translateX: bottle1Shake }] },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePlaceBet('bottle1')}
                      style={[
                        styles.bottleClickTarget,
                        bets.bottle1 > 0 && styles.activeBottleBorder,
                      ]}
                    >
                      <View style={styles.bottleGraphicWrapper}>
                        <GoliSodaBottleGraphic
                          flavor="lemon"
                          state={bottlePops.bottle1.state}
                          prize={bottlePops.bottle1.prize}
                          width={95}
                          height={165}
                        />
                      </View>
                      <View style={styles.bottleTitleTagYellow}>
                        <Text style={styles.bottleTitleText}>🍋 <T>Nimbu 1</T></Text>
                      </View>

                      {/* Prize Badge when popped */}
                      {bottlePops.bottle1.prize && (
                        <View
                          style={[
                            styles.resultPrizePill,
                            bottlePops.bottle1.prize === 'mega'
                              ? styles.pillMega
                              : bottlePops.bottle1.prize === 'super'
                              ? styles.pillSuper
                              : styles.pillFlat,
                          ]}
                        >
                          <Text style={styles.resultPrizePillText}>
                            {bottlePops.bottle1.prize === 'mega'
                              ? '💎 5X MEGA'
                              : bottlePops.bottle1.prize === 'super'
                              ? '🪙 2.5X SUPER'
                              : '🍂 0X FLAT'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Bottle 2: Kala Khatta (Berry 🍇) */}
                  <Animated.View
                    style={[
                      styles.bottleCol,
                      { transform: [{ translateX: bottle2Shake }] },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePlaceBet('bottle2')}
                      style={[
                        styles.bottleClickTarget,
                        bets.bottle2 > 0 && styles.activeBottleBorder,
                      ]}
                    >
                      <View style={styles.bottleGraphicWrapper}>
                        <GoliSodaBottleGraphic
                          flavor="berry"
                          state={bottlePops.bottle2.state}
                          prize={bottlePops.bottle2.prize}
                          width={95}
                          height={165}
                        />
                      </View>
                      <View style={styles.bottleTitleTagPurple}>
                        <Text style={styles.bottleTitleText}>🍇 <T>Khatta 2</T></Text>
                      </View>

                      {/* Prize Badge when popped */}
                      {bottlePops.bottle2.prize && (
                        <View
                          style={[
                            styles.resultPrizePill,
                            bottlePops.bottle2.prize === 'mega'
                              ? styles.pillMega
                              : bottlePops.bottle2.prize === 'super'
                              ? styles.pillSuper
                              : styles.pillFlat,
                          ]}
                        >
                          <Text style={styles.resultPrizePillText}>
                            {bottlePops.bottle2.prize === 'mega'
                              ? '💎 5X MEGA'
                              : bottlePops.bottle2.prize === 'super'
                              ? '🪙 2.5X SUPER'
                              : '🍂 0X FLAT'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Bottle 3: Jeera Spiced (Amber 🌿) */}
                  <Animated.View
                    style={[
                      styles.bottleCol,
                      { transform: [{ translateX: bottle3Shake }] },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handlePlaceBet('bottle3')}
                      style={[
                        styles.bottleClickTarget,
                        bets.bottle3 > 0 && styles.activeBottleBorder,
                      ]}
                    >
                      <View style={styles.bottleGraphicWrapper}>
                        <GoliSodaBottleGraphic
                          flavor="jeera"
                          state={bottlePops.bottle3.state}
                          prize={bottlePops.bottle3.prize}
                          width={95}
                          height={165}
                        />
                      </View>
                      <View style={styles.bottleTitleTagAmber}>
                        <Text style={styles.bottleTitleText}>🌿 <T>Jeera 3</T></Text>
                      </View>

                      {/* Prize Badge when popped */}
                      {bottlePops.bottle3.prize && (
                        <View
                          style={[
                            styles.resultPrizePill,
                            bottlePops.bottle3.prize === 'mega'
                              ? styles.pillMega
                              : bottlePops.bottle3.prize === 'super'
                              ? styles.pillSuper
                              : styles.pillFlat,
                          ]}
                        >
                          <Text style={styles.resultPrizePillText}>
                            {bottlePops.bottle3.prize === 'mega'
                              ? '💎 5X MEGA'
                              : bottlePops.bottle3.prize === 'super'
                              ? '🪙 2.5X SUPER'
                              : '🍂 0X FLAT'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* Wooden Street Cart Base Stand */}
                <View style={styles.woodenStandBase}>
                  <LinearGradient
                    colors={['#78350F', '#B45309', '#451A03']}
                    style={styles.woodenStandGrad}
                  >
                    <Text style={styles.woodenStandText}>
                      🥤 <T>FRESH SODA STAND • 2 OUT OF 3 WIN (66.7%)</T>
                    </Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>

            {/* ══ 3 BOTTLE BETTING CARDS ══ */}
            <View style={styles.betCardsRow}>
              {/* Bottle 1 Bet Card */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  bets.bottle1 > 0 && styles.betCardActiveLemon,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('bottle1')}
              >
                <View style={styles.betCardHeader}>
                  <Text style={styles.betCardTitleLemon}><T>Bottle 1</T></Text>
                  <Text style={styles.betCardSubLemon}>🍋 <T>Nimbu</T></Text>
                </View>
                <View style={styles.betCardMultiplierBadgeYellow}>
                  <Text style={styles.betCardMultiplierText}>UP TO 5X</Text>
                </View>
                <View style={styles.betAmountContainer}>
                  <Text style={styles.betAmountLabel}><T>Bet</T>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {bets.bottle1 > 0 && <ShinyCoinIcon size={12} />}
                    <Text style={styles.betAmountValue}>
                      {bets.bottle1 > 0 ? bets.bottle1.toLocaleString() : '—'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Bottle 2 Bet Card */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  bets.bottle2 > 0 && styles.betCardActiveBerry,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('bottle2')}
              >
                <View style={styles.betCardHeader}>
                  <Text style={styles.betCardTitleBerry}><T>Bottle 2</T></Text>
                  <Text style={styles.betCardSubBerry}>🍇 <T>Khatta</T></Text>
                </View>
                <View style={styles.betCardMultiplierBadgePurple}>
                  <Text style={styles.betCardMultiplierText}>UP TO 5X</Text>
                </View>
                <View style={styles.betAmountContainer}>
                  <Text style={styles.betAmountLabel}><T>Bet</T>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {bets.bottle2 > 0 && <ShinyCoinIcon size={12} />}
                    <Text style={styles.betAmountValue}>
                      {bets.bottle2 > 0 ? bets.bottle2.toLocaleString() : '—'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Bottle 3 Bet Card */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  bets.bottle3 > 0 && styles.betCardActiveJeera,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('bottle3')}
              >
                <View style={styles.betCardHeader}>
                  <Text style={styles.betCardTitleJeera}><T>Bottle 3</T></Text>
                  <Text style={styles.betCardSubJeera}>🌿 <T>Jeera</T></Text>
                </View>
                <View style={styles.betCardMultiplierBadgeAmber}>
                  <Text style={styles.betCardMultiplierText}>UP TO 5X</Text>
                </View>
                <View style={styles.betAmountContainer}>
                  <Text style={styles.betAmountLabel}><T>Bet</T>:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {bets.bottle3 > 0 && <ShinyCoinIcon size={12} />}
                    <Text style={styles.betAmountValue}>
                      {bets.bottle3 > 0 ? bets.bottle3.toLocaleString() : '—'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* ══ CHIP SELECTOR BAR ══ */}
            <View style={styles.chipsBarContainer}>
              <Text style={styles.sectionHeaderTitle}><T>Select Chip</T></Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {CHIPS.map((chipVal) => {
                  const isSelected = selectedChip === chipVal;
                  return (
                    <TouchableOpacity
                      key={`chip_${chipVal}`}
                      activeOpacity={0.75}
                      onPress={() => setSelectedChip(chipVal)}
                      style={[styles.chipPill, isSelected && styles.chipPillSelected]}
                    >
                      <LinearGradient
                        colors={
                          isSelected
                            ? ['#10B981', '#059669']
                            : ['#1E293B', '#0F172A']
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

            {/* ══ ACTION BUTTONS: CLEAR, REBET, TOTAL ══ */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.75}
                onPress={handleClearBets}
              >
                <Text style={styles.clearBtnText}>🗑️ <T>Clear</T></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rebetBtn}
                activeOpacity={0.75}
                onPress={handleRebet}
              >
                <Text style={styles.rebetBtnText}>🔁 <T>Rebet</T></Text>
              </TouchableOpacity>

              <View style={styles.totalBetDisplay}>
                <Text style={styles.totalBetLabel}><T>Total Bet</T>:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <ShinyCoinIcon size={14} />
                  <Text style={styles.totalBetAmount}>
                    {totalCurrentBet.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* ══ LAST 15 POPS HISTORY ROADMAP ══ */}
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>📜 <T>Recent Soda Pops</T></Text>
                <Text style={styles.historySubtitle}><T>Last 15 Rounds</T></Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyScroll}
              >
                {history.map((item, idx) => {
                  const megaName =
                    item.megaBottle === 'bottle1'
                      ? 'Nimbu'
                      : item.megaBottle === 'bottle2'
                      ? 'Khatta'
                      : 'Jeera';
                  const isNimbu = item.megaBottle === 'bottle1';
                  const isKhatta = item.megaBottle === 'bottle2';

                  return (
                    <View key={`hist_${item.roundId || idx}`} style={styles.historyPill}>
                      <View
                        style={[
                          styles.historyColorDot,
                          isNimbu
                            ? styles.dotYellow
                            : isKhatta
                            ? styles.dotPurple
                            : styles.dotAmber,
                        ]}
                      />
                      <Text style={styles.historyRoundText}>{item.roundId || `R${idx + 1}`}</Text>
                      <Text style={styles.historyWinnerBottle}>{megaName}</Text>
                      <Text style={styles.historyMultBadge}>5X</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* ══ RECENT BIG SODA WINNERS ══ */}
            {recentWinners.length > 0 && (
              <View style={styles.winnersContainer}>
                <Text style={styles.winnersTitle}>🏆 <T>Top Soda Masters</T></Text>
                {recentWinners.slice(0, 4).map((w, i) => (
                  <View key={`w_${i}`} style={styles.winnerRow}>
                    <Text style={styles.winnerName}>{w.name}</Text>
                    <Text style={styles.winnerPrizeBadge}>
                      {w.prize === 'mega' ? '💎 5X Mega' : '🪙 2.5X Super'}
                    </Text>
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
          {celebrationVisible && winningInfo && (
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
                colors={['#047857', '#065F46', '#022C22']}
                style={styles.celebrationCard}
              >
                <Text style={styles.celebrationTitleEmoji}>🍾💥✨</Text>
                <Text style={styles.celebrationHeading}>
                  <T>FOUNTAIN POP WINNER!</T>
                </Text>
                <Text style={styles.celebrationAmount}>
                  +{winningInfo.wonCoins?.toLocaleString()} <T>Coins</T>
                </Text>
                <TouchableOpacity
                  style={styles.celebrationCollectBtn}
                  activeOpacity={0.8}
                  onPress={() => setCelebrationVisible(false)}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.collectGrad}
                  >
                    <Text style={styles.collectBtnText}>✨ <T>Awesome!</T></Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ══ HOW TO PLAY / RULES DIALOG ══ */}
          <Modal
            visible={rulesVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setRulesVisible(false)}
          >
            <View style={styles.rulesModalOverlay}>
              <View style={styles.rulesCard}>
                <LinearGradient
                  colors={['#1E293B', '#0F172A']}
                  style={styles.rulesCardGrad}
                >
                  <View style={styles.rulesHeader}>
                    <Text style={styles.rulesTitleEmoji}>🥤</Text>
                    <Text style={styles.rulesTitle}><T>Goli Soda Pop Rules</T></Text>
                  </View>

                  <ScrollView style={styles.rulesScroll}>
                    <Text style={styles.ruleSectionHeading}><T>Bottles & Multipliers</T></Text>
                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>💎</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Mega Fountain Fizz (5X)</T></Text>
                        <Text style={styles.ruleItemDesc}>
                          <T>Explosive high fountain shooting diamonds and gold! Pays 5X your bet.</T>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🫧</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Super Foam Overflow (2.5X)</T></Text>
                        <Text style={styles.ruleItemDesc}>
                          <T>Rich overflowing bubbly foam! Pays 2.5X your bet.</T>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ruleItem}>
                      <Text style={styles.ruleEmoji}>🍃</Text>
                      <View style={styles.ruleTextContainer}>
                        <Text style={styles.ruleItemTitle}><T>Flat Soda (0X)</T></Text>
                        <Text style={styles.ruleItemDesc}>
                          <T>Weak little fizz puff. 0X return.</T>
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.ruleSectionHeading, { marginTop: 12 }]}>
                      <T>Winning Probability</T>
                    </Text>
                    <Text style={styles.ruleItemDesc}>
                      <T>2 out of 3 bottles ALWAYS have winning fizz! (66.7% win chance). Place chips on any bottle before the countdown hits 0.</T>
                    </Text>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.rulesCloseBtn}
                    activeOpacity={0.8}
                    onPress={() => setRulesVisible(false)}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
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
    backgroundColor: '#0A0F1D',
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
    color: '#34D399',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleBadgeSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleBadgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  ruleBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131D31',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    color: '#94A3B8',
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
    color: '#34D399',
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
  arenaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#059669',
    marginVertical: 8,
  },
  arenaGradient: {
    paddingTop: 12,
    alignItems: 'center',
  },
  timerRibbon: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  phaseIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  pulseDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FACC15',
    marginRight: 6,
  },
  pulseDotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  timerRibbonText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timerDigits: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '900',
  },
  timerRibbonTextPopping: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '800',
  },
  timerRibbonTextResult: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  openerOverlay: {
    position: 'absolute',
    top: 50,
    zIndex: 10,
    alignItems: 'center',
  },
  openerFloatingText: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  bottleCol: {
    flex: 1,
    alignItems: 'center',
  },
  bottleClickTarget: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
  },
  activeBottleBorder: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  bottleGraphicWrapper: {
    height: 175,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottleTitleTagYellow: {
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAB308',
    marginTop: 4,
  },
  bottleTitleTagPurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C084FC',
    marginTop: 4,
  },
  bottleTitleTagAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 4,
  },
  bottleTitleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  resultPrizePill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillMega: {
    backgroundColor: '#0284C7',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  pillSuper: {
    backgroundColor: '#B45309',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pillFlat: {
    backgroundColor: '#475569',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  resultPrizePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  woodenStandBase: {
    width: '100%',
    marginTop: 12,
  },
  woodenStandGrad: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: '#B45309',
  },
  woodenStandText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  betCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  betCard: {
    flex: 1,
    backgroundColor: '#131D31',
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  betCardActiveLemon: {
    borderColor: '#FACC15',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
  },
  betCardActiveBerry: {
    borderColor: '#C084FC',
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
  },
  betCardActiveJeera: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  betCardHeader: {
    alignItems: 'center',
  },
  betCardTitleLemon: {
    color: '#FEF08A',
    fontSize: 13,
    fontWeight: '800',
  },
  betCardSubLemon: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '600',
  },
  betCardTitleBerry: {
    color: '#F472B6',
    fontSize: 13,
    fontWeight: '800',
  },
  betCardSubBerry: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '600',
  },
  betCardTitleJeera: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '800',
  },
  betCardSubJeera: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },
  betCardMultiplierBadgeYellow: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  betCardMultiplierBadgePurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  betCardMultiplierBadgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  betCardMultiplierText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  betAmountContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  betAmountLabel: {
    color: '#64748B',
    fontSize: 9,
  },
  betAmountValue: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '800',
  },
  chipsBarContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
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
    borderColor: '#34D399',
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131D31',
    padding: 8,
    borderRadius: 14,
    marginVertical: 6,
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  clearBtnText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '800',
  },
  rebetBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  rebetBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  totalBetDisplay: {
    alignItems: 'flex-end',
  },
  totalBetLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  totalBetAmount: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '900',
  },
  historyContainer: {
    backgroundColor: '#131D31',
    padding: 12,
    borderRadius: 14,
    marginVertical: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
  },
  historySubtitle: {
    color: '#64748B',
    fontSize: 10,
  },
  historyScroll: {
    paddingVertical: 2,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  historyColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  dotYellow: {
    backgroundColor: '#FACC15',
  },
  dotPurple: {
    backgroundColor: '#C084FC',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  historyRoundText: {
    color: '#94A3B8',
    fontSize: 10,
    marginRight: 4,
  },
  historyWinnerBottle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  historyMultBadge: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  winnersContainer: {
    backgroundColor: '#131D31',
    padding: 12,
    borderRadius: 14,
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
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  winnerAmount: {
    color: '#34D399',
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
    borderColor: '#34D399',
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
    borderColor: '#34D399',
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
    color: '#34D399',
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


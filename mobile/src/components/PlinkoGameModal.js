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
  GoldenPlinkoBallGraphic,
  PlinkoPegPinGraphic,
  PlinkoJackpotCupIcon,
} from './PlinkoIcons';

const CHIPS = [100, 500, 1000, 5000, 10000, 25000];

const BUCKETS = [
  { index: 0, multiplier: 25, label: '25X', color: '#EF4444', border: '#F87171', bg: 'rgba(239, 68, 68, 0.28)' },
  { index: 1, multiplier: 10, label: '10X', color: '#F97316', border: '#FB923C', bg: 'rgba(249, 115, 22, 0.28)' },
  { index: 2, multiplier: 4, label: '4X', color: '#F59E0B', border: '#FBBF24', bg: 'rgba(245, 158, 11, 0.28)' },
  { index: 3, multiplier: 1.5, label: '1.5X', color: '#10B981', border: '#34D399', bg: 'rgba(16, 185, 129, 0.28)' },
  { index: 4, multiplier: 0.5, label: '0.5X', color: '#6366F1', border: '#818CF8', bg: 'rgba(99, 102, 241, 0.28)' },
  { index: 5, multiplier: 1.5, label: '1.5X', color: '#10B981', border: '#34D399', bg: 'rgba(16, 185, 129, 0.28)' },
  { index: 6, multiplier: 4, label: '4X', color: '#F59E0B', border: '#FBBF24', bg: 'rgba(245, 158, 11, 0.28)' },
  { index: 7, multiplier: 10, label: '10X', color: '#F97316', border: '#FB923C', bg: 'rgba(249, 115, 22, 0.28)' },
  { index: 8, multiplier: 25, label: '25X', color: '#EF4444', border: '#F87171', bg: 'rgba(239, 68, 68, 0.28)' },
];

export default function PlinkoGameModal({
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
  const [isDropping, setIsDropping] = useState(false);

  // Ball visibility & landed bucket
  const [ballVisible, setBallVisible] = useState(false);
  const [highlightedBucket, setHighlightedBucket] = useState(null);
  const [hitPins, setHitPins] = useState({});

  // Win celebration
  const [winResult, setWinResult] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Auto-Drop State
  const [autoDropsLeft, setAutoDropsLeft] = useState(0);
  const autoDropTimerRef = useRef(null);

  // Ball Coordinates
  const ballXAnim = useRef(new Animated.Value(0)).current;
  const ballYAnim = useRef(new Animated.Value(0)).current;
  const ballScaleAnim = useRef(new Animated.Value(1)).current;

  // Pulse & Celebration Animations
  const dropBtnPulse = useRef(new Animated.Value(1)).current;
  const bucketPulse = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isDroppingRef = useRef(isDropping);
  isDroppingRef.current = isDropping;

  // Board dimensions
  const boardWidth = Math.min(windowWidth - 32, 360);
  const boardHeight = 240;
  const colSpacing = (boardWidth - 40) / 9;
  const rowHeight = (boardHeight - 48) / 8;
  const centerX = boardWidth / 2;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/plinko/state');
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
      console.error('fetchGameState Plinko error:', err);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      isMountedRef.current = true;
      fetchGameState();

      // Start pulsing drop button
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(dropBtnPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(dropBtnPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      return () => {
        isMountedRef.current = false;
        pulseLoop.stop();
        if (autoDropTimerRef.current) clearTimeout(autoDropTimerRef.current);
      };
    }
  }, [visible, fetchGameState, dropBtnPulse]);

  // Handle Bet Adjustments
  const handleHalfBet = () => {
    if (isDropping) return;
    setBetAmount((prev) => Math.max(100, Math.floor(prev / 2)));
  };

  const handleDoubleBet = () => {
    if (isDropping) return;
    setBetAmount((prev) => Math.min(Math.max(100, userCoins), prev * 2));
  };

  const handleMaxBet = () => {
    if (isDropping) return;
    const maxVal = Math.min(50000, userCoins);
    setBetAmount(maxVal >= 100 ? maxVal : 100);
  };

  // Run Drop Animation
  const animateBallDrop = (path, bucketIndex, onFinish) => {
    setBallVisible(true);
    setHighlightedBucket(null);
    setHitPins({});

    // Start at top center: (centerX, 4)
    ballXAnim.setValue(centerX - 13);
    ballYAnim.setValue(4);
    ballScaleAnim.setValue(1);

    const keyframes = [];
    let currentRight = 0;

    // Calculate (x, y) coordinates for each bounce
    for (let step = 0; step < 8; step++) {
      if (path[step] === 1) currentRight++;
      // horizontal position
      const stepX = centerX + (currentRight - (step + 1) / 2) * colSpacing - 13;
      const stepY = 16 + (step + 1) * rowHeight;

      // Bounce timing
      keyframes.push(
        Animated.parallel([
          Animated.timing(ballXAnim, {
            toValue: stepX,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ballYAnim, {
            toValue: stepY,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ballScaleAnim, { toValue: 1.15, duration: 90, useNativeDriver: true }),
            Animated.timing(ballScaleAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
          ]),
        ])
      );
    }

    // Final drop into bucket slot
    const finalBucketX = 20 + bucketIndex * colSpacing + colSpacing / 2 - 13;
    const finalBucketY = boardHeight - 16;

    keyframes.push(
      Animated.parallel([
        Animated.timing(ballXAnim, {
          toValue: finalBucketX,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ballYAnim, {
          toValue: finalBucketY,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Run sequence
    Animated.sequence(keyframes).start(() => {
      // Landed in bucket!
      setHighlightedBucket(bucketIndex);
      try {
        Vibration.vibrate(60);
      } catch (e) {}

      // Bucket pulse bounce
      Animated.sequence([
        Animated.timing(bucketPulse, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(bucketPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        if (isMountedRef.current) {
          onFinish();
        }
      }, 500);
    });
  };

  // Main Drop Action
  const handleDropBall = async () => {
    if (isDroppingRef.current) return;
    if (userCoins < betAmount) {
      showToast(t('Insufficient coins! Please recharge.'), 'error');
      setAutoDropsLeft(0);
      return;
    }

    setIsDropping(true);
    setWinResult(null);

    // Optimistically deduct bet
    const prevCoins = userCoins;
    const optimisticCoins = Math.max(0, userCoins - betAmount);
    setUserCoins(optimisticCoins);
    if (onCoinBalanceUpdate) onCoinBalanceUpdate(optimisticCoins);

    try {
      const res = await api.post('/games/plinko/drop', { betAmount });
      if (!res.data?.success) {
        setUserCoins(prevCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
        showToast(t(res.data?.message || 'Drop failed'), 'error');
        setIsDropping(false);
        setAutoDropsLeft(0);
        return;
      }

      const {
        bucketIndex,
        multiplier,
        path,
        wonCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        history: newHistory,
        recentWinners: newWinners,
      } = res.data;

      // Animate ball physics along the path returned by server
      animateBallDrop(path, bucketIndex, () => {
        // Update user state
        setUserCoins(remainingCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(remainingCoins);
        if (newTodayEarnings !== undefined) setTodayEarnings(newTodayEarnings);
        if (newHistory) setHistory(newHistory);
        if (newWinners) setRecentWinners(newWinners);

        setIsDropping(false);

        // Win result
        const resultData = {
          wonCoins,
          multiplier,
          bucketIndex,
          betAmount,
        };
        setWinResult(resultData);

        // Celebration popup if multiplier >= 4X
        if (multiplier >= 4) {
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

        // Auto-drop handler
        setAutoDropsLeft((prev) => {
          const nextCount = prev > 1 ? prev - 1 : 0;
          if (nextCount > 0) {
            autoDropTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) handleDropBall();
            }, 1000);
          }
          return nextCount;
        });
      });
    } catch (err) {
      console.error('handleDropBall error:', err);
      setUserCoins(prevCoins);
      if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
      showToast(t(err.response?.data?.message || 'Drop request failed'), 'error');
      setIsDropping(false);
      setAutoDropsLeft(0);
    }
  };

  // Toggle Auto Drop
  const handleToggleAutoDrop = (count) => {
    if (autoDropsLeft > 0) {
      setAutoDropsLeft(0);
      if (autoDropTimerRef.current) clearTimeout(autoDropTimerRef.current);
      showToast(t('Auto-drop stopped'), 'info');
    } else {
      if (userCoins < betAmount) {
        showToast(t('Insufficient coins! Please recharge.'), 'error');
        return;
      }
      setAutoDropsLeft(count);
      showToast(t('Auto-drop started'), 'success');
      if (!isDropping) {
        handleDropBall();
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { paddingBottom: Math.max(16, insets.bottom) }]}>
          {/* Header Bar */}
          <LinearGradient
            colors={['#1E1B4B', '#0F0F1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBar}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🟡 PLINKO</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                <T>Plinko Drop</T>
              </Text>
            </View>

            {/* User Coin Balance Pill */}
            <TouchableOpacity
              style={styles.coinBalancePill}
              activeOpacity={0.75}
              onPress={onRechargePress}
            >
              <Text style={styles.coinBalanceIcon}>🪙</Text>
              <Text style={styles.coinBalanceText}>
                {userCoins.toLocaleString()}
              </Text>
              <View style={styles.rechargeBtn}>
                <Text style={styles.rechargeBtnText}>+</Text>
              </View>
            </TouchableOpacity>

            {/* Action Buttons: Help & Close */}
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
              <Text style={styles.subHeaderValue}>+{todayEarnings.toLocaleString()} 🪙</Text>
            </View>
            <View style={styles.subHeaderBadge}>
              <Text style={styles.subHeaderBadgeText}>🔥 UP TO 25X MULTIPLIER</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ ARENA: TRIANGULAR PEGBOARD ══ */}
            <View style={[styles.arenaCard, { width: boardWidth, height: boardHeight + 60 }]}>
              <LinearGradient
                colors={['#181534', '#0F0E24', '#090814']}
                style={StyleSheet.absoluteFill}
              />

              {/* Pegboard Decorative Triangle Glow Guide */}
              <View style={styles.pyramidGuide} />

              {/* Render Peg Pins in Triangular Rows */}
              {Array.from({ length: 8 }).map((_, rowIndex) => {
                const numPins = rowIndex + 3;
                const rowY = 24 + rowIndex * rowHeight;
                return (
                  <View key={`row_${rowIndex}`} style={[styles.pegRow, { top: rowY }]}>
                    {Array.from({ length: numPins }).map((_, pinIndex) => {
                      const pinOffset = (pinIndex - (numPins - 1) / 2) * colSpacing;
                      const pinX = centerX + pinOffset - 6;
                      return (
                        <View
                          key={`pin_${rowIndex}_${pinIndex}`}
                          style={[styles.pegPinContainer, { left: pinX }]}
                        >
                          <PlinkoPegPinGraphic size={12} />
                        </View>
                      );
                    })}
                  </View>
                );
              })}

              {/* Animated Dropping Golden Ball */}
              {ballVisible && (
                <Animated.View
                  style={[
                    styles.ballContainer,
                    {
                      transform: [
                        { translateX: ballXAnim },
                        { translateY: ballYAnim },
                        { scale: ballScaleAnim },
                      ],
                    },
                  ]}
                >
                  <GoldenPlinkoBallGraphic size={26} />
                </Animated.View>
              )}

              {/* 9 Multiplier Bucket Slots at Bottom */}
              <View style={[styles.bucketsContainer, { bottom: 10 }]}>
                {BUCKETS.map((bucket) => {
                  const isLanded = highlightedBucket === bucket.index;
                  return (
                    <Animated.View
                      key={`bucket_${bucket.index}`}
                      style={[
                        styles.bucketSlot,
                        {
                          backgroundColor: bucket.bg,
                          borderColor: bucket.border,
                        },
                        isLanded && [
                          styles.bucketSlotLanded,
                          {
                            backgroundColor: bucket.color,
                            transform: [{ scale: bucketPulse }],
                          },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.bucketSlotText,
                          { color: isLanded ? '#FFFFFF' : bucket.color },
                        ]}
                      >
                        {bucket.label}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            {/* ══ WIN OUTCOME STRIP ══ */}
            {winResult && (
              <View
                style={[
                  styles.winResultBanner,
                  winResult.multiplier >= 1
                    ? styles.winResultSuccess
                    : styles.winResultNeutral,
                ]}
              >
                <Text style={styles.winResultEmoji}>
                  {winResult.multiplier >= 10 ? '👑' : winResult.multiplier >= 4 ? '🎉' : winResult.multiplier >= 1 ? '✨' : '🛡️'}
                </Text>
                <View style={styles.winResultTextWrap}>
                  <Text style={styles.winResultTitle}>
                    {winResult.multiplier >= 25
                      ? t('25X GRAND JACKPOT!')
                      : winResult.multiplier >= 10
                      ? t('SUPER WIN!')
                      : winResult.multiplier >= 4
                      ? t('NICE WIN!')
                      : winResult.multiplier >= 1
                      ? t('PROFIT RETURN!')
                      : t('CONSOLATION RETURN')}
                  </Text>
                  <Text style={styles.winResultDetails}>
                    {winResult.label} • {t('Won')}{' '}
                    <Text style={styles.winCoinsHighlight}>
                      +{winResult.wonCoins.toLocaleString()} 🪙
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* ══ CONTROLS: CHIP SELECTOR & MULTIPLIERS ══ */}
            <View style={styles.controlsSection}>
              <View style={styles.controlsHeader}>
                <Text style={styles.controlsTitle}><T>Select Chip</T></Text>
                <Text style={styles.currentBetLabel}>
                  <T>Current Bet</T>:{' '}
                  <Text style={styles.currentBetValue}>{betAmount.toLocaleString()} 🪙</Text>
                </Text>
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
                      onPress={() => !isDropping && setBetAmount(chip)}
                      disabled={isDropping}
                    >
                      <Text style={[styles.chipBtnText, isSelected && styles.chipBtnTextActive]}>
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Multiplier Adjusters */}
              <View style={styles.multiplierAdjustRow}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  activeOpacity={0.75}
                  onPress={handleHalfBet}
                  disabled={isDropping}
                >
                  <Text style={styles.adjustBtnText}>1/2</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  activeOpacity={0.75}
                  onPress={handleDoubleBet}
                  disabled={isDropping}
                >
                  <Text style={styles.adjustBtnText}>2X</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.adjustBtn, styles.adjustBtnMax]}
                  activeOpacity={0.75}
                  onPress={handleMaxBet}
                  disabled={isDropping}
                >
                  <Text style={styles.adjustBtnTextMax}>MAX</Text>
                </TouchableOpacity>

                {/* Auto Drop Toggle */}
                <TouchableOpacity
                  style={[
                    styles.autoBtn,
                    autoDropsLeft > 0 && styles.autoBtnActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleToggleAutoDrop(10)}
                >
                  <Text
                    style={[
                      styles.autoBtnText,
                      autoDropsLeft > 0 && styles.autoBtnTextActive,
                    ]}
                  >
                    {autoDropsLeft > 0 ? `${t('STOP')} (${autoDropsLeft})` : t('Auto 10')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ══ BIG DROP BALL BUTTON ══ */}
            <Animated.View style={{ transform: [{ scale: isDropping ? 1 : dropBtnPulse }] }}>
              <TouchableOpacity
                style={[styles.dropBtn, isDropping && styles.dropBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleDropBall}
                disabled={isDropping}
              >
                <LinearGradient
                  colors={isDropping ? ['#4B5563', '#374151'] : ['#F59E0B', '#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dropBtnGradient}
                >
                  <Text style={styles.dropBtnIcon}>🟡</Text>
                  <Text style={styles.dropBtnText}>
                    {isDropping ? t('DROPPING...') : t('DROP BALL!')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ══ RECENT DROPS HISTORY BREADCRUMBS ══ */}
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}><T>Recent Drops</T></Text>
                <Text style={styles.historySub}><T>Last 15 results</T></Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {history.length === 0 ? (
                  <Text style={styles.emptyHistoryText}><T>No drops yet. Drop your first ball!</T></Text>
                ) : (
                  history.map((item, idx) => {
                    const bucket = BUCKETS[item.bucketIndex] || BUCKETS[4];
                    return (
                      <View
                        key={`hist_${item.roundId || idx}`}
                        style={[
                          styles.historyPill,
                          {
                            borderColor: bucket.border,
                            backgroundColor: bucket.bg,
                          },
                        ]}
                      >
                        <Text style={[styles.historyPillText, { color: bucket.color }]}>
                          {bucket.label}
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
                <Text style={styles.winnersTitle}><T>Top Plinko Masters</T></Text>
                {recentWinners.slice(0, 4).map((winner, idx) => (
                  <View key={`win_${idx}`} style={styles.winnerRow}>
                    <View style={styles.winnerLeft}>
                      <Text style={styles.winnerRank}>#{idx + 1}</Text>
                      <Text style={styles.winnerName}>{winner.name}</Text>
                    </View>
                    <View style={styles.winnerRight}>
                      <Text style={styles.winnerMultiplier}>{winner.multiplier}X</Text>
                      <Text style={styles.winnerAmount}>+{winner.amount.toLocaleString()} 🪙</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ══ CELEBRATION MODAL OVERLAY (4X - 25X BIG WINS) ══ */}
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
                colors={['rgba(245, 158, 11, 0.95)', 'rgba(180, 83, 9, 0.95)']}
                style={styles.celebrationCard}
              >
                <PlinkoJackpotCupIcon size={64} />
                <Text style={styles.celebrationHeader}>
                  {winResult.multiplier >= 25
                    ? t('25X JACKPOT DROP!')
                    : t('PLINKO DROP WINNER!')}
                </Text>
                <Text style={styles.celebrationSub}>
                  <T>Congratulations! You won</T>
                </Text>
                <Text style={styles.celebrationAmount}>
                  +{winResult.wonCoins.toLocaleString()} 🪙
                </Text>
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
                  colors={['#1E1B4B', '#0F0E24']}
                  style={styles.rulesHeader}
                >
                  <Text style={styles.rulesTitle}><T>Plinko Drop Rules</T></Text>
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
                    <T>2. Tap DROP BALL to release the golden ball down the pegboard pyramid.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>3. The ball bounces left and right across 8 rows of golden pins.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>4. The ball lands into one of 9 multiplier buckets at the bottom.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>5. You instantly win your bet multiplied by the bucket's multiplier!</T>
                  </Text>

                  <Text style={styles.rulesHeading}><T>Pockets & Multipliers</T></Text>
                  <View style={styles.rulesTable}>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#EF4444' }]}>25X</Text>
                      <Text style={styles.rulesTableDesc}><T>Grand Jackpot! Far edges (Slot 1 & 9)</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#F97316' }]}>10X</Text>
                      <Text style={styles.rulesTableDesc}><T>Super Win! Slots 2 & 8</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#F59E0B' }]}>4X</Text>
                      <Text style={styles.rulesTableDesc}><T>Big Win! Slots 3 & 7</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#10B981' }]}>1.5X</Text>
                      <Text style={styles.rulesTableDesc}><T>Profit Win! Slots 4 & 6</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#6366F1' }]}>0.5X</Text>
                      <Text style={styles.rulesTableDesc}><T>Consolation Return (Center Slot 5)</T></Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F0F1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  headerBadgeText: {
    color: '#FDE047',
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
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
    backgroundColor: '#F59E0B',
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
    backgroundColor: '#16152B',
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
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  subHeaderBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subHeaderBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  arenaCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  pyramidGuide: {
    position: 'absolute',
    top: 10,
    left: '15%',
    right: '15%',
    bottom: 45,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderStyle: 'dashed',
  },
  pegRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
  },
  pegPinContainer: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  ballContainer: {
    position: 'absolute',
    width: 26,
    height: 26,
    zIndex: 10,
  },
  bucketsContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 3,
  },
  bucketSlot: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketSlotLanded: {
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  bucketSlotText: {
    fontSize: 10,
    fontWeight: '900',
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
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  winResultNeutral: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: '#6366F1',
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
    backgroundColor: '#16152B',
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
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  chipBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipBtnTextActive: {
    color: '#FDE047',
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
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  autoBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  autoBtnText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '800',
  },
  autoBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dropBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
  },
  dropBtnDisabled: {
    opacity: 0.6,
  },
  dropBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  dropBtnIcon: {
    fontSize: 18,
  },
  dropBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  historyCard: {
    width: '100%',
    backgroundColor: '#16152B',
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
    backgroundColor: '#16152B',
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
    color: '#10B981',
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
    borderColor: '#FEF08A',
  },
  celebrationHeader: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  celebrationSub: {
    color: '#451A03',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  celebrationAmount: {
    color: '#000000',
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
    backgroundColor: '#0F0E24',
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
    color: '#FDE047',
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
    width: 60,
    fontSize: 13,
    fontWeight: '900',
  },
  rulesTableDesc: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
  },
});


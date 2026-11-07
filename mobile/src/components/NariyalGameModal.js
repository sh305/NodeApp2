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
  WholeGreenCoconutGraphic,
  CrackedGoldenPearlCoconutGraphic,
  CrackedMalaiCoconutGraphic,
  CrackedWaterCoconutGraphic,
  DryHuskCoconutGraphic,
  HeavyCoconutChopperGraphic,
} from './NariyalIcons';

const CHIPS = [100, 500, 1000, 5000, 10000, 25000];

const COCO_ITEMS = [
  { id: 'coco1', label: 'Coconut 1', sub: 'Left Coconut' },
  { id: 'coco2', label: 'Coconut 2', sub: 'Center Coconut' },
  { id: 'coco3', label: 'Coconut 3', sub: 'Right Coconut' },
];

export default function NariyalGameModal({
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
  const [isSmashing, setIsSmashing] = useState(false);

  // Bets on 3 coconuts
  const [bets, setBets] = useState({
    coco1: 0,
    coco2: 0,
    coco3: 0,
  });
  const [lastBets, setLastBets] = useState(null);

  // Round Results: { coco1: 'pearl' | 'malai' | 'water' | 'dry', ... }
  const [results, setResults] = useState(null);
  const [winResult, setWinResult] = useState(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Animations
  const chopperSwingAnim = useRef(new Animated.Value(0)).current;
  const cocoShakeAnim = useRef(new Animated.Value(0)).current;
  const smashBtnPulse = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);
  const isSmashingRef = useRef(isSmashing);
  isSmashingRef.current = isSmashing;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/nariyal/state');
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
      console.error('fetchGameState Nariyal error:', err);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      isMountedRef.current = true;
      fetchGameState();

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(smashBtnPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(smashBtnPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      return () => {
        isMountedRef.current = false;
        pulseLoop.stop();
      };
    }
  }, [visible, fetchGameState, smashBtnPulse]);

  // Total bet on all coconuts
  const totalBetAmount = (bets.coco1 || 0) + (bets.coco2 || 0) + (bets.coco3 || 0);

  // Place Bet on a Coconut
  const handlePlaceBet = (cocoKey) => {
    if (isSmashing) return;
    if (totalBetAmount + selectedChip > userCoins) {
      showToast(t('Insufficient coins! Please recharge.'), 'error');
      return;
    }
    setBets((prev) => ({
      ...prev,
      [cocoKey]: (prev[cocoKey] || 0) + selectedChip,
    }));
    try {
      Vibration.vibrate(20);
    } catch (e) {}
  };

  // Clear bets
  const handleClearBets = () => {
    if (isSmashing) return;
    setBets({ coco1: 0, coco2: 0, coco3: 0 });
  };

  // Re-bet previous bets
  const handleRebet = () => {
    if (isSmashing) return;
    if (!lastBets) {
      showToast(t('No previous bet to repeat'), 'info');
      return;
    }
    const prevTotal = (lastBets.coco1 || 0) + (lastBets.coco2 || 0) + (lastBets.coco3 || 0);
    if (prevTotal > userCoins) {
      showToast(t('Insufficient coins! Please recharge.'), 'error');
      return;
    }
    setBets({ ...lastBets });
  };

  // Double current bets
  const handleDoubleBets = () => {
    if (isSmashing || totalBetAmount === 0) return;
    if (totalBetAmount * 2 > userCoins) {
      showToast(t('Insufficient coins to double bet.'), 'error');
      return;
    }
    setBets((prev) => ({
      coco1: (prev.coco1 || 0) * 2,
      coco2: (prev.coco2 || 0) * 2,
      coco3: (prev.coco3 || 0) * 2,
    }));
  };

  // Run Smash Action
  const handleSmashCoconuts = async () => {
    if (isSmashingRef.current) return;
    if (totalBetAmount < 100) {
      showToast(t('Place at least 100 coins bet on any coconut!'), 'error');
      return;
    }
    if (userCoins < totalBetAmount) {
      showToast(t('Insufficient coins! Please recharge.'), 'error');
      return;
    }

    setIsSmashing(true);
    setResults(null);
    setWinResult(null);
    setLastBets({ ...bets });

    // Optimistically deduct bet
    const prevCoins = userCoins;
    const optimisticCoins = Math.max(0, userCoins - totalBetAmount);
    setUserCoins(optimisticCoins);
    if (onCoinBalanceUpdate) onCoinBalanceUpdate(optimisticCoins);

    // Chopper swing animation
    chopperSwingAnim.setValue(0);
    cocoShakeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(chopperSwingAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(chopperSwingAnim, {
          toValue: 2,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(cocoShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(cocoShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(cocoShakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(cocoShakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.timing(cocoShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    try {
      const res = await api.post('/games/nariyal/smash', { bets });
      if (!res.data?.success) {
        setUserCoins(prevCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
        showToast(t(res.data?.message || 'Smash failed'), 'error');
        setIsSmashing(false);
        return;
      }

      const {
        results: roundResults,
        pearlCoco,
        malaiCoco,
        wonCoins,
        spentCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        history: newHistory,
        recentWinners: newWinners,
      } = res.data;

      // Wait for chopper impact sound & animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setResults(roundResults);
        setUserCoins(remainingCoins);
        if (onCoinBalanceUpdate) onCoinBalanceUpdate(remainingCoins);
        if (newTodayEarnings !== undefined) setTodayEarnings(newTodayEarnings);
        if (newHistory) setHistory(newHistory);
        if (newWinners) setRecentWinners(newWinners);

        setIsSmashing(false);

        // Win result
        setWinResult({
          wonCoins,
          spentCoins,
          pearlCoco,
          malaiCoco,
          profit: wonCoins - spentCoins,
        });

        // Vibration
        try {
          Vibration.vibrate(wonCoins > spentCoins ? 100 : 40);
        } catch (e) {}

        // Big Win celebration if won >= 3X bet
        if (wonCoins >= spentCoins * 3 && wonCoins > 0) {
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
      }, 600);
    } catch (err) {
      console.error('handleSmashCoconuts error:', err);
      setUserCoins(prevCoins);
      if (onCoinBalanceUpdate) onCoinBalanceUpdate(prevCoins);
      showToast(t(err.response?.data?.message || 'Smash request failed'), 'error');
      setIsSmashing(false);
    }
  };

  // Render Coconut Graphic based on state
  const renderCoconut = (cocoId) => {
    if (!results) {
      return <WholeGreenCoconutGraphic size={86} />;
    }
    const outcome = results[cocoId];
    switch (outcome) {
      case 'pearl':
        return <CrackedGoldenPearlCoconutGraphic size={86} />;
      case 'malai':
        return <CrackedMalaiCoconutGraphic size={86} />;
      case 'water':
        return <CrackedWaterCoconutGraphic size={86} />;
      case 'dry':
      default:
        return <DryHuskCoconutGraphic size={86} />;
    }
  };

  // Chopper rotation interpolation
  const chopperRotate = chopperSwingAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '-45deg', '35deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            {
              height: Math.min(780, Math.floor(windowHeight * 0.88)),
              paddingBottom: Math.max(16, insets.bottom + 8),
            },
          ]}
        >
          {/* Header Bar */}
          <LinearGradient
            colors={['#064E3B', '#022C22', '#0A0F1D']}
            style={styles.headerBar}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>🥥 NARIYAL</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                <T>Nariyal Phodo</T>
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
              <Text style={styles.subHeaderValue}>+{todayEarnings.toLocaleString()} 🪙</Text>
            </View>
            <View style={styles.subHeaderBadge}>
              <Text style={styles.subHeaderBadgeText}>💎 20X GOLDEN PEARL</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ══ ARENA: TROPICAL WOODEN COCONUT STALL ══ */}
            <View style={styles.arenaCard}>
              <LinearGradient
                colors={['#0F2D1F', '#091E14', '#04100B']}
                style={StyleSheet.absoluteFill}
              />

              {/* Wooden Cutting Block Base */}
              <View style={styles.woodenLogBase}>
                <LinearGradient
                  colors={['#78350F', '#451A03', '#291102']}
                  style={styles.woodenLogGradient}
                />
              </View>

              {/* Animated Floating Chopper */}
              {isSmashing && (
                <Animated.View
                  style={[
                    styles.chopperContainer,
                    {
                      transform: [
                        { rotate: chopperRotate },
                        { translateY: chopperSwingAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [-20, -40, 20] }) },
                      ],
                    },
                  ]}
                >
                  <HeavyCoconutChopperGraphic size={64} />
                </Animated.View>
              )}

              {/* 3 Interactive Coconuts */}
              <Animated.View
                style={[
                  styles.cocosRow,
                  { transform: [{ translateX: cocoShakeAnim }] },
                ]}
              >
                {COCO_ITEMS.map((coco) => {
                  const betOnThis = bets[coco.id] || 0;
                  const outcome = results ? results[coco.id] : null;

                  return (
                    <TouchableOpacity
                      key={coco.id}
                      style={[
                        styles.cocoItemWrap,
                        betOnThis > 0 && styles.cocoItemWrapActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handlePlaceBet(coco.id)}
                      disabled={isSmashing}
                    >
                      {/* Bet Badge On Coconut */}
                      {betOnThis > 0 && (
                        <View style={styles.betPill}>
                          <Text style={styles.betPillText}>
                            {betOnThis >= 1000 ? `${betOnThis / 1000}k` : betOnThis} 🪙
                          </Text>
                        </View>
                      )}

                      {/* Coconut Graphic */}
                      <View style={styles.cocoGraphicContainer}>
                        {renderCoconut(coco.id)}
                      </View>

                      {/* Outcome Tag Badge */}
                      {outcome ? (
                        <View
                          style={[
                            styles.outcomeBadge,
                            outcome === 'pearl'
                              ? styles.outcomePearl
                              : outcome === 'malai'
                              ? styles.outcomeMalai
                              : outcome === 'water'
                              ? styles.outcomeWater
                              : styles.outcomeDry,
                          ]}
                        >
                          <Text style={styles.outcomeBadgeText}>
                            {outcome === 'pearl'
                              ? '💎 20X PEARL'
                              : outcome === 'malai'
                              ? '🥥 5X MALAI'
                              : outcome === 'water'
                              ? '💦 2.5X WATER'
                              : '🍂 0X DRY'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.cocoLabelPill}>
                          <Text style={styles.cocoLabelText}><T>{coco.label}</T></Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
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
                  {winResult.profit > 0 ? '🎉' : winResult.wonCoins > 0 ? '✨' : '🥥'}
                </Text>
                <View style={styles.winResultTextWrap}>
                  <Text style={styles.winResultTitle}>
                    {winResult.profit > 0
                      ? t('NARIYAL PHODO WINNER!')
                      : winResult.wonCoins > 0
                      ? t('PARTIAL RETURN!')
                      : t('BETTER LUCK NEXT SMASH!')}
                  </Text>
                  <Text style={styles.winResultDetails}>
                    <T>Won</T>{' '}
                    <Text style={styles.winCoinsHighlight}>
                      +{winResult.wonCoins.toLocaleString()} 🪙
                    </Text>
                    {' • '}<T>Bet</T>: {winResult.spentCoins.toLocaleString()} 🪙
                  </Text>
                </View>
              </View>
            )}

            {/* ══ CONTROLS: CHIP SELECTOR & ACTIONS ══ */}
            <View style={styles.controlsSection}>
              <View style={styles.controlsHeader}>
                <Text style={styles.controlsTitle}><T>Select Chip & Tap Coconut</T></Text>
                <Text style={styles.currentBetLabel}>
                  <T>Total Bet</T>:{' '}
                  <Text style={styles.currentBetValue}>{totalBetAmount.toLocaleString()} 🪙</Text>
                </Text>
              </View>

              {/* Chips Row */}
              <View style={styles.chipsRow}>
                {CHIPS.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <TouchableOpacity
                      key={`chip_${chip}`}
                      style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedChip(chip)}
                      disabled={isSmashing}
                    >
                      <Text style={[styles.chipBtnText, isSelected && styles.chipBtnTextActive]}>
                        {chip >= 1000 ? `${chip / 1000}k` : chip}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Action Adjusters */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                  onPress={handleClearBets}
                  disabled={isSmashing || totalBetAmount === 0}
                >
                  <Text style={styles.actionBtnText}><T>Clear</T></Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.75}
                  onPress={handleRebet}
                  disabled={isSmashing}
                >
                  <Text style={styles.actionBtnText}><T>Re-Bet</T></Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDouble]}
                  activeOpacity={0.75}
                  onPress={handleDoubleBets}
                  disabled={isSmashing || totalBetAmount === 0}
                >
                  <Text style={styles.actionBtnTextDouble}>2X</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ══ BIG SMASH COCONUT BUTTON ══ */}
            <Animated.View style={{ transform: [{ scale: isSmashing ? 1 : smashBtnPulse }] }}>
              <TouchableOpacity
                style={[styles.smashBtn, isSmashing && styles.smashBtnDisabled]}
                activeOpacity={0.75}
                onPress={handleSmashCoconuts}
                disabled={isSmashing}
              >
                <LinearGradient
                  colors={isSmashing ? ['#4B5563', '#374151'] : ['#10B981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.smashBtnGradient}
                >
                  <Text style={styles.smashBtnIcon}>🥥</Text>
                  <Text style={styles.smashBtnText}>
                    {isSmashing ? t('SMASHING...') : t('SMASH COCONUT!')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ══ RECENT DROPS HISTORY BREADCRUMBS ══ */}
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}><T>Recent Smashes</T></Text>
                <Text style={styles.historySub}><T>Last 15 rounds</T></Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
                {history.length === 0 ? (
                  <Text style={styles.emptyHistoryText}><T>No smashes yet. Smash your first coconut!</T></Text>
                ) : (
                  history.map((item, idx) => (
                    <View key={`hist_${item.roundId || idx}`} style={styles.historyPill}>
                      <Text style={styles.historyPillText}>
                        {item.pearlCoco ? '💎 20X' : '🥥 5X'}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* ══ TOP WINNERS TICKER ══ */}
            {recentWinners.length > 0 && (
              <View style={styles.winnersCard}>
                <Text style={styles.winnersTitle}><T>Top Coconut Masters</T></Text>
                {recentWinners.slice(0, 4).map((winner, idx) => (
                  <View key={`win_${idx}`} style={styles.winnerRow}>
                    <View style={styles.winnerLeft}>
                      <Text style={styles.winnerRank}>#{idx + 1}</Text>
                      <Text style={styles.winnerName}>{winner.name}</Text>
                    </View>
                    <View style={styles.winnerRight}>
                      <Text style={styles.winnerPrizeBadge}>
                        {winner.prize === 'pearl' ? '💎 20X PEARL' : '🥥 5X MALAI'}
                      </Text>
                      <Text style={styles.winnerAmount}>+{winner.amount.toLocaleString()} 🪙</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* ══ CELEBRATION MODAL OVERLAY (5X - 20X WINS) ══ */}
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
                colors={['rgba(16, 185, 129, 0.95)', 'rgba(4, 120, 87, 0.95)']}
                style={styles.celebrationCard}
              >
                <WholeGreenCoconutGraphic size={64} />
                <Text style={styles.celebrationHeader}>
                  {winResult.pearlCoco ? t('20X GOLDEN PEARL JACKPOT!') : t('5X MALAI MEGA WIN!')}
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
                  colors={['#064E3B', '#022C22']}
                  style={styles.rulesHeader}
                >
                  <Text style={styles.rulesTitle}><T>Nariyal Phodo Rules</T></Text>
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
                    <T>1. Select a coin chip from the bottom bar (min 100 coins).</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>2. Tap Coconut 1, Coconut 2, or Coconut 3 to place your bet.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>3. Tap SMASH COCONUT! to strike the coconuts with the wooden chopper.</T>
                  </Text>
                  <Text style={styles.rulesPara}>
                    <T>4. The coconuts crack open with splashing water to reveal treasures!</T>
                  </Text>

                  <Text style={styles.rulesHeading}><T>Treasures & Multipliers</T></Text>
                  <View style={styles.rulesTable}>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#FDE047' }]}>20X</Text>
                      <Text style={styles.rulesTableDesc}><T>💎 Golden Pearl: Super Grand Jackpot!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#34D399' }]}>5X</Text>
                      <Text style={styles.rulesTableDesc}><T>🥥 Creamy Malai: Big Sweet Win!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#38BDF8' }]}>2.5X</Text>
                      <Text style={styles.rulesTableDesc}><T>💦 Sweet Water: Fresh Splash Win!</T></Text>
                    </View>
                    <View style={styles.rulesTableRow}>
                      <Text style={[styles.rulesTableCol, { color: '#94A3B8' }]}>0X</Text>
                      <Text style={styles.rulesTableDesc}><T>🍂 Dry Shell: Empty dry shell.</T></Text>
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
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#059669',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.3)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  headerBadgeText: {
    color: '#34D399',
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
    borderColor: 'rgba(16, 185, 129, 0.3)',
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
    backgroundColor: '#10B981',
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
    backgroundColor: '#062E1C',
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
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  subHeaderBadge: {
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    overflow: 'hidden',
    position: 'relative',
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 16,
  },
  woodenLogBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
  },
  woodenLogGradient: {
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: '#92400E',
  },
  chopperContainer: {
    position: 'absolute',
    top: 10,
    right: '35%',
    zIndex: 20,
  },
  cocosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  cocoItemWrap: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cocoItemWrapActive: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  betPill: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  betPillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  cocoGraphicContainer: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocoLabelPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cocoLabelText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
  },
  outcomePearl: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
    borderColor: '#EF4444',
  },
  outcomeMalai: {
    backgroundColor: 'rgba(234, 88, 12, 0.3)',
    borderColor: '#F97316',
  },
  outcomeWater: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
    borderColor: '#38BDF8',
  },
  outcomeDry: {
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    borderColor: '#64748B',
  },
  outcomeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
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
    backgroundColor: '#111827',
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
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10B981',
  },
  chipBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipBtnTextActive: {
    color: '#34D399',
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDouble: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  actionBtnTextDouble: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  smashBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 6,
  },
  smashBtnDisabled: {
    opacity: 0.6,
  },
  smashBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  smashBtnIcon: {
    fontSize: 20,
  },
  smashBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  historyCard: {
    width: '100%',
    backgroundColor: '#111827',
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
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginRight: 6,
  },
  historyPillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  winnersCard: {
    width: '100%',
    backgroundColor: '#111827',
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
  winnerPrizeBadge: {
    color: '#34D399',
    fontSize: 10.5,
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
    borderColor: '#34D399',
  },
  celebrationHeader: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  celebrationSub: {
    color: '#D1FAE5',
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
    backgroundColor: '#0F1D15',
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
    color: '#34D399',
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


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
  ClownfishIcon,
  PufferfishIcon,
  OctopusIcon,
  TurtleIcon,
  SharkIcon,
  MermaidIcon,
  KrakenIcon,
  GoldenDragonIcon,
  TridentIcon,
  SubmarineRadarIcon,
} from './OceanKingIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 8 Ocean Creatures Configuration
const OCEAN_CREATURES = [
  { id: 'clownfish', name: 'Clownfish', multiplier: 2, icon: ClownfishIcon, color: '#FB923C', tier: 'safe', emoji: '🐠' },
  { id: 'pufferfish', name: 'Pufferfish', multiplier: 4, icon: PufferfishIcon, color: '#FACC15', tier: 'safe', emoji: '🐡' },
  { id: 'octopus', name: 'Electric Octopus', multiplier: 8, icon: OctopusIcon, color: '#A855F7', tier: 'safe', emoji: '🐙' },
  { id: 'turtle', name: 'Sea Turtle', multiplier: 15, icon: TurtleIcon, color: '#10B981', tier: 'mid', emoji: '🐢' },
  { id: 'shark', name: 'Hammerhead', multiplier: 30, icon: SharkIcon, color: '#0EA5E9', tier: 'mid', emoji: '🦈' },
  { id: 'mermaid', name: 'Deep Mermaid', multiplier: 60, icon: MermaidIcon, color: '#EC4899', tier: 'high', emoji: '🧜‍♀️' },
  { id: 'kraken', name: 'Mega Kraken', multiplier: 120, icon: KrakenIcon, color: '#8B5CF6', tier: 'high', emoji: '🦑' },
  { id: 'dragon_king', name: 'Dragon King', multiplier: 300, icon: GoldenDragonIcon, color: '#F59E0B', tier: 'jackpot', emoji: '🐉' },
];

const CHIP_VALUES = [10, 50, 100, 1000, 10000];

export default function OceanKingGameModal({
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

  // Betting & Round State
  const [countdown, setCountdown] = useState(15);
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'FIRING' | 'RESULT'
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { [creatureId]: amount }
  const betsRef = useRef(bets);
  betsRef.current = bets;

  const [lastBets, setLastBets] = useState(null);
  const [isFiring, setIsFiring] = useState(false);
  const [activeRadarTarget, setActiveRadarTarget] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentWinners, setRecentWinners] = useState([
    'clownfish',
    'shark',
    'turtle',
    'pufferfish',
    'dragon_king',
    'mermaid',
    'octopus',
  ]);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [tridentSurgeActive, setTridentSurgeActive] = useState(1);

  // Result Dialog
  const [winResult, setWinResult] = useState(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarSweepAnim = useRef(new Animated.Value(0)).current;
  const sonarFlashAnim = useRef(new Animated.Value(0)).current;
  const tridentGlowAnim = useRef(new Animated.Value(0)).current;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/ocean-king/state');
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
      setIsFiring(false);
      setTridentSurgeActive(1);
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
        Vibration.vibrate(30);
      }
    }
  }, [countdown, gamePhase, pulseAnim, soundEnabled]);

  // Sonar Radar Sweep Continuous Animation
  useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.timing(radarSweepAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    sweepLoop.start();
    return () => sweepLoop.stop();
  }, [radarSweepAnim]);

  // Total bet calculation
  const totalBetAmount = Object.values(bets).reduce((sum, val) => sum + (Number(val) || 0), 0);

  // Place bet on a sea creature
  const handlePlaceBet = (creatureId) => {
    if (gamePhase !== 'BETTING' || isFiring) return;

    if (userCoins < selectedChip) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    setUserCoins((prev) => prev - selectedChip);
    onCoinBalanceUpdate?.(userCoins - selectedChip);

    setBets((prev) => ({
      ...prev,
      [creatureId]: (prev[creatureId] || 0) + selectedChip,
    }));

    if (soundEnabled && Platform.OS === 'android') {
      Vibration.vibrate(15);
    }
  };

  // Clear current round bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING' || isFiring || totalBetAmount === 0) return;
    setUserCoins((prev) => prev + totalBetAmount);
    onCoinBalanceUpdate?.(userCoins + totalBetAmount);
    setBets({});
    showToast(t('Bets cleared! Coins refunded.'), 'info');
  };

  // Rebet previous bets
  const handleRebet = () => {
    if (gamePhase !== 'BETTING' || isFiring || !lastBets) return;

    const rebetTotal = Object.values(lastBets).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (rebetTotal === 0) return;

    if (userCoins < rebetTotal) {
      showToast(t('Insufficient coins for Rebet'), 'error');
      return;
    }

    setUserCoins((prev) => prev - rebetTotal);
    onCoinBalanceUpdate?.(userCoins - rebetTotal);
    setBets({ ...lastBets });
    showToast(t('Previous bets placed!'), 'success');
  };

  // Max bet distributed across creatures
  const handleMaxBet = () => {
    if (gamePhase !== 'BETTING' || isFiring) return;
    const affordable = [...CHIP_VALUES].reverse().find((c) => userCoins >= c) || CHIP_VALUES[0];
    setSelectedChip(affordable);
    showToast(`${t('Max Chip Set')}: ${affordable.toLocaleString()} 🪙`, 'info');
  };

  // Sonar targeting animation loop
  const runSonarTargetingAnimation = (winnerIndex, onComplete) => {
    let currentIdx = 0;
    let stepCount = 0;
    const totalSteps = 24 + winnerIndex;
    let currentDelay = 50;

    const step = () => {
      currentIdx = (currentIdx + 1) % OCEAN_CREATURES.length;
      setActiveRadarTarget(currentIdx);
      stepCount++;

      if (soundEnabled && Platform.OS === 'android' && stepCount % 2 === 0) {
        Vibration.vibrate(10);
      }

      if (stepCount >= totalSteps) {
        setActiveRadarTarget(winnerIndex);
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

  // Fire Cannon & Execute Round
  const handleFireCannon = useCallback(async () => {
    if (isFiring || gamePhase !== 'BETTING') return;

    const currentTotal = Object.values(betsRef.current).reduce((sum, v) => sum + (Number(v) || 0), 0);

    if (currentTotal === 0) {
      // Auto-simulate round if no bets placed
      setGamePhase('FIRING');
      setIsFiring(true);
      const randomWinnerIndex = Math.floor(Math.random() * OCEAN_CREATURES.length);
      const winnerCreature = OCEAN_CREATURES[randomWinnerIndex];

      runSonarTargetingAnimation(randomWinnerIndex, () => {
        setRecentWinners((prev) => [winnerCreature.id, ...prev.slice(0, 9)]);
        setGamePhase('RESULT');

        setTimeout(() => {
          setCountdown(15);
          setIsFiring(false);
          setGamePhase('BETTING');
          setTridentSurgeActive(1);
        }, 3200);
      });
      return;
    }

    try {
      setIsFiring(true);
      setGamePhase('FIRING');
      setLastBets({ ...betsRef.current });

      const res = await api.post('/games/ocean-king/play', { bets: betsRef.current });
      if (!res.data?.success) {
        showToast(t(res.data?.message || 'Failed to fire cannon'), 'error');
        setIsFiring(false);
        setGamePhase('BETTING');
        return;
      }

      const {
        winningCreature,
        tridentSurge,
        surgeMultiplier,
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

      const targetIndex = OCEAN_CREATURES.findIndex((c) => c.id === winningCreature.id);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      runSonarTargetingAnimation(safeIndex, () => {
        setGamePhase('RESULT');

        if (tridentSurge && surgeMultiplier > 1) {
          setTridentSurgeActive(surgeMultiplier);
          Animated.sequence([
            Animated.timing(tridentGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(tridentGlowAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
            Animated.timing(tridentGlowAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();
        }

        if (newHistory?.length) {
          setRecentWinners(newHistory);
        } else {
          setRecentWinners((prev) => [winningCreature.id, ...prev.slice(0, 9)]);
        }

        const userWon = wonCoins > 0;
        setWinResult({
          won: userWon,
          creature: OCEAN_CREATURES[safeIndex],
          effectiveMultiplier,
          wonCoins,
          spentCoins: currentTotal,
          tridentSurge,
          surgeMultiplier,
        });

        if (userWon && soundEnabled && Platform.OS === 'android') {
          Vibration.vibrate([0, 100, 50, 200]);
        }

        setTimeout(() => {
          setCountdown(15);
          setIsFiring(false);
          setGamePhase('BETTING');
          setBets({});
          setTridentSurgeActive(1);
        }, userWon ? 3800 : 2500);
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Round execution error';
      showToast(t(msg), 'error');
      setIsFiring(false);
      setGamePhase('BETTING');
    }
  }, [isFiring, gamePhase, t, showToast, onCoinBalanceUpdate, soundEnabled, tridentGlowAnim]);

  // 15-Second Master Countdown Loop
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING' && !isFiring) {
            handleFireCannon();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, gamePhase, isFiring, handleFireCannon]);

  if (!visible) return null;

  const currentTargetCreature = OCEAN_CREATURES[activeRadarTarget] || OCEAN_CREATURES[0];
  const TargetIconComp = currentTargetCreature.icon;

  const sweepRotate = radarSweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
                <SubmarineRadarIcon size={34} />
              </View>
              <View style={styles.headerTextGroup}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>
                    <T>Ocean King</T>
                  </Text>
                  <View style={styles.jackpotBadge}>
                    <Text style={styles.jackpotBadgeText}>300X LEVIATHAN</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>
                  <T>Fishing Frenzy • Deep Sea Harpoon</T>
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Rules / Paytable Button */}
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.75}
                onPress={() => setRulesVisible(true)}
              >
                <Text style={styles.iconBtnText}>📜</Text>
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

          {/* ══ SUBMARINE RADAR / SONAR WINDOW ══ */}
          <View style={styles.radarWindowArea}>
            <LinearGradient
              colors={['#04101E', '#06283D', '#021626']}
              style={styles.radarWindowGradient}
            >
              {/* Top Status Strip */}
              <View style={styles.radarStatusStrip}>
                {tridentSurgeActive > 1 ? (
                  <Animated.View style={[styles.tridentSurgeBanner, { opacity: tridentGlowAnim }]}>
                    <Text style={styles.tridentSurgeText}>
                      🔱 TRIDENT SURGE: {tridentSurgeActive}X BOOST! 🔱
                    </Text>
                  </Animated.View>
                ) : gamePhase === 'FIRING' ? (
                  <View style={styles.firingStatusPill}>
                    <Text style={styles.firingStatusText}>⚡ HARPOON CANNON FIRING! ⚡</Text>
                  </View>
                ) : (
                  <View style={styles.scanningStatusPill}>
                    <Text style={styles.scanningStatusText}>🌊 DEEP SEA SONAR SCANNING 🌊</Text>
                  </View>
                )}
              </View>

              {/* Center Radar Scanner Display */}
              <View style={styles.sonarCenterBox}>
                {/* Rotating Sweep Beam */}
                <Animated.View
                  style={[
                    styles.radarSweepRay,
                    { transform: [{ rotate: sweepRotate }] },
                  ]}
                />

                {/* Target Creature Icon */}
                <View style={styles.targetIconContainer}>
                  <TargetIconComp size={64} />
                  <Text style={[styles.targetNameText, { color: currentTargetCreature.color }]}>
                    {currentTargetCreature.name} ({currentTargetCreature.multiplier}X)
                  </Text>
                </View>

                {/* Crosshairs & Grid rings */}
                <View style={styles.crosshairH} />
                <View style={styles.crosshairV} />
                <View style={styles.radarRingOuter} />
                <View style={styles.radarRingInner} />
              </View>

              {/* Countdown Pill Indicator */}
              <Animated.View style={[styles.countdownBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.countdownLabel}>
                  {gamePhase === 'BETTING' ? `⏳ ${countdown}s` : `🎯 LOCK`}
                </Text>
              </Animated.View>
            </LinearGradient>
          </View>

          {/* ══ 8-CREATURE BETTING GRID (4x2) ══ */}
          <View style={styles.bettingGridContainer}>
            <View style={styles.gridRow}>
              {OCEAN_CREATURES.slice(0, 4).map((creature, index) => {
                const CreatureIcon = creature.icon;
                const betOnIt = bets[creature.id] || 0;
                const isHighlighted = activeRadarTarget === index;
                return (
                  <TouchableOpacity
                    key={creature.id}
                    style={[
                      styles.creatureCard,
                      { borderColor: creature.color },
                      isHighlighted && styles.creatureCardHighlighted,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handlePlaceBet(creature.id)}
                    disabled={gamePhase !== 'BETTING' || isFiring}
                  >
                    <View style={styles.creatureCardIconWrap}>
                      <CreatureIcon size={34} />
                    </View>
                    <Text style={styles.creatureCardName} numberOfLines={1}>
                      {creature.name}
                    </Text>
                    <Text style={[styles.creatureCardMult, { color: creature.color }]}>
                      {creature.multiplier}X
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
              {OCEAN_CREATURES.slice(4, 8).map((creature, index) => {
                const actualIdx = index + 4;
                const CreatureIcon = creature.icon;
                const betOnIt = bets[creature.id] || 0;
                const isHighlighted = activeRadarTarget === actualIdx;
                return (
                  <TouchableOpacity
                    key={creature.id}
                    style={[
                      styles.creatureCard,
                      { borderColor: creature.color },
                      isHighlighted && styles.creatureCardHighlighted,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handlePlaceBet(creature.id)}
                    disabled={gamePhase !== 'BETTING' || isFiring}
                  >
                    <View style={styles.creatureCardIconWrap}>
                      <CreatureIcon size={34} />
                    </View>
                    <Text style={styles.creatureCardName} numberOfLines={1}>
                      {creature.name}
                    </Text>
                    <Text style={[styles.creatureCardMult, { color: creature.color }]}>
                      {creature.multiplier}X
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

          {/* ══ RECENT CATCHES RECORD ══ */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyLabel}><T>Recent</T>:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {recentWinners.map((creatureId, index) => {
                const c = OCEAN_CREATURES.find((item) => item.id === creatureId);
                if (!c) return null;
                const CIcon = c.icon;
                const isLatest = index === 0;
                return (
                  <View
                    key={`${creatureId}-${index}`}
                    style={[
                      styles.historyBadge,
                      { borderColor: c.color },
                      isLatest && styles.historyBadgeLatest,
                    ]}
                  >
                    <View style={styles.historyBadgeIconWrap}>
                      <CIcon size={20} />
                    </View>
                    <View style={styles.historyBadgeInfo}>
                      <Text style={styles.historyBadgeName} numberOfLines={1}>
                        {c.name.replace('Electric ', '').replace('Deep Sea ', '').replace('Golden ', '').replace('Hammerhead', 'Shark')}
                      </Text>
                      <Text style={[styles.historyBadgeMult, { color: c.color }]}>
                        {c.multiplier}X
                      </Text>
                    </View>
                    {isLatest && <View style={styles.latestDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ FOOTER CONTROLS ══ */}
          <View style={styles.footerControls}>
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
                  disabled={gamePhase !== 'BETTING' || isFiring}
                >
                  <ShinyCoinIcon size={14} />
                  <Text style={[styles.chipText, selectedChip === chip && styles.chipTextSelected]}>
                    {chip >= 1000 ? `${chip / 1000}K` : chip}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Clear Button */}
              <TouchableOpacity
                style={styles.utilityBtn}
                activeOpacity={0.75}
                onPress={handleClearBets}
                disabled={gamePhase !== 'BETTING' || isFiring || totalBetAmount === 0}
              >
                <Text style={styles.utilityBtnText}>🗑️</Text>
              </TouchableOpacity>

              {/* Rebet Button */}
              <TouchableOpacity
                style={styles.utilityBtn}
                activeOpacity={0.75}
                onPress={handleRebet}
                disabled={gamePhase !== 'BETTING' || isFiring || !lastBets}
              >
                <Text style={styles.utilityBtnText}>🔁</Text>
              </TouchableOpacity>

              {/* Max Bet Button */}
              <TouchableOpacity
                style={styles.utilityBtn}
                activeOpacity={0.75}
                onPress={handleMaxBet}
                disabled={gamePhase !== 'BETTING' || isFiring}
              >
                <Text style={styles.utilityBtnText}>⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Launch / Fire Cannon Action Button */}
            <TouchableOpacity
              style={[
                styles.fireCannonBtn,
                (isFiring || gamePhase !== 'BETTING') && styles.fireCannonBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleFireCannon}
              disabled={isFiring || gamePhase !== 'BETTING'}
            >
              <LinearGradient
                colors={
                  isFiring
                    ? ['#475569', '#334155']
                    : ['#0077B6', '#0096C7', '#00B4D8', '#48CAE4']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fireGradient}
              >
                <Text style={styles.fireBtnText}>
                  {isFiring
                    ? `⚡ ${t('LOCKING TARGET...')}`
                    : totalBetAmount > 0
                    ? `🔱 ${t('FIRE NET CANNON')} (${totalBetAmount.toLocaleString()} 🪙)`
                    : `🔱 ${t('CATCH NOW')} (15s)`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
                      ? ['#04203A', '#064E3B', '#022C22']
                      : ['#1E1B4B', '#0F172A', '#020617']
                  }
                  style={styles.winDialogGradient}
                >
                  <Text style={styles.winBigTitle}>
                    {winResult.won
                      ? winResult.tridentSurge
                        ? `🔱 ${t('TRIDENT MEGA SURGE!')} 🔱`
                        : `🎉 ${t('CREATURE CAUGHT!')} 🎉`
                      : `🌊 ${t('TARGET ESCAPED')} 🌊`}
                  </Text>

                  {/* Creature Icon */}
                  <View style={styles.winCreatureIconWrap}>
                    <winResult.creature.icon size={68} />
                  </View>

                  <Text style={[styles.winCreatureName, { color: winResult.creature.color }]}>
                    {winResult.creature.name}
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
                      <T>Better luck on the next cast!</T>
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
              <Text style={styles.rulesTitle}>🔱 <T>Ocean King Paytable & Rules</T></Text>
              <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.rulesSubheading}>⚡ <T>Dynamic Special Features</T>:</Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#00F5D4', fontWeight: 'bold' }}>Poseidon's Trident Surge</Text>: During target capture, the Trident can randomly strike the water, granting an instant <Text style={{ color: '#FEF08A', fontWeight: 'bold' }}>2X or 3X Multiplier Surge</Text> to the caught sea creature!
                </Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Leviathan Grand Jackpot</Text>: Catching the Golden Dragon King yields a colossal <Text style={{ color: '#FDE047', fontWeight: 'bold' }}>300X Payout</Text>!
                </Text>

                <Text style={styles.rulesSubheading}>🏆 <T>Creature Catch Multipliers</T>:</Text>
                {OCEAN_CREATURES.map((c) => {
                  const IconComp = c.icon;
                  return (
                    <View key={c.id} style={styles.paytableItemRow}>
                      <View style={styles.paytableItemLeft}>
                        <IconComp size={28} />
                        <Text style={styles.paytableItemName}>{c.name}</Text>
                      </View>
                      <Text style={[styles.paytableItemMult, { color: c.color }]}>{c.multiplier}X</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#04101E',
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
    borderBottomColor: '#0A2540',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginRight: 10,
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#00F5D4',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  jackpotBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 8,
  },
  jackpotBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  headerSub: {
    color: '#38BDF8',
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#0A2540',
    borderRadius: 14,
    marginLeft: 6,
  },
  iconBtnText: {
    fontSize: 14,
  },
  closeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#2D1414',
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
    backgroundColor: '#03192B',
  },
  coinBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A2540',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  coinBalanceText: {
    color: '#FEF08A',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
    marginRight: 8,
  },
  rechargeBtn: {
    backgroundColor: '#00B4D8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  radarWindowArea: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  radarWindowGradient: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  radarStatusStrip: {
    minHeight: 26,
    justifyContent: 'center',
    marginBottom: 6,
  },
  scanningStatusPill: {
    backgroundColor: '#06283D',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00B4D8',
  },
  scanningStatusText: {
    color: '#00F5D4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  firingStatusPill: {
    backgroundColor: '#0C4A6E',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  firingStatusText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
  },
  tridentSurgeBanner: {
    backgroundColor: '#78350F',
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  tridentSurgeText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
  },
  sonarCenterBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#02182B',
    borderWidth: 2,
    borderColor: '#00F5D4',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  radarSweepRay: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderRightWidth: 70,
    borderRightColor: 'rgba(0, 245, 212, 0.25)',
    borderTopWidth: 70,
    borderTopColor: 'transparent',
    borderLeftWidth: 70,
    borderLeftColor: 'transparent',
    borderBottomWidth: 70,
    borderBottomColor: 'transparent',
  },
  targetIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  targetNameText: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  crosshairH: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 245, 212, 0.35)',
  },
  crosshairV: {
    position: 'absolute',
    left: 70,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0, 245, 212, 0.35)',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.25)',
  },
  radarRingInner: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
  },
  countdownBadge: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: '#0369A1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  countdownLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  bettingGridContainer: {
    marginHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  creatureCard: {
    flex: 1,
    backgroundColor: '#062038',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
    minHeight: 74,
  },
  creatureCardHighlighted: {
    backgroundColor: '#0C4A6E',
    transform: [{ scale: 1.04 }],
  },
  creatureCardIconWrap: {
    marginBottom: 2,
  },
  creatureCardName: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  creatureCardMult: {
    fontSize: 9.5,
    fontWeight: '900',
    marginTop: 1,
  },
  betBadgeOnCard: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  betBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    backgroundColor: '#041B2D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  historyLabel: {
    color: '#38BDF8',
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
    backgroundColor: '#06283D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  historyBadgeLatest: {
    backgroundColor: '#0C4A6E',
  },
  historyBadgeIconWrap: {
    width: 20,
    height: 20,
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
  footerControls: {
    backgroundColor: '#031422',
    borderTopWidth: 1,
    borderTopColor: '#0A2540',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    marginTop: 'auto',
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
    backgroundColor: '#08253E',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  chipBtnSelected: {
    backgroundColor: '#0369A1',
    borderColor: '#00F5D4',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  chipTextSelected: {
    color: '#00F5D4',
    fontWeight: '900',
  },
  utilityBtn: {
    backgroundColor: '#0C2D4A',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  utilityBtnText: {
    fontSize: 12,
  },
  fireCannonBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fireCannonBtnDisabled: {
    opacity: 0.6,
  },
  fireGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    borderColor: '#00F5D4',
  },
  winDialogGradient: {
    padding: 22,
    alignItems: 'center',
  },
  winBigTitle: {
    color: '#FEF08A',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  winCreatureIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  winCreatureName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winMultiplierTag: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 12,
  },
  winCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2C45',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 16,
  },
  winCoinsText: {
    color: '#FEF08A',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  winLostText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 16,
  },
  collectBtn: {
    backgroundColor: '#00B4D8',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  collectBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '90%',
    maxWidth: 360,
    maxHeight: '75%',
    backgroundColor: '#041B2D',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  rulesTitle: {
    color: '#00F5D4',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesScroll: {
    marginBottom: 12,
  },
  rulesSubheading: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
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
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#0A2540',
  },
  paytableItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paytableItemName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  paytableItemMult: {
    fontSize: 11,
    fontWeight: '900',
  },
  closeRulesBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

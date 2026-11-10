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
  OracleCrystalOrbGraphic,
  GreenGemIcon,
  VioletGemIcon,
  RedGemIcon,
} from './ColorPredictionIcons';
import { ShinyCoinIcon } from './FoodIcons';

// Available Chip Denominations
const CHIPS = [100, 500, 1000, 5000, 10000, 50000];

// Number to primary color mapping
export function getNumberColorInfo(num) {
  if (num === 0) return { color: 'violet_red', label: '0', isViolet: true, primary: '#EF4444' };
  if (num === 5) return { color: 'violet_green', label: '5', isViolet: true, primary: '#10B981' };
  if ([1, 3, 7, 9].includes(num)) return { color: 'green', label: String(num), isViolet: false, primary: '#10B981' };
  return { color: 'red', label: String(num), isViolet: false, primary: '#EF4444' };
}

export default function ColorPredictionGameModal({
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

  // Bets state: colors and numbers (0-9)
  const [colorBets, setColorBets] = useState({ green: 0, violet: 0, red: 0 });
  const [numberBets, setNumberBets] = useState({
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0,
    5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  });
  const [lastPlacedBets, setLastPlacedBets] = useState(null);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Loop & Reveal Phases: 'BETTING' (15s countdown) -> 'REVEALING' (3s) -> 'RESULT' (4s)
  const [gamePhase, setGamePhase] = useState('BETTING');
  const [countdown, setCountdown] = useState(15);
  const [revealedResult, setRevealedResult] = useState(null);
  const [winResult, setWinResult] = useState(null);

  // Animations
  const orbScaleAnim = useRef(new Animated.Value(1)).current;
  const orbGlowAnim = useRef(new Animated.Value(0)).current;
  const winPopupAnim = useRef(new Animated.Value(0)).current;

  // Sync user coins with parent
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/color-prediction/state');
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
      console.warn('Failed to load Color Prediction state:', err.message);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
    }
  }, [visible, fetchGameState]);

  // Breathing orb glow animation
  useEffect(() => {
    if (!visible) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbGlowAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [visible, orbGlowAnim]);

  // Total bet amount calculation
  const totalBetAmount =
    (colorBets.green || 0) +
    (colorBets.violet || 0) +
    (colorBets.red || 0) +
    Object.values(numberBets).reduce((acc, v) => acc + (v || 0), 0);

  // Place bet on a primary color (green, violet, red)
  const handlePlaceColorBet = (colorKey) => {
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
    setColorBets((prev) => ({
      ...prev,
      [colorKey]: (prev[colorKey] || 0) + selectedChip,
    }));
  };

  // Place bet on a number (0 to 9)
  const handlePlaceNumberBet = (num) => {
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
    setNumberBets((prev) => ({
      ...prev,
      [num]: (prev[num] || 0) + selectedChip,
    }));
  };

  // Clear all bets and refund locally
  const handleClearBets = () => {
    if (totalBetAmount === 0) return;
    if (gamePhase !== 'BETTING') {
      showToast(t('Cannot clear bets during reveal!'), 'info');
      return;
    }
    setUserCoins((prev) => {
      const restored = prev + totalBetAmount;
      onCoinBalanceUpdate?.(restored);
      return restored;
    });
    setColorBets({ green: 0, violet: 0, red: 0 });
    setNumberBets({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
    showToast(t('Bets cleared! Coins refunded.'), 'info');
  };

  // Rebet previous amounts
  const handleRebet = () => {
    if (!lastPlacedBets) {
      showToast(t('No previous bets to repeat'), 'info');
      return;
    }
    if (gamePhase !== 'BETTING') return;

    const prevTotal =
      (lastPlacedBets.colorBets.green || 0) +
      (lastPlacedBets.colorBets.violet || 0) +
      (lastPlacedBets.colorBets.red || 0) +
      Object.values(lastPlacedBets.numberBets).reduce((acc, v) => acc + (v || 0), 0);

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
    setColorBets({ ...lastPlacedBets.colorBets });
    setNumberBets({ ...lastPlacedBets.numberBets });
    showToast(t('Previous bets placed!'), 'success');
  };

  // Trigger backend play round
  const executeRoundReveal = async (currentBets) => {
    try {
      setGamePhase('REVEALING');

      // Shake & Expand orb animation
      Animated.sequence([
        Animated.timing(orbScaleAnim, {
          toValue: 1.15,
          duration: 350,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(orbScaleAnim, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(orbScaleAnim, {
          toValue: 1.05,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const hasBets =
        (currentBets.colorBets.green || 0) > 0 ||
        (currentBets.colorBets.violet || 0) > 0 ||
        (currentBets.colorBets.red || 0) > 0 ||
        Object.values(currentBets.numberBets).some((v) => (v || 0) > 0);

      // If user placed bets, send to backend
      if (hasBets) {
        setLastPlacedBets({
          colorBets: { ...currentBets.colorBets },
          numberBets: { ...currentBets.numberBets },
        });

        const payload = {
          bets: {
            green: currentBets.colorBets.green || 0,
            violet: currentBets.colorBets.violet || 0,
            red: currentBets.colorBets.red || 0,
            numbers: currentBets.numberBets,
          },
        };

        const res = await api.post('/games/color-prediction/play', payload);
        if (!res.data?.success) {
          showToast(t(res.data?.message || 'Failed to resolve prediction round'), 'error');
          // Reset to betting
          setGamePhase('BETTING');
          setCountdown(15);
          return;
        }

        const {
          winningNumber,
          winningColor,
          hasViolet,
          wonCoins,
          remainingCoins,
          todayEarnings: newEarnings,
          history: updatedHistory,
        } = res.data;

        // Reveal animation timeout
        setTimeout(() => {
          setRevealedResult({
            number: winningNumber,
            color: winningColor,
            hasViolet,
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

          // Show celebration if user won
          if (wonCoins > 0) {
            Vibration.vibrate([0, 100, 50, 150]);
            setWinResult({
              won: true,
              wonCoins,
              winningNumber,
              winningColor,
            });
            Animated.spring(winPopupAnim, {
              toValue: 1,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }).start();
            showToast(
              `✨ ${t('Congratulations! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`,
              'success'
            );
          }

          // Reset for next betting round after 4.5s
          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(15);
            setRevealedResult(null);
            setColorBets({ green: 0, violet: 0, red: 0 });
            setNumberBets({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
            setWinResult(null);
          }, 4500);
        }, 1500);
      } else {
        // Round executed with 0 user bets (spectator mode simulation)
        const randNum = Math.floor(Math.random() * 10);
        let randColor = 'red';
        let randViolet = false;
        if (randNum === 0) {
          randColor = 'red';
          randViolet = true;
        } else if (randNum === 5) {
          randColor = 'green';
          randViolet = true;
        } else if ([1, 3, 7, 9].includes(randNum)) {
          randColor = 'green';
        }

        setTimeout(() => {
          setRevealedResult({
            number: randNum,
            color: randColor,
            hasViolet: randViolet,
          });
          setGamePhase('RESULT');
          setHistory((prev) => [
            {
              roundId: 'CP' + Math.floor(1000 + Math.random() * 9000),
              number: randNum,
              color: randColor,
              hasViolet: randViolet,
              timestamp: Date.now(),
            },
            ...prev.slice(0, 14),
          ]);

          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(15);
            setRevealedResult(null);
          }, 4000);
        }, 1200);
      }
    } catch (err) {
      console.warn('executeRoundReveal error:', err.message);
      showToast(t('Error resolving round. Please try again.'), 'error');
      setGamePhase('BETTING');
      setCountdown(15);
    }
  };

  // 15-second Automatic Betting Loop
  useEffect(() => {
    if (!visible) return;

    if (gamePhase === 'BETTING') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            executeRoundReveal({ colorBets, numberBets });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, gamePhase, colorBets, numberBets]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
            colors={['#1E1138', '#0F0922', '#0A0518']}
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
              <Text style={styles.gameTitle}><T>Color Prediction</T></Text>
              <Text style={styles.gameSubtitle}>
                <T>Fast Parity • 1-Shot Color & Number Oracle</T>
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
            contentContainerStyle={styles.scrollContent}
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

            {/* Oracle Crystal Sphere Center Arena */}
            <View style={styles.crystalArenaContainer}>
              <LinearGradient
                colors={['#1F1142', '#2A175B', '#120A27']}
                style={styles.arenaGradient}
              >
                {/* Phase Banner */}
                <View style={styles.phaseBannerWrapper}>
                  {gamePhase === 'RESULT' && revealedResult ? (
                    <View
                      style={[
                        styles.resultPill,
                        revealedResult.color === 'green'
                          ? styles.pillGreen
                          : revealedResult.color === 'red'
                          ? styles.pillRed
                          : styles.pillViolet,
                      ]}
                    >
                      <Text style={styles.phaseBannerText}>
                        {revealedResult.color === 'green'
                          ? `🟢 ${t('GREEN WON')} (2X) • #${revealedResult.number}`
                          : revealedResult.color === 'red'
                          ? `🔴 ${t('RED WON')} (2X) • #${revealedResult.number}`
                          : `🟣 ${t('VIOLET WON')} (4.5X) • #${revealedResult.number}`}
                      </Text>
                    </View>
                  ) : gamePhase === 'REVEALING' ? (
                    <View style={styles.revealingPill}>
                      <Text style={styles.phaseBannerText}>
                        ✨ <T>REVEALING THE ORACLE COLOR...</T> ✨
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bettingPill}>
                      <Text style={styles.phaseBannerText}>
                        🔮 <T>CHOOSE YOUR COLOR OR NUMBER</T> 🔮
                      </Text>
                    </View>
                  )}
                </View>

                {/* Animated Crystal Sphere */}
                <Animated.View
                  style={[
                    styles.orbHolder,
                    {
                      transform: [{ scale: orbScaleAnim }],
                    },
                  ]}
                >
                  <OracleCrystalOrbGraphic
                    size={126}
                    number={revealedResult?.number ?? null}
                    color={revealedResult?.color ?? null}
                    isRevealing={gamePhase === 'REVEALING'}
                    timerSeconds={countdown}
                  />
                </Animated.View>
              </LinearGradient>
            </View>

            {/* 3 Primary Colors Betting Cards */}
            <View style={styles.colorCardsContainer}>
              {/* GREEN (2X) */}
              <TouchableOpacity
                style={[
                  styles.colorBetCard,
                  styles.cardGreen,
                  colorBets.green > 0 && styles.activeBetBorderGreen,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceColorBet('green')}
              >
                <LinearGradient
                  colors={['#064E3B', '#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <GreenGemIcon size={34} />
                  <Text style={styles.colorCardTitle}><T>GREEN</T></Text>
                  <Text style={styles.colorCardMultiplier}>2X</Text>
                  {colorBets.green > 0 && (
                    <View style={styles.betPill}>
                      <ShinyCoinIcon size={12} />
                      <Text style={styles.betPillText}>{colorBets.green.toLocaleString()}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* VIOLET (4.5X) */}
              <TouchableOpacity
                style={[
                  styles.colorBetCard,
                  styles.cardViolet,
                  colorBets.violet > 0 && styles.activeBetBorderViolet,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceColorBet('violet')}
              >
                <LinearGradient
                  colors={['#3B0764', '#7E22CE', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <VioletGemIcon size={34} />
                  <Text style={styles.colorCardTitle}><T>VIOLET</T></Text>
                  <Text style={styles.colorCardMultiplier}>4.5X</Text>
                  {colorBets.violet > 0 && (
                    <View style={styles.betPill}>
                      <ShinyCoinIcon size={12} />
                      <Text style={styles.betPillText}>{colorBets.violet.toLocaleString()}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* RED (2X) */}
              <TouchableOpacity
                style={[
                  styles.colorBetCard,
                  styles.cardRed,
                  colorBets.red > 0 && styles.activeBetBorderRed,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceColorBet('red')}
              >
                <LinearGradient
                  colors={['#4C0519', '#BE123C', '#EF4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <RedGemIcon size={34} />
                  <Text style={styles.colorCardTitle}><T>RED</T></Text>
                  <Text style={styles.colorCardMultiplier}>2X</Text>
                  {colorBets.red > 0 && (
                    <View style={styles.betPill}>
                      <ShinyCoinIcon size={12} />
                      <Text style={styles.betPillText}>{colorBets.red.toLocaleString()}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* 10 Number Bets (0 to 9) - 9X Multipliers */}
            <View style={styles.numbersGridCard}>
              <View style={styles.numbersHeaderRow}>
                <Text style={styles.numbersSectionTitle}>
                  🔢 <T>Lucky Numbers</T> (<Text style={{ color: '#FDE047' }}>9X</Text>)
                </Text>
                <Text style={styles.numbersSectionSubtitle}>
                  <T>Direct Number Match</T>
                </Text>
              </View>

              <View style={styles.numbersRow}>
                {[0, 1, 2, 3, 4].map((num) => {
                  const info = getNumberColorInfo(num);
                  const betAmt = numberBets[num] || 0;
                  return (
                    <TouchableOpacity
                      key={`num-${num}`}
                      style={[
                        styles.numberBtn,
                        betAmt > 0 && styles.numberBtnActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handlePlaceNumberBet(num)}
                    >
                      <View
                        style={[
                          styles.numberDot,
                          { backgroundColor: info.primary },
                        ]}
                      />
                      <Text style={styles.numberBtnText}>{num}</Text>
                      {betAmt > 0 && (
                        <Text style={styles.numberBetTag}>
                          {betAmt >= 1000 ? `${Math.round(betAmt / 1000)}k` : betAmt}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.numbersRow, { marginTop: 8 }]}>
                {[5, 6, 7, 8, 9].map((num) => {
                  const info = getNumberColorInfo(num);
                  const betAmt = numberBets[num] || 0;
                  return (
                    <TouchableOpacity
                      key={`num-${num}`}
                      style={[
                        styles.numberBtn,
                        betAmt > 0 && styles.numberBtnActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handlePlaceNumberBet(num)}
                    >
                      <View
                        style={[
                          styles.numberDot,
                          { backgroundColor: info.primary },
                        ]}
                      />
                      <Text style={styles.numberBtnText}>{num}</Text>
                      {betAmt > 0 && (
                        <Text style={styles.numberBetTag}>
                          {betAmt >= 1000 ? `${Math.round(betAmt / 1000)}k` : betAmt}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Parity Trend Roadmap (History Bead Plate) */}
            <View style={styles.roadmapCard}>
              <View style={styles.roadmapHeader}>
                <Text style={styles.roadmapTitle}>📊 <T>Parity Trend</T></Text>
                <Text style={styles.roadmapSub}><T>Last 15 Rounds</T></Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadmapScroll}
              >
                {history.map((item, idx) => {
                  const info = getNumberColorInfo(item.number);
                  return (
                    <View key={`hist-${idx}`} style={styles.roadmapItem}>
                      <View
                        style={[
                          styles.historyBadge,
                          {
                            backgroundColor:
                              item.color === 'green'
                                ? '#059669'
                                : item.color === 'red'
                                ? '#DC2626'
                                : '#7E22CE',
                          },
                        ]}
                      >
                        <Text style={styles.historyBadgeText}>{item.number}</Text>
                        {item.hasViolet && (
                          <View style={styles.violetMiniDot} />
                        )}
                      </View>
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

              {/* Action Buttons: Clear & Rebet */}
              <View style={styles.actionBtnsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.clearBtn]}
                  activeOpacity={0.75}
                  onPress={handleClearBets}
                >
                  <Text style={styles.clearBtnText}>🗑️ <T>Clear</T></Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rebetBtn]}
                  activeOpacity={0.75}
                  onPress={handleRebet}
                >
                  <Text style={styles.rebetBtnText}>🔄 <T>Rebet</T></Text>
                </TouchableOpacity>
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
                colors={['#3B0764', '#7E22CE', '#1E1B4B']}
                style={styles.winDialogCard}
              >
                <Text style={styles.winEmojiHeader}>🎉 🔮 ✨</Text>
                <Text style={styles.winDialogTitle}>
                  <T>ORACLE VICTORY!</T>
                </Text>
                <Text style={styles.winDialogSubtitle}>
                  {revealedResult?.color?.toUpperCase()} • #{revealedResult?.number}
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
                <Text style={styles.rulesTitle}>🔮 <T>Color Prediction Rules</T> 🔮</Text>
                <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.rulesSubheading}>🎨 <T>Colors & Multipliers</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#10B981', fontWeight: 'bold' }}><T>GREEN (2X)</T></Text>: <T>Wins if winning number is 1, 3, 7, or 9 (Pays 1.5X if number is 5).</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#EF4444', fontWeight: 'bold' }}><T>RED (2X)</T></Text>: <T>Wins if winning number is 2, 4, 6, or 8 (Pays 1.5X if number is 0).</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#C084FC', fontWeight: 'bold' }}><T>VIOLET (4.5X)</T></Text>: <T>Wins if winning number is either 0 or 5!</T>
                  </Text>

                  <Text style={styles.rulesSubheading}>🔢 <T>Direct Numbers (9X)</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <T>Bet directly on any single number (0 to 9). If your exact number hits, you win a massive 9X payout!</T>
                  </Text>

                  <Text style={styles.rulesSubheading}>⏱️ <T>Round Time</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <T>15-second betting window. When the timer hits 0, the crystal orb reveals the destiny color and number in 1-shot!</T>
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
    backgroundColor: '#0F081E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#7E22CE',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(126, 34, 206, 0.3)',
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
    color: '#F3E8FF',
    letterSpacing: 0.5,
  },
  gameSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#C084FC',
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
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rechargeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
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
  crystalArenaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#7E22CE',
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
    backgroundColor: 'rgba(126, 34, 206, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  revealingPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  resultPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    borderColor: '#34D399',
  },
  pillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderColor: '#F87171',
  },
  pillViolet: {
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderColor: '#C084FC',
  },
  phaseBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orbHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCardsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  colorBetCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 4,
  },
  cardGreen: {
    borderColor: '#059669',
  },
  cardViolet: {
    borderColor: '#7E22CE',
  },
  cardRed: {
    borderColor: '#DC2626',
  },
  activeBetBorderGreen: {
    borderColor: '#34D399',
    borderWidth: 2.5,
  },
  activeBetBorderViolet: {
    borderColor: '#E9D5FF',
    borderWidth: 2.5,
  },
  activeBetBorderRed: {
    borderColor: '#FECDD3',
    borderWidth: 2.5,
  },
  cardGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  colorCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  colorCardMultiplier: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEF08A',
    marginTop: 1,
  },
  betPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  betPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
  },
  numbersGridCard: {
    backgroundColor: '#180E2F',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(126, 34, 206, 0.4)',
    marginBottom: 10,
  },
  numbersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  numbersSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  numbersSectionSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  numberBtn: {
    flex: 1,
    aspectRatio: 1.1,
    backgroundColor: '#241445',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
  },
  numberBtnActive: {
    borderColor: '#FDE047',
    borderWidth: 1.8,
    backgroundColor: '#351C66',
  },
  numberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  numberBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  numberBetTag: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FEF08A',
    marginTop: 1,
  },
  roadmapCard: {
    backgroundColor: '#180E2F',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(126, 34, 206, 0.4)',
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
    position: 'relative',
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  violetMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#C084FC',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  historyRoundTag: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 2,
  },
  chipsSection: {
    backgroundColor: '#180E2F',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(126, 34, 206, 0.4)',
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
    backgroundColor: '#241445',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipBtnSelected: {
    backgroundColor: '#7E22CE',
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
    backgroundColor: '#1C1236',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#7E22CE',
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
    color: '#E9D5FF',
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
    backgroundColor: '#7E22CE',
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


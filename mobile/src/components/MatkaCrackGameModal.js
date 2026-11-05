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
  OrnateTreasureMatkaGraphic,
  GoldenHammerGraphic,
} from './MatkaCrackIcons';

// Available Chip Denominations
const CHIPS = [100, 500, 1000, 5000, 10000, 50000];

export default function MatkaCrackGameModal({
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

  // Bets state on 3 pots: pot1, pot2, pot3
  const [bets, setBets] = useState({
    pot1: 0,
    pot2: 0,
    pot3: 0,
  });
  const [lastPlacedBets, setLastPlacedBets] = useState(null);

  // History & Winners
  const [history, setHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);

  // Loop & Reveal Phases: 'BETTING' (12s) -> 'SMASHING' (1.2s) -> 'RESULT' (4.5s)
  const [gamePhase, setGamePhase] = useState('BETTING');
  const [countdown, setCountdown] = useState(12);
  const [revealedPots, setRevealedPots] = useState(null);
  const [winResult, setWinResult] = useState(null);

  // Animations
  const hammerSwingAnim = useRef(new Animated.Value(0)).current;
  const potsShakeAnim = useRef(new Animated.Value(0)).current;
  const winPopupAnim = useRef(new Animated.Value(0)).current;

  // Sync user coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/matka-crack/state');
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
      console.warn('Failed to load Matka Crack state:', err.message);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
    }
  }, [visible, fetchGameState]);

  // Total bet amount calculation
  const totalBetAmount = (bets.pot1 || 0) + (bets.pot2 || 0) + (bets.pot3 || 0);

  // Place bet on a pot
  const handlePlaceBet = (potKey) => {
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
    setBets((prev) => ({
      ...prev,
      [potKey]: (prev[potKey] || 0) + selectedChip,
    }));
  };

  // Clear all bets and refund locally
  const handleClearBets = () => {
    if (totalBetAmount === 0) return;
    if (gamePhase !== 'BETTING') {
      showToast(t('Cannot clear bets during smash!'), 'info');
      return;
    }
    setUserCoins((prev) => {
      const restored = prev + totalBetAmount;
      onCoinBalanceUpdate?.(restored);
      return restored;
    });
    setBets({ pot1: 0, pot2: 0, pot3: 0 });
    showToast(t('Bets cleared! Coins refunded.'), 'info');
  };

  // Rebet previous amounts
  const handleRebet = () => {
    if (!lastPlacedBets) {
      showToast(t('No previous bets to repeat'), 'info');
      return;
    }
    if (gamePhase !== 'BETTING') return;

    const prevTotal = (lastPlacedBets.pot1 || 0) + (lastPlacedBets.pot2 || 0) + (lastPlacedBets.pot3 || 0);
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
    setBets({ ...lastPlacedBets });
    showToast(t('Previous bets placed!'), 'success');
  };

  // Execute pot smash round
  const executePotSmash = async (currentBets) => {
    try {
      setGamePhase('SMASHING');

      // Hammer swing and smash animation
      hammerSwingAnim.setValue(0);
      Animated.sequence([
        Animated.timing(hammerSwingAnim, {
          toValue: -25,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hammerSwingAnim, {
          toValue: 45,
          duration: 250,
          easing: Easing.in(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]).start();

      const hasBets = (currentBets.pot1 || 0) > 0 || (currentBets.pot2 || 0) > 0 || (currentBets.pot3 || 0) > 0;

      if (hasBets) {
        setLastPlacedBets({ ...currentBets });

        const res = await api.post('/games/matka-crack/play', { bets: currentBets });
        if (!res.data?.success) {
          showToast(t(res.data?.message || 'Failed to smash pots'), 'error');
          setGamePhase('BETTING');
          setCountdown(12);
          return;
        }

        const {
          potResults,
          diamondPot,
          goldPot,
          emptyPot,
          wonCoins,
          remainingCoins,
          todayEarnings: newEarnings,
          history: updatedHistory,
        } = res.data;

        setTimeout(() => {
          Vibration.vibrate([0, 100, 50, 150]);

          // Pots shake on impact
          Animated.sequence([
            Animated.timing(potsShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(potsShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(potsShakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
            Animated.timing(potsShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start();

          setRevealedPots(potResults);
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

          if (wonCoins > 0) {
            setWinResult({
              won: true,
              wonCoins,
              diamondPot,
              goldPot,
            });
            Animated.spring(winPopupAnim, {
              toValue: 1,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }).start();
            showToast(
              `🏺 ${t('TREASURE SMASH! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`,
              'success'
            );
          }

          // Reset for next round after 4.5s
          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(12);
            setRevealedPots(null);
            setBets({ pot1: 0, pot2: 0, pot3: 0 });
            setWinResult(null);
          }, 4500);
        }, 600);
      } else {
        // Spectator mode simulation
        const prizes = [
          { type: 'diamond', multiplier: 5 },
          { type: 'gold', multiplier: 2.5 },
          { type: 'empty', multiplier: 0 },
        ].sort(() => Math.random() - 0.5);

        const simResults = {
          pot1: prizes[0],
          pot2: prizes[1],
          pot3: prizes[2],
        };

        setTimeout(() => {
          setRevealedPots(simResults);
          setGamePhase('RESULT');
          setHistory((prev) => [
            {
              roundId: 'MC' + Math.floor(1000 + Math.random() * 9000),
              diamondPot: Object.keys(simResults).find((k) => simResults[k].type === 'diamond'),
              goldPot: Object.keys(simResults).find((k) => simResults[k].type === 'gold'),
              emptyPot: Object.keys(simResults).find((k) => simResults[k].type === 'empty'),
              timestamp: Date.now(),
            },
            ...prev.slice(0, 14),
          ]);

          setTimeout(() => {
            setGamePhase('BETTING');
            setCountdown(12);
            setRevealedPots(null);
          }, 4000);
        }, 600);
      }
    } catch (err) {
      console.warn('executePotSmash error:', err.message);
      showToast(t('Error resolving round. Please try again.'), 'error');
      setGamePhase('BETTING');
      setCountdown(12);
    }
  };

  // 12-second Automatic Betting Loop
  useEffect(() => {
    if (!visible) return;

    if (gamePhase === 'BETTING') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            executePotSmash(bets);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, gamePhase, bets]);

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
              maxHeight: Math.min(800, windowHeight * 0.95),
              paddingBottom: Math.max(16, insets.bottom + 8),
            },
          ]}
        >
          {/* Header Bar */}
          <LinearGradient
            colors={['#2D1305', '#1B0902', '#0D0401']}
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
              <Text style={styles.gameTitle}><T>Matka Crack</T></Text>
              <Text style={styles.gameSubtitle}>
                <T>Treasure Pot Smash • 5X Diamond Vault</T>
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
                <Text style={styles.balanceCoinIcon}>🪙</Text>
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
                  <Text style={styles.statChipVal}>{totalBetAmount.toLocaleString()} 🪙</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipLabel}><T>Today Won</T>:</Text>
                  <Text style={styles.statChipWon}>{todayEarnings.toLocaleString()} 🪙</Text>
                </View>
              </View>
            </View>

            {/* Matka Arena Centerpiece */}
            <View style={styles.arenaContainer}>
              <LinearGradient
                colors={['#2C1307', '#3A190A', '#190A03']}
                style={styles.arenaGradient}
              >
                {/* Phase Status Banner */}
                <View style={styles.phaseBannerWrapper}>
                  {gamePhase === 'RESULT' && revealedPots ? (
                    <View style={styles.resultPill}>
                      <Text style={styles.phaseBannerText}>
                        💎 <T>TREASURE REVEALED!</T> 🪙
                      </Text>
                    </View>
                  ) : gamePhase === 'SMASHING' ? (
                    <View style={styles.smashingPill}>
                      <Text style={styles.phaseBannerText}>
                        🔨 <T>SMASHING THE POTS...</T> 💥
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.bettingPill}>
                      <Text style={styles.phaseBannerText}>
                        🏺 <T>CHOOSE YOUR LUCKY POT</T> ({countdown}s)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Floating Hammer Animation */}
                <Animated.View
                  style={[
                    styles.hammerHolder,
                    {
                      transform: [
                        {
                          rotate: hammerSwingAnim.interpolate({
                            inputRange: [-25, 45],
                            outputRange: ['-25deg', '45deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <GoldenHammerGraphic size={48} />
                </Animated.View>

                {/* 3 Pots Showcase */}
                <Animated.View
                  style={[
                    styles.potsRow,
                    { transform: [{ translateX: potsShakeAnim }] },
                  ]}
                >
                  {/* Pot 1: Ruby Terracotta */}
                  <View style={styles.potDisplayBox}>
                    <OrnateTreasureMatkaGraphic
                      size={windowWidth * 0.26}
                      theme="ruby"
                      status={gamePhase === 'RESULT' ? 'smashed' : 'intact'}
                      prize={revealedPots?.pot1?.type ?? null}
                    />
                    <Text style={styles.potTagText}><T>Pot 1</T></Text>
                  </View>

                  {/* Pot 2: Royal Gold */}
                  <View style={styles.potDisplayBox}>
                    <OrnateTreasureMatkaGraphic
                      size={windowWidth * 0.28}
                      theme="gold"
                      status={gamePhase === 'RESULT' ? 'smashed' : 'intact'}
                      prize={revealedPots?.pot2?.type ?? null}
                    />
                    <Text style={[styles.potTagText, { color: '#FEF08A' }]}>
                      👑 <T>Pot 2</T>
                    </Text>
                  </View>

                  {/* Pot 3: Emerald Jade */}
                  <View style={styles.potDisplayBox}>
                    <OrnateTreasureMatkaGraphic
                      size={windowWidth * 0.26}
                      theme="jade"
                      status={gamePhase === 'RESULT' ? 'smashed' : 'intact'}
                      prize={revealedPots?.pot3?.type ?? null}
                    />
                    <Text style={styles.potTagText}><T>Pot 3</T></Text>
                  </View>
                </Animated.View>
              </LinearGradient>
            </View>

            {/* 3 Primary Pot Betting Cards */}
            <View style={styles.betCardsRow}>
              {/* POT 1 BET CARD */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  styles.cardPot1,
                  bets.pot1 > 0 && styles.activeBetBorderPot1,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('pot1')}
              >
                <LinearGradient
                  colors={['#7F1D1D', '#991B1B', '#450A0A']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardEmoji}>🏺</Text>
                  <Text style={styles.cardTitle}><T>Pot 1</T></Text>
                  <Text style={styles.cardPayoutRange}>2.5X ~ 5X</Text>
                  {bets.pot1 > 0 && (
                    <View style={styles.betPill}>
                      <Text style={styles.betPillText}>{bets.pot1.toLocaleString()} 🪙</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* POT 2 BET CARD */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  styles.cardPot2,
                  bets.pot2 > 0 && styles.activeBetBorderPot2,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('pot2')}
              >
                <LinearGradient
                  colors={['#78350F', '#B45309', '#F59E0B']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardEmoji}>👑</Text>
                  <Text style={styles.cardTitle}><T>Pot 2</T></Text>
                  <Text style={styles.cardPayoutRange}>2.5X ~ 5X</Text>
                  {bets.pot2 > 0 && (
                    <View style={styles.betPill}>
                      <Text style={styles.betPillText}>{bets.pot2.toLocaleString()} 🪙</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* POT 3 BET CARD */}
              <TouchableOpacity
                style={[
                  styles.betCard,
                  styles.cardPot3,
                  bets.pot3 > 0 && styles.activeBetBorderPot3,
                ]}
                activeOpacity={0.8}
                onPress={() => handlePlaceBet('pot3')}
              >
                <LinearGradient
                  colors={['#064E3B', '#065F46', '#022C22']}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardEmoji}>🏺</Text>
                  <Text style={styles.cardTitle}><T>Pot 3</T></Text>
                  <Text style={styles.cardPayoutRange}>2.5X ~ 5X</Text>
                  {bets.pot3 > 0 && (
                    <View style={styles.betPill}>
                      <Text style={styles.betPillText}>{bets.pot3.toLocaleString()} 🪙</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* History Roadmap */}
            <View style={styles.roadmapCard}>
              <View style={styles.roadmapHeader}>
                <Text style={styles.roadmapTitle}>📊 <T>Treasure History</T></Text>
                <Text style={styles.roadmapSub}><T>Last 15 Smashes</T></Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadmapScroll}
              >
                {history.map((item, idx) => {
                  return (
                    <View key={`hist-${idx}`} style={styles.roadmapItem}>
                      <View style={styles.historyPill}>
                        <Text style={styles.historyDiamondTag}>
                          💎 {item.diamondPot ? item.diamondPot.replace('pot', 'P') : 'P?'}
                        </Text>
                        <Text style={styles.historyGoldTag}>
                          🪙 {item.goldPot ? item.goldPot.replace('pot', 'P') : 'P?'}
                        </Text>
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
                colors={['#78350F', '#B45309', '#1E1B4B']}
                style={styles.winDialogCard}
              >
                <Text style={styles.winEmojiHeader}>🏺 💎 ✨</Text>
                <Text style={styles.winDialogTitle}>
                  <T>TREASURE UNLOCKED!</T>
                </Text>
                <Text style={styles.winDialogSubtitle}>
                  <T>LUCKY POT WINNER</T>
                </Text>

                <View style={styles.wonAmountBadge}>
                  <Text style={styles.wonAmountText}>
                    +{winResult.wonCoins.toLocaleString()} 🪙
                  </Text>
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
                <Text style={styles.rulesTitle}>🏺 <T>Matka Crack Rules</T> 🏺</Text>
                <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.rulesSubheading}>💎 <T>Treasures & Multipliers</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>💎 <T>Diamond Vault (5X)</T></Text>: <T>One of the 3 pots contains the sparkling Diamond Vault. Pays 5X your bet!</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#FDE047', fontWeight: 'bold' }}>🪙 <T>Gold Overflow (2.5X)</T></Text>: <T>One of the pots contains an overflowing pile of Gold Coins. Pays 2.5X your bet!</T>
                  </Text>
                  <Text style={styles.rulesText}>
                    • <Text style={{ color: '#94A3B8', fontWeight: 'bold' }}>🍂 <T>Empty Pot (0X)</T></Text>: <T>One pot contains empty ash and dust.</T>
                  </Text>

                  <Text style={styles.rulesSubheading}>🎯 <T>Winning Odds</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <T>2 out of 3 pots have winning treasures! You can bet on Pot 1, Pot 2, Pot 3, or multiple pots simultaneously.</T>
                  </Text>

                  <Text style={styles.rulesSubheading}>⏱️ <T>Round Time</T>:</Text>
                  <Text style={styles.rulesText}>
                    • <T>12-second betting window. When the timer hits 0, the golden hammer smashes the pots to reveal treasures in 1-shot!</T>
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
    backgroundColor: '#0F0602',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1.5,
    borderColor: '#D97706',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.3)',
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
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  gameSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#F59E0B',
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
    backgroundColor: 'rgba(40, 18, 5, 0.85)',
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
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rechargeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
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
    color: '#FDE68A',
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
  arenaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    marginBottom: 12,
  },
  arenaGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  phaseBannerWrapper: {
    marginBottom: 6,
  },
  bettingPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  smashingPill: {
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  resultPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#34D399',
  },
  phaseBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  hammerHolder: {
    marginBottom: -10,
    zIndex: 10,
  },
  potsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  potDisplayBox: {
    alignItems: 'center',
  },
  potTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 4,
  },
  betCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  betCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 4,
  },
  cardPot1: {
    borderColor: '#B91C1C',
  },
  cardPot2: {
    borderColor: '#D97706',
  },
  cardPot3: {
    borderColor: '#047857',
  },
  activeBetBorderPot1: {
    borderColor: '#F87171',
    borderWidth: 2.5,
  },
  activeBetBorderPot2: {
    borderColor: '#FEF08A',
    borderWidth: 2.5,
  },
  activeBetBorderPot3: {
    borderColor: '#34D399',
    borderWidth: 2.5,
  },
  cardGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  cardEmoji: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  cardPayoutRange: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
    marginTop: 1,
  },
  betPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  betPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FEF08A',
  },
  roadmapCard: {
    backgroundColor: '#1C0D05',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
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
  historyPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    alignItems: 'center',
  },
  historyDiamondTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  historyGoldTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
  },
  historyRoundTag: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 2,
  },
  chipsSection: {
    backgroundColor: '#1C0D05',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
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
    backgroundColor: '#2A1308',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipBtnSelected: {
    backgroundColor: '#B45309',
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
    backgroundColor: '#1E0E05',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#D97706',
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
    color: '#FDE047',
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
    backgroundColor: '#B45309',
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


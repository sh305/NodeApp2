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
  DragonEmblemIcon,
  TigerEmblemIcon,
  SwordsCrossedIcon,
  PlayingCardGraphic,
  DragonTigerTileIcon,
} from './DragonTigerIcons';

const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

export default function DragonTigerGameModal({
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
  const [gamePhase, setGamePhase] = useState('BETTING'); // 'BETTING' | 'DEALING' | 'REVEAL' | 'RESULT'
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState({}); // { dragon: 100, tiger: 0, tie: 50 }
  const betsRef = useRef(bets);
  betsRef.current = bets;

  const [lastBets, setLastBets] = useState(null);
  const [isDealing, setIsDealing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentWinners, setRecentWinners] = useState(['dragon', 'tiger', 'dragon', 'dragon', 'tiger', 'tie', 'tiger', 'dragon']);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Cards on table
  const [dragonCard, setDragonCard] = useState({ rank: 'K', value: 13, suit: 'hearts', suitSymbol: '♥', isRed: true, name: 'King' });
  const [tigerCard, setTigerCard] = useState({ rank: 'Q', value: 12, suit: 'spades', suitSymbol: '♠', isRed: false, name: 'Queen' });
  const [winnerSide, setWinnerSide] = useState(null); // 'dragon' | 'tiger' | 'tie'
  const [isDragonCardFaceDown, setIsDragonCardFaceDown] = useState(false);
  const [isTigerCardFaceDown, setIsTigerCardFaceDown] = useState(false);

  // Result dialog state
  const [winResult, setWinResult] = useState(null);

  // Animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dragonCardFlip = useRef(new Animated.Value(0)).current;
  const tigerCardFlip = useRef(new Animated.Value(0)).current;
  const vsGlowAnim = useRef(new Animated.Value(1)).current;

  // Sync prop coins
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/dragon-tiger/state');
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
      setIsDealing(false);
      setWinnerSide(null);
      setIsDragonCardFaceDown(false);
      setIsTigerCardFaceDown(false);
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

  // Total bet calculation & real-time display coins
  const totalBetAmount = Object.values(bets).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const displayCoins = Math.max(0, userCoins - totalBetAmount);

  // Place bet on Dragon, Tiger, or Tie
  const handlePlaceBet = (side) => {
    if (gamePhase !== 'BETTING' || isDealing) return;

    if (totalBetAmount + selectedChip > userCoins) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      return;
    }

    setBets((prev) => ({
      ...prev,
      [side]: (prev[side] || 0) + selectedChip,
    }));

    if (soundEnabled && Platform.OS === 'android') {
      Vibration.vibrate(15);
    }
  };

  // Clear current round bets
  const handleClearBets = () => {
    if (gamePhase !== 'BETTING' || isDealing || totalBetAmount === 0) return;
    setBets({});
    showToast(t('Bets cleared!'), 'info');
  };

  // Rebet previous bets
  const handleRebet = () => {
    if (gamePhase !== 'BETTING' || isDealing || !lastBets) return;

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
    if (gamePhase !== 'BETTING' || isDealing) return;
    const affordable = [...CHIP_VALUES].reverse().find((c) => userCoins >= c) || CHIP_VALUES[0];
    setSelectedChip(affordable);
    showToast(`${t('Max Chip Set')}: ${affordable.toLocaleString()} 🪙`, 'info');
  };

  // 3D Card Flip Animation Sequence
  const animateCardDealAndFlip = (newDCard, newTCard, onFinish) => {
    setIsDragonCardFaceDown(true);
    setIsTigerCardFaceDown(true);
    setDragonCard(newDCard);
    setTigerCard(newTCard);
    dragonCardFlip.setValue(0);
    tigerCardFlip.setValue(0);

    // Step 1: Wait 500ms after deal
    setTimeout(() => {
      // Step 2: Flip Dragon Card
      Animated.timing(dragonCardFlip, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setIsDragonCardFaceDown(false);
        if (soundEnabled && Platform.OS === 'android') {
          Vibration.vibrate(20);
        }

        // Step 3: Flip Tiger Card with dramatic pause
        setTimeout(() => {
          Animated.timing(tigerCardFlip, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            setIsTigerCardFaceDown(false);
            if (soundEnabled && Platform.OS === 'android') {
              Vibration.vibrate(30);
            }
            onFinish();
          });
        }, 500);
      });
    }, 400);
  };

  // Execute Round when 15s timer hits 0
  const handleStartDuel = useCallback(async () => {
    if (isDealing || gamePhase !== 'BETTING') return;

    const currentBets = betsRef.current;
    const currentTotal = Object.values(currentBets).reduce((sum, v) => sum + (Number(v) || 0), 0);

    if (currentTotal === 0) {
      // Auto-simulate round if no bets placed
      setGamePhase('DEALING');
      setIsDealing(true);
      setWinnerSide(null);

      // Random quick simulated cards
      const ranks = [
        { rank: 'A', value: 1, isRed: true, suitSymbol: '♥' },
        { rank: '7', value: 7, isRed: false, suitSymbol: '♠' },
        { rank: '9', value: 9, isRed: true, suitSymbol: '♦' },
        { rank: 'J', value: 11, isRed: false, suitSymbol: '♣', name: 'Jack' },
        { rank: 'K', value: 13, isRed: true, suitSymbol: '♥', name: 'King' },
      ];
      const dC = ranks[Math.floor(Math.random() * ranks.length)];
      const tC = ranks[Math.floor(Math.random() * ranks.length)];
      const simWinner = dC.value > tC.value ? 'dragon' : tC.value > dC.value ? 'tiger' : 'tie';

      animateCardDealAndFlip(dC, tC, () => {
        setWinnerSide(simWinner);
        setRecentWinners((prev) => [simWinner, ...prev.slice(0, 11)]);
        setGamePhase('RESULT');

        setTimeout(() => {
          setCountdown(15);
          setIsDealing(false);
          setWinnerSide(null);
          setGamePhase('BETTING');
        }, 3200);
      });
      return;
    }

    try {
      setIsDealing(true);
      setGamePhase('DEALING');
      setWinnerSide(null);
      setLastBets({ ...currentBets });

      const res = await api.post('/games/dragon-tiger/play', { bets: currentBets });
      if (!res.data?.success) {
        showToast(t(res.data?.message || 'Failed to start card duel'), 'error');
        setIsDealing(false);
        setGamePhase('BETTING');
        return;
      }

      const {
        winner,
        dragonCard: newDCard,
        tigerCard: newTCard,
        wonCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        recentWinners: newHistory,
        effectiveMultiplier,
      } = res.data;

      // Update local balance
      setUserCoins(remainingCoins);
      onCoinBalanceUpdate?.(remainingCoins);
      if (newTodayEarnings !== undefined) {
        setTodayEarnings(newTodayEarnings);
      }

      animateCardDealAndFlip(newDCard, newTCard, () => {
        setWinnerSide(winner);
        setGamePhase('RESULT');

        if (newHistory?.length) {
          setRecentWinners(newHistory);
        } else {
          setRecentWinners((prev) => [winner, ...prev.slice(0, 11)]);
        }

        const userWon = wonCoins > 0;
        setWinResult({
          won: userWon,
          winner,
          dragonCard: newDCard,
          tigerCard: newTCard,
          effectiveMultiplier,
          wonCoins,
          spentCoins: currentTotal,
        });

        if (userWon) {
          showToast(`🎉 ${t('Congratulations! You won')} ${wonCoins.toLocaleString()} ${t('Gold Coins')}!`, 'success');
          if (soundEnabled && Platform.OS === 'android') {
            Vibration.vibrate([0, 100, 50, 200]);
          }
        }

        setTimeout(() => {
          setCountdown(15);
          setIsDealing(false);
          setGamePhase('BETTING');
          setBets({});
          setWinnerSide(null);
          setWinResult(null);
        }, userWon ? 3800 : 2500);
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Duel execution error';
      showToast(t(msg), 'error');
      setIsDealing(false);
      setGamePhase('BETTING');
    }
  }, [isDealing, gamePhase, t, showToast, onCoinBalanceUpdate, soundEnabled]);

  // 15-Second Master Countdown Loop
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (gamePhase === 'BETTING' && !isDealing) {
            handleStartDuel();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, gamePhase, isDealing, handleStartDuel]);

  if (!visible) return null;

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
                <DragonTigerTileIcon size={38} />
              </View>
              <View style={styles.headerTextGroup}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.gameTitle}><T>Dragon vs Tiger</T></Text>
                  <View style={styles.duelTag}>
                    <Text style={styles.duelTagText}>9X TIE ⚔️</Text>
                  </View>
                </View>
                <Text style={styles.gameSubtitle}>
                  <T>Legendary 2-Card Duel • Highest Card Wins</T>
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

          {/* ══ SCROLLABLE ARENA & BETTING CONTENT ══ */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
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

          {/* ══ CARD BATTLE ARENA (DRAGON vs TIGER) ══ */}
          <View style={styles.battleArenaArea}>
            <LinearGradient
              colors={['#16082B', '#240F3E', '#100520']}
              style={styles.battleArenaGradient}
            >
              {/* Top Arena Banner */}
              <View style={styles.arenaStatusBanner}>
                {winnerSide ? (
                  <View style={[
                    styles.winnerStatusPill,
                    winnerSide === 'dragon' ? styles.pillDragon : winnerSide === 'tiger' ? styles.pillTiger : styles.pillTie,
                  ]}>
                    <Text style={styles.winnerStatusText}>
                      {winnerSide === 'dragon'
                        ? `🔥 ${t('DRAGON WINS!')} 🔥`
                        : winnerSide === 'tiger'
                        ? `⚡ ${t('TIGER WINS!')} ⚡`
                        : `⚔️ ${t('TIE GAME (9X PAYOUT)!')} ⚔️`}
                    </Text>
                  </View>
                ) : gamePhase === 'DEALING' ? (
                  <View style={styles.dealingStatusPill}>
                    <Text style={styles.dealingStatusText}>🎴 <T>DEALING DESTINY CARDS...</T> 🎴</Text>
                  </View>
                ) : (
                  <View style={styles.bettingStatusPill}>
                    <Text style={styles.bettingStatusText}>🐉 <T>PLACE YOUR BET: DRAGON OR TIGER</T> 🐯</Text>
                  </View>
                )}
              </View>

              {/* 2-Card Duel Showcase */}
              <View style={styles.cardsDuelRow}>
                {/* Left: Dragon Card Stand */}
                <View style={[styles.cardMatSide, styles.cardMatDragon, winnerSide === 'dragon' && styles.cardMatWinner]}>
                  <View style={styles.emblemRow}>
                    <DragonEmblemIcon size={30} />
                    <Text style={styles.matDragonLabel}><T>DRAGON</T></Text>
                  </View>
                  <View style={styles.cardGraphicWrap}>
                    <PlayingCardGraphic
                      card={dragonCard}
                      isFaceDown={isDragonCardFaceDown}
                      width={84}
                      height={118}
                    />
                  </View>
                  {winnerSide === 'dragon' && (
                    <View style={styles.winnerCrownBadge}>
                      <Text style={styles.winnerCrownText}>👑 WINNER</Text>
                    </View>
                  )}
                </View>

                {/* Center: VS & Countdown Timer */}
                <View style={styles.centerVsBox}>
                  <Animated.View style={[styles.countdownPillWrap, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.countdownSecText}>
                      {gamePhase === 'BETTING' ? `${countdown}s` : 'VS'}
                    </Text>
                  </Animated.View>
                  <SwordsCrossedIcon size={32} />
                  <Text style={styles.vsSubtext}><T>TIE 9X</T></Text>
                </View>

                {/* Right: Tiger Card Stand */}
                <View style={[styles.cardMatSide, styles.cardMatTiger, winnerSide === 'tiger' && styles.cardMatWinner]}>
                  <View style={styles.emblemRow}>
                    <TigerEmblemIcon size={30} />
                    <Text style={styles.matTigerLabel}><T>TIGER</T></Text>
                  </View>
                  <View style={styles.cardGraphicWrap}>
                    <PlayingCardGraphic
                      card={tigerCard}
                      isFaceDown={isTigerCardFaceDown}
                      width={84}
                      height={118}
                    />
                  </View>
                  {winnerSide === 'tiger' && (
                    <View style={styles.winnerCrownBadge}>
                      <Text style={styles.winnerCrownText}>👑 WINNER</Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ══ 3 LARGE BETTING ZONES (DRAGON, TIE, TIGER) ══ */}
          <View style={styles.bettingZonesRow}>
            {/* 🐉 DRAGON (2X) */}
            <TouchableOpacity
              style={[
                styles.betZoneCard,
                styles.zoneDragon,
                winnerSide === 'dragon' && styles.zoneWinnerGlow,
              ]}
              activeOpacity={0.82}
              onPress={() => handlePlaceBet('dragon')}
              disabled={gamePhase !== 'BETTING' || isDealing}
            >
              <LinearGradient
                colors={['#7F1D1D', '#991B1B', '#450A0A']}
                style={styles.zoneGradient}
              >
                <DragonEmblemIcon size={36} />
                <Text style={styles.zoneTitleDragon}><T>DRAGON</T></Text>
                <Text style={styles.zoneMultDragon}>2X</Text>

                {/* Placed Bet Badge */}
                {(bets.dragon || 0) > 0 && (
                  <View style={styles.zoneBetBadge}>
                    <Text style={styles.zoneBetBadgeText}>
                      {bets.dragon >= 1000 ? `${bets.dragon / 1000}K` : bets.dragon} 🪙
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ⚔️ TIE (9X) */}
            <TouchableOpacity
              style={[
                styles.betZoneCard,
                styles.zoneTie,
                winnerSide === 'tie' && styles.zoneWinnerGlow,
              ]}
              activeOpacity={0.82}
              onPress={() => handlePlaceBet('tie')}
              disabled={gamePhase !== 'BETTING' || isDealing}
            >
              <LinearGradient
                colors={['#064E3B', '#047857', '#022C22']}
                style={styles.zoneGradient}
              >
                <SwordsCrossedIcon size={28} />
                <Text style={styles.zoneTitleTie}><T>TIE</T></Text>
                <Text style={styles.zoneMultTie}>9X</Text>

                {/* Placed Bet Badge */}
                {(bets.tie || 0) > 0 && (
                  <View style={styles.zoneBetBadge}>
                    <Text style={styles.zoneBetBadgeText}>
                      {bets.tie >= 1000 ? `${bets.tie / 1000}K` : bets.tie} 🪙
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* 🐯 TIGER (2X) */}
            <TouchableOpacity
              style={[
                styles.betZoneCard,
                styles.zoneTiger,
                winnerSide === 'tiger' && styles.zoneWinnerGlow,
              ]}
              activeOpacity={0.82}
              onPress={() => handlePlaceBet('tiger')}
              disabled={gamePhase !== 'BETTING' || isDealing}
            >
              <LinearGradient
                colors={['#78350F', '#B45309', '#451A03']}
                style={styles.zoneGradient}
              >
                <TigerEmblemIcon size={36} />
                <Text style={styles.zoneTitleTiger}><T>TIGER</T></Text>
                <Text style={styles.zoneMultTiger}>2X</Text>

                {/* Placed Bet Badge */}
                {(bets.tiger || 0) > 0 && (
                  <View style={styles.zoneBetBadge}>
                    <Text style={styles.zoneBetBadgeText}>
                      {bets.tiger >= 1000 ? `${bets.tiger / 1000}K` : bets.tiger} 🪙
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ══ RECENT ROADMAP (BEAD PLATE) ══ */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyLabel}><T>Roadmap</T>:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {recentWinners.map((outcome, index) => {
                const isLatest = index === 0;
                const isD = outcome === 'dragon';
                const isT = outcome === 'tiger';
                return (
                  <View
                    key={`${outcome}-${index}`}
                    style={[
                      styles.roadmapBead,
                      isD ? styles.beadDragon : isT ? styles.beadTiger : styles.beadTie,
                      isLatest && styles.beadLatest,
                    ]}
                  >
                    <Text style={styles.beadText}>
                      {isD ? 'D' : isT ? 'T' : 'Tie'}
                    </Text>
                    {isLatest && <View style={styles.latestDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>

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
                  disabled={gamePhase !== 'BETTING' || isDealing}
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
                disabled={gamePhase !== 'BETTING' || isDealing || totalBetAmount === 0}
              >
                <Text style={styles.utilityBtnText}>🗑️</Text>
              </TouchableOpacity>

              {/* Rebet Button */}
              <TouchableOpacity
                style={styles.utilityBtn}
                activeOpacity={0.75}
                onPress={handleRebet}
                disabled={gamePhase !== 'BETTING' || isDealing || !lastBets}
              >
                <Text style={styles.utilityBtnText}>🔁</Text>
              </TouchableOpacity>

              {/* Max Bet Button */}
              <TouchableOpacity
                style={styles.utilityBtn}
                activeOpacity={0.75}
                onPress={handleMaxBet}
                disabled={gamePhase !== 'BETTING' || isDealing}
              >
                <Text style={styles.utilityBtnText}>⚡</Text>
              </TouchableOpacity>
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
                      ? ['#450A0A', '#7F1D1D', '#991B1B']
                      : ['#1E1B4B', '#0F172A', '#020617']
                  }
                  style={styles.winDialogGradient}
                >
                  <Text style={styles.winBigTitle}>
                    {winResult.won
                      ? `🎉 ${t('VICTORY!')} ${winResult.winner.toUpperCase()} ${t('WINS')}! 🎉`
                      : `⚔️ ${winResult.winner.toUpperCase()} ${t('WON THIS ROUND')} ⚔️`}
                  </Text>

                  {/* Winner Emblem */}
                  <View style={styles.winEmblemWrap}>
                    {winResult.winner === 'dragon' ? (
                      <DragonEmblemIcon size={64} />
                    ) : winResult.winner === 'tiger' ? (
                      <TigerEmblemIcon size={64} />
                    ) : (
                      <SwordsCrossedIcon size={64} />
                    )}
                  </View>

                  <Text style={styles.winCardsComparison}>
                    🐉 {winResult.dragonCard.rank}{winResult.dragonCard.suitSymbol} vs 🐯 {winResult.tigerCard.rank}{winResult.tigerCard.suitSymbol}
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
                      <T>Better luck on the next deal!</T>
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
              <Text style={styles.rulesTitle}>🐉 <T>Dragon vs Tiger Rules</T> 🐯</Text>
              <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.rulesSubheading}>⚔️ <T>Gameplay & Payouts</T>:</Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#EF4444', fontWeight: 'bold' }}><T>Dragon (2X)</T></Text>: <T>Bets on Dragon win if the Dragon card is higher than the Tiger card.</T>
                </Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}><T>Tiger (2X)</T></Text>: <T>Bets on Tiger win if the Tiger card is higher than the Dragon card.</T>
                </Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#10B981', fontWeight: 'bold' }}><T>Tie (9X)</T></Text>: <T>If both cards have the exact same rank, Tie pays 9X, and 50% of Dragon & Tiger bets are refunded!</T>
                </Text>

                <Text style={styles.rulesSubheading}>👑 <T>Card Ranking Hierarchy</T>:</Text>
                <Text style={styles.rulesText}>
                  <T>King (K) is Highest, Ace (A) is Lowest:</T>{'\n'}
                  <Text style={{ color: '#FEF08A', fontWeight: 'bold' }}>
                    K {'>'} Q {'>'} J {'>'} 10 {'>'} 9 {'>'} 8 {'>'} 7 {'>'} 6 {'>'} 5 {'>'} 4 {'>'} 3 {'>'} 2 {'>'} A
                  </Text>
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
    backgroundColor: '#0A0518',
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
    backgroundColor: '#1E0E38',
    borderWidth: 1.5,
    borderColor: '#DC2626',
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
  duelTag: {
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  duelTagText: {
    color: '#A7F3D0',
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
    backgroundColor: '#1E0E38',
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
    backgroundColor: '#140A26',
    borderBottomWidth: 1,
    borderBottomColor: '#281745',
  },
  coinBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#20103A',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  totalBetText: {
    color: '#F87171',
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
  battleArenaArea: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#6D28D9',
  },
  battleArenaGradient: {
    padding: 12,
    alignItems: 'center',
  },
  arenaStatusBanner: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerStatusPill: {
    paddingHorizontal: 14,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pillDragon: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  pillTiger: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  pillTie: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  winnerStatusText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dealingStatusPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  dealingStatusText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bettingStatusPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  bettingStatusText: {
    color: '#DDD6FE',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardsDuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
  },
  cardMatSide: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    position: 'relative',
  },
  cardMatDragon: {
    borderColor: '#DC2626',
  },
  cardMatTiger: {
    borderColor: '#D97706',
  },
  cardMatWinner: {
    borderColor: '#FFE600',
    borderWidth: 2.5,
    backgroundColor: 'rgba(255, 230, 0, 0.1)',
  },
  emblemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  matDragonLabel: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
  },
  matTigerLabel: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
  },
  cardGraphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerCrownBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  winnerCrownText: {
    color: '#1C1917',
    fontSize: 9,
    fontWeight: '900',
  },
  centerVsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countdownPillWrap: {
    backgroundColor: '#3B0764',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    marginBottom: 6,
  },
  countdownSecText: {
    color: '#F5D0FE',
    fontSize: 13,
    fontWeight: '900',
  },
  vsSubtext: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },
  bettingZonesRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
  },
  betZoneCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  zoneDragon: {
    borderColor: '#EF4444',
  },
  zoneTie: {
    flex: 0.85,
    borderColor: '#10B981',
  },
  zoneTiger: {
    borderColor: '#F59E0B',
  },
  zoneWinnerGlow: {
    borderColor: '#FFE600',
    borderWidth: 3,
  },
  zoneGradient: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneTitleDragon: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  zoneMultDragon: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  zoneTitleTie: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  zoneMultTie: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  zoneTitleTiger: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  zoneMultTiger: {
    color: '#FEF08A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  zoneBetBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  zoneBetBadgeText: {
    color: '#1C1917',
    fontSize: 9,
    fontWeight: '900',
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 10,
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
  roadmapBead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  beadDragon: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  beadTiger: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  beadTie: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  beadLatest: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  beadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  latestDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFE600',
  },
  footerControls: {
    backgroundColor: '#100620',
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
    backgroundColor: '#1E0E38',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#6D28D9',
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
    backgroundColor: '#20103A',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6D28D9',
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
    borderColor: '#DC2626',
  },
  winDialogGradient: {
    padding: 22,
    alignItems: 'center',
  },
  winBigTitle: {
    color: '#FFE4E6',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  winEmblemWrap: {
    marginVertical: 8,
  },
  winCardsComparison: {
    color: '#FEF08A',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
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
    backgroundColor: '#16082B',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '75%',
    borderWidth: 1.5,
    borderColor: '#DC2626',
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
    color: '#FCA5A5',
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
  closeRulesBtn: {
    backgroundColor: '#DC2626',
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

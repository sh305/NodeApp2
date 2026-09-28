import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARENA_WIDTH = Math.min(SCREEN_WIDTH - 24, 380);

const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// Visual representation of dice dots (1 to 6)
function DiceFace({ value, size = 68, isRolling = false, theme = 'white' }) {
  const isGold = theme === 'gold';
  const bgColor = isGold ? ['#FDE68A', '#F59E0B', '#B45309'] : ['#FFFFFF', '#F1F5F9', '#CBD5E1'];
  const borderColor = isGold ? '#D97706' : '#94A3B8';
  const dotColor = isGold ? '#78350F' : (value === 1 ? '#EF4444' : '#0F172A');
  const dotSize = Math.max(8, Math.round(size * 0.17));

  // 3x3 grid dot positions for standard dice faces
  const renderDots = () => {
    switch (value) {
      case 1:
        return (
          <View style={diceStyles.centerDotWrap}>
            <View style={[diceStyles.dot, { width: dotSize * 1.5, height: dotSize * 1.5, borderRadius: dotSize, backgroundColor: '#EF4444' }]} />
          </View>
        );
      case 2:
        return (
          <View style={diceStyles.faceContainer}>
            <View style={diceStyles.dotRowTopRight}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.dotRowBottomLeft}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={diceStyles.faceContainer}>
            <View style={diceStyles.dotRowTopRight}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.centerDotWrap}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.dotRowBottomLeft}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
          </View>
        );
      case 4:
        return (
          <View style={diceStyles.faceContainerSpread}>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
          </View>
        );
      case 5:
        return (
          <View style={diceStyles.faceContainerSpread}>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.centerDotWrap}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
          </View>
        );
      case 6:
      default:
        return (
          <View style={diceStyles.faceContainerSpread}>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
            <View style={diceStyles.spreadRow}>
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
              <View style={[diceStyles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor }]} />
            </View>
          </View>
        );
    }
  };

  return (
    <LinearGradient
      pointerEvents="none"
      colors={bgColor}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={[
        diceStyles.diceBox,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          borderColor: borderColor,
        },
      ]}
    >
      {/* Specular sheen effect */}
      <View style={diceStyles.sheenOverlay} />
      {renderDots()}
    </LinearGradient>
  );
}

const diceStyles = StyleSheet.create({
  diceBox: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sheenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  faceContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  faceContainerSpread: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  spreadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotRowTopRight: {
    alignItems: 'flex-end',
  },
  dotRowBottomLeft: {
    alignItems: 'flex-start',
  },
  centerDotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default function DiceBattleGame({
  playersCount = 2,
  currentUser,
  gameMode = 'classic', // 'classic' (3 rounds) or 'turbo' (1 round sudden death)
  betAmount = 100,
  totalPot: propTotalPot,
  playMode = 'online', // 'online' (vs AI) or 'local' (socket multiplayer)
  lobbyPlayers = [],
  forfeitedUserIds = [],
  socket,
  roomCode,
  onWin,
  onLoss,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isTurbo = gameMode === 'turbo';
  const MAX_ROUNDS = isTurbo ? 1 : 3;
  const TURN_LIMIT = isTurbo ? 7 : 18;

  // Determine players
  const myPlayer =
    (lobbyPlayers || []).find((p) => String(p.userId) === String(currentUser?._id)) ||
    (lobbyPlayers || []).find((p) => p.slot === 1) || {
      slot: 1,
      name: currentUser?.name || t('You'),
      avatar: currentUser?.avatar,
      userId: currentUser?._id,
    };

  const isMultiplayer = playMode === 'local' && !!socket;
  const isHost = myPlayer.slot === 1;

  // For 2-player or 4-player game
  const PLAYER_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
  const actualPlayersCount = Math.max(2, playersCount || (lobbyPlayers?.length || 2));

  const playersList = Array.from({ length: actualPlayersCount }, (_, i) => {
    const slot = i + 1;
    const found = (lobbyPlayers || []).find((p) => p.slot === slot);
    if (found) return { ...found, color: found.color || PLAYER_COLORS[i % 4] };
    if (slot === 1) {
      return {
        slot: 1,
        name: currentUser?.name || t('You'),
        avatar: currentUser?.avatar,
        userId: currentUser?._id,
        color: PLAYER_COLORS[0],
      };
    }
    return {
      slot,
      name: isMultiplayer ? `${t('Player')} ${slot}` : `${t('AI Bot')} ${slot - 1}`,
      avatar: null,
      userId: `ai_bot_${slot}`,
      color: PLAYER_COLORS[i % 4],
    };
  });

  const opponentPlayer =
    playersList.find((p) => p.slot !== myPlayer.slot) || {
      slot: 2,
      name: isMultiplayer ? t('Opponent') : t('Opponent (AI)'),
      color: '#EC4899',
    };

  // State
  const [currentRound, setCurrentRound] = useState(1);
  const [activeSlot, setActiveSlot] = useState(1);
  const [roundScores, setRoundScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 }); // Round wins
  const [totalPoints, setTotalPoints] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 }); // Cumulative dice sums

  // Current turn dice values: [die1, die2]
  const [playerDice, setPlayerDice] = useState([6, 6]);
  const [opponentDice, setOpponentDice] = useState([6, 6]);

  const [hasRolledThisRound, setHasRolledThisRound] = useState({});
  const [roundRolls, setRoundRolls] = useState({});

  const [isRolling, setIsRolling] = useState(false);
  const [rollingPlayer, setRollingPlayer] = useState(null); // slot
  const [roundBanner, setRoundBanner] = useState('');
  const [roundWinnerSlot, setRoundWinnerSlot] = useState(null);
  const [matchOver, setMatchOver] = useState(false);
  const [matchWinnerSlot, setMatchWinnerSlot] = useState(null);

  // Synchronized refs to prevent any closure staleness or race conditions
  const isRollingRef = useRef(false);
  const activeSlotRef = useRef(1);
  const matchOverRef = useRef(false);
  const hasRolledRef = useRef({});
  const roundRollsRef = useRef({});

  useEffect(() => {
    activeSlotRef.current = activeSlot;
  }, [activeSlot]);

  useEffect(() => {
    matchOverRef.current = matchOver;
  }, [matchOver]);

  // Turn timer
  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const timerRef = useRef(null);

  // Animation values
  const diceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Pulse effect for ROLL button when active
  useEffect(() => {
    if (activeSlot === myPlayer.slot && !isRolling && !matchOver) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeSlot, myPlayer.slot, isRolling, matchOver]);

  // Turn Timer countdown
  useEffect(() => {
    if (matchOver) return;

    setTurnTimer(TURN_LIMIT);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSlot, currentRound, matchOver]);

  // Handle timeout (auto roll if my turn, or pass)
  const handleTimeExpire = () => {
    if (matchOver || isRolling) return;
    if (activeSlot === myPlayer.slot) {
      triggerRoll();
    }
  };

  // AI Turn Trigger
  useEffect(() => {
    if (matchOver || isRolling) return;
    if (!isMultiplayer && activeSlot !== myPlayer.slot) {
      // AI's turn
      const aiDelay = setTimeout(() => {
        aiPerformRoll();
      }, 1200);
      return () => clearTimeout(aiDelay);
    }
  }, [activeSlot, isMultiplayer, matchOver, isRolling]);

  // Socket multiplayer listeners
  useEffect(() => {
    if (!socket || !roomCode || playMode !== 'local') return;

    socket.emit('dice_battle_join', { roomCode });

    const handleRemoteRoll = (data) => {
      if (String(data?.fromSlot) === String(myPlayer.slot)) return;
      applyDiceRoll(data.fromSlot, data.diceValues, data.totalRoll, false);
    };

    const handleRemoteTurnPassed = ({ nextSlot }) => {
      setActiveSlot(nextSlot);
    };

    const handleRemoteSync = (data) => {
      if (data?.currentRound) setCurrentRound(data.currentRound);
      if (data?.roundScores) setRoundScores(data.roundScores);
    };

    socket.on('dice_battle_roll', handleRemoteRoll);
    socket.on('dice_battle_turn_passed', handleRemoteTurnPassed);
    socket.on('dice_battle_sync_round', handleRemoteSync);

    return () => {
      socket.off('dice_battle_roll', handleRemoteRoll);
      socket.off('dice_battle_turn_passed', handleRemoteTurnPassed);
      socket.off('dice_battle_sync_round', handleRemoteSync);
    };
  }, [socket, roomCode, playMode, myPlayer.slot]);

  // Dice roll animation and value resolution
  const triggerRoll = () => {
    if (isRollingRef.current || matchOverRef.current) return;
    if (activeSlotRef.current !== myPlayer.slot) {
      showToast(t('Wait for your turn!'), 'info');
      return;
    }

    isRollingRef.current = true;
    setIsRolling(true);

    // Generate random roll: 2 dice from 1 to 6
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const values = [die1, die2];
    const total = die1 + die2;

    if (isMultiplayer && socket && roomCode) {
      socket.emit('dice_battle_roll', {
        roomCode,
        fromSlot: myPlayer.slot,
        diceValues: values,
        totalRoll: total,
      });
    }

    applyDiceRoll(myPlayer.slot, values, total, true);
  };

  const aiPerformRoll = () => {
    if (isRollingRef.current || matchOverRef.current) return;
    isRollingRef.current = true;
    setIsRolling(true);

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const values = [die1, die2];
    const total = die1 + die2;
    applyDiceRoll(activeSlotRef.current, values, total, false);
  };

  const applyDiceRoll = (slot, finalValues, total, isMe) => {
    isRollingRef.current = true;
    setIsRolling(true);
    setRollingPlayer(slot);

    // Haptic feedback
    try {
      if (Platform.OS === 'android') Vibration.vibrate(50);
    } catch (e) {}

    // Animate dice tumble (rapid value switching + 3D rotation)
    diceAnim.setValue(0);
    Animated.timing(diceAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    let rollInterval = setInterval(() => {
      const temp1 = Math.floor(Math.random() * 6) + 1;
      const temp2 = Math.floor(Math.random() * 6) + 1;
      if (slot === myPlayer.slot) {
        setPlayerDice([temp1, temp2]);
      } else {
        setOpponentDice([temp1, temp2]);
      }
    }, 70);

    setTimeout(() => {
      clearInterval(rollInterval);
      if (slot === myPlayer.slot) {
        setPlayerDice(finalValues);
      } else {
        setOpponentDice(finalValues);
      }

      isRollingRef.current = false;
      setIsRolling(false);
      setRollingPlayer(null);

      // Record this roll in refs & state
      roundRollsRef.current[slot] = total;
      hasRolledRef.current[slot] = true;

      setRoundRolls({ ...roundRollsRef.current });
      setHasRolledThisRound({ ...hasRolledRef.current });

      // Update cumulative points
      setTotalPoints((tp) => ({
        ...tp,
        [slot]: (tp[slot] || 0) + total,
      }));

      // Check if all players have rolled this round
      const allDone = playersList.every((p) => hasRolledRef.current[p.slot]);
      if (allDone) {
        setTimeout(() => {
          resolveMultiplayerRound({ ...roundRollsRef.current });
        }, 600);
      } else {
        // Pass turn to next slot
        const nextSlot = (slot % actualPlayersCount) + 1;
        activeSlotRef.current = nextSlot;
        setActiveSlot(nextSlot);
        if (isMultiplayer && isHost && socket && roomCode) {
          socket.emit('dice_battle_turn_passed', { roomCode, nextSlot });
        }
      }
    }, 850);
  };

  // Determine round winner for 2 to 4 players
  const resolveMultiplayerRound = (rolls) => {
    let highestRoll = -1;
    let roundWinner = null;
    let isTie = false;

    playersList.forEach((p) => {
      const roll = Number(rolls[p.slot]) || 0;
      if (roll > highestRoll) {
        highestRoll = roll;
        roundWinner = p.slot;
        isTie = false;
      } else if (roll === highestRoll) {
        isTie = true;
      }
    });

    let bannerText = '';
    if (isTie) {
      roundWinner = 'tie';
      bannerText = t('Round Tied! Re-rolling...');
    } else if (roundWinner === myPlayer.slot) {
      bannerText = t('You won this Round!');
    } else {
      const winnerName = playersList.find((p) => p.slot === roundWinner)?.name || `${t('Player')} ${roundWinner}`;
      bannerText = `${winnerName} ${t('won this Round!')}`;
    }

    setRoundWinnerSlot(roundWinner);
    setRoundBanner(bannerText);

    // Fade banner in
    bannerOpacity.setValue(0);
    Animated.timing(bannerOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    const nextScores = { ...roundScores };
    if (roundWinner && roundWinner !== 'tie') {
      nextScores[roundWinner] = (nextScores[roundWinner] || 0) + 1;
    }
    setRoundScores(nextScores);

    // Check match completion
    setTimeout(() => {
      const targetWins = Math.ceil(MAX_ROUNDS / 2);
      const anyPlayerWonTarget = playersList.some((p) => (nextScores[p.slot] || 0) >= targetWins);
      const isMatchDecided = isTurbo || anyPlayerWonTarget || currentRound >= MAX_ROUNDS;

      if (isMatchDecided) {
        // Decide match champion (player with highest wins, tie-breaker: total points)
        let champion = playersList[0].slot;
        let maxWins = -1;
        let maxPts = -1;

        playersList.forEach((p) => {
          const w = nextScores[p.slot] || 0;
          const pts = totalPoints[p.slot] || 0;
          if (w > maxWins || (w === maxWins && pts > maxPts)) {
            maxWins = w;
            maxPts = pts;
            champion = p.slot;
          }
        });

        setMatchOver(true);
        setMatchWinnerSlot(champion);

        const isMeWinner = champion === myPlayer.slot;
        if (isMeWinner) {
          onWin && onWin('Dice Battle');
        } else {
          onLoss && onLoss('Dice Battle');
        }
      } else {
        // Next Round
        hasRolledRef.current = {};
        roundRollsRef.current = {};
        setCurrentRound((r) => r + 1);
        setHasRolledThisRound({});
        setRoundRolls({});
        setRoundWinnerSlot(null);
        setRoundBanner('');
        activeSlotRef.current = 1;
        setActiveSlot(1);
      }
    }, 2000);
  };


  // Rotation interpolation for rolling animation
  const spinRotation = diceAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'],
  });

  const bounceScale = diceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.25, 1],
  });

  const totalPotValue = propTotalPot || betAmount * playersCount;
  const isMyTurn = activeSlot === myPlayer.slot;

  return (
    <View style={styles.container}>
      {/* 1. ARENA TOP BANNER: Bet, Pot & Mode */}
      <View style={styles.topBar}>
        <View style={styles.topPill}>
          <Text style={styles.topLabel}><T>ROUND</T></Text>
          <Text style={styles.topValue}>
            {currentRound} / {MAX_ROUNDS}
          </Text>
        </View>

        <View style={styles.potPill}>
          <Image source={GOLD_COIN_IMG} style={styles.coinIcon} resizeMode="contain" />
          <View>
            <Text style={styles.potLabel}><T>TOTAL POT</T></Text>
            <Text style={styles.potValue}>{totalPotValue} <T>Coins</T></Text>
          </View>
        </View>

        <View style={styles.timerPill}>
          <Text style={styles.topLabel}><T>TIMER</T></Text>
          <Text style={[styles.topValue, turnTimer <= 3 && { color: '#EF4444' }]}>
            {turnTimer}s
          </Text>
        </View>
      </View>

      {/* 2. PLAYERS DUEL STATS (Scoreboard: 2 or 4 Players) */}
      {actualPlayersCount <= 2 ? (
        <View style={styles.scoreboard}>
          {/* Player 1 (Left) */}
          <View style={[styles.playerCard, activeSlot === 1 && styles.playerCardActive]}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderColor: '#8B5CF6' }]}>
                {myPlayer.slot === 1 && currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={{ fontSize: 20 }}>👤</Text>
                )}
              </View>
              {activeSlot === 1 && <View style={styles.activeDot} />}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {myPlayer.slot === 1 ? t('You') : opponentPlayer.name}
            </Text>
            <View style={styles.roundWinsBadge}>
              <Text style={styles.roundWinsText}>
                {roundScores[1] || 0} <T>Wins</T>
              </Text>
            </View>
            <Text style={styles.pointsSubText}>
              <T>Pts</T>: {totalPoints[1] || 0}
            </Text>
          </View>

          {/* VS Center Badge */}
          <View style={styles.vsBadgeContainer}>
            <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
            <Text style={styles.gameModeLabel}>
              {isTurbo ? t('Turbo Blitz') : t('Best of 3')}
            </Text>
          </View>

          {/* Player 2 (Right) */}
          <View style={[styles.playerCard, activeSlot === 2 && styles.playerCardActive]}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderColor: '#EC4899' }]}>
                {myPlayer.slot === 2 && currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                )}
              </View>
              {activeSlot === 2 && <View style={styles.activeDot} />}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {myPlayer.slot === 2 ? t('You') : opponentPlayer.name}
            </Text>
            <View style={[styles.roundWinsBadge, { backgroundColor: '#831843' }]}>
              <Text style={[styles.roundWinsText, { color: '#F472B6' }]}>
                {roundScores[2] || 0} <T>Wins</T>
              </Text>
            </View>
            <Text style={styles.pointsSubText}>
              <T>Pts</T>: {totalPoints[2] || 0}
            </Text>
          </View>
        </View>
      ) : (
        /* 4 Players Rumble Row */
        <View style={styles.rumbleScoreboardRow}>
          {playersList.map((p) => {
            const isActive = activeSlot === p.slot;
            const isMe = p.slot === myPlayer.slot;
            return (
              <View
                key={p.slot}
                style={[
                  styles.rumblePlayerCard,
                  isActive && { borderColor: p.color, backgroundColor: '#201A42' },
                ]}
              >
                <View style={[styles.rumbleAvatarCircle, { borderColor: p.color }]}>
                  {isMe && currentUser?.avatar ? (
                    <Image source={{ uri: currentUser.avatar }} style={styles.avatarImg} />
                  ) : (
                    <Text style={{ fontSize: 13 }}>{isMe ? '👤' : '🤖'}</Text>
                  )}
                  {isActive && <View style={styles.rumbleActiveDot} />}
                </View>
                <Text style={styles.rumblePlayerName} numberOfLines={1}>
                  {isMe ? t('You') : p.name}
                </Text>
                <View style={[styles.rumbleWinsBadge, { backgroundColor: p.color }]}>
                  <Text style={styles.rumbleWinsText}>{roundScores[p.slot] || 0}W</Text>
                </View>
                <Text style={styles.rumblePtsText}>{totalPoints[p.slot] || 0}p</Text>
              </View>
            );
          })}
        </View>
      )}


      {/* 3. ROUND BANNER / STATUS MESSAGE */}
      {roundBanner ? (
        <Animated.View style={[styles.roundBannerWrap, { opacity: bannerOpacity }]}>
          <LinearGradient
            colors={roundWinnerSlot === myPlayer.slot ? ['#059669', '#10B981'] : ['#475569', '#1E293B']}
            style={styles.roundBannerGradient}
          >
            <Text style={styles.roundBannerText}>{roundBanner}</Text>
          </LinearGradient>
        </Animated.View>
      ) : (
        <View style={styles.turnStatusWrap}>
          <Text style={styles.turnStatusText}>
            {isMyTurn ? (
              <T>🎲 It's YOUR turn to roll!</T>
            ) : (
              <T>⏳ Opponent is rolling...</T>
            )}
          </Text>
        </View>
      )}

      {/* 4. ARENA DUEL BATTLEGROUND (The 3D Dice Display) */}
      <View style={styles.battleMat}>
        {/* Top: Opponent's Dice Zone */}
        <View style={styles.playerDiceZone}>
          <Text style={styles.zoneLabel}>
            {opponentPlayer.name}
          </Text>
          <Animated.View
            style={[
              styles.dicePairRow,
              rollingPlayer !== null && rollingPlayer !== myPlayer.slot && {
                transform: [{ rotate: spinRotation }, { scale: bounceScale }],
              },
            ]}
          >
            <DiceFace
              value={opponentDice[0]}
              size={64}
              theme="white"
            />
            <View style={{ width: 14 }} />
            <DiceFace
              value={opponentDice[1]}
              size={64}
              theme="white"
            />
          </Animated.View>
          <View style={styles.rollSumBadge}>
            <Text style={styles.rollSumText}>
              <T>Roll</T>: {opponentDice[0] + opponentDice[1]}
            </Text>
          </View>
        </View>

        {/* Center Divider: Battle Line */}
        <View style={styles.battleLineDivider}>
          <View style={styles.lineHalf} />
          <View style={styles.lineShield}>
            <Text style={{ fontSize: 13 }}>⚔️</Text>
          </View>
          <View style={styles.lineHalf} />
        </View>

        {/* Bottom: My Dice Zone (DIRECTLY TAPPABLE DICE!) */}
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={!isMyTurn || isRolling || matchOver}
          onPress={triggerRoll}
          style={[
            styles.playerDiceZone,
            isMyTurn && !isRolling && !matchOver && styles.myDiceZoneTurnActive,
          ]}
        >
          {isMyTurn && !isRolling && !matchOver && (
            <Animated.View style={[styles.tapDiceBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.tapDiceBadgeText}><T>👆 TAP DICE TO ROLL</T></Text>
            </Animated.View>
          )}

          <Animated.View
            style={[
              styles.dicePairRow,
              rollingPlayer === myPlayer.slot && {
                transform: [{ rotate: spinRotation }, { scale: bounceScale }],
              },
            ]}
          >
            <DiceFace
              value={playerDice[0]}
              size={76}
              theme="gold"
            />
            <View style={{ width: 16 }} />
            <DiceFace
              value={playerDice[1]}
              size={76}
              theme="gold"
            />
          </Animated.View>

          <View style={[styles.rollSumBadge, { backgroundColor: '#B45309' }]}>
            <Text style={[styles.rollSumText, { color: '#FEF3C7' }]}>
              <T>Roll</T>: {playerDice[0] + playerDice[1]}
            </Text>
          </View>
          <Text style={[styles.zoneLabel, { color: '#F59E0B', marginTop: 4 }]}>
            {t('You')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. INTERACTIVE ROLL ACTION BUTTON */}
      <View style={styles.actionContainer}>
        <Animated.View style={{ transform: [{ scale: isMyTurn ? pulseAnim : 1 }], width: '100%' }}>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={!isMyTurn || isRolling || matchOver}
            onPress={triggerRoll}
            style={[
              styles.rollButton,
              (!isMyTurn || isRolling || matchOver) && styles.rollButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={
                isMyTurn && !isRolling && !matchOver
                  ? ['#8B5CF6', '#6366F1', '#4F46E5']
                  : ['#374151', '#1F2937']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rollButtonGradient}
            >
              <Text style={styles.rollButtonIcon}>🎲</Text>
              <Text style={styles.rollButtonText}>
                {isRolling ? t('Rolling...') : (isMyTurn ? t('ROLL DICE') : t('Wait for Turn'))}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* 6. MATCH WINNER / GAME OVER OVERLAY */}
      {matchOver && (
        <View style={styles.matchOverOverlay}>
          <LinearGradient
            colors={matchWinnerSlot === myPlayer.slot ? ['#1E1B4B', '#0F172A'] : ['#2B1717', '#0F172A']}
            style={styles.victoryCard}
          >
            <Text style={styles.trophyIcon}>
              {matchWinnerSlot === myPlayer.slot ? '🏆' : '💀'}
            </Text>
            <Text style={[styles.victoryTitle, matchWinnerSlot !== myPlayer.slot && { color: '#EF4444' }]}>
              {matchWinnerSlot === myPlayer.slot ? t('VICTORY!') : t('DEFEAT')}
            </Text>
            <Text style={styles.victorySub}>
              {matchWinnerSlot === myPlayer.slot
                ? t('You conquered the Dice Battle!')
                : t('Opponent rolled higher this match!')}
            </Text>

            {/* Pot Prize Box */}
            <View style={styles.prizeBox}>
              <Image source={GOLD_COIN_IMG} style={{ width: 28, height: 28 }} resizeMode="contain" />
              <Text style={styles.prizeAmount}>
                {matchWinnerSlot === myPlayer.slot ? `+${totalPotValue - betAmount}` : `-${betAmount}`} <T>Coins</T>
              </Text>
            </View>

            {/* Match Stats Summary */}
            <View style={styles.matchSummaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}><T>Your Wins</T></Text>
                <Text style={styles.summaryVal}>{roundScores[myPlayer.slot] || 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}><T>Total Pts</T></Text>
                <Text style={styles.summaryVal}>{totalPoints[myPlayer.slot] || 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}><T>Opponent</T></Text>
                <Text style={styles.summaryVal}>{roundScores[opponentPlayer.slot] || 0}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ARENA_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#0F0E17',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2E284A',
    padding: 12,
    alignItems: 'center',
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#25213E',
  },
  topPill: {
    backgroundColor: '#1E1B38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B3363',
  },
  timerPill: {
    backgroundColor: '#1E1B38',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B3363',
  },
  topLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  topValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00E5FF',
  },
  potPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1805',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 6,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  potLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  potValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEF08A',
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 6,
  },
  rumbleScoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
    gap: 4,
  },
  rumblePlayerCard: {
    flex: 1,
    backgroundColor: '#18152B',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2D284E',
  },
  rumbleAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E294E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
    marginBottom: 2,
  },
  rumbleActiveDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0F0E17',
  },
  rumblePlayerName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  rumbleWinsBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  rumbleWinsText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rumblePtsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  playerCard: {
    width: 105,
    backgroundColor: '#18152B',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2D284E',
  },
  playerCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#201A42',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E294E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0F0E17',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  roundWinsBadge: {
    backgroundColor: '#3730A3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  roundWinsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A5B4FC',
  },
  pointsSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  vsBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  gameModeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#818CF8',
    marginTop: 4,
  },
  turnStatusWrap: {
    marginVertical: 4,
  },
  turnStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  roundBannerWrap: {
    marginVertical: 4,
    width: '90%',
  },
  roundBannerGradient: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  roundBannerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  battleMat: {
    width: '100%',
    backgroundColor: '#131124',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#262044',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  playerDiceZone: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
  },
  myDiceZoneTurnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 6,
    width: '100%',
  },
  tapDiceBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tapDiceBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
  },
  dicePairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  rollSumBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rollSumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
  },
  battleLineDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  lineHalf: {
    flex: 1,
    height: 1,
    backgroundColor: '#2E284A',
  },
  lineShield: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#201A3D',
    borderWidth: 1,
    borderColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  actionContainer: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
  },
  rollButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  rollButtonDisabled: {
    opacity: 0.45,
  },
  rollButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  rollButtonIcon: {
    fontSize: 20,
  },
  rollButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  matchOverOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 8, 20, 0.92)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  victoryCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    padding: 16,
  },
  trophyIcon: {
    fontSize: 48,
    marginBottom: 6,
  },
  victoryTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  victorySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1805',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: 8,
    marginBottom: 14,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FEF08A',
  },
  matchSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#2D284E',
    paddingTop: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 2,
  },
});

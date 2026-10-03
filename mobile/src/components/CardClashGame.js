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
const ARENA_WIDTH = Math.min(SCREEN_WIDTH - 24, 384);

const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// Card Deck Values (Rank 2 to 14)
// Rank 14 = Ace (Highest), 13 = King, 12 = Queen, 11 = Jack
const SUITS = [
  { name: 'Spades', symbol: '♠', color: '#0F172A', power: 4 },
  { name: 'Hearts', symbol: '♥', color: '#EF4444', power: 3 },
  { name: 'Diamonds', symbol: '♦', color: '#DC2626', power: 2 },
  { name: 'Clubs', symbol: '♣', color: '#1E293B', power: 1 },
];

const RANKS = [
  { label: '2', val: 2 },
  { label: '3', val: 3 },
  { label: '4', val: 4 },
  { label: '5', val: 5 },
  { label: '6', val: 6 },
  { label: '7', val: 7 },
  { label: '8', val: 8 },
  { label: '9', val: 9 },
  { label: '10', val: 10 },
  { label: 'J', val: 11, emblem: '🧝' },
  { label: 'Q', val: 12, emblem: '👸' },
  { label: 'K', val: 13, emblem: '🤴' },
  { label: 'A', val: 14, emblem: '👑' },
];

// Helper to generate a random playing card
function getRandomCard() {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return {
    ...rank,
    suitName: suit.name,
    suitSymbol: suit.symbol,
    suitColor: suit.color,
    suitPower: suit.power,
    totalPower: rank.val * 10 + suit.power,
  };
}

// Visual Card Component
function PlayingCard({
  card,
  isRevealed = false,
  width = 76,
  height = 112,
  isWinner = false,
}) {
  const isRed = card?.suitColor === '#EF4444' || card?.suitColor === '#DC2626';

  if (!isRevealed || !card) {
    // Royal Face-Down Card Back
    return (
      <LinearGradient
        pointerEvents="none"
        colors={['#1E1B4B', '#312E81', '#1E1B4B']}
        style={[
          cardStyles.cardBox,
          { width, height, borderColor: '#F59E0B' },
          isWinner && cardStyles.winnerGlow,
        ]}
      >
        <View style={cardStyles.backInnerPattern}>
          <Text style={{ fontSize: Math.round(width * 0.28) }}>⚜️</Text>
          <Text style={cardStyles.backYoYoText}>YoYo</Text>
        </View>
      </LinearGradient>
    );
  }

  // Revealed Face-Up Card
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['#FFFFFF', '#F8FAFC', '#E2E8F0']}
      style={[
        cardStyles.cardBox,
        { width, height, borderColor: isWinner ? '#10B981' : (isRed ? '#FCA5A5' : '#94A3B8') },
        isWinner && cardStyles.winnerGlowGreen,
      ]}
    >
      {/* Specular Sheen */}
      <View style={cardStyles.cardSheen} />

      {/* Top Left Rank & Suit */}
      <View style={cardStyles.cornerTL}>
        <Text style={[cardStyles.cornerRank, { color: card.suitColor }]}>
          {card.label}
        </Text>
        <Text style={[cardStyles.cornerSuit, { color: card.suitColor }]}>
          {card.suitSymbol}
        </Text>
      </View>

      {/* Center Big Emblem / Suit */}
      <View style={cardStyles.centerWrap}>
        {card.emblem ? (
          <Text style={{ fontSize: Math.round(width * 0.36) }}>{card.emblem}</Text>
        ) : (
          <Text style={[cardStyles.centerSuit, { color: card.suitColor, fontSize: Math.round(width * 0.38) }]}>
            {card.suitSymbol}
          </Text>
        )}
      </View>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <View style={cardStyles.cornerBR}>
        <Text style={[cardStyles.cornerRank, { color: card.suitColor }]}>
          {card.label}
        </Text>
        <Text style={[cardStyles.cornerSuit, { color: card.suitColor }]}>
          {card.suitSymbol}
        </Text>
      </View>
    </LinearGradient>
  );
}

const cardStyles = StyleSheet.create({
  cardBox: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  winnerGlow: {
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  winnerGlowGreen: {
    borderColor: '#10B981',
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  backInnerPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 10, 35, 0.5)',
  },
  backYoYoText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
    marginTop: 2,
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cornerTL: {
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  cornerBR: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  cornerSuit: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSuit: {
    fontWeight: '900',
  },
});

export default function CardClashGame({
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
  onDraw,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isTurbo = gameMode === 'turbo';
  const MAX_ROUNDS = 1;
  const TURN_LIMIT = 15;

  // Identify My Player
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

  // Players setup (2 or 4 players)
  const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
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
      color: '#3B82F6',
    };

  // State
  const [currentRound, setCurrentRound] = useState(1);
  const [activeSlot, setActiveSlot] = useState(1);
  const [roundScores, setRoundScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 }); // Round wins
  const [playerCards, setPlayerCards] = useState({}); // { 1: cardObj, 2: cardObj, ... }
  const [revealedSlots, setRevealedSlots] = useState({}); // { 1: true, ... }

  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingSlot, setRevealingSlot] = useState(null);
  const [roundBanner, setRoundBanner] = useState('');
  const [roundWinnerSlot, setRoundWinnerSlot] = useState(null);
  const [matchOver, setMatchOver] = useState(false);
  const [matchWinnerSlot, setMatchWinnerSlot] = useState(null);

  // Synchronized refs
  const isRevealingRef = useRef(false);
  const activeSlotRef = useRef(1);
  const matchOverRef = useRef(false);
  const isRoundResolvingRef = useRef(false);
  const revealedSlotsRef = useRef({});
  const playerCardsRef = useRef({});

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
  const cardFlipAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Pulse animation for active card
  useEffect(() => {
    if (activeSlot === myPlayer.slot && !isRevealing && !matchOver) {
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
  }, [activeSlot, myPlayer.slot, isRevealing, matchOver]);

  // Turn countdown timer
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

  // Handle timeout (auto draw)
  const handleTimeExpire = () => {
    if (matchOverRef.current || isRevealingRef.current || isRoundResolvingRef.current) return;
    if (activeSlotRef.current === myPlayer.slot) {
      triggerDraw();
    }
  };

  // AI Turn Trigger - strictly protected against double AI draws
  useEffect(() => {
    if (matchOver || isRevealing || isRoundResolvingRef.current) return;
    if (!isMultiplayer && activeSlot && activeSlot !== myPlayer.slot && !revealedSlots[activeSlot]) {
      const aiDelay = setTimeout(() => {
        aiPerformDraw();
      }, 1000);
      return () => clearTimeout(aiDelay);
    }
  }, [activeSlot, isMultiplayer, matchOver, isRevealing, revealedSlots]);

  // Socket multiplayer listeners
  useEffect(() => {
    if (!socket || !roomCode || playMode !== 'local') return;

    socket.emit('card_clash_join', { roomCode });

    const handleRemoteReveal = (data) => {
      if (String(data?.fromSlot) === String(myPlayer.slot)) return;
      applyCardReveal(data.fromSlot, data.card, false);
    };

    const handleRemoteTurnPassed = ({ nextSlot }) => {
      activeSlotRef.current = nextSlot;
      setActiveSlot(nextSlot);
    };

    const handleRemoteSync = (data) => {
      if (data?.currentRound) setCurrentRound(data.currentRound);
      if (data?.roundScores) setRoundScores(data.roundScores);
    };

    const handleRemoteDraw = () => {
      setMatchOver(true);
      setRoundBanner(t('Match Draw! Bets Refunded 🤝'));
      showToast(t('Match ended in a Draw! Bets refunded.'), 'info');
      setTimeout(() => {
        if (onDraw) onDraw('High Card Clash');
        else if (onLoss) onLoss('High Card Clash');
      }, 1800);
    };

    socket.on('card_clash_reveal', handleRemoteReveal);
    socket.on('card_clash_turn_passed', handleRemoteTurnPassed);
    socket.on('card_clash_sync_round', handleRemoteSync);
    socket.on('game_match_draw', handleRemoteDraw);

    return () => {
      socket.off('card_clash_reveal', handleRemoteReveal);
      socket.off('card_clash_turn_passed', handleRemoteTurnPassed);
      socket.off('card_clash_sync_round', handleRemoteSync);
      socket.off('game_match_draw', handleRemoteDraw);
    };
  }, [socket, roomCode, playMode, myPlayer.slot]);

  // Draw card action
  const triggerDraw = () => {
    if (isRevealingRef.current || matchOverRef.current || isRoundResolvingRef.current) return;
    if (activeSlotRef.current !== myPlayer.slot) {
      showToast(t('Wait for your turn!'), 'info');
      return;
    }
    if (revealedSlotsRef.current[myPlayer.slot]) return;

    isRevealingRef.current = true;
    setIsRevealing(true);

    const drawnCard = getRandomCard();

    if (isMultiplayer && socket && roomCode) {
      socket.emit('card_clash_reveal', {
        roomCode,
        fromSlot: myPlayer.slot,
        card: drawnCard,
      });
    }

    applyCardReveal(myPlayer.slot, drawnCard, true);
  };

  const aiPerformDraw = () => {
    if (isRevealingRef.current || matchOverRef.current || isRoundResolvingRef.current) return;
    const currentActive = activeSlotRef.current;
    if (!currentActive || currentActive === myPlayer.slot) return;
    if (revealedSlotsRef.current[currentActive]) return;

    isRevealingRef.current = true;
    setIsRevealing(true);

    const drawnCard = getRandomCard();
    applyCardReveal(currentActive, drawnCard, false);
  };

  const applyCardReveal = (slot, card, isMe) => {
    isRevealingRef.current = true;
    setIsRevealing(true);
    setRevealingSlot(slot);

    try {
      if (Platform.OS === 'android') Vibration.vibrate(40);
    } catch (e) {}

    // Flip card animation
    cardFlipAnim.setValue(0);
    Animated.timing(cardFlipAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      playerCardsRef.current[slot] = card;
      revealedSlotsRef.current[slot] = true;

      setPlayerCards({ ...playerCardsRef.current });
      setRevealedSlots({ ...revealedSlotsRef.current });

      isRevealingRef.current = false;
      setIsRevealing(false);
      setRevealingSlot(null);

      // Check if all players have revealed their cards for this round
      const allRevealed = playersList.every((p) => revealedSlotsRef.current[p.slot]);
      if (allRevealed) {
        // Lock turns immediately so AI cannot trigger again
        isRoundResolvingRef.current = true;
        activeSlotRef.current = 0;
        setActiveSlot(0);
        if (timerRef.current) clearInterval(timerRef.current);

        setTimeout(() => {
          resolveRound({ ...playerCardsRef.current });
        }, 500);
      } else {
        const nextSlot = (slot % actualPlayersCount) + 1;
        activeSlotRef.current = nextSlot;
        setActiveSlot(nextSlot);
        if (isMultiplayer && isHost && socket && roomCode) {
          socket.emit('card_clash_turn_passed', { roomCode, nextSlot });
        }
      }
    }, 700);
  };

  // Determine round winner
  const resolveRound = (cards) => {
    let highestPower = -1;
    let roundWinner = null;
    let isTie = false;

    playersList.forEach((p) => {
      const c = cards[p.slot];
      const pwr = c?.totalPower || 0;
      if (pwr > highestPower) {
        highestPower = pwr;
        roundWinner = p.slot;
        isTie = false;
      } else if (pwr === highestPower) {
        isTie = true;
      }
    });

    if (isTie) {
      setRoundWinnerSlot('tie');
      setRoundBanner(t('Cards Tied! Re-drawing...'));

      bannerOpacity.setValue(0);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        revealedSlotsRef.current = {};
        playerCardsRef.current = {};
        isRoundResolvingRef.current = false;
        setRevealedSlots({});
        setPlayerCards({});
        setRoundWinnerSlot(null);
        setRoundBanner('');
        activeSlotRef.current = 1;
        setActiveSlot(1);
      }, 1500);
      return;
    }

    // A player won with the higher card!
    setRoundWinnerSlot(roundWinner);
    const winningCard = cards[roundWinner];
    const isMeWinner = roundWinner === myPlayer.slot;
    const winnerName = playersList.find((p) => p.slot === roundWinner)?.name || `${t('Player')} ${roundWinner}`;

    const bannerText = isMeWinner
      ? `${t('VICTORY!')} ${t('You won with higher card')} (${winningCard?.label}${winningCard?.suitSymbol})`
      : `${winnerName} ${t('won with higher card')} (${winningCard?.label}${winningCard?.suitSymbol})`;

    setRoundBanner(bannerText);

    bannerOpacity.setValue(0);
    Animated.timing(bannerOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Lock match permanently so NO AI or player can ever draw again
    setMatchOver(true);
    matchOverRef.current = true;
    isRoundResolvingRef.current = true;
    activeSlotRef.current = 0;
    setActiveSlot(0);
    setMatchWinnerSlot(roundWinner);
    setRoundScores({ [roundWinner]: 1 });
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => {
      if (isMeWinner) {
        onWin && onWin('High Card Clash');
      } else {
        onLoss && onLoss('High Card Clash');
      }
    }, 1200);
  };

  const totalPotValue = propTotalPot || betAmount * playersCount;
  const isMyTurn = activeSlot === myPlayer.slot;

  // 3D Flip interpolation
  const flipInterpolation = cardFlipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER: Round, Pot & Timer */}
      <View style={styles.topBar}>
        <View style={styles.topPill}>
          <Text style={styles.topLabel}><T>ROUND</T></Text>
          <Text style={styles.topValue}>
            {currentRound} / {MAX_ROUNDS}
          </Text>
        </View>

        <View style={styles.potPill}>
          <Image source={GREEN_COIN_IMG} style={styles.coinIcon} resizeMode="contain" />
          <View>
            <Text style={styles.potLabel}><T>TOTAL POT</T></Text>
            <Text style={styles.potValue}>{totalPotValue} <T>Game Coins</T></Text>
          </View>
        </View>

        <View style={styles.timerPill}>
          <Text style={styles.topLabel}><T>TIMER</T></Text>
          <Text style={[styles.topValue, turnTimer <= 3 && { color: '#EF4444' }]}>
            {turnTimer}s
          </Text>
        </View>
      </View>

      {/* 2. PLAYERS SCOREBOARD (2 or 4 Players) */}
      {actualPlayersCount <= 2 ? (
        <View style={styles.scoreboard}>
          {/* Player 1 */}
          <View style={[styles.playerCard, activeSlot === 1 && styles.playerCardActive]}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderColor: '#EF4444' }]}>
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
            <View style={[styles.roundWinsBadge, { backgroundColor: '#991B1B' }]}>
              <Text style={styles.roundWinsText}>
                {roundScores[1] || 0} <T>Wins</T>
              </Text>
            </View>
          </View>

          {/* VS Badge */}
          <View style={styles.vsBadgeContainer}>
            <LinearGradient colors={['#EF4444', '#3B82F6']} style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
            <Text style={styles.gameModeLabel}>
              {isTurbo ? t('Turbo Blitz') : t('Best of 3')}
            </Text>
          </View>

          {/* Player 2 */}
          <View style={[styles.playerCard, activeSlot === 2 && styles.playerCardActive]}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderColor: '#3B82F6' }]}>
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
            <View style={[styles.roundWinsBadge, { backgroundColor: '#1E3A8A' }]}>
              <Text style={styles.roundWinsText}>
                {roundScores[2] || 0} <T>Wins</T>
              </Text>
            </View>
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
              </View>
            );
          })}
        </View>
      )}

      {/* 3. ROUND BANNER / STATUS */}
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
              <T>🃏 It's YOUR turn to draw!</T>
            ) : (
              <T>⏳ Opponent is drawing...</T>
            )}
          </Text>
        </View>
      )}

      {/* 4. CASINO TABLE ARENA (Card Display) */}
      <View style={styles.casinoMat}>
        {actualPlayersCount <= 2 ? (
          /* 1 ON 1 DUEL VIEW */
          <View style={styles.duelCardLayout}>
            {/* Top Opponent Card */}
            <View style={styles.cardSlotWrap}>
              <Text style={styles.cardOwnerLabel}>{opponentPlayer.name}</Text>
              <Animated.View
                style={[
                  revealingSlot === opponentPlayer.slot && {
                    transform: [{ rotateY: flipInterpolation }],
                  },
                ]}
              >
                <PlayingCard
                  card={playerCards[opponentPlayer.slot]}
                  isRevealed={!!revealedSlots[opponentPlayer.slot]}
                  width={84}
                  height={122}
                  isWinner={roundWinnerSlot === opponentPlayer.slot}
                />
              </Animated.View>
            </View>

            {/* Middle Clash Swords */}
            <View style={styles.clashIconWrap}>
              <Text style={{ fontSize: 22 }}>⚔️</Text>
            </View>

            {/* Bottom My Card (Directly Tappable!) */}
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={!isMyTurn || isRevealing || matchOver}
              onPress={triggerDraw}
              style={[
                styles.cardSlotWrap,
                isMyTurn && !isRevealing && !matchOver && styles.myCardTurnActive,
              ]}
            >
              {isMyTurn && !isRevealing && !matchOver && (
                <Animated.View style={[styles.tapPromptBadge, { transform: [{ scale: pulseAnim }] }]}>
                  <Text style={styles.tapPromptText}><T>👆 TAP TO DRAW</T></Text>
                </Animated.View>
              )}
              <Animated.View
                style={[
                  revealingSlot === myPlayer.slot && {
                    transform: [{ rotateY: flipInterpolation }],
                  },
                ]}
              >
                <PlayingCard
                  card={playerCards[myPlayer.slot]}
                  isRevealed={!!revealedSlots[myPlayer.slot]}
                  width={90}
                  height={130}
                  isWinner={roundWinnerSlot === myPlayer.slot}
                />
              </Animated.View>
              <Text style={[styles.cardOwnerLabel, { color: '#F59E0B', marginTop: 4 }]}>
                {t('You')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 4 PLAYERS BATTLE ROYALE VIEW */
          <View style={styles.rumbleCardsGrid}>
            {playersList.map((p) => {
              const isMe = p.slot === myPlayer.slot;
              const isActive = activeSlot === p.slot;
              const isRev = !!revealedSlots[p.slot];
              return (
                <TouchableOpacity
                  key={p.slot}
                  activeOpacity={0.75}
                  disabled={!isMe || !isMyTurn || isRevealing || matchOver}
                  onPress={triggerDraw}
                  style={[
                    styles.rumbleCardItem,
                    isMe && isMyTurn && !isRevealing && !matchOver && styles.myCardTurnActive,
                  ]}
                >
                  <Text style={[styles.rumbleCardOwner, { color: p.color }]} numberOfLines={1}>
                    {isMe ? t('You') : p.name}
                  </Text>
                  <Animated.View
                    style={[
                      revealingSlot === p.slot && {
                        transform: [{ rotateY: flipInterpolation }],
                      },
                    ]}
                  >
                    <PlayingCard
                      card={playerCards[p.slot]}
                      isRevealed={isRev}
                      width={68}
                      height={98}
                      isWinner={roundWinnerSlot === p.slot}
                    />
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 5. INTERACTIVE DRAW BUTTON */}
      <View style={styles.actionContainer}>
        <Animated.View style={{ transform: [{ scale: isMyTurn ? pulseAnim : 1 }], width: '100%' }}>
          <TouchableOpacity
            activeOpacity={0.75}
            disabled={!isMyTurn || isRevealing || matchOver}
            onPress={triggerDraw}
            style={[
              styles.drawButton,
              (!isMyTurn || isRevealing || matchOver) && styles.drawButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={
                isMyTurn && !isRevealing && !matchOver
                  ? ['#DC2626', '#EF4444', '#B91C1C']
                  : ['#374151', '#1F2937']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.drawButtonGradient}
            >
              <Text style={styles.drawButtonIcon}>🃏</Text>
              <Text style={styles.drawButtonText}>
                {isRevealing ? t('Drawing Card...') : (isMyTurn ? t('DRAW CARD') : t('Wait for Turn'))}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* 6. MATCH WINNER / VICTORY MODAL */}
      {matchOver && (
        <View style={styles.matchOverOverlay}>
          <LinearGradient
            colors={matchWinnerSlot === myPlayer.slot ? ['#1E1B4B', '#0F172A'] : ['#2B1717', '#0F172A']}
            style={styles.victoryCard}
          >
            <Text style={styles.trophyIcon}>
              {matchWinnerSlot === myPlayer.slot ? '👑' : '💀'}
            </Text>
            <Text style={[styles.victoryTitle, matchWinnerSlot !== myPlayer.slot && { color: '#EF4444' }]}>
              {matchWinnerSlot === myPlayer.slot ? t('VICTORY!') : t('DEFEAT')}
            </Text>
            <Text style={styles.victorySub}>
              {matchWinnerSlot === myPlayer.slot
                ? t('You conquered the Card Clash!')
                : t('Opponent drew higher cards this match!')}
            </Text>

            {/* Pot Prize Box */}
            <View style={styles.prizeBox}>
              <Image source={GREEN_COIN_IMG} style={{ width: 28, height: 28 }} resizeMode="contain" />
              <Text style={styles.prizeAmount}>
                {matchWinnerSlot === myPlayer.slot ? `+${totalPotValue - betAmount}` : `-${betAmount}`} <T>Game Coins</T>
              </Text>
            </View>

            {/* Match Stats Summary */}
            <View style={styles.matchSummaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}><T>Your Wins</T></Text>
                <Text style={styles.summaryVal}>{roundScores[myPlayer.slot] || 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}><T>Rounds</T></Text>
                <Text style={styles.summaryVal}>{currentRound} / {MAX_ROUNDS}</Text>
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
    backgroundColor: '#0A0A14',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2A1F3D',
    padding: 12,
    alignItems: 'center',
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
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
    marginVertical: 10,
    paddingHorizontal: 6,
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
    borderColor: '#EF4444',
    backgroundColor: '#2A1420',
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  roundWinsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
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
    color: '#F87171',
    marginTop: 4,
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
  casinoMat: {
    width: '100%',
    backgroundColor: '#0D1B12', // Rich casino felt green
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#15803D',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  duelCardLayout: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlotWrap: {
    alignItems: 'center',
    padding: 6,
  },
  myCardTurnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  tapPromptBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  tapPromptText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardOwnerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  clashIconWrap: {
    marginVertical: 6,
  },
  rumbleCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    gap: 8,
  },
  rumbleCardItem: {
    alignItems: 'center',
    padding: 4,
  },
  rumbleCardOwner: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  actionContainer: {
    width: '100%',
    marginTop: 8,
    alignItems: 'center',
  },
  drawButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  drawButtonDisabled: {
    opacity: 0.45,
  },
  drawButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  drawButtonIcon: {
    fontSize: 20,
  },
  drawButtonText: {
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
    backgroundColor: 'rgba(10, 8, 20, 0.94)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  victoryCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EF4444',
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

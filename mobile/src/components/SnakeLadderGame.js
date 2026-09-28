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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 20, 380);
const CELL_SIZE = BOARD_SIZE / 10;
const TOKEN_SIZE = Math.max(18, Math.round(CELL_SIZE * 0.72));

const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');

// Authentic Snakes and Ladders mappings
export const LADDERS = {
  4: 25,
  13: 46,
  33: 49,
  42: 63,
  50: 69,
  62: 81,
  74: 92,
};

export const SNAKES = {
  27: 5,
  40: 3,
  54: 31,
  66: 45,
  76: 58,
  89: 53,
  99: 41,
};

const TOKEN_COLORS = {
  red: { primary: '#DC2626', secondary: '#991B1B', border: '#FFFFFF', name: 'Red' },
  green: { primary: '#10B981', secondary: '#047857', border: '#FFFFFF', name: 'Green' },
  yellow: { primary: '#F59E0B', secondary: '#D97706', border: '#FFFFFF', name: 'Yellow' },
  blue: { primary: '#2563EB', secondary: '#1D4ED8', border: '#FFFFFF', name: 'Blue' },
};

// Convert square number (1 - 100) to grid row and column (0 - 9)
export function getSquareRowCol(sq) {
  if (!sq || sq < 1) return [9, 0];
  if (sq >= 100) return [0, 0];
  const zeroIndex = sq - 1;
  const rowFromBottom = Math.floor(zeroIndex / 10);
  const row = 9 - rowFromBottom;
  const isEvenRowFromBottom = rowFromBottom % 2 === 0;
  const colInRow = zeroIndex % 10;
  const col = isEvenRowFromBottom ? colInRow : 9 - colInRow;
  return [row, col];
}

export default function SnakeLadderGame({
  playersCount = 2,
  currentUser,
  betAmount = 100,
  totalPot: propTotalPot,
  playMode = 'online',
  lobbyPlayers = [],
  forfeitedUserIds = [],
  socket,
  roomCode,
  gameMode = 'classic',
  onWin,
  onLoss,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // 1. Identify My Player & Assigned Color
  const myPlayer =
    (lobbyPlayers || []).find((p) => String(p.userId) === String(currentUser?._id)) ||
    (lobbyPlayers || []).find((p) => p.slot === 1) || {
      slot: 1,
      colorKey: 'red',
      color: '#DC2626',
      name: currentUser?.name || t('You'),
      avatar: currentUser?.avatar,
    };

  const myColor =
    myPlayer.colorKey ||
    (myPlayer.slot === 2 ? 'green' : myPlayer.slot === 3 ? 'yellow' : myPlayer.slot === 4 ? 'blue' : 'red');

  const isMultiplayer = playMode === 'local' && !!socket;

  // Real Opponent Details
  const player1 = (lobbyPlayers || []).find((p) => p.slot === 1) || {
    name: currentUser?.name || t('You'),
    avatar: currentUser?.avatar,
  };
  const player2 = (lobbyPlayers || []).find((p) => p.slot === 2);
  const player3 = (lobbyPlayers || []).find((p) => p.slot === 3);
  const player4 = (lobbyPlayers || []).find((p) => p.slot === 4);

  const opponentPlayer =
    (lobbyPlayers || []).find((p) => p.slot !== myPlayer.slot) ||
    (myPlayer.slot === 1 ? player2 : player1);

  const opponentColor = opponentPlayer?.colorKey || (myColor === 'red' ? 'green' : 'red');
  const opponentName = isMultiplayer
    ? opponentPlayer?.name || (myColor === 'red' ? t('Player 2') : t('Player 1'))
    : t('Opponent (AI)');
  const opponentAvatar = opponentPlayer?.avatar;

  const activePlayers =
    playersCount === 4 ? ['red', 'green', 'yellow', 'blue'] : ['red', 'green'];

  // In Snake & Ladder: EXACTLY 1 GOTI (TOKEN) PER PLAYER!
  // Positions: 1 to 100 (start at 1)
  const [positions, setPositions] = useState(() => {
    const map = {};
    activePlayers.forEach((p) => {
      map[p] = 1;
    });
    return map;
  });

  const positionsRef = useRef(positions);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  const [currentTurn, setCurrentTurn] = useState('red');
  const [diceValue, setDiceValue] = useState(6);
  const [diceRolling, setDiceRolling] = useState(false);
  const [matchOver, setMatchOver] = useState(false);
  const [eventNotice, setEventNotice] = useState('');

  // AI Opponent Dice State
  const [aiDiceValue, setAiDiceValue] = useState(6);
  const [aiRolling, setAiRolling] = useState(false);

  const isTurbo = String(gameMode).toLowerCase() === 'turbo';
  const TURN_LIMIT = isTurbo ? 7 : 20;

  // Reverse Countdown Timer (7s for Turbo, 20s for Classic)
  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const timerRef = useRef(null);
  const handlePlayerRollDiceRef = useRef(null);

  // Animation values
  const diceRotateAnim = useRef(new Animated.Value(0)).current;
  const aiDiceRotateAnim = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const diceHighlightAnim = useRef(new Animated.Value(1)).current;

  // Center board bet & pot indicator state (shows once at start for 3.5s, then dissolves cleanly)
  const [showCenterMedallion, setShowCenterMedallion] = useState(true);
  const medallionOpacity = useRef(new Animated.Value(0)).current;
  const medallionScale = useRef(new Animated.Value(0.75)).current;

  // Dismiss helper
  const dismissCenterMedallion = () => {
    if (showCenterMedallion) {
      Animated.parallel([
        Animated.timing(medallionOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(medallionScale, {
          toValue: 0.85,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCenterMedallion(false);
      });
    }
  };

  // Show center bet & pot banner once at start for 3.5 seconds, then smoothly dissolve away
  useEffect(() => {
    Animated.parallel([
      Animated.spring(medallionScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(medallionOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(medallionOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(medallionScale, {
          toValue: 0.85,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowCenterMedallion(false);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [medallionOpacity, medallionScale]);

  // Dynamic stakes and total pot pool calculation
  const readyPlayersCount =
    (lobbyPlayers || []).filter((p) => p.status === 'ready').length || playersCount || 2;
  const currentBet = Number(betAmount) || 100;
  const totalPot = Number(propTotalPot) || currentBet * readyPlayersCount;

  // Hand pointing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, {
          toValue: 6,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(handAnim, {
          toValue: -2,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [handAnim]);

  // Active dice pulsing highlight animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(diceHighlightAnim, {
          toValue: 1.1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(diceHighlightAnim, {
          toValue: 1.0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [diceHighlightAnim]);

  // Dice roll shaker animation for Player
  const animateDiceRoll = () => {
    diceRotateAnim.setValue(0);
    Animated.timing(diceRotateAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Dice roll shaker animation for AI / Remote
  const animateAiDiceRoll = () => {
    dismissCenterMedallion();
    aiDiceRotateAnim.setValue(0);
    Animated.timing(aiDiceRotateAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const getNextPlayer = (current) => {
    const idx = activePlayers.indexOf(current);
    return activePlayers[(idx + 1) % activePlayers.length];
  };

  // Pass Turn to next player with socket synchronization
  const passTurn = (nextPlayer, broadcast = true) => {
    setCurrentTurn(nextPlayer);
    setTurnTimer(TURN_LIMIT);

    if (broadcast && isMultiplayer && socket && roomCode) {
      socket.emit('snake_turn_passed', { roomCode, nextPlayer });
    }

    // In single-player, if it becomes AI turn, trigger AI roll
    if (!isMultiplayer && nextPlayer !== myColor && !matchOver) {
      setTimeout(() => {
        triggerAiTurn(nextPlayer);
      }, 700);
    }
  };

  // Move goti logic: steps forward, checks for Ladder or Snake, checks for Win (100)
  const executeTokenMove = (player, diceRoll) => {
    const currentPos = positionsRef.current[player] || 1;
    let targetPos = currentPos + diceRoll;

    // Classic Rule: Cannot overshoot 100 (requires exact roll to hit 100)
    if (targetPos > 100) {
      setEventNotice(t('Need exact roll to reach 100!'));
      setTimeout(() => setEventNotice(''), 1500);

      // Pass turn unless rolled a 6
      if (diceRoll === 6) {
        setEventNotice(t('Rolled a 6! Extra Turn! 🎲'));
        setTimeout(() => setEventNotice(''), 1800);
        if (!isMultiplayer && player !== myColor) {
          setTimeout(() => triggerAiTurn(player), 1000);
        }
      } else {
        const nextP = getNextPlayer(player);
        passTurn(nextP);
      }
      return;
    }

    let finalPos = targetPos;
    let eventType = null;

    if (LADDERS[targetPos]) {
      finalPos = LADDERS[targetPos];
      eventType = 'ladder';
    } else if (SNAKES[targetPos]) {
      finalPos = SNAKES[targetPos];
      eventType = 'snake';
    }

    // Update positions state
    setPositions((prev) => ({
      ...prev,
      [player]: finalPos,
    }));

    const isBonusRoll = diceRoll === 6;
    const nextP = isBonusRoll ? player : getNextPlayer(player);

    // Broadcast move in multiplayer
    if (isMultiplayer && socket && roomCode) {
      socket.emit('snake_token_moved', {
        roomCode,
        player,
        position: targetPos,
        diceValue: diceRoll,
        eventType,
        finalPosition: finalPos,
        nextTurn: nextP,
      });
    }

    // Display event notification
    if (eventType === 'ladder') {
      setEventNotice(`🪜 ${t('Super Climb! Climbed from')} ${targetPos} ${t('to')} ${finalPos}!`);
      showToast(`${player === myColor ? t('You') : t('Opponent')} 🪜 ${t('climbed ladder to')} ${finalPos}!`, 'success');
      setTimeout(() => setEventNotice(''), 2200);
    } else if (eventType === 'snake') {
      setEventNotice(`🐍 ${t('Snake Bite! Dropped from')} ${targetPos} ${t('to')} ${finalPos}!`);
      showToast(`${player === myColor ? t('You') : t('Opponent')} 🐍 ${t('bitten by snake down to')} ${finalPos}!`, 'info');
      setTimeout(() => setEventNotice(''), 2200);
    }

    // Check Win Condition: Square 100 reached!
    if (finalPos === 100) {
      setMatchOver(true);
      if (player === myColor) {
        setEventNotice(`🏆 ${t('VICTORY! You reached 100!')}`);
        if (isMultiplayer && socket && roomCode) {
          socket.emit('player_won_match', { roomCode, userId: currentUser?._id });
        }
        setTimeout(() => onWin?.('Snake & Ladder'), 1200);
      } else {
        setEventNotice(`😢 ${t('DEFEAT! Opponent reached 100!')}`);
        setTimeout(() => onLoss?.('Snake & Ladder'), 1200);
      }
      return;
    }

    // Bonus roll on 6 or pass turn
    setTimeout(() => {
      if (diceRoll === 6) {
        setEventNotice(`🎲 ${t('Rolled a 6! Extra Turn!')}`);
        setTimeout(() => setEventNotice(''), 1500);
        if (!isMultiplayer && player !== myColor) {
          triggerAiTurn(player);
        }
      } else {
        passTurn(nextP, true);
      }
    }, 600);
  };

  // AI rolls and moves
  const triggerAiTurn = (aiPlayer) => {
    if (matchOver) return;
    setAiRolling(true);
    animateAiDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      setAiDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 7) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setAiDiceValue(finalVal);
        setAiRolling(false);

        setTimeout(() => {
          executeTokenMove(aiPlayer, finalVal);
        }, 500);
      }
    }, 55);
  };

  // Player rolls dice
  const handlePlayerRollDice = () => {
    if (currentTurn !== myColor || diceRolling || matchOver) return;

    dismissCenterMedallion();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setDiceRolling(true);
    animateDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 7) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setDiceRolling(false);

        // Broadcast roll to other devices in multiplayer
        if (isMultiplayer && socket && roomCode) {
          socket.emit('snake_dice_rolled', { roomCode, player: myColor, diceValue: finalVal });
        }

        setTimeout(() => {
          executeTokenMove(myColor, finalVal);
        }, 400);
      }
    }, 55);
  };
  handlePlayerRollDiceRef.current = handlePlayerRollDice;

  // 20-second turn countdown timer
  useEffect(() => {
    if (matchOver) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTurnTimer(TURN_LIMIT);

    if (currentTurn === myColor && !diceRolling) {
      timerRef.current = setInterval(() => {
        setTurnTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            // Auto-roll dice on timeout
            handlePlayerRollDiceRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentTurn, myColor, diceRolling, matchOver]);

  // Real-time socket sync for multiplayer lobby match
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleRemoteDiceRolled = ({ player, diceValue: remoteVal }) => {
      if (player !== myColor) {
        animateAiDiceRoll();
        setAiDiceValue(remoteVal);
      }
    };

    const handleRemoteTokenMoved = ({ player, finalPosition, nextTurn }) => {
      if (player !== myColor) {
        setPositions((prev) => ({
          ...prev,
          [player]: finalPosition,
        }));
        if (nextTurn) {
          passTurn(nextTurn, false);
        }
      }
    };

    const handleRemoteTurnPassed = ({ nextPlayer }) => {
      passTurn(nextPlayer, false);
    };

    socket.on('snake_dice_rolled', handleRemoteDiceRolled);
    socket.on('snake_token_moved', handleRemoteTokenMoved);
    socket.on('snake_turn_passed', handleRemoteTurnPassed);

    return () => {
      socket.off('snake_dice_rolled', handleRemoteDiceRolled);
      socket.off('snake_token_moved', handleRemoteTokenMoved);
      socket.off('snake_turn_passed', handleRemoteTurnPassed);
    };
  }, [isMultiplayer, socket, myColor]);

  const diceSpin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const aiDiceSpin = aiDiceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  // Render 100 Squares of the Board (1 to 100)
  const renderBoardCells = () => {
    const cells = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        // Calculate square number (1 - 100)
        const rowFromBottom = 9 - row;
        const isEvenRowFromBottom = rowFromBottom % 2 === 0;
        const colInRow = isEvenRowFromBottom ? col : 9 - col;
        const sq = rowFromBottom * 10 + colInRow + 1;

        const isLadderStart = !!LADDERS[sq];
        const isSnakeHead = !!SNAKES[sq];
        const isGoal = sq === 100;
        const isAlternating = (row + col) % 2 === 0;

        cells.push(
          <View
            key={`cell-${sq}`}
            style={[
              styles.cell,
              {
                top: row * CELL_SIZE,
                left: col * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: isGoal
                  ? 'rgba(234, 179, 8, 0.35)'
                  : isAlternating
                  ? '#1E1B4B'
                  : '#0F172A',
                borderColor: isGoal ? '#FBBF24' : '#334155',
              },
            ]}
          >
            {/* Square Number */}
            <Text style={[styles.cellNumber, isGoal && styles.cellNumberGoal]}>
              {sq}
            </Text>

            {/* Special Badges: Ladder, Snake, Goal */}
            {isGoal && (
              <View style={styles.goalBadge}>
                <Text style={{ fontSize: 13 }}>🏆</Text>
                <Text style={styles.goalText}><T>WIN</T></Text>
              </View>
            )}

            {isLadderStart && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialEmoji}>🪜</Text>
                <Text style={styles.ladderTarget}>⬆{LADDERS[sq]}</Text>
              </View>
            )}

            {isSnakeHead && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialEmoji}>🐍</Text>
                <Text style={styles.snakeTarget}>⬇{SNAKES[sq]}</Text>
              </View>
            )}
          </View>
        );
      }
    }
    return cells;
  };

  // Render player tokens (exactly 1 token per active player!)
  const renderTokens = () => {
    return activePlayers.map((playerKey, index) => {
      const pos = positions[playerKey] || 1;
      const [row, col] = getSquareRowCol(pos);
      const tokenColor = TOKEN_COLORS[playerKey];

      // Offset when multiple tokens are on the same square
      const offsetOffsets = [
        { dx: -3, dy: -3 },
        { dx: 3, dy: 3 },
        { dx: -3, dy: 3 },
        { dx: 3, dy: -3 },
      ];
      const offset = offsetOffsets[index % 4];

      const topPos = row * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offset.dy;
      const leftPos = col * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offset.dx;

      const isCurrentPlayerTurn = currentTurn === playerKey;

      return (
        <Animated.View
          key={`token-${playerKey}`}
          style={[
            styles.tokenContainer,
            {
              top: topPos,
              left: leftPos,
              transform: isCurrentPlayerTurn ? [{ scale: diceHighlightAnim }] : [{ scale: 1 }],
            },
          ]}
        >
          <View
            style={[
              styles.tokenPawn,
              {
                backgroundColor: tokenColor.primary,
                borderColor: isCurrentPlayerTurn ? '#FBBF24' : tokenColor.border,
                borderWidth: isCurrentPlayerTurn ? 2.5 : 1.5,
              },
            ]}
          >
            <View
              style={[
                styles.tokenInnerRing,
                { backgroundColor: tokenColor.secondary },
              ]}
            >
              <Text style={styles.tokenPawnSymbol}>★</Text>
            </View>
          </View>
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* OPPONENT CARD (Top) */}
      <View style={[styles.playerHud, currentTurn === opponentColor && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          {opponentAvatar ? (
            <Image source={{ uri: opponentAvatar }} style={styles.playerAvatarImg} />
          ) : (
            <View style={[styles.playerBadge, { backgroundColor: TOKEN_COLORS[opponentColor]?.primary || '#10B981' }]}>
              <Text style={styles.playerBadgeText}>
                {opponentColor === 'red' ? '🔴' : opponentColor === 'green' ? '🟢' : opponentColor === 'yellow' ? '🟡' : '🔵'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.playerName}>{opponentName}</Text>
            <Text style={styles.tokensHomeText}>
              <T>Position</T>: {positions[opponentColor] || 1}/100
            </Text>
          </View>
        </View>

        {/* Opponent's Dice Display */}
        <View style={styles.diceSection}>
          <Animated.View style={{ transform: [{ rotate: aiDiceSpin }] }}>
            <View
              style={[
                styles.diceButton,
                currentTurn === opponentColor && styles.diceButtonActive,
                { borderColor: currentTurn === opponentColor ? (TOKEN_COLORS[opponentColor]?.primary || '#10B981') : '#334155' },
              ]}
            >
              <View style={styles.diceFace}>
                <Text style={[styles.diceEmoji, { color: TOKEN_COLORS[opponentColor]?.primary || '#10B981' }]}>
                  {aiDiceValue === 1 ? '⚀' :
                   aiDiceValue === 2 ? '⚁' :
                   aiDiceValue === 3 ? '⚂' :
                   aiDiceValue === 4 ? '⚃' :
                   aiDiceValue === 5 ? '⚄' : '⚅'}
                </Text>
              </View>
              <Text style={styles.diceValueText}>{aiDiceValue}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* MATCH STAKES & WINNER POT STRIP */}
      <View style={styles.stakesStrip}>
        <View style={styles.stakesStripItem}>
          <Image source={GOLD_COIN_IMG} style={styles.stakesStripCoin} resizeMode="contain" />
          <View>
            <Text style={styles.stakesStripLabel}><T>Bets / Player</T></Text>
            <Text style={styles.stakesStripVal}>{currentBet} <T>Coins</T></Text>
          </View>
        </View>

        <View style={styles.stakesStripDivider} />

        <View style={styles.stakesStripItem}>
          <Text style={styles.stakesTrophyEmoji}>🏆</Text>
          <View>
            <Text style={styles.stakesStripLabel}><T>Winner Takes Pot</T></Text>
            <Text style={styles.stakesStripPotVal}>{totalPot} <T>Coins</T></Text>
          </View>
        </View>

        <View style={styles.stakesStripDivider} />

        <View style={styles.stakesDeductedBadge}>
          <Text style={styles.stakesDeductedBadgeText}>🔒 <T>Deducted</T></Text>
        </View>
      </View>

      {/* 2. THE 10x10 AUTHENTIC SNAKES & LADDERS BOARD */}
      <View style={[styles.boardWrapper, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        {/* 100 Squares */}
        {renderBoardCells()}

        {/* Luxury 3D Stakes Medallion (Shows once at start for 3.5s, then dissolves cleanly) */}
        {showCenterMedallion && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerMedallionContainer,
              {
                opacity: medallionOpacity,
                transform: [{ scale: medallionScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#1E1B4B', '#0F172A', '#090D16']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centerMedallionGradient}
            >
              <View style={styles.centerMedallionHeader}>
                <Text style={styles.centerMedallionTitle}><T>BETS</T></Text>
              </View>

              <View style={styles.centerMedallionRow}>
                <Image source={GOLD_COIN_IMG} style={styles.centerCoinImg} resizeMode="contain" />
                <Text style={styles.centerBetAmountText}>{currentBet}</Text>
              </View>

              <View style={styles.centerPotPill}>
                <Text style={styles.centerPotPillText}>
                  <T>POT</T>: {totalPot}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Dynamic Tokens Layer */}
        {renderTokens()}
      </View>

      {/* EVENT NOTICE BANNER */}
      {!!eventNotice && (
        <View style={styles.eventNoticeBanner}>
          <Text style={styles.eventNoticeText}>{eventNotice}</Text>
        </View>
      )}

      {/* 3. BOTTOM PLAYER HUD (My Player) + 3D Interactive Dice */}
      <View style={[styles.playerHud, currentTurn === myColor && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          {myPlayer?.avatar ? (
            <Image source={{ uri: myPlayer.avatar }} style={styles.playerAvatarImg} />
          ) : (
            <View style={[styles.playerBadge, { backgroundColor: TOKEN_COLORS[myColor]?.primary || '#DC2626' }]}>
              <Text style={styles.playerBadgeText}>
                {myColor === 'red' ? '🔴' : myColor === 'green' ? '🟢' : myColor === 'yellow' ? '🟡' : '🔵'}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.playerName}>{myPlayer?.name || t('You')}</Text>
            <Text style={styles.tokensHomeText}>
              <T>Position</T>: {positions[myColor] || 1}/100
            </Text>
          </View>
        </View>

        {/* Dice & Roll Section with Pointing Hand and 20s Countdown */}
        <View style={styles.diceSection}>
          <View style={styles.diceRowContainer}>
            {currentTurn === myColor && !diceRolling && !matchOver && (
              <Animated.View
                style={[
                  styles.pointingHandWrapper,
                  { transform: [{ translateX: handAnim }] },
                ]}
              >
                <Text style={styles.pointingHandText}>👉</Text>
              </Animated.View>
            )}

            <Animated.View
              style={[
                currentTurn === myColor &&
                  !diceRolling &&
                  !matchOver && {
                    transform: [{ scale: diceHighlightAnim }],
                  },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={currentTurn !== myColor || diceRolling || matchOver}
                onPress={handlePlayerRollDice}
                style={[
                  styles.diceButton,
                  currentTurn === myColor && styles.diceButtonActive,
                  { borderColor: currentTurn === myColor ? (TOKEN_COLORS[myColor]?.primary || '#DC2626') : '#334155' },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
                  <View style={styles.diceFace}>
                    <Text style={[styles.diceEmoji, { color: TOKEN_COLORS[myColor]?.primary || '#DC2626' }]}>
                      {diceValue === 1 ? '⚀' :
                       diceValue === 2 ? '⚁' :
                       diceValue === 3 ? '⚂' :
                       diceValue === 4 ? '⚃' :
                       diceValue === 5 ? '⚄' : '⚅'}
                    </Text>
                  </View>
                </Animated.View>
                <Text style={styles.diceValueText}>{diceValue}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 20s Reverse Countdown Badge */}
            {currentTurn === myColor && !diceRolling && !matchOver && (
              <View
                style={[
                  styles.timerBadge,
                  turnTimer <= 5 && styles.timerBadgeUrgent,
                ]}
              >
                <Text
                  style={[
                    styles.timerBadgeText,
                    turnTimer <= 5 && styles.timerBadgeTextUrgent,
                  ]}
                >
                  {turnTimer}s
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleEmoji: {
    fontSize: 22,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  exitBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  exitBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  playerHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  playerHudActive: {
    borderColor: '#00E676',
    backgroundColor: '#0F172A',
    elevation: 4,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeText: {
    fontSize: 16,
  },
  playerAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tokensHomeText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  stakesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E2D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    width: BOARD_SIZE,
    elevation: 3,
  },
  stakesStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stakesStripCoin: {
    width: 18,
    height: 18,
  },
  stakesTrophyEmoji: {
    fontSize: 16,
  },
  stakesStripLabel: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stakesStripVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FDE68A',
  },
  stakesStripPotVal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#34D399',
  },
  stakesStripDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stakesDeductedBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  stakesDeductedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
  },
  boardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#475569',
    position: 'relative',
    backgroundColor: '#090D16',
    elevation: 6,
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 7.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cellNumberGoal: {
    color: '#FBBF24',
    fontWeight: '900',
  },
  goalBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  goalText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FDE68A',
  },
  specialBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  specialEmoji: {
    fontSize: 12,
  },
  ladderTarget: {
    fontSize: 7,
    fontWeight: '800',
    color: '#34D399',
  },
  snakeTarget: {
    fontSize: 7,
    fontWeight: '800',
    color: '#F87171',
  },
  tokenContainer: {
    position: 'absolute',
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  tokenPawn: {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  tokenInnerRing: {
    width: TOKEN_SIZE * 0.6,
    height: TOKEN_SIZE * 0.6,
    borderRadius: (TOKEN_SIZE * 0.6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenPawnSymbol: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  centerMedallionContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: BOARD_SIZE / 2 - 38,
    left: BOARD_SIZE / 2 - 58,
    width: 116,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 30,
    borderWidth: 2,
    borderColor: '#F59E0B',
    elevation: 10,
  },
  centerMedallionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  centerMedallionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  centerMedallionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 0.8,
  },
  centerMedallionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },
  centerCoinImg: {
    width: 15,
    height: 15,
  },
  centerBetAmountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  centerPotPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  centerPotPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#34D399',
  },
  eventNoticeBanner: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  eventNoticeText: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '700',
  },
  diceSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointingHandWrapper: {
    marginRight: 2,
  },
  pointingHandText: {
    fontSize: 22,
  },
  diceButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  diceButtonActive: {
    backgroundColor: '#1E293B',
  },
  diceFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceEmoji: {
    fontSize: 26,
    lineHeight: 28,
  },
  diceValueText: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
  },
  timerBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  timerBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  timerBadgeTextUrgent: {
    color: '#EF4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

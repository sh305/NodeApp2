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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 360);
const CELL_SIZE = (BOARD_SIZE - 16) / 3;

const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// 8 Winning Combinations for 3x3 Tic Tac Toe
const WIN_LINES = [
  [0, 1, 2], // Row 0
  [3, 4, 5], // Row 1
  [6, 7, 8], // Row 2
  [0, 3, 6], // Col 0
  [1, 4, 7], // Col 1
  [2, 5, 8], // Col 2
  [0, 4, 8], // Diagonal Top-Left to Bottom-Right
  [2, 4, 6], // Diagonal Top-Right to Bottom-Left
];

export default function TicTacToeGame({
  playersCount = 2,
  currentUser,
  gameMode = 'classic',
  betAmount = 100,
  totalPot: propTotalPot,
  playMode = 'online',
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
  const TURN_LIMIT = isTurbo ? 7 : 20;

  // 1. Identify My Player & Assigned Symbol
  // Host / Slot 1 is always 'X' (Red Neon), Slot 2 is 'O' (Cyan Neon)
  const myPlayer =
    (lobbyPlayers || []).find((p) => String(p.userId) === String(currentUser?._id)) ||
    (lobbyPlayers || []).find((p) => p.slot === 1) || {
      slot: 1,
      name: currentUser?.name || t('You'),
      avatar: currentUser?.avatar,
    };

  const isMultiplayer = playMode === 'local' && !!socket;
  const isHost = myPlayer.slot === 1;
  const mySymbol = isHost ? 'X' : 'O';
  const opponentSymbol = isHost ? 'O' : 'X';

  const opponentPlayer =
    (lobbyPlayers || []).find((p) => p.slot !== myPlayer.slot) || {
      name: isMultiplayer ? t('Player 2') : t('Opponent (AI)'),
    };
  const opponentName = isMultiplayer
    ? opponentPlayer?.name || (isHost ? t('Player 2') : t('Player 1'))
    : t('Opponent (AI)');
  const opponentAvatar = opponentPlayer?.avatar;

  // Board state: 9 cells (null, 'X', or 'O')
  const [board, setBoard] = useState(Array(9).fill(null));
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Turn state: 'X' starts first
  const [currentTurn, setCurrentTurn] = useState('X');
  const currentTurnRef = useRef(currentTurn);
  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  const [matchOver, setMatchOver] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [eventNotice, setEventNotice] = useState('');
  const [isDraw, setIsDraw] = useState(false);

  // Turn Countdown Timer (7s for Turbo, 20s for Classic)
  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const timerRef = useRef(null);

  // Animations
  const handAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const laserAnim = useRef(new Animated.Value(0)).current;

  // Center stakes banner (displays once at start for 3.5s, then dissolves cleanly)
  const [showCenterMedallion, setShowCenterMedallion] = useState(true);
  const medallionOpacity = useRef(new Animated.Value(0)).current;
  const medallionScale = useRef(new Animated.Value(0.75)).current;

  const dismissCenterMedallion = () => {
    if (showCenterMedallion) {
      Animated.parallel([
        Animated.timing(medallionOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(medallionScale, { toValue: 0.85, duration: 350, useNativeDriver: true }),
      ]).start(() => setShowCenterMedallion(false));
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(medallionScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(medallionOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(medallionOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(medallionScale, { toValue: 0.85, duration: 500, useNativeDriver: true }),
      ]).start(() => setShowCenterMedallion(false));
    }, 3500);

    return () => clearTimeout(timer);
  }, [medallionOpacity, medallionScale]);

  // Stakes and total pot
  const currentBet = Number(betAmount) || 100;
  const totalPot = Number(propTotalPot) || currentBet * 2;

  // Hand pointing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, { toValue: 6, duration: 350, useNativeDriver: true }),
        Animated.timing(handAnim, { toValue: -2, duration: 350, useNativeDriver: true }),
      ])
    ).start();
  }, [handAnim]);

  // Neon pulse for active turn
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // Check if someone won
  const checkWinner = (squares) => {
    for (let i = 0; i < WIN_LINES.length; i++) {
      const [a, b, c] = WIN_LINES[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: WIN_LINES[i] };
      }
    }
    // Check draw (board full and no winner)
    if (squares.every((sq) => sq !== null)) {
      return { winner: 'DRAW', line: null };
    }
    return null;
  };

  // Pass Turn to next symbol with socket broadcast
  const passTurn = (nextSymbol, broadcast = true) => {
    setCurrentTurn(nextSymbol);
    setTurnTimer(TURN_LIMIT);

    if (broadcast && isMultiplayer && socket && roomCode) {
      socket.emit('tictactoe_turn_passed', { roomCode, nextPlayer: nextSymbol });
    }

    // Trigger AI move if single player
    if (!isMultiplayer && nextSymbol === opponentSymbol && !matchOver) {
      setTimeout(() => {
        executeAiMove();
      }, 650);
    }
  };

  // Execute a move on cell index (0 to 8)
  const executeMove = (index, symbol, isRemote = false) => {
    const currentB = [...boardRef.current];
    if (currentB[index] !== null || matchOver) return;

    currentB[index] = symbol;
    setBoard(currentB);
    dismissCenterMedallion();

    // Broadcast move in multiplayer
    if (!isRemote && isMultiplayer && socket && roomCode) {
      socket.emit('tictactoe_move_made', {
        roomCode,
        player: symbol,
        cellIndex: index,
        symbol: symbol,
      });
    }

    // Check winner
    const result = checkWinner(currentB);
    if (result) {
      setMatchOver(true);
      if (result.winner === 'DRAW') {
        setIsDraw(true);
        setEventNotice(t('Match Draw! Bets Refunded 🤝'));
        setTimeout(() => {
          showToast(t('Match ended in a Draw! Bets refunded.'), 'info');
        }, 60);
        if (!isRemote && isMultiplayer && socket && roomCode) {
          socket.emit('tictactoe_match_draw', { roomCode });
        }
        // Auto-close game automatically after tie!
        setTimeout(() => {
          if (onDraw) {
            onDraw('Tic Tac Toe');
          } else if (onLoss) {
            onLoss('Tic Tac Toe');
          }
        }, 1800);
      } else {
        setWinningLine(result.line);
        // Animate winning laser line
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        const isMeWinner = result.winner === mySymbol;
        if (isMeWinner) {
          setEventNotice(`🏆 ${t('VICTORY! You won!')}`);
          setTimeout(() => {
            showToast(`🏆 ${t('VICTORY! You won the match!')}`, 'success');
          }, 60);
          if (!isRemote && isMultiplayer && socket && roomCode) {
            socket.emit('player_won_match', { roomCode, userId: currentUser?._id });
          }
          setTimeout(() => onWin?.('Tic Tac Toe'), 1200);
        } else {
          setEventNotice(`😢 ${t('DEFEAT! Opponent won!')}`);
          setTimeout(() => {
            showToast(`😢 ${t('DEFEAT! Opponent won the match!')}`, 'error');
          }, 60);
          setTimeout(() => onLoss?.('Tic Tac Toe'), 1200);
        }
      }
      return;
    }

    // No winner yet, pass turn to next player
    const nextSymbol = symbol === 'X' ? 'O' : 'X';
    if (!isRemote) {
      passTurn(nextSymbol, true);
    }
  };

  // Smart Tactical AI Bot for Solo Play
  const executeAiMove = () => {
    if (matchOver) return;
    const currentB = [...boardRef.current];

    // 1. Can AI win on this move?
    for (let i = 0; i < 9; i++) {
      if (currentB[i] === null) {
        currentB[i] = opponentSymbol;
        if (checkWinner(currentB)?.winner === opponentSymbol) {
          executeMove(i, opponentSymbol, false);
          return;
        }
        currentB[i] = null;
      }
    }

    // 2. Can Human win on next move? Block them!
    for (let i = 0; i < 9; i++) {
      if (currentB[i] === null) {
        currentB[i] = mySymbol;
        if (checkWinner(currentB)?.winner === mySymbol) {
          executeMove(i, opponentSymbol, false);
          return;
        }
        currentB[i] = null;
      }
    }

    // 3. Take center cell (4) if free
    if (currentB[4] === null) {
      executeMove(4, opponentSymbol, false);
      return;
    }

    // 4. Take available corners [0, 2, 6, 8]
    const corners = [0, 2, 6, 8].filter((c) => currentB[c] === null);
    if (corners.length > 0) {
      const chosen = corners[Math.floor(Math.random() * corners.length)];
      executeMove(chosen, opponentSymbol, false);
      return;
    }

    // 5. Take any remaining cell
    const emptyCells = [];
    currentB.forEach((cell, idx) => {
      if (cell === null) emptyCells.push(idx);
    });
    if (emptyCells.length > 0) {
      const chosen = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      executeMove(chosen, opponentSymbol, false);
    }
  };

  // Player taps a cell
  const handleCellPress = (index) => {
    if (currentTurn !== mySymbol || diceRollingCheck() || board[index] !== null || matchOver) {
      return;
    }
    executeMove(index, mySymbol, false);
  };

  const diceRollingCheck = () => false;

  // Reverse turn countdown timer (7s for Turbo Blitz, 20s for Classic)
  useEffect(() => {
    if (matchOver) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTurnTimer(TURN_LIMIT);

    if (currentTurn === mySymbol) {
      timerRef.current = setInterval(() => {
        setTurnTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentTurn, mySymbol, matchOver, TURN_LIMIT]);

  // Handle timeout auto-move safely outside setState render phase
  useEffect(() => {
    if (turnTimer === 0 && currentTurn === mySymbol && !matchOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const emptyIndices = [];
      boardRef.current.forEach((cell, idx) => {
        if (cell === null) emptyIndices.push(idx);
      });
      if (emptyIndices.length > 0) {
        const randomPick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        executeMove(randomPick, mySymbol, false);
      }
    }
  }, [turnTimer, currentTurn, mySymbol, matchOver]);

  // Real-time socket sync
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleRemoteMove = ({ player, cellIndex, symbol }) => {
      if (symbol !== mySymbol) {
        executeMove(cellIndex, symbol, true);
        passTurn(mySymbol, false);
      }
    };

    const handleRemoteTurnPassed = ({ nextPlayer }) => {
      passTurn(nextPlayer, false);
    };

    const handleRemoteDraw = () => {
      setIsDraw(true);
      setMatchOver(true);
      setEventNotice(t('Match Draw! Bets Refunded 🤝'));
      showToast(t('Match ended in a Draw! Bets refunded.'), 'info');
      // Auto-close game automatically after remote tie!
      setTimeout(() => {
        if (onDraw) {
          onDraw('Tic Tac Toe');
        } else if (onLoss) {
          onLoss('Tic Tac Toe');
        }
      }, 1800);
    };

    socket.on('tictactoe_move_made', handleRemoteMove);
    socket.on('tictactoe_turn_passed', handleRemoteTurnPassed);
    socket.on('game_match_draw', handleRemoteDraw);

    return () => {
      socket.off('tictactoe_move_made', handleRemoteMove);
      socket.off('tictactoe_turn_passed', handleRemoteTurnPassed);
      socket.off('game_match_draw', handleRemoteDraw);
    };
  }, [isMultiplayer, socket, mySymbol]);

  const isMyTurn = currentTurn === mySymbol;

  return (
    <View style={styles.container}>
      {/* 1. OPPONENT CARD (Top) */}
      <View style={[styles.playerHud, !isMyTurn && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          {opponentAvatar ? (
            <Image source={{ uri: opponentAvatar }} style={styles.playerAvatarImg} />
          ) : (
            <View style={[styles.playerBadge, { backgroundColor: opponentSymbol === 'X' ? '#EF4444' : '#00E5FF' }]}>
              <Text style={styles.playerBadgeText}>{opponentSymbol === 'X' ? '❌' : '⭕'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.playerName}>{opponentName}</Text>
            <Text style={styles.symbolLabelText}>
              <T>Playing as</T>: <Text style={{ color: opponentSymbol === 'X' ? '#FF1744' : '#00E5FF', fontWeight: '900' }}>{opponentSymbol}</Text>
            </Text>
          </View>
        </View>

        {/* Opponent Active Indicator */}
        {!isMyTurn && !matchOver && (
          <View style={styles.turnBubble}>
            <Text style={styles.turnBubbleText}><T>Thinking...</T></Text>
          </View>
        )}
      </View>

      {/* MATCH STAKES & WINNER POT STRIP */}
      <View style={styles.stakesStrip}>
        <View style={styles.stakesStripItem}>
          <Image source={GREEN_COIN_IMG} style={styles.stakesStripCoin} resizeMode="contain" />
          <View>
            <Text style={styles.stakesStripLabel}><T>Bets / Player</T></Text>
            <Text style={styles.stakesStripVal}>{currentBet} <T>Game Coins</T></Text>
          </View>
        </View>

        <View style={styles.stakesStripDivider} />

        <View style={styles.stakesStripItem}>
          <Text style={styles.stakesTrophyEmoji}>🏆</Text>
          <View>
            <Text style={styles.stakesStripLabel}><T>Winner Takes Pot</T></Text>
            <Text style={styles.stakesStripPotVal}>{totalPot} <T>Game Coins</T></Text>
          </View>
        </View>

        <View style={styles.stakesStripDivider} />

        <View style={styles.stakesDeductedBadge}>
          <Text style={styles.stakesDeductedBadgeText}>🔒 <T>Deducted</T></Text>
        </View>
      </View>

      {/* 2. NEON 3x3 TIC TAC TOE BOARD */}
      <View style={[styles.boardWrapper, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        {/* Neon Laser Grid Background */}
        <LinearGradient
          colors={['#0F0C20', '#070714', '#02020A']}
          style={styles.boardGradient}
        >
          {/* Laser Grid Cells */}
          <View style={styles.gridContainer}>
            {[0, 1, 2].map((rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {[0, 1, 2].map((colIndex) => {
                  const idx = rowIndex * 3 + colIndex;
                  const cellValue = board[idx];
                  const isWinningCell = winningLine && winningLine.includes(idx);
                  const isX = cellValue === 'X';
                  const isO = cellValue === 'O';

                  return (
                    <TouchableOpacity
                      key={`cell-${idx}`}
                      activeOpacity={0.7}
                      disabled={cellValue !== null || !isMyTurn || matchOver}
                      onPress={() => handleCellPress(idx)}
                      style={[
                        styles.cellBox,
                        colIndex < 2 && styles.borderRightNeon,
                        rowIndex < 2 && styles.borderBottomNeon,
                        isWinningCell && (isX ? styles.winningCellX : styles.winningCellO),
                      ]}
                    >
                      {/* Neon X Element */}
                      {isX && (
                        <Animated.View style={isWinningCell ? { transform: [{ scale: pulseAnim }] } : null}>
                          <Text style={[styles.neonXText, isWinningCell && styles.winningNeonText]}>
                            ✕
                          </Text>
                        </Animated.View>
                      )}

                      {/* Neon O Element */}
                      {isO && (
                        <Animated.View style={isWinningCell ? { transform: [{ scale: pulseAnim }] } : null}>
                          <Text style={[styles.neonOText, isWinningCell && styles.winningNeonText]}>
                            ◯
                          </Text>
                        </Animated.View>
                      )}

                      {/* Empty cell hover glow indicator for my turn */}
                      {cellValue === null && isMyTurn && !matchOver && (
                        <View style={styles.emptyCellGhost}>
                          <Text style={styles.ghostSymbolText}>{mySymbol === 'X' ? '✕' : '◯'}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </LinearGradient>

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
                <Image source={GREEN_COIN_IMG} style={styles.centerCoinImg} resizeMode="contain" />
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
      </View>

      {/* EVENT NOTICE BANNER */}
      {!!eventNotice && (
        <View style={[styles.eventNoticeBanner, isDraw && { borderColor: '#EAB308' }]}>
          <Text style={[styles.eventNoticeText, isDraw && { color: '#FDE047' }]}>{eventNotice}</Text>
        </View>
      )}

      {/* 3. MY PLAYER HUD (Bottom) */}
      <View style={[styles.playerHud, isMyTurn && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          {myPlayer?.avatar ? (
            <Image source={{ uri: myPlayer.avatar }} style={styles.playerAvatarImg} />
          ) : (
            <View style={[styles.playerBadge, { backgroundColor: mySymbol === 'X' ? '#EF4444' : '#00E5FF' }]}>
              <Text style={styles.playerBadgeText}>{mySymbol === 'X' ? '❌' : '⭕'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.playerName}>{myPlayer?.name || t('You')}</Text>
            <Text style={styles.symbolLabelText}>
              <T>Playing as</T>: <Text style={{ color: mySymbol === 'X' ? '#FF1744' : '#00E5FF', fontWeight: '900' }}>{mySymbol}</Text>
            </Text>
          </View>
        </View>

        {/* Turn Indicator & 20s Countdown */}
        <View style={styles.myTurnActionRow}>
          {isMyTurn && !matchOver && (
            <Animated.View style={{ transform: [{ translateX: handAnim }] }}>
              <Text style={styles.pointingHandText}>👉</Text>
            </Animated.View>
          )}

          {isMyTurn && !matchOver ? (
            <View style={[styles.timerBadge, turnTimer <= 5 && styles.timerBadgeUrgent]}>
              <Text style={[styles.timerBadgeText, turnTimer <= 5 && styles.timerBadgeTextUrgent]}>
                {turnTimer}s
              </Text>
            </View>
          ) : (
            <View style={styles.waitingOpponentPill}>
              <Text style={styles.waitingOpponentText}>⏳ <T>Waiting</T></Text>
            </View>
          )}
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
  playerHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  playerHudActive: {
    borderColor: '#00E5FF',
    backgroundColor: '#0F172A',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeText: {
    fontSize: 16,
  },
  playerAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  symbolLabelText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  turnBubble: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  turnBubbleText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
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
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#00E5FF',
    position: 'relative',
    backgroundColor: '#070714',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 10,
    marginVertical: 4,
  },
  boardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gridContainer: {
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cellBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  borderRightNeon: {
    borderRightWidth: 3,
    borderRightColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  borderBottomNeon: {
    borderBottomWidth: 3,
    borderBottomColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  neonXText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FF1744',
    textShadowColor: '#FF1744',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  neonOText: {
    fontSize: 58,
    fontWeight: '900',
    color: '#00E5FF',
    textShadowColor: '#00E5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  winningCellX: {
    backgroundColor: 'rgba(255, 23, 68, 0.25)',
  },
  winningCellO: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  winningNeonText: {
    textShadowRadius: 28,
  },
  emptyCellGhost: {
    opacity: 0.08,
  },
  ghostSymbolText: {
    fontSize: 40,
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
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 4,
  },
  eventNoticeText: {
    color: '#A5B4FC',
    fontSize: 12.5,
    fontWeight: '800',
  },
  myTurnActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointingHandText: {
    fontSize: 22,
  },
  timerBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
  },
  timerBadgeUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  timerBadgeText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
  },
  timerBadgeTextUrgent: {
    color: '#EF4444',
  },
  waitingOpponentPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  waitingOpponentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});

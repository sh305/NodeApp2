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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 24, 380);
const CELL_SIZE = BOARD_SIZE / 15;
const TOKEN_SIZE = Math.max(18, Math.round(CELL_SIZE * 0.88));

const LUDO_BOARD_IMG = require('../../assets/icons/ludo_board.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// 52-cell outer track starting at Red Start [13, 6]
const COMMON_TRACK = [
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
];

// Helper to generate a 57-step path for each player
function generatePlayerPath(startIndex, homeLane) {
  const path = [];
  for (let i = 0; i < 51; i++) {
    path.push(COMMON_TRACK[(startIndex + i) % 52]);
  }
  return path.concat(homeLane);
}

const PLAYER_PATHS = {
  red: generatePlayerPath(0, [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]),
  green: generatePlayerPath(13, [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]]),
  yellow: generatePlayerPath(26, [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]]),
  blue: generatePlayerPath(39, [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]]),
};

// Safe squares (Stars & Starts)
const SAFE_SQUARES = new Set([
  '13,6', '8,2', '6,1', '2,6', '1,8', '6,12', '8,13', '12,8',
]);

// Yard Base Pockets inside the 15x15 board
const YARD_POCKETS = {
  red: [
    [10.8, 1.8], [10.8, 3.8],
    [12.8, 1.8], [12.8, 3.8],
  ],
  green: [
    [1.8, 1.8], [1.8, 3.8],
    [3.8, 1.8], [3.8, 3.8],
  ],
  yellow: [
    [1.8, 10.8], [1.8, 12.8],
    [3.8, 10.8], [3.8, 12.8],
  ],
  blue: [
    [10.8, 10.8], [10.8, 12.8],
    [12.8, 10.8], [12.8, 12.8],
  ],
};

const TOKEN_COLORS = {
  red: { primary: '#DC2626', secondary: '#991B1B', border: '#FFFFFF' },
  green: { primary: '#10B981', secondary: '#047857', border: '#FFFFFF' },
  yellow: { primary: '#F59E0B', secondary: '#D97706', border: '#FFFFFF' },
  blue: { primary: '#2563EB', secondary: '#1D4ED8', border: '#FFFFFF' },
};

export default function LudoGame({
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
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isTurbo = gameMode === 'turbo';
  const TURN_LIMIT = isTurbo ? 7 : 20;

  // Forfeited players handling for multi-player matches
  const forfeitedColors = (lobbyPlayers || [])
    .filter((p) => forfeitedUserIds?.includes(String(p.userId)))
    .map((p) => p.colorKey || (p.slot === 2 ? 'green' : p.slot === 3 ? 'yellow' : 'blue'));

  // 1. Identify My Player & My Assigned Color from lobbyPlayers
  const myPlayer =
    (lobbyPlayers || []).find((p) => String(p.userId) === String(currentUser?._id)) ||
    (lobbyPlayers || []).find((p) => p.slot === 1) || {
      slot: 1,
      colorKey: 'red',
      color: '#DC2626',
      name: currentUser?.name || t('You'),
      avatar: currentUser?.avatar,
    };

  const myColor = myPlayer.colorKey || (myPlayer.slot === 2 ? 'green' : myPlayer.slot === 3 ? 'yellow' : myPlayer.slot === 4 ? 'blue' : 'red');
  const isMultiplayer = playMode === 'local' && !!socket;

  // 2. Extract Real Player Details from lobbyPlayers
  const player1 = (lobbyPlayers || []).find((p) => p.slot === 1) || {
    name: currentUser?.name || t('You'),
    avatar: currentUser?.avatar,
  };
  const player2 = (lobbyPlayers || []).find((p) => p.slot === 2);
  const player3 = (lobbyPlayers || []).find((p) => p.slot === 3);
  const player4 = (lobbyPlayers || []).find((p) => p.slot === 4);

  // 2-player mode opponent (the other player)
  const opponentPlayer = (lobbyPlayers || []).find((p) => p.slot !== myPlayer.slot) ||
    (myPlayer.slot === 1 ? player2 : player1);

  const opponentColor = opponentPlayer?.colorKey || (myColor === 'red' ? 'green' : 'red');
  const opponentName = isMultiplayer
    ? (opponentPlayer?.name || (myColor === 'red' ? t('Player 2') : t('Player 1')))
    : t('Opponent (AI)');
  const opponentAvatar = opponentPlayer?.avatar;

  // Players setup: 2 Players (Red vs Green) or 4 Players (Red, Green, Yellow, Blue)
  const activePlayers = playersCount === 4
    ? ['red', 'green', 'yellow', 'blue']
    : ['red', 'green'];

  // 4 Tokens per player for authentic standard Ludo
  const TOKENS_PER_PLAYER = 4;

  // Tokens state: [ { id: 0, player: 'red', pos: -1 }, ... ]
  const [tokens, setTokens] = useState(() => {
    const list = [];
    activePlayers.forEach((p) => {
      for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
        list.push({ id: i, player: p, pos: -1 });
      }
    });
    return list;
  });

  const [currentTurn, setCurrentTurn] = useState('red'); // 'red' is human user
  const [diceValue, setDiceValue] = useState(6);
  const [diceRolling, setDiceRolling] = useState(false);
  const [waitingForMove, setWaitingForMove] = useState(false);
  const [movableTokenIds, setMovableTokenIds] = useState([]);
  const [matchOver, setMatchOver] = useState(false);
  const [eventNotice, setEventNotice] = useState('');
  const [equippedDice, setEquippedDice] = useState(null);
  const [equippedPiece, setEquippedPiece] = useState(null);

  useEffect(() => {
    const loadEquippedItems = async () => {
      try {
        const storedDice = await AsyncStorage.getItem('@equipped_dice');
        if (storedDice) {
          setEquippedDice(JSON.parse(storedDice));
        }
        const storedPiece = await AsyncStorage.getItem('@equipped_piece');
        if (storedPiece) {
          setEquippedPiece(JSON.parse(storedPiece));
        }
      } catch (_) {}
    };
    loadEquippedItems();
  }, []);

  // AI Opponent Dice State
  const [aiDiceValue, setAiDiceValue] = useState(6);
  const [aiRolling, setAiRolling] = useState(false);
  const [lastAiRoll, setLastAiRoll] = useState(null);

  // Sync latest tokens in ref to avoid stale closures in timeouts
  const tokensRef = useRef(tokens);
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  // Turn Countdown Timer (7s for Turbo, 20s for Classic)
  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const timerRef = useRef(null);
  const handlePlayerRollDiceRef = useRef(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const diceRotateAnim = useRef(new Animated.Value(0)).current;
  const aiDiceRotateAnim = useRef(new Animated.Value(0)).current;
  const handAnim = useRef(new Animated.Value(0)).current;
  const diceHighlightAnim = useRef(new Animated.Value(1)).current;

  // Center board bet & pot indicator state (shows once at start, then auto-fades and never repeats)
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
    // 1. Smooth bounce/scale in
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

    // 2. Auto-dismiss after 3.5 seconds so it disappears and never repeats
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
  }, []);

  // Dynamic stakes and total pot pool calculation
  const readyPlayersCount =
    (lobbyPlayers || []).filter((p) => p.status === 'ready').length || playersCount || 2;
  const currentBet = Number(betAmount) || 100;
  const totalPot = Number(propTotalPot) || currentBet * readyPlayersCount;

  // Pulse effect for moveable tokens
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Hand pointing animation (moves towards dice)
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

  // Dice roll shaker animation for AI
  const animateAiDiceRoll = () => {
    dismissCenterMedallion();
    aiDiceRotateAnim.setValue(0);
    Animated.timing(aiDiceRotateAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Find valid tokens that can move with current dice
  const getMovableTokens = (player, dice, currentTokens) => {
    const pTokens = currentTokens.filter((tok) => tok.player === player);
    const movables = [];

    pTokens.forEach((tok) => {
      if (tok.pos === -1) {
        // In base yard: opens only on 6
        if (dice === 6) {
          movables.push(tok.id);
        }
      } else if (tok.pos >= 0 && tok.pos < 56) {
        // On board: can move if does not overshoot home (56)
        if (tok.pos + dice <= 56) {
          movables.push(tok.id);
        }
      }
    });

    return movables;
  };

  // Switch to next player's turn
  const passTurn = (nextPlayer) => {
    setWaitingForMove(false);
    setMovableTokenIds([]);
    setCurrentTurn(nextPlayer);
  };

  // Next player in sequence (skips forfeited players)
  const getNextPlayer = (player) => {
    let nextIdx = (activePlayers.indexOf(player) + 1) % activePlayers.length;
    let nextP = activePlayers[nextIdx];
    let attempts = 0;
    while (forfeitedColors.includes(nextP) && attempts < activePlayers.length) {
      nextIdx = (nextIdx + 1) % activePlayers.length;
      nextP = activePlayers[nextIdx];
      attempts++;
    }
    return nextP;
  };

  // If active player forfeits mid-game during their turn, automatically pass to next player
  useEffect(() => {
    if (forfeitedColors.includes(currentTurn) && !matchOver) {
      const nextP = getNextPlayer(currentTurn);
      passTurn(nextP);
    }
  }, [forfeitedColors, currentTurn, matchOver]);

  // Handle Token Move
  const executeTokenMove = (player, tokenId, dice, isRemote = false) => {
    setWaitingForMove(false);
    setMovableTokenIds([]);

    // Broadcast move to other devices in multiplayer
    if (!isRemote && isMultiplayer && socket && roomCode) {
      socket.emit('ludo_token_moved', { roomCode, player, tokenId, diceValue: dice });
    }

    setTokens((prevTokens) => {
      let isCut = false;
      let reachedHome = false;
      const updated = prevTokens.map((tok) => {
        if (tok.player === player && tok.id === tokenId) {
          let newPos = tok.pos;
          if (tok.pos === -1) {
            newPos = 0; // Move onto start square
          } else {
            newPos = Math.min(56, tok.pos + dice);
          }

          if (newPos === 56) {
            reachedHome = true;
          }
          return { ...tok, pos: newPos };
        }
        return tok;
      });

      // Find token that just moved
      const movedTok = updated.find((t) => t.player === player && t.id === tokenId);
      if (movedTok && movedTok.pos >= 0 && movedTok.pos < 51) {
        // Calculate board coordinates
        const playerPath = PLAYER_PATHS[player];
        const [r, c] = playerPath[movedTok.pos];
        const coordKey = `${r},${c}`;

        // Check if landing square is NOT safe
        if (!SAFE_SQUARES.has(coordKey)) {
          // Check for opponent tokens on the same square
          for (let i = 0; i < updated.length; i++) {
            const other = updated[i];
            if (other.player !== player && other.pos >= 0 && other.pos < 51) {
              const otherPath = PLAYER_PATHS[other.player];
              const [or, oc] = otherPath[other.pos];
              if (or === r && oc === c) {
                // CUT OPPONENT!
                updated[i] = { ...other, pos: -1 };
                isCut = true;
                break;
              }
            }
          }
        }
      }

      // Check win condition
      const playerHomeTokens = updated.filter((t) => t.player === player && t.pos === 56);
      if (playerHomeTokens.length === TOKENS_PER_PLAYER) {
        setMatchOver(true);
        if (player === myColor) {
          setEventNotice('🏆 VICTORY! All tokens home!');
          setTimeout(() => onWin?.('Ludo'), 1000);
        } else {
          setEventNotice('😢 DEFEAT! Opponent won!');
          setTimeout(() => onLoss?.('Ludo'), 1000);
        }
        return updated;
      }

      // Handle Bonus Rolls or Next Turn
      setTimeout(() => {
        if (isCut || reachedHome || dice === 6) {
          // Bonus Turn: In single-player, trigger AI if not human
          if (!isMultiplayer && player !== myColor) {
            triggerAiTurn(player);
          }
        } else {
          const nextP = getNextPlayer(player);
          passTurn(nextP);
        }
      }, 550);

      return updated;
    });
  };

  // Fair roll chance to prevent goti being stuck indefinitely in yard
  const getAiRoll = (aiPlayer, currentTokens) => {
    const inYardCount = currentTokens.filter(
      (t) => t.player === aiPlayer && t.pos === -1
    ).length;
    // 35% chance to roll a 6 if all tokens are stuck in base yard
    if (inYardCount === TOKENS_PER_PLAYER && Math.random() < 0.35) {
      return 6;
    }
    return Math.floor(Math.random() * 6) + 1;
  };

  const getPlayerRoll = (currentTokens) => {
    const inYardCount = currentTokens.filter(
      (t) => t.player === myColor && t.pos === -1
    ).length;
    if (inYardCount === TOKENS_PER_PLAYER && Math.random() < 0.35) {
      return 6;
    }
    return Math.floor(Math.random() * 6) + 1;
  };

  // Smart tactical AI token chooser
  const selectBestAiToken = (aiPlayer, movables, diceVal, currentTokens) => {
    // 1. Priority: Can AI cut an opponent token?
    for (const tid of movables) {
      const tok = currentTokens.find((t) => t.player === aiPlayer && t.id === tid);
      if (!tok) continue;
      const nextPos = tok.pos === -1 ? 0 : tok.pos + diceVal;
      if (nextPos < 51) {
        const path = PLAYER_PATHS[aiPlayer];
        const [r, c] = path[nextPos];
        const coordKey = `${r},${c}`;
        if (!SAFE_SQUARES.has(coordKey)) {
          const victim = currentTokens.find(
            (o) =>
              o.player !== aiPlayer &&
              o.pos >= 0 &&
              o.pos < 51 &&
              PLAYER_PATHS[o.player][o.pos][0] === r &&
              PLAYER_PATHS[o.player][o.pos][1] === c
          );
          if (victim) return tid;
        }
      }
    }

    // 2. Priority: Can reach home?
    for (const tid of movables) {
      const tok = currentTokens.find((t) => t.player === aiPlayer && t.id === tid);
      if (tok && tok.pos >= 0 && tok.pos + diceVal === 56) {
        return tid;
      }
    }

    // 3. Priority: If rolled a 6 and tokens remain in yard, unlock a new token
    if (diceVal === 6) {
      const yardToken = movables.find((tid) => {
        const tok = currentTokens.find((t) => t.player === aiPlayer && t.id === tid);
        return tok && tok.pos === -1;
      });
      if (yardToken !== undefined) {
        const onBoard = currentTokens.filter(
          (t) => t.player === aiPlayer && t.pos >= 0 && t.pos < 56
        ).length;
        if (onBoard < 2) {
          return yardToken;
        }
      }
    }

    // 4. Default: Advance furthest token closest to home
    let bestTid = movables[0];
    let maxPos = -2;
    for (const tid of movables) {
      const tok = currentTokens.find((t) => t.player === aiPlayer && t.id === tid);
      if (tok && tok.pos > maxPos) {
        maxPos = tok.pos;
        bestTid = tid;
      }
    }
    return bestTid;
  };

  // Player rolls dice
  const handlePlayerRollDice = () => {
    if (currentTurn !== myColor || diceRolling || waitingForMove || matchOver) return;

    // Dismiss center bets display immediately on first roll
    dismissCenterMedallion();

    // Immediately stop the reverse countdown when clicked
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
        const currentTokens = tokensRef.current;
        const finalVal = getPlayerRoll(currentTokens);
        setDiceValue(finalVal);
        setDiceRolling(false);

        // Broadcast roll to other devices in multiplayer
        if (isMultiplayer && socket && roomCode) {
          socket.emit('ludo_dice_rolled', { roomCode, player: myColor, diceValue: finalVal });
        }

        // Check movable tokens
        const movables = getMovableTokens(myColor, finalVal, currentTokens);
        if (movables.length === 0) {
          setTimeout(() => {
            const nextP = getNextPlayer(myColor);
            passTurn(nextP);
            if (isMultiplayer && socket && roomCode) {
              socket.emit('ludo_turn_passed', { roomCode, nextPlayer: nextP });
            }
          }, 700);
        } else if (movables.length === 1) {
          // Auto move single option
          setTimeout(() => {
            executeTokenMove(myColor, movables[0], finalVal);
          }, 350);
        } else {
          // Prompt user to choose token
          setWaitingForMove(true);
          setMovableTokenIds(movables);
        }
      }
    }, 60);
  };

  // Keep ref up to date for timer auto-roll
  handlePlayerRollDiceRef.current = handlePlayerRollDice;

  // Reverse Countdown Timer for Player Turn (7s Turbo, 20s Classic)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentTurn === myColor && !diceRolling && !waitingForMove && !matchOver) {
      setTurnTimer(TURN_LIMIT);
      timerRef.current = setInterval(() => {
        setTurnTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            // Auto roll dice on timeout if user didn't click
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
  }, [currentTurn, myColor, diceRolling, waitingForMove, matchOver]);

  // Real-time socket sync for multiplayer lobby match
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    const handleRemoteDiceRolled = ({ player, diceValue: remoteVal }) => {
      if (player !== myColor) {
        animateAiDiceRoll();
        setAiDiceValue(remoteVal);
        const currentToks = tokensRef.current;
        const movables = getMovableTokens(player, remoteVal, currentToks);
        if (movables.length === 0) {
          setTimeout(() => {
            const nextP = getNextPlayer(player);
            passTurn(nextP);
          }, 800);
        }
      }
    };

    const handleRemoteTokenMoved = ({ player, tokenId, diceValue: remoteVal }) => {
      if (player !== myColor) {
        executeTokenMove(player, tokenId, remoteVal, true);
      }
    };

    const handleRemoteTurnPassed = ({ nextPlayer }) => {
      passTurn(nextPlayer);
    };

    socket.on('ludo_dice_rolled', handleRemoteDiceRolled);
    socket.on('ludo_token_moved', handleRemoteTokenMoved);
    socket.on('ludo_turn_passed', handleRemoteTurnPassed);

    return () => {
      socket.off('ludo_dice_rolled', handleRemoteDiceRolled);
      socket.off('ludo_token_moved', handleRemoteTokenMoved);
      socket.off('ludo_turn_passed', handleRemoteTurnPassed);
    };
  }, [isMultiplayer, socket, myColor]);

  // AI Opponent Turn Logic (Only for Single-player offline mode!)
  const triggerAiTurn = (aiPlayer) => {
    if (matchOver || isMultiplayer) return;

    setAiRolling(true);
    animateAiDiceRoll();

    let rollCount = 0;
    const interval = setInterval(() => {
      setAiDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 7) {
        clearInterval(interval);
        const currentTokens = tokensRef.current;
        const finalVal = getAiRoll(aiPlayer, currentTokens);
        setAiDiceValue(finalVal);
        setLastAiRoll(finalVal);
        setAiRolling(false);

        const movables = getMovableTokens(aiPlayer, finalVal, currentTokens);
        if (movables.length === 0) {
          setTimeout(() => {
            if (!matchOver) {
              const nextP = getNextPlayer(aiPlayer);
              passTurn(nextP);
            }
          }, 800);
        } else {
          const bestId = selectBestAiToken(aiPlayer, movables, finalVal, currentTokens);
          setTimeout(() => {
            if (!matchOver) {
              executeTokenMove(aiPlayer, bestId, finalVal);
            }
          }, 600);
        }
      }
    }, 60);
  };

  // Trigger AI when it's not human's turn ONLY in single-player offline mode
  useEffect(() => {
    if (!isMultiplayer && currentTurn !== myColor && !matchOver) {
      const timer = setTimeout(() => {
        triggerAiTurn(currentTurn);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [isMultiplayer, currentTurn, myColor, matchOver]);

  // Compute token position on the board
  const getTokenCoords = (tok) => {
    if (tok.pos === -1) {
      // In base pocket
      const [r, c] = YARD_POCKETS[tok.player][tok.id];
      return {
        top: r * CELL_SIZE - TOKEN_SIZE / 2,
        left: c * CELL_SIZE - TOKEN_SIZE / 2,
      };
    }

    const path = PLAYER_PATHS[tok.player];
    const target = path[tok.pos] || path[path.length - 1];
    const [r, c] = target;

    // Slight offset if multiple tokens share the square
    const sameSquareTokens = tokens.filter(
      (o) => o.player === tok.player && o.pos === tok.pos
    );
    let offsetTop = 0;
    let offsetLeft = 0;
    if (sameSquareTokens.length > 1) {
      const idx = sameSquareTokens.findIndex((o) => o.id === tok.id);
      const offsets = [
        [-3, -3],
        [3, 3],
        [-3, 3],
        [3, -3],
      ];
      if (idx >= 0 && idx < offsets.length) {
        offsetTop = offsets[idx][0];
        offsetLeft = offsets[idx][1];
      }
    }

    return {
      top: r * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offsetTop,
      left: c * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offsetLeft,
    };
  };

  // Helper counts
  const redHomeCount = tokens.filter((t) => t.player === 'red' && t.pos === 56).length;
  const greenHomeCount = tokens.filter((t) => t.player === 'green' && t.pos === 56).length;

  const diceSpin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const aiDiceSpin = aiDiceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP OPPONENT(S) HUD */}
      {activePlayers.length === 4 ? (
        <View style={styles.multiOpponentsContainer}>
          {activePlayers
            .filter((p) => p !== myColor)
            .map((p) => {
              const pSlotPlayer = p === 'red' ? player1 : p === 'green' ? player2 : p === 'yellow' ? player3 : player4;
              const pColor = TOKEN_COLORS[p].primary;
              const pEmoji = p === 'red' ? '🔴' : p === 'green' ? '🟢' : p === 'yellow' ? '🟡' : '🔵';
              const pName =
                pSlotPlayer?.name ||
                (p === 'red' ? t('Red') : p === 'green' ? t('Green') : p === 'yellow' ? t('Yellow') : t('Blue'));
              const pAvatar = pSlotPlayer?.avatar;
              const pCount = tokens.filter((t) => t.player === p && t.pos === 56).length;
              const isTurn = currentTurn === p;
              const isForfeited = forfeitedColors.includes(p);

              return (
                <View
                  key={p}
                  style={[
                    styles.multiOpponentCard,
                    isTurn && styles.multiOpponentCardActive,
                    isForfeited && { opacity: 0.45 },
                  ]}
                >
                  {pAvatar ? (
                    <Image source={{ uri: pAvatar }} style={styles.miniAvatarImg} />
                  ) : (
                    <View style={[styles.miniBadge, { backgroundColor: pColor }]}>
                      <Text style={styles.miniBadgeText}>{pEmoji}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniName} numberOfLines={1}>
                      {pName}
                    </Text>
                    <Text style={[styles.miniHomeText, isForfeited && { color: '#EF4444' }]}>
                      {isForfeited ? t('Left') : `${pCount}/${TOKENS_PER_PLAYER}`}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      ) : (
        <View style={[styles.playerHud, currentTurn === opponentColor && styles.playerHudActive, forfeitedColors.includes(opponentColor) && { opacity: 0.45 }]}>
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
              <Text style={[styles.tokensHomeText, forfeitedColors.includes(opponentColor) && { color: '#EF4444' }]}>
                {forfeitedColors.includes(opponentColor) ? t('Left Match') : `${t('Tokens Home')}: ${tokens.filter((t) => t.player === opponentColor && t.pos === 56).length}/${TOKENS_PER_PLAYER}`}
              </Text>
            </View>
          </View>

          {/* Opponent 3D Interactive Dice */}
          <View style={styles.diceSection}>
            <View style={styles.diceRowContainer}>
              {currentTurn === opponentColor && !matchOver && (
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
                  currentTurn === opponentColor &&
                    !matchOver && { transform: [{ scale: diceHighlightAnim }] },
                ]}
              >
                <View
                  style={[
                    styles.diceButton,
                    currentTurn === opponentColor && styles.diceButtonActive,
                    { borderColor: currentTurn === opponentColor ? (TOKEN_COLORS[opponentColor]?.primary || '#10B981') : '#334155' },
                  ]}
                >
                  <Animated.View style={{ transform: [{ rotate: aiDiceSpin }] }}>
                    <View style={styles.diceFace}>
                      <Text style={[styles.diceEmoji, { color: TOKEN_COLORS[opponentColor]?.primary || '#10B981' }]}>
                        {aiDiceValue === 1 ? '⚀' :
                         aiDiceValue === 2 ? '⚁' :
                         aiDiceValue === 3 ? '⚂' :
                         aiDiceValue === 4 ? '⚃' :
                         aiDiceValue === 5 ? '⚄' : '⚅'}
                      </Text>
                    </View>
                  </Animated.View>
                  <Text style={styles.diceValueText}>{aiDiceValue}</Text>
                </View>
              </Animated.View>
            </View>
          </View>
        </View>
      )}

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

      {/* 2. THE AUTHENTIC 15x15 LUDO BOARD */}
      <View style={[styles.boardWrapper, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        <Image
          source={LUDO_BOARD_IMG}
          style={styles.boardImage}
          resizeMode="contain"
        />

        {/* 🌟 LUXURY 3D CENTER MEDALLION: BETS & POT (Shows once at start, then auto-hides) 🌟 */}
        {showCenterMedallion && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.centerMedallionContainer,
              {
                top: 6 * CELL_SIZE + 2,
                left: 6 * CELL_SIZE + 2,
                width: 3 * CELL_SIZE - 4,
                height: 3 * CELL_SIZE - 4,
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
              {/* Header: BETS */}
              <View style={styles.centerMedallionHeader}>
                <Text style={styles.centerMedallionTitle}><T>BETS</T></Text>
              </View>

              {/* Coins Graphic & Amount */}
              <View style={styles.centerMedallionRow}>
                <Image
                  source={GREEN_COIN_IMG}
                  style={styles.centerCoinImg}
                  resizeMode="contain"
                />
                <Text style={styles.centerBetAmountText}>{currentBet}</Text>
              </View>

              {/* Total Pot Badge */}
              <View style={styles.centerPotPill}>
                <Text style={styles.centerPotPillText}>
                  <T>POT</T>: {totalPot}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* 3D Dynamic Tokens Layer */}
        {tokens.map((tok) => {
          const coords = getTokenCoords(tok);
          const isMovable =
            currentTurn === myColor &&
            waitingForMove &&
            tok.player === myColor &&
            movableTokenIds.includes(tok.id);

          const tokenColor = TOKEN_COLORS[tok.player];

          return (
            <Animated.View
              key={`${tok.player}-${tok.id}`}
              style={[
                styles.tokenContainer,
                {
                  top: coords.top,
                  left: coords.left,
                  transform: isMovable ? [{ scale: pulseAnim }] : [{ scale: 1 }],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!isMovable}
                onPress={() => executeTokenMove(myColor, tok.id, diceValue)}
                style={[
                  styles.tokenPawn,
                  {
                    backgroundColor: tokenColor.primary,
                    borderColor: isMovable ? '#FBBF24' : tokenColor.border,
                    borderWidth: isMovable ? 2.5 : 1.5,
                  },
                ]}
              >
                {/* 3D Center Crown/Star Ring or Equipped Piece Image */}
                {tok.player === myColor && equippedPiece?.image ? (
                  <View style={styles.equippedPawnWrap}>
                    <Image
                      source={
                        typeof equippedPiece.image === 'string'
                          ? { uri: equippedPiece.image }
                          : equippedPiece.image
                      }
                      style={styles.equippedPawnImg}
                      resizeMode="cover"
                    />
                    {tok.pos === 56 && (
                      <View style={styles.crownOverlay}>
                        <Text style={styles.tokenPawnSymbol}>★</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.tokenInnerRing,
                      { backgroundColor: tokenColor.secondary },
                    ]}
                  >
                    {tok.pos === 56 && (
                      <Text style={styles.tokenPawnSymbol}>★</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

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
              {t('Tokens Home')}: {tokens.filter((t) => t.player === myColor && t.pos === 56).length}/{TOKENS_PER_PLAYER}
            </Text>
          </View>
        </View>

        {/* Dice & Roll Section with Pointing Hand and 20s Countdown */}
        <View style={styles.diceSection}>
          <View style={styles.diceRowContainer}>
            {/* Pointing Hand pointing at player's dice */}
            {currentTurn === myColor && !waitingForMove && !diceRolling && !matchOver && (
              <Animated.View
                style={[
                  styles.pointingHandWrapper,
                  { transform: [{ translateX: handAnim }] },
                ]}
              >
                <Text style={styles.pointingHandText}>👉</Text>
              </Animated.View>
            )}

            {/* Glowing / Pulsing Highlighted Active Dice */}
            <Animated.View
              style={[
                currentTurn === myColor &&
                  !waitingForMove &&
                  !diceRolling &&
                  !matchOver && {
                    transform: [{ scale: diceHighlightAnim }],
                  },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={currentTurn !== myColor || diceRolling || waitingForMove || matchOver}
                onPress={handlePlayerRollDice}
                style={[
                  styles.diceButton,
                  currentTurn === myColor && !waitingForMove && styles.diceButtonActive,
                  { borderColor: currentTurn === myColor ? (TOKEN_COLORS[myColor]?.primary || '#DC2626') : '#334155' },
                ]}
              >
                <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
                  <View style={styles.diceFace}>
                    {equippedDice?.image ? (
                      <Image
                        source={
                          typeof equippedDice.image === 'string'
                            ? { uri: equippedDice.image }
                            : equippedDice.image
                        }
                        style={{ width: 44, height: 44, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[styles.diceEmoji, { color: TOKEN_COLORS[myColor]?.primary || '#DC2626' }]}>
                        {diceValue === 1 ? '⚀' :
                         diceValue === 2 ? '⚁' :
                         diceValue === 3 ? '⚂' :
                         diceValue === 4 ? '⚃' :
                         diceValue === 5 ? '⚄' : '⚅'}
                      </Text>
                    )}
                  </View>
                </Animated.View>
                <Text style={styles.diceValueText}>{diceValue}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 20s Reverse Countdown Badge */}
            {currentTurn === myColor && !waitingForMove && !diceRolling && !matchOver && (
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
  multiOpponentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    gap: 8,
    marginVertical: 8,
  },
  multiOpponentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  multiOpponentCardActive: {
    borderColor: '#00E676',
    backgroundColor: '#0F172A',
    elevation: 3,
  },
  miniBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadgeText: {
    fontSize: 12,
  },
  miniName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  miniHomeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  playerHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  playerHudActive: {
    borderColor: '#00E676',
    backgroundColor: '#0F172A',
    shadowColor: '#00E676',
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
  miniAvatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
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
  turnIndicatorBubble: {
    backgroundColor: '#065F46',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  turnIndicatorText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
  },
  boardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  tokenContainer: {
    position: 'absolute',
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tokenPawn: {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 4,
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  equippedPawnWrap: {
    width: '100%',
    height: '100%',
    borderRadius: TOKEN_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedPawnImg: {
    width: '100%',
    height: '100%',
  },
  crownOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
  },
  noticeBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  noticeBannerText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointingHandText: {
    fontSize: 22,
  },
  timerBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeUrgent: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timerBadgeTextUrgent: {
    color: '#FEF08A',
  },
  diceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  diceButtonActive: {
    borderColor: '#00E676',
    backgroundColor: '#ECFDF5',
    shadowColor: '#00E676',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  diceFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceEmoji: {
    fontSize: 24,
    color: '#DC2626',
  },
  diceValueText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  rollPromptText: {
    fontSize: 10,
    color: '#00E676',
    fontWeight: '800',
    marginTop: 2,
  },
  // Match Stakes Strip above Board
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
    marginBottom: 8,
    width: BOARD_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stakesStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stakesStripCoin: {
    width: 20,
    height: 20,
  },
  stakesTrophyEmoji: {
    fontSize: 18,
  },
  stakesStripLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stakesStripVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
  },
  stakesStripPotVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#34D399',
  },
  stakesStripDivider: {
    width: 1,
    height: 24,
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FBBF24',
  },

  // 🌟 Luxury 3D Center Medallion: BETS & POT 🌟
  centerMedallionContainer: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 15,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  centerMedallionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  centerMedallionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  centerMedallionTitle: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerMedallionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginVertical: 1,
  },
  centerCoinImg: {
    width: 14,
    height: 14,
  },
  centerBetAmountText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerPotPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 1,
  },
  centerPotPillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34D399',
  },
});

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
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 24, 380);
const CELL_SIZE = BOARD_SIZE / 15;
const TOKEN_SIZE = Math.max(18, Math.round(CELL_SIZE * 0.88));

const LUDO_BOARD_IMG = require('../../assets/icons/ludo_board.png');

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
  betAmount = 100,
  onWin,
  onLoss,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Players setup: 2 Players (Red vs Green) or 4 Players (Red, Green, Yellow, Blue)
  const activePlayers = playersCount === 4
    ? ['red', 'green', 'yellow', 'blue']
    : ['red', 'green'];

  // 2 Tokens per player for crisp, dynamic mobile gameplay
  const TOKENS_PER_PLAYER = 2;

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

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const diceRotateAnim = useRef(new Animated.Value(0)).current;

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

  // Dice roll shaker animation
  const animateDiceRoll = () => {
    diceRotateAnim.setValue(0);
    Animated.timing(diceRotateAnim, {
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

  // Next player in sequence
  const getNextPlayer = (player) => {
    const idx = activePlayers.indexOf(player);
    return activePlayers[(idx + 1) % activePlayers.length];
  };

  // Handle Token Move
  const executeTokenMove = (player, tokenId, dice) => {
    setWaitingForMove(false);
    setMovableTokenIds([]);

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
        if (player === 'red') {
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
        if (isCut) {
          setEventNotice('⚔️ PK! Opponent token cut! Bonus Roll!');
          showToast(t('PK! Opponent token cut! ⚔️'), 'success');
          // Bonus roll for same player
          if (player !== 'red') {
            triggerAiTurn(player, updated);
          }
        } else if (reachedHome) {
          setEventNotice('🌟 Token reached HOME! Bonus Roll!');
          showToast(t('Token reached HOME! 🌟'), 'success');
          if (player !== 'red') {
            triggerAiTurn(player, updated);
          }
        } else if (dice === 6) {
          setEventNotice('🎉 Rolled a 6! Roll Again 🎲');
          showToast(t('Rolled a 6! Roll Again 🎲'), 'success');
          if (player !== 'red') {
            triggerAiTurn(player, updated);
          }
        } else {
          setEventNotice('');
          const nextP = getNextPlayer(player);
          passTurn(nextP);
        }
      }, 500);

      return updated;
    });
  };

  // Player rolls dice
  const handlePlayerRollDice = () => {
    if (currentTurn !== 'red' || diceRolling || waitingForMove || matchOver) return;

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

        // Check movable tokens
        const movables = getMovableTokens('red', finalVal, tokens);
        if (movables.length === 0) {
          setEventNotice(t('No valid moves'));
          setTimeout(() => {
            const nextP = getNextPlayer('red');
            passTurn(nextP);
          }, 800);
        } else if (movables.length === 1) {
          // Auto move single option
          setTimeout(() => {
            executeTokenMove('red', movables[0], finalVal);
          }, 350);
        } else {
          // Prompt user to choose token
          setWaitingForMove(true);
          setMovableTokenIds(movables);
          setEventNotice(t('Tap glowing token to move'));
        }
      }
    }, 60);
  };

  // AI Opponent Turn Logic
  const triggerAiTurn = (aiPlayer, currentTokens) => {
    if (matchOver) return;

    setDiceRolling(true);
    animateDiceRoll();

    setTimeout(() => {
      const finalVal = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalVal);
      setDiceRolling(false);

      const movables = getMovableTokens(aiPlayer, finalVal, currentTokens);
      if (movables.length === 0) {
        setTimeout(() => {
          const nextP = getNextPlayer(aiPlayer);
          passTurn(nextP);
        }, 800);
      } else {
        // AI Strategy: Prioritize Cut > Home > Open 6 > Advance
        let bestId = movables[0];

        // Check if any can cut an opponent
        for (const tid of movables) {
          const tok = currentTokens.find((t) => t.player === aiPlayer && t.id === tid);
          const nextPos = tok.pos === -1 ? 0 : tok.pos + finalVal;
          if (nextPos < 51) {
            const path = PLAYER_PATHS[aiPlayer];
            const [r, c] = path[nextPos];
            const coordKey = `${r},${c}`;
            if (!SAFE_SQUARES.has(coordKey)) {
              const victim = currentTokens.find(
                (o) => o.player !== aiPlayer && o.pos >= 0 && o.pos < 51 &&
                PLAYER_PATHS[o.player][o.pos][0] === r && PLAYER_PATHS[o.player][o.pos][1] === c
              );
              if (victim) {
                bestId = tid;
                break;
              }
            }
          }
        }

        setTimeout(() => {
          executeTokenMove(aiPlayer, bestId, finalVal);
        }, 600);
      }
    }, 900);
  };

  // Trigger AI when it's not human's turn
  useEffect(() => {
    if (currentTurn !== 'red' && !matchOver) {
      const timer = setTimeout(() => {
        triggerAiTurn(currentTurn, tokens);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, matchOver]);

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

    // Slight offset if both tokens share the square
    const otherSame = tokens.find(
      (o) => o.player === tok.player && o.id !== tok.id && o.pos === tok.pos
    );
    const offset = otherSame && tok.id === 1 ? 4 : 0;

    return {
      top: r * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offset,
      left: c * CELL_SIZE + (CELL_SIZE - TOKEN_SIZE) / 2 + offset,
    };
  };

  // Helper counts
  const redHomeCount = tokens.filter((t) => t.player === 'red' && t.pos === 56).length;
  const greenHomeCount = tokens.filter((t) => t.player === 'green' && t.pos === 56).length;

  const diceSpin = diceRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP OPPONENT HUD (Green Player) */}
      <View style={[styles.playerHud, currentTurn === 'green' && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          <View style={[styles.playerBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.playerBadgeText}>🟢</Text>
          </View>
          <View>
            <Text style={styles.playerName}>{t('Opponent (AI)')}</Text>
            <Text style={styles.tokensHomeText}>
              {t('Tokens Home')}: {greenHomeCount}/{TOKENS_PER_PLAYER}
            </Text>
          </View>
        </View>

        {currentTurn === 'green' && (
          <View style={styles.turnIndicatorBubble}>
            <Text style={styles.turnIndicatorText}>{t("Opponent's Turn")}</Text>
          </View>
        )}
      </View>

      {/* 2. THE AUTHENTIC 15x15 LUDO BOARD */}
      <View style={[styles.boardWrapper, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        <Image
          source={LUDO_BOARD_IMG}
          style={styles.boardImage}
          resizeMode="contain"
        />

        {/* 3D Dynamic Tokens Layer */}
        {tokens.map((tok) => {
          const coords = getTokenCoords(tok);
          const isMovable =
            currentTurn === 'red' &&
            waitingForMove &&
            tok.player === 'red' &&
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
                onPress={() => executeTokenMove('red', tok.id, diceValue)}
                style={[
                  styles.tokenPawn,
                  {
                    backgroundColor: tokenColor.primary,
                    borderColor: isMovable ? '#FBBF24' : tokenColor.border,
                    borderWidth: isMovable ? 2.5 : 1.5,
                  },
                ]}
              >
                {/* 3D Center Crown/Star Ring */}
                <View
                  style={[
                    styles.tokenInnerRing,
                    { backgroundColor: tokenColor.secondary },
                  ]}
                >
                  <Text style={styles.tokenPawnSymbol}>
                    {tok.pos === 56 ? '★' : tok.id + 1}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* 3. CENTER STATUS & EVENT NOTICE BANNER */}
      {!!eventNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>{eventNotice}</Text>
        </View>
      )}

      {/* 4. BOTTOM PLAYER HUD (Red Player / You) + 3D Interactive Dice */}
      <View style={[styles.playerHud, currentTurn === 'red' && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          <View style={[styles.playerBadge, { backgroundColor: '#DC2626' }]}>
            <Text style={styles.playerBadgeText}>🔴</Text>
          </View>
          <View>
            <Text style={styles.playerName}>{t('You')}</Text>
            <Text style={styles.tokensHomeText}>
              {t('Tokens Home')}: {redHomeCount}/{TOKENS_PER_PLAYER}
            </Text>
          </View>
        </View>

        {/* Dice & Roll Button */}
        <View style={styles.diceSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={currentTurn !== 'red' || diceRolling || waitingForMove || matchOver}
            onPress={handlePlayerRollDice}
            style={[
              styles.diceButton,
              currentTurn === 'red' && !waitingForMove && styles.diceButtonActive,
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: diceSpin }] }}>
              <View style={styles.diceFace}>
                <Text style={styles.diceEmoji}>
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

          {currentTurn === 'red' && !waitingForMove && !diceRolling && !matchOver && (
            <Text style={styles.rollPromptText}>{t('Roll Dice')}</Text>
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
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  G,
  Line,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive Board Geometry
// Modal container has arenaBackdrop(14px padding * 2) + arenaContainer(16px padding * 2) = 60px total
// Subtract 68px total (60 + 8px safety margin) so board always fits within the modal on any phone
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 68, 340);
const FRAME_GOLD_BORDER = 7;
const FRAME_WOOD_WIDTH = 15;
const FRAME_WIDTH = FRAME_GOLD_BORDER + FRAME_WOOD_WIDTH; // 22px
const PLAY_SIZE = BOARD_SIZE - FRAME_WIDTH * 2; // ~296px

const POCKET_RADIUS = 16.5;
const POCKET_TRIGGER_RADIUS = 12; // Realistic pocket capture threshold
const STRIKER_RADIUS = 13.5;
const PUCK_RADIUS = 9.5;
const FRICTION = 0.97;

// Baselines
const BASELINE_BOTTOM_Y = BOARD_SIZE - FRAME_WIDTH - 26;
const BASELINE_TOP_Y = FRAME_WIDTH + 26;
const BASELINE_LEFT_X = FRAME_WIDTH + 26;
const BASELINE_RIGHT_X = BOARD_SIZE - FRAME_WIDTH - 26;

const BASELINE_MIN_X = FRAME_WIDTH + 34;
const BASELINE_MAX_X = BOARD_SIZE - FRAME_WIDTH - 34;

// 4 Corner Pockets
const POCKETS = [
  { id: 'TL', x: FRAME_WIDTH + 14, y: FRAME_WIDTH + 14, name: 'Top-Left' },
  { id: 'TR', x: BOARD_SIZE - FRAME_WIDTH - 14, y: FRAME_WIDTH + 14, name: 'Top-Right' },
  { id: 'BL', x: FRAME_WIDTH + 14, y: BOARD_SIZE - FRAME_WIDTH - 14, name: 'Bottom-Left' },
  { id: 'BR', x: BOARD_SIZE - FRAME_WIDTH - 14, y: BOARD_SIZE - FRAME_WIDTH - 14, name: 'Bottom-Right' },
];

const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');

// Setup central coins (Classic 19-piece flower matching user's screenshot)
const createInitialPucks = (isTurbo = false) => {
  const cx = BOARD_SIZE / 2;
  const cy = BOARD_SIZE / 2;
  const pucks = [
    { id: 'queen', type: 'queen', x: cx, y: cy, vx: 0, vy: 0, pocketed: false, pocketedBy: null },
  ];

  if (isTurbo) {
    // 8 Pucks for fast play (4 White, 4 Black)
    const ringRadius = 22;
    const types = ['white', 'black', 'white', 'black', 'white', 'black', 'white', 'black'];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      pucks.push({
        id: `puck_${i}`,
        type: types[i],
        x: cx + Math.cos(angle) * ringRadius,
        y: cy + Math.sin(angle) * ringRadius,
        vx: 0,
        vy: 0,
        pocketed: false,
        pocketedBy: null,
      });
    }
  } else {
    // 19 Pucks Hexagonal Flower: 1 Queen + 6 Ring 1 + 12 Ring 2 (9 White, 9 Black, 1 Red)
    const r1 = PUCK_RADIUS * 2 + 0.6;
    const r1Types = ['white', 'black', 'white', 'black', 'white', 'black'];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      pucks.push({
        id: `puck_r1_${i}`,
        type: r1Types[i],
        x: cx + Math.cos(angle) * r1,
        y: cy + Math.sin(angle) * r1,
        vx: 0,
        vy: 0,
        pocketed: false,
        pocketedBy: null,
      });
    }

    const r2Corner = PUCK_RADIUS * 4 + 1.2;
    const r2Edge = PUCK_RADIUS * 2 * Math.sqrt(3) + 1.0;
    const r2Types = [
      'black', 'white', 'black', 'white', 'black', 'white',
      'black', 'white', 'black', 'white', 'black', 'white',
    ];
    for (let i = 0; i < 12; i++) {
      const isCorner = i % 2 === 0;
      const angle = (i * Math.PI) / 6;
      const dist = isCorner ? r2Corner : r2Edge;
      pucks.push({
        id: `puck_r2_${i}`,
        type: r2Types[i],
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        pocketed: false,
        pocketedBy: null,
      });
    }
  }

  return pucks;
};

export default function CarromGame({
  playersCount: propPlayersCount = 2,
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

  const isTurbo = String(gameMode).toLowerCase() === 'turbo';
  const TURN_LIMIT = isTurbo ? 10 : 20;

  // 1. DYNAMIC NUMBER OF PLAYERS DETERMINATION (2, 3, or 4 Players)
  const actualPlayersCount = useMemo(() => {
    const validLobby = (lobbyPlayers || []).filter(
      (p) => p.userId || p.status === 'ready' || p.isHost
    );
    if (validLobby.length >= 3) return Math.min(4, validLobby.length);
    if (validLobby.length === 2) return 2;
    return Math.min(4, Math.max(2, propPlayersCount || 2));
  }, [lobbyPlayers, propPlayersCount]);

  // 2. IDENTIFY LOCAL PLAYER (ALWAYS PINNED TO BOTTOM HUD)
  const myPlayer = useMemo(() => {
    return (
      (lobbyPlayers || []).find(
        (p) =>
          String(p.userId) === String(currentUser?._id || currentUser?.id) ||
          (p.name && currentUser?.name && p.name === currentUser.name)
      ) ||
      (lobbyPlayers || []).find((p) => p.slot === 1) || {
        slot: 1,
        name: currentUser?.name || t('You'),
        avatar: currentUser?.avatar,
      }
    );
  }, [lobbyPlayers, currentUser, t]);

  // 3. IDENTIFY ALL OTHER PLAYERS
  const otherPlayers = useMemo(() => {
    return (lobbyPlayers || []).filter(
      (p) =>
        String(p.userId) !== String(myPlayer.userId) &&
        p.slot !== myPlayer.slot &&
        (p.userId || p.name)
    );
  }, [lobbyPlayers, myPlayer]);

  // 4. TOP OPPONENT (ALWAYS OPPOSITE PLAYER, NEVER YOURSELF)
  const topOpponent = useMemo(() => {
    if (otherPlayers.length > 0) {
      return otherPlayers[0];
    }
    return {
      slot: myPlayer.slot === 1 ? 2 : 1,
      name: myPlayer.slot === 1 ? t('Player 2') : t('Player 1'),
      avatar: null,
    };
  }, [otherPlayers, myPlayer, t]);

  // Side Players for 3-Player & 4-Player
  const leftPlayer = useMemo(() => {
    if (actualPlayersCount >= 3) {
      return otherPlayers[1] || { slot: 3, name: t('Player 3'), avatar: null };
    }
    return null;
  }, [otherPlayers, actualPlayersCount, t]);

  const rightPlayer = useMemo(() => {
    if (actualPlayersCount === 4) {
      return otherPlayers[2] || { slot: 4, name: t('Player 4'), avatar: null };
    }
    return null;
  }, [otherPlayers, actualPlayersCount, t]);

  // 5. UNIFIED ABSOLUTE TURN SLOT (1, 2, 3, or 4)
  // Host (Slot 1) breaks first!
  const [currentTurnSlot, setCurrentTurnSlot] = useState(1);
  const isMyTurn = currentTurnSlot === myPlayer.slot;

  const [turnTimer, setTurnTimer] = useState(TURN_LIMIT);
  const timerRef = useRef(null);

  // Scores State
  const [scores, setScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, teamA: 0, teamB: 0 });

  // Central Pucks State
  const [pucks, setPucks] = useState(() => createInitialPucks(isTurbo));
  const pucksRef = useRef(pucks);
  useEffect(() => {
    pucksRef.current = pucks;
  }, [pucks]);

  // Striker Coordinates
  // When it is my turn: striker is on BOTTOM baseline
  // When it is opponent's turn: striker is on TOP baseline
  const [strikerX, setStrikerX] = useState(BOARD_SIZE / 2);
  const [strikerY, setStrikerY] = useState(isMyTurn ? BASELINE_BOTTOM_Y : BASELINE_TOP_Y);
  const [strikerVisible, setStrikerVisible] = useState(true);

  const strikerRef = useRef({
    x: BOARD_SIZE / 2,
    y: isMyTurn ? BASELINE_BOTTOM_Y : BASELINE_TOP_Y,
    vx: 0,
    vy: 0,
    active: false,
  });

  // Aim Angle & Power
  const [aimAngle, setAimAngle] = useState(isMyTurn ? -90 : 90);
  const [aimPower, setAimPower] = useState(80);
  const [isStriking, setIsStriking] = useState(false);

  // Opponent Live Aim State (To show opponent aiming live!)
  const [opponentLiveAim, setOpponentLiveAim] = useState(null);

  // Match Status
  const [eventNotice, setEventNotice] = useState('');
  const [matchOver, setMatchOver] = useState(false);

  const currentBet = betAmount || 100;
  const totalPot = propTotalPot || currentBet * actualPlayersCount;

  // isAiGame: playMode === 'online' in GamingView means "Play vs AI" (direct, no real lobby).
  // playMode === 'local' means real 2-player with lobby + roomCode.
  // This is the CORRECT discriminator — do NOT use roomCode alone because
  // lobbyRoomCode defaults to '7392' even when no real match is happening.
  const isAiGame = playMode === 'online';

  // isMultiplayer: only true in a real local/online match (local mode with roomCode + socket)
  const isMultiplayer = Boolean(!isAiGame && socket && roomCode);
  const lastAimEmitRef = useRef(0);

  // isStrikingRef keeps a ref in sync with isStriking state so setTimeout/setInterval
  // callbacks always read the LATEST value instead of stale closure value
  const isStrikingRef = useRef(false);
  useEffect(() => {
    isStrikingRef.current = isStriking;
  }, [isStriking]);

  // Sync striker baseline when turn changes
  useEffect(() => {
    if (isStriking) return;
    const targetY = isMyTurn ? BASELINE_BOTTOM_Y : BASELINE_TOP_Y;
    setStrikerY(targetY);
    strikerRef.current.y = targetY;
    setStrikerX(BOARD_SIZE / 2);
    strikerRef.current.x = BOARD_SIZE / 2;
    setAimAngle(isMyTurn ? -90 : 90);
    setTurnTimer(TURN_LIMIT);
    setOpponentLiveAim(null);
  }, [isMyTurn, isStriking, TURN_LIMIT]);

  // Turn Countdown Timer
  useEffect(() => {
    if (matchOver) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTurnTimer(TURN_LIMIT);

    if (isMyTurn && !isStriking) {
      timerRef.current = setInterval(() => {
        setTurnTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            handleAutoStrike();
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
  }, [currentTurnSlot, isMyTurn, isStriking, matchOver, TURN_LIMIT]);

  // ==========================================
  // 🎯 PREDICTIVE TRAJECTORY & RAY-CAST ENGINE
  // ==========================================
  const activeAimAngle = isMyTurn ? aimAngle : opponentLiveAim?.angle ?? 90;
  const activeStrikerX = isMyTurn ? strikerX : opponentLiveAim?.x ?? strikerX;
  const activeStrikerY = isMyTurn ? strikerY : opponentLiveAim?.y ?? strikerY;

  const trajectoryData = useMemo(() => {
    if (isStriking || matchOver) return null;

    const rad = (activeAimAngle * Math.PI) / 180;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);

    let closestPuck = null;
    let minDistance = 9999;
    const hitRadius = STRIKER_RADIUS + PUCK_RADIUS;
    const hitRadiusSq = hitRadius * hitRadius;

    for (const p of pucks) {
      if (p.pocketed) continue;

      const dx = p.x - activeStrikerX;
      const dy = p.y - activeStrikerY;
      const proj = dx * dirX + dy * dirY;

      if (proj <= 0) continue;

      const perpDistSq = dx * dx + dy * dy - proj * proj;
      if (perpDistSq <= hitRadiusSq) {
        const offset = Math.sqrt(Math.max(0, hitRadiusSq - perpDistSq));
        const dist = proj - offset;

        if (dist > 0 && dist < minDistance) {
          minDistance = dist;
          const hitStrikerX = activeStrikerX + dirX * dist;
          const hitStrikerY = activeStrikerY + dirY * dist;

          const normDist = Math.hypot(p.x - hitStrikerX, p.y - hitStrikerY) || 1;
          const normX = (p.x - hitStrikerX) / normDist;
          const normY = (p.y - hitStrikerY) / normDist;

          let targetPocket = null;
          for (const pocket of POCKETS) {
            const toPockX = pocket.x - p.x;
            const toPockY = pocket.y - p.y;
            const pockDist = Math.hypot(toPockX, toPockY);
            if (pockDist > 2) {
              const dot = (normX * toPockX + normY * toPockY) / pockDist;
              if (dot > 0.88) {
                targetPocket = pocket;
                break;
              }
            }
          }

          closestPuck = {
            puck: p,
            distance: dist,
            hitStrikerX,
            hitStrikerY,
            normX,
            normY,
            targetPocket,
          };
        }
      }
    }

    const cushionMin = FRAME_WIDTH + STRIKER_RADIUS;
    const cushionMax = BOARD_SIZE - FRAME_WIDTH - STRIKER_RADIUS;

    let wallDist = 9999;
    let wallHitX = activeStrikerX + dirX * 120;
    let wallHitY = activeStrikerY + dirY * 120;

    if (dirX > 0.001) {
      const d = (cushionMax - activeStrikerX) / dirX;
      if (d > 0 && d < wallDist) {
        wallDist = d;
        wallHitX = cushionMax;
        wallHitY = activeStrikerY + dirY * d;
      }
    } else if (dirX < -0.001) {
      const d = (cushionMin - activeStrikerX) / dirX;
      if (d > 0 && d < wallDist) {
        wallDist = d;
        wallHitX = cushionMin;
        wallHitY = activeStrikerY + dirY * d;
      }
    }

    if (dirY > 0.001) {
      const d = (cushionMax - activeStrikerY) / dirY;
      if (d > 0 && d < wallDist) {
        wallDist = d;
        wallHitX = activeStrikerX + dirX * d;
        wallHitY = cushionMax;
      }
    } else if (dirY < -0.001) {
      const d = (cushionMin - activeStrikerY) / dirY;
      if (d > 0 && d < wallDist) {
        wallDist = d;
        wallHitX = activeStrikerX + dirX * d;
        wallHitY = cushionMin;
      }
    }

    const endX = closestPuck ? closestPuck.hitStrikerX : wallHitX;
    const endY = closestPuck ? closestPuck.hitStrikerY : wallHitY;

    return {
      closestPuck,
      endX,
      endY,
      targetPocket: closestPuck?.targetPocket,
    };
  }, [activeStrikerX, activeStrikerY, activeAimAngle, pucks, isStriking, matchOver]);

  // Broadcast Live Aim to Opponent (Smooth 25fps throttle + instant on release)
  const broadcastAimLive = (newX, newAngle, newPower, force = false) => {
    if (!isMultiplayer || !socket || !roomCode) return;
    const now = Date.now();
    if (!force && now - lastAimEmitRef.current < 40) return;
    lastAimEmitRef.current = now;

    socket.emit('carrom_aim_update', {
      roomCode,
      fromSlot: myPlayer.slot,
      startX: newX,
      angle: newAngle,
      power: newPower,
    });
  };

  // Touch anywhere on board to aim
  const handleBoardTouch = (touchX, touchY, isRelease = false) => {
    if (!isMyTurn || isStriking || matchOver) return;

    const boardX = touchX + FRAME_WIDTH;
    const boardY = touchY + FRAME_WIDTH;

    // Smart Snap-to-Target when touching coin
    for (const p of pucks) {
      if (p.pocketed) continue;
      const d = Math.hypot(p.x - boardX, p.y - boardY);
      if (d < PUCK_RADIUS + 14) {
        const dx = p.x - strikerX;
        const dy = p.y - strikerY;
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        angleDeg = Math.min(-15, Math.max(-165, angleDeg));
        setAimAngle(angleDeg);
        broadcastAimLive(strikerX, angleDeg, aimPower, true);
        return;
      }
    }

    // Free aim drag
    const dx = boardX - strikerX;
    const dy = boardY - strikerY;
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (angleDeg > 0) angleDeg = dx >= 0 ? -15 : -165;
    else angleDeg = Math.min(-15, Math.max(-165, angleDeg));

    setAimAngle(angleDeg);
    broadcastAimLive(strikerX, angleDeg, aimPower, isRelease);
  };

  // Nudge aim buttons
  const nudgeAim = (delta) => {
    if (!isMyTurn || isStriking || matchOver) return;
    setAimAngle((prev) => {
      const nextAngle = Math.min(-15, Math.max(-165, prev + delta));
      broadcastAimLive(strikerX, nextAngle, aimPower, true);
      return nextAngle;
    });
  };

  // Baseline Slider Drag
  const handleBaselineSlider = (locationX, containerWidth = 200, isRelease = false) => {
    if (!isMyTurn || isStriking || matchOver) return;
    const ratio = Math.max(0, Math.min(1, locationX / (containerWidth || 180)));
    const newX = BASELINE_MIN_X + ratio * (BASELINE_MAX_X - BASELINE_MIN_X);
    setStrikerX(newX);
    strikerRef.current.x = newX;
    broadcastAimLive(newX, aimAngle, aimPower, isRelease);
  };

  // ==========================================
  // ⚡ TURN PASSING & MULTIPLAYER
  // ==========================================
  const passTurn = (broadcast = true) => {
    const nextSlot =
      actualPlayersCount === 2
        ? currentTurnSlot === 1 ? 2 : 1
        : (currentTurnSlot % actualPlayersCount) + 1;

    setCurrentTurnSlot(nextSlot);
    setTurnTimer(TURN_LIMIT);
    setStrikerVisible(true);
    setOpponentLiveAim(null);

    if (broadcast && isMultiplayer && socket && roomCode) {
      socket.emit('carrom_turn_passed', { roomCode, nextPlayer: nextSlot });
    }

    // AI Turn Trigger: fires whenever there is no live online room (isAiGame) and the
    // next slot is not ours. Works correctly even when socket is connected in offline/AI mode.
    if (isAiGame && nextSlot !== myPlayer.slot && !matchOver) {
      setTimeout(() => {
        triggerAiTurn();
      }, 800);
    }
  };

  // AI Turn Logic (Plays from Top Baseline)
  const triggerAiTurn = () => {
    if (matchOver) return;

    const activeTargets = pucksRef.current.filter((p) => !p.pocketed);
    const target =
      activeTargets.length > 0
        ? activeTargets[Math.floor(Math.random() * activeTargets.length)]
        : null;

    let chosenX = BOARD_SIZE / 2 + (Math.random() * 60 - 30);
    chosenX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, chosenX));

    let targetAngle = 90;
    if (target) {
      const dx = target.x - chosenX;
      const dy = target.y - BASELINE_TOP_Y;
      targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + (Math.random() * 6 - 3);
    }

    setStrikerX(chosenX);
    setStrikerY(BASELINE_TOP_Y);
    strikerRef.current.x = chosenX;
    strikerRef.current.y = BASELINE_TOP_Y;

    setEventNotice(`${topOpponent.name} ${t('Aiming... 🎯')}`);

    setTimeout(() => {
      setEventNotice('');
      executeStrike(chosenX, BASELINE_TOP_Y, targetAngle, 74 + Math.random() * 20, topOpponent.slot);
    }, 900);
  };

  // ==========================================
  // ⚙️ REALISTIC CARROM PHYSICS
  // ==========================================
  const physicsAnimRef = useRef(null);

  const executeStrike = (startX, startY, angleDeg, powerVal, slotIdx) => {
    // Use ref instead of closure state to avoid stale isStriking value in setTimeout callbacks
    if (isStrikingRef.current) return;
    isStrikingRef.current = true;
    setIsStriking(true);

    const rad = (angleDeg * Math.PI) / 180;
    const speed = (powerVal / 100) * 16 + 5;
    const vx = Math.cos(rad) * speed;
    const vy = Math.sin(rad) * speed;

    strikerRef.current = {
      x: startX,
      y: startY,
      vx,
      vy,
      active: true,
    };

    let localPucks = pucksRef.current.map((p) => ({ ...p }));
    let pocketedInThisShot = [];
    let strikerPocketed = false;

    if (physicsAnimRef.current) {
      clearInterval(physicsAnimRef.current);
    }

    const intervalTime = 16;
    let steps = 0;
    const maxSteps = 160;

    physicsAnimRef.current = setInterval(() => {
      steps++;
      let anyMotion = false;

      // 1. Striker Physics
      if (strikerRef.current.active) {
        strikerRef.current.x += strikerRef.current.vx;
        strikerRef.current.y += strikerRef.current.vy;

        strikerRef.current.vx *= FRICTION;
        strikerRef.current.vy *= FRICTION;

        if (Math.hypot(strikerRef.current.vx, strikerRef.current.vy) < 0.14) {
          strikerRef.current.vx = 0;
          strikerRef.current.vy = 0;
        } else {
          anyMotion = true;
        }

        // Cushion Bounces for Striker (clamped strictly inside play area)
        const sMinX = FRAME_WIDTH + STRIKER_RADIUS;
        const sMaxX = BOARD_SIZE - FRAME_WIDTH - STRIKER_RADIUS;
        const sMinY = FRAME_WIDTH + STRIKER_RADIUS;
        const sMaxY = BOARD_SIZE - FRAME_WIDTH - STRIKER_RADIUS;

        if (strikerRef.current.x < sMinX) {
          strikerRef.current.x = sMinX;
          strikerRef.current.vx = Math.abs(strikerRef.current.vx) * 0.84;
        } else if (strikerRef.current.x > sMaxX) {
          strikerRef.current.x = sMaxX;
          strikerRef.current.vx = -Math.abs(strikerRef.current.vx) * 0.84;
        }
        if (strikerRef.current.y < sMinY) {
          strikerRef.current.y = sMinY;
          strikerRef.current.vy = Math.abs(strikerRef.current.vy) * 0.84;
        } else if (strikerRef.current.y > sMaxY) {
          strikerRef.current.y = sMaxY;
          strikerRef.current.vy = -Math.abs(strikerRef.current.vy) * 0.84;
        }

        // Realistic Pocket check for Striker
        for (const pocket of POCKETS) {
          const dist = Math.hypot(strikerRef.current.x - pocket.x, strikerRef.current.y - pocket.y);
          if (dist < POCKET_TRIGGER_RADIUS) {
            strikerPocketed = true;
            strikerRef.current.active = false;
            strikerRef.current.vx = 0;
            strikerRef.current.vy = 0;
            break;
          }
        }
      }

      // 2. Pucks Physics
      for (let i = 0; i < localPucks.length; i++) {
        const p = localPucks[i];
        if (p.pocketed) continue;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= FRICTION;
        p.vy *= FRICTION;

        if (Math.hypot(p.vx, p.vy) < 0.14) {
          p.vx = 0;
          p.vy = 0;
        } else {
          anyMotion = true;
        }

        // Cushion Bounces for Pucks
        if (p.x - PUCK_RADIUS < FRAME_WIDTH) {
          p.x = FRAME_WIDTH + PUCK_RADIUS;
          p.vx = -p.vx * 0.84;
        } else if (p.x + PUCK_RADIUS > BOARD_SIZE - FRAME_WIDTH) {
          p.x = BOARD_SIZE - FRAME_WIDTH - PUCK_RADIUS;
          p.vx = -p.vx * 0.84;
        }
        if (p.y - PUCK_RADIUS < FRAME_WIDTH) {
          p.y = FRAME_WIDTH + PUCK_RADIUS;
          p.vy = -p.vy * 0.84;
        } else if (p.y + PUCK_RADIUS > BOARD_SIZE - FRAME_WIDTH) {
          p.y = BOARD_SIZE - FRAME_WIDTH - PUCK_RADIUS;
          p.vy = -p.vy * 0.84;
        }

        // Pocket check for Pucks
        for (const pocket of POCKETS) {
          const dist = Math.hypot(p.x - pocket.x, p.y - pocket.y);
          if (dist < POCKET_RADIUS + 3) {
            p.pocketed = true;
            p.pocketedBy = slotIdx;
            p.vx = 0;
            p.vy = 0;
            pocketedInThisShot.push({ ...p });
            break;
          }
        }
      }

      // 3. Striker vs Pucks Collision
      if (strikerRef.current.active) {
        for (let i = 0; i < localPucks.length; i++) {
          const p = localPucks[i];
          if (p.pocketed) continue;

          const dx = p.x - strikerRef.current.x;
          const dy = p.y - strikerRef.current.y;
          const dist = Math.hypot(dx, dy);
          const minDist = STRIKER_RADIUS + PUCK_RADIUS;

          if (dist < minDist && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;
            p.x += nx * overlap * 0.65;
            p.y += ny * overlap * 0.65;
            strikerRef.current.x -= nx * overlap * 0.35;
            strikerRef.current.y -= ny * overlap * 0.35;

            const v1n = strikerRef.current.vx * nx + strikerRef.current.vy * ny;
            const v2n = p.vx * nx + p.vy * ny;

            if (v1n - v2n > 0) {
              const m1 = 2.4;
              const m2 = 1.0;
              const v1nPost = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
              const v2nPost = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);

              strikerRef.current.vx += (v1nPost - v1n) * nx;
              strikerRef.current.vy += (v1nPost - v1n) * ny;
              p.vx += (v2nPost - v2n) * nx;
              p.vy += (v2nPost - v2n) * ny;
            }
          }
        }
      }

      // 4. Puck vs Puck Collision
      for (let i = 0; i < localPucks.length; i++) {
        const p1 = localPucks[i];
        if (p1.pocketed) continue;

        for (let j = i + 1; j < localPucks.length; j++) {
          const p2 = localPucks[j];
          if (p2.pocketed) continue;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy);
          const minDist = PUCK_RADIUS * 2;

          if (dist < minDist && dist > 0.001) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;
            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            const v1n = p1.vx * nx + p1.vy * ny;
            const v2n = p2.vx * nx + p2.vy * ny;

            if (v1n - v2n > 0) {
              p1.vx += (v2n - v1n) * nx;
              p1.vy += (v2n - v1n) * ny;
              p2.vx += (v1n - v2n) * nx;
              p2.vy += (v1n - v2n) * ny;
            }
          }
        }
      }

      setPucks([...localPucks]);
      // Hard-clamp state so visual position is always inside board bounds
      const clampedSX = Math.max(FRAME_WIDTH + STRIKER_RADIUS, Math.min(BOARD_SIZE - FRAME_WIDTH - STRIKER_RADIUS, strikerRef.current.x));
      const clampedSY = Math.max(FRAME_WIDTH + STRIKER_RADIUS, Math.min(BOARD_SIZE - FRAME_WIDTH - STRIKER_RADIUS, strikerRef.current.y));
      setStrikerX(clampedSX);
      setStrikerY(clampedSY);

      if (!anyMotion || steps >= maxSteps) {
        clearInterval(physicsAnimRef.current);
        physicsAnimRef.current = null;
        resolveTurnEnd(slotIdx, pocketedInThisShot, strikerPocketed, localPucks);
      }
    }, intervalTime);
  };

  // Turn End Resolution & Scoring
  const resolveTurnEnd = (slotIdx, pocketedInThisShot, strikerPocketed, updatedPucks) => {
    isStrikingRef.current = false; // sync ref immediately so next executeStrike call is not blocked
    setIsStriking(false);

    // Striker Foul
    if (strikerPocketed) {
      setEventNotice(t('Striker Foul! Turn Passed! ⚠️'));
      setTimeout(() => setEventNotice(''), 2000);
      if (slotIdx === myPlayer.slot) {
        passTurn();
      } else {
        const nextSlot =
          actualPlayersCount === 2
            ? slotIdx === 1 ? 2 : 1
            : (slotIdx % actualPlayersCount) + 1;
        setCurrentTurnSlot(nextSlot);
        setTurnTimer(TURN_LIMIT);
        setStrikerVisible(true);
        setOpponentLiveAim(null);
      }
      return;
    }

    let pointsScored = 0;
    pocketedInThisShot.forEach((p) => {
      if (p.type === 'white') pointsScored += 10;
      else if (p.type === 'black') pointsScored += 10;
      else if (p.type === 'queen') pointsScored += 25;
    });

    if (pointsScored > 0) {
      setScores((prev) => {
        const isTeamA = slotIdx === 1 || slotIdx === 3;
        const newScores = {
          ...prev,
          [slotIdx]: (prev[slotIdx] || 0) + pointsScored,
          teamA: isTeamA ? prev.teamA + pointsScored : prev.teamA,
          teamB: !isTeamA ? prev.teamB + pointsScored : prev.teamB,
        };

        // Sync board and scores to remote players
        if (isMultiplayer && socket && roomCode && slotIdx === myPlayer.slot) {
          socket.emit('carrom_sync_board', {
            roomCode,
            pucks: updatedPucks.map((p) => ({
              ...p,
              x: BOARD_SIZE - p.x,
              y: BOARD_SIZE - p.y,
            })),
            scores: newScores,
          });
        }

        return newScores;
      });
    }

    // Check Match Win
    const allPocketed = updatedPucks.every((p) => p.pocketed);
    if (allPocketed) {
      const myScore = actualPlayersCount === 4 ? scores.teamA : (scores[myPlayer.slot] || 0);
      const oppScore = actualPlayersCount === 4 ? scores.teamB : (scores[topOpponent.slot] || 0);

      if (myScore === oppScore) {
        setEventNotice(t('Match Draw! Bets Refunded 🤝'));
        showToast(t('Match ended in a Draw! Bets refunded.'), 'info');
        if (isMultiplayer && socket && roomCode) {
          socket.emit('tictactoe_match_draw', { roomCode });
        }
        setTimeout(() => {
          if (onDraw) onDraw('Carrom Board');
          else if (onLoss) onLoss('Carrom Board');
        }, 1800);
        return;
      }

      const iWon = myScore > oppScore;

      if (iWon) {
        setEventNotice(t('Victory! You Won the Carrom Match! 🏆'));
        showToast(t('Victory! You Won the Carrom Match! 🏆'), 'success');
        onWin?.('Carrom Board');
      } else {
        setEventNotice(t('Match Lost! Opponent cleared the board.'));
        showToast(t('Match Lost! Opponent cleared the board.'), 'info');
        onLoss?.('Carrom Board');
      }
      return;
    }

    // Extra Turn if goti pocketed
    if (pocketedInThisShot.length > 0) {
      setEventNotice(t('Great Shot! Extra Turn! 🎯'));
      setTimeout(() => setEventNotice(''), 1800);

      const isMine = slotIdx === myPlayer.slot;
      const targetY = isMine ? BASELINE_BOTTOM_Y : BASELINE_TOP_Y;
      setStrikerX(BOARD_SIZE / 2);
      setStrikerY(targetY);
      strikerRef.current = {
        x: BOARD_SIZE / 2,
        y: targetY,
        vx: 0,
        vy: 0,
        active: false,
      };
      setStrikerVisible(true);
      setTurnTimer(TURN_LIMIT);

      if (isMultiplayer && socket && roomCode && isMine) {
        socket.emit('carrom_extra_turn', { roomCode, slot: slotIdx });
      }

      // Same guard as passTurn — use isAiGame, not isMultiplayer
      if (isAiGame && slotIdx !== myPlayer.slot) {
        setTimeout(() => triggerAiTurn(), 800);
      }
    } else {
      if (slotIdx === myPlayer.slot) {
        passTurn();
      } else {
        const nextSlot =
          actualPlayersCount === 2
            ? slotIdx === 1 ? 2 : 1
            : (slotIdx % actualPlayersCount) + 1;
        setCurrentTurnSlot(nextSlot);
        setTurnTimer(TURN_LIMIT);
        setStrikerVisible(true);
        setOpponentLiveAim(null);
      }
    }
  };

  const handleAutoStrike = () => {
    if (isStriking || matchOver) return;
    executeStrike(strikerX, BASELINE_BOTTOM_Y, aimAngle, 75, myPlayer.slot);
  };

  const handlePlayerStrike = () => {
    if (!isMyTurn || isStriking || matchOver) return;

    if (isMultiplayer && socket && roomCode) {
      socket.emit('carrom_strike_fired', {
        roomCode,
        startX: strikerX,
        startY: BASELINE_BOTTOM_Y,
        angle: aimAngle,
        power: aimPower,
        fromSlot: myPlayer.slot,
      });
    }

    executeStrike(strikerX, BASELINE_BOTTOM_Y, aimAngle, aimPower, myPlayer.slot);
  };

  // ==========================================
  // 📡 REAL-TIME MULTIPLAYER LISTENERS
  // ==========================================
  useEffect(() => {
    if (!isMultiplayer || !socket) return;

    // Join room channel to guarantee socket receives all room broadcasts
    if (roomCode) {
      socket.emit('carrom_join_room', { roomCode, userId: currentUser?._id });
    }

    // 1. Live Aim Update from Opponent (Watch Opponent Aim Live!)
    const handleRemoteAim = (data) => {
      if (data.fromSlot !== myPlayer.slot) {
        // Invert X and Y for opponent perspective
        const remoteX = BOARD_SIZE - data.startX;
        const remoteY = BASELINE_TOP_Y;
        const remoteAngle = data.angle + 180;
        setOpponentLiveAim({ x: remoteX, y: remoteY, angle: remoteAngle, power: data.power });
        setStrikerX(remoteX);
        setStrikerY(remoteY);
      }
    };

    // 2. Remote Strike Execution (Watch Opponent Shoot Live!)
    const handleRemoteStrike = (data) => {
      if (data.fromSlot !== myPlayer.slot) {
        const remoteX = BOARD_SIZE - data.startX;
        const remoteY = BASELINE_TOP_Y;
        const remoteAngle = data.angle + 180;
        setOpponentLiveAim(null);
        executeStrike(remoteX, remoteY, remoteAngle, data.power, data.fromSlot);
      }
    };

    // 3. Remote Turn Passed
    const handleRemoteTurn = ({ nextPlayer }) => {
      setCurrentTurnSlot(nextPlayer);
      setTurnTimer(TURN_LIMIT);
      setOpponentLiveAim(null);
      setIsStriking(false);
    };

    // 4. Remote Extra Turn
    const handleRemoteExtraTurn = ({ slot }) => {
      setEventNotice(t('Opponent pocketed a coin! Extra Turn! 🎯'));
      setTimeout(() => setEventNotice(''), 1800);
      setCurrentTurnSlot(slot);
      setTurnTimer(TURN_LIMIT);
      setOpponentLiveAim(null);
      setIsStriking(false);
    };

    // 5. Remote Board Sync
    const handleRemoteSync = (data) => {
      if (Array.isArray(data?.pucks)) {
        setPucks(data.pucks);
      }
      if (data?.scores) {
        setScores(data.scores);
      }
    };

    socket.on('carrom_aim_update', handleRemoteAim);
    socket.on('carrom_strike_fired', handleRemoteStrike);
    socket.on('carrom_turn_passed', handleRemoteTurn);
    socket.on('carrom_extra_turn', handleRemoteExtraTurn);
    socket.on('carrom_sync_board', handleRemoteSync);

    return () => {
      socket.off('carrom_aim_update', handleRemoteAim);
      socket.off('carrom_strike_fired', handleRemoteStrike);
      socket.off('carrom_turn_passed', handleRemoteTurn);
      socket.off('carrom_extra_turn', handleRemoteExtraTurn);
      socket.off('carrom_sync_board', handleRemoteSync);
    };
  }, [isMultiplayer, socket, roomCode, myPlayer.slot, currentUser?._id, TURN_LIMIT]);

  // Active turn player name
  const activeTurnName = currentTurnSlot === myPlayer.slot ? myPlayer.name : topOpponent.name;

  return (
    <View style={styles.container}>
      {/* 1. TOP OPPONENT HUD (ALWAYS OPPONENT, NEVER YOU) */}
      {actualPlayersCount === 4 ? (
        <View style={styles.teamScoreStrip}>
          <View style={styles.teamScoreItem}>
            <Text style={[styles.teamScoreLabel, { color: '#60A5FA' }]}>
              🔴 <T>Team A</T>:
            </Text>
            <Text style={styles.teamScoreVal}>{scores.teamA} <T>Pts</T></Text>
          </View>
          <View style={styles.stakesStripDivider} />
          <View style={styles.teamScoreItem}>
            <Text style={[styles.teamScoreLabel, { color: '#F87171' }]}>
              ⚫ <T>Team B</T>:
            </Text>
            <Text style={styles.teamScoreVal}>{scores.teamB} <T>Pts</T></Text>
          </View>
        </View>
      ) : (
        <View style={[styles.playerHud, !isMyTurn && styles.playerHudActive]}>
          <View style={styles.playerInfoRow}>
            {topOpponent?.avatar ? (
              <Image source={{ uri: topOpponent.avatar }} style={styles.playerAvatarImg} />
            ) : (
              <View style={[styles.playerBadge, { backgroundColor: '#1E293B' }]}>
                <Text style={{ fontSize: 13 }}>⚫</Text>
              </View>
            )}
            <View>
              <Text style={styles.playerName}>{topOpponent.name}</Text>
              <Text style={styles.tokensHomeText}>
                <T>Score</T>: {scores[topOpponent.slot] || 0} <T>Pts</T>
              </Text>
            </View>
          </View>
          {!isMyTurn && !matchOver && (
            <View style={styles.turnBubble}>
              <Text style={styles.turnBubbleText}>🎯 <T>Aiming...</T></Text>
            </View>
          )}
        </View>
      )}

      {/* 3 or 4 Player Side Chips */}
      {actualPlayersCount >= 3 && (
        <View style={styles.multiPlayerSideChips}>
          <View
            style={[
              styles.sidePlayerChip,
              currentTurnSlot === 3 && styles.sidePlayerChipActive,
            ]}
          >
            <Text style={styles.sidePlayerName} numberOfLines={1}>
              {currentTurnSlot === 3 ? '🎯 ' : ''}P3: {leftPlayer?.name || t('Player 3')}
            </Text>
            <Text style={styles.sidePlayerScore}>{scores[3] || 0} pts</Text>
          </View>

          {actualPlayersCount === 4 && (
            <View
              style={[
                styles.sidePlayerChip,
                currentTurnSlot === 4 && styles.sidePlayerChipActive,
              ]}
            >
              <Text style={styles.sidePlayerName} numberOfLines={1}>
                {currentTurnSlot === 4 ? '🎯 ' : ''}P4: {rightPlayer?.name || t('Player 4')}
              </Text>
              <Text style={styles.sidePlayerScore}>{scores[4] || 0} pts</Text>
            </View>
          )}
        </View>
      )}

      {/* MATCH STAKES STRIP */}
      <View style={styles.stakesStrip}>
        <View style={styles.stakesStripItem}>
          <Image source={GREEN_COIN_IMG} style={styles.stakesStripCoin} resizeMode="contain" />
          <View>
            <Text style={styles.stakesStripLabel}><T>Bet</T></Text>
            <Text style={styles.stakesStripVal}>{currentBet} <T>Game Coins</T></Text>
          </View>
        </View>
        <View style={styles.stakesStripDivider} />
        <View style={styles.stakesStripItem}>
          <Text style={styles.stakesTrophyEmoji}>🏆</Text>
          <View>
            <Text style={styles.stakesStripLabel}><T>Total Pot</T></Text>
            <Text style={styles.stakesStripPotVal}>{totalPot} <T>Game Coins</T></Text>
          </View>
        </View>
        <View style={styles.stakesStripDivider} />
        <View style={styles.stakesTurnIndicatorWrap}>
          <Text style={styles.stakesTurnIndicatorText}>
            🎯 {activeTurnName}
          </Text>
        </View>
      </View>

      {/* EVENT BANNER NOTICE */}
      {!!eventNotice && (
        <View style={styles.eventNoticeBanner}>
          <Text style={styles.eventNoticeText}>{eventNotice}</Text>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. AUTHENTIC CARROM BOARD (MATCHING USER SCREENSHOT EXACTLY)   */}
      {/* ============================================================== */}
      <View style={[styles.outerGoldFrame, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
        <LinearGradient
          colors={['#FFE082', '#FFC107', '#FFA000', '#B78103', '#FFC107', '#FFE082']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goldBevelGradient}
        >
          {/* Inner Rosewood / Walnut Cushion Frame */}
          <LinearGradient
            colors={['#42210B', '#2E1505', '#1D0C02', '#2E1505']}
            style={styles.woodCushionFrame}
          >
            {/* Natural Light Birch Playing Surface (Clear, Authentic Color) */}
            <View
              style={styles.birchPlayfield}
              onStartShouldSetResponder={() => isMyTurn && !isStriking && !matchOver}
              onMoveShouldSetResponder={() => isMyTurn && !isStriking && !matchOver}
              onResponderGrant={(evt) =>
                handleBoardTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
              }
              onResponderMove={(evt) =>
                handleBoardTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
              }
              onResponderRelease={(evt) =>
                handleBoardTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY, true)
              }
            >
              <LinearGradient
                colors={['#F5DEB3', '#ECD0A4', '#E2C394', '#ECD0A4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* SVG Markings: 4 Baselines, Center Circles, Patterns */}
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${PLAY_SIZE} ${PLAY_SIZE}`}
                style={StyleSheet.absoluteFillObject}
              >
                <Defs>
                  <RadialGradient id="pocketHoleGrad" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#020408" stopOpacity="1" />
                    <Stop offset="75%" stopColor="#0B1120" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#1E293B" stopOpacity="0.8" />
                  </RadialGradient>
                </Defs>

                {/* Center Circle & Mandala */}
                <Circle
                  cx={PLAY_SIZE / 2}
                  cy={PLAY_SIZE / 2}
                  r="38"
                  stroke="#78350F"
                  strokeWidth="1.4"
                  fill="none"
                />
                <Circle
                  cx={PLAY_SIZE / 2}
                  cy={PLAY_SIZE / 2}
                  r="37"
                  stroke="#92400E"
                  strokeWidth="0.8"
                  strokeDasharray="2,3"
                  fill="none"
                />
                <Circle
                  cx={PLAY_SIZE / 2}
                  cy={PLAY_SIZE / 2}
                  r="13"
                  stroke="#DC2626"
                  strokeWidth="1.5"
                  fill="rgba(220, 38, 38, 0.08)"
                />
                <Circle cx={PLAY_SIZE / 2} cy={PLAY_SIZE / 2} r="3" fill="#DC2626" />

                {/* Decorative Rays */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, idx) => {
                  const rad = (ang * Math.PI) / 180;
                  const x1 = PLAY_SIZE / 2 + Math.cos(rad) * 15;
                  const y1 = PLAY_SIZE / 2 + Math.sin(rad) * 15;
                  const x2 = PLAY_SIZE / 2 + Math.cos(rad) * 36;
                  const y2 = PLAY_SIZE / 2 + Math.sin(rad) * 36;
                  return (
                    <Line
                      key={`ray_${idx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#92400E"
                      strokeWidth="0.8"
                    />
                  );
                })}

                {/* ======================================================= */}
                {/* 4 BASELINES WITH RED END CIRCLES (TOP, BOTTOM, LEFT, RIGHT) */}
                {/* ======================================================= */}
                {/* 1. BOTTOM BASELINE */}
                <G id="baselineBottom">
                  <Line
                    x1={BASELINE_MIN_X - FRAME_WIDTH}
                    y1={BASELINE_BOTTOM_Y - FRAME_WIDTH - 2}
                    x2={BASELINE_MAX_X - FRAME_WIDTH}
                    y2={BASELINE_BOTTOM_Y - FRAME_WIDTH - 2}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Line
                    x1={BASELINE_MIN_X - FRAME_WIDTH}
                    y1={BASELINE_BOTTOM_Y - FRAME_WIDTH + 2}
                    x2={BASELINE_MAX_X - FRAME_WIDTH}
                    y2={BASELINE_BOTTOM_Y - FRAME_WIDTH + 2}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Circle
                    cx={BASELINE_MIN_X - FRAME_WIDTH}
                    cy={BASELINE_BOTTOM_Y - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                  <Circle
                    cx={BASELINE_MAX_X - FRAME_WIDTH}
                    cy={BASELINE_BOTTOM_Y - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                </G>

                {/* 2. TOP BASELINE */}
                <G id="baselineTop">
                  <Line
                    x1={BASELINE_MIN_X - FRAME_WIDTH}
                    y1={BASELINE_TOP_Y - FRAME_WIDTH - 2}
                    x2={BASELINE_MAX_X - FRAME_WIDTH}
                    y2={BASELINE_TOP_Y - FRAME_WIDTH - 2}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Line
                    x1={BASELINE_MIN_X - FRAME_WIDTH}
                    y1={BASELINE_TOP_Y - FRAME_WIDTH + 2}
                    x2={BASELINE_MAX_X - FRAME_WIDTH}
                    y2={BASELINE_TOP_Y - FRAME_WIDTH + 2}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Circle
                    cx={BASELINE_MIN_X - FRAME_WIDTH}
                    cy={BASELINE_TOP_Y - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                  <Circle
                    cx={BASELINE_MAX_X - FRAME_WIDTH}
                    cy={BASELINE_TOP_Y - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                </G>

                {/* 3. LEFT BASELINE */}
                <G id="baselineLeft">
                  <Line
                    x1={BASELINE_LEFT_X - FRAME_WIDTH - 2}
                    y1={BASELINE_MIN_X - FRAME_WIDTH}
                    x2={BASELINE_LEFT_X - FRAME_WIDTH - 2}
                    y2={BASELINE_MAX_X - FRAME_WIDTH}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Line
                    x1={BASELINE_LEFT_X - FRAME_WIDTH + 2}
                    y1={BASELINE_MIN_X - FRAME_WIDTH}
                    x2={BASELINE_LEFT_X - FRAME_WIDTH + 2}
                    y2={BASELINE_MAX_X - FRAME_WIDTH}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Circle
                    cx={BASELINE_LEFT_X - FRAME_WIDTH}
                    cy={BASELINE_MIN_X - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                  <Circle
                    cx={BASELINE_LEFT_X - FRAME_WIDTH}
                    cy={BASELINE_MAX_X - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                </G>

                {/* 4. RIGHT BASELINE */}
                <G id="baselineRight">
                  <Line
                    x1={BASELINE_RIGHT_X - FRAME_WIDTH - 2}
                    y1={BASELINE_MIN_X - FRAME_WIDTH}
                    x2={BASELINE_RIGHT_X - FRAME_WIDTH - 2}
                    y2={BASELINE_MAX_X - FRAME_WIDTH}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Line
                    x1={BASELINE_RIGHT_X - FRAME_WIDTH + 2}
                    y1={BASELINE_MIN_X - FRAME_WIDTH}
                    x2={BASELINE_RIGHT_X - FRAME_WIDTH + 2}
                    y2={BASELINE_MAX_X - FRAME_WIDTH}
                    stroke="#78350F"
                    strokeWidth="1.2"
                  />
                  <Circle
                    cx={BASELINE_RIGHT_X - FRAME_WIDTH}
                    cy={BASELINE_MIN_X - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                  <Circle
                    cx={BASELINE_RIGHT_X - FRAME_WIDTH}
                    cy={BASELINE_MAX_X - FRAME_WIDTH}
                    r="7.5"
                    stroke="#78350F"
                    strokeWidth="1.2"
                    fill="#C2410C"
                  />
                </G>

                {/* 4 Corner Pockets */}
                {POCKETS.map((pocket) => (
                  <G key={`svg_pock_${pocket.id}`}>
                    <Circle
                      cx={pocket.x - FRAME_WIDTH}
                      cy={pocket.y - FRAME_WIDTH}
                      r={POCKET_RADIUS}
                      fill="url(#pocketHoleGrad)"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    <Circle
                      cx={pocket.x - FRAME_WIDTH}
                      cy={pocket.y - FRAME_WIDTH}
                      r={POCKET_RADIUS - 4}
                      fill="#020408"
                    />
                  </G>
                ))}

                {/* 🎯 PREDICTIVE TRAJECTORY GUIDELINE (Active for Shooter or Opponent Aiming!) */}
                {trajectoryData && (
                  <G id="trajectoryGuide">
                    <Line
                      x1={activeStrikerX - FRAME_WIDTH}
                      y1={activeStrikerY - FRAME_WIDTH}
                      x2={trajectoryData.endX - FRAME_WIDTH}
                      y2={trajectoryData.endY - FRAME_WIDTH}
                      stroke="#00E5FF"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />

                    {trajectoryData.closestPuck && (
                      <Circle
                        cx={trajectoryData.closestPuck.hitStrikerX - FRAME_WIDTH}
                        cy={trajectoryData.closestPuck.hitStrikerY - FRAME_WIDTH}
                        r={STRIKER_RADIUS}
                        stroke="#00E5FF"
                        strokeWidth="1.8"
                        strokeDasharray="3,3"
                        fill="rgba(0, 229, 255, 0.14)"
                      />
                    )}

                    {trajectoryData.closestPuck && (
                      <Line
                        x1={trajectoryData.closestPuck.puck.x - FRAME_WIDTH}
                        y1={trajectoryData.closestPuck.puck.y - FRAME_WIDTH}
                        x2={
                          trajectoryData.closestPuck.puck.x -
                          FRAME_WIDTH +
                          trajectoryData.closestPuck.normX * 44
                        }
                        y2={
                          trajectoryData.closestPuck.puck.y -
                          FRAME_WIDTH +
                          trajectoryData.closestPuck.normY * 44
                        }
                        stroke="#10B981"
                        strokeWidth="2.8"
                      />
                    )}

                    {trajectoryData.targetPocket && (
                      <Circle
                        cx={trajectoryData.targetPocket.x - FRAME_WIDTH}
                        cy={trajectoryData.targetPocket.y - FRAME_WIDTH}
                        r={POCKET_RADIUS + 5}
                        stroke="#10B981"
                        strokeWidth="3"
                        fill="rgba(16, 185, 129, 0.2)"
                      />
                    )}
                  </G>
                )}
              </Svg>

              {/* 3D GROOVED PUCKS */}
              {pucks.map((puck) => {
                if (puck.pocketed) return null;
                return (
                  <View
                    key={puck.id}
                    style={[
                      styles.puckPiece,
                      puck.type === 'queen' && styles.puckQueen,
                      puck.type === 'white' && styles.puckWhite,
                      puck.type === 'black' && styles.puckBlack,
                      {
                        left: puck.x - PUCK_RADIUS - FRAME_WIDTH,
                        top: puck.y - PUCK_RADIUS - FRAME_WIDTH,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.puckInnerGroove,
                        puck.type === 'queen' && styles.puckQueenGroove,
                        puck.type === 'white' && styles.puckWhiteGroove,
                        puck.type === 'black' && styles.puckBlackGroove,
                      ]}
                    >
                      <View
                        style={[
                          styles.puckCenterPip,
                          puck.type === 'queen' && styles.puckQueenPip,
                          puck.type === 'white' && styles.puckWhitePip,
                          puck.type === 'black' && styles.puckBlackPip,
                        ]}
                      >
                        {puck.type === 'queen' && (
                          <Text style={{ fontSize: 7, color: '#FEF08A' }}>👑</Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* STRIKER PIECE */}
              {strikerVisible && (() => {
                // Hard-clamp visual position so striker NEVER renders outside the playfield
                const clampedLeft = Math.max(
                  0,
                  Math.min(
                    PLAY_SIZE - STRIKER_RADIUS * 2,
                    activeStrikerX - STRIKER_RADIUS - FRAME_WIDTH
                  )
                );
                const clampedTop = Math.max(
                  0,
                  Math.min(
                    PLAY_SIZE - STRIKER_RADIUS * 2,
                    activeStrikerY - STRIKER_RADIUS - FRAME_WIDTH
                  )
                );
                return (
                  <View
                    style={[
                      styles.strikerPiece,
                      { left: clampedLeft, top: clampedTop },
                    ]}
                  >
                    <View style={styles.strikerInnerRing}>
                      <View style={styles.strikerCore}>
                        <Text style={{ fontSize: 9, color: '#00E5FF' }}>✦</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}

              {/* Target Pocket "TARGET LOCKED" Badge */}
              {trajectoryData?.targetPocket && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.pocketReadyBadge,
                    {
                      left: trajectoryData.targetPocket.x - FRAME_WIDTH - 28,
                      top: trajectoryData.targetPocket.y - FRAME_WIDTH - 22,
                    },
                  ]}
                >
                  <Text style={styles.pocketReadyBadgeText}>🎯 <T>TARGET LOCKED</T></Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* ============================================================== */}
      {/* 3. DYNAMIC CONTROL BAR: BASELINE SLIDER, POWER & STRIKE        */}
      {/* ============================================================== */}
      {isMyTurn && !isStriking && !matchOver ? (
        <View style={styles.controlBarCard}>
          {/* Row 1: Striker Baseline Slider & Nudge Micro-Aim Buttons */}
          <View style={styles.sliderAndNudgeRow}>
            <View style={styles.sliderAreaWrapper}>
              <Text style={styles.controlLabel}><T>Baseline</T>:</Text>
              <View
                style={styles.sliderTrackArea}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(evt) => handleBaselineSlider(evt.nativeEvent.locationX)}
                onResponderMove={(evt) => handleBaselineSlider(evt.nativeEvent.locationX)}
                onResponderRelease={(evt) => handleBaselineSlider(evt.nativeEvent.locationX, 200, true)}
              >
                <View style={styles.sliderTrackGroove} />
                <View
                  style={[
                    styles.sliderThumbPill,
                    {
                      left: `${Math.max(
                        0,
                        Math.min(
                          82,
                          ((strikerX - BASELINE_MIN_X) /
                            (BASELINE_MAX_X - BASELINE_MIN_X)) *
                            82
                        )
                      )}%`,
                    },
                  ]}
                >
                  <Text style={styles.sliderThumbText}>◀ ⚪ ▶</Text>
                </View>
              </View>
            </View>

            {/* Micro-Aim Nudge */}
            <View style={styles.nudgeBtnGroup}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.nudgeBtn}
                onPress={() => nudgeAim(-1.5)}
              >
                <Text style={styles.nudgeBtnText}>◀ -1.5°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.nudgeBtn}
                onPress={() => nudgeAim(1.5)}
              >
                <Text style={styles.nudgeBtnText}>+1.5° ▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Power Selector */}
          <View style={styles.powerAndStrikeRow}>
            <View style={styles.powerPresetsWrap}>
              <Text style={styles.controlLabel}><T>Power</T>:</Text>
              {[
                { label: '60%', val: 60 },
                { label: '80%', val: 80 },
                { label: '100%', val: 100 },
              ].map((p) => (
                <TouchableOpacity
                  key={`pow_${p.val}`}
                  activeOpacity={0.8}
                  style={[styles.powerPresetPill, aimPower === p.val && styles.powerPresetPillActive]}
                  onPress={() => {
                    setAimPower(p.val);
                    broadcastAimLive(strikerX, aimAngle, p.val);
                  }}
                >
                  <Text
                    style={[
                      styles.powerPresetText,
                      aimPower === p.val && styles.powerPresetTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.tapCoinHintText}>💡 <T>Tap coin to aim</T></Text>
            </View>
          </View>

          {/* Row 3: Full-width STRIKE Button — always fits, never clips */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bigStrikeButton, { width: '100%' }]}
            onPress={handlePlayerStrike}
          >
            <LinearGradient
              colors={['#FF6D00', '#FF3D00', '#D50000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.bigStrikeGradient, { paddingVertical: 10 }]}
            >
              <Text style={styles.bigStrikeText}>💥 <T>STRIKE!</T></Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 4. PLAYER 1 (YOU) HUD - ALWAYS YOU ON BOTTOM */}
      <View style={[styles.playerHud, isMyTurn && styles.playerHudActive]}>
        <View style={styles.playerInfoRow}>
          {myPlayer?.avatar ? (
            <Image source={{ uri: myPlayer.avatar }} style={styles.playerAvatarImg} />
          ) : (
            <View style={[styles.playerBadge, { backgroundColor: '#FFFFFF' }]}>
              <Text style={{ fontSize: 13 }}>⚪</Text>
            </View>
          )}
          <View>
            <Text style={styles.playerName}>
              {myPlayer?.name || t('You')} ({actualPlayersCount === 4 ? t('Team A') : t('You')})
            </Text>
            <Text style={styles.tokensHomeText}>
              <T>Score</T>: {actualPlayersCount === 4 ? scores.teamA : scores[myPlayer.slot] || 0} <T>Pts</T>
            </Text>
          </View>
        </View>

        {isMyTurn && !isStriking && !matchOver ? (
          <View style={[styles.timerBadge, turnTimer <= 5 && styles.timerBadgeUrgent]}>
            <Text style={[styles.timerBadgeText, turnTimer <= 5 && styles.timerBadgeTextUrgent]}>
              ⏳ {turnTimer}s
            </Text>
          </View>
        ) : (
          <View style={styles.waitingTurnBadge}>
            <Text style={styles.waitingTurnBadgeText}><T>Opponent Turn</T></Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    width: '100%',
  },
  playerHud: {
    width: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginVertical: 3,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  playerHudActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E293B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  playerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  playerName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  tokensHomeText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  turnBubble: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  turnBubbleText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  timerBadge: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timerBadgeUrgent: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerBadgeTextUrgent: {
    color: '#EF4444',
  },
  waitingTurnBadge: {
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waitingTurnBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  teamScoreStrip: {
    width: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginVertical: 3,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  teamScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  teamScoreVal: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
  },
  multiPlayerSideChips: {
    flexDirection: 'row',
    width: '94%',
    justifyContent: 'space-between',
    marginVertical: 2,
    gap: 6,
  },
  sidePlayerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sidePlayerChipActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  sidePlayerName: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  sidePlayerScore: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  stakesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 2,
    width: '94%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stakesStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stakesStripCoin: {
    width: 16,
    height: 16,
  },
  stakesTrophyEmoji: {
    fontSize: 14,
  },
  stakesStripLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stakesStripVal: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
  },
  stakesStripPotVal: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stakesStripDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
  },
  stakesTurnIndicatorWrap: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  stakesTurnIndicatorText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
  },
  eventNoticeBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    marginVertical: 2,
    elevation: 4,
  },
  eventNoticeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  outerGoldFrame: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    marginVertical: 4,
  },
  goldBevelGradient: {
    flex: 1,
    padding: FRAME_GOLD_BORDER,
    borderRadius: 24,
  },
  woodCushionFrame: {
    flex: 1,
    padding: FRAME_WOOD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
  },
  birchPlayfield: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F3DFC1',
  },
  puckPiece: {
    position: 'absolute',
    width: PUCK_RADIUS * 2,
    height: PUCK_RADIUS * 2,
    borderRadius: PUCK_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.45,
    shadowRadius: 2,
  },
  puckInnerGroove: {
    width: PUCK_RADIUS * 1.5,
    height: PUCK_RADIUS * 1.5,
    borderRadius: PUCK_RADIUS * 0.75,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckCenterPip: {
    width: PUCK_RADIUS * 0.8,
    height: PUCK_RADIUS * 0.8,
    borderRadius: PUCK_RADIUS * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  puckWhiteGroove: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  puckWhitePip: {
    backgroundColor: '#E5E7EB',
  },
  puckBlack: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  puckBlackGroove: {
    borderColor: '#475569',
    backgroundColor: '#0F172A',
  },
  puckBlackPip: {
    backgroundColor: '#334155',
  },
  puckQueen: {
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  puckQueenGroove: {
    borderColor: '#991B1B',
    backgroundColor: '#B91C1C',
  },
  puckQueenPip: {
    backgroundColor: '#DC2626',
  },
  strikerPiece: {
    position: 'absolute',
    width: STRIKER_RADIUS * 2,
    height: STRIKER_RADIUS * 2,
    borderRadius: STRIKER_RADIUS,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  strikerInnerRing: {
    width: STRIKER_RADIUS * 1.5,
    height: STRIKER_RADIUS * 1.5,
    borderRadius: STRIKER_RADIUS * 0.75,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strikerCore: {
    width: STRIKER_RADIUS * 0.8,
    height: STRIKER_RADIUS * 0.8,
    borderRadius: STRIKER_RADIUS * 0.4,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pocketReadyBadge: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  pocketReadyBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  controlBarCard: {
    width: '94%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  sliderAndNudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sliderAreaWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  sliderTrackArea: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackGroove: {
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 2.5,
    borderWidth: 0.5,
    borderColor: '#475569',
  },
  sliderThumbPill: {
    position: 'absolute',
    backgroundColor: '#1E293B',
    borderWidth: 1.2,
    borderColor: '#00E5FF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    elevation: 3,
  },
  sliderThumbText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  nudgeBtnGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  nudgeBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  nudgeBtnText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  powerAndStrikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  powerPresetsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  powerPresetPill: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  powerPresetPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  powerPresetText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  powerPresetTextActive: {
    color: '#000000',
  },
  tapCoinHintText: {
    color: '#64748B',
    fontSize: 9,
    fontStyle: 'italic',
  },
  bigStrikeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bigStrikeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStrikeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

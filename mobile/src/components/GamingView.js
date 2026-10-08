import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  ActivityIndicator,
  Platform,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import LudoGame from './LudoGame';
import SnakeLadderGame from './SnakeLadderGame';
import TicTacToeGame from './TicTacToeGame';
import CarromGame from './CarromGame';
import DiceBattleGame from './DiceBattleGame';
import CardClashGame from './CardClashGame';
import TimeBombGame from './TimeBombGame';

// 7-Day Silver Chest Streak Rewards
const CHEST_REWARDS = [100, 300, 600, 1000, 1500, 2200, 3500];

// Local bundled Flaticon PNG assets (100% reliable, zero network delay or CDN blocks)
const GOLD_COIN_IMG = require('../../assets/icons/gold_coin.png');
const GREEN_COIN_IMG = require('../../assets/icons/green_coin.png');
const SILVER_CHEST_IMG = require('../../assets/icons/silver_chest.png');
const SILVER_CHEST_OPEN_IMG = require('../../assets/icons/silver_chest_open.png');
const SHOP_IMG = require('../../assets/icons/shop.png');
const CALENDAR_IMG = require('../../assets/icons/calendar.png');
const DICE_IMG = require('../../assets/icons/dice.png');

export default function GamingView({
  currentUser,
  insets,
  onNavigateTab,
  navigation,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Top Sub-Tabs inside Gaming: Ludo, Dominos, UNO, Games
  const [activeGameTab, setActiveGameTab] = useState('Ludo');

  // Currencies: Golden Wallet Coins & Green Game Coins
  const [walletCoins, setWalletCoins] = useState(currentUser?.coins || 0);
  const [gameCoins, setGameCoins] = useState(currentUser?.gameCoins || 0);

  // Daily Silver Chest Claim State
  const [chestModalVisible, setChestModalVisible] = useState(false);
  const [openChestModalVisible, setOpenChestModalVisible] = useState(false);
  const [rewardClaimInfo, setRewardClaimInfo] = useState({ coins: 100, streak: 1 });
  const [canClaimChest, setCanClaimChest] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [nextReward, setNextReward] = useState(100);
  const [claimingChest, setClaimingChest] = useState(false);
  const openChestScale = useRef(new Animated.Value(0.3)).current;

  // Game Setup Modal (Online vs Local & Players Selection)
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null); // { id: 'ludo', name: 'Ludo', mode: '1on1', bet: 100, players: 2 }
  const [playMode, setPlayMode] = useState('online'); // 'online' or 'local'
  const [selectedPlayers, setSelectedPlayers] = useState(2); // 2 or 4
  const [ludoBetAmount, setLudoBetAmount] = useState(100);
  const [betSelectModalVisible, setBetSelectModalVisible] = useState(false);
  const [matchBet, setMatchBet] = useState(100);
  const matchBetRef = useRef(100);
  useEffect(() => {
    matchBetRef.current = matchBet;
  }, [matchBet]);

  const [matchTotalPot, setMatchTotalPot] = useState(200);
  const matchTotalPotRef = useRef(200);
  useEffect(() => {
    matchTotalPotRef.current = matchTotalPot;
  }, [matchTotalPot]);

  // Real-Time Socket & Game Lobby State (Real Registered Users Only)
  const socketRef = useRef(null);
  const [localLobbyVisible, setLocalLobbyVisible] = useState(false);
  const [lobbyRoomCode, setLobbyRoomCode] = useState('7392');
  const lobbyRoomCodeRef = useRef(lobbyRoomCode);
  useEffect(() => {
    lobbyRoomCodeRef.current = lobbyRoomCode;
  }, [lobbyRoomCode]);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [forfeitedUserIds, setForfeitedUserIds] = useState([]);
  const [joinGameCodeModalVisible, setJoinGameCodeModalVisible] = useState(false);
  const [enteredGameCode, setEnteredGameCode] = useState('');
  const [verifyingGameCode, setVerifyingGameCode] = useState(false);
  const [lobbyActivityNotice, setLobbyActivityNotice] = useState(null);
  const [codePreviewLobby, setCodePreviewLobby] = useState(null);
  const [activeWaitingLobbies, setActiveWaitingLobbies] = useState([]);

  // Interactive In-App Game Modal (Playable arena)
  const [activeGameArena, setActiveGameArena] = useState(null); // 'ludo', 'dominos', 'uno'
  const [gameResult, setGameResult] = useState(null);
  const [quitConfirmModalVisible, setQuitConfirmModalVisible] = useState(false);
  const [dominoOpponentCount, setDominoOpponentCount] = useState(4);
  // Tracks TimeBombGame internal phase so we know if game actually started
  const [arenaGamePhase, setArenaGamePhase] = useState('waiting');

  // Interactive Ludo State
  const [ludoTurn, setLudoTurn] = useState('player'); // 'player' or 'opponent'
  const [ludoDice, setLudoDice] = useState(6);
  const [ludoRolling, setLudoRolling] = useState(false);
  const [ludoPlayerPos, setLudoPlayerPos] = useState(0); // 0 to 56
  const [ludoOpponentPos, setLudoOpponentPos] = useState(0);

  // Interactive UNO State
  const [unoPlayerCards, setUnoPlayerCards] = useState([
    { id: 1, color: '#EF4444', value: '4' },
    { id: 2, color: '#10B981', value: '7' },
    { id: 3, color: '#3B82F6', value: '9' },
    { id: 4, color: '#F59E0B', value: '1' },
    { id: 5, color: '#EF4444', value: '+2' },
  ]);
  const [unoDiscardTop, setUnoDiscardTop] = useState({ color: '#EF4444', value: '7' });
  const [unoOpponentCount, setUnoOpponentCount] = useState(5);
  const [unoTurn, setUnoTurn] = useState('player');

  // Interactive Dominos State
  const [dominoPlayerHand, setDominoPlayerHand] = useState([
    { id: 1, left: 6, right: 2 },
    { id: 2, left: 2, right: 5 },
    { id: 3, left: 5, right: 5 },
    { id: 4, left: 3, right: 4 },
  ]);
  const [dominoBoardLine, setDominoBoardLine] = useState([
    { id: 0, left: 6, right: 6 },
  ]);
  const [dominoScore, setDominoScore] = useState({ player: 0, opponent: 0 });

  // Chest Button Pulsing Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Spring animation when Silver Chest opens
  useEffect(() => {
    if (openChestModalVisible) {
      openChestScale.setValue(0.3);
      Animated.spring(openChestScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }
  }, [openChestModalVisible]);

  // Fetch silver chest status and real user coin balances
  const fetchChestStatus = async () => {
    try {
      const res = await api.get('/users/game-chest/status');
      if (res.data?.success) {
        setCanClaimChest(res.data.canClaim);
        setCurrentStreak(res.data.streak || 0);
        setNextReward(res.data.nextReward || 100);
        setGameCoins(res.data.gameCoins || 0);
        setWalletCoins(res.data.walletCoins || 0);
      }
    } catch (err) {
      // Fallback to local user defaults
      setGameCoins(currentUser?.gameCoins || 0);
      setWalletCoins(currentUser?.coins || 0);
    }
  };

  useEffect(() => {
    fetchChestStatus();
  }, []);

  // Initialize Real-Time Game Lobby Socket Connection
  useEffect(() => {
    const socket = io(BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // Listen for lobby updates (when real registered player joins)
    socket.on('game_lobby_updated', (lobby) => {
      setLobbyRoomCode(lobby.roomCode);
      const maxP = lobby.maxPlayers || selectedPlayers || 2;
      const fullSlots = [];
      const colors = [
        { color: '#DC2626', colorKey: 'red' },
        { color: '#10B981', colorKey: 'green' },
        { color: '#F59E0B', colorKey: 'yellow' },
        { color: '#2563EB', colorKey: 'blue' },
      ];
      for (let s = 1; s <= maxP; s++) {
        const existing = lobby.players?.find((p) => p.slot === s);
        if (existing) {
          fullSlots.push(existing);
        } else {
          const c = colors[s - 1] || colors[1];
          fullSlots.push({
            slot: s,
            userId: null,
            name: `Player ${s}`,
            avatar: null,
            color: c.color,
            colorKey: c.colorKey,
            isHost: false,
            status: 'waiting',
          });
        }
      }
      setLobbyPlayers(fullSlots);
      setLocalLobbyVisible(true);
    });

    // Listen for another player entering the lobby with code
    socket.on('player_entered_lobby', (data) => {
      if (data?.roomCode && String(data.roomCode) !== String(lobbyRoomCodeRef.current)) {
        return;
      }
      setLobbyActivityNotice(data);
      if (data?.name) {
        showToast(`${data.name} ${t('entered the lobby waiting room!')}`, 'info');
      }
    });

    // Listen for player leaving the waiting lobby
    socket.on('player_left_lobby', (data) => {
      setLobbyActivityNotice(null);
    });

    // Listen for direct coin balance update from socket
    socket.on('user_coins_updated', (data) => {
      if (typeof data?.gameCoins === 'number') {
        setGameCoins(data.gameCoins);
      }
    });

    // Listen for active game waiting lobbies list
    socket.on('active_game_lobbies_list', (list) => {
      setActiveWaitingLobbies(Array.isArray(list) ? list : []);
    });
    socket.on('active_game_lobbies_changed', (list) => {
      setActiveWaitingLobbies(Array.isArray(list) ? list : []);
    });

    // Listen for match start (both real devices launch arena together)
    socket.on('game_match_started', async (data) => {
      setPlayMode('local');
      setLobbyActivityNotice(null);
      if (data?.players) {
        setLobbyPlayers(data.players);
      }
      if (data?.roomCode) {
        setLobbyRoomCode(data.roomCode);
      }
      const betAmt = Number(data?.bet) || Number(selectedGame?.bet) || matchBetRef.current || 100;
      const totalPotAmt =
        Number(data?.totalPot) ||
        betAmt * (data?.playersCount || data?.players?.length || selectedPlayers || 2);
      matchBetRef.current = betAmt;
      matchTotalPotRef.current = totalPotAmt;
      setMatchBet(betAmt);
      setMatchTotalPot(totalPotAmt);
      // Deduct bet coins atomically at the exact moment the match starts
      setGameCoins((prev) => Math.max(0, prev - betAmt));
      fetchChestStatus();
      setForfeitedUserIds([]);
      setLocalLobbyVisible(false);
      setGameResult(null);
      const isSnake = data?.gameName === 'Snake & Ladder' || selectedGame?.id === 'snake_ladder';
      const isTicTacToe = data?.gameName === 'Tic Tac Toe' || selectedGame?.id === 'tictactoe';
      const isCarrom = data?.gameName === 'Carrom Board' || selectedGame?.id === 'carrom';
      const isDice = data?.gameName === 'Dice Battle' || selectedGame?.id === 'dice_battle';
      const isCardClash = data?.gameName === 'High Card Clash' || selectedGame?.id === 'card_clash';
      const isTimeBomb = data?.gameName === 'Time Bomb' || selectedGame?.id === 'time_bomb';
      if (data?.gameMode) {
        setSelectedGame((prev) => (prev ? { ...prev, mode: data.gameMode } : prev));
      }
      if (isCarrom) {
        setActiveGameArena('carrom');
      } else if (isCardClash) {
        setActiveGameArena('card_clash');
      } else if (isDice) {
        setActiveGameArena('dice_battle');
      } else if (isTimeBomb) {
        setActiveGameArena('time_bomb');
      } else if (isTicTacToe) {
        setActiveGameArena('tictactoe');
      } else if (isSnake) {
        setActiveGameArena('snake_ladder');
      } else {
        setActiveGameArena('ludo');
      }
    });

    // Listen for match ended because opponent quit (Last remaining player wins entire pot!)
    socket.on('game_match_ended_by_forfeit', (data) => {
      fetchChestStatus();
      const isWinner = String(data?.winner?.userId) === String(currentUser?._id);
      if (isWinner) {
        const pot = Number(data?.totalPot) || matchTotalPotRef.current || 200;
        const bet = Number(data?.bet) || matchBetRef.current || 100;
        const profit = Math.max(0, pot - bet);
        setGameCoins((prev) => prev + pot);
        showToast(
          `${t('Opponent left the match! You won')} +${profit} ${t('Game Coins!')} 🏆🎉 (${t('Total Pot')}: ${pot})`,
          'success'
        );
        setGameResult('won');
        // Auto-close arena after celebratory result so user exits game
        setTimeout(() => {
          setActiveGameArena(null);
          setGameResult(null);
        }, 3500);
      } else {
        setActiveGameArena(null);
        setGameResult(null);
      }
    });

    // Listen for player forfeited in >2 players match
    socket.on('player_forfeited_mid_game', (data) => {
      if (data?.quitter?.userId) {
        setForfeitedUserIds((prev) => [...prev, String(data.quitter.userId)]);
      }
      if (data?.quitter?.name) {
        showToast(
          `${data.quitter.name} ${t('left the match. Game continues for the remaining pot!')}`,
          'info'
        );
      }
    });

    // Listen for normal match finish
    socket.on('game_match_finished', (data) => {
      const isWinner = String(data?.winner?.userId) === String(currentUser?._id);
      if (isWinner) {
        const pot = Number(data?.totalPot) || matchTotalPotRef.current || 200;
        const bet = Number(data?.bet) || matchBetRef.current || 100;
        const profit = Math.max(0, pot - bet);
        setGameCoins((prev) => prev + pot);
        fetchChestStatus();
        showToast(
          `${t('Victory!')} ${t('You won')} +${profit} ${t('Game Coins!')} 🏆🎉 (${t('Total Pot')}: ${pot})`,
          'success'
        );
        setGameResult('won');
      } else {
        setGameResult('lost');
      }
      // Auto-close arena after result so user exits game
      setTimeout(() => {
        setActiveGameArena(null);
        setGameResult(null);
      }, 3500);
    });

    // Listen for lobby errors
    socket.on('game_lobby_error', ({ message }) => {
      showToast(t(message), 'error');
    });

    // Listen for disbanded lobby
    socket.on('game_lobby_disbanded', ({ message }) => {
      showToast(t(message || 'Host left the game room.'), 'info');
      setLobbyActivityNotice(null);
      setLocalLobbyVisible(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle Silver Chest Claim
  const handleClaimChest = async () => {
    if (claimingChest) return;
    setClaimingChest(true);
    try {
      const res = await api.post('/users/game-chest/claim');
      if (res.data?.success) {
        const rewardCoins = res.data.rewardCoins || nextReward || 100;
        const streak = res.data.streak || (currentStreak + 1);
        setGameCoins(res.data.gameCoins);
        setCurrentStreak(res.data.streak);
        setCanClaimChest(false);
        setRewardClaimInfo({
          coins: rewardCoins,
          streak: streak,
        });
        setChestModalVisible(false);
        setOpenChestModalVisible(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Chest already claimed for today!';
      showToast(t(msg), 'info');
    } finally {
      setClaimingChest(false);
    }
  };

  // Open Game Setup Modal for a selected game & mode
  const openGameSetup = (gameId, gameName, modeType, defaultBet, playersCount) => {
    setSelectedGame({
      id: gameId,
      name: gameName,
      mode: modeType,
      bet: defaultBet,
      players: playersCount,
    });
    setSelectedPlayers(playersCount);
    setSetupModalVisible(true);
  };

  // Close and leave lobby
  const handleCloseLobby = () => {
    if (socketRef.current && lobbyRoomCode) {
      socketRef.current.emit('leave_game_lobby', {
        roomCode: lobbyRoomCode,
        userId: currentUser?._id,
      });
    }
    setLocalLobbyVisible(false);
  };

  // Open Local Game Lobby (Waiting Room with Game Code)
  const openLocalLobby = () => {
    const requiredBet = selectedGame?.bet || ludoBetAmount || 100;
    matchBetRef.current = requiredBet;
    matchTotalPotRef.current = requiredBet * (selectedPlayers || 2);
    setMatchBet(requiredBet);
    setMatchTotalPot(requiredBet * (selectedPlayers || 2));
    if (gameCoins < requiredBet) {
      showToast(
        t('Insufficient Game Coins! Please claim free coins from the Silver Chest.'),
        'error'
      );
      setSetupModalVisible(false);
      setChestModalVisible(true);
      return;
    }

    setPlayMode('local');
    setSetupModalVisible(false);

    // Local Play / Match Lobby with 4-digit Game Code registered on server
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setLobbyRoomCode(code);

    const slots = [
      {
        slot: 1,
        userId: currentUser?._id?.toString(),
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar,
        color: '#DC2626',
        colorKey: 'red',
        isHost: true,
        status: 'ready',
      },
      {
        slot: 2,
        userId: null,
        name: 'Player 2',
        avatar: null,
        color: '#10B981',
        colorKey: 'green',
        isHost: false,
        status: 'waiting',
      },
    ];

    if (selectedPlayers === 4) {
      slots.push(
        {
          slot: 3,
          userId: null,
          name: 'Player 3',
          avatar: null,
          color: '#F59E0B',
          colorKey: 'yellow',
          isHost: false,
          status: 'waiting',
        },
        {
          slot: 4,
          userId: null,
          name: 'Player 4',
          avatar: null,
          color: '#2563EB',
          colorKey: 'blue',
          isHost: false,
          status: 'waiting',
        }
      );
    }

    setLobbyPlayers(slots);
    setLocalLobbyVisible(true);

    if (socketRef.current) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit(
        'create_game_lobby',
        {
          roomCode: code,
          gameCode: code,
          gameName: selectedGame?.name || 'Ludo',
          gameMode: selectedGame?.mode || 'classic',
          bet: selectedGame?.bet || ludoBetAmount || 100,
          maxPlayers: selectedPlayers || 2,
          userId: currentUser?._id,
        },
        (res) => {
          if (res?.error) {
            console.warn('[LOBBY] Error creating lobby on server:', res.error);
          } else {
            console.log('[LOBBY] Lobby registered on server with code:', code);
          }
        }
      );
    }
  };

  // Handle typing game code and real-time preview of host's bet
  const handleCodeChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
    setEnteredGameCode(clean);
    if (clean.length === 4 && socketRef.current) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit('get_lobby_preview', { code: clean }, (res) => {
        if (res?.found) {
          setCodePreviewLobby(res);
        } else {
          setCodePreviewLobby(null);
        }
      });
    } else {
      setCodePreviewLobby(null);
    }
  };

  useEffect(() => {
    if (joinGameCodeModalVisible && socketRef.current) {
      setCodePreviewLobby(null);
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit('get_active_game_lobbies');
    }
  }, [joinGameCodeModalVisible]);

  // Verify 4-digit Game Code and enter that exact lobby
  const handleVerifyAndJoinGameCode = () => {
    const cleanCode = enteredGameCode.trim();
    if (!cleanCode) {
      showToast(t('Please enter a valid Game Code!'), 'error');
      return;
    }

    const requiredBet = codePreviewLobby?.bet || selectedGame?.bet || 100;
    if (gameCoins < requiredBet) {
      showToast(
        t('Insufficient Game Coins! Please claim free coins from the Silver Chest.'),
        'error'
      );
      setJoinGameCodeModalVisible(false);
      setChestModalVisible(true);
      return;
    }

    // Check for game mismatch or mode mismatch before attempting join
    if (codePreviewLobby && selectedGame?.name) {
      const hostGame = String(codePreviewLobby.gameName || 'Ludo').toLowerCase().trim();
      const myGame = String(selectedGame.name || 'Ludo').toLowerCase().trim();
      if (hostGame !== myGame) {
        showToast(
          `${t('This code is for')} ${codePreviewLobby.gameName}! ${t('Please join from')} ${codePreviewLobby.gameName}.`,
          'error'
        );
        return;
      }

      const hostMode = String(codePreviewLobby.gameMode || 'classic').toLowerCase().trim();
      const myMode = String(selectedGame.mode || 'classic').toLowerCase().trim();
      if (hostMode !== myMode) {
        const hostModeTitle = hostMode === 'turbo' ? t('Turbo') : t('Classic');
        showToast(
          `${t('This code is for')} ${hostModeTitle} ${t('mode!')} ${t('Please join from')} ${hostModeTitle}.`,
          'error'
        );
        return;
      }
    }

    if (!socketRef.current) {
      showToast(t('Connecting to game server...'), 'info');
      return;
    }

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    setVerifyingGameCode(true);
    socketRef.current.emit(
      'verify_and_enter_game_code',
      {
        roomCode: cleanCode,
        gameCode: cleanCode,
        userId: currentUser?._id,
        expectedGameName: selectedGame?.name,
        expectedGameMode: selectedGame?.mode || 'classic',
      },
      (res) => {
        setVerifyingGameCode(false);
        if (res?.error) {
          showToast(t(res.error), 'error');
          return;
        }

        if (res?.lobby) {
          setPlayMode('local');
          setJoinGameCodeModalVisible(false);
          setSetupModalVisible(false);
          setLobbyRoomCode(res.lobby.roomCode);
          if (res.lobby.bet) {
            const joinedBet = Number(res.lobby.bet);
            matchBetRef.current = joinedBet;
            matchTotalPotRef.current = joinedBet * (res.lobby.maxPlayers || 2);
            setMatchBet(joinedBet);
            setLudoBetAmount(joinedBet);
            const isCarromMatch = res.lobby.gameName === 'Carrom Board';
            const isSnakeMatch = res.lobby.gameName === 'Snake & Ladder';
            const isTicTacToeMatch = res.lobby.gameName === 'Tic Tac Toe';
            setSelectedGame({
              id: isCarromMatch ? 'carrom' : isTicTacToeMatch ? 'tictactoe' : isSnakeMatch ? 'snake_ladder' : 'ludo',
              name: res.lobby.gameName || 'Ludo',
              mode: res.lobby.gameMode || selectedGame?.mode || 'classic',
              bet: joinedBet,
              players: res.lobby.maxPlayers || 2,
            });
          }

          const maxP = res.lobby.maxPlayers || 2;
          setSelectedPlayers(maxP);

          const colors = [
            { color: '#DC2626', colorKey: 'red' },
            { color: '#10B981', colorKey: 'green' },
            { color: '#F59E0B', colorKey: 'yellow' },
            { color: '#2563EB', colorKey: 'blue' },
          ];
          const fullSlots = [];
          for (let s = 1; s <= maxP; s++) {
            const existing = res.lobby.players?.find((p) => p.slot === s);
            if (existing) {
              fullSlots.push(existing);
            } else {
              const c = colors[s - 1] || colors[1];
              fullSlots.push({
                slot: s,
                userId: null,
                name: `Player ${s}`,
                avatar: null,
                color: c.color,
                colorKey: c.colorKey,
                isHost: false,
                status: 'waiting',
              });
            }
          }
          setLobbyPlayers(fullSlots);
          setLocalLobbyVisible(true);
          showToast(t('Joined match lobby successfully! Ready to play.'), 'success');
        }
      }
    );
  };

  // Handle tap on circular avatar slot
  const handleSlotPress = (slotNum) => {
    const slot = lobbyPlayers.find((p) => p.slot === slotNum);
    if (!slot) return;

    if (slot.status === 'ready') {
      // If player is already in slot and not host, allow removal
      if (!slot.isHost) {
        if (socketRef.current && lobbyRoomCode) {
          socketRef.current.emit('leave_game_lobby', {
            roomCode: lobbyRoomCode,
            gameCode: lobbyRoomCode,
            userId: slot.userId || currentUser?._id,
          });
        }
        setLobbyPlayers((prev) =>
          prev.map((p) =>
            p.slot === slotNum
              ? {
                ...p,
                userId: null,
                name: `Player ${slotNum}`,
                avatar: null,
                status: 'waiting',
              }
              : p
          )
        );
        showToast(t('Player removed from slot'), 'info');
      }
      return;
    }

    const requiredBet = selectedGame?.bet || 100;
    if (gameCoins < requiredBet) {
      showToast(
        t('Insufficient Game Coins! Please claim free coins from the Silver Chest.'),
        'error'
      );
      setChestModalVisible(true);
      return;
    }

    // Check if the current user is ALREADY joined in any slot in this room
    const isCurrentUserAlreadyJoined = lobbyPlayers.some(
      (p) => p.status === 'ready' && String(p.userId) === String(currentUser?._id)
    );

    if (isCurrentUserAlreadyJoined) {
      showToast(
        `${t('Waiting for Player 2! Share Game Code #')}${lobbyRoomCode}${t(' with them to join.')}`,
        'info'
      );
      return;
    }

    // Claim slot on real-time server
    if (socketRef.current && lobbyRoomCode) {
      if (!socketRef.current.connected) {
        socketRef.current.connect();
      }
      socketRef.current.emit(
        'claim_lobby_slot',
        { roomCode: lobbyRoomCode, gameCode: lobbyRoomCode, slotNum, userId: currentUser?._id },
        (response) => {
          if (response?.error) {
            showToast(t(response.error), 'error');
          }
        }
      );
    }
  };

  // Launch the match once required real registered players have joined
  const handleConfirmStartFromLobby = async () => {
    const isCurrentHost =
      lobbyPlayers.some((p) => p.isHost && String(p.userId) === String(currentUser?._id)) ||
      String(lobbyPlayers.find((p) => p.slot === 1)?.userId) === String(currentUser?._id);

    if (!isCurrentHost) {
      showToast(t('Only the lobby host can start the match!'), 'info');
      return;
    }

    const readyCount = lobbyPlayers.filter((p) => p.status === 'ready').length;
    if (readyCount < 2) {
      showToast(t('Minimum 2 registered players required to start match!'), 'info');
      return;
    }

    const requiredBet = selectedGame?.bet || matchBetRef.current || ludoBetAmount || 100;
    if (gameCoins < requiredBet) {
      showToast(
        t('Insufficient Game Coins! Please claim free coins from the Silver Chest.'),
        'error'
      );
      setLocalLobbyVisible(false);
      setChestModalVisible(true);
      return;
    }

    // Deduct bet is handled atomically for all participating players by backend start_game_match
    if (socketRef.current && lobbyRoomCode) {
      socketRef.current.emit('start_game_match', {
        roomCode: lobbyRoomCode,
        userId: currentUser?._id,
      });
    }

    setLocalLobbyVisible(false);
    setGameResult(null);

    // Initialize specific game arena
    if (selectedGame.id === 'carrom') {
      setActiveGameArena('carrom');
    } else if (selectedGame.id === 'card_clash') {
      setActiveGameArena('card_clash');
    } else if (selectedGame.id === 'dice_battle') {
      setActiveGameArena('dice_battle');
    } else if (selectedGame.id === 'time_bomb') {
      setActiveGameArena('time_bomb');
    } else if (selectedGame.id === 'tictactoe') {
      setActiveGameArena('tictactoe');
    } else if (selectedGame.id === 'snake_ladder') {
      setActiveGameArena('snake_ladder');
    } else if (
      selectedGame.id === 'ludo' ||
      selectedGame.id === 'marvel_ludo'
    ) {
      setLudoPlayerPos(0);
      setLudoOpponentPos(0);
      setLudoTurn('player');
      setActiveGameArena('ludo');
    } else if (selectedGame.id === 'uno') {
      setUnoTurn('player');
      setUnoOpponentCount(5);
      setActiveGameArena('uno');
    }
  };

  // Launch the Game after checking bet coins
  const handleStartGame = async () => {
    if (!selectedGame) return;

    if (gameCoins < selectedGame.bet) {
      if (canClaimChest) {
        showToast(
          t('Insufficient Game Coins! Please claim free coins from the Silver Chest.'),
          'error'
        );
        setSetupModalVisible(false);
        setChestModalVisible(true);
      } else {
        showToast(t('Insufficient Game Coins!'), 'error');
      }
      return;
    }

    if (playMode === 'online') {
      // Direct Play against AI - No waiting lobby!
      setSetupModalVisible(false);
      const onlineBet = selectedGame?.bet || ludoBetAmount || 100;
      matchBetRef.current = onlineBet;
      matchTotalPotRef.current = onlineBet * (selectedPlayers || 2);
      setMatchBet(onlineBet);
      setMatchTotalPot(onlineBet * (selectedPlayers || 2));

      // Deduct bet from server
      try {
        const res = await api.post('/users/game/deduct-bet', {
          betAmount: onlineBet,
          gameName: selectedGame?.name || 'Ludo',
        });
        if (res.data?.success) {
          setGameCoins(res.data.gameCoins);
        }
      } catch (err) {
        setGameCoins((prev) => Math.max(0, prev - (selectedGame?.bet || 100)));
      }

      setGameResult(null);

      // Initialize game arena directly against AI bot
      if (selectedGame.id === 'tictactoe') {
        setActiveGameArena('tictactoe');
      } else if (selectedGame.id === 'card_clash') {
        setActiveGameArena('card_clash');
      } else if (selectedGame.id === 'dice_battle') {
        setActiveGameArena('dice_battle');
      } else if (selectedGame.id === 'time_bomb') {
        setActiveGameArena('time_bomb');
      } else if (selectedGame.id === 'snake_ladder') {
        setActiveGameArena('snake_ladder');
      } else if (selectedGame.id === 'carrom') {
        setActiveGameArena('carrom');
      } else if (
        selectedGame.id === 'ludo' ||
        selectedGame.id === 'marvel_ludo'
      ) {
        setLudoPlayerPos(0);
        setLudoOpponentPos(0);
        setLudoTurn('player');
        setActiveGameArena('ludo');
      }
      return;
    }

    // Local Mode: Open Lobby with Game Code for 2nd player to join
    openLocalLobby();
  };

  // ================= LUDO GAME LOGIC =================
  const handleRollDice = () => {
    if (ludoRolling || ludoTurn !== 'player') return;
    setLudoRolling(true);

    let rollCount = 0;
    const interval = setInterval(() => {
      setLudoDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setLudoDice(finalVal);
        setLudoRolling(false);

        // Move Player Token
        setLudoPlayerPos((prev) => {
          const next = prev + finalVal;
          if (next >= 56) {
            handleGameWin('Ludo');
            return 56;
          }
          return next;
        });

        // Switch to Opponent Turn
        setLudoTurn('opponent');
        setTimeout(handleOpponentLudoTurn, 1400);
      }
    }, 80);
  };

  const handleOpponentLudoTurn = () => {
    const oppRoll = Math.floor(Math.random() * 6) + 1;
    setLudoDice(oppRoll);
    setLudoOpponentPos((prev) => {
      const next = prev + oppRoll;
      if (next >= 56) {
        handleGameLoss('Ludo');
        return 56;
      }
      return next;
    });
    setLudoTurn('player');
  };

  // ================= UNO GAME LOGIC =================
  const handlePlayUnoCard = (card) => {
    if (unoTurn !== 'player') return;

    // Check matching color or value or wild
    const canPlay =
      card.color === unoDiscardTop.color ||
      card.value === unoDiscardTop.value ||
      card.value.includes('+');

    if (!canPlay) {
      showToast(t('Card must match color or number!'), 'info');
      return;
    }

    // Play card
    setUnoDiscardTop(card);
    const updated = unoPlayerCards.filter((c) => c.id !== card.id);
    setUnoPlayerCards(updated);

    if (updated.length === 0) {
      handleGameWin('UNO');
      return;
    }

    if (updated.length === 1) {
      showToast(t('UNO! Only 1 card left! 🔥'), 'success');
    }

    // Opponent turn
    setUnoTurn('opponent');
    setTimeout(() => {
      setUnoOpponentCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          handleGameLoss('UNO');
        }
        return next;
      });
      setUnoTurn('player');
    }, 1200);
  };

  const handleDrawUnoCard = () => {
    if (unoTurn !== 'player') return;
    const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomVal = String(Math.floor(Math.random() * 9) + 1);
    const newCard = { id: Date.now(), color: randomColor, value: randomVal };
    setUnoPlayerCards((prev) => [...prev, newCard]);
    showToast(t('Drew a card from deck!'), 'info');
    setUnoTurn('opponent');
    setTimeout(() => {
      setUnoTurn('player');
    }, 1000);
  };

  // ================= DOMINOS GAME LOGIC =================
  const handlePlayDominoTile = (tile) => {
    const lastTile = dominoBoardLine[dominoBoardLine.length - 1];
    const canPlay =
      tile.left === lastTile.right ||
      tile.right === lastTile.right ||
      tile.left === lastTile.left;

    if (!canPlay && dominoBoardLine.length > 1) {
      showToast(t('Tile dots must match the open end!'), 'info');
      return;
    }

    setDominoBoardLine((prev) => [...prev, tile]);
    const updated = dominoPlayerHand.filter((tItem) => tItem.id !== tile.id);
    setDominoPlayerHand(updated);

    if (updated.length === 0) {
      handleGameWin('Dominos');
    } else {
      showToast(t('Tile placed! Opponent thinking...'), 'info');
      setTimeout(() => {
        setDominoOpponentCount((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            handleGameLoss('Dominos');
            return 0;
          }
          showToast(t('Opponent placed a tile! Your turn.'), 'info');
          return next;
        });
      }, 1100);
    }
  };

  // Win Handler: Awards exact combined pot of all players (bet × players)
  const handleGameWin = async (gameName) => {
    setGameResult('won');
    const bet = matchBetRef.current || matchBet || selectedGame?.bet || ludoBetAmount || 100;
    const players = selectedPlayers || 2;
    const totalPot = matchTotalPotRef.current || matchTotalPot || (bet * players); // Exact total coins pool from all players!
    const profit = Math.max(0, totalPot - bet);

    if (playMode === 'local' && socketRef.current && lobbyRoomCode) {
      // Backend socket atomically awards totalPot in MongoDB and broadcasts game_match_finished
      socketRef.current.emit('player_won_match', {
        roomCode: lobbyRoomCode,
        userId: currentUser?._id,
      });
      return;
    }

    try {
      const res = await api.post('/users/game/award-win', {
        winAmount: totalPot,
        gameName: selectedGame?.name || gameName,
      });
      if (res.data?.success) {
        setGameCoins(res.data.gameCoins);
        showToast(
          `${t('Victory!')} ${t('You won')} +${profit} ${t('Game Coins!')} 🏆🎉 (${t('Total Pot')}: ${totalPot})`,
          'success'
        );
      } else {
        setGameCoins((prev) => prev + totalPot);
        showToast(
          `${t('Victory!')} ${t('You won')} +${profit} ${t('Game Coins!')} 🏆🎉 (${t('Total Pot')}: ${totalPot})`,
          'success'
        );
      }
    } catch (err) {
      setGameCoins((prev) => prev + totalPot);
      showToast(
        `${t('Victory!')} ${t('You won')} +${profit} ${t('Game Coins!')} 🏆🎉 (${t('Total Pot')}: ${totalPot})`,
        'success'
      );
    }

    // Automatically close the game arena after victory celebration
    setTimeout(() => {
      setGameResult(null);
      setArenaGamePhase('waiting');
      setActiveGameArena(null);
    }, 2200);
  };

  // Loss Handler: Confirms loss & logs deduction
  const handleGameLoss = async (gameName) => {
    setGameResult('lost');
    const bet = matchBet || selectedGame?.bet || 100;
    try {
      await api.post('/users/game/forfeit', {
        betAmount: bet,
        gameName: selectedGame?.name || gameName,
        reason: 'loss',
      });
    } catch (e) {
      // Handled silently
    }
    showToast(
      `${t('Match lost!')} -${bet} ${t('Game Coins deducted.')}`,
      'error'
    );

    // Automatically close the game arena after loss result
    setTimeout(() => {
      setGameResult(null);
      setArenaGamePhase('waiting');
      setActiveGameArena(null);
    }, 2200);
  };

  // Draw / Tie Handler: Refunds coins, displays draw notice, and auto-closes arena after 2 seconds
  const handleGameDraw = async (gameName) => {
    setGameResult('draw');
    const bet = matchBetRef.current || matchBet || selectedGame?.bet || ludoBetAmount || 100;

    if (playMode === 'local' && socketRef.current && lobbyRoomCode) {
      socketRef.current.emit('tictactoe_match_draw', {
        roomCode: lobbyRoomCode,
      });
      fetchChestStatus?.();
    } else {
      try {
        const res = await api.post('/users/game/refund-bet', {
          betAmount: bet,
          gameName: selectedGame?.name || gameName,
          reason: 'draw',
        });
        if (res.data?.success) {
          setGameCoins(res.data.gameCoins);
        } else {
          setGameCoins((prev) => prev + bet);
        }
      } catch (e) {
        setGameCoins((prev) => prev + bet);
      }
    }

    showToast(t('Match ended in a Draw! Bets refunded.'), 'info');

    // Automatically close the game arena after 2 seconds!
    setTimeout(() => {
      setGameResult(null);
      setArenaGamePhase('waiting');
      setActiveGameArena(null);
    }, 2000);
  };

  // Arena Exit Handler: If TimeBomb is still in 'waiting' phase, refund coins & exit free.
  // If game is already in progress, show quit confirmation (coins forfeited).
  const handleExitArenaPress = async () => {
    if (gameResult) {
      setArenaGamePhase('waiting');
      setActiveGameArena(null);
      return;
    }
    // Time Bomb special case: game not yet started → free exit with refund
    if (activeGameArena === 'time_bomb' && arenaGamePhase === 'waiting') {
      // Refund the deducted bet back to user since game never started
      const bet = matchBetRef.current || matchBet || selectedGame?.bet || 100;
      try {
        const res = await api.post('/users/game/refund-bet', {
          betAmount: bet,
          gameName: selectedGame?.name || 'Time Bomb',
          reason: 'game_not_started',
        });
        if (res.data?.success) {
          setGameCoins(res.data.gameCoins);
        } else {
          setGameCoins((prev) => prev + bet);
        }
      } catch (e) {
        // Refund locally if API fails
        setGameCoins((prev) => prev + bet);
      }
      showToast(t('Game cancelled. Coins refunded!'), 'info');
      setArenaGamePhase('waiting');
      setActiveGameArena(null);
      return;
    }
    setQuitConfirmModalVisible(true);
  };

  // Confirm Quit Mid-Game: Forfeits the bet coins
  const handleConfirmQuitGame = async () => {
    setQuitConfirmModalVisible(false);
    const bet = selectedGame?.bet || 100;

    // Notify backend socket if local / lobby multiplayer match
    if (playMode === 'local' && socketRef.current && lobbyRoomCode) {
      socketRef.current.emit('player_quit_match', {
        roomCode: lobbyRoomCode,
        userId: currentUser?._id,
      });
    }

    try {
      await api.post('/users/game/forfeit', {
        betAmount: bet,
        gameName: selectedGame?.name || 'Game',
        reason: 'quit',
      });
    } catch (e) {
      // Handled silently
    }
    fetchChestStatus();
    setArenaGamePhase('waiting');
    setActiveGameArena(null);
    showToast(
      `${t('Match forfeited!')} -${bet} ${t('Game Coins deducted.')}`,
      'error'
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP GAMING HEADER: Ludo, Tic Tac Toe, Carrom, Games */}
      <View style={[styles.gamingHeader, { paddingTop: Math.max(16, insets.top) }]}>
        {/* Horizontally scrollable tabs so all tabs + calendar are always accessible */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.gameTabsRow}
        >
          {['Ludo', 'Tic Tac Toe', 'Carrom', 'Dice Battle', 'Card Clash', 'Time Bomb', 'Games'].map((tab) => {
            const isActive = activeGameTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.gameTabItem}
                activeOpacity={0.8}
                onPress={() => setActiveGameTab(tab)}
              >
                <Text style={[styles.gameTabText, isActive && styles.gameTabTextActive]}>
                  {t(tab)}
                </Text>
                {isActive && <View style={styles.gameTabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Calendar Daily Streak Icon — pinned on right, always visible */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setChestModalVisible(true)}
          style={styles.treasureBadgeWrap}
        >
          <Image
            source={CALENDAR_IMG}
            style={styles.treasureBadgeImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* 2. USER COINS & CURRENCY BAR (Golden Wallet Coins + Green Game Coins) */}
      <View style={styles.userCurrencyBar}>
        {/* Left: User Avatar */}
        <View style={styles.userAvatarWrap}>
          <Image
            source={{
              uri:
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.userAvatarImg}
          />
        </View>

        {/* Currency Pill 1: Golden Wallet Coins */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.walletCoinPill}
          onPress={() => {
            if (navigation?.navigate) {
              navigation.navigate('Wallet');
            } else {
              showToast(
                t(`Main Wallet Coins: ${walletCoins} 🪙. (Use Game Coins to play games)`),
                'info'
              );
            }
          }}
        >
          <Image
            source={GOLD_COIN_IMG}
            style={styles.coinIconImg}
            resizeMode="contain"
          />
          <Text style={styles.coinText}>{walletCoins}</Text>
          <Text style={styles.coinChevron}>›</Text>
        </TouchableOpacity>

        {/* Currency Pill 2: Green Game Coins (Used specifically for games) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.gameCoinPill}
          onPress={() => setChestModalVisible(true)}
        >
          <Image
            source={GREEN_COIN_IMG}
            style={styles.coinIconImg}
            resizeMode="contain"
          />
          <Text style={styles.gameCoinText}>{gameCoins}</Text>
          <Text style={styles.coinChevron}>›</Text>
        </TouchableOpacity>

        {/* Right: Shop Icon (Store) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.shopIconWrap}
          onPress={() => showToast(t('Game Store coming soon! 🏪'), 'info')}
        >
          <Image
            source={SHOP_IMG}
            style={styles.shopIconImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* 3. SILVER TREASURE CHEST (Daily Free Game Coins Claim Button) */}
      <View style={styles.silverChestRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (canClaimChest) {
              handleClaimChest();
            } else {
              setChestModalVisible(true);
            }
          }}
          style={styles.silverChestBtn}
        >
          <Image
            source={SILVER_CHEST_IMG}
            style={styles.silverChestImg}
            resizeMode="contain"
          />
          <Animated.View
            style={[
              styles.chestGetPill,
              canClaimChest && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <LinearGradient
              colors={canClaimChest ? ['#00E676', '#00C853'] : ['#94A3B8', '#64748B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chestGetGradient}
            >
              <Text style={styles.chestGetText}>
                {canClaimChest ? t('Get') : t('Claimed')}
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* 4. GAME CONTENT AREA (Ludo, Dominos, UNO, or Games Grid) */}
      <ScrollView
        style={styles.gameScrollBody}
        contentContainerStyle={[styles.gameScrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= 4.1 LUDO TAB ================= */}
        {activeGameTab === 'Ludo' && (
          <View style={styles.gameTabContainer}>
            {/* Ludo 3D Logo Banner */}
            <View style={styles.gameBannerWrap}>
              <View style={styles.ludoTitleRow}>
                <Text style={styles.ludoTitleLetterL}>L</Text>
                <Text style={styles.ludoTitleLetterU}>U</Text>
                <Text style={styles.ludoTitleLetterD}>D</Text>
                <Text style={styles.ludoTitleLetterO}>O</Text>
                <Image
                  source={DICE_IMG}
                  style={styles.ludoDiceIcon}
                  resizeMode="contain"
                />
              </View>
              {/* Bets Pill - Tap to choose match stakes */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.betPill}
                onPress={() => setBetSelectModalVisible(true)}
              >
                <Text style={styles.betLabel}>{t('BETS')}</Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{ludoBetAmount}</Text>
                <Text style={styles.betPillChevron}>▾</Text>
              </TouchableOpacity>
            </View>

            {/* Main Mode Cards: 1 ON 1 Classic & 1 ON 1 Turbo */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#10B981' }]}
                onPress={() => openGameSetup('ludo', 'Ludo', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <Text style={{ fontSize: 44 }}>🎲</Text>
                    <View style={styles.pkBadge}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>
                    <Text style={{ fontSize: 44 }}>🎲</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.modeBtnWrap, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.modeBtnText}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Turbo */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#F59E0B' }]}
                onPress={() => openGameSetup('ludo', 'Ludo', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <Text style={{ fontSize: 40 }}>🎲</Text>
                    <View style={[styles.pkBadge, { backgroundColor: '#F59E0B', minWidth: 26, paddingHorizontal: 4 }]}>
                      <Text style={{ fontSize: 14 }}>⚡</Text>
                    </View>
                    <Text style={{ fontSize: 40 }}>🎲</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.modeBtnWrap, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.modeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Mini Game Cards: Marvel Ludo, Snake & Ladder, Ludo Coin */}
            {/* 
            
            
            */}

          </View>
        )}

        {/* ================= 4.2 TIC TAC TOE (ZERO KATA) TAB ================= */}
        {activeGameTab === 'Tic Tac Toe' && (
          <View style={styles.gameTabContainer}>
            {/* Neon Tic Tac Toe Logo Banner */}
            <View style={[styles.gameBannerWrap, { backgroundColor: '#070714', borderColor: '#00E5FF' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>❌⭕</Text>
                <Text style={[styles.dominoesTitle, { color: '#00E5FF', textShadowColor: '#00E5FF', textShadowRadius: 10 }]}>
                  Tic Tac Toe
                </Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}><T>BETS</T></Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{ludoBetAmount} <T>Coins</T></Text>
              </View>
              <Text style={styles.betSubLimit}><T>Zero Kata Battle • Winner Takes Pot</T></Text>
            </View>

            {/* Mode Cards: 1 ON 1 Classic & 1 ON 1 Turbo */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#00E5FF', backgroundColor: '#0F172A' }]}
                onPress={() => openGameSetup('tictactoe', 'Tic Tac Toe', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#1E1B4B', '#0F172A', '#02020A']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <Text style={{ fontSize: 36, color: '#FF1744', fontWeight: '900', textShadowColor: '#FF1744', textShadowRadius: 12 }}>✕</Text>
                    <View style={[styles.pkBadge, { backgroundColor: '#00E5FF' }]}>
                      <Text style={[styles.pkText, { color: '#000000' }]}>PK</Text>
                    </View>
                    <Text style={{ fontSize: 38, color: '#00E5FF', fontWeight: '900', textShadowColor: '#00E5FF', textShadowRadius: 12 }}>◯</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#00E5FF' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Quick Battle */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#FF1744', backgroundColor: '#0F172A' }]}
                onPress={() => openGameSetup('tictactoe', 'Tic Tac Toe', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#3B0764', '#0F172A', '#02020A']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <Text style={{ fontSize: 36, color: '#FF1744', fontWeight: '900', textShadowColor: '#FF1744', textShadowRadius: 12 }}>✕</Text>
                    <View style={[styles.pkBadge, { backgroundColor: '#FF1744', minWidth: 26, paddingHorizontal: 4 }]}>
                      <Text style={{ fontSize: 14 }}>⚡</Text>
                    </View>
                    <Text style={{ fontSize: 38, color: '#00E5FF', fontWeight: '900', textShadowColor: '#00E5FF', textShadowRadius: 12 }}>◯</Text>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#FF1744' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= 4.3 CARROM BOARD TAB ================= */}
        {activeGameTab === 'Carrom' && (
          <View style={styles.gameTabContainer}>
            {/* Wooden Carrom Logo Banner */}
            <View style={[styles.gameBannerWrap, { backgroundColor: '#2B1707', borderColor: '#D97706' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
                <Text style={[styles.dominoesTitle, { color: '#F59E0B', textShadowColor: '#B45309', textShadowRadius: 10 }]}>
                  Carrom Board
                </Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}><T>BETS</T></Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{ludoBetAmount} <T>Coins</T></Text>
              </View>
              <Text style={styles.betSubLimit}><T>Authentic Disc Battle • Winner Takes Pot</T></Text>
            </View>

            {/* Mode Cards: 1 ON 1 Classic & 1 ON 1 Turbo */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#D97706', backgroundColor: '#1E1710' }]}
                onPress={() => openGameSetup('carrom', 'Carrom Board', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#5D3A1A', '#3E2410', '#1C0E05']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={styles.miniCarromBoardVisual}>
                        <View style={styles.miniCarromPocketTL} />
                        <View style={styles.miniCarromPocketTR} />
                        <View style={styles.miniCarromPocketBL} />
                        <View style={styles.miniCarromPocketBR} />
                        <View style={styles.miniCarromQueenCenter}>
                          <Text style={{ fontSize: 8 }}>👑</Text>
                        </View>
                      </View>
                      <Text style={styles.carromPieceLabel}>{t('Board')}</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#D97706' }]}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <View style={styles.carromStrikerVisual}>
                        <View style={styles.carromStrikerCore}>
                          <Text style={{ fontSize: 11, color: '#00E5FF', fontWeight: '900' }}>✦</Text>
                        </View>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#00E5FF' }]}>{t('Striker')}</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#D97706' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Turbo Blitz */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#F59E0B', backgroundColor: '#1E1710' }]}
                onPress={() => openGameSetup('carrom', 'Carrom Board', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#78350F', '#451A03', '#1C0E05']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[styles.carromStrikerVisual, { borderColor: '#F59E0B', shadowColor: '#F59E0B' }]}>
                        <View style={[styles.carromStrikerCore, { borderColor: '#EF4444' }]}>
                          <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '900' }}>⚡</Text>
                        </View>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#F59E0B' }]}>{t('Striker')}</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#EF4444', minWidth: 28, paddingHorizontal: 4 }]}>
                      <Text style={[styles.pkText, { fontSize: 13 }]}>7s ⚡</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <View style={styles.miniCarromBoardVisual}>
                        <View style={styles.miniCarromPocketTL} />
                        <View style={styles.miniCarromPocketTR} />
                        <View style={styles.miniCarromPocketBL} />
                        <View style={styles.miniCarromPocketBR} />
                        <View style={styles.miniCarromQueenCenter}>
                          <Text style={{ fontSize: 8 }}>👑</Text>
                        </View>
                      </View>
                      <Text style={styles.carromPieceLabel}>{t('Board')}</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Mode Card 3: 4 Players Team Battle */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.mainModeCard, { width: '100%', marginTop: 8, borderColor: '#3B82F6', backgroundColor: '#10172A' }]}
              onPress={() => openGameSetup('carrom', 'Carrom Board', 'classic', ludoBetAmount, 4)}
            >
              <LinearGradient
                colors={['#1E3A8A', '#172554', '#0F172A']}
                style={[styles.modeCardVisual, { paddingVertical: 12 }]}
              >
                <View style={styles.pkBattleRow}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>🔴 🔵</Text>
                    <Text style={[styles.carromPieceLabel, { color: '#60A5FA' }]}>Team A</Text>
                  </View>
                  <View style={[styles.pkBadge, { backgroundColor: '#3B82F6', minWidth: 64 }]}>
                    <Text style={[styles.pkText, { fontSize: 11 }]}>4 PLAYERS</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 18 }}>⚫ 🟢</Text>
                    <Text style={[styles.carromPieceLabel, { color: '#F87171' }]}>Team B</Text>
                  </View>
                </View>
              </LinearGradient>
              <View style={[styles.woodModeBtnWrap, { backgroundColor: '#3B82F6' }]}>
                <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('4 Player Battle')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 4.3B DICE BATTLE TAB ================= */}
        {activeGameTab === 'Dice Battle' && (
          <View style={styles.gameTabContainer}>
            {/* Neon Purple Dice Banner */}
            <View style={[styles.gameBannerWrap, { backgroundColor: '#1E1435', borderColor: '#8B5CF6' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>🎲</Text>
                <Text style={[styles.dominoesTitle, { color: '#A78BFA', textShadowColor: '#7C3AED', textShadowRadius: 10 }]}>
                  Dice Battle
                </Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}><T>BETS</T></Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{ludoBetAmount} <T>Coins</T></Text>
              </View>
              <Text style={styles.betSubLimit}><T>High Roller Duel • Best of 3 Rounds • Winner Takes Pot</T></Text>
            </View>

            {/* Mode Cards: 1 ON 1 Classic Duel & 1 ON 1 Turbo Blitz */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic (Best of 3) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#8B5CF6', backgroundColor: '#161129' }]}
                onPress={() => openGameSetup('dice_battle', 'Dice Battle', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#4C1D95', '#2E1065', '#161129']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 28 }}>🎲</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#C4B5FD' }]}>Player 1</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#8B5CF6' }]}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 28 }}>🎲</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#F472B6' }]}>Player 2</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Turbo Blitz (1 Round Sudden Death) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#EC4899', backgroundColor: '#1A0F24' }]}
                onPress={() => openGameSetup('dice_battle', 'Dice Battle', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#831843', '#500724', '#1A0F24']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 28 }}>⚡</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#F472B6' }]}>Blitz</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#EC4899', minWidth: 32, paddingHorizontal: 4 }]}>
                      <Text style={[styles.pkText, { fontSize: 13 }]}>7s ⚡</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 28 }}>💥</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#FCD34D' }]}>1 Roll</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#EC4899' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Mode Card 3: 4 Players Rumble */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.mainModeCard, { width: '100%', marginTop: 8, borderColor: '#10B981', backgroundColor: '#091C15' }]}
              onPress={() => openGameSetup('dice_battle', 'Dice Battle', 'classic', ludoBetAmount, 4)}
            >
              <LinearGradient
                colors={['#064E3B', '#022C22', '#061912']}
                style={[styles.modeCardVisual, { paddingVertical: 12 }]}
              >
                <View style={styles.pkBattleRow}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20 }}>🎲 🎲</Text>
                    <Text style={[styles.carromPieceLabel, { color: '#6EE7B7' }]}>Group A</Text>
                  </View>
                  <View style={[styles.pkBadge, { backgroundColor: '#10B981', minWidth: 70 }]}>
                    <Text style={[styles.pkText, { fontSize: 11 }]}>4 PLAYERS</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20 }}>🎲 🎲</Text>
                    <Text style={[styles.carromPieceLabel, { color: '#FDE047' }]}>Group B</Text>
                  </View>
                </View>
              </LinearGradient>
              <View style={[styles.woodModeBtnWrap, { backgroundColor: '#10B981' }]}>
                <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('4 Player Battle')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 4.3C CARD CLASH TAB ================= */}
        {activeGameTab === 'Card Clash' && (
          <View style={styles.gameTabContainer}>
            {/* Crimson Casino Banner */}
            <View style={[styles.gameBannerWrap, { backgroundColor: '#1A0B10', borderColor: '#EF4444' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>🃏</Text>
                <Text style={[styles.dominoesTitle, { color: '#F87171', textShadowColor: '#DC2626', textShadowRadius: 10 }]}>
                  High Card Clash
                </Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}><T>BETS</T></Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{ludoBetAmount} <T>Coins</T></Text>
              </View>
              <Text style={styles.betSubLimit}><T>High Card Duel • Ace is High • Winner Takes Pot</T></Text>
            </View>

            {/* Mode Cards: 1 ON 1 Classic, 1 ON 1 Turbo, 4 Player Battle */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic (Best of 3) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#EF4444', backgroundColor: '#1E1015' }]}
                onPress={() => openGameSetup('card_clash', 'High Card Clash', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#7F1D1D', '#450A0A', '#1E1015']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 38, height: 52, backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 2, borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, color: '#EF4444', fontWeight: '900', lineHeight: 20 }}>A</Text>
                        <Text style={{ fontSize: 12, color: '#EF4444', lineHeight: 13 }}>♠</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#FCA5A5', marginTop: 3 }]}>Player 1</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 38, height: 52, backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 2, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, color: '#DC2626', fontWeight: '900', lineHeight: 20 }}>K</Text>
                        <Text style={{ fontSize: 12, color: '#DC2626', lineHeight: 13 }}>♥</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#60A5FA', marginTop: 3 }]}>Player 2</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Turbo Blitz */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#F59E0B', backgroundColor: '#1F160A' }]}
                onPress={() => openGameSetup('card_clash', 'High Card Clash', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient
                  colors={['#78350F', '#451A03', '#1F160A']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 38, height: 52, backgroundColor: '#1C1C1E', borderRadius: 6, borderWidth: 2, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, color: '#F59E0B', fontWeight: '900', lineHeight: 18 }}>🃏</Text>
                        <Text style={{ fontSize: 9, color: '#F59E0B', fontWeight: '800', lineHeight: 11 }}>TURBO</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#FCD34D', marginTop: 3 }]}>Blitz</Text>
                    </View>

                    <View style={[styles.pkBadge, { backgroundColor: '#F59E0B', minWidth: 32, paddingHorizontal: 4 }]}>
                      <Text style={[styles.pkText, { fontSize: 13, color: '#000000' }]}>7s ⚡</Text>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 38, height: 52, backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 2, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, color: '#B45309', fontWeight: '900', lineHeight: 20 }}>A</Text>
                        <Text style={{ fontSize: 12, color: '#B45309', lineHeight: 13 }}>♦</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#FCD34D', marginTop: 3 }]}>1 Draw</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Mode Card 3: 4 Players Rumble */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.mainModeCard, { width: '100%', marginTop: 8, borderColor: '#3B82F6', backgroundColor: '#0F172A' }]}
              onPress={() => openGameSetup('card_clash', 'High Card Clash', 'classic', ludoBetAmount, 4)}
            >
              <LinearGradient
                colors={['#1E3A8A', '#172554', '#0F172A']}
                style={[styles.modeCardVisual, { paddingVertical: 12 }]}
              >
                <View style={styles.pkBattleRow}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      <View style={{ width: 26, height: 36, backgroundColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '900', lineHeight: 14 }}>A</Text>
                        <Text style={{ fontSize: 9, color: '#EF4444', lineHeight: 10 }}>♥</Text>
                      </View>
                      <View style={{ width: 26, height: 36, backgroundColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#1D4ED8', fontWeight: '900', lineHeight: 14 }}>K</Text>
                        <Text style={{ fontSize: 9, color: '#1D4ED8', lineHeight: 10 }}>♠</Text>
                      </View>
                    </View>
                    <Text style={[styles.carromPieceLabel, { color: '#93C5FD' }]}>Side A</Text>
                  </View>
                  <View style={[styles.pkBadge, { backgroundColor: '#3B82F6', minWidth: 70 }]}>
                    <Text style={[styles.pkText, { fontSize: 11 }]}>4 PLAYERS</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      <View style={{ width: 26, height: 36, backgroundColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '900', lineHeight: 14 }}>Q</Text>
                        <Text style={{ fontSize: 9, color: '#EF4444', lineHeight: 10 }}>♦</Text>
                      </View>
                      <View style={{ width: 26, height: 36, backgroundColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 13, color: '#1D4ED8', fontWeight: '900', lineHeight: 14 }}>J</Text>
                        <Text style={{ fontSize: 9, color: '#1D4ED8', lineHeight: 10 }}>♣</Text>
                      </View>
                    </View>
                    <Text style={[styles.carromPieceLabel, { color: '#FCA5A5' }]}>Side B</Text>
                  </View>
                </View>
              </LinearGradient>
              <View style={[styles.woodModeBtnWrap, { backgroundColor: '#3B82F6' }]}>
                <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('4 Player Battle')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 4.3D TIME BOMB TAB ================= */}
        {activeGameTab === 'Time Bomb' && (
          <View style={styles.gameTabContainer}>
            {/* Time Bomb Banner */}
            <View style={[styles.gameBannerWrap, { backgroundColor: '#150005', borderColor: '#EF4444' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>💣</Text>
                <Text style={[styles.dominoesTitle, { color: '#F87171', textShadowColor: '#DC2626', textShadowRadius: 10 }]}>
                  Time Bomb Pass
                </Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}><T>BETS</T></Text>
                <Image source={GREEN_COIN_IMG} style={{ width: 18, height: 18 }} resizeMode="contain" />
                <Text style={styles.betAmount}>{ludoBetAmount} <T>Coins</T></Text>
              </View>
              <Text style={styles.betSubLimit}><T>Pass the bomb before it blows! Last survivor wins the pot.</T></Text>
            </View>

            {/* Mode Cards Row: 1 ON 1 Classic + 1 ON 1 Turbo side by side */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Classic */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#EF4444', backgroundColor: '#150005' }]}
                onPress={() => openGameSetup('time_bomb', 'Time Bomb', 'classic', ludoBetAmount, 2)}
              >
                <LinearGradient colors={['#7F1D1D', '#450A0A', '#150005']} style={styles.modeCardVisual}>
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 30 }}>{'💣'}</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#FCA5A5', marginTop: 3 }]}>Player 1</Text>
                    </View>
                    <View style={[styles.pkBadge, { backgroundColor: '#EF4444' }]}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 30 }}>{'🤲'}</Text>
                      <Text style={[styles.carromPieceLabel, { color: '#FCA5A5', marginTop: 3 }]}>Player 2</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('1 ON 1 Classic')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 1 ON 1 Turbo ⚡ */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, { borderColor: '#F59E0B', backgroundColor: '#1F0F00' }]}
                onPress={() => openGameSetup('time_bomb', 'Time Bomb', 'turbo', ludoBetAmount, 2)}
              >
                <LinearGradient colors={['#78350F', '#451A03', '#1F0F00']} style={styles.modeCardVisual}>
                  <View style={styles.pkBattleRow}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', borderWidth: 2, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{'💣'}</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#FCD34D', marginTop: 3 }]}>Blitz</Text>
                    </View>
                    <View style={[styles.pkBadge, { backgroundColor: '#F59E0B', minWidth: 32, paddingHorizontal: 4 }]}>
                      <Text style={[styles.pkText, { fontSize: 13, color: '#000000' }]}>⚡</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', borderWidth: 2, borderColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20 }}>{'🤲'}</Text>
                      </View>
                      <Text style={[styles.carromPieceLabel, { color: '#FCD34D', marginTop: 3 }]}>Fast</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={[styles.woodModeBtnWrap, { backgroundColor: '#F59E0B' }]}>
                  <Text style={[styles.woodModeBtnText, { color: '#000000', fontWeight: '900' }]}>{t('1 ON 1 Turbo')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 4 Player Chaos - full width */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.mainModeCard, { width: '100%', marginTop: 8, borderColor: '#8B5CF6', backgroundColor: '#0d0015' }]}
              onPress={() => openGameSetup('time_bomb', 'Time Bomb', 'classic', ludoBetAmount, 4)}
            >
              <LinearGradient colors={['#2e1065', '#4c1d95', '#0d0015']} style={[styles.modeCardVisual, { paddingVertical: 12 }]}>
                <View style={styles.pkBattleRow}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      <Text style={{ fontSize: 22 }}>{'😎'}</Text>
                      <Text style={{ fontSize: 22 }}>{'🤖'}</Text>
                    </View>
                    <Text style={[styles.carromPieceLabel, { color: '#C4B5FD' }]}>Team A</Text>
                  </View>
                  <View style={[styles.pkBadge, { backgroundColor: '#8B5CF6', minWidth: 70 }]}>
                    <Text style={[styles.pkText, { fontSize: 11 }]}>4 BOMB</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      <Text style={{ fontSize: 22 }}>{'👻'}</Text>
                      <Text style={{ fontSize: 22 }}>{'🦊'}</Text>
                    </View>
                    <Text style={[styles.carromPieceLabel, { color: '#C4B5FD' }]}>Team B</Text>
                  </View>
                </View>
              </LinearGradient>
              <View style={[styles.woodModeBtnWrap, { backgroundColor: '#8B5CF6' }]}>
                <Text style={[styles.woodModeBtnText, { color: '#FFFFFF', fontWeight: '900' }]}>{t('4 Player Chaos')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 4.4 ALL GAMES TAB ================= */}
        {activeGameTab === 'Games' && (
          <View style={styles.gameTabContainer}>
            <Text style={styles.sectionHeader}>{t('Featured Games')}</Text>
            <View style={styles.allGamesGrid}>
              {[
                { id: 'Ludo', name: 'Ludo Classic', icon: '🎲', color: '#00C853' },
                { id: 'Tic Tac Toe', name: 'Tic Tac Toe', icon: '❌⭕', color: '#00E5FF' },
                { id: 'Carrom', name: 'Carrom Board', icon: '🎯', color: '#D97706' },
                { id: 'Dice Battle', name: 'Dice Battle', icon: '🎲', color: '#8B5CF6' },
                { id: 'Card Clash', name: 'High Card Clash', icon: '🃏', color: '#EF4444' },
                { id: 'Time Bomb', name: 'Time Bomb Pass', icon: '💣', color: '#DC2626' },
              ].map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.allGameCard}
                  activeOpacity={0.85}
                  onPress={() => setActiveGameTab(g.id)}
                >
                  <View style={[styles.allGameIconBox, { backgroundColor: g.color }]}>
                    <Text style={{ fontSize: 32 }}>{g.icon}</Text>
                  </View>
                  <Text style={styles.allGameTitle}>{t(g.name)}</Text>
                  <Text style={styles.allGameSub}>{t('Tap to Play')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL 1: SILVER CHEST DAILY REWARDS ================= */}
      <Modal visible={chestModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.chestModalBox}>
            {/* Header */}
            <View style={styles.chestModalHeader}>
              <Image
                source={SILVER_CHEST_IMG}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chestModalTitle}>{t('Daily Game Coins')}</Text>
                <Text style={styles.chestModalSub}>
                  {t('Claim free coins daily! Streak increases your reward.')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setChestModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 7-Day Rewards Streak Track */}
            <View style={styles.streakGrid}>
              {CHEST_REWARDS.map((coins, index) => {
                const day = index + 1;
                const isClaimed = index < currentStreak;
                const isToday = index === currentStreak && canClaimChest;
                return (
                  <View
                    key={day}
                    style={[
                      styles.streakDayBox,
                      isToday && styles.streakDayBoxActive,
                      isClaimed && styles.streakDayBoxClaimed,
                    ]}
                  >
                    <Text style={styles.streakDayLabel}>{t(`Day ${day}`)}</Text>
                    <Image
                      source={GREEN_COIN_IMG}
                      style={{ width: 22, height: 22, marginVertical: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.streakCoinsCount}>+{coins}</Text>
                    {isClaimed && <Text style={styles.streakCheckMark}>✓</Text>}
                  </View>
                );
              })}
            </View>

            {/* Claim Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={!canClaimChest || claimingChest}
              style={[
                styles.claimChestActionBtn,
                !canClaimChest && styles.claimChestActionBtnDisabled,
              ]}
              onPress={handleClaimChest}
            >
              <LinearGradient
                colors={canClaimChest ? ['#00E676', '#00C853'] : ['#94A3B8', '#64748B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimChestActionGradient}
              >
                {claimingChest ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.claimChestActionText}>
                    {canClaimChest
                      ? t(`Claim Day ${currentStreak + 1} (+${nextReward} Coins) 🎁`)
                      : t('Already Claimed for Today! Come back tomorrow')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 1.5: OPEN SILVER CHEST REWARD CELEBRATION ================= */}
      <Modal visible={openChestModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.openChestCelebrationCard,
              { transform: [{ scale: openChestScale }] },
            ]}
          >
            {/* Close Button Top-Right */}
            <TouchableOpacity
              style={styles.openChestCloseIcon}
              onPress={() => setOpenChestModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.modalCloseBtn}>✕</Text>
            </TouchableOpacity>

            {/* Glowing Day Streak Tag */}
            <View style={styles.openChestBadge}>
              <Text style={styles.openChestBadgeText}>
                {t(`Day ${rewardClaimInfo.streak} Claimed!`)}
              </Text>
            </View>

            <Text style={styles.openChestTitle}>
              {t('Silver Chest Unlocked!')}
            </Text>

            {/* Open Silver Chest with bursting cyan light & emerald coins */}
            <View style={styles.openChestImgWrap}>
              <Image
                source={SILVER_CHEST_OPEN_IMG}
                style={styles.openChestImgLarge}
                resizeMode="contain"
              />
            </View>

            {/* Coins Earned Highlight */}
            <View style={styles.rewardCoinsPill}>
              <Image
                source={GREEN_COIN_IMG}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text style={styles.rewardCoinsValue}>
                +{rewardClaimInfo.coins}
              </Text>
              <Text style={styles.rewardCoinsUnit}>{t('Game Coins')}</Text>
            </View>

            <Text style={styles.openChestSubtext}>
              {t('Coins added to your Game Balance')}
            </Text>
            <Text style={styles.openChestNote}>
              {t('Play Ludo, Dominos & UNO to win more!')}
            </Text>

            {/* Collect & Close Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.collectBtnWrap}
              onPress={() => setOpenChestModalVisible(false)}
            >
              <LinearGradient
                colors={['#00E676', '#00C853', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.collectBtnGradient}
              >
                <Text style={styles.collectBtnText}>
                  {t('Awesome! Close')} 🎁
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ================= MODAL 2: GAME SETUP (Online vs Local & Players) ================= */}
      <Modal visible={setupModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.setupModalBox}>
            <View style={styles.setupHeaderRow}>
              <Text style={styles.setupTitle}>
                🎮 {t(selectedGame?.name || 'Game Setup')}
              </Text>
              <TouchableOpacity onPress={() => setSetupModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Mode Banner Indicator */}
            <View style={[styles.setupModeBadge, selectedGame?.mode === 'turbo' ? styles.setupModeBadgeTurbo : styles.setupModeBadgeClassic]}>
              <Text style={[styles.setupModeBadgeText, selectedGame?.mode === 'turbo' ? { color: '#F59E0B' } : { color: '#10B981' }]}>
                {selectedGame?.mode === 'turbo' ? t('⚡ Turbo Mode Selected (7s Blitz)') : t('👑 Classic Mode Selected (20s Relaxed)')}
              </Text>
            </View>

            {/* Game Selector for Board Games (Ludo vs Snake & Ladder) */}
            {(selectedGame?.id === 'ludo' || selectedGame?.id === 'snake_ladder') && (
              <>
                <Text style={styles.setupSectionLabel}>{t('Select Game')}:</Text>
                <View style={styles.gameSelectRow}>
                  {/* Option 1: Ludo */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.gameSelectOptionBtn,
                      selectedGame?.id === 'ludo' && styles.gameSelectOptionBtnActive,
                    ]}
                    onPress={() =>
                      setSelectedGame((prev) => ({
                        ...prev,
                        id: 'ludo',
                        name: 'Ludo',
                      }))
                    }
                  >
                    <Text style={{ fontSize: 26 }}>🎲</Text>
                    <Text
                      style={[
                        styles.gameSelectOptionText,
                        selectedGame?.id === 'ludo' && styles.gameSelectOptionTextActive,
                      ]}
                    >
                      {t('Ludo')}
                    </Text>
                    {selectedGame?.id === 'ludo' && (
                      <View style={styles.gameSelectCheckBadge}>
                        <Text style={styles.gameSelectCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Option 2: Snake & Ladder */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.gameSelectOptionBtn,
                      selectedGame?.id === 'snake_ladder' && styles.gameSelectOptionBtnActive,
                    ]}
                    onPress={() =>
                      setSelectedGame((prev) => ({
                        ...prev,
                        id: 'snake_ladder',
                        name: 'Snake & Ladder',
                      }))
                    }
                  >
                    <Text style={{ fontSize: 26 }}>🐍🪜</Text>
                    <Text
                      style={[
                        styles.gameSelectOptionText,
                        selectedGame?.id === 'snake_ladder' && styles.gameSelectOptionTextActive,
                      ]}
                    >
                      {t('Snake & Ladder')}
                    </Text>
                    {selectedGame?.id === 'snake_ladder' && (
                      <View style={styles.gameSelectCheckBadge}>
                        <Text style={styles.gameSelectCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Mode Selector: Online vs Local */}
            <Text style={styles.setupSectionLabel}>{t('Select Play Mode')}:</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.modeOptionBtn,
                  playMode === 'online' && styles.modeOptionBtnActive,
                ]}
                onPress={() => {
                  setPlayMode('online');
                  setSelectedPlayers(2);
                }}
              >
                <Text style={{ fontSize: 24 }}>🌐</Text>
                <Text style={[styles.modeOptionText, playMode === 'online' && styles.modeOptionTextActive]}>
                  {t('Online Battle')}
                </Text>
                <Text style={styles.modeOptionSub}>{t('Match with online players')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.modeOptionBtn,
                  playMode === 'local' && styles.modeOptionBtnActive,
                ]}
                onPress={() => setPlayMode('local')}
              >
                <Text style={{ fontSize: 24 }}>📱</Text>
                <Text style={[styles.modeOptionText, playMode === 'local' && styles.modeOptionTextActive]}>
                  {t('Local Play')}
                </Text>
                <Text style={styles.modeOptionSub}>{t('Pass & Play / vs AI')}</Text>
              </TouchableOpacity>
            </View>

            {/* Players Count Selector - Only shown in Local Play */}
            {playMode === 'local' && (
              <>
                <Text style={styles.setupSectionLabel}>{t('Number of Players')}:</Text>
                <View style={styles.playersToggleRow}>
                  {[2, 4].map((count) => (
                    <TouchableOpacity
                      key={count}
                      activeOpacity={0.85}
                      style={[
                        styles.playerCountBtn,
                        selectedPlayers === count && styles.playerCountBtnActive,
                      ]}
                      onPress={() => setSelectedPlayers(count)}
                    >
                      <Text
                        style={[
                          styles.playerCountText,
                          selectedPlayers === count && styles.playerCountTextActive,
                        ]}
                      >
                        {count === 2 ? t('2 Players (1 ON 1)') : t('4 Players')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Bet Info & Balance Verification */}
            <View style={styles.betSummaryBox}>
              <View style={styles.betSummaryRow}>
                <Text style={styles.betSummaryLabel}>{t('Game Bet')}:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image
                    source={GREEN_COIN_IMG}
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text style={styles.betSummaryValue}>
                    {selectedGame?.bet || 100} {t('Game Coins')}
                  </Text>
                </View>
              </View>
              <View style={styles.betSummaryRow}>
                <Text style={styles.betSummaryLabel}>{t('Your Balance')}:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image
                    source={GREEN_COIN_IMG}
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text style={[styles.betSummaryValue, gameCoins < (selectedGame?.bet || 100) && { color: '#EF4444' }]}>
                    {gameCoins} {t('Game Coins')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Insufficient Coins Warning */}
            {gameCoins < (selectedGame?.bet || 100) && (
              <View style={styles.insufficientWarningBox}>
                <Text style={styles.insufficientWarningText}>
                  ⚠️ {t('Insufficient Game Coins!')}
                </Text>
                {canClaimChest && (
                  <TouchableOpacity
                    style={styles.quickChestBtn}
                    onPress={() => {
                      setSetupModalVisible(false);
                      setChestModalVisible(true);
                    }}
                  >
                    <Text style={styles.quickChestBtnText}>{t('Open Silver Chest 🎁')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Start Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.startGameActionBtn,
                gameCoins < (selectedGame?.bet || 100) && styles.startGameActionBtnDisabled,
              ]}
              disabled={gameCoins < (selectedGame?.bet || 100)}
              onPress={handleStartGame}
            >
              <LinearGradient
                colors={gameCoins >= (selectedGame?.bet || 100) ? ['#00E676', '#00C853'] : ['#94A3B8', '#64748B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startGameActionGradient}
              >
                <Text style={styles.startGameActionText}>
                  {playMode === 'online' ? t('Play Online 🎮') : t('Start Local Game 🎮')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Join Game with Game Code Button - only shown in Local Play */}
            {playMode === 'local' && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.joinGameCodeActionBtn}
                onPress={() => {
                  setEnteredGameCode('');
                  setJoinGameCodeModalVisible(true);
                }}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinGameCodeGradient}
                >
                  <Text style={styles.joinGameCodeActionText}>
                    🔑 {t('Join Game')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 1.5: BET SELECTION POPUP MODAL ================= */}
      <Modal visible={betSelectModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.betModalBox}>
            {/* Header */}
            <View style={styles.betModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.betModalTitle}>{t('Select Bet Amount')}</Text>
                  <Text style={styles.betModalSub}>{t('Choose match stakes in Game Coins')}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setBetSelectModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.modalCloseCircle}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Current Balance Row */}
            <View style={styles.betModalBalanceRow}>
              <Text style={styles.betModalBalanceLabel}>{t('Your Balance')}:</Text>
              <View style={styles.betModalBalancePill}>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
                <Text style={styles.betModalBalanceValue}>{gameCoins} {t('Game Coins')}</Text>
              </View>
            </View>

            {/* Bet Amounts Row: 100, 200, 500, 700, 1000 */}
            <View style={styles.betGrid}>
              {[100, 200, 500, 700, 1000].map((amount) => {
                const isSelected = ludoBetAmount === amount;
                const hasEnough = gameCoins >= amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    activeOpacity={0.8}
                    style={[
                      styles.betCard,
                      isSelected && styles.betCardSelected,
                    ]}
                    onPress={() => {
                      setLudoBetAmount(amount);
                      setMatchBet(amount);
                      matchBetRef.current = amount;
                      matchTotalPotRef.current = amount * (selectedPlayers || 2);
                      setSelectedGame((prev) => (prev ? { ...prev, bet: amount } : prev));
                      setBetSelectModalVisible(false);
                      if (!hasEnough) {
                        showToast(
                          `${t('Bet set to')} ${amount} ${t('Game Coins!')} ⚠️ ${t('Insufficient Game Coins to play. Claim from Silver Chest.')}`,
                          'info'
                        );
                      } else {
                        showToast(
                          `${t('Bet set to')} ${amount} ${t('Game Coins!')} 🪙`,
                          'success'
                        );
                      }
                    }}
                  >
                    {isSelected && (
                      <View style={styles.betSelectedBadge}>
                        <Text style={styles.betSelectedBadgeText}>✓</Text>
                      </View>
                    )}
                    <Image
                      source={GREEN_COIN_IMG}
                      style={styles.betCardCoinImg}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.betCardAmountText,
                        isSelected && styles.betCardAmountTextSelected,
                      ]}
                    >
                      {amount}
                    </Text>
                    <Text style={styles.betCardLabel}>{t('Coins')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.betNoticeText}>
              💡 {t('All players must have at least the selected bet amount to join the match.')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2.1: ENTER GAME CODE MODAL ================= */}
      <Modal visible={joinGameCodeModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.joinCodeModalBox}>
            <View style={styles.setupHeaderRow}>
              <Text style={[styles.setupTitle, { color: '#FFFFFF' }]}>🔑 {t('Join Game with Game Code')}</Text>
              <TouchableOpacity onPress={() => setJoinGameCodeModalVisible(false)}>
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.joinCodePromptText}>
              {t('Enter the 4-digit Game Code shared by Player 1:')}
            </Text>

            <TextInput
              style={styles.joinCodeInputField}
              value={enteredGameCode}
              onChangeText={handleCodeChange}
              placeholder={t('Enter 4-digit Game Code')}
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />

            {/* LIVE PREVIEW OF HOST'S BET & GAME DETAILS (Shown ONLY after 4-digit code is typed) */}
            {codePreviewLobby && (
              <View style={styles.lobbyPreviewBox}>
                <View style={styles.lobbyPreviewTopRow}>
                  {codePreviewLobby.hostAvatar ? (
                    <Image source={{ uri: codePreviewLobby.hostAvatar }} style={styles.lobbyPreviewAvatar} />
                  ) : (
                    <View style={styles.lobbyPreviewAvatarPlaceholder}>
                      <Text style={{ fontSize: 13 }}>👑</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.lobbyPreviewHostName}>
                      {codePreviewLobby.hostName} ({t('Host')})
                    </Text>
                    <Text style={styles.lobbyPreviewSubText}>
                      🎮 {t(codePreviewLobby.gameName || 'Ludo')} • {codePreviewLobby.gameMode === 'turbo' ? t('Turbo ⚡') : t('Classic 👑')} • {codePreviewLobby.maxPlayers} {t('Players')}
                    </Text>
                  </View>
                  <View style={styles.lobbyPreviewLiveBadge}>
                    <Text style={styles.lobbyPreviewLiveBadgeText}>{t('Room')} #{codePreviewLobby.roomCode}</Text>
                  </View>
                </View>

                {/* Big Clear Stake / Bet Display */}
                <View style={styles.lobbyPreviewBetRow}>
                  <Text style={styles.lobbyPreviewBetLabel}>
                    💰 {t('Match Bet Set by Host')}:
                  </Text>
                  <View style={styles.lobbyPreviewBetPill}>
                    <Image
                      source={GREEN_COIN_IMG}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                    <Text style={styles.lobbyPreviewBetAmount}>
                      {codePreviewLobby.bet}
                    </Text>
                    <Text style={styles.lobbyPreviewBetCoins}>{t('Coins')}</Text>
                  </View>
                </View>

                {/* Balance & Game Matching Eligibility Status */}
                {(() => {
                  const hostGame = String(codePreviewLobby?.gameName || 'Ludo').toLowerCase().trim();
                  const myGame = String(selectedGame?.name || 'Ludo').toLowerCase().trim();
                  const isGameMismatch = Boolean(codePreviewLobby && hostGame !== myGame);

                  const hostMode = String(codePreviewLobby?.gameMode || 'classic').toLowerCase().trim();
                  const myMode = String(selectedGame?.mode || 'classic').toLowerCase().trim();
                  const isModeMismatch = Boolean(codePreviewLobby && hostMode !== myMode);

                  if (isGameMismatch) {
                    return (
                      <View style={styles.lobbyPreviewNoticeError}>
                        <Text style={styles.lobbyPreviewNoticeTextError}>
                          🚫 {t('Game Mismatch!')} {t('This code is for')} {codePreviewLobby.gameName}. {t('Please join from')} {codePreviewLobby.gameName}.
                        </Text>
                      </View>
                    );
                  }

                  if (isModeMismatch) {
                    const hostModeTitle = hostMode === 'turbo' ? t('Turbo') : t('Classic');
                    return (
                      <View style={styles.lobbyPreviewNoticeError}>
                        <Text style={styles.lobbyPreviewNoticeTextError}>
                          🚫 {t('Mode Mismatch!')} {t('Host created a')} {hostModeTitle} {t('match.')} {t('Please join from')} {hostModeTitle}.
                        </Text>
                      </View>
                    );
                  }

                  if (gameCoins < codePreviewLobby.bet) {
                    return (
                      <View style={styles.lobbyPreviewNoticeError}>
                        <Text style={styles.lobbyPreviewNoticeTextError}>
                          ⚠️ {t('Insufficient Coins!')} {t('You have')} {gameCoins} / {codePreviewLobby.bet} {t('required coins.')}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.lobbyPreviewNoticeSuccess}>
                      <Text style={styles.lobbyPreviewNoticeTextSuccess}>
                        ✅ {t('You have sufficient coins to join this match.')}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Join Lobby Action Button - Disabled if mismatch, coins are insufficient or code incomplete */}
            {(() => {
              const isInsufficient = Boolean(codePreviewLobby && gameCoins < codePreviewLobby.bet);
              const hostGame = String(codePreviewLobby?.gameName || 'Ludo').toLowerCase().trim();
              const myGame = String(selectedGame?.name || 'Ludo').toLowerCase().trim();
              const isGameMismatch = Boolean(codePreviewLobby && hostGame !== myGame);

              const hostMode = String(codePreviewLobby?.gameMode || 'classic').toLowerCase().trim();
              const myMode = String(selectedGame?.mode || 'classic').toLowerCase().trim();
              const isModeMismatch = Boolean(codePreviewLobby && hostMode !== myMode);
              const isCodeComplete = enteredGameCode.trim().length === 4;
              const isWaitingForPreview = isCodeComplete && !codePreviewLobby;

              const isDisabled =
                verifyingGameCode || isInsufficient || isGameMismatch || isModeMismatch || !isCodeComplete || isWaitingForPreview;

              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.verifyCodeActionBtn, isDisabled && { opacity: 0.6 }]}
                  disabled={isDisabled}
                  onPress={handleVerifyAndJoinGameCode}
                >
                  <LinearGradient
                    colors={isDisabled ? ['#475569', '#334155'] : ['#00E676', '#00C853']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.verifyCodeGradient}
                  >
                    {verifyingGameCode ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.verifyCodeActionText}>
                        {isWaitingForPreview
                          ? t('Checking Room... ⏳')
                          : isGameMismatch
                            ? `${t('Wrong Game: Open ')}${codePreviewLobby?.gameName || 'Game'} ⚠️`
                            : isModeMismatch
                              ? `${t('Wrong Mode: Open ')}${hostMode === 'turbo' ? t('Turbo ⚡') : t('Classic 👑')} ⚠️`
                              : isInsufficient
                                ? t('Insufficient Coins to Join ⚠️')
                                : t('Join Lobby 🚀')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2.2: LOCAL MATCH LOBBY (WAITING ROOM) ================= */}
      <Modal visible={localLobbyVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.lobbyModalBox}>
            {/* Header */}
            <View style={styles.lobbyHeaderRow}>
              <View>
                <Text style={styles.lobbyTitle}>
                  🎮 {t(selectedGame?.name || 'Ludo')} {t('Match Lobby')}
                </Text>
                <View style={styles.lobbyCodeRow}>
                  <View style={styles.lobbyCodePill}>
                    <Text style={styles.lobbyCodeLabel}>{t('Game Code')}:</Text>
                    <Text style={styles.lobbyCodeValue}>#{lobbyRoomCode}</Text>
                  </View>
                  <Text style={styles.lobbyModeSubtitle}>• {selectedPlayers} {t('Player Mode')}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleCloseLobby}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Waiting Notice Pill */}
            <View style={styles.lobbyStatusPill}>
              <Text style={styles.lobbyStatusPillText}>
                {lobbyPlayers.filter((p) => p.status === 'ready').length < 2
                  ? t('Waiting for Player 2 to join... ⏳')
                  : `${lobbyPlayers.filter((p) => p.status === 'ready').length}/${selectedPlayers} ${t('Players Ready')} ✅`}
              </Text>
            </View>

            {/* Players Grid */}
            <View style={styles.lobbyPlayersGrid}>
              {lobbyPlayers.map((player) => {
                const isReady = player.status === 'ready';
                return (
                  <View
                    key={player.slot}
                    style={[
                      styles.lobbyPlayerCard,
                      selectedPlayers === 4 && styles.lobbyPlayerCard4,
                      isReady ? styles.lobbyPlayerCardReady : styles.lobbyPlayerCardWaiting,
                    ]}
                  >
                    {isReady ? (
                      <TouchableOpacity
                        activeOpacity={player.isHost ? 1 : 0.75}
                        onPress={() => !player.isHost && handleSlotPress(player.slot)}
                        style={[
                          styles.lobbyPlayerAvatarCircle,
                          { borderColor: player.color, borderWidth: 2.5 },
                        ]}
                      >
                        {player.avatar ? (
                          <Image
                            source={{ uri: player.avatar }}
                            style={styles.lobbyPlayerAvatarImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.lobbyPlayerAvatarText}>
                            {player.isHost ? '👑' : '👤'}
                          </Text>
                        )}
                        {player.isHost && (
                          <View style={styles.lobbyHostCrownBadge}>
                            <Text style={{ fontSize: 10 }}>👑</Text>
                          </View>
                        )}
                        {!player.isHost && (
                          <View style={styles.lobbyRemovePlayerBadge}>
                            <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>✕</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.lobbyPlayerAvatarCircleEmpty}
                        onPress={() => handleSlotPress(player.slot)}
                      >
                        <Text style={styles.lobbyPlusIcon}>+</Text>
                      </TouchableOpacity>
                    )}

                    <Text style={styles.lobbyPlayerName} numberOfLines={1}>
                      {isReady ? player.name : `${t('Player')} ${player.slot}`}
                    </Text>

                    {isReady ? (
                      <View style={styles.lobbyReadyBadge}>
                        <Text style={styles.lobbyReadyBadgeText}>
                          {t('Ready ✅')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.lobbySlotTapHint}>
                        {t('Tap + to Join')}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Min 2 Players Requirement Hint */}
            <View style={styles.lobbyRequirementBox}>
              <Text style={styles.lobbyRequirementText}>
                💡 {t('Minimum 2 players required to start match')}
              </Text>
            </View>

            {/* Action Buttons: ONLY HOST CAN START MATCH */}
            {(() => {
              const isCurrentHost =
                lobbyPlayers.some((p) => p.isHost && String(p.userId) === String(currentUser?._id)) ||
                String(lobbyPlayers.find((p) => p.slot === 1)?.userId) === String(currentUser?._id);

              if (isCurrentHost) {
                return lobbyPlayers.filter((p) => p.status === 'ready').length >= 2 ? (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={styles.lobbyStartActionBtn}
                    onPress={handleConfirmStartFromLobby}
                  >
                    <LinearGradient
                      colors={['#00E676', '#00C853']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.lobbyStartGradient}
                    >
                      <Text style={styles.lobbyStartActionText}>
                        {t('Start Match Now 🚀')} (
                        {lobbyPlayers.filter((p) => p.status === 'ready').length}/
                        {selectedPlayers})
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lobbyStartActionBtnDisabled}>
                    <Text style={styles.lobbyStartActionTextDisabled}>
                      {selectedPlayers === 2
                        ? t('Waiting for Player 2 to join... ⏳')
                        : t('Waiting for at least 2 players... ⏳')}
                    </Text>
                  </View>
                );
              }

              // Guest Player (Player 2) - No Start Button, only waiting status
              return (
                <View style={styles.lobbyGuestWaitingBox}>
                  <Text style={styles.lobbyGuestWaitingText}>
                    ⏳ {t('Waiting for Host to start match...')}
                  </Text>
                </View>
              );
            })()}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.lobbyCancelBtn}
              onPress={handleCloseLobby}
            >
              <Text style={styles.lobbyCancelBtnText}>{t('Cancel Lobby')}</Text>
            </TouchableOpacity>

            {/* Connected / Joined Players Display under Cancel Lobby */}
            <View style={styles.lobbyJoinedSummaryBox}>
              <View style={styles.lobbySummaryHeader}>
                <View style={styles.lobbyLiveDot} />
                <Text style={styles.lobbySummaryTitle}>
                  {t('Lobby Activity & Connected Players')}:
                </Text>
              </View>

              <View style={styles.lobbyConnectedPlayersList}>
                {lobbyPlayers.filter((p) => p.status === 'ready').map((player) => (
                  <View key={player.slot} style={styles.lobbyConnectedPlayerRow}>
                    {player.avatar ? (
                      <Image source={{ uri: player.avatar }} style={styles.lobbyConnectedAvatar} />
                    ) : (
                      <View style={styles.lobbyConnectedAvatarPlaceholder}>
                        <Text style={{ fontSize: 13 }}>{player.isHost ? '👑' : '👤'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.lobbyConnectedName} numberOfLines={1}>
                        {player.name} {player.isHost ? `(${t('Host')})` : `(${t('Player')} ${player.slot})`}
                      </Text>
                      <Text style={styles.lobbyConnectedSub}>
                        {player.isHost ? t('Created this room') : t('Joined via Game Code')}
                      </Text>
                    </View>
                    <View style={styles.lobbyOnlineBadge}>
                      <Text style={styles.lobbyOnlineBadgeText}>{t('In Lobby')} 🟢</Text>
                    </View>
                  </View>
                ))}

                {lobbyActivityNotice && !lobbyPlayers.some((p) => p.name === lobbyActivityNotice.name && p.status === 'ready') && (
                  <View style={styles.lobbyActivityNoticeRow}>
                    {lobbyActivityNotice.avatar ? (
                      <Image source={{ uri: lobbyActivityNotice.avatar }} style={styles.lobbyConnectedAvatar} />
                    ) : (
                      <View style={styles.lobbyConnectedAvatarPlaceholder}>
                        <Text style={{ fontSize: 13 }}>👤</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.lobbyConnectedName} numberOfLines={1}>
                        {lobbyActivityNotice.name}
                      </Text>
                      <Text style={styles.lobbyConnectedNoticeSub}>
                        {t('is in this lobby! Waiting to tap +')}
                      </Text>
                    </View>
                    <View style={styles.lobbyWaitingBadge}>
                      <Text style={styles.lobbyWaitingBadgeText}>⏳</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>





      {/* ================= MODAL 2.5: QUIT GAME FORFEIT CONFIRMATION ================= */}
      <Modal visible={quitConfirmModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.quitModalBox}>
            <Text style={styles.quitModalIcon}>⚠️</Text>
            <Text style={styles.quitModalTitle}>{t('Quit Game?')}</Text>
            <Text style={styles.quitModalDesc}>
              {t('If you leave the match now, your bet coins will be forfeited!')}
            </Text>
            <View style={styles.quitLossBadge}>
              <Image
                source={GREEN_COIN_IMG}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
              <Text style={styles.quitLossBadgeText}>
                -{selectedGame?.bet || 100} {t('Game Coins')}
              </Text>
            </View>
            <View style={styles.quitModalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.quitStayBtn}
                onPress={() => setQuitConfirmModalVisible(false)}
              >
                <Text style={styles.quitStayBtnText}>{t('Keep Playing')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.quitConfirmBtn}
                onPress={handleConfirmQuitGame}
              >
                <Text style={styles.quitConfirmBtnText}>
                  {t('Quit Game')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 3: INTERACTIVE GAME ARENAS (LUDO, DOMINOS, UNO) ================= */}
      <Modal visible={!!activeGameArena} transparent animationType="slide">
        <View style={styles.arenaBackdrop}>
          <View style={styles.arenaContainer}>
            {/* Arena Header */}
            <View style={styles.arenaHeader}>
              <Text style={styles.arenaTitle}>
                {activeGameArena === 'ludo' && '🎲 Ludo Battle'}
                {activeGameArena === 'snake_ladder' && '🐍🪜 Snakes & Ladders'}
                {activeGameArena === 'tictactoe' && '❌⭕ Tic Tac Toe (Zero Kata)'}
                {activeGameArena === 'carrom' && '🎯 Carrom Board Battle'}
                {activeGameArena === 'time_bomb' && '💣 Time Bomb Pass'}
                {activeGameArena === 'card_clash' && '🃏 High Card Clash'}
                {activeGameArena === 'dice_battle' && '🎲 Dice Battle'}
              </Text>
              <TouchableOpacity
                onPress={handleExitArenaPress}
                style={styles.arenaExitBtn}
              >
                <Text style={styles.arenaExitText}>{t('Exit Game')}</Text>
              </TouchableOpacity>
            </View>

            {/* ARENA 1: AUTHENTIC 15x15 LUDO BOARD & ENGINE */}
            {activeGameArena === 'ludo' && (
              <LudoGame
                playersCount={selectedPlayers || 2}
                currentUser={currentUser}
                gameMode={selectedGame?.mode || 'classic'}
                betAmount={matchBet}
                totalPot={matchTotalPot}
                playMode={playMode}
                lobbyPlayers={lobbyPlayers}
                forfeitedUserIds={forfeitedUserIds}
                socket={socketRef.current}
                roomCode={lobbyRoomCode}
                onWin={(game) => handleGameWin(game || 'Ludo')}
                onLoss={(game) => handleGameLoss(game || 'Ludo')}
                onDraw={(game) => handleGameDraw(game || 'Ludo')}
              />
            )}

            {/* ARENA: AUTHENTIC 10x10 SNAKES & LADDERS ARENA */}
            {activeGameArena === 'snake_ladder' && (
              <SnakeLadderGame
                playersCount={selectedPlayers || 2}
                currentUser={currentUser}
                gameMode={selectedGame?.mode || 'classic'}
                betAmount={matchBet}
                totalPot={matchTotalPot}
                playMode={playMode}
                lobbyPlayers={lobbyPlayers}
                forfeitedUserIds={forfeitedUserIds}
                socket={socketRef.current}
                roomCode={lobbyRoomCode}
                onWin={(game) => handleGameWin(game || 'Snake & Ladder')}
                onLoss={(game) => handleGameLoss(game || 'Snake & Ladder')}
                onDraw={(game) => handleGameDraw(game || 'Snake & Ladder')}
              />
            )}

            {/* ARENA: AUTHENTIC WOODEN CARROM BOARD ARENA */}
            {activeGameArena === 'carrom' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                <CarromGame
                  playersCount={selectedPlayers || 2}
                  currentUser={currentUser}
                  gameMode={selectedGame?.mode || 'classic'}
                  betAmount={matchBet}
                  totalPot={matchTotalPot}
                  playMode={playMode}
                  lobbyPlayers={lobbyPlayers}
                  forfeitedUserIds={forfeitedUserIds}
                  socket={socketRef.current}
                  roomCode={lobbyRoomCode}
                  onWin={(game) => handleGameWin(game || 'Carrom Board')}
                  onLoss={(game) => handleGameLoss(game || 'Carrom Board')}
                  onDraw={(game) => handleGameDraw(game || 'Carrom Board')}
                />
              </ScrollView>
            )}

            {/* ARENA: 3D HIGH ROLLER DICE BATTLE ARENA */}
            {activeGameArena === 'dice_battle' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <DiceBattleGame
                  playersCount={selectedPlayers || 2}
                  currentUser={currentUser}
                  gameMode={selectedGame?.mode || 'classic'}
                  betAmount={matchBet}
                  totalPot={matchTotalPot}
                  playMode={playMode}
                  lobbyPlayers={lobbyPlayers}
                  forfeitedUserIds={forfeitedUserIds}
                  socket={socketRef.current}
                  roomCode={lobbyRoomCode}
                  onWin={(game) => handleGameWin(game || 'Dice Battle')}
                  onLoss={(game) => handleGameLoss(game || 'Dice Battle')}
                  onDraw={(game) => handleGameDraw(game || 'Dice Battle')}
                />
              </ScrollView>
            )}

            {/* ARENA: ROYAL CASINO HIGH CARD CLASH ARENA */}
            {activeGameArena === 'card_clash' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <CardClashGame
                  playersCount={selectedPlayers || 2}
                  currentUser={currentUser}
                  gameMode={selectedGame?.mode || 'classic'}
                  betAmount={matchBet}
                  totalPot={matchTotalPot}
                  playMode={playMode}
                  lobbyPlayers={lobbyPlayers}
                  forfeitedUserIds={forfeitedUserIds}
                  socket={socketRef.current}
                  roomCode={lobbyRoomCode}
                  onWin={(game) => handleGameWin(game || 'High Card Clash')}
                  onLoss={(game) => handleGameLoss(game || 'High Card Clash')}
                  onDraw={(game) => handleGameDraw(game || 'High Card Clash')}
                />
              </ScrollView>
            )}

            {/* ARENA: TIME BOMB PASS ARENA */}
            {activeGameArena === 'time_bomb' && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <TimeBombGame
                  playersCount={selectedPlayers || 2}
                  currentUser={currentUser}
                  betAmount={matchBet}
                  totalPot={matchTotalPot}
                  playMode={playMode}
                  gameMode={selectedGame?.mode || 'classic'}
                  lobbyPlayers={lobbyPlayers}
                  socket={socketRef.current}
                  roomCode={lobbyRoomCode}
                  onPhaseChange={(phase) => setArenaGamePhase(phase)}
                  onWin={(game) => handleGameWin(game || 'Time Bomb')}
                  onLoss={(game) => handleGameLoss(game || 'Time Bomb')}
                  onDraw={(game) => handleGameDraw(game || 'Time Bomb')}
                />
              </ScrollView>
            )}

            {/* ARENA: NEON GLOW TIC TAC TOE (ZERO KATA) ARENA */}
            {activeGameArena === 'tictactoe' && (
              <TicTacToeGame
                playersCount={selectedPlayers || 2}
                currentUser={currentUser}
                gameMode={selectedGame?.mode || 'classic'}
                betAmount={matchBet}
                totalPot={matchTotalPot}
                playMode={playMode}
                lobbyPlayers={lobbyPlayers}
                forfeitedUserIds={forfeitedUserIds}
                socket={socketRef.current}
                roomCode={lobbyRoomCode}
                onWin={(game) => handleGameWin(game || 'Tic Tac Toe')}
                onLoss={(game) => handleGameLoss(game || 'Tic Tac Toe')}
                onDraw={(game) => handleGameDraw(game || 'Tic Tac Toe')}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Top Gaming Header
  gamingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  gameTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  gameTabItem: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    position: 'relative',
  },
  gameTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  gameTabTextActive: {
    color: '#00C853',
    fontWeight: '900',
  },
  gameTabUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#00C853',
    borderRadius: 2,
  },
  treasureBadgeWrap: {
    padding: 4,
  },
  treasureBadgeImg: {
    width: 38,
    height: 38,
  },

  // 2. User Currency Bar
  userCurrencyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  userAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#00C853',
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
  },
  walletCoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
  },
  gameCoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  coinIconImg: {
    width: 18,
    height: 18,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  gameCoinText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  coinChevron: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  shopIconWrap: {
    marginLeft: 'auto',
    padding: 4,
  },
  shopIconImg: {
    width: 30,
    height: 30,
  },

  // 3. Silver Treasure Chest Daily Claim
  silverChestRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  silverChestBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  silverChestImg: {
    width: 54,
    height: 54,
  },
  chestGetPill: {
    marginTop: -4,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00E676',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  chestGetGradient: {
    paddingVertical: 3,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chestGetText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // 4. Scroll Body & Game Containers
  gameScrollBody: {
    flex: 1,
  },
  gameScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gameTabContainer: {
    width: '100%',
  },

  // Banner
  gameBannerWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ludoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ludoTitleLetterL: { fontSize: 38, fontWeight: '900', color: '#EF4444' },
  ludoTitleLetterU: { fontSize: 38, fontWeight: '900', color: '#3B82F6' },
  ludoTitleLetterD: { fontSize: 38, fontWeight: '900', color: '#10B981' },
  ludoTitleLetterO: { fontSize: 38, fontWeight: '900', color: '#F59E0B' },
  ludoDiceIcon: { width: 34, height: 34, marginLeft: 6 },

  dominoesTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF9800',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },

  unoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unoCardDeco: {
    width: 24,
    height: 36,
    borderRadius: 4,
    transform: [{ rotate: '-12deg' }],
  },
  unoTitleText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#E53935',
    marginLeft: 8,
    fontStyle: 'italic',
  },

  betPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  betLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  betAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00C853',
  },
  betPillChevron: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00C853',
    marginLeft: 1,
  },
  betSubLimit: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },

  // Main Modes (1 ON 1 & 4 Players)
  mainModesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  mainModeCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#00C853',
    backgroundColor: '#FFFFFF',
    shadowColor: '#00C853',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  woodCardBorder: {
    borderColor: '#8D6E63',
  },
  modeCardVisual: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkBattleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  pkBadge: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pkText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    fontStyle: 'italic',
  },
  pkFourGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pkBadgeSmall: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginVertical: 2,
  },
  pkTextSmall: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    fontStyle: 'italic',
  },
  modeBtnWrap: {
    backgroundColor: '#00C853',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  woodModeBtnWrap: {
    backgroundColor: '#5D4037',
    paddingVertical: 10,
    alignItems: 'center',
  },
  woodModeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  miniCarromBoardVisual: {
    width: 44,
    height: 44,
    backgroundColor: '#EDD6B3',
    borderWidth: 2.5,
    borderColor: '#5D3A1A',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  miniCarromPocketTL: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#111827',
  },
  miniCarromPocketTR: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#111827',
  },
  miniCarromPocketBL: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#111827',
  },
  miniCarromPocketBR: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#111827',
  },
  miniCarromQueenCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carromStrikerVisual: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    borderWidth: 2.5,
    borderColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  carromStrikerCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carromPieceLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Domino Visuals
  dominoTileBox: {
    width: 36,
    height: 52,
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BCAAA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dominoDots: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D84315',
  },
  dominoTileMini: {
    width: 24,
    height: 36,
    backgroundColor: '#FFF8E1',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BCAAA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dominoDotsMini: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D84315',
  },

  // Bottom Mini Cards
  miniCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  miniCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCardTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },

  // Big UNO Card
  unoBigCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#FF9800',
  },
  unoCardVisual: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  unoCardsFan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unoFanCard: {
    width: 32,
    height: 50,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  unoFanNum: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  unoPlayNowBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  unoPlayNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // All Games Grid
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  allGamesGrid: {
    gap: 12,
  },
  allGameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allGameIconBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  allGameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  allGameSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00C853',
  },

  // MODAL SHARED STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCloseBtn: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },

  // Silver Chest Modal
  chestModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    alignItems: 'center',
  },
  chestModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  chestModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  chestModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  streakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 12,
  },
  streakDayBox: {
    width: '22%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  streakDayBoxActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#00C853',
    borderWidth: 1.5,
  },
  streakDayBoxClaimed: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  streakDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  streakCoinsCount: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00C853',
  },
  streakCheckMark: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 10,
    color: '#00C853',
    fontWeight: '900',
  },
  claimChestActionBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 14,
  },
  claimChestActionBtnDisabled: {
    opacity: 0.75,
  },
  claimChestActionGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  claimChestActionText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  // Bet Selection Modal
  betModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 390,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  betModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  betModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  betModalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  betModalBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  betModalBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  betModalBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  betModalBalanceValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00C853',
  },
  betGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  betCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  betCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#00C853',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  betSelectedBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    backgroundColor: '#00C853',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  betSelectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  betCardCoinImg: {
    width: 32,
    height: 32,
    marginBottom: 6,
  },
  betCardAmountText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1E293B',
  },
  betCardAmountTextSelected: {
    color: '#00C853',
  },
  betCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  betNoticeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },

  // Game Setup Modal
  setupModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  setupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  setupSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 8,
  },
  setupModeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupModeBadgeClassic: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  setupModeBadgeTurbo: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  setupModeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gameSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gameSelectOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  gameSelectOptionBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  gameSelectOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
  },
  gameSelectOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  gameSelectCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#4F46E5',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameSelectCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modeOptionBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#00C853',
  },
  modeOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 4,
  },
  modeOptionTextActive: {
    color: '#00C853',
  },
  modeOptionSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  playersToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  playerCountBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  playerCountBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#00C853',
  },
  playerCountText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#64748B',
  },
  playerCountTextActive: {
    color: '#00C853',
  },
  betSummaryBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 6,
  },
  betSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betSummaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  betSummaryValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#00C853',
  },
  insufficientWarningBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  insufficientWarningText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickChestBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  quickChestBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
  },
  startGameActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  startGameActionBtnDisabled: {
    opacity: 0.6,
  },
  startGameActionGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  startGameActionText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14.5,
  },
  joinGameCodeActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  joinGameCodeGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinGameCodeActionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },

  // Join Game with Code Modal Styles
  joinCodeModalBox: {
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  joinCodePromptText: {
    color: '#94A3B8',
    fontSize: 13.5,
    marginVertical: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  joinCodeInputField: {
    backgroundColor: '#0F0F1A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginBottom: 18,
  },
  verifyCodeActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  verifyCodeGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyCodeActionText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '900',
  },

  // Lobby Preview inside Join Modal
  lobbyPreviewBox: {
    backgroundColor: '#0F0F1A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  lobbyPreviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lobbyPreviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  lobbyPreviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyPreviewHostName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  lobbyPreviewSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  lobbyPreviewLiveBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  lobbyPreviewLiveBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
  },
  lobbyPreviewBetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E2D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E676',
    marginBottom: 8,
  },
  lobbyPreviewBetLabel: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '800',
  },
  lobbyPreviewBetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lobbyPreviewBetAmount: {
    color: '#00E676',
    fontSize: 15,
    fontWeight: '900',
  },
  lobbyPreviewBetCoins: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
  },
  lobbyPreviewNoticeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  lobbyPreviewNoticeTextError: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  lobbyPreviewNoticeSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  lobbyPreviewNoticeTextSuccess: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Active Waiting Lobbies Quick List
  activeLobbiesSection: {
    marginBottom: 16,
  },
  activeLobbiesHeader: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  activeLobbyQuickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 6,
  },
  activeLobbyHostName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activeLobbyDetails: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 1,
  },
  activeLobbyBetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  activeLobbyBetText: {
    color: '#00E676',
    fontSize: 11.5,
    fontWeight: '900',
  },

  // Local Match Lobby Modal Styles
  lobbyModalBox: {
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  lobbyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lobbyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  lobbyCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  lobbyCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: 4,
  },
  lobbyCodeLabel: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  lobbyCodeValue: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lobbyModeSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  lobbySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  lobbyStatusPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  lobbyStatusPillText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '800',
  },
  lobbyStakesCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lobbyStakesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lobbyStakeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  lobbyStakeLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  lobbyStakeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lobbyCoinIcon: {
    width: 18,
    height: 18,
  },
  lobbyTrophyEmoji: {
    fontSize: 16,
  },
  lobbyStakeAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FDE68A',
  },
  lobbyPotAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34D399',
  },
  lobbyStakeCurrency: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  lobbyStakeSubLabel: {
    fontSize: 9,
    color: '#FBBF24',
    fontWeight: '700',
    marginTop: 2,
  },
  lobbyPotSubLabel: {
    fontSize: 9,
    color: '#34D399',
    fontWeight: '700',
    marginTop: 2,
  },
  lobbyStakeDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lobbyPlayersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  lobbyPlayerCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#262638',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  lobbyPlayerCard4: {
    minWidth: '46%',
  },
  lobbyPlayerCardReady: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  lobbyPlayerCardWaiting: {
    borderColor: '#4B5563',
    borderStyle: 'dashed',
  },
  lobbyPlayerAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#1E1E2D',
    position: 'relative',
  },
  lobbyPlayerAvatarCircleEmpty: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  lobbyPlayerAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  lobbyPlusIcon: {
    fontSize: 26,
    color: '#818CF8',
    fontWeight: '900',
    lineHeight: 30,
  },
  lobbyHostCrownBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyRemovePlayerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbySlotTapHint: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },


  lobbyRequirementBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D97706',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  lobbyRequirementText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700',
  },
  lobbyStartActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  lobbyStartGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  lobbyStartActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  lobbyStartActionBtnDisabled: {
    backgroundColor: '#374151',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  lobbyStartActionTextDisabled: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  lobbyGuestWaitingBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  lobbyGuestWaitingText: {
    color: '#A5B4FC',
    fontSize: 13.5,
    fontWeight: '800',
  },
  lobbyCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  lobbyCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  lobbyJoinedSummaryBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  lobbySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  lobbyLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  lobbySummaryTitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lobbyConnectedPlayersList: {
    gap: 8,
  },
  lobbyConnectedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lobbyConnectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  lobbyConnectedAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyConnectedName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  lobbyConnectedSub: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '600',
  },
  lobbyOnlineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  lobbyOnlineBadgeText: {
    color: '#34D399',
    fontSize: 10.5,
    fontWeight: '800',
  },
  lobbyActivityNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  lobbyConnectedNoticeSub: {
    color: '#818CF8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  lobbyWaitingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lobbyWaitingBadgeText: {
    fontSize: 13,
  },

  // Game Arena Backdrops & Containers
  arenaBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  arenaContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '94%',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  arenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
    marginBottom: 8,
  },
  arenaTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  arenaExitBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  arenaExitText: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 12,
  },

  resultBanner: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  resultBannerWon: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#00C853',
  },
  resultBannerDraw: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: '#EAB308',
  },
  resultBannerLost: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  resultBannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  resultPlayAgainBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  resultPlayAgainText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // Ludo Arena
  ludoArenaBox: {
    alignItems: 'center',
  },
  ludoBoardView: {
    width: '100%',
  },
  ludoQuadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ludoQuad: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  ludoQuadTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  ludoTokenBox: {
    alignItems: 'center',
    marginTop: 6,
  },
  ludoPosText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    marginTop: 2,
  },
  ludoCenterDiceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ludoTurnIndicator: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  ludoDiceBtn: {
    width: 76,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C853',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ludoDiceEmoji: {
    fontSize: 34,
  },
  ludoDiceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00C853',
  },
  ludoDiceHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '600',
  },

  // UNO Arena
  unoArenaBox: {
    alignItems: 'center',
  },
  unoOpponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  unoOpponentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  unoCardBackMini: {
    width: 16,
    height: 24,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  unoDeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 18,
  },
  unoDrawDeckBtn: {
    width: 65,
    height: 95,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  unoDrawText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  unoDiscardCard: {
    width: 65,
    height: 95,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  unoDiscardValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  unoHandTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  unoHandList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  unoHandCard: {
    width: 52,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unoHandValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  // Dominos Arena
  dominoArenaBox: {
    width: '100%',
  },
  dominoArenaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
  },
  dominoBoardScroll: {
    backgroundColor: '#5D4037',
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
  },
  dominoBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dominoPlacedTile: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    padding: 6,
    alignItems: 'center',
    gap: 6,
  },
  dominoTileDots: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D84315',
  },
  dominoDivider: {
    width: 1.5,
    height: 18,
    backgroundColor: '#BCAAA4',
  },
  dominoHandTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
  },
  dominoHandRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  dominoHandTile: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#8D6E63',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dominoHandTileDots: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3E2723',
  },
  dominoHandDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#8D6E63',
  },

  // Open Silver Chest Reward Celebration Modal Styles
  openChestCelebrationCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    width: '88%',
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: '#00E676',
    shadowColor: '#00E676',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
  },
  openChestCloseIcon: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
  },
  openChestBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.16)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00E676',
    marginBottom: 6,
  },
  openChestBadgeText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '800',
  },
  openChestTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  openChestImgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  openChestImgLarge: {
    width: 200,
    height: 200,
  },
  rewardCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00E676',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 22,
    gap: 8,
    marginBottom: 8,
  },
  rewardCoinsValue: {
    color: '#00E676',
    fontSize: 26,
    fontWeight: '900',
  },
  rewardCoinsUnit: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  openChestSubtext: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  openChestNote: {
    color: '#94A3B8',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  collectBtnWrap: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  collectBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Quit Game Confirmation Modal Styles
  quitModalBox: {
    backgroundColor: '#1E1E2D',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    width: '85%',
    maxWidth: 360,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  quitModalIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  quitModalTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  quitModalDesc: {
    color: '#CBD5E1',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  quitLossBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 18,
  },
  quitLossBadgeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
  },
  quitModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  quitStayBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quitStayBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quitConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quitConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

});

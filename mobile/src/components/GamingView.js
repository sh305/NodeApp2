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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import LudoGame from './LudoGame';

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

  // Interactive In-App Game Modal (Playable arena)
  const [activeGameArena, setActiveGameArena] = useState(null); // 'ludo', 'dominos', 'uno'
  const [gameResult, setGameResult] = useState(null);
  const [quitConfirmModalVisible, setQuitConfirmModalVisible] = useState(false);
  const [dominoOpponentCount, setDominoOpponentCount] = useState(4);

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

    // Deduct bet from server
    try {
      const res = await api.post('/users/game/deduct-bet', {
        betAmount: selectedGame.bet,
        gameName: selectedGame.name,
      });
      if (res.data?.success) {
        setGameCoins(res.data.gameCoins);
      }
    } catch (err) {
      // If error, deduct locally
      setGameCoins((prev) => Math.max(0, prev - selectedGame.bet));
    }

    setSetupModalVisible(false);
    setGameResult(null);

    // Initialize specific game arena
    if (selectedGame.id === 'ludo' || selectedGame.id === 'marvel_ludo' || selectedGame.id === 'snake_ladder') {
      setLudoPlayerPos(0);
      setLudoOpponentPos(0);
      setLudoTurn('player');
      setActiveGameArena('ludo');
    } else if (selectedGame.id === 'dominos') {
      setDominoScore({ player: 0, opponent: 0 });
      setDominoOpponentCount(4);
      setActiveGameArena('dominos');
    } else if (selectedGame.id === 'uno') {
      setUnoTurn('player');
      setUnoOpponentCount(5);
      setActiveGameArena('uno');
    }
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
    const bet = selectedGame?.bet || 100;
    const players = selectedPlayers || 2;
    const totalPot = bet * players; // Exact total coins pool from all players!

    try {
      const res = await api.post('/users/game/award-win', {
        winAmount: totalPot,
        gameName: selectedGame?.name || gameName,
      });
      if (res.data?.success) {
        setGameCoins(res.data.gameCoins);
        showToast(
          `${t('Victory!')} ${t('You won')} +${totalPot} ${t('Game Coins!')} 🏆🎉`,
          'success'
        );
        return;
      }
    } catch (err) {
      setGameCoins((prev) => prev + totalPot);
    }

    showToast(
      `${t('Victory!')} ${t('You won')} +${totalPot} ${t('Game Coins!')} 🏆🎉`,
      'success'
    );
  };

  // Loss Handler: Confirms loss & logs deduction
  const handleGameLoss = async (gameName) => {
    setGameResult('lost');
    const bet = selectedGame?.bet || 100;
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
  };

  // Arena Exit Handler: Warns if game is in progress
  const handleExitArenaPress = () => {
    if (gameResult) {
      setActiveGameArena(null);
    } else {
      setQuitConfirmModalVisible(true);
    }
  };

  // Confirm Quit Mid-Game: Forfeits the bet coins
  const handleConfirmQuitGame = async () => {
    setQuitConfirmModalVisible(false);
    const bet = selectedGame?.bet || 100;
    try {
      await api.post('/users/game/forfeit', {
        betAmount: bet,
        gameName: selectedGame?.name || 'Game',
        reason: 'quit',
      });
    } catch (e) {
      // Handled silently
    }
    setActiveGameArena(null);
    showToast(
      `${t('Match forfeited!')} -${bet} ${t('Game Coins deducted.')}`,
      'error'
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP GAMING HEADER: Ludo, Dominos, UNO, Games + Top Right Treasure Icon */}
      <View style={[styles.gamingHeader, { paddingTop: Math.max(16, insets.top) }]}>
        <View style={styles.gameTabsRow}>
          {['Ludo', 'Dominos', 'UNO', 'Games'].map((tab) => {
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
        </View>

        {/* Top Right Calendar Daily Streak Icon (Directly after Games tab) */}
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
          onPress={() =>
            showToast(
              t(`Main Wallet Coins: ${walletCoins} 🪙. (Use Game Coins to play games)`),
              'info'
            )
          }
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
              {/* Bets Pill */}
              <View style={styles.betPill}>
                <Text style={styles.betLabel}>{t('BETS')}</Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>100</Text>
              </View>
            </View>

            {/* Main Mode Cards: 1 ON 1 & 4 Players */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 (2 Players) */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.mainModeCard}
                onPress={() => openGameSetup('ludo', 'Ludo', '1on1', 100, 2)}
              >
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <Text style={{ fontSize: 44 }}>👑</Text>
                    <View style={styles.pkBadge}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>
                    <Text style={{ fontSize: 44 }}>👑</Text>
                  </View>
                </LinearGradient>
                <View style={styles.modeBtnWrap}>
                  <Text style={styles.modeBtnText}>{t('1 ON 1')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 4 Players */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.mainModeCard}
                onPress={() => openGameSetup('ludo', 'Ludo', '4players', 100, 4)}
              >
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkFourGrid}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Text style={{ fontSize: 28 }}>👑</Text>
                      <Text style={{ fontSize: 28 }}>👑</Text>
                    </View>
                    <View style={styles.pkBadgeSmall}>
                      <Text style={styles.pkTextSmall}>PK</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Text style={{ fontSize: 28 }}>👑</Text>
                      <Text style={{ fontSize: 28 }}>👑</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={styles.modeBtnWrap}>
                  <Text style={styles.modeBtnText}>{t('4 Players')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bottom Mini Game Cards: Marvel Ludo, Snake & Ladder, Ludo Coin */}
            <View style={styles.miniCardsRow}>
              {/* Mini Card 1: Marvel Ludo */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.miniCard, { backgroundColor: '#4F46E5' }]}
                onPress={() => openGameSetup('marvel_ludo', 'Marvel Ludo', 'voice', 100, 4)}
              >
                <Text style={{ fontSize: 26, alignSelf: 'center' }}>🎙️🎲</Text>
                <Text style={styles.miniCardTitle}>{t('Marvel Ludo')}</Text>
              </TouchableOpacity>

              {/* Mini Card 2: Snake & Ladder */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.miniCard, { backgroundColor: '#7C3AED' }]}
                onPress={() => openGameSetup('snake_ladder', 'Snake & Ladder', 'classic', 100, 2)}
              >
                <Text style={{ fontSize: 26, alignSelf: 'center' }}>🐍🪜</Text>
                <Text style={styles.miniCardTitle}>{t('Snake&Ladder')}</Text>
              </TouchableOpacity>

              {/* Mini Card 3: Ludo Coin */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.miniCard, { backgroundColor: '#2563EB' }]}
                onPress={() => openGameSetup('ludo', 'Ludo Coin', 'coin', 100, 2)}
              >
                <Text style={{ fontSize: 26, alignSelf: 'center' }}>🪙🎯</Text>
                <Text style={styles.miniCardTitle}>{t('Ludo Coin')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= 4.2 DOMINOS TAB ================= */}
        {activeGameTab === 'Dominos' && (
          <View style={styles.gameTabContainer}>
            {/* 3D Dominoes Logo Banner */}
            <View style={styles.gameBannerWrap}>
              <Text style={styles.dominoesTitle}>Dominoes</Text>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}>{t('BETS')}</Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>{t('5/Point')}</Text>
              </View>
              <Text style={styles.betSubLimit}>{t('200 Limits/Round')}</Text>
            </View>

            {/* Wooden Domino Cards: 1 ON 1 & 4 Players */}
            <View style={styles.mainModesRow}>
              {/* Card 1: 1 ON 1 Dominoes */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, styles.woodCardBorder]}
                onPress={() => openGameSetup('dominos', 'Dominos', '1on1', 50, 2)}
              >
                <LinearGradient
                  colors={['#8D6E63', '#6D4C41', '#4E342E']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkBattleRow}>
                    <View style={styles.dominoTileBox}>
                      <Text style={styles.dominoDots}>::</Text>
                    </View>
                    <View style={styles.pkBadge}>
                      <Text style={styles.pkText}>PK</Text>
                    </View>
                    <View style={styles.dominoTileBox}>
                      <Text style={styles.dominoDots}>:·:</Text>
                    </View>
                  </View>
                </LinearGradient>
                <View style={styles.woodModeBtnWrap}>
                  <Text style={styles.woodModeBtnText}>{t('1 ON 1')}</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: 4 Players Dominoes */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.mainModeCard, styles.woodCardBorder]}
                onPress={() => openGameSetup('dominos', 'Dominos', '4players', 50, 4)}
              >
                <LinearGradient
                  colors={['#8D6E63', '#6D4C41', '#4E342E']}
                  style={styles.modeCardVisual}
                >
                  <View style={styles.pkFourGrid}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={styles.dominoTileMini}><Text style={styles.dominoDotsMini}>::</Text></View>
                      <View style={styles.dominoTileMini}><Text style={styles.dominoDotsMini}>:·:</Text></View>
                    </View>
                    <View style={styles.pkBadgeSmall}>
                      <Text style={styles.pkTextSmall}>PK</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={styles.dominoTileMini}><Text style={styles.dominoDotsMini}>:::</Text></View>
                      <View style={styles.dominoTileMini}><Text style={styles.dominoDotsMini}>·</Text></View>
                    </View>
                  </View>
                </LinearGradient>
                <View style={styles.woodModeBtnWrap}>
                  <Text style={styles.woodModeBtnText}>{t('4 Players')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= 4.3 UNO TAB ================= */}
        {activeGameTab === 'UNO' && (
          <View style={styles.gameTabContainer}>
            {/* 3D UNO Logo Banner */}
            <View style={styles.gameBannerWrap}>
              <View style={styles.unoTitleRow}>
                <View style={[styles.unoCardDeco, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.unoCardDeco, { backgroundColor: '#3B82F6', marginLeft: -8 }]} />
                <View style={[styles.unoCardDeco, { backgroundColor: '#10B981', marginLeft: -8 }]} />
                <Text style={styles.unoTitleText}>UNO</Text>
              </View>
              <View style={styles.betPill}>
                <Text style={styles.betLabel}>{t('BETS')}</Text>
                <Image
                  source={GREEN_COIN_IMG}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
                <Text style={styles.betAmount}>100</Text>
              </View>
            </View>

            {/* Big UNO Wooden Deck Card with "Play Now" button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.unoBigCard}
              onPress={() => openGameSetup('uno', 'UNO', 'classic', 100, 4)}
            >
              <LinearGradient
                colors={['#8D6E63', '#6D4C41', '#4E342E']}
                style={styles.unoCardVisual}
              >
                {/* Fan of UNO cards */}
                <View style={styles.unoCardsFan}>
                  {[
                    { bg: '#EF4444', num: '4' },
                    { bg: '#10B981', num: '7' },
                    { bg: '#3B82F6', num: '9' },
                    { bg: '#F59E0B', num: '1' },
                    { bg: '#EF4444', num: '8' },
                    { bg: '#3B82F6', num: '5' },
                    { bg: '#10B981', num: '6' },
                    { bg: '#F59E0B', num: '4' },
                  ].map((card, i) => (
                    <View
                      key={i}
                      style={[
                        styles.unoFanCard,
                        {
                          backgroundColor: card.bg,
                          marginLeft: i === 0 ? 0 : -14,
                          transform: [{ rotate: `${(i - 3.5) * 4}deg` }],
                        },
                      ]}
                    >
                      <Text style={styles.unoFanNum}>{card.num}</Text>
                    </View>
                  ))}
                </View>

                {/* Big Orange "Play Now" Button */}
                <LinearGradient
                  colors={['#FF9100', '#FF6D00']}
                  style={styles.unoPlayNowBtn}
                >
                  <Text style={styles.unoPlayNowText}>{t('Play Now')}</Text>
                </LinearGradient>
              </LinearGradient>
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
                { id: 'Dominos', name: 'Dominoes', icon: '🁢', color: '#795548' },
                { id: 'UNO', name: 'UNO Cards', icon: '🃏', color: '#E53935' },
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

            {/* Mode Selector: Online vs Local */}
            <Text style={styles.setupSectionLabel}>{t('Select Play Mode')}:</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.modeOptionBtn,
                  playMode === 'online' && styles.modeOptionBtnActive,
                ]}
                onPress={() => setPlayMode('online')}
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

            {/* Players Count Selector */}
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
                  {playMode === 'online' ? t('Find Match & Play 🎮') : t('Start Local Game 🎮')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
                {activeGameArena === 'dominos' && '🁢 Dominoes Match'}
                {activeGameArena === 'uno' && '🃏 UNO Arena'}
              </Text>
              <TouchableOpacity
                onPress={handleExitArenaPress}
                style={styles.arenaExitBtn}
              >
                <Text style={styles.arenaExitText}>{t('Exit Game')}</Text>
              </TouchableOpacity>
            </View>

            {/* Win / Loss Celebratory Banner */}
            {gameResult && (
              <View style={[styles.resultBanner, gameResult === 'won' ? styles.resultBannerWon : styles.resultBannerLost]}>
                <Text style={[styles.resultBannerTitle, gameResult === 'lost' && { color: '#DC2626' }]}>
                  {gameResult === 'won'
                    ? `${t('VICTORY! 🏆')} +${(selectedGame?.bet || 100) * (selectedPlayers || 2)} ${t('Game Coins!')}`
                    : `${t('DEFEAT 😢')} -${selectedGame?.bet || 100} ${t('Game Coins deducted.')}`}
                </Text>
                <TouchableOpacity
                  style={[styles.resultPlayAgainBtn, gameResult === 'lost' && { backgroundColor: '#EF4444' }]}
                  onPress={() => setActiveGameArena(null)}
                >
                  <Text style={styles.resultPlayAgainText}>{t('Done')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ARENA 1: AUTHENTIC 15x15 LUDO BOARD & ENGINE */}
            {activeGameArena === 'ludo' && (
              <LudoGame
                playersCount={selectedPlayers || 2}
                currentUser={currentUser}
                betAmount={selectedGame?.bet || 100}
                onWin={(game) => handleGameWin(game || 'Ludo')}
                onLoss={(game) => handleGameLoss(game || 'Ludo')}
              />
            )}

            {/* ARENA 2: UNO ARENA */}
            {activeGameArena === 'uno' && (
              <View style={styles.unoArenaBox}>
                {/* Opponent Area */}
                <View style={styles.unoOpponentRow}>
                  <Text style={styles.unoOpponentLabel}>
                    🤖 {t('Opponent Cards')}: {unoOpponentCount}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {Array.from({ length: Math.min(unoOpponentCount, 6) }).map((_, i) => (
                      <View key={i} style={styles.unoCardBackMini} />
                    ))}
                  </View>
                </View>

                {/* Discard & Draw Deck */}
                <View style={styles.unoDeckRow}>
                  <TouchableOpacity
                    style={styles.unoDrawDeckBtn}
                    onPress={handleDrawUnoCard}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.unoDrawText}>🃏 {t('Draw')}</Text>
                  </TouchableOpacity>

                  <View style={[styles.unoDiscardCard, { backgroundColor: unoDiscardTop.color }]}>
                    <Text style={styles.unoDiscardValue}>{unoDiscardTop.value}</Text>
                  </View>
                </View>

                {/* Player's Hand of Cards */}
                <Text style={styles.unoHandTitle}>{t('Your Cards (Tap to Play)')}:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unoHandList}>
                  {unoPlayerCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.unoHandCard, { backgroundColor: card.color }]}
                      activeOpacity={0.8}
                      onPress={() => handlePlayUnoCard(card)}
                    >
                      <Text style={styles.unoHandValue}>{card.value}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ARENA 3: DOMINOS ARENA */}
            {activeGameArena === 'dominos' && (
              <View style={styles.dominoArenaBox}>
                <Text style={styles.dominoArenaTitle}>{t('Dominoes Board')}</Text>
                {/* Board Tiles Line */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dominoBoardScroll}>
                  <View style={styles.dominoBoardRow}>
                    {dominoBoardLine.map((tItem, idx) => (
                      <View key={idx} style={styles.dominoPlacedTile}>
                        <Text style={styles.dominoTileDots}>{tItem.left}</Text>
                        <View style={styles.dominoDivider} />
                        <Text style={styles.dominoTileDots}>{tItem.right}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Player's Hand */}
                <Text style={styles.dominoHandTitle}>{t('Your Tiles (Tap matching tile)')}:</Text>
                <View style={styles.dominoHandRow}>
                  {dominoPlayerHand.map((tile) => (
                    <TouchableOpacity
                      key={tile.id}
                      style={styles.dominoHandTile}
                      activeOpacity={0.8}
                      onPress={() => handlePlayDominoTile(tile)}
                    >
                      <Text style={styles.dominoHandTileDots}>{tile.left}</Text>
                      <View style={styles.dominoHandDivider} />
                      <Text style={styles.dominoHandTileDots}>{tile.right}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    gap: 16,
  },
  gameTabItem: {
    paddingVertical: 4,
    position: 'relative',
  },
  gameTabText: {
    fontSize: 20,
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

  // Game Arena Backdrops & Containers
  arenaBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  arenaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    padding: 18,
  },
  arenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  arenaTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  arenaExitBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  arenaExitText: {
    color: '#DC2626',
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

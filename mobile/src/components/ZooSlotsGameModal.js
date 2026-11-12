import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Platform,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import { ShinyCoinIcon } from './FoodIcons';
import {
  GoldenPawIcon,
  LionIcon,
  TigerIcon,
  PandaIcon,
  ElephantIcon,
  MonkeyIcon,
  BananaIcon,
  BambooSignIcon,
} from './ZooSlotIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 7 Zoo Slot Symbols Configuration
const ZOO_SYMBOLS = [
  { id: 'wild_paw', name: 'Golden Paw', multiplier: 500, icon: GoldenPawIcon, isWild: true, emoji: '🐾', color: '#F59E0B' },
  { id: 'lion', name: 'Lion King', multiplier: 250, icon: LionIcon, emoji: '🦁', color: '#EAB308' },
  { id: 'tiger', name: 'Tiger Cub', multiplier: 100, icon: TigerIcon, emoji: '🐯', color: '#F97316' },
  { id: 'panda', name: 'Bamboo Panda', multiplier: 50, icon: PandaIcon, emoji: '🐼', color: '#10B981' },
  { id: 'elephant', name: 'Lucky Elephant', multiplier: 25, icon: ElephantIcon, emoji: '🐘', color: '#3B82F6' },
  { id: 'monkey', name: 'Playful Monkey', multiplier: 15, icon: MonkeyIcon, emoji: '🐵', color: '#D97706' },
  { id: 'banana', name: 'Golden Bananas', multiplier: 8, icon: BananaIcon, emoji: '🍌', color: '#FDE047' },
];

const BET_CHIPS = [10, 50, 100, 1000, 10000];

export default function ZooSlotsGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Balance & Stats
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [recentWinners, setRecentWinners] = useState([
    'wild_paw',
    'lion',
    'panda',
    'tiger',
    'monkey',
    'elephant',
    'banana',
    'lion',
  ]);

  // Betting & Spin State
  const [selectedChip, setSelectedChip] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoSpinRef = useRef(false);
  autoSpinRef.current = autoSpin;

  // 3 Reel States
  const [reel1, setReel1] = useState('lion');
  const [reel2, setReel2] = useState('tiger');
  const [reel3, setReel3] = useState('panda');

  // Dynamic Mystery Events
  const [isRespinning, setIsRespinning] = useState(false);
  const [wildBoostActive, setWildBoostActive] = useState(1);
  const [winResult, setWinResult] = useState(null);
  const [paytableVisible, setPaytableVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Animations
  const reel1Anim = useRef(new Animated.Value(0)).current;
  const reel2Anim = useRef(new Animated.Value(0)).current;
  const reel3Anim = useRef(new Animated.Value(0)).current;
  const respinBannerAnim = useRef(new Animated.Value(0)).current;
  const jackpotGlowAnim = useRef(new Animated.Value(0)).current;

  // Sync coins from currentUser prop
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state from backend
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/zoo-slots/state');
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
      // Graceful fallback to prop coins
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
      setAutoSpin(false);
      setIsSpinning(false);
      setIsRespinning(false);
      setWinResult(null);
    }
  }, [visible, fetchGameState]);

  // Helper: Get symbol object by ID
  const getSymbol = (id) => ZOO_SYMBOLS.find((s) => s.id === id) || ZOO_SYMBOLS[0];

  // Helper: Get random symbol ID for reel spin blur
  const getRandomSymbolId = () => {
    const idx = Math.floor(Math.random() * ZOO_SYMBOLS.length);
    return ZOO_SYMBOLS[idx].id;
  };

  // Perform Spin
  const handleSpin = useCallback(async () => {
    if (isSpinning) return;

    if (userCoins < selectedChip) {
      showToast(t('Insufficient coins balance. Please recharge first.'), 'error');
      setAutoSpin(false);
      return;
    }

    try {
      setIsSpinning(true);
      setWinResult(null);
      setIsRespinning(false);
      setWildBoostActive(1);

      // Fast rolling simulation loop
      const spinInterval = setInterval(() => {
        setReel1(getRandomSymbolId());
        setReel2(getRandomSymbolId());
        setReel3(getRandomSymbolId());
      }, 70);

      // Call backend to calculate outcome atomically
      const res = await api.post('/games/zoo-slots/spin', { betAmount: selectedChip });
      if (!res.data?.success) {
        clearInterval(spinInterval);
        showToast(t(res.data?.message || 'Failed to spin Zoo Slots'), 'error');
        setIsSpinning(false);
        setAutoSpin(false);
        return;
      }

      const {
        initialReels,
        reels: finalReels,
        respinTriggered,
        wildBoost,
        multiplier,
        wonCoins,
        remainingCoins,
        todayEarnings: newTodayEarnings,
        recentWinners: newHistory,
      } = res.data;

      // Update local balance immediately
      setUserCoins(remainingCoins);
      onCoinBalanceUpdate?.(remainingCoins);
      if (newTodayEarnings !== undefined) {
        setTodayEarnings(newTodayEarnings);
      }

      // Reel 1 Stops (after 600ms)
      setTimeout(() => {
        setReel1(initialReels ? initialReels[0] : finalReels[0]);
        if (soundEnabled && Platform.OS === 'android') Vibration.vibrate(10);
      }, 600);

      // Reel 2 Stops (after 1000ms)
      setTimeout(() => {
        setReel2(initialReels ? initialReels[1] : finalReels[1]);
        if (soundEnabled && Platform.OS === 'android') Vibration.vibrate(10);
      }, 1000);

      // Reel 3 Stops (after 1500ms)
      setTimeout(() => {
        clearInterval(spinInterval);
        const stopReel3 = initialReels ? initialReels[2] : finalReels[2];
        setReel3(stopReel3);

        if (respinTriggered) {
          // 🎋 Dynamic Bamboo Respin Triggered!
          setIsRespinning(true);
          Animated.sequence([
            Animated.timing(respinBannerAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(respinBannerAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
            Animated.timing(respinBannerAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          ]).start();

          if (soundEnabled && Platform.OS === 'android') {
            Vibration.vibrate([0, 50, 50, 100]);
          }

          // Respin Reel 3
          let respinCount = 0;
          const respinInterval = setInterval(() => {
            setReel3(getRandomSymbolId());
            respinCount++;
            if (respinCount > 10) {
              clearInterval(respinInterval);
              setReel3(finalReels[2]);
              setIsRespinning(false);
              finalizeSpinResult(finalReels, multiplier, wonCoins, wildBoost, newHistory);
            }
          }, 80);
        } else {
          finalizeSpinResult(finalReels, multiplier, wonCoins, wildBoost, newHistory);
        }
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Spin error. Please try again.';
      showToast(t(msg), 'error');
      setIsSpinning(false);
      setAutoSpin(false);
    }
  }, [isSpinning, userCoins, selectedChip, t, showToast, onCoinBalanceUpdate, soundEnabled, respinBannerAnim]);

  // Finalize Spin Outcome
  const finalizeSpinResult = (finalReels, multiplier, wonCoins, wildBoost, newHistory) => {
    setIsSpinning(false);

    if (newHistory && newHistory.length > 0) {
      setRecentWinners(newHistory);
    } else {
      let outcome = 'banana';
      if (multiplier > 0) {
        outcome = finalReels.find((s) => s !== 'wild_paw') || 'wild_paw';
      } else {
        outcome = finalReels[1] || finalReels[0];
      }
      setRecentWinners((prev) => [outcome, ...prev.slice(0, 9)]);
    }

    if (wildBoost > 1) {
      setWildBoostActive(wildBoost);
    }

    if (multiplier > 0) {
      const isJackpot = multiplier >= 100;
      setWinResult({
        multiplier,
        wonCoins,
        isJackpot,
        symbols: finalReels.map((id) => getSymbol(id)),
      });

      if (isJackpot) {
        Animated.sequence([
          Animated.timing(jackpotGlowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(jackpotGlowAnim, { toValue: 0.5, duration: 300, useNativeDriver: true }),
          Animated.timing(jackpotGlowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }

      if (soundEnabled && Platform.OS === 'android') {
        Vibration.vibrate([0, 100, 50, 200]);
      }
    }

    // Handle Auto Spin delay
    if (autoSpinRef.current) {
      setTimeout(() => {
        if (autoSpinRef.current) {
          handleSpin();
        }
      }, multiplier > 0 ? 2500 : 800);
    }
  };

  // Toggle Auto Spin
  const toggleAutoSpin = () => {
    if (autoSpin) {
      setAutoSpin(false);
      showToast(t('Auto Spin Disabled'), 'info');
    } else {
      setAutoSpin(true);
      showToast(t('Auto Spin Activated!'), 'success');
      if (!isSpinning) {
        handleSpin();
      }
    }
  };

  // Select Max Affordable Bet
  const handleMaxBet = () => {
    if (isSpinning) return;
    const affordable = [...BET_CHIPS].reverse().find((chip) => userCoins >= chip) || BET_CHIPS[0];
    setSelectedChip(affordable);
    showToast(`${t('Max Bet Set')}: ${affordable.toLocaleString()} 🪙`, 'info');
  };

  if (!visible) return null;

  const Symbol1 = getSymbol(reel1).icon;
  const Symbol2 = getSymbol(reel2).icon;
  const Symbol3 = getSymbol(reel3).icon;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setAutoSpin(false);
        onClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.container, { paddingTop: Math.max(12, insets.top) }]}>
          {/* ══ HEADER BAR ══ */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <BambooSignIcon size={34} />
              </View>
              <View style={styles.headerTextGroup}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>
                    <T>Zoo Slots</T>
                  </Text>
                  <View style={styles.wildBadge}>
                    <Text style={styles.wildBadgeText}>500X WILD</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>
                  <T>Wild Animal Reels • Bamboo Respins</T>
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Paytable / Info Button */}
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.75}
                onPress={() => setPaytableVisible(true)}
              >
                <Text style={styles.iconBtnText}>📜</Text>
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
                onPress={() => {
                  setAutoSpin(false);
                  onClose();
                }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ BALANCE & STATS BAR ══ */}
          <View style={styles.statsBar}>
            <View style={styles.coinBalanceBox}>
              <ShinyCoinIcon size={20} />
              <Text style={styles.coinBalanceText}>{userCoins.toLocaleString()}</Text>
              <TouchableOpacity
                style={styles.rechargeBtn}
                activeOpacity={0.8}
                onPress={onRechargePress}
              >
                <Text style={styles.rechargeBtnText}>+ <T>Recharge</T></Text>
              </TouchableOpacity>
            </View>

            <View style={styles.todayEarningsBox}>
              <Text style={styles.earningsLabel}><T>Today Won</T>:</Text>
              <Text style={styles.earningsValue}>+{todayEarnings.toLocaleString()}</Text>
            </View>
          </View>

          {/* ══ 3 REELS JUNGLE DISPLAY WINDOW ══ */}
          <View style={styles.slotWindowArea}>
            <LinearGradient
              colors={['#062E1C', '#0B4228', '#021B0F']}
              style={styles.slotWindowGradient}
            >
              {/* Top Tropical Banner / Status Bar */}
              <View style={styles.topStatusStrip}>
                {isRespinning ? (
                  <Animated.View style={[styles.bambooRespinBanner, { transform: [{ scale: respinBannerAnim }] }]}>
                    <Text style={styles.bambooRespinText}>🎋 BAMBOO RESPIN! 🎋</Text>
                  </Animated.View>
                ) : wildBoostActive > 1 ? (
                  <View style={styles.wildBoostBanner}>
                    <Text style={styles.wildBoostText}>🐾 {wildBoostActive}X PAW BOOST! 🐾</Text>
                  </View>
                ) : (
                  <View style={styles.regularStatusPill}>
                    <Text style={styles.regularStatusText}>🌴 JUNGLE JACKPOT: 500X 🌴</Text>
                  </View>
                )}
              </View>

              {/* 3 Reel Columns */}
              <View style={styles.reelsRow}>
                {/* Reel 1 */}
                <View style={styles.reelColumn}>
                  <LinearGradient
                    colors={['#0F3822', '#14532D', '#092516']}
                    style={styles.reelCellGradient}
                  >
                    <Symbol1 size={56} />
                    <Text style={styles.reelSymbolName} numberOfLines={1}>{getSymbol(reel1).name}</Text>
                  </LinearGradient>
                </View>

                {/* Reel 2 */}
                <View style={styles.reelColumn}>
                  <LinearGradient
                    colors={['#0F3822', '#14532D', '#092516']}
                    style={styles.reelCellGradient}
                  >
                    <Symbol2 size={56} />
                    <Text style={styles.reelSymbolName} numberOfLines={1}>{getSymbol(reel2).name}</Text>
                  </LinearGradient>
                </View>

                {/* Reel 3 (Dynamic Respin Target) */}
                <View style={[styles.reelColumn, isRespinning && styles.reelColumnRespin]}>
                  <LinearGradient
                    colors={isRespinning ? ['#78350F', '#B45309', '#451A03'] : ['#0F3822', '#14532D', '#092516']}
                    style={styles.reelCellGradient}
                  >
                    <Symbol3 size={56} />
                    <Text style={styles.reelSymbolName} numberOfLines={1}>{getSymbol(reel3).name}</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Center Payline Indicator Laser Beam */}
              <View style={styles.paylineBeam} />
            </LinearGradient>
          </View>

          {/* ══ RECENT SPINS / WINNERS HISTORY RECORD ══ */}
          <View style={styles.historyContainer}>
            <Text style={styles.historyLabel}><T>Recent</T>:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {recentWinners.map((item, index) => {
                const symId = typeof item === 'object' ? item.symbolId || item.id : item;
                const s = ZOO_SYMBOLS.find((c) => c.id === symId);
                if (!s) return null;
                const IconComp = s.icon;
                const isLatest = index === 0;
                return (
                  <View
                    key={`${symId}-${index}`}
                    style={[
                      styles.historyBadge,
                      { borderColor: s.color },
                      isLatest && styles.historyBadgeLatest,
                    ]}
                  >
                    <View style={styles.historyBadgeIconWrap}>
                      <IconComp size={20} />
                    </View>
                    <View style={styles.historyBadgeInfo}>
                      <Text style={styles.historyBadgeName} numberOfLines={1}>
                        {s.name.replace('Golden ', '').replace('Bamboo ', '').replace('Lucky ', '').replace('Playful ', '')}
                      </Text>
                      <Text style={[styles.historyBadgeMult, { color: s.color }]}>
                        {s.multiplier}X
                      </Text>
                    </View>
                    {isLatest && <View style={styles.latestDot} />}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ MINI QUICK PAYTABLE PREVIEW ══ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.paytableStrip}
            contentContainerStyle={styles.paytableStripContent}
          >
            {ZOO_SYMBOLS.map((s) => {
              const IconComp = s.icon;
              return (
                <View key={s.id} style={[styles.miniPayCard, { borderColor: s.color }]}>
                  <IconComp size={24} />
                  <Text style={styles.miniPayMultiplier}>{s.multiplier}X</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* ══ BET CHIPS & CONTROL FOOTER ══ */}
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
            {/* Chips Selector Row */}
            <View style={styles.chipsRow}>
              {BET_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.chipBtn,
                    selectedChip === chip && styles.chipBtnSelected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedChip(chip)}
                  disabled={isSpinning}
                >
                  <ShinyCoinIcon size={14} />
                  <Text style={[styles.chipText, selectedChip === chip && styles.chipBtnSelected && styles.chipTextSelected]}>
                    {chip >= 1000 ? `${chip / 1000}K` : chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Spin Button */}
            <View style={styles.actionsRow}>
              {/* Main Emerald Spin Button */}
              <TouchableOpacity
                style={[
                  styles.spinBtn,
                  { flex: 1 },
                  isSpinning && styles.spinBtnDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleSpin}
                disabled={isSpinning}
              >
                <LinearGradient
                  colors={isSpinning ? ['#475569', '#334155'] : ['#15803D', '#16A34A', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.spinGradient}
                >
                  <Text style={styles.spinBtnText}>
                    {isSpinning ? (
                      `🌀 ${t('SPINNING...')}`
                    ) : (
                      `🎰 ${t('SPIN')} (${selectedChip.toLocaleString()} 🪙)`
                    )}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ PAYTABLE & RULES MODAL ══ */}
        <Modal
          visible={paytableVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPaytableVisible(false)}
        >
          <View style={styles.rulesBackdrop}>
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>🦁 <T>Zoo Slots Paytable & Rules</T></Text>
              <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.rulesSubheading}>🐾 <T>Dynamic Special Features</T>:</Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>Golden Paw (WILD)</Text>: Substitutes for ANY animal! When it lands on a winning line, it can trigger a random <Text style={{ color: '#FEF08A', fontWeight: 'bold' }}>2X or 3X Paw Multiplier Boost</Text>!
                </Text>
                <Text style={styles.rulesText}>
                  • <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Bamboo Respin</Text>: If Reel 1 and Reel 2 match, Reel 3 can trigger a free Bamboo Respin to give you a second chance at the jackpot!
                </Text>

                <Text style={styles.rulesSubheading}>🏆 <T>3-Line Payouts</T>:</Text>
                {ZOO_SYMBOLS.map((s) => {
                  const IconComp = s.icon;
                  return (
                    <View key={s.id} style={styles.paytableItemRow}>
                      <View style={styles.paytableItemLeft}>
                        <IconComp size={30} />
                        <Text style={styles.paytableItemName}>{s.name} {s.isWild ? '(WILD)' : ''}</Text>
                      </View>
                      <Text style={[styles.paytableItemMult, { color: s.color }]}>{s.multiplier}X</Text>
                    </View>
                  );
                })}

                <Text style={styles.rulesSubheading}>⭐ <T>Special Combinations</T>:</Text>
                <Text style={styles.rulesSubItem}>• Any 2 Golden Paws: <Text style={{ color: '#FEF08A' }}>10X</Text></Text>
                <Text style={styles.rulesSubItem}>• Any 1 Golden Paw: <Text style={{ color: '#FEF08A' }}>2X</Text></Text>
                <Text style={styles.rulesSubItem}>• Any 3 Mixed Animals: <Text style={{ color: '#FEF08A' }}>3X</Text></Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeRulesBtn}
                activeOpacity={0.8}
                onPress={() => setPaytableVisible(false)}
              >
                <Text style={styles.closeRulesBtnText}><T>Got It!</T></Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ══ WIN CELEBRATION MODAL ══ */}
        {winResult && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.winModalBackdrop}>
              <View style={styles.winDialogCard}>
                <LinearGradient
                  colors={winResult.isJackpot ? ['#78350F', '#B45309', '#064E3B'] : ['#064E3B', '#047857', '#022C22']}
                  style={styles.winDialogGradient}
                >
                  <Text style={styles.winBigTitle}>
                    {winResult.isJackpot ? `👑 ${t('MEGA JUNGLE WIN!')} 👑` : `🎉 ${t('WINNER!')} 🎉`}
                  </Text>

                  {/* Matching Symbols Preview */}
                  <View style={styles.winSymbolsRow}>
                    {winResult.symbols?.map((sym, index) => {
                      const IconComponent = sym.icon;
                      return (
                        <View key={`${sym.id}-${index}`} style={styles.winSymbolItem}>
                          <IconComponent size={44} />
                        </View>
                      );
                    })}
                  </View>

                  <Text style={styles.winMultiplierTag}>{winResult.multiplier}X MULTIPLIER</Text>

                  <View style={styles.winCoinsPill}>
                    <ShinyCoinIcon size={26} />
                    <Text style={styles.winCoinsText}>+{winResult.wonCoins.toLocaleString()}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.collectBtn}
                    activeOpacity={0.85}
                    onPress={() => setWinResult(null)}
                  >
                    <Text style={styles.collectBtnText}>💰 <T>COLLECT</T></Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#071A12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.94,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F3822',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginRight: 10,
  },
  headerTextGroup: {},
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  wildBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 8,
  },
  wildBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  headerSub: {
    color: '#86EFAC',
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#0F3822',
    borderRadius: 14,
    marginLeft: 6,
  },
  iconBtnText: {
    fontSize: 14,
  },
  closeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#2D1414',
    borderRadius: 14,
    marginLeft: 8,
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
    backgroundColor: '#092516',
  },
  coinBalanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F3822',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  coinBalanceText: {
    color: '#FEF08A',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  rechargeBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  rechargeBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  todayEarningsBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsLabel: {
    color: '#86EFAC',
    fontSize: 11,
    marginRight: 4,
  },
  earningsValue: {
    color: '#FACC15',
    fontWeight: 'bold',
    fontSize: 12,
  },
  slotWindowArea: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#15803D',
  },
  slotWindowGradient: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  topStatusStrip: {
    minHeight: 28,
    justifyContent: 'center',
    marginBottom: 10,
  },
  regularStatusPill: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  regularStatusText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bambooRespinBanner: {
    backgroundColor: '#78350F',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  bambooRespinText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  wildBoostBanner: {
    backgroundColor: '#B45309',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  wildBoostText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  reelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  reelColumn: {
    flex: 1,
    height: 125,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#166534',
  },
  reelColumnRespin: {
    borderColor: '#F59E0B',
    transform: [{ scale: 1.03 }],
  },
  reelCellGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  reelSymbolName: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  paylineBeam: {
    position: 'absolute',
    top: '58%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#F59E0B66',
    zIndex: 10,
  },
  historyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    backgroundColor: '#062E1C',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#15803D',
  },
  historyLabel: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
  },
  historyScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F3822',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  historyBadgeLatest: {
    backgroundColor: '#1E3A2F',
  },
  historyBadgeIconWrap: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  historyBadgeInfo: {
    justifyContent: 'center',
  },
  historyBadgeName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  historyBadgeMult: {
    fontSize: 9,
    fontWeight: '900',
  },
  latestDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  paytableStrip: {
    marginHorizontal: 14,
    marginTop: 6,
    maxHeight: 52,
  },
  paytableStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPayCard: {
    backgroundColor: '#092516',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 54,
  },
  miniPayMultiplier: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  footerControls: {
    backgroundColor: '#05160E',
    borderTopWidth: 1,
    borderTopColor: '#0F3822',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    marginTop: 'auto',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F3822',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#166534',
  },
  chipBtnSelected: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  chipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  chipTextSelected: {
    color: '#FEF08A',
  },
  utilityBtn: {
    backgroundColor: '#14532D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  utilityBtnText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoBtn: {
    backgroundColor: '#0F3822',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtnActive: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  autoBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: 'bold',
  },
  autoBtnTextActive: {
    color: '#FFFFFF',
  },
  spinBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  spinBtnDisabled: {
    opacity: 0.65,
  },
  spinGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#092516',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  rulesTitle: {
    color: '#FEF08A',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  rulesScroll: {
    marginBottom: 12,
  },
  rulesText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  rulesSubheading: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  rulesSubItem: {
    color: '#CBD5E1',
    fontSize: 11,
    marginLeft: 8,
    lineHeight: 18,
  },
  paytableItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#0F3822',
  },
  paytableItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paytableItemName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  paytableItemMult: {
    fontSize: 13,
    fontWeight: '900',
  },
  closeRulesBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeRulesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  winModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  winDialogCard: {
    width: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  winDialogGradient: {
    padding: 24,
    alignItems: 'center',
  },
  winBigTitle: {
    color: '#FEF08A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  winSymbolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  winSymbolItem: {
    backgroundColor: '#0F3822',
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  winMultiplierTag: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  winCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#092516',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  winCoinsText: {
    color: '#FEF08A',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8,
  },
  collectBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 16,
  },
  collectBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});


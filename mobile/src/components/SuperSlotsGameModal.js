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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import {
  SevenIcon,
  DiamondIcon,
  WatermelonIcon,
  GrapesIcon,
  CherryIcon,
  SLOT_SYMBOLS,
} from './SlotIcons';
import { ShinyCoinIcon } from './FoodIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Betting chips options matching Greedy Baby & Screenshot 2
const BET_CHIPS = [10, 50, 100, 1000, 10000];

// Paytable definition matching Screenshot 1
const PAYTABLE_ITEMS = [
  { id: 'seven', label: '7', multiplier: 500, icon: SevenIcon, isSeven: true },
  { id: 'diamond', label: 'Diamond', multiplier: 100, icon: DiamondIcon },
  { id: 'watermelon', label: 'Watermelon', multiplier: 50, icon: WatermelonIcon },
  { id: 'grapes', label: 'Grapes', multiplier: 20, icon: GrapesIcon },
  { id: 'cherry', label: 'Cherry', multiplier: 10, icon: CherryIcon },
];

export default function SuperSlotsGameModal({
  visible,
  onClose,
  currentUser,
  onCoinBalanceUpdate,
  onRechargePress,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Balance & Earnings
  const [userCoins, setUserCoins] = useState(currentUser?.coins || 0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  // Betting & Game State
  const [selectedChip, setSelectedChip] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoSpinRef = useRef(false);

  // 3 Reel States (id of current symbol displayed)
  const [reel1, setReel1] = useState('seven');
  const [reel2, setReel2] = useState('seven');
  const [reel3, setReel3] = useState('seven');

  // Win State & Highlight
  const [winningSymbolId, setWinningSymbolId] = useState(null);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [lastWinMultiplier, setLastWinMultiplier] = useState(0);
  const [winBannerVisible, setWinBannerVisible] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);

  // Animations
  const reel1Anim = useRef(new Animated.Value(0)).current;
  const reel2Anim = useRef(new Animated.Value(0)).current;
  const reel3Anim = useRef(new Animated.Value(0)).current;
  const paylineGlowAnim = useRef(new Animated.Value(0)).current;
  const winScaleAnim = useRef(new Animated.Value(0)).current;
  const spinBtnScale = useRef(new Animated.Value(1)).current;
  const paytableFlashAnim = useRef(new Animated.Value(0)).current;

  // Keep autoSpinRef updated
  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  // Sync user coins whenever currentUser prop updates
  useEffect(() => {
    if (currentUser?.coins !== undefined) {
      setUserCoins(currentUser.coins);
    }
  }, [currentUser?.coins]);

  // Fetch initial game state and today earnings
  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get('/games/super-slots/state');
      if (res.data?.success) {
        if (res.data.userCoins !== undefined) {
          setUserCoins(res.data.userCoins);
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(res.data.userCoins);
        }
        if (res.data.todayEarnings !== undefined) {
          setTodayEarnings(res.data.todayEarnings);
        }
      }
    } catch (e) {
      console.warn('fetchSuperSlotsState error:', e.message);
    }
  }, [onCoinBalanceUpdate]);

  useEffect(() => {
    if (visible) {
      fetchGameState();
    } else {
      setAutoSpin(false);
    }
  }, [visible, fetchGameState]);

  // Trigger Payline & Win celebration animations
  const triggerWinCelebration = (multiplier, amount, symbolId) => {
    setLastWinMultiplier(multiplier);
    setLastWinAmount(amount);
    setWinningSymbolId(symbolId);
    setWinBannerVisible(true);

    // Glowing payline
    Animated.sequence([
      Animated.timing(paylineGlowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(paylineGlowAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(paylineGlowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Paytable item pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(paytableFlashAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(paytableFlashAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]),
      { iterations: 6 }
    ).start();

    // Win scale pop
    winScaleAnim.setValue(0);
    Animated.spring(winScaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Hide banner after 3 seconds
    setTimeout(() => {
      setWinBannerVisible(false);
      setWinningSymbolId(null);
    }, 3200);
  };

  // Execute Spin Action
  const handleSpinPress = async () => {
    if (isSpinning) return;

    // Check user coins balance before requesting spin
    if (userCoins < selectedChip) {
      showToast(t('Insufficient coins! Please recharge first.'), 'error');
      setAutoSpin(false);
      setTimeout(() => {
        if (onRechargePress) onRechargePress();
      }, 1200);
      return;
    }

    setIsSpinning(true);
    setWinBannerVisible(false);
    setWinningSymbolId(null);

    // Button tactile animation
    Animated.sequence([
      Animated.timing(spinBtnScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(spinBtnScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Optimistically deduct coins
    setUserCoins((prev) => Math.max(0, prev - selectedChip));

    // Start reel cycling animations
    const reelCycleInterval = 70;
    const allSymbols = ['seven', 'diamond', 'watermelon', 'grapes', 'cherry'];

    const ticker1 = setInterval(() => {
      setReel1(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }, reelCycleInterval);

    const ticker2 = setInterval(() => {
      setReel2(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }, reelCycleInterval);

    const ticker3 = setInterval(() => {
      setReel3(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }, reelCycleInterval);

    try {
      const res = await api.post('/games/super-slots/spin', { betAmount: selectedChip });

      if (!res.data?.success) {
        clearInterval(ticker1);
        clearInterval(ticker2);
        clearInterval(ticker3);
        setIsSpinning(false);
        setAutoSpin(false);

        if (res.data?.code === 'INSUFFICIENT_COINS') {
          showToast(t('Insufficient coins! Please recharge first.'), 'error');
          setTimeout(() => {
            if (onRechargePress) onRechargePress();
          }, 1200);
        } else {
          showToast(t(res.data?.message || 'Spin failed'), 'error');
        }
        return;
      }

      const { reels, multiplier, wonCoins, remainingCoins, todayEarnings: newEarnings } = res.data;
      const [finalR1, finalR2, finalR3] = reels;

      // Stop Reel 1 first (at 1000ms)
      setTimeout(() => {
        clearInterval(ticker1);
        setReel1(finalR1);
        bounceReel(reel1Anim);
      }, 900);

      // Stop Reel 2 next (at 1450ms)
      setTimeout(() => {
        clearInterval(ticker2);
        setReel2(finalR2);
        bounceReel(reel2Anim);
      }, 1350);

      // Stop Reel 3 last (at 1900ms)
      setTimeout(() => {
        clearInterval(ticker3);
        setReel3(finalR3);
        bounceReel(reel3Anim);

        // Update balances
        if (remainingCoins !== undefined) {
          setUserCoins(remainingCoins);
          if (onCoinBalanceUpdate) onCoinBalanceUpdate(remainingCoins);
        }
        if (newEarnings !== undefined) {
          setTodayEarnings(newEarnings);
        }

        setIsSpinning(false);

        // Check if won
        if (multiplier > 0) {
          const matchedSymbol = finalR1 === finalR2 && finalR2 === finalR3 ? finalR1 : (finalR1 === 'seven' || finalR2 === 'seven' ? 'seven' : 'cherry');
          triggerWinCelebration(multiplier, wonCoins, matchedSymbol);
        }

        // Handle auto-spin loop
        if (autoSpinRef.current) {
          setTimeout(() => {
            if (autoSpinRef.current) {
              handleSpinPress();
            }
          }, 1200);
        }
      }, 1800);
    } catch (err) {
      clearInterval(ticker1);
      clearInterval(ticker2);
      clearInterval(ticker3);
      setIsSpinning(false);
      setAutoSpin(false);
      showToast(t(err.response?.data?.message || 'Failed to complete spin'), 'error');
    }
  };

  // Gentle tactile bounce when a reel stops
  const bounceReel = (anim) => {
    anim.setValue(12);
    Animated.spring(anim, {
      toValue: 0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Helper to render a reel slot symbol
  const renderSymbolIcon = (symbolId, size = 68) => {
    switch (symbolId) {
      case 'seven':
        return <SevenIcon size={size} />;
      case 'diamond':
        return <DiamondIcon size={size} />;
      case 'watermelon':
        return <WatermelonIcon size={size} />;
      case 'grapes':
        return <GrapesIcon size={size} />;
      case 'cherry':
      default:
        return <CherryIcon size={size} />;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Deep Galaxy / Casino Velvet Background */}
        <LinearGradient
          colors={['#100926', '#1E1145', '#0B061A']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* ══ TOP HEADER ══ */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onClose}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerBackText}>‹</Text>
          </TouchableOpacity>

          {/* Title with Neon Glow */}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>
              <T>Super Slots</T>
            </Text>
            <View style={styles.headerSubBadge}>
              <Text style={styles.headerSubBadgeText}>500X JACKPOT</Text>
            </View>
          </View>

          {/* Rules / Help Button */}
          <TouchableOpacity
            style={styles.headerHelpBtn}
            onPress={() => setRulesVisible(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.headerHelpText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* ══ STATUS PILLS ROW (Left: Coins, Right: Today's Earnings) ══ */}
        <View style={styles.statusRow}>
          {/* Left: Coins Balance Pill (Tapping redirects to Wallet Recharge) */}
          <TouchableOpacity
            style={styles.coinsPill}
            activeOpacity={0.8}
            onPress={() => {
              if (onRechargePress) onRechargePress();
            }}
          >
            <Text style={styles.coinsLabel}><T>Coins:</T></Text>
            <ShinyCoinIcon size={18} />
            <Text style={styles.coinsAmount}>
              {Number(userCoins).toLocaleString()}
            </Text>
            <Text style={styles.coinsArrow}>›</Text>
          </TouchableOpacity>

          {/* Right: Today Earnings Pill */}
          <View style={styles.earningsPill}>
            <Text style={styles.earningsLabel}><T>Today Earnings</T></Text>
            <View style={styles.earningsValRow}>
              <ShinyCoinIcon size={14} />
              <Text style={styles.earningsAmount}>
                {Number(todayEarnings).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.mainScrollView}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ══ CASINO SLOT MACHINE CABINET ══ */}
          <View style={styles.machineCabinet}>
            {/* Golden Chrome Outer Frame */}
            <LinearGradient
              colors={['#F59E0B', '#FDE68A', '#D97706', '#92400E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.machineOuterBezel}
            >
              {/* Marquee Top Title Banner */}
              <LinearGradient
                colors={['#DC2626', '#991B1B']}
                style={styles.marqueeBanner}
              >
                <View style={styles.marqueeBulbs}>
                  <View style={[styles.bulb, styles.bulbActive]} />
                  <View style={styles.bulb} />
                  <View style={[styles.bulb, styles.bulbActive]} />
                </View>
                <Text style={styles.marqueeText}>★ LUCKY 777 SPIN ★</Text>
                <View style={styles.marqueeBulbs}>
                  <View style={[styles.bulb, styles.bulbActive]} />
                  <View style={styles.bulb} />
                  <View style={[styles.bulb, styles.bulbActive]} />
                </View>
              </LinearGradient>

              {/* Inner Reel Screen Housing */}
              <View style={styles.reelsScreen}>
                {/* Horizontal Center Payline Guide Indicator */}
                <Animated.View
                  style={[
                    styles.paylineIndicator,
                    { opacity: paylineGlowAnim },
                  ]}
                />

                {/* 3 Reel Columns */}
                <View style={styles.reelsRow}>
                  {/* Reel 1 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC', '#E2E8F0']}
                      style={styles.reelWindow}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolWrap,
                          { transform: [{ translateY: reel1Anim }] },
                        ]}
                      >
                        {renderSymbolIcon(reel1)}
                      </Animated.View>
                      <View style={styles.reelGlossHighlight} />
                    </LinearGradient>
                  </View>

                  {/* Reel Divider */}
                  <View style={styles.reelDivider} />

                  {/* Reel 2 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC', '#E2E8F0']}
                      style={styles.reelWindow}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolWrap,
                          { transform: [{ translateY: reel2Anim }] },
                        ]}
                      >
                        {renderSymbolIcon(reel2)}
                      </Animated.View>
                      <View style={styles.reelGlossHighlight} />
                    </LinearGradient>
                  </View>

                  {/* Reel Divider */}
                  <View style={styles.reelDivider} />

                  {/* Reel 3 */}
                  <View style={styles.reelColumn}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC', '#E2E8F0']}
                      style={styles.reelWindow}
                    >
                      <Animated.View
                        style={[
                          styles.reelSymbolWrap,
                          { transform: [{ translateY: reel3Anim }] },
                        ]}
                      >
                        {renderSymbolIcon(reel3)}
                      </Animated.View>
                      <View style={styles.reelGlossHighlight} />
                    </LinearGradient>
                  </View>
                </View>

                {/* Win Celebration Banner Overlay */}
                {winBannerVisible && (
                  <Animated.View
                    style={[
                      styles.winCelebrationBanner,
                      { transform: [{ scale: winScaleAnim }] },
                    ]}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626', '#991B1B']}
                      style={styles.winBannerGradient}
                    >
                      <Text style={styles.winBannerTitle}>
                        {lastWinMultiplier >= 500 ? '👑 MEGA JACKPOT! 👑' : '🎉 BIG WIN! 🎉'}
                      </Text>
                      <Text style={styles.winBannerMultiplier}>
                        {lastWinMultiplier}X MULTIPLIER!
                      </Text>
                      <View style={styles.winCoinsRow}>
                        <ShinyCoinIcon size={26} />
                        <Text style={styles.winCoinsText}>
                          +{Number(lastWinAmount).toLocaleString()}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>

              {/* Machine Bottom Trim */}
              <View style={styles.machineBottomTrim}>
                <View style={styles.trimIndicatorLeft} />
                <Text style={styles.trimText}>MATCH 3 SYMBOLS TO WIN</Text>
                <View style={styles.trimIndicatorRight} />
              </View>
            </LinearGradient>
          </View>

          {/* ══ PAYTABLE ROW (Exact Screenshot 1 Placement: directly above chips card!) ══ */}
          <View style={styles.paytableSection}>
            <View style={styles.paytableContainer}>
              {PAYTABLE_ITEMS.map((item) => {
                const isWinner = winningSymbolId === item.id;
                const IconComponent = item.icon;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.paytableCard,
                      isWinner && styles.paytableCardWinner,
                    ]}
                  >
                    {/* Symbol Display */}
                    <View style={styles.paytableSymbolBox}>
                      {item.isSeven ? (
                        <Text style={styles.paytableSevenText}>7</Text>
                      ) : (
                        <IconComponent size={28} />
                      )}
                    </View>

                    {/* Blue Multiplier Text (matching Screenshot 1) */}
                    <Text
                      style={[
                        styles.paytableMultiplierText,
                        isWinner && styles.paytableMultiplierTextWinner,
                      ]}
                    >
                      {item.multiplier}x
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ══ BETTING CHIPS CARD (Screenshot 2: directly below paytable) ══ */}
          <View style={styles.betChipsCard}>
            <View style={styles.chipsRow}>
              {BET_CHIPS.map((chipVal) => {
                const isSelected = selectedChip === chipVal;
                return (
                  <TouchableOpacity
                    key={chipVal}
                    activeOpacity={0.8}
                    disabled={isSpinning}
                    style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                    onPress={() => setSelectedChip(chipVal)}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? ['#EF4444', '#DC2626', '#B91C1C']
                          : ['#FFFFFF', '#F8FAFC', '#F1F5F9']
                      }
                      style={styles.chipGradient}
                    >
                      {/* Shiny Gold Coin */}
                      <ShinyCoinIcon size={22} />
                      {/* Bet chip number */}
                      <Text
                        style={[
                          styles.chipValueText,
                          isSelected && styles.chipValueTextSelected,
                        ]}
                      >
                        {chipVal >= 1000 ? `${chipVal / 1000}K` : chipVal}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ══ SPIN CONTROLS SECTION ══ */}
          <View style={styles.spinControlsSection}>
            {/* Auto Spin Toggle Button */}
            <TouchableOpacity
              style={[
                styles.autoSpinBtn,
                autoSpin && styles.autoSpinBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setAutoSpin((prev) => !prev)}
            >
              <Text
                style={[
                  styles.autoSpinBtnText,
                  autoSpin && styles.autoSpinBtnTextActive,
                ]}
              >
                {autoSpin ? t('AUTO ON') : t('AUTO SPIN')}
              </Text>
            </TouchableOpacity>

            {/* Main 3D SPIN Button */}
            <Animated.View style={{ transform: [{ scale: spinBtnScale }] }}>
              <TouchableOpacity
                style={styles.mainSpinBtn}
                activeOpacity={0.85}
                disabled={isSpinning}
                onPress={handleSpinPress}
              >
                <LinearGradient
                  colors={
                    isSpinning
                      ? ['#6B7280', '#4B5563', '#374151']
                      : ['#F59E0B', '#D97706', '#92400E']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.spinBtnGradient}
                >
                  <View style={styles.spinBtnShine} />
                  <Text style={styles.spinBtnText}>
                    {isSpinning ? t('SPINNING...') : t('SPIN')}
                  </Text>
                  <Text style={styles.spinBtnCost}>
                    {selectedChip} <T>Coins</T>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Max Bet Button */}
            <TouchableOpacity
              style={styles.maxBetBtn}
              activeOpacity={0.8}
              disabled={isSpinning}
              onPress={() => setSelectedChip(10000)}
            >
              <Text style={styles.maxBetBtnText}><T>MAX BET</T></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ══ RULES MODAL ══ */}
        <Modal
          visible={rulesVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRulesVisible(false)}
        >
          <View style={styles.rulesBackdrop}>
            <View style={styles.rulesCard}>
              <View style={styles.rulesHeader}>
                <Text style={styles.rulesTitle}><T>Super Slots Rules</T></Text>
                <TouchableOpacity
                  onPress={() => setRulesVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.rulesCloseBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.rulesBody}>
                <Text style={styles.rulesSubtitle}><T>How to Play</T></Text>
                <Text style={styles.rulesText}>
                  <T>1. Choose your bet chip from 10 to 10,000 gold coins.</T>
                </Text>
                <Text style={styles.rulesText}>
                  <T>2. Tap SPIN or enable AUTO SPIN to roll the 3 reels.</T>
                </Text>
                <Text style={styles.rulesText}>
                  <T>3. Match all 3 symbols on the payline to win huge coin rewards!</T>
                </Text>

                <Text style={[styles.rulesSubtitle, { marginTop: 16 }]}>
                  <T>Paytable Payouts</T>
                </Text>

                {PAYTABLE_ITEMS.map((item) => (
                  <View key={item.id} style={styles.rulesPayRow}>
                    <View style={styles.rulesPayLeft}>
                      {renderSymbolIcon(item.id, 24)}
                      <Text style={styles.rulesPayName}>
                        <T>{item.label}</T> x3
                      </Text>
                    </View>
                    <Text style={styles.rulesPayMult}>{item.multiplier}x</Text>
                  </View>
                ))}

                <View style={styles.rulesPayRow}>
                  <View style={styles.rulesPayLeft}>
                    <SevenIcon size={24} />
                    <Text style={styles.rulesPayName}>
                      <T>Two 7s</T>
                    </Text>
                  </View>
                  <Text style={styles.rulesPayMult}>5x</Text>
                </View>

                <View style={styles.rulesPayRow}>
                  <View style={styles.rulesPayLeft}>
                    <CherryIcon size={24} />
                    <Text style={styles.rulesPayName}>
                      <T>Two Cherries</T>
                    </Text>
                  </View>
                  <Text style={styles.rulesPayMult}>2x</Text>
                </View>

                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0D23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FCD34D',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  headerSubBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  headerSubBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerHelpBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ══ STATUS PILLS (Greedy Baby Style) ══
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  coinsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
    marginRight: 4,
  },
  coinsAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginLeft: 4,
  },
  coinsArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    marginLeft: 5,
  },
  earningsPill: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#FCD34D',
    fontWeight: '600',
    marginBottom: 2,
  },
  earningsValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // ══ CASINO CABINET ══
  machineCabinet: {
    width: '100%',
    maxWidth: 420,
    marginTop: 4,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  machineOuterBezel: {
    borderRadius: 22,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  marqueeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  marqueeBulbs: {
    flexDirection: 'row',
    gap: 4,
  },
  bulb: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE047',
    opacity: 0.5,
  },
  bulbActive: {
    opacity: 1,
    backgroundColor: '#FFFFFF',
  },
  marqueeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ══ REELS SCREEN ══
  reelsScreen: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 10,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  paylineIndicator: {
    position: 'absolute',
    top: '50%',
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 1,
    shadowRadius: 8,
    zIndex: 10,
    elevation: 6,
  },
  reelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reelColumn: {
    flex: 1,
    height: 120,
  },
  reelWindow: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
  },
  reelSymbolWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelGlossHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  reelDivider: {
    width: 6,
    height: '100%',
    backgroundColor: '#1E293B',
    marginHorizontal: 3,
    borderRadius: 3,
  },

  // Win Banner
  winCelebrationBanner: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    zIndex: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 10,
  },
  winBannerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  winBannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 1,
  },
  winBannerMultiplier: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  winCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  winCoinsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 6,
  },

  machineBottomTrim: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 2,
  },
  trimIndicatorLeft: {
    width: 14,
    height: 3,
    backgroundColor: '#78350F',
    marginRight: 8,
  },
  trimIndicatorRight: {
    width: 14,
    height: 3,
    backgroundColor: '#78350F',
    marginLeft: 8,
  },
  trimText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },

  // ══ PAYTABLE ROW (Exact Screenshot 1 Style) ══
  paytableSection: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 10,
  },
  paytableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  paytableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 3,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paytableCardWinner: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FEF3C7',
    transform: [{ scale: 1.05 }],
  },
  paytableSymbolBox: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  paytableSevenText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
  },
  paytableMultiplierText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB', // Blue matching Screenshot 1!
  },
  paytableMultiplierTextWinner: {
    color: '#B45309',
    fontWeight: '900',
  },

  // ══ BETTING CHIPS CARD (Exact Screenshot 2 Style) ══
  betChipsCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#4338CA', // Rich indigo background from Screenshot 2
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipBtn: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chipBtnSelected: {
    transform: [{ scale: 1.04 }],
    shadowColor: '#EF4444',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  chipGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  chipValueTextSelected: {
    color: '#FFFFFF',
  },

  // ══ SPIN CONTROLS ══
  spinControlsSection: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  autoSpinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoSpinBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  autoSpinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  autoSpinBtnTextActive: {
    color: '#FFFFFF',
  },
  mainSpinBtn: {
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  spinBtnGradient: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    position: 'relative',
    overflow: 'hidden',
  },
  spinBtnShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  spinBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  spinBtnCost: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEF08A',
    marginTop: 1,
  },
  maxBetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxBetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FCD34D',
  },

  // ══ RULES MODAL ══
  rulesBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rulesCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rulesCloseBtn: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rulesBody: {
    flex: 1,
  },
  rulesSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 6,
  },
  rulesText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 6,
  },
  rulesPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rulesPayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rulesPayName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  rulesPayMult: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
});

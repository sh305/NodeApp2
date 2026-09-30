import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ── Box Levels Config ──────────────────────────────────────────────────────
const BOX_LEVELS = [
  {
    level: 1,
    label: 'Lv1',
    requiredGold: 12000,
    emoji: '📦',
    color: ['#8B5CF6', '#6366F1'],
    borderColor: '#818CF8',
    prizes: [
      { icon: '🔮', label: 'Crystal Globe', coins: 10000 },
      { icon: '💫', label: 'Magic Ring', coins: 10000 },
      { icon: '👋', label: 'Hi~ Frame', coins: 30000 },
      { icon: '🪙', label: 'Coins', coins: 100 },
      { icon: '🪙', label: 'Coins', coins: 20 },
      { icon: '🪙', label: 'Coins', coins: 5 },
    ],
  },
  {
    level: 2,
    label: 'Lv2',
    requiredGold: 30000,
    emoji: '🎁',
    color: ['#059669', '#10B981'],
    borderColor: '#34D399',
    prizes: [
      { icon: '🚀', label: 'Rocket Gift', coins: 25000 },
      { icon: '💎', label: 'Diamond Ring', coins: 20000 },
      { icon: '🌈', label: 'Rainbow Frame', coins: 50000 },
      { icon: '🪙', label: 'Coins', coins: 500 },
      { icon: '🪙', label: 'Coins', coins: 200 },
      { icon: '🪙', label: 'Coins', coins: 50 },
    ],
  },
  {
    level: 3,
    label: 'Lv3',
    requiredGold: 50000,
    emoji: '🏆',
    color: ['#D97706', '#F59E0B'],
    borderColor: '#FBBF24',
    prizes: [
      { icon: '🦄', label: 'Unicorn Gift', coins: 40000 },
      { icon: '👑', label: 'Royal Crown', coins: 35000 },
      { icon: '⚡', label: 'Thunder Frame', coins: 80000 },
      { icon: '🪙', label: 'Coins', coins: 1000 },
      { icon: '🪙', label: 'Coins', coins: 500 },
      { icon: '🪙', label: 'Coins', coins: 100 },
    ],
  },
  {
    level: 4,
    label: 'Lv4',
    requiredGold: 80000,
    emoji: '💎',
    color: ['#0EA5E9', '#6366F1'],
    borderColor: '#38BDF8',
    prizes: [
      { icon: '🛸', label: 'UFO Gift', coins: 60000 },
      { icon: '🌊', label: 'Ocean Ring', coins: 55000 },
      { icon: '🔥', label: 'Flame Frame', coins: 120000 },
      { icon: '🪙', label: 'Coins', coins: 2000 },
      { icon: '🪙', label: 'Coins', coins: 1000 },
      { icon: '🪙', label: 'Coins', coins: 500 },
    ],
  },
  {
    level: 5,
    label: 'Lv5',
    requiredGold: 100000,
    emoji: '👑',
    color: ['#EF4444', '#F59E0B'],
    borderColor: '#F87171',
    prizes: [
      { icon: '🐉', label: 'Dragon Castle', coins: 100000 },
      { icon: '🌟', label: 'Star of God', coins: 80000 },
      { icon: '🦋', label: 'Celestial Frame', coins: 200000 },
      { icon: '🪙', label: 'Coins', coins: 5000 },
      { icon: '🪙', label: 'Coins', coins: 2000 },
      { icon: '🪙', label: 'Coins', coins: 1000 },
    ],
  },
];

// ── Animated shimmer progress bar with integrated key badge ──────────────────
function ProgressBar({ current, target, accentColor }) {
  const pct = Math.min(Math.max(current / target, 0), 1);
  const shimmerAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 300,
        duration: 1600,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={pb.wrapper}>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${pct * 100}%`, backgroundColor: accentColor }]}>
          <Animated.View
            style={[pb.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
          />
        </View>
      </View>

      {/* Floating Key Badge that stays strictly within the track boundaries */}
      <View
        style={[
          pb.keyThumbWrap,
          {
            left: `${pct * 100}%`,
            transform: [{ translateX: pct > 0.85 ? -22 : (pct < 0.1 ? 0 : -11) }],
          },
        ]}
      >
        <View style={pb.keyBadge}>
          <Text style={pb.keyEmoji}>🔑</Text>
        </View>
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 26,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 14,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  keyThumbWrap: {
    position: 'absolute',
    top: 2,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  keyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  keyEmoji: {
    fontSize: 12,
  },
});

// ── Main Component ────────────────────────────────────────────────────────
export default function TreasureBoxModal({
  visible,
  onClose,
  roomGoldContributed = 0,
  currentBoxLevel = 1,
  onClaimBox,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const idx = Math.min(currentBoxLevel - 1, 4);
      setActiveTab(idx);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const activeBox = BOX_LEVELS[activeTab];

  // Gold consumed by previous completed boxes
  const goldForPrevBoxes = BOX_LEVELS.slice(0, activeTab).reduce(
    (sum, b) => sum + b.requiredGold,
    0
  );
  const goldInCurrentBox = Math.max(0, roomGoldContributed - goldForPrevBoxes);
  const currentProgress = Math.min(goldInCurrentBox, activeBox.requiredGold);
  const isBoxCompleted = goldInCurrentBox >= activeBox.requiredGold;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Header */}
          <LinearGradient colors={['#3B1F6E', '#1E1040']} style={styles.header}>
            <Text style={styles.headerTitle}>
              🎁 Send gifts to open the treasure box!
            </Text>
            <View style={styles.helpBtn}>
              <Text style={styles.helpText}>?</Text>
            </View>
          </LinearGradient>

          {/* Box Level Tabs */}
          <View style={styles.tabRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {BOX_LEVELS.map((box, i) => {
                const prevGold = BOX_LEVELS.slice(0, i).reduce(
                  (s, b) => s + b.requiredGold,
                  0
                );
                const done = roomGoldContributed >= prevGold + box.requiredGold;
                const isCurrent = i === activeTab;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.tabItem}
                    onPress={() => setActiveTab(i)}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={
                        isCurrent
                          ? box.color
                          : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
                      }
                      style={[
                        styles.tabBoxIcon,
                        isCurrent && {
                          borderColor: box.borderColor,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Text style={styles.tabEmoji}>{box.emoji}</Text>
                      {done && (
                        <View style={styles.doneCheckBadge}>
                          <Text style={{ fontSize: 8, color: '#fff' }}>✓</Text>
                        </View>
                      )}
                    </LinearGradient>
                    <View
                      style={[
                        styles.tabLabelBadge,
                        { backgroundColor: isCurrent ? box.borderColor : 'rgba(255,255,255,0.15)' },
                      ]}
                    >
                      <Text style={styles.tabLabel}>{box.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Progress Bar Section */}
          <View style={styles.progressSection}>
            <ProgressBar
              current={currentProgress}
              target={activeBox.requiredGold}
              accentColor={activeBox.borderColor}
            />
            <Text style={styles.progressLabel}>
              {currentProgress.toLocaleString()}/
              {activeBox.requiredGold.toLocaleString()}
            </Text>

            {isBoxCompleted && (
              <TouchableOpacity
                style={[styles.claimBtn, { borderColor: activeBox.borderColor }]}
                onPress={() => onClaimBox && onClaimBox(activeBox.level)}
                activeOpacity={0.75}
              >
                <LinearGradient colors={activeBox.color} style={styles.claimBtnInner}>
                  <Text style={styles.claimBtnText}>
                    🎉 Open Box & Claim Prize!
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Prize List */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.prizeSection}>
              <Text style={styles.prizeTitle}>Prize</Text>
              <View style={styles.prizeGrid}>
                {activeBox.prizes.map((prize, i) => (
                  <View
                    key={i}
                    style={[
                      styles.prizeItem,
                      i === 0 && styles.prizeItemLarge,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        i === 0
                          ? activeBox.color
                          : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)']
                      }
                      style={[
                        styles.prizeIconBox,
                        i === 0 && {
                          borderColor: `${activeBox.borderColor}88`,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.prizeEmoji,
                          i === 0 && { fontSize: 36 },
                        ]}
                      >
                        {prize.icon}
                      </Text>
                    </LinearGradient>
                    <Text style={styles.prizeCoins}>
                      🪙{' '}
                      {typeof prize.coins === 'number'
                        ? prize.coins.toLocaleString()
                        : prize.coins}
                    </Text>
                    <Text style={styles.prizeName} numberOfLines={1}>
                      {prize.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.footerNote}>
              Restart every day at 1:00 a.m midnight.
            </Text>

            <TouchableOpacity
              style={styles.closeRow}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={styles.closeText}>✕ Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A0A3E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#C4B5FD',
    fontWeight: '800',
    fontSize: 13,
  },

  // Tabs
  tabRow: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
  },
  tabScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tabItem: {
    alignItems: 'center',
    gap: 5,
  },
  tabBoxIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabEmoji: {
    fontSize: 28,
  },
  doneCheckBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Progress
  progressSection: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
    letterSpacing: 0.5,
  },
  claimBtn: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  claimBtnInner: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.4,
  },

  // Prizes
  prizeSection: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  prizeTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 10,
  },
  prizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prizeItem: {
    alignItems: 'center',
    width: (width - 36 - 24) / 4,
  },
  prizeItemLarge: {
    width: (width - 36 - 24) / 2,
  },
  prizeIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  prizeEmoji: {
    fontSize: 20,
  },
  prizeCoins: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  prizeName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },

  footerNote: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  closeRow: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  closeText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 13,
  },
});

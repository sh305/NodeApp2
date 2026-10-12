import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import {
  getUserExpProgress,
  getLevelTierInfo,
} from '../constants/userLevelSystem';
import {
  getFortuneProgress,
  getFortuneTierInfo,
  formatCompact,
} from '../constants/fortuneLevelSystem';

const { width } = Dimensions.get('window');

// 1. SVGs & Watermarks
const BackArrowIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Giant Dollar Coin Watermark for Fortune Level (Screenshot 1)
const CoinWatermark = ({ size = 160 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    style={styles.headerWatermark}
  >
    <Circle cx="65" cy="45" r="42" fill="rgba(255, 255, 255, 0.12)" />
    <Circle cx="65" cy="45" r="34" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="3" />
    <Path
      d="M65 24V66M73 34H61C58.8 34 57 35.8 57 38C57 40.2 58.8 42 61 42H69C71.2 42 73 43.8 73 46C73 48.2 71.2 50 69 50H57"
      stroke="rgba(255, 255, 255, 0.28)"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Giant Star Watermark for User Level (Screenshot 2)
const StarWatermark = ({ size = 170 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    style={styles.headerWatermark}
  >
    <Circle cx="68" cy="42" r="44" fill="rgba(255, 255, 255, 0.12)" />
    <Path
      d="M68 18L73.5 31.5L88 33L77 43L80 57.5L68 50.5L56 57.5L59 43L48 33L62.5 31.5L68 18Z"
      fill="rgba(255, 255, 255, 0.22)"
    />
  </Svg>
);

// Ribbon Badge under Avatar
const RibbonLevelBadge = ({ level = 1, isFortune = true }) => {
  const gradient = isFortune
    ? ['#FF8A00', '#FF6000', '#E55300']
    : ['#38BDF8', '#0284C7', '#0369A1'];

  return (
    <View style={styles.ribbonWrapper}>
      {/* Left ribbon tail */}
      <View
        style={[
          styles.ribbonTailLeft,
          { borderRightColor: isFortune ? '#B43F00' : '#0369A1' },
        ]}
      />
      {/* Main ribbon banner */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ribbonCenter}
      >
        <Text style={styles.ribbonText}>Lv.{level}</Text>
      </LinearGradient>
      {/* Right ribbon tail */}
      <View
        style={[
          styles.ribbonTailRight,
          { borderLeftColor: isFortune ? '#B43F00' : '#0369A1' },
        ]}
      />
    </View>
  );
};

export default function LevelScreen({ navigation, route, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // Tab State: 'fortune' | 'user'
  const [activeTab, setActiveTab] = useState(
    route?.params?.initialTab === 'user' ? 'user' : 'fortune'
  );

  const [profile, setProfile] = useState(route?.params?.user || currentUser || null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_info');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile((prev) => prev || parsed);
        } catch (_) {}
      }

      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
      } else if (res.data?.user) {
        setProfile(res.data.user);
      }
    } catch (_) {
      try {
        const stored = await AsyncStorage.getItem('@user_info');
        if (stored) setProfile(JSON.parse(stored));
      } catch (__) {}
    }
  };

  const isFortune = activeTab === 'fortune';

  // 1. Fortune Level Metrics (Starts at 0 coins and Level 1 if no recharge)
  const wealthCoins = Math.max(
    0,
    Number(profile?.totalRecharged ?? profile?.wealthExp ?? 0)
  );
  const explicitWealthLevel = wealthCoins > 0 ? Number(profile?.wealthLevel || 1) : 1;
  const fortuneProgress = getFortuneProgress(wealthCoins, explicitWealthLevel);
  const fortuneTier = getFortuneTierInfo(fortuneProgress.currentLevel);

  // 2. User Level Metrics (Starts at 0 EXP and Level 1 if new user)
  const userExp = Math.max(
    0,
    Number(profile?.exp ?? profile?.userExp ?? 0)
  );
  const explicitUserLevel = Math.max(1, Number(profile?.userLevel ?? profile?.level ?? 1));
  const userProgress = getUserExpProgress(userExp, explicitUserLevel);
  const userTier = getLevelTierInfo(userProgress.currentLevel);

  // 3. Today's EXP data for User Level (Starts at 0 if no room/chat activity today)
  const todayExp = Math.max(0, Number(profile?.todayExp ?? 0));
  const todayExpCap = 71000;
  const todayExpPercent = Math.min(100, Math.max(0, (todayExp / todayExpCap) * 100));

  const avatarUri =
    profile?.avatar ||
    currentUser?.avatar ||
    'https://api.dicebear.com/7.x/bottts/png?seed=UserLevel';

  return (
    <View style={styles.container}>
      {/* ══ 1. DYNAMIC TOP HEADER WITH GRADIENT (MATCHING SCREENSHOTS 1 & 2) ══ */}
      <LinearGradient
        colors={
          isFortune
            ? ['#FFA000', '#FF8F00', '#FF6F00'] // Golden amber wealth gradient
            : ['#42A5F5', '#2196F3', '#1E88E5'] // Vibrant sky-blue user level gradient
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(12, insets.top) },
        ]}
      >
        {/* Background Watermark */}
        {isFortune ? <CoinWatermark size={175} /> : <StarWatermark size={180} />}

        {/* Top Bar: Back Button & Tabs Row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackArrowIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Centered Tabs Row */}
          <View style={styles.headerTabsWrap}>
            <TouchableOpacity
              style={styles.headerTabItem}
              activeOpacity={0.8}
              onPress={() => setActiveTab('fortune')}
            >
              <Text
                style={[
                  styles.headerTabText,
                  isFortune && styles.headerTabTextActive,
                ]}
              >
                <T>Fortune level</T>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerTabItem}
              activeOpacity={0.8}
              onPress={() => setActiveTab('user')}
            >
              <Text
                style={[
                  styles.headerTabText,
                  !isFortune && styles.headerTabTextActive,
                ]}
              >
                <T>User level</T>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Empty placeholder for symmetrical balance */}
          <View style={{ width: 32 }} />
        </View>

        {/* User Level Top-Left "Today's EXP" Mini Progress (Screenshot 2) */}
        {!isFortune && (
          <View style={styles.todayExpWrap}>
            <Text style={styles.todayExpTitle}>
              <T>Today's EXP</T>
            </Text>
            <View style={styles.todayExpTrack}>
              <View
                style={[
                  styles.todayExpFill,
                  { width: `${todayExpPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.todayExpNumbers}>
              {todayExp}/{todayExpCap}
            </Text>
          </View>
        )}

        {/* ══ 2. CENTER PROFILE AVATAR & LEVEL RIBBON ══ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircleWrap}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>

          <RibbonLevelBadge
            level={
              isFortune
                ? fortuneProgress.currentLevel
                : userProgress.currentLevel
            }
            isFortune={isFortune}
          />
        </View>

        {/* ══ 3. PROGRESS METRICS & SLIDER BAR (SCREENSHOT MATCH) ══ */}
        <View style={styles.progressContainer}>
          {/* Numbers right above the track */}
          <View style={styles.metricNumbersRow}>
            <Text style={styles.metricNumbersText}>
              {isFortune
                ? `${formatCompact(fortuneProgress.currentExp)}/${formatCompact(fortuneProgress.targetExp)}`
                : `${userProgress.currentExp}/${userProgress.targetExp}`}
            </Text>
          </View>

          {/* Horizontal Progress Track */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={
                isFortune
                  ? ['#FFB74D', '#FF9800', '#F57C00']
                  : ['#90CAF9', '#64B5F6', '#2196F3']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      isFortune
                        ? fortuneProgress.percent
                        : userProgress.percent
                    )
                  )}%`,
                },
              ]}
            />
          </View>

          {/* Level Markers Below Progress Track */}
          <View style={styles.levelMarkersRow}>
            <Text style={styles.levelMarkerText}>
              Lv.{isFortune ? fortuneProgress.currentLevel : userProgress.currentLevel}
            </Text>
            <Text style={styles.levelMarkerText}>
              Lv.{isFortune ? fortuneProgress.nextLevel : userProgress.nextLevel}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ══ 4. SCROLLABLE BODY CONTENT ══ */}
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: Math.max(30, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isFortune ? (
          /* ═════════ TAB 1: FORTUNE LEVEL CONTENT (SCREENSHOT 1) ═════════ */
          <View style={styles.sectionsWrapper}>
            {/* 1. Taillight Reward Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>
                <T>Taillight reward</T>
              </Text>
              <Text style={styles.sectionSubtitle}>
                <T>Higher level, more attractive taillight</T>
              </Text>

              <View style={styles.taillightCard}>
                <View style={styles.taillightGrid}>
                  {/* Row 1 */}
                  <View style={[styles.taillightPill, { backgroundColor: '#22C55E' }]}>
                    <Text style={styles.taillightPillIcon}>💵</Text>
                    <Text style={styles.taillightPillText}>Lv.1</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.taillightPillIcon}>💵</Text>
                    <Text style={styles.taillightPillText}>Lv.21</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#06B6D4' }]}>
                    <Text style={styles.taillightPillIcon}>💰</Text>
                    <Text style={styles.taillightPillText}>Lv.41</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.taillightPillIcon}>💰</Text>
                    <Text style={styles.taillightPillText}>Lv.61</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.taillightPillIcon}>👑</Text>
                    <Text style={styles.taillightPillText}>Lv.81</Text>
                  </View>

                  {/* Row 2 */}
                  <View style={[styles.taillightPill, { backgroundColor: '#EC4899' }]}>
                    <Text style={styles.taillightPillIcon}>👑</Text>
                    <Text style={styles.taillightPillText}>Lv.101</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#D946EF' }]}>
                    <Text style={styles.taillightPillIcon}>🔥</Text>
                    <Text style={styles.taillightPillText}>Lv.121</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#E11D48' }]}>
                    <Text style={styles.taillightPillIcon}>🔥</Text>
                    <Text style={styles.taillightPillText}>Lv.141</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#EA580C' }]}>
                    <Text style={styles.taillightPillIcon}>✨</Text>
                    <Text style={styles.taillightPillText}>Lv.161</Text>
                  </View>
                  <View style={[styles.taillightPill, { backgroundColor: '#DC2626' }]}>
                    <Text style={styles.taillightPillIcon}>⚡</Text>
                    <Text style={styles.taillightPillText}>Lv.181</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2. Badge Reward Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>
                <T>Badge reward</T>
              </Text>
              <Text style={styles.sectionSubtitle}>
                <T>Higher level, more honorable badge</T>
              </Text>

              <View style={styles.badgeRewardCard}>
                {/* Badge 1: Lv.50 - 99 */}
                <View style={styles.badgeItem}>
                  <View style={styles.crestBadgeCircle}>
                    <Text style={styles.crestBadgeEmoji}>🎖️</Text>
                    <View style={styles.crestLabelPill}>
                      <Text style={styles.crestLabelPillText}>Lv.50</Text>
                    </View>
                  </View>
                  <Text style={styles.badgeTierRangeText}>Lv.50 - 99</Text>
                </View>

                {/* Badge 2: Lv.100 - 149 */}
                <View style={styles.badgeItem}>
                  <View style={styles.crestBadgeCircle}>
                    <Text style={styles.crestBadgeEmoji}>👑</Text>
                    <View style={[styles.crestLabelPill, { backgroundColor: '#D97706' }]}>
                      <Text style={styles.crestLabelPillText}>Lv.100</Text>
                    </View>
                  </View>
                  <Text style={styles.badgeTierRangeText}>Lv.100 - 149</Text>
                </View>

                {/* Badge 3: Lv.150 - 200 */}
                <View style={styles.badgeItem}>
                  <View style={styles.crestBadgeCircle}>
                    <Text style={styles.crestBadgeEmoji}>🏆</Text>
                    <View style={[styles.crestLabelPill, { backgroundColor: '#DC2626' }]}>
                      <Text style={styles.crestLabelPillText}>Lv.150</Text>
                    </View>
                  </View>
                  <Text style={styles.badgeTierRangeText}>Lv.150 - 200</Text>
                </View>
              </View>
            </View>

            {/* 3. How to Upgrade Section */}
            <View style={styles.sectionBlock}>
              <Text style={styles.upgradeSectionHeader}>
                <T>How to upgrade</T>
              </Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoBullet}>💎</Text>
                  <Text style={styles.infoText}>
                    <T>Recharge coins or send gifts in rooms to earn Fortune EXP and level up.</T>
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoBullet}>✨</Text>
                  <Text style={styles.infoText}>
                    1 Coin = 1 Fortune EXP. Higher fortune unlocks prestigious badges & entry privileges.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* ═════════ TAB 2: USER LEVEL CONTENT (SCREENSHOT 2) ═════════ */
          <View style={styles.sectionsWrapper}>
            {/* Current Level Status Card */}
            <View style={styles.tierStatusCard}>
              <View style={styles.tierHeaderRow}>
                <View style={[styles.tierBadgePill, { backgroundColor: userTier.bg, borderColor: userTier.border }]}>
                  <Text style={styles.tierBadgeStar}>⭐</Text>
                  <Text style={[styles.tierBadgeText, { color: userTier.color }]}>
                    Lv.{userProgress.currentLevel} • <T>{userTier.name}</T>
                  </Text>
                </View>

                <Text style={styles.tierPercentText}>{userProgress.percent}%</Text>
              </View>

              <Text style={styles.tierExpNeededText}>
                <Text style={styles.tierExpHighlight}>
                  {Number(userProgress.expNeeded).toLocaleString()} EXP
                </Text>{' '}
                <T>needed to reach</T>{' '}
                <Text style={[styles.tierExpHighlight, { color: '#2563EB' }]}>
                  Lv.{userProgress.nextLevel}
                </Text>
              </Text>
            </View>

            {/* Daily EXP Activity Card */}
            <View style={styles.dailyExpCard}>
              <View style={styles.dailyExpHeaderRow}>
                <Text style={styles.dailyExpCardTitle}>
                  <T>Daily EXP Limit</T>
                </Text>
                <Text style={styles.dailyExpCardNumbers}>
                  {todayExp} / {todayExpCap.toLocaleString()} EXP
                </Text>
              </View>
              <View style={styles.dailyExpBarTrack}>
                <View
                  style={[
                    styles.dailyExpBarFill,
                    { width: `${todayExpPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* How to Earn EXP Section (Cleanly replaces rewards grid as requested) */}
            <View style={styles.sectionBlock}>
              <Text style={styles.upgradeSectionHeader}>
                <T>How to earn EXP</T>
              </Text>
              <View style={styles.infoCard}>
                <View style={styles.earnExpRow}>
                  <View style={styles.earnExpIconWrap}>
                    <Text style={{ fontSize: 20 }}>🎙️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.earnExpTitle}>
                      <T>Stay in voice rooms</T>
                    </Text>
                    <Text style={styles.earnExpSubtitle}>+10 EXP / minute</Text>
                  </View>
                </View>

                <View style={styles.earnExpDivider} />

                <View style={styles.earnExpRow}>
                  <View style={styles.earnExpIconWrap}>
                    <Text style={{ fontSize: 20 }}>💬</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.earnExpTitle}>
                      <T>Chat with friends in rooms</T>
                    </Text>
                    <Text style={styles.earnExpSubtitle}>+5 EXP / message</Text>
                  </View>
                </View>

                <View style={styles.earnExpDivider} />

                <View style={styles.earnExpRow}>
                  <View style={styles.earnExpIconWrap}>
                    <Text style={{ fontSize: 20 }}>🎁</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.earnExpTitle}>
                      <T>Send gifts to streamers</T>
                    </Text>
                    <Text style={styles.earnExpSubtitle}>+1 EXP / 1 Coin sent</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header Styles
  headerContainer: {
    paddingBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  headerWatermark: {
    position: 'absolute',
    right: -10,
    top: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTabsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  headerTabItem: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerTabText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 16.5,
    fontWeight: '600',
  },
  headerTabTextActive: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  // Today's EXP on top-left of User level header
  todayExpWrap: {
    position: 'absolute',
    left: 18,
    top: 70,
    zIndex: 5,
  },
  todayExpTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayExpTrack: {
    width: 72,
    height: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  todayExpFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  todayExpNumbers: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // 2. Avatar & Ribbon
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  avatarCircleWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    backgroundColor: '#1E1E2D',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  // Ribbon Banner below avatar
  ribbonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    zIndex: 10,
  },
  ribbonTailLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ribbonTailRight: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ribbonCenter: {
    paddingHorizontal: 16,
    paddingVertical: 3.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // 3. Progress Container in Header
  progressContainer: {
    paddingHorizontal: 22,
    marginTop: 6,
  },
  metricNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  metricNumbersText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  levelMarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  levelMarkerText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // 4. Body Content
  bodyScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  sectionsWrapper: {
    width: '100%',
  },
  sectionBlock: {
    marginBottom: 26,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 14,
  },

  // Taillight Card (Screenshot 1)
  taillightCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taillightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  taillightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 14,
    minWidth: '18%',
    justifyContent: 'center',
    gap: 3,
  },
  taillightPillIcon: {
    fontSize: 10,
  },
  taillightPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },

  // Badge Reward Card (Screenshot 1)
  badgeRewardCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  crestBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  crestBadgeEmoji: {
    fontSize: 32,
  },
  crestLabelPill: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  crestLabelPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  badgeTierRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },

  // Upgrade / How to Section
  upgradeSectionHeader: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  infoBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },

  // User Level: Tier Status Card
  tierStatusCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 18,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tierBadgeStar: {
    fontSize: 12,
    marginRight: 4,
  },
  tierBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  tierPercentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284C7',
  },
  tierExpNeededText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  tierExpHighlight: {
    fontWeight: '800',
    color: '#0F172A',
  },

  // User Level: Daily EXP Activity Card
  dailyExpCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 22,
  },
  dailyExpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyExpCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  dailyExpCardNumbers: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  dailyExpBarTrack: {
    width: '100%',
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  dailyExpBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },

  // How to Earn EXP Actions
  earnExpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  earnExpIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  earnExpTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  earnExpSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  earnExpDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
});

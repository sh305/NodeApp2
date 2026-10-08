import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Polygon } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';
import api from '../api/client';

// 1. Right Chevron Arrow
const ChevronRight = ({ size = 18, color = '#C7C7CC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5L16 12L9 19"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 2. Up/Down Chevron for Games Collapse
const ChevronToggle = ({ isUp = true, size = 20, color = '#8E8E93' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={isUp ? 'M6 15L12 9L18 15' : 'M6 9L12 15L18 9'}
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 3. Shiny Gold Coin Icon
const ShinyGoldCoin = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#FFC107" stroke="#FFA000" strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="7.5" fill="#FFD54F" />
    <Path
      d="M12 7V17M10 9H13.5C14.3 9 15 9.7 15 10.5C15 11.3 14.3 12 13.5 12H10.5C9.7 12 9 12.7 9 13.5C9 14.3 9.7 15 10.5 15H14"
      stroke="#B78103"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </Svg>
);

// 4. List Menu Icons (Authentic YoYo Silhouettes)
const MenuIcon = ({ type, color = '#2C3E50', size = 22 }) => {
  switch (type) {
    case 'verification':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L4 5V11C4 16.5 7.4 21.6 12 23C16.6 21.6 20 16.5 20 11V5L12 2Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12L11 14L15 10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'store':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9L4.5 4H19.5L21 9V10C21 11.7 19.7 13 18 13C16.3 13 15 11.7 15 10C15 11.7 13.7 13 12 13C10.3 13 9 11.7 9 10C9 11.7 7.7 13 6 13C4.3 13 3 11.7 3 10V9Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path
            d="M5 13V20H19V13"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path d="M10 20V16H14V20" stroke={color} strokeWidth="1.8" />
        </Svg>
      );
    case 'badge':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="1.8" />
          <Circle cx="12" cy="9" r="2.5" fill={color} />
          <Path
            d="M8.5 14L7 21L12 18.5L17 21L15.5 14"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'title':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3L14.7 8.5L20.8 9.4L16.4 13.7L17.4 19.8L12 16.9L6.6 19.8L7.6 13.7L3.2 9.4L9.3 8.5L12 3Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'tools':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6"
            stroke={color}
            strokeWidth="1.8"
          />
          <Rect x="4" y="6" width="16" height="15" rx="3" stroke={color} strokeWidth="1.8" />
          <Path d="M4 11H20" stroke={color} strokeWidth="1.8" />
          <Path d="M10 11V13H14V11" stroke={color} strokeWidth="1.8" />
        </Svg>
      );
    case 'level':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.8" />
          <Path
            d="M7 10V14H9.5M12 10L13.5 14L15 10"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'coupon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 8C3 7 4 6 5 6H19C20 6 21 7 21 8V10C19.9 10 19 10.9 19 12C19 13.1 19.9 14 21 14V16C21 17 20 18 19 18H5C4 18 3 17 3 16V14C4.1 14 5 13.1 5 12C5 10.9 4.1 10 3 10V8Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path d="M12 9V15" stroke={color} strokeWidth="1.8" strokeDasharray="2 2" />
        </Svg>
      );
    case 'help':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 11.5C20 16 16.2 19.5 12 19.5C10.5 19.5 9.1 19.1 7.9 18.3L4 19.5L5.2 15.9C4.4 14.6 4 13.1 4 11.5C4 7 7.8 3.5 12 3.5C16.2 3.5 20 7 20 11.5Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path
            d="M10.5 9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5C13.5 10.5 12 11 12 12M12 15H12.01"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'setting':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
          <Path
            d="M19.4 15A1.65 1.65 0 0 0 19.7 16.8L19.8 16.9C20.1 17.5 19.7 18.2 19.1 18.4L17.7 18.9C17.1 19.1 16.4 18.8 16.1 18.2L16 18.1A1.65 1.65 0 0 0 14.2 17.4A1.65 1.65 0 0 0 13 18.9V19.1C13 19.8 12.4 20.3 11.7 20.3H10.3C9.6 20.3 9 19.8 9 19.1V18.9A1.65 1.65 0 0 0 7.8 17.4A1.65 1.65 0 0 0 6 18.1L5.9 18.2C5.6 18.8 4.9 19.1 4.3 18.9L2.9 18.4C2.3 18.2 1.9 17.5 2.2 16.9L2.3 16.8A1.65 1.65 0 0 0 2.6 15A1.65 1.65 0 0 0 1.1 13.8H0.9C0.2 13.8 -0.3 13.2 -0.3 12.5V11.1C-0.3 10.4 0.2 9.8 0.9 9.8H1.1A1.65 1.65 0 0 0 2.6 8.6A1.65 1.65 0 0 0 2.3 6.8L2.2 6.7C1.9 6.1 2.3 5.4 2.9 5.2L4.3 4.7C4.9 4.5 5.6 4.8 5.9 5.4L6 5.5A1.65 1.65 0 0 0 7.8 6.2A1.65 1.65 0 0 0 9 4.7V4.5C9 3.8 9.6 3.3 10.3 3.3H11.7C12.4 3.3 13 3.8 13 4.5V4.7A1.65 1.65 0 0 0 14.2 6.2A1.65 1.65 0 0 0 16 5.5L16.1 5.4C16.4 4.8 17.1 4.5 17.7 4.7L19.1 5.2C19.7 5.4 20.1 6.1 19.8 6.7L19.7 6.8A1.65 1.65 0 0 0 19.4 8.6A1.65 1.65 0 0 0 20.9 9.8H21.1C21.8 9.8 22.3 10.4 22.3 11.1V12.5C22.3 13.2 21.8 13.8 21.1 13.8H20.9A1.65 1.65 0 0 0 19.4 15Z"
            stroke={color}
            strokeWidth="1.8"
          />
        </Svg>
      );
    case 'confirmMoney':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8" />
          <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.8" />
          <Path d="M6 12H6.01M18 12H18.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
};

export default function MeProfileView({
  currentUser,
  myProfile,
  insets,
  onRefreshProfile,
  onOpenTasks,
  hasClaimableTasks = false,
  navigation,
  onLogout,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [isGamesExpanded, setIsGamesExpanded] = useState(true);

  const [profile, setProfile] = useState(myProfile || currentUser);

  const fetchProfile = async () => {
    try {
      const uid = currentUser?._id || currentUser?.id;
      if (!uid) return;
      const res = await api.get(`/users/${uid}/profile`);
      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
      }
    } catch (e) {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser?._id, currentUser?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    if (onRefreshProfile) {
      await onRefreshProfile();
    }
    setRefreshing(false);
  };

  const toggleGamesCollapse = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {
      // Ignore layout animation error on unsupported architecture
    }
    setIsGamesExpanded((prev) => !prev);
  };

  const handleMenuClick = (menuKey, menuTitle) => {
    if (menuKey === 'setting') {
      if (onLogout) {
        onLogout();
      } else {
        showToast(t('Settings opened'), 'info');
      }
      return;
    }
    if (menuKey === 'task') {
      if (onOpenTasks) onOpenTasks();
      return;
    }
    if (menuKey === 'confirmMoney') {
      if (navigation?.navigate) {
        navigation.navigate('ConfirmMoney');
      } else {
        showToast(t('Confirm Money'), 'info');
      }
      return;
    }
    // Generic polite feedback for other items as requested by user
    showToast(t(`${menuTitle} coming soon`), 'info');
  };

  // Format stats display (defaults to '0')
  const formatStat = (count) => {
    if (count === undefined || count === null || count === 0) return '0';
    const num = Number(count);
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return String(num);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 95 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#00C853']}
          tintColor="#00C853"
        />
      }
    >
      {/* 1. TOP USER PROFILE HEADER */}
      <TouchableOpacity
        style={[styles.profileHeaderRow, { paddingTop: Math.max(16, insets.top) }]}
        activeOpacity={0.8}
        onPress={() => {
          const uid = profile?._id || profile?.id || currentUser?._id || currentUser?.id;
          if (navigation?.navigate) {
            navigation.navigate('UserProfile', { userId: uid });
          } else {
            showToast(t('View & Edit Profile'), 'info');
          }
        }}
      >
        {/* User Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                profile?.avatar ||
                currentUser?.avatar ||
                'https://api.dicebear.com/7.x/bottts/png?seed=' +
                  encodeURIComponent(profile?.name || currentUser?.name || 'User'),
            }}
            style={styles.avatarImg}
          />
        </View>

        {/* User Name & Subtitle */}
        <View style={styles.profileInfoWrap}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile?.name || currentUser?.name || t('User')}
          </Text>
          <Text style={styles.profileSubtitle}>{t('View & Edit Profile')}</Text>
        </View>

        {/* Right Arrow */}
        <ChevronRight size={22} color="#C7C7CC" />
      </TouchableOpacity>

      {/* 2. STATS ROW (Followers, Following, Gifts, Received, Visitors - Defaults to 0) */}
      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statItem}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('UserRelations', { type: 'followers', userId: profile?._id })}
        >
          <Text style={styles.statNumber}>
            {formatStat(profile?.followersCount ?? profile?.followers?.length ?? 0)}
          </Text>
          <Text style={styles.statLabel}>{t('Followers')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('UserRelations', { type: 'following', userId: profile?._id })}
        >
          <Text style={styles.statNumber}>
            {formatStat(profile?.followingCount ?? profile?.following?.length ?? 0)}
          </Text>
          <Text style={styles.statLabel}>{t('Following')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          activeOpacity={0.75}
          onPress={() => showToast(t('Gifts sent: ') + (profile?.giftsSent ?? 0), 'info')}
        >
          <Text style={styles.statNumber}>
            {formatStat(profile?.giftsSent ?? 0)}
          </Text>
          <Text style={styles.statLabel}>{t('Gifts')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          activeOpacity={0.75}
          onPress={() => showToast(t('Gifts received: ') + (profile?.giftsReceived ?? 0), 'info')}
        >
          <Text style={styles.statNumber}>
            {formatStat(profile?.giftsReceived ?? 0)}
          </Text>
          <Text style={styles.statLabel}>{t('Received')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate('UserRelations', { type: 'visitors', userId: profile?._id })}
        >
          <Text style={styles.statNumber}>
            {formatStat(profile?.visitorsCount ?? profile?.visitors?.length ?? 0)}
          </Text>
          <Text style={styles.statLabel}>{t('Visitors')}</Text>
        </TouchableOpacity>
      </View>

      {/* 3. WALLET CARD */}
      <TouchableOpacity
        style={styles.walletCard}
        activeOpacity={0.8}
        onPress={() => navigation?.navigate('Wallet')}
      >
        <View style={styles.walletLeftGroup}>
          <Text style={styles.walletIconEmoji}>👝</Text>
          <Text style={styles.walletTitle}>{t('Wallet')}</Text>
        </View>

        <View style={styles.walletRightGroup}>
          <ShinyGoldCoin size={20} />
          <Text style={styles.walletCoinsText}>
            {profile?.coins ?? currentUser?.coins ?? 1}
          </Text>
          <ChevronRight size={18} color="#C7C7CC" />
        </View>
      </TouchableOpacity>

      {/* 4. VIP/SVIP & NOBLE ROW (SIDE-BY-SIDE CARDS) */}
      <View style={styles.vipNobleRow}>
        {/* Card 1: VIP/SVIP */}
        <TouchableOpacity
          style={styles.vipCard}
          activeOpacity={0.85}
          onPress={() => showToast(t('VIP/SVIP Subscriptions'), 'info')}
        >
          <LinearGradient
            colors={['#FFF1DA', '#FFE2B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipNobleGradient}
          >
            <View style={styles.vipNobleTextWrap}>
              <Text style={styles.vipTitle}>{t('VIP/SVIP')}</Text>
              <Text style={styles.vipSubtitle}>{t('Subscription')}</Text>
            </View>
            <Text style={styles.crownArtEmoji}>👑</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Card 2: Noble */}
        <TouchableOpacity
          style={styles.nobleCard}
          activeOpacity={0.85}
          onPress={() => showToast(t('Noble Privileges'), 'info')}
        >
          <LinearGradient
            colors={['#E5F1FF', '#C8E3FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipNobleGradient}
          >
            <View style={styles.vipNobleTextWrap}>
              <Text style={styles.nobleTitle}>{t('Noble')}</Text>
              <Text style={styles.nobleSubtitle}>{t('Activate')}</Text>
            </View>
            <Text style={styles.shieldArtEmoji}>🛡️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 5. COMMON FUNCTIONS CARD */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>{t('Common Functions')}</Text>
        <View style={styles.commonFuncGrid}>
          {/* Function 1: Income */}
          <TouchableOpacity
            style={styles.funcItem}
            activeOpacity={0.75}
            onPress={() => handleMenuClick('income', 'Income')}
          >
            <View style={[styles.funcSquircle, { backgroundColor: '#FFF9E6' }]}>
              <Text style={styles.funcIconEmoji}>🤲</Text>
            </View>
            <Text style={styles.funcLabel}>{t('Income')}</Text>
          </TouchableOpacity>

          {/* Function 2: Task (Opens PersonalTasksModal + Red Dot Notification) */}
          <TouchableOpacity
            style={styles.funcItem}
            activeOpacity={0.75}
            onPress={() => {
              if (onOpenTasks) onOpenTasks();
            }}
          >
            <View style={[styles.funcSquircle, { backgroundColor: '#E8F8F0' }]}>
              <Text style={styles.funcIconEmoji}>📋</Text>
              {/* Red Notification Dot on Task - only shown when user has completed unclaimed tasks */}
              {hasClaimableTasks && <View style={styles.taskRedBadge} />}
            </View>
            <Text style={styles.funcLabel}>{t('Task')}</Text>
          </TouchableOpacity>

          {/* Function 3: Couple */}
          <TouchableOpacity
            style={styles.funcItem}
            activeOpacity={0.75}
            onPress={() => handleMenuClick('couple', 'Couple')}
          >
            <View style={[styles.funcSquircle, { backgroundColor: '#FCE4EC' }]}>
              <Text style={styles.funcIconEmoji}>💕</Text>
            </View>
            <Text style={styles.funcLabel}>{t('Couple')}</Text>
          </TouchableOpacity>

          {/* Function 4: Family */}
          <TouchableOpacity
            style={styles.funcItem}
            activeOpacity={0.75}
            onPress={() => handleMenuClick('family', 'Family')}
          >
            <View style={[styles.funcSquircle, { backgroundColor: '#EDE7F6' }]}>
              <Text style={styles.funcIconEmoji}>🛡️</Text>
            </View>
            <Text style={styles.funcLabel}>{t('Family')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. YOYO JUDGE REVIEW BANNER */}
      <TouchableOpacity
        style={styles.judgeBanner}
        activeOpacity={0.8}
        onPress={() => handleMenuClick('judge', 'YoYo judge review')}
      >
        <Text style={styles.judgeText}>{t('YoYo judge review')}</Text>
        <ChevronRight size={18} color="#4CAF50" />
      </TouchableOpacity>


      {/* 8. LIST MENU CARD (VERIFICATION, STORE, BADGE, TOOLS, ETC.) */}
      <View style={styles.menuListCard}>
        {[
          { key: 'verification', title: 'Verification Center', icon: 'verification' },
          { key: 'store', title: 'Store', icon: 'store' },
          { key: 'badge', title: 'Badge', icon: 'badge' },
          { key: 'title', title: 'Title', icon: 'title' },
          { key: 'tools', title: 'Tools', icon: 'tools' },
          { key: 'level', title: 'Level', icon: 'level' },
          { key: 'coupon', title: 'Coupon', icon: 'coupon' },
          { key: 'help', title: 'Help', icon: 'help' },
          { key: 'setting', title: 'Setting', icon: 'setting' },
          { key: 'confirmMoney', title: 'Confirm Money', icon: 'confirmMoney' },
        ].map((item, index, arr) => (
          <React.Fragment key={item.key}>
            <TouchableOpacity
              style={styles.menuRowItem}
              activeOpacity={0.7}
              onPress={() => handleMenuClick(item.key, item.title)}
            >
              <View style={styles.menuRowLeft}>
                <MenuIcon type={item.icon} size={22} color="#1C1C1E" />
                <Text style={styles.menuRowTitle}>{t(item.title)}</Text>
              </View>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>
            {index < arr.length - 1 && <View style={styles.menuRowDivider} />}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },

  // 1. Profile Header
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#F5F6FA',
  },
  avatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileInfoWrap: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // 2. Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11.2,
    fontWeight: '500',
    color: '#8E8E93',
  },

  // 3. Wallet Card
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  walletLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  walletRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletCoinsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  // 4. VIP & Noble Row
  vipNobleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  vipCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#FFB300',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  nobleCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#1976D2',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  vipNobleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 74,
  },
  vipNobleTextWrap: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5D3A1A',
    marginBottom: 2,
  },
  vipSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8D603A',
  },
  crownArtEmoji: {
    fontSize: 32,
  },
  nobleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15488C',
    marginBottom: 2,
  },
  nobleSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B709F',
  },
  shieldArtEmoji: {
    fontSize: 30,
  },

  // 5. Common Functions Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  commonFuncGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  funcItem: {
    alignItems: 'center',
    flex: 1,
  },
  funcSquircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  funcIconEmoji: {
    fontSize: 26,
  },
  taskRedBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2442',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  funcLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },

  // 6. YoYo Judge Review Banner
  judgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F6EF',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
  },
  judgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F7A4C',
  },

  // 7. Games Grid
  gamesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  gamesEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  gamesEmptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gamesEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  gamesEmptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // 8. List Menu Card
  menuListCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 14,
  },
  menuRowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F5',
    marginLeft: 52,
  },
});

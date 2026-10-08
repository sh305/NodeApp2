import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

// Top Back Arrow (<)
const BackChevron = ({ size = 26, color = '#1A1A1A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Format relative time (e.g. "7 hours ago", "13 days ago")
const formatTimeAgo = (date) => {
  if (!date) return 'Recently';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

// Recharge Level Badge ($ Lv.X) - matching Screenshot 1 & 2
const RechargeLevelBadge = ({ level = 1 }) => (
  <View style={styles.rechargeBadge}>
    <View style={styles.dollarCircle}>
      <Text style={styles.dollarSymbol}>$</Text>
    </View>
    <Text style={styles.rechargeLevelText}>Lv.{level}</Text>
  </View>
);

// User Level Badge (Lv.X) - matching Screenshot 1, 2, 3
const UserLevelBadge = ({ level = 1 }) => {
  const bg = level >= 50 ? '#8B5CF6' : level >= 25 ? '#38BDF8' : '#60A5FA';
  return (
    <View style={[styles.userLevelBadge, { backgroundColor: bg }]}>
      <Text style={styles.userLevelText}>Lv.{level}</Text>
    </View>
  );
};

export default function UserRelationsScreen({ route, navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const type = route.params?.type || 'followers'; // 'followers' | 'following' | 'visitors'
  const targetUserId = route.params?.userId || currentUser?._id || currentUser?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Title matching user screenshots
  const screenTitle =
    type === 'followers'
      ? t('Followers')
      : type === 'following'
      ? t('Following')
      : t('Visitors within 15 days');

  const fetchUsers = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const endpoint =
        type === 'followers'
          ? `/users/${targetUserId}/followers`
          : type === 'following'
          ? `/users/${targetUserId}/following`
          : `/users/${targetUserId}/visitors`;

      const res = await api.get(endpoint);
      if (res.data.success) {
        setUsers(res.data.users || res.data.visitors || []);
      }
    } catch (error) {
      console.error(`Fetch ${type} error:`, error);
      showToast(t('Failed to load list'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, targetUserId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Toggle follow action
  const handleToggleFollow = async (item) => {
    const isSelf =
      (currentUser?._id && currentUser._id.toString() === item._id?.toString()) ||
      (currentUser?.id && currentUser.id.toString() === item._id?.toString());
    if (isSelf) return;

    setActionLoadingId(item._id);
    try {
      const res = await api.post(`/users/${item._id}/follow`);
      if (res.data.success) {
        const nowFollowing = !!res.data.following;

        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === item._id) {
              const updatedFollowing = nowFollowing;
              const updatedMutual = updatedFollowing && !!u.isFollowedBy;
              return {
                ...u,
                isFollowing: updatedFollowing,
                isMutual: updatedMutual,
              };
            }
            return u;
          })
        );

        showToast(
          nowFollowing ? t('Followed successfully') : t('Unfollowed successfully'),
          'success'
        );
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      showToast(t('Action failed'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActionPress = (item) => {
    // If currently following (or mutual), confirm before unfollowing
    if (item.isFollowing) {
      Alert.alert(
        t('Unfollow'),
        t(`Are you sure you want to unfollow ${item.name || 'this user'}?`),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Unfollow'),
            style: 'destructive',
            onPress: () => handleToggleFollow(item),
          },
        ]
      );
    } else {
      handleToggleFollow(item);
    }
  };

  const handleNavigateProfile = (userId) => {
    if (userId) {
      navigation.push('UserProfile', { userId });
    }
  };

  const renderItem = ({ item }) => {
    const isSelf =
      (currentUser?._id && currentUser._id.toString() === item._id?.toString()) ||
      (currentUser?.id && currentUser.id.toString() === item._id?.toString());
    const isActionLoading = actionLoadingId === item._id;

    // Determine button label and appearance
    let buttonLabel = t('Follow');
    let isMutual = !!item.isMutual;
    let isFollowing = !!item.isFollowing;

    if (isMutual) {
      buttonLabel = t('Mutual Followed');
    } else if (isFollowing) {
      buttonLabel = t('Following');
    } else {
      buttonLabel = t('Follow');
    }

    const isGreenFollow = !isFollowing && !isMutual;

    return (
      <View style={styles.userRow}>
        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleNavigateProfile(item._id)}
          style={styles.avatarWrap}
        >
          <Image
            source={{
              uri:
                item.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.avatarImg}
          />
        </TouchableOpacity>

        {/* User Details */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleNavigateProfile(item._id)}
          style={styles.infoCol}
        >
          {/* User Name */}
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || 'User'}
          </Text>

          {/* Type-Specific Sub-Rows */}
          {type === 'visitors' ? (
            // Visitors view (Screenshot 3): Level badge, then time ago
            <View style={styles.visitorMetaCol}>
              <View style={styles.badgesRow}>
                <UserLevelBadge level={item.charmLevel || item.userLevel || 1} />
              </View>
              <Text style={styles.timeAgoText}>
                {formatTimeAgo(item.visitedAt)}
              </Text>
            </View>
          ) : (
            // Followers & Following views (Screenshot 1 & 2): Recharge level ($), User level, then Bio
            <View style={styles.detailsCol}>
              <View style={styles.badgesRow}>
                <RechargeLevelBadge level={item.wealthLevel || 1} />
                <UserLevelBadge level={item.charmLevel || item.userLevel || 1} />
              </View>
              {item.signature ? (
                <Text style={styles.bioText} numberOfLines={1}>
                  {item.signature}
                </Text>
              ) : null}
            </View>
          )}
        </TouchableOpacity>

        {/* Action Button (Right Side) */}
        {!isSelf && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isGreenFollow ? styles.actionBtnFollow : styles.actionBtnGray,
            ]}
            activeOpacity={0.75}
            onPress={() => handleActionPress(item)}
            disabled={isActionLoading}
          >
            {isActionLoading ? (
              <ActivityIndicator
                size="small"
                color={isGreenFollow ? '#10B981' : '#6B7280'}
              />
            ) : (
              <Text
                style={[
                  styles.actionBtnText,
                  isGreenFollow
                    ? styles.actionBtnTextFollow
                    : styles.actionBtnTextGray,
                ]}
              >
                {buttonLabel}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getEmptyMessage = () => {
    if (type === 'followers') return t('No followers yet');
    if (type === 'following') return t('Not following anyone yet');
    return t('No visitors within the last 15 days');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackChevron size={26} color="#1A1A1A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {screenTitle}
        </Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366F1']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            </View>
          }
          showsVerticalScrollIndicator
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  listContent: {
    paddingTop: 8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    paddingTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },

  // User Row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  detailsCol: {
    flexDirection: 'column',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },

  // Badges
  rechargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#84CC16',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 6,
  },
  dollarCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  dollarSymbol: {
    fontSize: 9,
    fontWeight: '900',
    color: '#84CC16',
    lineHeight: 11,
  },
  rechargeLevelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userLevelBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLevelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Bio / Signature
  bioText: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 1,
  },

  // Visitors Meta
  visitorMetaCol: {
    flexDirection: 'column',
  },
  timeAgoText: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },

  // Action Buttons
  actionBtn: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnFollow: {
    borderWidth: 1.2,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
  },
  actionBtnGray: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextFollow: {
    color: '#10B981',
  },
  actionBtnTextGray: {
    color: '#6B7280',
    fontWeight: '500',
  },
});

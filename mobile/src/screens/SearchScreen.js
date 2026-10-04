import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

export default function SearchScreen({ route, navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const initialQuery = route.params?.initialQuery || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'User' | 'Room' | 'Family'
  const [loading, setLoading] = useState(false);

  // Search Results
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [families, setFamilies] = useState([]);

  // Local follow state tracking { [userId]: boolean }
  const [followingMap, setFollowingMap] = useState({});
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  const searchTimerRef = useRef(null);

  const fetchSearchResults = useCallback(
    async (searchKeyword, targetType) => {
      setLoading(true);
      try {
        const typeParam = targetType ? targetType.toLowerCase() : 'all';
        const res = await api.get('/search', {
          params: {
            q: searchKeyword,
            type: typeParam,
          },
        });

        if (res.data.success) {
          setUsers(res.data.users || []);
          setRooms(res.data.rooms || []);
          setFamilies(res.data.families || []);

          // Sync initial following map from backend response
          const map = {};
          (res.data.users || []).forEach((u) => {
            map[u._id] = Boolean(u.isFollowing);
          });
          setFollowingMap((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error('Search request error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-search on query change with debounce
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      fetchSearchResults(query, activeTab);
    }, 280);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, activeTab, fetchSearchResults]);

  // Handle follow/unfollow user
  const handleToggleFollow = async (user) => {
    if (!currentUser) {
      showToast(t('Please login first'), 'info');
      return;
    }
    if (user.isSelf) {
      showToast(t('You cannot follow yourself'), 'info');
      return;
    }

    const userId = user._id;
    const isCurrentlyFollowing = Boolean(followingMap[userId]);

    // Optimistic UI update
    setFollowingMap((prev) => ({
      ...prev,
      [userId]: !isCurrentlyFollowing,
    }));
    setFollowLoadingMap((prev) => ({ ...prev, [userId]: true }));

    try {
      const res = await api.post(`/users/${userId}/follow`);
      if (res.data.success) {
        setFollowingMap((prev) => ({
          ...prev,
          [userId]: res.data.following,
        }));
        showToast(
          res.data.following ? t('Followed successfully') : t('Unfollowed successfully'),
          'success'
        );
      }
    } catch (err) {
      // Revert optimistic update
      setFollowingMap((prev) => ({
        ...prev,
        [userId]: isCurrentlyFollowing,
      }));
      showToast(t('Failed to update follow status'), 'error');
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Navigate to User Profile
  const handleOpenUserProfile = (user) => {
    Keyboard.dismiss();
    navigation.navigate('UserProfile', { userId: user._id });
  };

  // Navigate to Voice Room
  const handleOpenRoom = (room) => {
    Keyboard.dismiss();
    navigation.navigate('VoiceRoom', {
      roomId: room._id,
      roomTitle: room.title,
    });
  };

  // Handle Family Join Click
  const handleFamilyJoin = (family) => {
    // Disabled as requested by user
    showToast(t('Family feature coming soon!'), 'info');
  };

  // Render a User Item (Used in All and User tab)
  const renderUserItem = (item) => {
    const isFollowing = Boolean(followingMap[item._id]);
    const isFollowLoading = Boolean(followLoadingMap[item._id]);

    return (
      <TouchableOpacity
        key={`user_${item._id}`}
        style={styles.userCard}
        activeOpacity={0.8}
        onPress={() => handleOpenUserProfile(item)}
      >
        {/* Avatar */}
        <Image
          source={{
            uri:
              item.avatar ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          }}
          style={styles.userAvatar}
        />

        {/* Info */}
        <View style={styles.userInfoCol}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.userSubRow}>
            {/* Level Pill */}
            <View style={styles.userLevelPill}>
              <Text style={styles.userLevelText}>Lv.{item.wealthLevel || 1}</Text>
            </View>
            <Text style={styles.userIdText}>ID: {item.displayId || '43051592'}</Text>
          </View>
        </View>

        {/* Follow Button */}
        {!item.isSelf && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing && styles.followingBtn,
            ]}
            activeOpacity={0.75}
            onPress={() => handleToggleFollow(item)}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? '#6B7280' : '#00D293'} />
            ) : (
              <Text
                style={[
                  styles.followBtnText,
                  isFollowing && styles.followingBtnText,
                ]}
              >
                {isFollowing ? <T>Following</T> : <T>Follow</T>}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Render a Room Item (Used in All and Room tab)
  const renderRoomItem = (item) => {
    return (
      <TouchableOpacity
        key={`room_${item._id}`}
        style={styles.roomCard}
        activeOpacity={0.82}
        onPress={() => handleOpenRoom(item)}
      >
        {/* Cover Image */}
        <Image
          source={{
            uri:
              item.coverImage ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
          }}
          style={styles.roomCover}
        />

        {/* Info Col */}
        <View style={styles.roomInfoCol}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.roomTopic} numberOfLines={1}>
            {item.topic || "Welcome, everyone! Let's chat and share the journey."}
          </Text>

          {/* Badges line matching Screenshot 4 */}
          <View style={styles.roomBadgesRow}>
            {/* Country Flag */}
            <Text style={styles.flagEmoji}>🇮🇳</Text>

            {/* Room Level Diamond Badge */}
            <View style={styles.roomLevelBadge}>
              <Text style={styles.roomLevelBadgeText}>{item.roomLevel || 1}</Text>
            </View>

            {/* Green Tag Pill */}
            <View style={styles.roomChatTag}>
              <Text style={styles.roomChatTagText}>💬 <T>Chat</T></Text>
            </View>

            {/* Room ID */}
            <Text style={styles.roomIdTag}>ID-{item.displayRoomId || '113256'}</Text>

            {/* Active Members Signal */}
            <View style={styles.roomSignalWrap}>
              <Text style={styles.roomSignalIcon}>📶</Text>
              <Text style={styles.roomSignalCount}>{item.activeMemberCount || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render a Family Item (Used in Family tab)
  const renderFamilyItem = (item) => {
    return (
      <View key={`family_${item._id}`} style={styles.familyCard}>
        {/* Family Avatar */}
        <Image source={{ uri: item.avatar }} style={styles.familyAvatar} />

        {/* Info Col */}
        <View style={styles.familyInfoCol}>
          <Text style={styles.familyName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.familySubRow}>
            <View style={styles.familyShieldBadge}>
              <Text style={styles.familyShieldText}>{item.badge}</Text>
            </View>
            <Text style={styles.familyMembersCount}>
              👥 {item.membersCount}/{item.maxMembers}
            </Text>
          </View>
          <Text style={styles.familyIdText}>ID-{item.familyId}</Text>
        </View>

        {/* Join Button (Disabled as requested) */}
        <TouchableOpacity
          style={styles.familyJoinBtn}
          activeOpacity={0.8}
          onPress={() => handleFamilyJoin(item)}
        >
          <Text style={styles.familyJoinBtnText}><T>Join</T></Text>
        </TouchableOpacity>
      </View>
    );
  };

  const tabs = ['All', 'User', 'Room', 'Family'];

  return (
    <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
      {/* ══ 1. TOP SEARCH HEADER ══ */}
      <View style={styles.headerRow}>
        {/* Back Arrow Button */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Search Input Box */}
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search rooms, stars, or friends...')}
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => fetchSearchResults(query, activeTab)}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setQuery('')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={styles.clearCircle}>
                <Text style={styles.clearIcon}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Icon / Trigger */}
        <TouchableOpacity
          style={styles.searchSubmitBtn}
          activeOpacity={0.75}
          onPress={() => fetchSearchResults(query, activeTab)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.searchSubmitEmoji}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* ══ 2. TABS BAR (All, User, Room, Family) ══ */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                <T>{tab}</T>
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Thin Divider */}
      <View style={styles.headerDivider} />

      {/* ══ 3. CONTENT AREA ══ */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D293" />
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentScrollInner,
            { paddingBottom: Math.max(30, insets.bottom + 16) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TAB 1: ALL */}
          {activeTab === 'All' && (
            <View>
              {/* Users Section (Top 3) */}
              {users.length > 0 && (
                <View style={styles.sectionWrap}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    activeOpacity={0.75}
                    onPress={() => setActiveTab('User')}
                  >
                    <Text style={styles.sectionTitle}><T>User</T></Text>
                    <Text style={styles.sectionChevron}>›</Text>
                  </TouchableOpacity>
                  {users.slice(0, 3).map(renderUserItem)}
                </View>
              )}

              {/* Rooms Section */}
              {rooms.length > 0 && (
                <View style={styles.sectionWrap}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    activeOpacity={0.75}
                    onPress={() => setActiveTab('Room')}
                  >
                    <Text style={styles.sectionTitle}><T>Room</T></Text>
                    <Text style={styles.sectionChevron}>›</Text>
                  </TouchableOpacity>
                  {rooms.slice(0, 4).map(renderRoomItem)}
                </View>
              )}

              {/* Empty state when query produces nothing */}
              {users.length === 0 && rooms.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={styles.emptyTitle}><T>No results found</T></Text>
                  <Text style={styles.emptySubtitle}>
                    <T>Try searching for a different user, room name, or ID</T>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: USER */}
          {activeTab === 'User' && (
            <View>
              {users.length > 0 ? (
                users.map(renderUserItem)
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyTitle}><T>No users found</T></Text>
                  <Text style={styles.emptySubtitle}>
                    <T>Try searching by user name or ID</T>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 3: ROOM */}
          {activeTab === 'Room' && (
            <View>
              {rooms.length > 0 ? (
                rooms.map(renderRoomItem)
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyEmoji}>🎙️</Text>
                  <Text style={styles.emptyTitle}><T>No rooms found</T></Text>
                  <Text style={styles.emptySubtitle}>
                    <T>Try searching with another keyword</T>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 4: FAMILY (Disabled as requested) */}
          {activeTab === 'Family' && (
            <View>
              {families.length > 0 ? (
                families.map(renderFamilyItem)
              ) : (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyEmoji}>🛡️</Text>
                  <Text style={styles.emptyTitle}><T>No families found</T></Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 32,
    fontWeight: '300',
    color: '#334155',
    lineHeight: 34,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    height: 40,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingLeft: 6,
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchSubmitBtn: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitEmoji: {
    fontSize: 20,
    color: '#334155',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 30,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00D293', // Mint green matching screenshot
    marginTop: 6,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionChevron: {
    fontSize: 22,
    fontWeight: '400',
    color: '#94A3B8',
  },

  /* ══ USER CARD (Screenshot 2 & 3) ══ */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  userInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLevelPill: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  userLevelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userIdText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  followBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00D293', // Mint green outline
    backgroundColor: '#FFFFFF',
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D293',
  },
  followingBtn: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  followingBtnText: {
    color: '#94A3B8',
  },

  /* ══ ROOM CARD (Screenshot 2 & 4) ══ */
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  roomCover: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  roomInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  roomTopic: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 6,
  },
  roomBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 14,
  },
  roomLevelBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomLevelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roomChatTag: {
    backgroundColor: '#00D293',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roomChatTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roomIdTag: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roomSignalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  roomSignalIcon: {
    fontSize: 11,
  },
  roomSignalCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },

  /* ══ FAMILY CARD (Screenshot 5) ══ */
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  familyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  familyInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  familyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  familySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  familyShieldBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  familyShieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  familyMembersCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  familyIdText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  familyJoinBtn: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#00D293', // Mint green button matching screenshot
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  familyJoinBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Empty state */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

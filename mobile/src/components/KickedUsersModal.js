import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import api from '../api/client';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

// Search Icon SVG
const SearchIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 20L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Back Chevron Icon SVG
const BackChevronIcon = ({ size = 22, color = '#FFFFFF' }) => (
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

// Default / Improper DP Placeholder SVG
const ImproperDpPlaceholder = () => (
  <View style={styles.improperDpBox}>
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8.5" cy="8.5" r="1.5" fill="#9CA3AF" />
      <Path
        d="M21 15L16 10L5 21"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
    <Text style={styles.improperDpText}>Improper{'\n'}DP</Text>
  </View>
);

export default function KickedUsersModal({
  visible,
  onClose,
  room,
  socketRef,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [kickedUsers, setKickedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unblockingIds, setUnblockingIds] = useState(new Set());

  const roomId = room?._id;

  // Fetch Kicked Users List from Backend API
  const fetchKickedUsers = useCallback(async (isPullRefresh = false) => {
    if (!roomId) return;
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(`/rooms/${roomId}/kicked-users`);
      if (res.data && res.data.success) {
        setKickedUsers(res.data.kickedUsers || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load kicked users';
      showToast(t(msg), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomId, showToast, t]);

  useEffect(() => {
    if (visible && roomId) {
      fetchKickedUsers();
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  }, [visible, roomId, fetchKickedUsers]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return kickedUsers;
    return kickedUsers.filter((item) => {
      const name = (item.user?.name || '').toLowerCase();
      const displayId = (item.displayId || '').toLowerCase();
      const kicker = (item.kickedByName || '').toLowerCase();
      return name.includes(q) || displayId.includes(q) || kicker.includes(q);
    });
  }, [kickedUsers, searchQuery]);

  // Handle Unblock Action
  const handleUnblock = async (item) => {
    const targetUserId = item._id;
    if (!targetUserId || unblockingIds.has(targetUserId)) return;

    setUnblockingIds((prev) => new Set(prev).add(targetUserId));

    try {
      const res = await api.post(`/rooms/${roomId}/unkick`, {
        targetUserId,
      });

      if (res.data && res.data.success) {
        showToast(t('User unblocked successfully'), 'success');

        // Remove from local list immediately
        setKickedUsers((prev) => prev.filter((u) => u._id !== targetUserId));

        // Notify socket real-time if connected
        if (socketRef && socketRef.current) {
          socketRef.current.emit('notify_user_unkicked', {
            roomId,
            targetUserId,
          });
        }
      } else {
        showToast(t(res.data?.message || 'Failed to unblock user'), 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to unblock user';
      showToast(t(errMsg), 'error');
    } finally {
      setUnblockingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const renderKickedUserItem = ({ item }) => {
    const user = item.user || {};
    const isUnblocking = unblockingIds.has(item._id);
    const hasAvatar = Boolean(user.avatar && !user.avatar.includes('default') && !user.avatar.includes('placeholder'));

    return (
      <View style={styles.userRowCard}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {hasAvatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <ImproperDpPlaceholder />
          )}
        </View>

        {/* User Info Col (Matching Screenshot) */}
        <View style={styles.infoCol}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name || 'User'}
          </Text>
          <Text style={styles.userIdText}>
            ID-{item.displayId || '--------'}
          </Text>
          <Text style={styles.validityText}>
            {item.kickType === '3days' && item.expiresAt ? (
              <T>Valid till 3 days</T>
            ) : (
              <T>Valid till forever</T>
            )}
          </Text>
          <Text style={styles.kickedByText} numberOfLines={1}>
            <T>Kicked out by</T> {item.kickedByName || 'Room Owner'}
          </Text>
        </View>

        {/* Unblock Button */}
        <TouchableOpacity
          style={[styles.unblockBtn, isUnblocking && styles.unblockBtnDisabled]}
          activeOpacity={0.75}
          disabled={isUnblocking}
          onPress={() => handleUnblock(item)}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.unblockBtnText}>
              <T>Unblock</T>
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
        {/* ══ HEADER ══ */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackChevronIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            <T>Kicked-out Users</T>
          </Text>

          <TouchableOpacity
            style={styles.searchToggleBtn}
            activeOpacity={0.7}
            onPress={() => setIsSearchOpen((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SearchIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ══ SEARCH BAR (Expandable) ══ */}
        {isSearchOpen && (
          <View style={styles.searchBarWrap}>
            <View style={styles.searchInputContainer}>
              <SearchIcon size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('Search by user name or ID')}
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ══ LIST CONTENT ══ */}
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderKickedUserItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(24, insets.bottom + 16) },
              filteredUsers.length === 0 && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchKickedUsers(true)}
                tintColor="#6366F1"
                colors={['#6366F1']}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIconEmoji}>🛡️</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  <T>No kicked-out users</T>
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? (
                    <T>No users found matching your search</T>
                  ) : (
                    <T>No users are currently kicked from this room</T>
                  )}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2D',
  },
  backBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  searchToggleBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Search Bar */
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#151522',
    borderBottomWidth: 1,
    borderBottomColor: '#202032',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    padding: 0,
  },
  clearSearchText: {
    color: '#9CA3AF',
    fontSize: 14,
    paddingHorizontal: 4,
  },

  /* List & Cards */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarWrap: {
    marginRight: 14,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A2A3E',
  },
  improperDpBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  improperDpText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 10,
    marginTop: 1,
  },

  /* User Info Column */
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userIdText: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  validityText: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  kickedByText: {
    fontSize: 12.5,
    color: '#9CA3AF',
  },

  /* Unblock Button */
  unblockBtn: {
    borderWidth: 1.2,
    borderColor: '#9CA3AF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    backgroundColor: 'transparent',
  },
  unblockBtnDisabled: {
    opacity: 0.6,
  },
  unblockBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },

  /* Loading & Empty States */
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  emptyIconEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

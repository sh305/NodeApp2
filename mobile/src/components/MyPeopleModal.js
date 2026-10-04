import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../api/client';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import AdminRightsModal from './AdminRightsModal';

// Crossed Mic SVG Icon (Matching Screenshot 1)
const CrossedMicIcon = ({ size = 22, color = '#555E6D' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Mic capsule */}
    <Rect x="9" y="3" width="6" height="10" rx="3" stroke={color} strokeWidth="1.8" />
    {/* Base arc */}
    <Path
      d="M5 10C5 13.866 8.134 17 12 17C15.866 17 19 13.866 19 10"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Stand */}
    <Path d="M12 17V21M8 21H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Diagonal slash */}
    <Path d="M3 3L21 21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

// Crossed User SVG Icon (Matching Screenshot 2 - Dark Circle with User silhouette & slash)
const CrossedUserIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#5A6170" />
    {/* User head */}
    <Circle cx="16" cy="11.5" r="3.8" fill="#FFFFFF" />
    {/* User body */}
    <Path
      d="M9.5 22.5C9.5 19 12.4 16.6 16 16.6C19.6 16.6 22.5 19 22.5 22.5"
      fill="#FFFFFF"
    />
    {/* Diagonal slash */}
    <Path d="M8 8L24 24" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export default function MyPeopleModal({
  visible,
  onClose,
  room,
  initialTab = 'Host',
  currentUser,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab); // 'Host' | 'Admin' | 'Members'
  const [loading, setLoading] = useState(false);
  const [rightsModalVisible, setRightsModalVisible] = useState(false);

  // Lists
  const [hosts, setHosts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);

  const roomId = room?._id;
  const roomOwnerId = (room?.owner?._id || room?.owner || '').toString();

  // Room Owner can NEVER appear in Host team or Admin team (Owner cannot be removed)
  const displayHosts = useMemo(() => {
    return hosts.filter(
      (h) => (h._id ? h._id.toString() : h.toString()) !== roomOwnerId
    );
  }, [hosts, roomOwnerId]);

  const displayAdmins = useMemo(() => {
    return admins.filter(
      (a) => (a._id ? a._id.toString() : a.toString()) !== roomOwnerId
    );
  }, [admins, roomOwnerId]);

  // Fetch People from Backend API
  const fetchRoomPeople = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await api.get(`/rooms/${roomId}/people`);
      if (res.data.success) {
        setHosts(res.data.hosts || []);
        setAdmins(res.data.admins || []);
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Fetch room people error:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab || 'Host');
      fetchRoomPeople();
    }
  }, [visible, initialTab, fetchRoomPeople]);

  // Remove Host Action
  const handleRemoveHost = (targetUser) => {
    if (targetUser._id?.toString() === roomOwnerId) {
      showToast(t('Room owner cannot be removed'), 'error');
      return;
    }
    Alert.alert(
      t('Remove Host'),
      `${t('Are you sure you want to remove')} ${targetUser.name} ${t('from Host team?')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              setHosts((prev) =>
                prev.filter(
                  (h) => (h._id ? h._id.toString() : h.toString()) !== targetUser._id.toString()
                )
              );
              const res = await api.post(`/rooms/${roomId}/remove-host`, {
                targetUserId: targetUser._id,
              });
              if (res.data.success) {
                showToast(t('Removed from Host team'), 'success');
                if (res.data.hosts) setHosts(res.data.hosts);
              }
            } catch (err) {
              showToast(t('Failed to remove host'), 'error');
              fetchRoomPeople();
            }
          },
        },
      ]
    );
  };

  // Remove Admin Action
  const handleRemoveAdmin = (targetUser) => {
    if (targetUser._id?.toString() === roomOwnerId) {
      showToast(t('Room owner cannot be removed'), 'error');
      return;
    }
    Alert.alert(
      t('Remove Admin'),
      `${t('Are you sure you want to remove')} ${targetUser.name} ${t('from Admin team?')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              setAdmins((prev) =>
                prev.filter(
                  (a) => (a._id ? a._id.toString() : a.toString()) !== targetUser._id.toString()
                )
              );
              const res = await api.post(`/rooms/${roomId}/remove-admin`, {
                targetUserId: targetUser._id,
              });
              if (res.data.success) {
                showToast(t('Removed from Admin team'), 'success');
                if (res.data.admins) setAdmins(res.data.admins);
              }
            } catch (err) {
              showToast(t('Failed to remove admin'), 'error');
              fetchRoomPeople();
            }
          },
        },
      ]
    );
  };

  // Render Host Item (Matching Screenshot 1)
  const renderHostItem = ({ item, index }) => {
    const formattedIndex = String(index + 1).padStart(2, '0');
    const avatarUri =
      item.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    return (
      <View style={styles.userRowCard}>
        {/* Index */}
        <Text style={styles.indexNumber}>{formattedIndex}</Text>

        {/* Avatar */}
        <Image source={{ uri: avatarUri }} style={styles.avatarImg} />

        {/* Info Col */}
        <View style={styles.infoCol}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.badgesRow}>
            {/* Level Badge */}
            <View style={styles.levelPillGreen}>
              <Text style={styles.levelPillText}>Lv.{item.wealthLevel || 1}</Text>
            </View>
            <View style={styles.levelPillPurple}>
              <Text style={styles.levelPillText}>Lv.{(item.wealthLevel || 1) + 20}</Text>
            </View>
          </View>
        </View>

        {/* Crossed Mic Button (Removes from Host team) - Same to Same User Icon */}
        <TouchableOpacity
          style={styles.actionMicBtn}
          activeOpacity={0.7}
          onPress={() => handleRemoveHost(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require('../../assets/icons/host_cross_mic.png')}
            style={styles.hostCrossMicImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Render Admin Item (Matching Screenshot 2)
  const renderAdminItem = ({ item, index }) => {
    const formattedIndex = String(index + 1).padStart(2, '0');
    const avatarUri =
      item.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    return (
      <View style={styles.userRowCard}>
        {/* Index */}
        <Text style={styles.indexNumber}>{formattedIndex}</Text>

        {/* Avatar */}
        <Image source={{ uri: avatarUri }} style={styles.avatarImg} />

        {/* Info Col */}
        <View style={styles.infoCol}>
          <View style={styles.adminTitleRow}>
            <View style={styles.adminTagBadge}>
              <Text style={styles.adminTagText}><T>Admin</T></Text>
            </View>
            <Text style={styles.userNameWithTag} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.badgesRow}>
            <View style={styles.levelPillGreen}>
              <Text style={styles.levelPillText}>Lv.{item.wealthLevel || 1}</Text>
            </View>
            <View style={styles.levelPillBlue}>
              <Text style={styles.levelPillText}>Lv.{(item.wealthLevel || 1) + 15}</Text>
            </View>
          </View>
        </View>

        {/* Crossed User Button (Removes from Admin team) */}
        <TouchableOpacity
          style={styles.actionUserBtn}
          activeOpacity={0.7}
          onPress={() => handleRemoveAdmin(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <CrossedUserIcon size={30} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = (type) => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          {type === 'Host' ? '🎤' : type === 'Admin' ? '🛡️' : '👥'}
        </Text>
        <Text style={styles.emptyTitle}>
          {type === 'Host' ? (
            <T>No hosts in this room yet</T>
          ) : type === 'Admin' ? (
            <T>No admins appointed yet</T>
          ) : (
            <T>No members</T>
          )}
        </Text>
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
        {/* ══ 1. TOP HEADER (Matching Screenshots) ══ */}
        <View style={styles.headerRow}>
          {/* Back button returns to Room Settings */}
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            <T>My People</T>
          </Text>

          {/* Question mark opens Admin rights */}
          <TouchableOpacity
            style={styles.helpBtn}
            activeOpacity={0.8}
            onPress={() => setRightsModalVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.helpIconText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* ══ 2. TABS: Host | Admin | Members ══ */}
        <View style={styles.tabsRow}>
          {['Host', 'Admin', 'Members'].map((tab) => {
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

        {/* ══ 3. LIST CONTENT ══ */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D293" />
          </View>
        ) : activeTab === 'Host' ? (
          <FlatList
            data={displayHosts}
            keyExtractor={(item) => `host_${item._id}`}
            renderItem={renderHostItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(30, insets.bottom + 16) },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => renderEmptyState('Host')}
          />
        ) : activeTab === 'Admin' ? (
          <FlatList
            data={displayAdmins}
            keyExtractor={(item) => `admin_${item._id}`}
            renderItem={renderAdminItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(30, insets.bottom + 16) },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => renderEmptyState('Admin')}
          />
        ) : (
          /* Members Tab - Empty placeholder for now matching Screenshot 3 */
          <View style={styles.membersPlaceholderView}>
            {/* Empty view as shown in Screenshot 3 */}
          </View>
        )}

        {/* ══ 4. ADMIN RIGHTS MODAL (Table from Screenshot 4) ══ */}
        <AdminRightsModal
          visible={rightsModalVisible}
          onClose={() => setRightsModalVisible(false)}
        />
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 34,
    color: '#374151',
    fontWeight: '300',
    lineHeight: 34,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  helpBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  activeIndicator: {
    width: 32,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00D293', // Mint green matching Screenshot
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ══ USER ROW CARD (Screenshots 1 & 2) ══ */
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 0.6,
    borderBottomColor: '#F9FAFB',
  },
  indexNumber: {
    width: 24,
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginRight: 6,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminTagBadge: {
    backgroundColor: '#38BDF8', // Light blue badge from Screenshot 2
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userNameWithTag: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelPillGreen: {
    backgroundColor: '#84CC16',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelPillPurple: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelPillBlue: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ══ ACTION BUTTONS (Muted Mic & Crossed User) ══ */
  actionMicBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  hostCrossMicImg: {
    width: 24,
    height: 24,
  },
  actionUserBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  membersPlaceholderView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

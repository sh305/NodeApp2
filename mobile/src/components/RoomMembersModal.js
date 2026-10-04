import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RoomMembersModal({
  visible,
  onClose,
  room,
  isHostActive = true,
  isHostMuted = false,
  currentUser = null,
  onSelectUser = null,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('on_seat'); // 'on_seat' | 'participants'

  // 1. Gather all users who are currently "On Seat"
  const seatedUsers = useMemo(() => {
    const list = [];

    // Host Seat (if host is active and room has an owner)
    if (isHostActive && room?.owner) {
      list.push({
        _id: room.owner._id || 'host_id',
        name: room.owner.name || 'Room Host',
        avatar: room.owner.avatar,
        wealthLevel: room.owner.wealthLevel || 1,
        gender: room.owner.gender || 'male',
        customId: room.owner.customId,
        isHost: true,
        seatNumber: 0,
        seatLabel: 'Host',
        isMuted: Boolean(isHostMuted),
        userObj: room.owner,
      });
    }

    // Regular mic seats (No.1, No.2, No.3, ...)
    (room?.seats || []).forEach((seat, index) => {
      if (seat && seat.user && (seat.user._id || seat.user.name)) {
        const seatNum = seat.seatNumber !== undefined ? seat.seatNumber : index + 1;
        list.push({
          _id: seat.user._id || `seat_${seatNum}`,
          name: seat.user.name || `User ${seatNum}`,
          avatar: seat.user.avatar,
          wealthLevel: seat.user.wealthLevel || 1,
          gender: seat.user.gender || 'male',
          customId: seat.user.customId,
          isHost: false,
          seatNumber: seatNum,
          seatLabel: `No.${seatNum}`,
          isMuted: Boolean(seat.isMuted),
          userObj: seat.user,
        });
      }
    });

    return list;
  }, [room?.seats, room?.owner, isHostActive, isHostMuted]);

  // Set of all seated user IDs (to filter out from Participants)
  const seatedIds = useMemo(() => {
    return new Set(seatedUsers.map((u) => String(u._id)));
  }, [seatedUsers]);

  // 2. Gather all room "Participants" (Users in room but NOT on any seat)
  const participants = useMemo(() => {
    const map = new Map();
    const rawMembers = room?.activeMembers || [];

    // Process backend active members
    rawMembers.forEach((member) => {
      if (member && member._id) {
        const idStr = String(member._id);
        if (!seatedIds.has(idStr)) {
          map.set(idStr, {
            _id: member._id,
            name: member.name || 'Participant',
            avatar: member.avatar,
            wealthLevel: member.wealthLevel || 1,
            gender: member.gender || 'male',
            customId: member.customId,
            userObj: member,
          });
        }
      }
    });

    // Make sure currentUser is included in participants if in room and not seated
    if (currentUser && currentUser._id) {
      const currentIdStr = String(currentUser._id);
      if (!seatedIds.has(currentIdStr) && !map.has(currentIdStr)) {
        map.set(currentIdStr, {
          _id: currentUser._id,
          name: currentUser.name || 'You',
          avatar: currentUser.avatar,
          wealthLevel: currentUser.wealthLevel || 1,
          gender: currentUser.gender || 'male',
          customId: currentUser.customId,
          isSelf: true,
          userObj: currentUser,
        });
      }
    }

    return Array.from(map.values());
  }, [room?.activeMembers, seatedIds, currentUser]);

  const handleUserPress = (item) => {
    if (onSelectUser && item.userObj) {
      onClose();
      onSelectUser(item.userObj);
    }
  };

  const renderSeatedItem = ({ item }) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
    return (
      <TouchableOpacity
        style={styles.userRowCard}
        activeOpacity={0.75}
        onPress={() => handleUserPress(item)}
      >
        {/* Left: Seat Indicator Badge */}
        <View
          style={[
            styles.seatBadgePill,
            item.isHost ? styles.seatBadgePillHost : styles.seatBadgePillNormal,
          ]}
        >
          <Text
            style={[
              styles.seatBadgeText,
              item.isHost ? styles.seatBadgeTextHost : styles.seatBadgeTextNormal,
            ]}
          >
            {item.isHost ? '👑 Host' : item.seatLabel}
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: item.avatar || defaultAvatar }}
            style={styles.userAvatarImg}
            resizeMode="cover"
          />
          {item.isHost && <View style={styles.hostCrownCornerBadge}><Text style={styles.hostCrownEmoji}>👑</Text></View>}
        </View>

        {/* Center: Info (Name, Level, ID) */}
        <View style={styles.userInfoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.tagsRow}>
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>Lv.{item.wealthLevel || 1}</Text>
            </View>
            <View
              style={[
                styles.genderTag,
                item.gender === 'female' ? styles.genderTagFemale : styles.genderTagMale,
              ]}
            >
              <Text style={styles.genderTagText}>
                {item.gender === 'female' ? '♀' : '♂'}
              </Text>
            </View>
            {item.customId ? (
              <Text style={styles.customIdText}>ID: {item.customId}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: Mic Status */}
        <View
          style={[
            styles.micStatusPill,
            item.isMuted ? styles.micStatusPillMuted : styles.micStatusPillLive,
          ]}
        >
          <Text style={styles.micStatusIcon}>{item.isMuted ? '🔇' : '🎙️'}</Text>
          <Text
            style={[
              styles.micStatusLabel,
              item.isMuted ? styles.micStatusLabelMuted : styles.micStatusLabelLive,
            ]}
          >
            {item.isMuted ? <T>Muted</T> : <T>Live</T>}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderParticipantItem = ({ item, index }) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
    return (
      <TouchableOpacity
        style={styles.userRowCard}
        activeOpacity={0.75}
        onPress={() => handleUserPress(item)}
      >
        {/* Index counter */}
        <View style={styles.indexCircle}>
          <Text style={styles.indexCircleText}>{index + 1}</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: item.avatar || defaultAvatar }}
            style={styles.userAvatarImg}
            resizeMode="cover"
          />
        </View>

        {/* Center: Info */}
        <View style={styles.userInfoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isSelf && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}><T>You</T></Text>
              </View>
            )}
          </View>
          <View style={styles.tagsRow}>
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>Lv.{item.wealthLevel || 1}</Text>
            </View>
            <View
              style={[
                styles.genderTag,
                item.gender === 'female' ? styles.genderTagFemale : styles.genderTagMale,
              ]}
            >
              <Text style={styles.genderTagText}>
                {item.gender === 'female' ? '♀' : '♂'}
              </Text>
            </View>
            {item.customId ? (
              <Text style={styles.customIdText}>ID: {item.customId}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: Audience tag */}
        <View style={styles.audiencePill}>
          <Text style={styles.audienceEmoji}>🎧</Text>
          <Text style={styles.audienceLabel}><T>Audience</T></Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type) => {
    const isOnSeat = type === 'on_seat';
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{isOnSeat ? '🪑' : '👥'}</Text>
        <Text style={styles.emptyTitle}>
          {isOnSeat ? <T>No users on seat</T> : <T>No other participants</T>}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isOnSeat
            ? <T>Users who take a seat will appear here</T>
            : <T>Users listening in the room will appear here</T>}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Dismiss Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* White Card Bottom Sheet Matching Screenshot */}
        <View
          style={[
            styles.sheetCard,
            { paddingBottom: Math.max(16, insets.bottom + 8) },
          ]}
        >
          {/* Subtle Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* ══ TOP TABS: "On Seat" & "Participants" ══ */}
          <View style={styles.tabsHeader}>
            {/* Tab 1: On Seat */}
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('on_seat')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'on_seat' && styles.tabTextActive,
                ]}
              >
                <T>On Seat</T>
                {seatedUsers.length > 0 ? ` (${seatedUsers.length})` : ''}
              </Text>
              {activeTab === 'on_seat' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Tab 2: Participants */}
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('participants')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'participants' && styles.tabTextActive,
                ]}
              >
                <T>Participants</T>
                {participants.length > 0 ? ` (${participants.length})` : ''}
              </Text>
              {activeTab === 'participants' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Thin subtle divider */}
          <View style={styles.dividerLine} />

          {/* Tab Content */}
          {activeTab === 'on_seat' ? (
            <FlatList
              data={seatedUsers}
              keyExtractor={(item) => `seated_${item._id}_${item.seatNumber}`}
              renderItem={renderSeatedItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => renderEmptyState('on_seat')}
            />
          ) : (
            <FlatList
              data={participants}
              keyExtractor={(item) => `participant_${item._id}`}
              renderItem={renderParticipantItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => renderEmptyState('participants')}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Math.min(SCREEN_HEIGHT * 0.65, 520),
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 6,
  },
  tabsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  activeIndicator: {
    width: 34,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00D293', // Mint green matching user's screenshot indicator
    marginTop: 6,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 2,
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  userRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  seatBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 46,
    alignItems: 'center',
  },
  seatBadgePillHost: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  seatBadgePillNormal: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  seatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  seatBadgeTextHost: {
    color: '#B45309',
  },
  seatBadgeTextNormal: {
    color: '#4F46E5',
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  indexCircleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  hostCrownCornerBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
  },
  hostCrownEmoji: {
    fontSize: 12,
  },
  userInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    maxWidth: 160,
  },
  youBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  levelTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  genderTag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderTagMale: {
    backgroundColor: '#DBEAFE',
  },
  genderTagFemale: {
    backgroundColor: '#FCE7F3',
  },
  genderTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  customIdText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  micStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  micStatusPillLive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  micStatusPillMuted: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  micStatusIcon: {
    fontSize: 11,
  },
  micStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  micStatusLabelLive: {
    color: '#059669',
  },
  micStatusLabelMuted: {
    color: '#DC2626',
  },
  audiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 3,
  },
  audienceEmoji: {
    fontSize: 11,
  },
  audienceLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

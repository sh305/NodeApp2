import React, { useState, useMemo, useEffect } from 'react';
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
  initialTab = 'applicants',
  targetSeatIndex = null,
  onInviteUser = null,
  onAcceptApplicant = null,
  onRejectApplicant = null,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab || 'applicants'); // 'applicants' | 'on_seat' | 'participants'

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab || 'applicants');
    }
  }, [visible, initialTab]);

  // 1. Gather all users who are currently "On Seat" (Host Seat is INCLUDED; Room Owner is excluded from regular mic seats)
  const seatedUsers = useMemo(() => {
    const list = [];
    const ownerId = room?.owner?._id ? String(room.owner._id) : (room?.owner ? String(room.owner) : '');

    // Host Seat (ALWAYS included in On Seat when host is active)
    if (isHostActive && (room?.owner || (room?.hosts && room.hosts.length > 0))) {
      const hostUser = (room?.hosts && room.hosts.length > 0 ? room.hosts[0] : null) || room?.owner;
      list.push({
        _id: hostUser?._id || 'host_id',
        name: hostUser?.name || 'Room Host',
        avatar: hostUser?.avatar,
        wealthLevel: hostUser?.wealthLevel || 1,
        gender: hostUser?.gender || 'male',
        customId: hostUser?.customId,
        isHost: true,
        isHostSeat: true,
        seatNumber: 0,
        seatLabel: 'Host',
        isMuted: Boolean(isHostMuted),
        userObj: hostUser,
      });
    }

    // Regular mic seats (No.1, No.2, No.3, ...) - Room Owner on mic seats is excluded, everyone else is included
    (room?.seats || []).forEach((seat, index) => {
      if (seat && seat.user && (seat.user._id || seat.user.name)) {
        const uId = seat.user._id ? String(seat.user._id) : '';
        if (ownerId && uId === ownerId) return; // Skip Room Owner from regular mic seats

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
  }, [room?.seats, room?.owner, room?.hosts, isHostActive, isHostMuted]);

  // Set of all seated user IDs + Room Owner ID (to filter out from room audience)
  const seatedIds = useMemo(() => {
    const set = new Set(seatedUsers.map((u) => String(u._id)));
    const ownerId = room?.owner?._id ? String(room.owner._id) : (room?.owner ? String(room.owner) : '');
    if (ownerId) set.add(ownerId);
    return set;
  }, [seatedUsers, room?.owner]);

  // 2. Gather all room audience/members (Applicants tab: All users who came to room but are not seated)
  const roomAudience = useMemo(() => {
    const map = new Map();
    const rawMembers = room?.activeMembers || [];

    rawMembers.forEach((member) => {
      if (member && member._id) {
        const idStr = String(member._id);
        if (!seatedIds.has(idStr)) {
          map.set(idStr, {
            _id: member._id,
            name: member.name || 'Audience',
            avatar: member.avatar,
            wealthLevel: member.wealthLevel || 1,
            gender: member.gender || 'male',
            customId: member.customId,
            userObj: member,
          });
        }
      }
    });

    // Make sure currentUser is included if in room and not seated
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

  // 3. Seat Applicants (Participants tab: Users who applied for a seat)
  const seatApplicants = useMemo(() => {
    const rawApplicants = room?.seatApplicants || [];
    return rawApplicants.map((applicant, idx) => ({
      _id: applicant._id || applicant,
      name: applicant.name || `Applicant ${idx + 1}`,
      avatar: applicant.avatar,
      wealthLevel: applicant.wealthLevel || 1,
      gender: applicant.gender || 'male',
      customId: applicant.customId,
      userObj: applicant,
    }));
  }, [room?.seatApplicants]);

  const handleUserPress = (item) => {
    if (onSelectUser && item.userObj) {
      onClose();
      onSelectUser({ ...item.userObj, isHostSeat: Boolean(item.isHost) });
    }
  };

  const handleInvitePress = (item) => {
    if (onInviteUser) {
      onInviteUser(item.userObj || item, targetSeatIndex);
    }
  };

  const handleAcceptPress = (applicantId) => {
    if (onAcceptApplicant) {
      onAcceptApplicant(applicantId, targetSeatIndex);
    }
  };

  const handleRejectPress = (applicantId) => {
    if (onRejectApplicant) {
      onRejectApplicant(applicantId);
    }
  };

  // ── Render 1: On Seat User Item ──
  const renderSeatedItem = ({ item }) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
    return (
      <TouchableOpacity
        style={styles.userRowCard}
        activeOpacity={0.75}
        onPress={() => handleUserPress(item)}
      >
        {/* Seat Badge Pill */}
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
          {item.isHost && (
            <View style={styles.hostCrownCornerBadge}>
              <Text style={styles.hostCrownEmoji}>👑</Text>
            </View>
          )}
        </View>

        {/* Info */}
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

        {/* Mic Status */}
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

  // ── Render 2: Room Member (Applicants Tab) ──
  const renderAudienceItem = ({ item, index }) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
    return (
      <View style={styles.userRowCard}>
        {/* Index counter */}
        <View style={styles.indexCircle}>
          <Text style={styles.indexCircleText}>{index + 1}</Text>
        </View>

        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUserPress(item)}
          style={styles.avatarWrapper}
        >
          <Image
            source={{ uri: item.avatar || defaultAvatar }}
            style={styles.userAvatarImg}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Info */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUserPress(item)}
          style={styles.userInfoCol}
        >
          <View style={styles.nameRow}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isSelf && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>
                  <T>You</T>
                </Text>
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
        </TouchableOpacity>

        {/* Action: Invite button */}
        {!item.isSelf && (
          <TouchableOpacity
            style={styles.inviteActionBtn}
            activeOpacity={0.8}
            onPress={() => handleInvitePress(item)}
          >
            <Text style={styles.inviteActionBtnText}>
              <T>Invite</T>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Render 3: Seat Applicant (Participants Tab) ──
  const renderApplicantItem = ({ item }) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
    return (
      <View style={styles.userRowCard}>
        {/* Avatar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUserPress(item)}
          style={styles.avatarWrapper}
        >
          <Image
            source={{ uri: item.avatar || defaultAvatar }}
            style={styles.userAvatarImg}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Info */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUserPress(item)}
          style={styles.userInfoCol}
        >
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
        </TouchableOpacity>

        {/* Action Buttons: Agree & Reject */}
        <View style={styles.applicantActionRow}>
          <TouchableOpacity
            style={styles.agreeBtn}
            activeOpacity={0.8}
            onPress={() => handleAcceptPress(item._id)}
          >
            <Text style={styles.agreeBtnText}>
              <T>Agree</T>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            activeOpacity={0.8}
            onPress={() => handleRejectPress(item._id)}
          >
            <Text style={styles.rejectBtnText}>
              <T>Reject</T>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = (type) => {
    let emoji = '👥';
    let title = 'No members found';
    let subtitle = '';

    if (type === 'applicants') {
      emoji = '👥';
      title = 'No other audience in room';
      subtitle = 'Users listening in the room will appear here';
    } else if (type === 'on_seat') {
      emoji = '🪑';
      title = 'No users on seat';
      subtitle = 'Users who take a seat will appear here';
    } else if (type === 'participants') {
      emoji = '🛋️';
      title = 'No seat applicants yet';
      subtitle = 'When users apply for a seat, they will appear here';
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
        <Text style={styles.emptyTitle}>
          <T>{title}</T>
        </Text>
        {subtitle ? (
          <Text style={styles.emptySubtitle}>
            <T>{subtitle}</T>
          </Text>
        ) : null}
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

        {/* White Card Bottom Sheet Matching User Screenshot */}
        <View
          style={[
            styles.sheetCard,
            { paddingBottom: Math.max(16, insets.bottom + 8) },
          ]}
        >
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Target Seat Badge (Showing which seat is being assigned) */}
          

          {/* ══ TOP 3 TABS (Matching Screenshot 2): Applicants, On Seat, Participants ══ */}
          <View style={styles.tabsHeader}>
            {/* Tab 1: Applicants (Room members / all users who came to the room) */}
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('applicants')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'applicants' && styles.tabTextActive,
                ]}
              >
                <T>Applicants</T>
                {roomAudience.length > 0 ? ` (${roomAudience.length})` : ''}
              </Text>
              {activeTab === 'applicants' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Tab 2: On Seats */}
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

            {/* Tab 3: Participants (Seat Applicants / Applied Queue) */}
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
                {seatApplicants.length > 0 ? ` (${seatApplicants.length})` : ''}
              </Text>
              {activeTab === 'participants' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Divider Line */}
          <View style={styles.dividerLine} />

          {/* Tab Content */}
          {activeTab === 'applicants' ? (
            <FlatList
              data={roomAudience}
              keyExtractor={(item) => `audience_${item._id}`}
              renderItem={renderAudienceItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => renderEmptyState('applicants')}
            />
          ) : activeTab === 'on_seat' ? (
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
              data={seatApplicants}
              keyExtractor={(item) => `applicant_${item._id}`}
              renderItem={renderApplicantItem}
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
  targetSeatBanner: {
    alignSelf: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 4,
  },
  targetSeatBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  targetSeatHighlight: {
    color: '#059669',
    fontWeight: '800',
  },
  tabsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    position: 'relative',
    minWidth: 80,
  },
  tabText: {
    fontSize: 15.5,
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
    backgroundColor: '#00D293', // Mint green matching screenshot 2
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
    marginRight: 10,
  },
  indexCircleText: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#E5E7EB',
  },
  hostCrownCornerBadge: {
    position: 'absolute',
    top: -6,
    left: -4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 1.5,
  },
  hostCrownEmoji: {
    fontSize: 10,
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
    color: '#111827',
    maxWidth: 160,
  },
  youBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelTag: {
    backgroundColor: '#00D293',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  levelTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  genderTag: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderTagFemale: {
    backgroundColor: '#F43F5E',
  },
  genderTagMale: {
    backgroundColor: '#3B82F6',
  },
  genderTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customIdText: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  micStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  micStatusPillLive: {
    backgroundColor: '#ECFDF5',
  },
  micStatusPillMuted: {
    backgroundColor: '#FEF2F2',
  },
  micStatusIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  micStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  micStatusLabelLive: {
    color: '#10B981',
  },
  micStatusLabelMuted: {
    color: '#EF4444',
  },

  /* Action Buttons */
  inviteActionBtn: {
    backgroundColor: '#00D293',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  applicantActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agreeBtn: {
    backgroundColor: '#00D293',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

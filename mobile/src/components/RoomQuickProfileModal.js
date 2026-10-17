import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import UserAvatarWithFrame from './UserAvatarWithFrame';

export default function RoomQuickProfileModal({
  visible,
  onClose,
  targetUser,
  room,
  currentUser,
  onMentionUser,
  onOpenDirectChat,
  onOpenGiftSheet,
  onKick,
  onBlock,
  onReport,
  onLeaveHosting,
  onRemoveHost,
  navigation,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(targetUser || {});
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const targetUserId = targetUser?._id || targetUser?.id;

  // Determine user role in current room
  const isOwner = Boolean(
    targetUserId &&
      room?.owner &&
      (String(room.owner._id || room.owner) === String(targetUserId))
  );

  const isAdmin = Boolean(
    targetUserId &&
      room?.admins &&
      room.admins.some((a) => String(a._id || a) === String(targetUserId))
  );

  const isHost = Boolean(
    targetUserId &&
      (isOwner ||
        (room?.hosts &&
          room.hosts.some((h) => String(h._id || h) === String(targetUserId))))
  );

  const isSelf = String(currentUser?._id) === String(targetUserId);

  // Fetch full user profile details when opened
  useEffect(() => {
    if (visible && targetUserId) {
      fetchUserProfile();
    }
  }, [visible, targetUserId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${targetUserId}/profile`);
      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
        setIsFollowing(Boolean(res.data.user.isFollowing));
        setFollowersCount(res.data.user.followersCount || 0);
      }
    } catch (e) {
      console.log('Error fetching room profile:', e);
    } finally {
      setLoading(false);
    }
  };

  // Follow / Unfollow toggle
  const handleToggleFollow = async () => {
    if (isSelf) return;
    try {
      const res = await api.post(`/users/${targetUserId}/follow`);
      if (res.data?.success) {
        const nextState = Boolean(res.data.following);
        setIsFollowing(nextState);
        setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
        showToast(t(nextState ? 'Followed successfully!' : 'Unfollowed successfully!'), 'success');
      }
    } catch (e) {
      showToast(t('Failed to update follow status'), 'error');
    }
  };

  // Handle @ mention
  const handleMention = () => {
    onClose();
    if (onMentionUser) {
      onMentionUser(profile?.name || targetUser?.name || 'User');
    }
  };

  // Handle Chat
  const handleChat = () => {
    onClose();
    if (onOpenDirectChat) {
      onOpenDirectChat(profile || targetUser);
    }
  };

  // Handle Gift
  const handleGift = () => {
    onClose();
    if (onOpenGiftSheet) {
      onOpenGiftSheet(profile || targetUser);
    }
  };

  // Format large numbers (e.g. 882.47K, 2.59M)
  const formatStatNum = (num) => {
    const n = Number(num) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  const handleThreeDots = () => {
    const currentUserIdStr = currentUser?._id ? String(currentUser._id) : '';
    const roomOwnerId = room?.owner?._id ? String(room.owner._id) : (room?.owner ? String(room.owner) : '');
    const isRoomOwner = Boolean(roomOwnerId && currentUserIdStr && roomOwnerId === currentUserIdStr);
    const isRoomAdmin = Boolean(
      room?.admins &&
        room.admins.some((a) => (a._id ? String(a._id) : String(a)) === currentUserIdStr)
    );

    const options = [
      {
        text: t('View Full Profile'),
        onPress: () => {
          onClose();
          if (navigation?.navigate) {
            navigation.navigate('UserProfile', { userId: targetUserId });
          }
        },
      },
    ];

    if (!isSelf && (isRoomOwner || isRoomAdmin)) {
      if (onKick) {
        options.push({
          text: t('Kick from Room'),
          style: 'destructive',
          onPress: () => {
            onClose();
            onKick(profile || targetUser);
          },
        });
      }
      if (onReport) {
        options.push({
          text: t('Report ID'),
          onPress: () => {
            onClose();
            onReport(profile || targetUser);
          },
        });
      }
      if (onBlock) {
        options.push({
          text: t('Block User'),
          onPress: () => {
            onClose();
            onBlock(profile || targetUser);
          },
        });
      }
    }

    if (isHost && (isSelf || isRoomOwner || isRoomAdmin)) {
      if (isSelf && onLeaveHosting) {
        options.push({
          text: t('Leave Hosting'),
          onPress: () => {
            onClose();
            onLeaveHosting();
          },
        });
      } else if (!isSelf && onRemoveHost) {
        options.push({
          text: t('Remove Host'),
          style: 'destructive',
          onPress: () => {
            onClose();
            onRemoveHost(profile || targetUser);
          },
        });
      }
    }

    options.push({ text: t('Cancel'), style: 'cancel' });

    Alert.alert(displayName, t('Choose an action'), options);
  };

  if (!visible || !targetUser) return null;

  const displayName = profile.name || targetUser.name || t('User');
  const displayId = profile.customId || targetUser.customId || String(targetUserId).substring(0, 8);
  const avatarUri =
    profile.avatar ||
    targetUser.avatar ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.profileCard} activeOpacity={1}>
          {/* ══ TOP BAR: Role Badge (Left) & Join Family / Three Dots (Right) ══ */}
          <View style={styles.topBar}>
            {/* Role Badge (Admin, Hosting, Owner, or empty) */}
            <View style={styles.roleBadgeContainer}>
              {isAdmin ? (
                <View style={styles.adminBadge}>
                  <Text style={styles.roleBadgeText}>Admin</Text>
                </View>
              ) : isHost ? (
                <View style={styles.hostingBadge}>
                  <Text style={styles.roleBadgeText}>Hosting</Text>
                </View>
              ) : isOwner ? (
                <View style={styles.ownerBadge}>
                  <Text style={styles.roleBadgeText}>Owner</Text>
                </View>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>

            {/* Right: Join Family & Options Button */}
            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.joinFamilyBtn}
                activeOpacity={0.85}
                onPress={() => showToast(t('Join Family request sent!'), 'info')}
              >
                <Text style={styles.joinFamilyText}>{t('Join Family')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.threeDotsBtn}
                activeOpacity={0.7}
                onPress={handleThreeDots}
              >
                <Text style={styles.threeDotsText}>•••</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ HERO AVATAR WITH FRAME ══ */}
          <View style={styles.avatarCenterWrap}>
            <UserAvatarWithFrame
              avatarUri={avatarUri}
              frame={profile.activeFrame || targetUser.activeFrame}
              level={profile.wealthLevel || targetUser.wealthLevel || 1}
              size={84}
            />
          </View>

          {/* ══ USER NAME & ROLE ══ */}
          <View style={styles.nameRow}>
            {isAdmin && (
              <View style={[styles.adminBadge, { marginRight: 6 }]}>
                <Text style={styles.roleBadgeText}>Admin</Text>
              </View>
            )}
            <Text style={styles.userNameText} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          {/* ══ USER ID ══ */}
          <TouchableOpacity
            style={styles.idRow}
            activeOpacity={0.7}
            onPress={() => showToast(t('ID Copied: ') + displayId, 'success')}
          >
            <Text style={styles.idText}>ID: {displayId}</Text>
          </TouchableOpacity>

          {/* ══ BADGES ROW (VIP, Family, Level Pills) ══ */}
          <View style={styles.badgesRow}>
            {/* VIP Pill */}
            {(profile.isVip || targetUser.isVip) && (
              <View style={styles.vipPill}>
                <Text style={styles.vipPillText}>VIP {profile.vipLevel || targetUser.vipLevel || 1}</Text>
              </View>
            )}

            {/* Family Badge */}
            <View style={styles.familyBadgePill}>
              <Text style={styles.familyIcon}>🛡️</Text>
              <Text style={styles.familyText}>MOON</Text>
            </View>

            {/* Wealth Level */}
            <View style={[styles.levelPill, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.levelPillText}>Lv.{profile.wealthLevel || 1}</Text>
            </View>

            {/* User Level */}
            <View style={[styles.levelPill, { backgroundColor: '#EC4899' }]}>
              <Text style={styles.levelPillText}>Lv.{profile.userLevel || profile.level || 1}</Text>
            </View>

            {/* Charm Level */}
            <View style={[styles.levelPill, { backgroundColor: '#06B6D4' }]}>
              <Text style={styles.levelPillText}>Lv.{profile.charmLevel || 1}</Text>
            </View>
          </View>

          {/* ══ MEDALS ROW ══ */}
          <View style={styles.medalsRow}>
            <Text style={styles.medalIcon}>🥇</Text>
            <Text style={styles.medalIcon}>👑</Text>
            <Text style={styles.medalIcon}>🎖️</Text>
          </View>

          {/* ══ LUDO / GAMING BANNER ══ */}
          <TouchableOpacity
            style={styles.ludoBanner}
            activeOpacity={0.85}
            onPress={() => showToast(t('Ludo stats'), 'info')}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ludoBannerGradient}
            >
              <Text style={styles.ludoDiceIcon}>🎲</Text>
              <View style={styles.ludoTextWrap}>
                <Text style={styles.ludoTitle}>LUDO</Text>
                <Text style={styles.ludoScore}>87/241</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ══ STATS ROW (Followers, Following, Received, Contributed) ══ */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{formatStatNum(followersCount || profile.followers?.length || 0)}</Text>
              <Text style={styles.statLabel}>{t('Followers')}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{formatStatNum(profile.followingCount || profile.following?.length || 0)}</Text>
              <Text style={styles.statLabel}>{t('Following')}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{formatStatNum(profile.giftsReceived || 0)}</Text>
              <Text style={styles.statLabel}>{t('Received')}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{formatStatNum(profile.giftsSent || profile.totalContributed || 0)}</Text>
              <Text style={styles.statLabel}>{t('Contributed')}</Text>
            </View>
          </View>

          {/* ══ BOTTOM ACTION BUTTONS: @, Chat, Gift, Follow (Matching Screenshot 4) ══ */}
          <View style={styles.actionsBar}>
            {/* @ Mention Button (Blue Circle) */}
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.8} onPress={handleMention}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Text style={[styles.circleIconText, { color: '#3B82F6' }]}>@</Text>
              </View>
              <Text style={styles.circleActionLabel}>@</Text>
            </TouchableOpacity>

            {/* Chat Button (Green Circle) */}
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.8} onPress={handleChat}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.circleIconText, { color: '#10B981' }]}>💬</Text>
              </View>
              <Text style={styles.circleActionLabel}>{t('Chat')}</Text>
            </TouchableOpacity>

            {/* Gift Button (Pink Circle) */}
            <TouchableOpacity style={styles.circleActionBtn} activeOpacity={0.8} onPress={handleGift}>
              <View style={[styles.circleIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <Text style={[styles.circleIconText, { color: '#EC4899' }]}>🎁</Text>
              </View>
              <Text style={styles.circleActionLabel}>{t('Gift')}</Text>
            </TouchableOpacity>

            {/* Follow / Following Pill Button (Large Green Pill) */}
            {!isSelf && (
              <TouchableOpacity
                style={styles.followBtnWrap}
                activeOpacity={0.85}
                onPress={handleToggleFollow}
              >
                <LinearGradient
                  colors={isFollowing ? ['#374151', '#4B5563'] : ['#00E676', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.followBtnGradient}
                >
                  <Text style={styles.followPlusIcon}>{isFollowing ? '✓' : '+'}</Text>
                  <Text style={styles.followBtnText}>
                    {t(isFollowing ? 'Following' : 'Follow')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
  },

  /* ══ TOP BAR ══ */
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleBadgeContainer: {
    minWidth: 50,
  },
  adminBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hostingBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownerBadge: {
    backgroundColor: '#F97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinFamilyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 8,
  },
  joinFamilyText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
  },
  threeDotsBtn: {
    padding: 4,
  },
  threeDotsText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '900',
  },

  /* ══ AVATAR ══ */
  avatarCenterWrap: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ══ NAME & ID ══ */
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  userNameText: {
    color: '#EAB308',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
  idRow: {
    marginTop: 3,
    marginBottom: 6,
  },
  idText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ══ BADGES ROW ══ */
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  vipPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  vipPillText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
  },
  familyBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  familyIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  familyText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 9.5,
  },
  levelPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  levelPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 9,
  },

  /* ══ MEDALS ══ */
  medalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  medalIcon: {
    fontSize: 18,
    marginHorizontal: 4,
  },

  /* ══ LUDO BANNER ══ */
  ludoBanner: {
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
  },
  ludoBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ludoDiceIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  ludoTextWrap: {
    flex: 1,
  },
  ludoTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  ludoScore: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 11,
  },

  /* ══ STATS ROW ══ */
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    color: '#111827',
    fontWeight: '900',
    fontSize: 14,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  /* ══ BOTTOM ACTION BAR: @, Chat, Gift, Follow ══ */
  actionsBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  circleActionBtn: {
    alignItems: 'center',
  },
  circleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  circleIconText: {
    fontSize: 20,
    fontWeight: '900',
  },
  circleActionLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  followBtnWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginLeft: 6,
  },
  followBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
  },
  followPlusIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    marginRight: 4,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13.5,
  },
});

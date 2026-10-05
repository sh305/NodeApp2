import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

export default function InviteRoomPkModal({
  visible,
  onClose,
  currentRoomId,
  onInviteRoom,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedRoomIds, setInvitedRoomIds] = useState(new Set());

  useEffect(() => {
    if (visible) {
      fetchRooms();
      setSearchQuery('');
    }
  }, [visible]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms');
      if (res.data?.success && Array.isArray(res.data.rooms)) {
        // Exclude current room
        const filtered = res.data.rooms.filter(
          (r) => String(r._id) !== String(currentRoomId)
        );
        setRooms(filtered);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms for PK:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (targetRoom) => {
    if (invitedRoomIds.has(targetRoom._id)) {
      showToast(t('Invitation already sent!'), 'info');
      return;
    }

    setInvitedRoomIds((prev) => new Set(prev).add(targetRoom._id));
    if (onInviteRoom) {
      onInviteRoom(targetRoom);
    }
    showToast(t('PK Battle invitation sent!'), 'success');
  };

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    return r.title?.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const renderRoomItem = ({ item }) => {
    const isInvited = invitedRoomIds.has(item._id);
    const roomLvl = item.roomLevel || 1;

    return (
      <View style={styles.roomRow}>
        {/* Room Avatar with Level Badge */}
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri:
                item.coverImage ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
            }}
            style={styles.roomAvatar}
          />
          {/* Level Badge Overlay on bottom-right corner */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{roomLvl}</Text>
          </View>
        </View>

        {/* Room Info */}
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.memberCountRow}>
            <Text style={styles.barsIcon}>📶</Text>
            <Text style={styles.memberCountText}>
              {item.activeMemberCount ?? item.activeMembers?.length ?? 1}
            </Text>
          </View>
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.inviteBtn, isInvited && styles.inviteBtnSent]}
          onPress={() => handleInvite(item)}
        >
          <Text style={styles.inviteBtnText}>
            {isInvited ? <T>Invited</T> : <T>Invite</T>}
          </Text>
        </TouchableOpacity>
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
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheetCard, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          {/* Modal Header with Back Arrow and Title */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              <T>Invite a room</T>
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Bar matching Screenshot 3 */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('Search Room')}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            <Text style={styles.searchGlassIcon}>🔍</Text>
          </View>

          {/* Room List */}
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              keyExtractor={(item) => String(item._id)}
              renderItem={renderRoomItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    <T>No rooms found</T>
                  </Text>
                </View>
              }
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 32,
    fontWeight: '300',
    color: '#334155',
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
  },
  searchGlassIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  roomAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  memberCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barsIcon: {
    fontSize: 12,
    marginRight: 4,
    color: '#10B981',
  },
  memberCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  inviteBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteBtnSent: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  inviteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/client';
import AvatarWithFrame from '../components/AvatarWithFrame';
import RoomLockModal from '../components/RoomLockModal';
import LanguageSelectorButton from '../components/LanguageSelectorButton';
import { useLanguage } from '../context/LanguageContext';

export default function HomeScreen({ navigation, currentUser, onLogout }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('Do you want to logout from your account?'));
      if (confirmed && onLogout) {
        onLogout();
      }
    } else {
      Alert.alert(t('Logout') + ' 🚪', t('Do you want to logout from your account?'), [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Logout'), style: 'destructive', onPress: onLogout },
      ]);
    }
  };

  // Locked Room Modal state
  const [lockedRoomTarget, setLockedRoomTarget] = useState(null);

  // Create Room Modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [isLockedNewRoom, setIsLockedNewRoom] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      if (res.data.success) {
        setRooms(res.data.rooms);
      }
    } catch (e) {
      console.error('Fetch rooms error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleRoomClick = (room) => {
    if (room.isLocked) {
      setLockedRoomTarget(room);
    } else {
      navigation.navigate('VoiceRoom', { roomId: room._id, roomTitle: room.title });
    }
  };

  const handleVerifyLockedRoom = async (password) => {
    if (!lockedRoomTarget) return;
    const res = await api.post(`/rooms/${lockedRoomTarget._id}/verify-password`, { password });
    if (res.data.success) {
      const target = lockedRoomTarget;
      setLockedRoomTarget(null);
      navigation.navigate('VoiceRoom', { roomId: target._id, roomTitle: target.title });
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      Alert.alert(t('Please enter a room title'));
      return;
    }
    if (isLockedNewRoom && !newRoomPassword.trim()) {
      Alert.alert(t('Please enter a password for your locked room'));
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/rooms', {
        title: newRoomTitle,
        topic: newRoomTopic,
        isLocked: isLockedNewRoom,
        password: isLockedNewRoom ? newRoomPassword : null,
      });

      if (res.data.success) {
        setCreateModalVisible(false);
        setNewRoomTitle('');
        setNewRoomTopic('');
        setIsLockedNewRoom(false);
        setNewRoomPassword('');
        fetchRooms();
        navigation.navigate('VoiceRoom', {
          roomId: res.data.room._id,
          roomTitle: res.data.room.title,
        });
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || t('Failed to create room'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>{t('YoYo Rooms')}</Text>
          <Text style={styles.onlineBadge}>{t('🟢 Live Voice Chat')}</Text>
        </View>

        {currentUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Language Switch Button */}
            <LanguageSelectorButton variant="pill" />

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('UserProfile', { userId: currentUser._id })}
            >
              <AvatarWithFrame
                avatarUri={currentUser.avatar}
                level={currentUser.wealthLevel || 1}
                size={36}
                showLevelBadge={false}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutHeaderBtn}
              onPress={handleLogoutPress}
            >
              <Text style={{ fontSize: 16 }}>🚪</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Rooms List */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchRooms();
          }}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 + insets.bottom }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomCard}
              activeOpacity={0.8}
              onPress={() => handleRoomClick(item)}
            >
              <Image source={{ uri: item.coverImage }} style={styles.roomCover} />

              <View style={styles.roomInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.roomTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.isLocked && <Text style={styles.lockBadge}>🔒 Locked</Text>}
                </View>

                <Text style={styles.roomTopic} numberOfLines={1}>
                  {item.topic}
                </Text>

                <View style={styles.roomBadgesRow}>
                  {/* Room Level Badge */}
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Room Lv.{item.roomLevel}</Text>
                  </View>

                  {/* Seat Capacity Badge */}
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatBadgeText}>🎙️ {item.totalSeats} Seats</Text>
                  </View>

                  {/* Active Online Members */}
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>👥 {item.activeMemberCount || 1}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Create Room Button */}
      <TouchableOpacity
        style={[styles.fabBtn, { bottom: 20 + insets.bottom }]}
        activeOpacity={0.8}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.fabIcon}>➕</Text>
        <Text style={styles.fabText}>Create Room</Text>
      </TouchableOpacity>

      {/* Room Lock Password Modal */}
      {lockedRoomTarget && (
        <RoomLockModal
          visible={!!lockedRoomTarget}
          onClose={() => setLockedRoomTarget(null)}
          onVerifyPassword={handleVerifyLockedRoom}
          roomTitle={lockedRoomTarget.title}
        />
      )}

      {/* Create Room Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeader}>🎙️ Create Voice Room</Text>

            <Text style={styles.modalLabel}>Room Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Desi Chill Beats & Masti"
              placeholderTextColor="#6B7280"
              value={newRoomTitle}
              onChangeText={setNewRoomTitle}
            />

            <Text style={styles.modalLabel}>Topic / Bio</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Singing, Chit-chat, Friends"
              placeholderTextColor="#6B7280"
              value={newRoomTopic}
              onChangeText={setNewRoomTopic}
            />

            {/* Lock / Password Toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>🔒 Lock Room with Password</Text>
                <Text style={styles.switchSubtitle}>Only users with PIN can enter</Text>
              </View>
              <Switch
                value={isLockedNewRoom}
                onValueChange={setIsLockedNewRoom}
                thumbColor={isLockedNewRoom ? '#6366F1' : '#4B5563'}
              />
            </View>

            {isLockedNewRoom && (
              <TextInput
                style={[styles.modalInput, { marginTop: 10 }]}
                placeholder="Enter 4-digit Room Password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                value={newRoomPassword}
                onChangeText={setNewRoomPassword}
              />
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Launch Room</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1E1E2E',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  onlineBadge: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  profileBtn: {
    padding: 2,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  roomCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  roomCover: {
    width: 90,
    height: 90,
  },
  roomInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  lockBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  roomTopic: {
    color: '#9CA3AF',
    fontSize: 12,
    marginVertical: 4,
  },
  roomBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  seatBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seatBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  memberBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberBadgeText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutHeaderBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

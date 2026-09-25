import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import api, { BASE_URL } from '../api/client';
import RoomSeatGrid from '../components/RoomSeatGrid';
import AvatarWithFrame from '../components/AvatarWithFrame';
import GiftBottomSheet from '../components/GiftBottomSheet';
import KickModal from '../components/KickModal';
import ReportModal from '../components/ReportModal';

export default function VoiceRoomScreen({ route, navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { roomId, roomTitle } = route.params;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [mySeatIndex, setMySeatIndex] = useState(null);

  // Modals state
  const [selectedSeatUser, setSelectedSeatUser] = useState(null);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [kickModalVisible, setKickModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [giftBanner, setGiftBanner] = useState(null);

  const socketRef = useRef(null);

  // Fetch Room info from API
  const fetchRoomDetails = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      if (res.data.success) {
        setRoom(res.data.room);

        // Check if I am currently sitting on any seat
        const mySeat = res.data.room.seats.findIndex(
          (s) => s.user && s.user._id === currentUser?._id
        );
        setMySeatIndex(mySeat !== -1 ? mySeat : null);
      }
    } catch (err) {
      if (err.response?.data?.kicked) {
        Alert.alert('Room Access Denied 🚫', err.response.data.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to load room');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();

    // Initialize Realtime Socket Connection
    const socket = io(BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_room', {
      roomId,
      userId: currentUser?._id,
    });

    // Seat updates
    socket.on('seats_updated', ({ seats }) => {
      setRoom((prev) => (prev ? { ...prev, seats } : prev));
      const mySeat = seats.findIndex((s) => s.user && s.user._id === currentUser?._id);
      setMySeatIndex(mySeat !== -1 ? mySeat : null);
    });

    // Seat mute status
    socket.on('seat_mute_status_changed', ({ seatIndex, isMuted }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newSeats = [...prev.seats];
        if (newSeats[seatIndex]) newSeats[seatIndex].isMuted = isMuted;
        return { ...prev, seats: newSeats };
      });
    });

    // Live chat message
    socket.on('new_chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // User entrance broadcast
    socket.on('user_joined_room', ({ user }) => {
      setMessages((prev) => [
        ...prev,
        {
          system: true,
          text: `✨ ${user.name} entered the room with ${user.activeFrame?.name || 'Starter Frame'}`,
        },
      ]);
    });

    // Gift animation & banner
    socket.on('gift_received_animation', (giftData) => {
      setGiftBanner(giftData);
      setTimeout(() => setGiftBanner(null), 4000);
      fetchRoomDetails(); // Sync EXP & dynamic seats
    });

    // KICK ENFORCEMENT: Target user is forced out of the room immediately
    socket.on('user_kicked_from_room', ({ targetUserId, kickType, message }) => {
      if (targetUserId === currentUser?._id) {
        Alert.alert(
          'You were kicked 🚫',
          message || `Room owner has kicked you (${kickType === '3days' ? '3 Days' : 'Permanent'}).`,
          [{ text: 'Exit', onPress: () => navigation.goBack() }]
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // Handle seat clicks
  const handleSeatPress = (seat, index) => {
    if (seat.user) {
      // Clicked on a sitting user -> open action profile menu
      setSelectedSeatUser({ ...seat.user, seatIndex: index });
    } else {
      // Empty seat -> Take seat
      if (mySeatIndex !== null) {
        Alert.alert('Change Seat', 'Do you want to switch to this seat?', [
          { text: 'Cancel' },
          {
            text: 'Switch',
            onPress: () => {
              socketRef.current.emit('take_seat', {
                roomId,
                seatIndex: index,
                userId: currentUser?._id,
              });
            },
          },
        ]);
      } else {
        socketRef.current.emit('take_seat', {
          roomId,
          seatIndex: index,
          userId: currentUser?._id,
        });
      }
    }
  };

  const handleLeaveSeat = () => {
    if (mySeatIndex !== null) {
      socketRef.current.emit('leave_seat', {
        roomId,
        userId: currentUser?._id,
      });
      setMySeatIndex(null);
    }
  };

  const handleToggleMic = () => {
    if (mySeatIndex === null) return;
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    socketRef.current.emit('toggle_mic_mute', {
      roomId,
      seatIndex: mySeatIndex,
      isMuted: nextState,
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit('send_chat_message', {
      roomId,
      sender: currentUser,
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleSendGift = async (gift, quantity) => {
    try {
      const res = await api.post('/gifts/send', {
        giftId: gift._id,
        receiverId: selectedSeatUser ? selectedSeatUser._id : room.owner._id,
        roomId: room._id,
        quantity,
      });

      if (res.data.success) {
        // Broadcast gift banner to all listeners in room
        socketRef.current.emit('broadcast_gift', {
          roomId,
          giftData: {
            senderName: currentUser.name,
            receiverName: selectedSeatUser ? selectedSeatUser.name : 'Room',
            giftName: gift.name,
            giftIcon: gift.iconUrl,
            quantity,
          },
        });
        setGiftModalVisible(false);
        Alert.alert('Gift Sent', `${gift.name} x${quantity} sent successfully!`);
      }
    } catch (e) {
      Alert.alert('Gift Failed', e.response?.data?.message || 'Coin balance low');
    }
  };

  // Owner Kicking user (3 Days or Permanent)
  const handleKickUser = async (kickType) => {
    if (!selectedSeatUser) return;
    try {
      const res = await api.post(`/rooms/${roomId}/kick`, {
        targetUserId: selectedSeatUser._id,
        kickType,
      });

      if (res.data.success) {
        // Emit realtime kick event
        socketRef.current.emit('notify_user_kicked', {
          roomId,
          targetUserId: selectedSeatUser._id,
          kickType,
          message: res.data.message,
        });

        Alert.alert('User Kicked', res.data.message);
        setSelectedSeatUser(null);
        fetchRoomDetails();
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Kick action failed');
    }
  };

  // Block User
  const handleBlockUser = async () => {
    if (!selectedSeatUser) return;
    try {
      const res = await api.post(`/users/${selectedSeatUser._id}/block`);
      if (res.data.success) {
        Alert.alert('User Blocked', res.data.message);
        setSelectedSeatUser(null);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Block failed');
    }
  };

  // Report User (3 Days, 7 Days, Permanent)
  const handleSubmitReport = async ({ requestedBanDuration, reason, description }) => {
    if (!selectedSeatUser) return;
    await api.post('/reports', {
      reportedUserId: selectedSeatUser._id,
      roomId,
      requestedBanDuration,
      reason,
      description,
    });
    setSelectedSeatUser(null);
  };

  const isOwner = room && currentUser && room.owner?._id === currentUser._id;

  return (
    <View style={styles.container}>
      {/* Room Header Frame Bar */}
      <View style={[styles.roomHeader, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.roomTitleBox}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {roomTitle}
          </Text>
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>
              🏆 Room Lv.{room?.roomLevel || 1} • {room?.roomFrame?.name || 'Silver Frame'}
            </Text>
          </View>
        </View>

        <View style={styles.seatsCountBadge}>
          <Text style={styles.seatsCountText}>
            🎙️ {room?.seats?.length || 8} Seats
          </Text>
        </View>
      </View>

      {/* Floating Gift Banner Animation */}
      {giftBanner && (
        <View style={styles.giftBanner}>
          <Image source={{ uri: giftBanner.giftIcon }} style={styles.bannerIcon} />
          <Text style={styles.bannerText}>
            <Text style={styles.bold}>{giftBanner.senderName}</Text> sent{' '}
            <Text style={styles.highlight}>
              {giftBanner.giftName} x{giftBanner.quantity}
            </Text>{' '}
            to <Text style={styles.bold}>{giftBanner.receiverName}</Text> 🎉
          </Text>
        </View>
      )}

      {/* Dynamic Seats Grid (8, 12, 16, 20... seats) */}
      <ScrollView style={styles.seatsScrollArea}>
        <RoomSeatGrid
          seats={room?.seats || []}
          owner={room?.owner}
          onSeatPress={handleSeatPress}
          onHostPress={(hostUser) => {
            if (hostUser) {
              setSelectedSeatUser(hostUser);
            }
          }}
          currentUserId={currentUser?._id}
          isOwner={isOwner}
        />
      </ScrollView>

      {/* Live Chat Message Stream */}
      <View style={styles.chatSection}>
        <FlatList
          data={messages}
          keyExtractor={(_, i) => `msg_${i}`}
          renderItem={({ item }) =>
            item.system ? (
              <View style={styles.systemMsgBox}>
                <Text style={styles.systemMsgText}>{item.text}</Text>
              </View>
            ) : (
              <View style={styles.chatMsgBox}>
                <Text style={styles.chatSenderName}>
                  Lv.{item.sender?.wealthLevel || 1} {item.sender?.name}:{' '}
                </Text>
                <Text style={styles.chatMessageContent}>{item.message}</Text>
              </View>
            )
          }
        />
      </View>

      {/* Bottom Control Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(10, insets.bottom) }]}>
        <TextInput
          style={styles.chatInput}
          placeholder="Say something nice..."
          placeholderTextColor="#9CA3AF"
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={handleSendChat}
        />

        <TouchableOpacity style={styles.sendChatBtn} onPress={handleSendChat}>
          <Text style={styles.sendChatText}>➤</Text>
        </TouchableOpacity>

        {/* Mic Sit / Leave / Mute Toggle */}
        {mySeatIndex !== null ? (
          <>
            <TouchableOpacity
              style={[styles.actionIconBtn, isMicMuted && styles.actionIconMuted]}
              onPress={handleToggleMic}
            >
              <Text style={styles.iconEmoji}>{isMicMuted ? '🔇' : '🎙️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.leaveSeatBtn} onPress={handleLeaveSeat}>
              <Text style={styles.leaveSeatText}>Leave</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {/* Gift Trigger Button */}
        <TouchableOpacity
          style={styles.giftTriggerBtn}
          onPress={() => setGiftModalVisible(true)}
        >
          <Text style={styles.iconEmoji}>🎁</Text>
        </TouchableOpacity>
      </View>

      {/* User Interaction Bottom Modal (Gift, Kick, Block, Report) */}
      {selectedSeatUser && (
        <Modal visible={!!selectedSeatUser} transparent animationType="slide">
          <View style={styles.userModalOverlay}>
            <View style={styles.userModalCard}>
              <AvatarWithFrame
                avatarUri={selectedSeatUser.avatar}
                level={selectedSeatUser.wealthLevel || 1}
                size={64}
              />
              <Text style={styles.modalUserName}>{selectedSeatUser.name}</Text>
              <Text style={styles.modalUserStats}>
                Wealth Lv.{selectedSeatUser.wealthLevel || 1} • Charm Lv.{selectedSeatUser.charmLevel || 1}
              </Text>

              {/* Action Buttons Grid */}
              <View style={styles.actionGrid}>
                <TouchableOpacity
                  style={styles.actionBox}
                  onPress={() => {
                    setGiftModalVisible(true);
                  }}
                >
                  <Text style={styles.actionEmoji}>🎁</Text>
                  <Text style={styles.actionLabel}>Send Gift</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBox}
                  onPress={() => {
                    const uId = selectedSeatUser._id;
                    setSelectedSeatUser(null);
                    navigation.navigate('UserProfile', { userId: uId });
                  }}
                >
                  <Text style={styles.actionEmoji}>👤</Text>
                  <Text style={styles.actionLabel}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBox} onPress={handleBlockUser}>
                  <Text style={styles.actionEmoji}>🚷</Text>
                  <Text style={styles.actionLabel}>Block User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBox}
                  onPress={() => setReportModalVisible(true)}
                >
                  <Text style={styles.actionEmoji}>🚩</Text>
                  <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Report ID</Text>
                </TouchableOpacity>

                {/* Kick Option for Room Owner */}
                {isOwner && selectedSeatUser._id !== currentUser?._id && (
                  <TouchableOpacity
                    style={[styles.actionBox, styles.kickActionBox]}
                    onPress={() => setKickModalVisible(true)}
                  >
                    <Text style={styles.actionEmoji}>👢</Text>
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Kick (3d/Perm)</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.closeUserModalBtn}
                onPress={() => setSelectedSeatUser(null)}
              >
                <Text style={styles.closeUserModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Gift Bottom Sheet */}
      <GiftBottomSheet
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onSendGift={handleSendGift}
        receiverName={selectedSeatUser ? selectedSeatUser.name : 'Room'}
        userCoins={currentUser?.coins || 1000}
      />

      {/* Kick Modal (3 Days vs Permanent) */}
      <KickModal
        visible={kickModalVisible}
        onClose={() => setKickModalVisible(false)}
        onKick={handleKickUser}
        targetUserName={selectedSeatUser?.name}
      />

      {/* Report Modal (3 Days, 7 Days, Permanent) */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={handleSubmitReport}
        targetUserName={selectedSeatUser?.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E1E2E',
    borderBottomWidth: 1,
    borderColor: '#2A2A3E',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  roomTitleBox: {
    flex: 1,
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  levelPill: {
    marginTop: 2,
  },
  levelPillText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  seatsCountBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seatsCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  giftBanner: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  bannerText: {
    color: '#000000',
    fontSize: 12,
    flex: 1,
  },
  bold: {
    fontWeight: '800',
  },
  highlight: {
    fontWeight: '800',
    color: '#7C2D12',
  },
  seatsScrollArea: {
    maxHeight: '48%',
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  systemMsgBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 3,
  },
  systemMsgText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  chatMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 46, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 2,
  },
  chatSenderName: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  chatMessageContent: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E1E2E',
    borderTopWidth: 1,
    borderColor: '#2A2A3E',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    marginRight: 8,
  },
  sendChatBtn: {
    backgroundColor: '#6366F1',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  sendChatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  actionIconMuted: {
    backgroundColor: '#EF4444',
  },
  leaveSeatBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 6,
  },
  leaveSeatText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  giftTriggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  userModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  userModalCard: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalUserName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  modalUserStats: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    gap: 12,
  },
  actionBox: {
    width: '28%',
    backgroundColor: '#2A2A3E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  kickActionBox: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  actionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '600',
  },
  closeUserModalBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#374151',
    borderRadius: 10,
  },
  closeUserModalText: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  ImageBackground,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api/client';
import RoomSeatGrid from '../components/RoomSeatGrid';
import AvatarWithFrame from '../components/AvatarWithFrame';
import GiftBottomSheet from '../components/GiftBottomSheet';
import KickModal from '../components/KickModal';
import ReportModal from '../components/ReportModal';
import TreasureBoxModal from '../components/TreasureBoxModal';

export default function VoiceRoomScreen({ route, navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { roomId, roomTitle } = route.params;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatInputActive, setIsChatInputActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [mySeatIndex, setMySeatIndex] = useState(null);

  // Modals state
  const [selectedSeatUser, setSelectedSeatUser] = useState(null);
  const [isHostActive, setIsHostActive] = useState(true);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [kickModalVisible, setKickModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [giftBanner, setGiftBanner] = useState(null);
  const [treasureBoxVisible, setTreasureBoxVisible] = useState(false);
  const [roomGoldContributed, setRoomGoldContributed] = useState(0);

  const socketRef = useRef(null);
  const chatInputRef = useRef(null);

  // Fetch Room info from API
  const fetchRoomDetails = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      if (res.data.success) {
        setRoom(res.data.room);
        if (res.data.room.goldContributed !== undefined) {
          setRoomGoldContributed(res.data.room.goldContributed);
        }

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

    api.post(`/users/recent-rooms/${roomId}`).catch(() => {});
    AsyncStorage.getItem('@recent_room_ids')
      .then((saved) => {
        const ids = saved ? JSON.parse(saved) : [];
        const updated = [roomId, ...ids.filter((id) => id !== roomId)].slice(0, 25);
        AsyncStorage.setItem('@recent_room_ids', JSON.stringify(updated)).catch(() => {});
      })
      .catch(() => {});

    const socket = io(BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_room', {
      roomId,
      userId: currentUser?._id,
    });

    socket.on('seats_updated', ({ seats }) => {
      setRoom((prev) => (prev ? { ...prev, seats } : prev));
      const mySeat = seats.findIndex((s) => s.user && s.user._id === currentUser?._id);
      setMySeatIndex(mySeat !== -1 ? mySeat : null);
    });

    socket.on('host_status_updated', ({ isHostActive: hActive }) => {
      setIsHostActive(hActive);
    });

    socket.on('seat_mute_status_changed', ({ seatIndex, isMuted }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newSeats = [...prev.seats];
        if (newSeats[seatIndex]) newSeats[seatIndex].isMuted = isMuted;
        return { ...prev, seats: newSeats };
      });
    });

    socket.on('new_chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_joined_room', ({ user, timestamp }) => {
      const joinId = `join_${user._id}_${timestamp || ''}`;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last._joinId === joinId) return prev;
        return [
          ...prev,
          {
            system: true,
            text: `✨ ${user.name} entered the room with ${user.activeFrame?.name || 'Starter Frame'}`,
            _joinId: joinId,
          },
        ];
      });
    });

    socket.on('gift_received_animation', (giftData) => {
      setGiftBanner(giftData);
      setTimeout(() => setGiftBanner(null), 4000);
      fetchRoomDetails();
    });

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

  const handleSeatPress = (seat, index) => {
    if (seat.user) {
      setSelectedSeatUser({ ...seat.user, seatIndex: index });
    } else {
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

  const handleLeaveHosting = () => {
    setIsHostActive(false);
    socketRef.current.emit('leave_host', {
      roomId,
      userId: currentUser?._id,
    });
    Alert.alert('Leave Hosting 👑', 'Aap host seat se step down ho gaye hain.');
    setSelectedSeatUser(null);
  };

  const handleTakeHost = () => {
    if (!isOwner) {
      Alert.alert('Host Only', 'Sirf Room Owner hi Host ban sakte hain.');
      return;
    }
    setIsHostActive(true);
    socketRef.current.emit('take_host', {
      roomId,
      userId: currentUser?._id,
    });
    Alert.alert('Host Active 👑', 'Aap Host seat par baith gaye hain.');
    setSelectedSeatUser(null);
  };

  const handleRemoveUserFromSeat = () => {
    if (!selectedSeatUser) return;
    socketRef.current.emit('leave_seat', {
      roomId,
      userId: selectedSeatUser._id,
    });
    Alert.alert('Seat Removed 🪑', `${selectedSeatUser.name} ko seat se hata diya gaya.`);
    setSelectedSeatUser(null);
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
        setRoomGoldContributed((prev) => prev + gift.coinPrice * quantity);
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

  const handleKickUser = async (kickType) => {
    if (!selectedSeatUser) return;
    try {
      const res = await api.post(`/rooms/${roomId}/kick`, {
        targetUserId: selectedSeatUser._id,
        kickType,
      });

      if (res.data.success) {
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

  const roomOwnerId = room?.owner?._id ? room.owner._id.toString() : (room?.owner ? room.owner.toString() : '');
  const currentUserIdStr = currentUser?._id ? currentUser._id.toString() : '';
  const isOwner = Boolean(roomOwnerId && currentUserIdStr && roomOwnerId === currentUserIdStr);
  const selectedUserIdStr = selectedSeatUser?._id ? selectedSeatUser._id.toString() : '';
  const isSelf = Boolean(selectedUserIdStr && currentUserIdStr && selectedUserIdStr === currentUserIdStr);

  const currentRoomLevel = room?.roomLevel || 1;
  const memberCount = room?.activeMembers?.length || 1;

  const BOX_THRESHOLDS = [12000, 42000, 92000, 172000, 272000];
  const currentBoxLevel = BOX_THRESHOLDS.findIndex((t) => roomGoldContributed < t) + 1 || 5;

  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 38 : 16);
  const bottomBarHeight = safeBottomPadding + 40;

  const bgUri =
    room?.backgroundImage ||
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1080&q=85';

  return (
    <View style={styles.container}>
      {/* ════ FULL-SCREEN TROPICAL BEACH BACKGROUND ════ */}
      <ImageBackground
        source={{ uri: bgUri }}
        style={styles.fullScreenBg}
        imageStyle={styles.bgImageStyle}
        resizeMode="cover"
      >
        {/* Subtle top shade for status bar readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* ══ 1. FLOATING HEADER (Level, Name, ID, Members, Trophy, Actions) ══ */}
        <View style={[styles.floatingHeader, { paddingTop: Math.max(12, insets.top + 4) }]}>
          {/* Left: Compact Glass Pill with Room Info */}
          <View style={styles.headerInfoPill}>
            {/* Hexagon/Diamond Level Badge */}
            <LinearGradient
              colors={['#06B6D4', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerLevelBadge}
            >
              <Text style={styles.headerLevelText}>{currentRoomLevel}</Text>
            </LinearGradient>

            {/* Title & ID/Member count */}
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerRoomTitle} numberOfLines={1}>
                {roomTitle || 'Voice Room'}
              </Text>
              <View style={styles.headerSubInfoRow}>
                <Text style={styles.headerRoomIdText}>
                  ID:{room?.roomId || roomId?.slice(-6) || '8181956'}
                </Text>
                <Text style={styles.headerMemberText}>👤 {memberCount}</Text>
              </View>
            </View>

            {/* Room Avatar Tag with Green dot */}
            <View style={styles.headerAvatarWrapper}>
              <Image
                source={{
                  uri:
                    room?.owner?.avatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                }}
                style={styles.headerAvatar}
              />
              <View style={styles.headerMicDot} />
            </View>
          </View>

          {/* Right: Trophy, Shop/Pack, Share, Close */}
          <View style={styles.headerRightActions}>
            {/* Trophy */}
            <TouchableOpacity
              style={styles.headerTrophyPill}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.headerTrophyEmoji}>🏆</Text>
              <Text style={styles.headerTrophyCount}>{room?.trophyCount || 0}</Text>
            </TouchableOpacity>

            {/* Shop / Package */}
            <TouchableOpacity
              style={styles.headerActionCircle}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.headerCircleEmoji}>🛍️</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={styles.headerActionCircle}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.headerCircleEmoji}>↗</Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity
              style={[styles.headerActionCircle, styles.headerCloseCircle]}
              activeOpacity={0.75}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gift Banner (floating) */}
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

        {/* ══ 2. CENTER CONTENT (Treasure Box, Host, Seats) ══ */}
        <ScrollView
          style={styles.seatsScrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.seatsScrollContent}
        >
          <RoomSeatGrid
            seats={room?.seats || []}
            owner={room?.owner}
            isHostActive={isHostActive}
            onSeatPress={handleSeatPress}
            onHostPress={(hostUser) => {
              if (hostUser) setSelectedSeatUser(hostUser);
            }}
            currentUserId={currentUser?._id}
            isOwner={isOwner}
            onTreasureBoxPress={() => setTreasureBoxVisible(true)}
            roomGoldContributed={roomGoldContributed}
          />
        </ScrollView>

        {/* ══ 3. RIGHT FLOATING EVENT/GAME WIDGETS ══ */}
        <View
          style={[styles.rightFloatingWidgets, { bottom: bottomBarHeight + 8 }]}
          pointerEvents="box-none"
        >
          {/* Roulette Wheel */}
          <TouchableOpacity style={styles.widgetBtn} activeOpacity={0.8} onPress={() => {}}>
            <LinearGradient colors={['#F43F5E', '#10B981']} style={styles.widgetWheelGrad}>
              <Text style={styles.widgetWheelEmoji}>🎡</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* YoYo Mascot Stage */}
          <TouchableOpacity style={styles.widgetBtn} activeOpacity={0.8} onPress={() => {}}>
            <View style={styles.widgetMascotBox}>
              <Text style={styles.widgetMascotEmoji}>🤩</Text>
              <View style={styles.widgetYoYoRibbon}>
                <Text style={styles.widgetYoYoText}>YoYo</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* NEW Game Box */}
          <TouchableOpacity style={styles.widgetBtn} activeOpacity={0.8} onPress={() => {}}>
            <View style={styles.widgetGameBox}>
              <View style={styles.widgetNewBadge}>
                <Text style={styles.widgetNewText}>NEW!</Text>
              </View>
              <Text style={styles.widgetGameEmoji}>🕹️</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══ 4. BOTTOM-LEFT NOTICE & CHAT OVERLAY ══ */}
        <View
          style={[styles.bottomLeftChatSection, { bottom: bottomBarHeight + 4 }]}
          pointerEvents="box-none"
        >
          {/* Rules / Safety Notice Bubble (exact matching Screenshot 2) */}
          <View style={styles.noticeBubble}>
            <Text style={styles.noticeText}>
              सेक्सुअल और हिंसक कंटेंट की अनुमति नहीं है। सभी उल्लंघन करने वालों को चैट रूम से बैन कर दिया जाएगा। कृपया एक दूसरे का सम्मान करें और अपनी पर्सनल जानकारी को उजागर न करें।
            </Text>
          </View>

          {/* Inverted Live Chat / System messages */}
          <FlatList
            data={[...messages].reverse()}
            inverted
            keyExtractor={(_, i) => `msg_${i}`}
            style={styles.chatList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              item.system ? (
                <View style={styles.systemMsgBox}>
                  <Text style={styles.systemMsgText} numberOfLines={2}>
                    {item.text}
                  </Text>
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

        {/* ══ 5. FLOATING TRANSLUCENT BOTTOM CONTROL BAR ══ */}
        <View style={[styles.floatingBottomBar, { paddingBottom: safeBottomPadding }]}>
          {/* Comment button pill */}
          <TouchableOpacity
            style={styles.commentPill}
            activeOpacity={0.8}
            onPress={() => setIsChatInputActive(true)}
          >
            <Text
              style={styles.commentPillText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {chatInput ? chatInput : 'कमेंट लिखिए'}
            </Text>
          </TouchableOpacity>

          {/* Quick Action Circle Icons */}
          <View style={styles.bottomIconGroup}>
            {/* Emoji */}
            <TouchableOpacity
              style={styles.bottomCircleBtn}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.bottomEmoji}>😊</Text>
              <View style={styles.redBadgeDot} />
            </TouchableOpacity>

            {/* Mic */}
            <TouchableOpacity
              style={[
                styles.bottomCircleBtn,
                isMicMuted && styles.bottomCircleBtnMuted,
              ]}
              activeOpacity={0.75}
              onPress={mySeatIndex !== null ? handleToggleMic : undefined}
            >
              <Text style={styles.bottomEmoji}>
                {isMicMuted ? '🔇' : '🎙️'}
              </Text>
            </TouchableOpacity>

            {/* Menu / 4 dots */}
            <TouchableOpacity
              style={styles.bottomCircleBtn}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.bottomEmoji}>⊞</Text>
              <View style={styles.redBadgeDot} />
            </TouchableOpacity>

            {/* Chat */}
            <TouchableOpacity
              style={styles.bottomCircleBtn}
              activeOpacity={0.75}
              onPress={() => setIsChatInputActive(true)}
            >
              <Text style={styles.bottomEmoji}>💬</Text>
            </TouchableOpacity>

            {/* Game */}
            <TouchableOpacity
              style={styles.bottomCircleBtn}
              activeOpacity={0.75}
              onPress={() => {}}
            >
              <Text style={styles.bottomEmoji}>🎮</Text>
            </TouchableOpacity>

            {/* Gift Button (Large vibrant pink/rose highlighted) */}
            <TouchableOpacity
              style={styles.bottomGiftBtn}
              activeOpacity={0.8}
              onPress={() => setGiftModalVisible(true)}
            >
              <LinearGradient
                colors={['#F43F5E', '#EC4899', '#FB7185']}
                style={styles.bottomGiftGrad}
              >
                <Text style={styles.bottomGiftEmoji}>🎁</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ 6. ACTIVE CHAT INPUT OVERLAY (when tapping comment) ══ */}
        {isChatInputActive && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.chatInputOverlay, { bottom: safeBottomPadding + 4 }]}
          >
            <TextInput
              ref={chatInputRef}
              style={styles.chatActiveInput}
              placeholder="Say something nice..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={chatInput}
              onChangeText={setChatInput}
              autoFocus
              onSubmitEditing={() => {
                handleSendChat();
                setIsChatInputActive(false);
              }}
            />
            <TouchableOpacity
              style={styles.chatActiveSendBtn}
              onPress={() => {
                handleSendChat();
                setIsChatInputActive(false);
              }}
            >
              <Text style={styles.chatActiveSendText}>➤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatActiveCloseBtn}
              onPress={() => setIsChatInputActive(false)}
            >
              <Text style={styles.chatActiveCloseText}>✕</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </ImageBackground>

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

                {/* 👑 1. LEAVE HOSTING */}
                {Boolean(
                  (selectedSeatUser?.isHostSeat || selectedUserIdStr === roomOwnerId) &&
                    isHostActive &&
                    isOwner
                )}
                {Boolean(
                  (selectedSeatUser?.isHostSeat || selectedUserIdStr === roomOwnerId) &&
                    isHostActive &&
                    isOwner
                ) && (
                  <TouchableOpacity
                    style={[
                      styles.actionBox,
                      {
                        borderColor: '#F59E0B',
                        borderWidth: 1,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      },
                    ]}
                    onPress={handleLeaveHosting}
                  >
                    <Text style={styles.actionEmoji}>👑</Text>
                    <Text style={[styles.actionLabel, { color: '#F59E0B' }]}>Leave Hosting</Text>
                  </TouchableOpacity>
                )}

                {/* 👑 1B. TAKE HOST */}
                {Boolean(
                  (selectedSeatUser?.isHostSeat || selectedUserIdStr === roomOwnerId) &&
                    !isHostActive &&
                    isOwner
                ) && (
                  <TouchableOpacity
                    style={[
                      styles.actionBox,
                      {
                        borderColor: '#10B981',
                        borderWidth: 1,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      },
                    ]}
                    onPress={handleTakeHost}
                  >
                    <Text style={styles.actionEmoji}>👑</Text>
                    <Text style={[styles.actionLabel, { color: '#10B981' }]}>Take Host</Text>
                  </TouchableOpacity>
                )}

                {/* 🚪 2. LEAVE SEAT */}
                {Boolean(!selectedSeatUser?.isHostSeat && isSelf && mySeatIndex !== null) && (
                  <TouchableOpacity
                    style={[
                      styles.actionBox,
                      {
                        borderColor: '#EF4444',
                        borderWidth: 1,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      },
                    ]}
                    onPress={() => {
                      handleLeaveSeat();
                      setSelectedSeatUser(null);
                    }}
                  >
                    <Text style={styles.actionEmoji}>🚪</Text>
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Leave Seat</Text>
                  </TouchableOpacity>
                )}

                {/* 🪑 3. REMOVE FROM SEAT */}
                {Boolean(!selectedSeatUser?.isHostSeat && isOwner && !isSelf) && (
                  <TouchableOpacity
                    style={[
                      styles.actionBox,
                      {
                        borderColor: '#F43F5E',
                        borderWidth: 1,
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      },
                    ]}
                    onPress={handleRemoveUserFromSeat}
                  >
                    <Text style={styles.actionEmoji}>🪑</Text>
                    <Text style={[styles.actionLabel, { color: '#F43F5E' }]}>Remove Seat</Text>
                  </TouchableOpacity>
                )}

                {/* Kick Option for Room Owner */}
                {Boolean(isOwner && !isSelf) && (
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

      {/* Treasure Box Modal */}
      <TreasureBoxModal
        visible={treasureBoxVisible}
        onClose={() => setTreasureBoxVisible(false)}
        roomGoldContributed={roomGoldContributed}
        currentBoxLevel={Math.min(currentBoxLevel, 5)}
        onClaimBox={(boxLevel) => {
          setTreasureBoxVisible(false);
          Alert.alert(
            '🎉 Box Opened!',
            `Congratulations! You opened Level ${boxLevel} Treasure Box and won amazing prizes!`,
            [{ text: 'Awesome! 🎁' }]
          );
        }}
      />

      {/* Gift Bottom Sheet */}
      <GiftBottomSheet
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onSendGift={handleSendGift}
        receiverName={selectedSeatUser ? selectedSeatUser.name : 'Room'}
        userCoins={currentUser?.coins || 1000}
      />

      {/* Kick Modal */}
      <KickModal
        visible={kickModalVisible}
        onClose={() => setKickModalVisible(false)}
        onKick={handleKickUser}
        targetUserName={selectedSeatUser?.name}
      />

      {/* Report Modal */}
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
    backgroundColor: '#000000',
  },
  fullScreenBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  bgImageStyle: {
    resizeMode: 'cover',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1,
  },

  /* ── 1. Floating Header ── */
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 4,
    zIndex: 10,
  },
  headerInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 22,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    maxWidth: '56%',
  },
  headerLevelBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLevelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitleCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
  },
  headerRoomTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  headerRoomIdText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    fontWeight: '500',
  },
  headerMemberText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
  headerAvatarWrapper: {
    position: 'relative',
    width: 26,
    height: 26,
  },
  headerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  headerMicDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  /* ── Header Right Actions ── */
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTrophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 3,
  },
  headerTrophyEmoji: {
    fontSize: 13,
  },
  headerTrophyCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerCircleEmoji: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  headerCloseCircle: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  headerCloseIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── Gift Banner ── */
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

  /* ── 2. Seats Scroll Area ── */
  seatsScrollArea: {
    flex: 1,
    zIndex: 2,
  },
  seatsScrollContent: {
    paddingBottom: 200,
  },

  /* ── 3. Right Floating Event Widgets ── */
  rightFloatingWidgets: {
    position: 'absolute',
    right: 12,
    zIndex: 20,
    alignItems: 'center',
    gap: 10,
  },
  widgetBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetWheelGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#F43F5E',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  widgetWheelEmoji: {
    fontSize: 20,
  },
  widgetMascotBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  widgetMascotEmoji: {
    fontSize: 22,
  },
  widgetYoYoRibbon: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  widgetYoYoText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '800',
  },
  widgetGameBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    position: 'relative',
    shadowColor: '#818CF8',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  widgetNewBadge: {
    position: 'absolute',
    top: -5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  widgetNewText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },
  widgetGameEmoji: {
    fontSize: 18,
  },

  /* ── 4. Bottom-Left Notice & Chat Section ── */
  bottomLeftChatSection: {
    position: 'absolute',
    left: 12,
    width: '74%',
    maxHeight: 180,
    zIndex: 15,
    justifyContent: 'flex-end',
  },
  noticeBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  noticeText: {
    color: '#5EEAD4',
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '500',
  },
  chatList: {
    maxHeight: 100,
  },
  systemMsgBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1.5,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  systemMsgText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '600',
  },
  chatMsgBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 1.5,
    alignSelf: 'flex-start',
  },
  chatSenderName: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  chatMessageContent: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  /* ── 5. Floating Translucent Bottom Control Bar ── */
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 30,
  },
  commentPill: {
    flex: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 17,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  commentPillText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    position: 'relative',
  },
  bottomCircleBtnMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    borderColor: '#EF4444',
  },
  bottomEmoji: {
    fontSize: 14,
  },
  redBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bottomGiftBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#F43F5E',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomGiftGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bottomGiftEmoji: {
    fontSize: 18,
  },

  /* ── 6. Active Chat Input Overlay ── */
  chatInputOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  chatActiveInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  chatActiveSendBtn: {
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  chatActiveSendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  chatActiveCloseBtn: {
    padding: 6,
    marginLeft: 4,
  },
  chatActiveCloseText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── User Interaction Modal ── */
  userModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  userModalCard: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#374151',
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
    marginTop: 4,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 12,
  },
  actionBox: {
    width: '48%',
    backgroundColor: '#2A2A3E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  kickActionBox: {
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  actionEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  closeUserModalBtn: {
    marginTop: 20,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderRadius: 14,
  },
  closeUserModalText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});

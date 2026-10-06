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
  Keyboard,
  Share,
  Dimensions,
  useWindowDimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../api/client';
import RoomSeatGrid from '../components/RoomSeatGrid';
import AvatarWithFrame from '../components/AvatarWithFrame';
import GiftBottomSheet from '../components/GiftBottomSheet';
import KickModal from '../components/KickModal';
import ReportModal from '../components/ReportModal';
import TreasureBoxModal from '../components/TreasureBoxModal';
import VoiceRoomEmojiModal from '../components/VoiceRoomEmojiModal';
import VoiceRoomToolsModal from '../components/VoiceRoomToolsModal';
import RoomMembersModal from '../components/RoomMembersModal';
import RoomSettingsModal from '../components/RoomSettingsModal';
import MyPeopleModal from '../components/MyPeopleModal';
import KickedUsersModal from '../components/KickedUsersModal';
import BossSeatModal from '../components/BossSeatModal';
import SeatSettingsModal from '../components/SeatSettingsModal';
import BroadcastModal from '../components/BroadcastModal';
import FlyingBroadcastBanner from '../components/FlyingBroadcastBanner';
import FlyingRoomJoinBanner from '../components/FlyingRoomJoinBanner';
import LuckyPacketModal from '../components/LuckyPacketModal';
import LuckyPacketWidget from '../components/LuckyPacketWidget';
import LuckyPacketPasswordModal from '../components/LuckyPacketPasswordModal';
import LuckyPacketResultModal from '../components/LuckyPacketResultModal';
import FlyingLuckyPacketBanner from '../components/FlyingLuckyPacketBanner';
import ChoosePkModeModal from '../components/ChoosePkModeModal';
import InviteRoomPkModal from '../components/InviteRoomPkModal';
import PkBattleFloatingWidget from '../components/PkBattleFloatingWidget';
import PkInviteReceivedModal from '../components/PkInviteReceivedModal';
import PkBattleResultModal from '../components/PkBattleResultModal';
import LocalMusicPlayerModal from '../components/LocalMusicPlayerModal';
import MyMusicModal from '../components/MyMusicModal';
import SoundEffectsModal from '../components/SoundEffectsModal';
import { musicPlayer } from '../services/musicPlayerService';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VOICE_ROOM_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜',
  '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😏',
  '😒', '🙄', '😬', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵',
  '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '❤️',
  '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '💋', '👍', '👎', '👏',
  '🙌', '🤝', '👊', '🤞', '✌️', '🤟', '🤘', '👌', '👈', '👉',
  '👆', '👇', '👋', '🤙', '🙏', '🎉', '🎊', '🎈', '🎂', '🎁',
  '👑', '💎', '🌟', '✨', '🔥', '💥', '💯', '🎵', '🎶', '🎤',
  '🎧', '🍿', '🌹', '🌺', '🌸', '💐', '🍀', '⚡', '🌈', '🧸'
];

export default function VoiceRoomScreen({ route, navigation, currentUser }) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { roomId, roomTitle } = route.params;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatInputActive, setIsChatInputActive] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [selectedImageToSend, setSelectedImageToSend] = useState(null); // { uri, base64 }
  const [imageCaption, setImageCaption] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [mySeatIndex, setMySeatIndex] = useState(null);
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);
  const cardRef = useRef(null);

  const isEmojiPickerOpenRef = useRef(false);
  useEffect(() => {
    isEmojiPickerOpenRef.current = isEmojiPickerOpen;
  }, [isEmojiPickerOpen]);

  useEffect(() => {
    if (isChatInputActive && !isEmojiPickerOpen) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isChatInputActive, isEmojiPickerOpen]);

  // Modals state
  const [selectedSeatUser, setSelectedSeatUser] = useState(null);
  const [isHostActive, setIsHostActive] = useState(true);
  const [isHostMuted, setIsHostMuted] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [kickModalVisible, setKickModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [giftBanner, setGiftBanner] = useState(null);
  const [treasureBoxVisible, setTreasureBoxVisible] = useState(false);
  const [roomGoldContributed, setRoomGoldContributed] = useState(0);
  const [roomEmojiModalVisible, setRoomEmojiModalVisible] = useState(false);
  const [roomToolsModalVisible, setRoomToolsModalVisible] = useState(false);
  const [localMusicPlayerVisible, setLocalMusicPlayerVisible] = useState(false);
  const [myMusicModalVisible, setMyMusicModalVisible] = useState(false);
  const [soundEffectsModalVisible, setSoundEffectsModalVisible] = useState(false);
  const [roomMembersModalVisible, setRoomMembersModalVisible] = useState(false);
  const [roomSettingsModalVisible, setRoomSettingsModalVisible] = useState(false);
  const [myPeopleModalVisible, setMyPeopleModalVisible] = useState(false);
  const [kickedUsersModalVisible, setKickedUsersModalVisible] = useState(false);
  const [bossSeatModalVisible, setBossSeatModalVisible] = useState(false);
  const [seatSettingsModalVisible, setSeatSettingsModalVisible] = useState(false);
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [globalBroadcasts, setGlobalBroadcasts] = useState([]);
  const [roomJoinBanners, setRoomJoinBanners] = useState([]);
  const [luckyPacketModalVisible, setLuckyPacketModalVisible] = useState(false);
  const [roomLuckyPackets, setRoomLuckyPackets] = useState([]);
  const [globalLuckyPackets, setGlobalLuckyPackets] = useState([]);
  const [luckyPasswordPacket, setLuckyPasswordPacket] = useState(null);
  const [luckyClaimSubmitting, setLuckyClaimSubmitting] = useState(false);
  const [luckyResult, setLuckyResult] = useState({ visible: false, wonCoins: 0 });
  const [myPeopleInitialTab, setMyPeopleInitialTab] = useState('Host');
  const [activeHostEmoji, setActiveHostEmoji] = useState(null);
  const [activeSeatEmojis, setActiveSeatEmojis] = useState({});
  const [seatPopoverVisible, setSeatPopoverVisible] = useState(false);
  const [seatPopoverTargetSeat, setSeatPopoverTargetSeat] = useState(null);
  const [roomMembersInitialTab, setRoomMembersInitialTab] = useState('applicants');
  const [targetSeatIndex, setTargetSeatIndex] = useState(null);
  const [seatPopoverCoords, setSeatPopoverCoords] = useState(null);

  // PK Battle State
  const [choosePkModalVisible, setChoosePkModalVisible] = useState(false);
  const [inviteRoomPkModalVisible, setInviteRoomPkModalVisible] = useState(false);
  const [pkInviteReceived, setPkInviteReceived] = useState(null);
  const [pkBattle, setPkBattle] = useState(null);
  const [pkRemainingSeconds, setPkRemainingSeconds] = useState(300);
  const [pkResult, setPkResult] = useState(null);
  const [isMatchingPk, setIsMatchingPk] = useState(false);

  // PK Reverse Countdown Timer
  useEffect(() => {
    let timer = null;
    if (pkBattle && pkRemainingSeconds > 0) {
      timer = setInterval(() => {
        setPkRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pkBattle, pkRemainingSeconds]);

  const roomOwnerId = room?.owner?._id ? room.owner._id.toString() : (room?.owner ? room.owner.toString() : '');
  const currentUserIdStr = currentUser?._id ? currentUser._id.toString() : '';
  const isOwner = Boolean(roomOwnerId && currentUserIdStr && roomOwnerId === currentUserIdStr);
  const isAdmin = Boolean(
    room?.admins &&
      room.admins.some(
        (aId) => (aId._id ? aId._id.toString() : aId.toString()) === currentUserIdStr
      )
  );

  // Host rights are granted ONLY when host seat is occupied (Conforming to Admin Rights table)
  const isHost = Boolean(
    isHostActive &&
      mySeatIndex === null &&
      (isOwner ||
        (room?.hosts &&
          room.hosts.some(
            (hId) => (hId._id ? hId._id.toString() : hId.toString()) === currentUserIdStr
          )))
  );

  const socketRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatListRef = useRef(null);
  const chatScrollTimeoutRef = useRef(null);
  const isChatAtBottomRef = useRef(true);

  const scrollChatToLatest = () => {
    if (!isChatAtBottomRef.current) return;
    if (chatScrollTimeoutRef.current) {
      clearTimeout(chatScrollTimeoutRef.current);
    }
    chatScrollTimeoutRef.current = setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
      isChatAtBottomRef.current = true;
      chatScrollTimeoutRef.current = null;
    }, 50);
  };

  const handleChatScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isChatAtBottomRef.current = distanceFromBottom <= 48;

    if (!isChatAtBottomRef.current && chatScrollTimeoutRef.current) {
      clearTimeout(chatScrollTimeoutRef.current);
      chatScrollTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    scrollChatToLatest();
  }, [messages]);

  useEffect(() => () => {
    if (chatScrollTimeoutRef.current) clearTimeout(chatScrollTimeoutRef.current);
  }, []);

  const upsertLuckyPacket = (packet) => {
    if (!packet?.id) return;
    const myId = currentUser?._id ? String(currentUser._id) : '';
    const claimedByMe = Array.isArray(packet.claimedUserIds)
      ? packet.claimedUserIds.some((id) => String(id) === myId)
      : Boolean(packet.claimedByMe);
    const normalized = { ...packet, claimedByMe };
    setRoomLuckyPackets((prev) => {
      const rest = prev.filter((p) => String(p.id) !== String(normalized.id));
      return [normalized, ...rest].slice(0, 8);
    });
  };

  const fetchRoomLuckyPackets = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}/lucky-packets`);
      if (res.data?.success) {
        setRoomLuckyPackets(res.data.packets || []);
      }
    } catch (err) {
      console.warn('Failed to load lucky packets', err?.message);
    }
  };

  const claimLuckyPacket = async (packet, password) => {
    if (!packet?.id) return;
    setLuckyClaimSubmitting(true);
    try {
      const res = await api.post(`/rooms/${roomId}/lucky-packets/${packet.id}/claim`, {
        password: password || undefined,
      });
      if (res.data?.success) {
        if (res.data.packet) upsertLuckyPacket(res.data.packet);
        if (currentUser && res.data.remainingCoins !== undefined) {
          currentUser.coins = res.data.remainingCoins;
        }
        setLuckyPasswordPacket(null);
        setLuckyResult({ visible: true, wonCoins: res.data.wonCoins || 0 });
      } else {
        showToast(t(res.data?.message || 'Failed to open lucky packet'), 'error');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to open lucky packet';
      showToast(t(errMsg), 'error');
      if (err?.response?.data?.packet) upsertLuckyPacket(err.response.data.packet);
    } finally {
      setLuckyClaimSubmitting(false);
    }
  };

  const handleLuckyGetPress = (packet) => {
    if (!packet) return;
    if (packet.claimedByMe) {
      showToast(t('You have already opened this lucky packet'), 'info');
      return;
    }
    if (packet.packetType === 'countdown' && packet.opensAt && new Date(packet.opensAt).getTime() > Date.now()) {
      showToast(t('Lucky package will open in 5 minutes'), 'info');
      return;
    }
    if (packet.packetType === 'password' || packet.hasPassword) {
      setLuckyPasswordPacket(packet);
      return;
    }
    claimLuckyPacket(packet);
  };

  const handleLuckyBannerPress = async (packetId) => {
    const packet = roomLuckyPackets.find((item) => String(item.id) === String(packetId));
    if (packet) {
      handleLuckyGetPress(packet);
      return;
    }

    try {
      const res = await api.get(`/rooms/${roomId}/lucky-packets`);
      const latestPacket = res.data?.packets?.find(
        (item) => String(item.id) === String(packetId)
      );
      if (!latestPacket) {
        showToast(t('This lucky packet is empty'), 'error');
        return;
      }
      upsertLuckyPacket(latestPacket);
      handleLuckyGetPress(latestPacket);
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to open lucky packet';
      showToast(t(errMsg), 'error');
    }
  };

  // Fetch Room info from API
  const fetchRoomDetails = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      if (res.data.success) {
        setRoom(res.data.room);
        if (res.data.room.goldContributed !== undefined) {
          setRoomGoldContributed(res.data.room.goldContributed);
        }
        if (res.data.room.isHostActive !== undefined) {
          setIsHostActive(res.data.room.isHostActive);
        }
        if (res.data.room.isHostMuted !== undefined) {
          setIsHostMuted(res.data.room.isHostMuted);
          const roomOwnerId = res.data.room.owner?._id || res.data.room.owner;
          if (currentUser?._id && roomOwnerId && String(currentUser._id) === String(roomOwnerId)) {
            setIsMicMuted(res.data.room.isHostMuted);
          }
        }

        const mySeat = res.data.room.seats.findIndex(
          (s) => s.user && s.user._id === currentUser?._id
        );
        setMySeatIndex(mySeat !== -1 ? mySeat : null);
        fetchRoomLuckyPackets();
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

    // Auto-close chat input card and adjust offset for real Android devices in Expo Go
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      if (Platform.OS === 'android') {
        const kbTop = e?.endCoordinates?.screenY || 0;
        requestAnimationFrame(() => {
          cardRef.current?.measureInWindow((x, y, width, height) => {
            if (height > 0 && kbTop > 0) {
              const cardBottom = y + height;
              const overlap = cardBottom - kbTop;
              // If keyboard is covering the card, offset by exact overlap + breathing space
              if (overlap > 15) {
                setAndroidKeyboardOffset(overlap + 14);
              } else {
                setAndroidKeyboardOffset(0);
              }
            }
          });
        });
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      if (Platform.OS === 'android') {
        setAndroidKeyboardOffset(0);
      }
      if (!isEmojiPickerOpenRef.current) {
        setIsChatInputActive(false);
      }
    });

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

    socket.on('error_message', ({ message }) => {
      if (message) {
        showToast(t(message), 'error');
      }
    });

    socket.on('seats_updated', ({ seats }) => {
      setRoom((prev) => (prev ? { ...prev, seats } : prev));
      const mySeat = seats.findIndex((s) => s.user && s.user._id === currentUser?._id);
      setMySeatIndex(mySeat !== -1 ? mySeat : null);
      if (mySeat !== -1 && seats[mySeat]?.isMuted !== undefined) {
        setIsMicMuted(Boolean(seats[mySeat].isMuted));
      }
    });

    socket.on('host_status_updated', ({ isHostActive: hActive }) => {
      setIsHostActive(hActive);
    });

    socket.on('host_mute_status_changed', ({ isHostMuted: hMuted }) => {
      setIsHostMuted(hMuted);
      if (isOwner) {
        setIsMicMuted(hMuted);
      }
    });

    socket.on('seat_mute_status_changed', ({ seatIndex, isMuted }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newSeats = [...prev.seats];
        if (newSeats[seatIndex]) {
          newSeats[seatIndex] = { ...newSeats[seatIndex], isMuted };
          if (newSeats[seatIndex].user?._id === currentUser?._id) {
            setIsMicMuted(isMuted);
          }
        }
        return { ...prev, seats: newSeats };
      });
    });

    socket.on('boss_seat_updated', ({ bossSeat: bSeat }) => {
      setRoom((prev) => (prev ? { ...prev, bossSeat: bSeat } : prev));
    });

    socket.on('seat_layout_updated', ({ seatLayout, seats }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          seatLayout,
          seats: seats || prev.seats,
        };
      });
      if (seats) {
        const mySeat = seats.findIndex((s) => s.user && s.user._id === currentUser?._id);
        setMySeatIndex(mySeat !== -1 ? mySeat : null);
      }
    });

    socket.on('free_mode_updated', ({ freeMode }) => {
      setRoom((prev) => (prev ? { ...prev, freeMode } : prev));
    });

    socket.on('seat_applicants_updated', ({ seatApplicants }) => {
      setRoom((prev) => (prev ? { ...prev, seatApplicants } : prev));
    });

    socket.on('room_lock_updated', ({ isLocked }) => {
      setRoom((prev) => (prev ? { ...prev, isLocked } : prev));
    });

    socket.on('new_chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('lucky_number_received', (result) => {
      if (
        result &&
        result.id &&
        Number.isInteger(result.number) &&
        result.number >= 1 &&
        result.number <= 100
      ) {
        setMessages((prev) => [
          ...prev,
          { _id: `lucky_${result.id}`, luckyNumber: result },
        ]);
      }
    });

    socket.on('user_joined_room', ({ user, timestamp }) => {
      if (!user?._id) return;
      const joinId = `join_${user._id}_${timestamp || Date.now()}`;
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.activeMembers?.some(
          (m) => String(m._id || m) === String(user._id)
        );
        if (!exists) {
          return {
            ...prev,
            activeMembers: [...(prev.activeMembers || []), user],
          };
        }
        return prev;
      });
      setRoomJoinBanners((prev) => {
        if (prev.some((item) => item.id === joinId)) return prev;
        return [...prev, { id: joinId, user }];
      });
    });

    socket.on('active_members_updated', ({ activeMembers }) => {
      if (activeMembers) {
        setRoom((prev) => (prev ? { ...prev, activeMembers } : prev));
      }
    });

    socket.on('gift_received_animation', (giftData) => {
      setGiftBanner(giftData);
      setTimeout(() => setGiftBanner(null), 4000);
      fetchRoomDetails();
    });

    // Real-time Global Room Broadcast across all rooms in app
    socket.on('global_room_broadcast', (broadcastData) => {
      if (broadcastData) {
        setGlobalBroadcasts((prev) => [...prev, broadcastData]);
      }
    });

    socket.on('global_lucky_packet_broadcast', (packetBroadcast) => {
      if (packetBroadcast) {
        setGlobalLuckyPackets((prev) => [...prev, packetBroadcast]);
      }
    });

    socket.on('lucky_packet_created', (packet) => {
      if (packet) upsertLuckyPacket(packet);
    });

    socket.on('lucky_packet_updated', (packet) => {
      if (packet) upsertLuckyPacket(packet);
    });

    socket.on('room_emoji_received', (data) => {
      if (!data) return;
      const dataUserId = data.userId ? String(data.userId) : '';

      setRoom((currentRoom) => {
        const roomOwnerId = currentRoom?.owner?._id
          ? String(currentRoom.owner._id)
          : (currentRoom?.owner ? String(currentRoom.owner) : '');
        const isTargetHost = Boolean(data.isHost || (roomOwnerId && dataUserId && roomOwnerId === dataUserId));

        if (isTargetHost) {
          setActiveHostEmoji({
            id: data.timestamp || Date.now(),
            emoji: data.emoji,
            emojiData: data.emojiData,
          });
        }

        let targetSeatIndex = data.seatIndex;
        if (targetSeatIndex === null || targetSeatIndex === undefined || targetSeatIndex === -1) {
          if (currentRoom?.seats) {
            const foundIdx = currentRoom.seats.findIndex((s) => s.user && String(s.user._id) === dataUserId);
            if (foundIdx !== -1) targetSeatIndex = foundIdx;
          }
        }

        if (targetSeatIndex !== null && targetSeatIndex !== undefined && targetSeatIndex !== -1) {
          setActiveSeatEmojis((prev) => ({
            ...prev,
            [targetSeatIndex]: {
              id: data.timestamp || Date.now(),
              emoji: data.emoji,
              emojiData: data.emojiData,
            },
          }));
        }

        return currentRoom;
      });

      setMessages((prev) => [
        ...prev,
        {
          system: true,
          isEmojiReaction: true,
          text: `✨ ${data.userName || 'User'} reacted ${data.emoji}`,
          _reactionId: `react_${data.timestamp}_${data.userId}`,
        },
      ]);
    });

    socket.on('user_kicked_from_room', ({ targetUserId, kickType, message }) => {
      const myId = currentUser?._id ? String(currentUser._id) : '';
      const targetId = targetUserId ? String(targetUserId) : '';
      if (myId && targetId && myId === targetId) {
        showToast(
          t(message || 'You have been kicked out of this room.'),
          'error'
        );
        navigation.goBack();
      }
    });

    // ══ PK BATTLE REAL-TIME LISTENERS ══
    socket.emit('get_room_pk_status', { roomId });

    socket.on('pk_matching_waiting', ({ message }) => {
      setIsMatchingPk(true);
      showToast(t(message || 'Searching for rival room...'), 'info');
    });

    socket.on('pk_no_active_rooms', ({ message }) => {
      setIsMatchingPk(false);
      showToast(t(message || 'No other active rooms online right now.'), 'info');
    });

    socket.on('pk_matching_cancelled', () => {
      setIsMatchingPk(false);
      showToast(t('Matchmaking cancelled'), 'info');
    });

    socket.on('pk_invite_received', (data) => {
      setPkInviteReceived(data);
    });

    socket.on('pk_invite_sent', ({ message }) => {
      showToast(t(message || 'PK Battle invitation sent!'), 'success');
    });

    socket.on('pk_invite_failed', ({ message }) => {
      showToast(t(message || 'Target room is already in a PK battle'), 'error');
    });

    socket.on('pk_invite_rejected', ({ message, targetRoomName }) => {
      showToast(`${t('PK battle rejected')}: ${targetRoomName || ''}`, 'error');
    });

    socket.on('pk_battle_started', (battle) => {
      setPkBattle(battle);
      setPkRemainingSeconds(battle.remainingSeconds || 300);
      setIsMatchingPk(false);
      setChoosePkModalVisible(false);
      setInviteRoomPkModalVisible(false);
      showToast(t('PK Battle Started!'), 'success');
    });

    socket.on('pk_score_updated', ({ room1Score, room2Score }) => {
      setPkBattle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          room1: { ...prev.room1, score: room1Score },
          room2: { ...prev.room2, score: room2Score },
        };
      });
    });

    socket.on('pk_timer_sync', ({ remainingSeconds }) => {
      if (remainingSeconds !== undefined) {
        setPkRemainingSeconds(remainingSeconds);
      }
    });

    socket.on('pk_battle_ended', (result) => {
      setPkBattle(null);
      setIsMatchingPk(false);
      setPkResult(result);
    });

    socket.on('pk_error', ({ message }) => {
      if (message) {
        showToast(t(message), 'error');
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      musicPlayer.stopAndUnload();
      socket.emit('leave_room', { roomId, userId: currentUser?._id });
      socket.disconnect();
    };
  }, [roomId]);

  const handleSeatPress = (seat, index, coords) => {
    if (seat.user) {
      setSelectedSeatUser({ ...seat.user, seatIndex: index });
    } else {
      // ── FREE MODE CHECK (When Free Mode is OFF, seat is protected) ──
      const isFreeMode = room?.freeMode !== false;
      if (!isFreeMode) {
        // If owner or admin: show Members / Invite floating popover (Matching Screenshot 1)
        if (isOwner || isAdmin) {
          setSeatPopoverTargetSeat({ seat, index });
          setTargetSeatIndex(index);
          setSeatPopoverCoords(coords || { x: 100, y: 350 });
          setSeatPopoverVisible(true);
          return;
        }

        // If audience: prompt to apply for seat
        Alert.alert(
          t('Apply for Seat 🪑'),
          t('Free Mode is OFF. Do you want to apply for this seat?'),
          [
            { text: t('Cancel'), style: 'cancel' },
            {
              text: t('Apply'),
              onPress: () => {
                socketRef.current?.emit('apply_for_seat', {
                  roomId,
                  userId: currentUser?._id,
                  seatIndex: index,
                });
                showToast(t('Application sent to host! 📨'), 'success');
              },
            },
          ]
        );
        return;
      }

      if (mySeatIndex !== null) {
        Alert.alert(t('Change Seat'), t('Do you want to switch to this seat?'), [
          { text: t('Cancel') },
          {
            text: t('Switch'),
            onPress: () => {
              socketRef.current?.emit('take_seat', {
                roomId,
                seatIndex: index,
                userId: currentUser?._id,
              });
            },
          },
        ]);
      } else {
        socketRef.current?.emit('take_seat', {
          roomId,
          seatIndex: index,
          userId: currentUser?._id,
        });
      }
    }
  };

  // Popover handlers (Matching Screenshot 1)
  const handleOpenMembersFromPopover = () => {
    setSeatPopoverVisible(false);
    setRoomMembersInitialTab('applicants');
    setRoomMembersModalVisible(true);
  };

  const handleOpenInviteFromPopover = () => {
    setSeatPopoverVisible(false);
    setRoomMembersInitialTab('participants');
    setRoomMembersModalVisible(true);
  };

  const POPOVER_CARD_WIDTH = 138;
  const POPOVER_CARD_HEIGHT = 92;

  const getSeatPopoverLayout = () => {
    if (!seatPopoverCoords) {
      return {
        cardStyle: {
          position: 'absolute',
          top: Math.round(SCREEN_HEIGHT * 0.44),
          left: 20,
        },
        arrowOffset: 26,
      };
    }

    let seatCenterX = 100;
    let cardTop = 360;

    if (
      typeof seatPopoverCoords.seatY === 'number' &&
      typeof seatPopoverCoords.seatX === 'number'
    ) {
      const seatW = seatPopoverCoords.seatWidth || 60;
      seatCenterX = seatPopoverCoords.seatX + seatW / 2;
      // In seatItem, the 48px circular seat is at the top.
      // Card top at seatY + 46 puts the top edge right under the circle,
      // and with arrow top: -6, the tip is at seatY + 40, physically attached to the seat!
      cardTop = seatPopoverCoords.seatY + 46;
    } else {
      seatCenterX = seatPopoverCoords.x || 100;
      cardTop = (seatPopoverCoords.y || 360) + 4;
    }

    // Keep card inside screen bounds
    let cardLeft = seatCenterX - 32;
    if (cardLeft + POPOVER_CARD_WIDTH > SCREEN_WIDTH - 12) {
      cardLeft = SCREEN_WIDTH - POPOVER_CARD_WIDTH - 12;
    }
    if (cardLeft < 12) {
      cardLeft = 12;
    }

    cardTop = Math.max(80, Math.min(cardTop, SCREEN_HEIGHT - POPOVER_CARD_HEIGHT - 90));

    // Pointer arrow aligns directly to the center of the seat circle
    let arrowOffset = seatCenterX - cardLeft - 6;
    arrowOffset = Math.max(16, Math.min(arrowOffset, POPOVER_CARD_WIDTH - 28));

    return {
      cardStyle: {
        position: 'absolute',
        top: cardTop,
        left: cardLeft,
      },
      arrowOffset,
    };
  };

  // Seat invitation & applicant handlers (Matching Screenshot 2)
  const handleInviteUserToSeat = (targetUser, seatIdx) => {
    const sIndex = seatIdx !== null && seatIdx !== undefined ? seatIdx : targetSeatIndex;
    socketRef.current?.emit('invite_to_seat', {
      roomId,
      targetUserId: targetUser._id,
      seatIndex: sIndex,
    });
    showToast(t(`Invited ${targetUser.name || 'user'} to seat! 🛋️`), 'success');
    setRoomMembersModalVisible(false);
  };

  const handleAcceptSeatApplicant = (applicantId, seatIdx) => {
    const sIndex = seatIdx !== null && seatIdx !== undefined ? seatIdx : targetSeatIndex;
    socketRef.current?.emit('accept_seat_applicant', {
      roomId,
      applicantId,
      seatIndex: sIndex,
    });
    showToast(t('Applicant placed on seat! 🎉'), 'success');
  };

  const handleRejectSeatApplicant = (applicantId) => {
    socketRef.current?.emit('reject_seat_applicant', {
      roomId,
      applicantId,
    });
    showToast(t('Application declined'), 'info');
  };

  const handleToggleFreeMode = (val) => {
    socketRef.current?.emit('toggle_free_mode', { roomId, freeMode: val });
    api.post(`/rooms/${roomId}/free-mode`, { freeMode: val }).catch(() => {});
    setRoom((prev) => (prev ? { ...prev, freeMode: val } : prev));
    showToast(
      val
        ? t('Free Mode Enabled (Anyone can take seats)')
        : t('Free Mode Disabled (Application required)'),
      'info'
    );
  };

  const handleToggleRoomLock = async (isLocked, password) => {
    try {
      if (isLocked) {
        setRoom((prev) => (prev ? { ...prev, isLocked: true } : prev));
        await api.post(`/rooms/${roomId}/lock`, { isLocked: true, password });
        socketRef.current?.emit('toggle_room_lock', { roomId, isLocked: true, password });
        showToast(t('Room password set and locked successfully'), 'success');
      } else {
        setRoom((prev) => (prev ? { ...prev, isLocked: false } : prev));
        await api.post(`/rooms/${roomId}/lock`, { isLocked: false });
        socketRef.current?.emit('toggle_room_lock', { roomId, isLocked: false });
        showToast(t('Room unlocked successfully'), 'info');
      }
    } catch (err) {
      setRoom((prev) => (prev ? { ...prev, isLocked: !isLocked } : prev));
      showToast(t(err.response?.data?.message || 'Failed to update room lock'), 'error');
    }
  };

  const handleApplySeatLayout = async (selectedLayout) => {
    try {
      const isReset = selectedLayout?.type === 'default' || !selectedLayout?.layoutId;
      const layoutId = isReset ? null : (selectedLayout?.id || selectedLayout?.layoutId);
      const layoutType = isReset ? 'default' : (selectedLayout?.type || (selectedLayout?.theme ? 'special' : 'regular'));
      const specialTheme = isReset ? null : (selectedLayout?.specialTheme || selectedLayout?.theme || null);
      const seatCount = isReset ? 8 : (selectedLayout?.seatCount || 8);
      const columns = isReset ? 4 : (selectedLayout?.columns || 4);

      const res = await api.put(`/rooms/${roomId}/seat-layout`, {
        layoutId,
        type: layoutType,
        seatCount,
        columns,
        specialTheme,
      });

      if (res.data.success) {
        const updatedSeatLayout = res.data.seatLayout || res.data.room?.seatLayout || {
          layoutId,
          type: layoutType,
          isActivated: !isReset,
          seatCount,
          columns,
          specialTheme,
        };
        const updatedSeats = res.data.seats || res.data.room?.seats;

        setRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(res.data.room || {}),
            seatLayout: updatedSeatLayout,
            seats: updatedSeats || prev.seats,
          };
        });

        setSeatSettingsModalVisible(false);
        showToast(
          isReset
            ? t('Seat layout reset to default')
            : t('Seat layout applied successfully! 🎉'),
          'success'
        );

        socketRef.current?.emit('update_seat_layout', {
          roomId,
          userId: currentUser?._id,
          seatLayout: updatedSeatLayout,
          seats: updatedSeats,
        });
      }
    } catch (err) {
      console.log('Seat layout update error:', err);
      showToast(
        t(err.response?.data?.message || err.message || 'Failed to update seat layout'),
        'error'
      );
    }
  };

  const handleLeaveSeat = () => {
    if (mySeatIndex !== null) {
      socketRef.current?.emit('leave_seat', {
        roomId,
        userId: currentUser?._id,
      });
      setMySeatIndex(null);
      setIsMicMuted(false);
      showToast(t('You left the mic seat 🪑'), 'info');
    }
    setSelectedSeatUser(null);
  };

  const handleBossSeatPress = (bossSeat) => {
    if (bossSeat?.user) {
      setSelectedSeatUser({ ...bossSeat.user, isBossSeat: true });
    } else {
      if (isOwner && isHostActive) {
        showToast(
          t('You are currently on the Host seat. Please step down from Host seat first.'),
          'info'
        );
        return;
      }

      Alert.alert(
        t('Take Boss Seat 🛋️'),
        t('Do you want to sit on the Boss Seat?'),
        [
          { text: t('Cancel') },
          {
            text: t('Take Seat'),
            onPress: () => {
              socketRef.current?.emit('take_boss_seat', {
                roomId,
                userId: currentUser?._id,
              });
              showToast(t('You took the Boss Seat 🛋️'), 'success');
              if (mySeatIndex !== null) {
                setMySeatIndex(null);
              }
            },
          },
        ]
      );
    }
  };

  const handleLeaveBossSeat = () => {
    socketRef.current?.emit('leave_boss_seat', {
      roomId,
      userId: currentUser?._id,
    });
    showToast(t('You stepped down from the Boss Seat 🛋️'), 'info');
    setSelectedSeatUser(null);
  };

  const handleLeaveHosting = () => {
    setIsHostActive(false);
    setIsMicMuted(false);
    socketRef.current?.emit('leave_host', {
      roomId,
      userId: currentUser?._id,
    });
    showToast(t('You stepped down from the Host seat 👑'), 'info');
    setSelectedSeatUser(null);
  };

  const handleTakeHost = () => {
    if (!isOwner) {
      showToast(t('Only the room owner can take the Host seat.'), 'info');
      return;
    }

    // Condition: If user is on a mic seat, confirm switching to Host seat
    if (mySeatIndex !== null) {
      Alert.alert(
        t('Take Host Seat 👑'),
        t('You are currently on a seat. Do you want to leave your seat and take the Host seat?'),
        [
          { text: t('Cancel') },
          {
            text: t('Take Host'),
            onPress: () => {
              socketRef.current?.emit('take_host', {
                roomId,
                userId: currentUser?._id,
              });
              setIsHostActive(true);
              setMySeatIndex(null);
              showToast(t('You took the Host seat 👑'), 'success');
              setSelectedSeatUser(null);
            },
          },
        ]
      );
      return;
    }

    setIsHostActive(true);
    socketRef.current?.emit('take_host', {
      roomId,
      userId: currentUser?._id,
    });
    showToast(t('You took the Host seat 👑'), 'success');
    setSelectedSeatUser(null);
  };

  const handleRemoveUserFromSeat = () => {
    if (!selectedSeatUser) return;
    socketRef.current?.emit('leave_seat', {
      roomId,
      userId: selectedSeatUser._id,
    });
    showToast(t('User was removed from seat 🪑'), 'info');
    setSelectedSeatUser(null);
  };

  const handleShareRoom = async () => {
    try {
      await Share.share({
        message: `Join my live voice room "${roomTitle || 'Voice Room'}" on YoYo! Room ID: ${room?.roomId || roomId?.slice(-6) || '8181956'}`,
      });
    } catch (e) {
      // User dismissed
    }
  };

  const handleToggleMic = () => {
    // Case 1: Sitting on a mic seat (Seat 1-8)
    if (mySeatIndex !== null) {
      const nextState = !isMicMuted;
      setIsMicMuted(nextState);
      socketRef.current?.emit('toggle_mic_mute', {
        roomId,
        seatIndex: mySeatIndex,
        isMuted: nextState,
        userId: currentUser?._id,
      });
      showToast(nextState ? t('Microphone Muted') : t('Microphone Unmuted'), 'info');
      return;
    }

    // Case 2: Room Owner on the Host Seat
    if (isOwner && isHostActive) {
      const nextState = !isMicMuted;
      setIsMicMuted(nextState);
      setIsHostMuted(nextState);
      socketRef.current?.emit('toggle_mic_mute', {
        roomId,
        isHost: true,
        isMuted: nextState,
        userId: currentUser?._id,
      });
      showToast(nextState ? t('Microphone Muted') : t('Microphone Unmuted'), 'info');
      return;
    }

    // Case 3: Audience member not on any mic seat
    showToast(t('Please take a mic seat first to speak'), 'info');
  };

  const handleCloseChatInput = () => {
    Keyboard.dismiss();
    setIsEmojiPickerOpen(false);
    setIsChatInputActive(false);
  };

  const handleToggleEmojiPicker = () => {
    if (isEmojiPickerOpen) {
      setIsEmojiPickerOpen(false);
      isEmojiPickerOpenRef.current = false;
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 60);
    } else {
      isEmojiPickerOpenRef.current = true;
      setIsEmojiPickerOpen(true);
      Keyboard.dismiss();
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit('send_chat_message', {
      roomId,
      sender: currentUser,
      message: chatInput.trim(),
    });
    setChatInput('');
    handleCloseChatInput();
  };

  const handlePickImage = async (shouldCrop = false) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required!'), 'info');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: shouldCrop,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        setSelectedImageToSend({
          uri: asset.uri,
          base64: base64Data,
        });
        handleCloseChatInput();
      }
    } catch (err) {
      console.error('Pick image error:', err);
      showToast(t('Failed to open photo picker'), 'error');
    }
  };

  const handleCropCurrentImage = async () => {
    await handlePickImage(true);
  };

  const handleConfirmSendPhoto = () => {
    if (!selectedImageToSend) return;
    socketRef.current?.emit('send_chat_message', {
      roomId,
      sender: currentUser,
      message: imageCaption.trim(),
      imageUrl: selectedImageToSend.base64,
    });
    setSelectedImageToSend(null);
    setImageCaption('');
    showToast(t('Photo sent to room!'), 'success');
  };

  const handleSendRoomEmoji = (emojiItem) => {
    setRoomEmojiModalVisible(false);

    const diceVal = emojiItem.isDice ? Math.floor(Math.random() * 6) + 1 : undefined;

    // Detect if current user is host or on a seat
    const rOwnerId = room?.owner?._id ? String(room.owner._id) : (room?.owner ? String(room.owner) : '');
    const cUserId = currentUser?._id ? String(currentUser._id) : '';
    const userIsHost = Boolean(isOwner || (rOwnerId && cUserId && rOwnerId === cUserId));

    let mySeatIdx = mySeatIndex;
    if (mySeatIdx === null || mySeatIdx === undefined || mySeatIdx < 0) {
      if (room?.seats) {
        const found = room.seats.findIndex((s) => s.user && String(s.user._id) === cUserId);
        if (found !== -1) mySeatIdx = found;
      }
    }

    const reactionId = Date.now();
    const payloadEmojiData = { ...emojiItem, diceValue: diceVal };

    // 1. INSTANT LOCAL VISUAL TRIGGER: Show emoji immediately on user's profile avatar
    if (userIsHost) {
      setActiveHostEmoji({
        id: reactionId,
        emoji: emojiItem.emoji,
        emojiData: payloadEmojiData,
      });
    } else if (mySeatIdx !== null && mySeatIdx !== undefined && mySeatIdx >= 0) {
      setActiveSeatEmojis((prev) => ({
        ...prev,
        [mySeatIdx]: {
          id: reactionId,
          emoji: emojiItem.emoji,
          emojiData: payloadEmojiData,
        },
      }));
    } else {
      // If user is audience, show on host avatar or room
      setActiveHostEmoji({
        id: reactionId,
        emoji: emojiItem.emoji,
        emojiData: payloadEmojiData,
      });
    }

    // 2. Broadcast via socket to everyone in the room
    socketRef.current?.emit('send_room_emoji', {
      roomId,
      userId: currentUser?._id,
      userName: currentUser?.name || 'User',
      userAvatar: currentUser?.avatar,
      seatIndex: mySeatIdx,
      isHost: userIsHost,
      emoji: emojiItem.emoji,
      emojiData: payloadEmojiData,
    });
  };

  const handleEmojiComplete = (target) => {
    if (target === 'host') {
      setActiveHostEmoji(null);
    } else {
      setActiveSeatEmojis((prev) => {
        const next = { ...prev };
        delete next[target];
        return next;
      });
    }
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
        const giftCost = (gift.coinPrice || 10) * (quantity || 1);
        socketRef.current.emit('broadcast_gift', {
          roomId,
          giftData: {
            senderName: currentUser.name,
            receiverName: selectedSeatUser ? selectedSeatUser.name : 'Room',
            giftName: gift.name,
            giftIcon: gift.iconUrl,
            quantity,
            coins: giftCost,
          },
        });
        setGiftModalVisible(false);
        showToast(t(`${gift.name} x${quantity} sent successfully!`), 'success');
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Coin balance low'), 'error');
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

        showToast(t(res.data.message || 'User kicked successfully'), 'success');
        setSelectedSeatUser(null);
        fetchRoomDetails();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Kick action failed'), 'error');
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

  const selectedUserIdStr = selectedSeatUser?._id ? selectedSeatUser._id.toString() : '';
  const isSelf = Boolean(selectedUserIdStr && currentUserIdStr && selectedUserIdStr === currentUserIdStr);

  const currentRoomLevel = room?.roomLevel || 1;
  const memberCount = room?.activeMembers?.length || 1;

  const BOX_THRESHOLDS = [12000, 42000, 92000, 172000, 272000];
  const currentBoxLevel = BOX_THRESHOLDS.findIndex((t) => roomGoldContributed < t) + 1 || 5;

  const safeBottomPadding = Math.max(insets.bottom + 10, Platform.OS === 'android' ? 44 : 24);
  const bottomBarHeight = safeBottomPadding + 48;

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
          {/* Left: Compact Glass Pill with Room Info (Tap opens members sheet) */}
          <TouchableOpacity
            style={styles.headerInfoPill}
            activeOpacity={0.8}
            onPress={() => setRoomMembersModalVisible(true)}
          >
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
          </TouchableOpacity>

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
              onPress={handleShareRoom}
            >
              <Image
                source={require('../../assets/icons/Share.png')}
                style={styles.headerShareIcon}
                resizeMode="contain"
              />
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
            isHostMuted={isHostMuted}
            onSeatPress={handleSeatPress}
            onHostPress={(hostUser) => {
              if (hostUser) setSelectedSeatUser(hostUser);
            }}
            currentUserId={currentUser?._id}
            isOwner={isOwner}
            onTreasureBoxPress={() => setTreasureBoxVisible(true)}
            roomGoldContributed={roomGoldContributed}
            activeHostEmoji={activeHostEmoji}
            activeSeatEmojis={activeSeatEmojis}
            onEmojiComplete={handleEmojiComplete}
            bossSeat={room?.bossSeat}
            onBossSeatPress={handleBossSeatPress}
            seatLayout={room?.seatLayout}
          />
        </ScrollView>

        {/* ══ 3. RIGHT FLOATING EVENT/GAME WIDGETS ══ */}
        <View
          style={[styles.rightFloatingWidgets, { bottom: bottomBarHeight + 8 }]}
          pointerEvents="box-none"
        >
          {/* Lucky Packets (right side, like other voice chat apps) */}
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

          {roomLuckyPackets
            .filter((p) => p && p.status !== 'exhausted')
            .map((packet) => (
              <LuckyPacketWidget
                key={packet.id}
                packet={packet}
                onGetPress={handleLuckyGetPress}
              />
            ))}
        </View>

        {/* ══ 4. BOTTOM-LEFT NOTICE & CHAT OVERLAY ══ */}
        <View
          style={[styles.bottomLeftChatSection, { bottom: bottomBarHeight + 4 }]}
          pointerEvents="box-none"
        >
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={(item, i) => `${item._id || item.id || item.timestamp || 'msg'}_${i}`}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleChatScroll}
            scrollEventThrottle={16}
            onContentSizeChange={scrollChatToLatest}
            ListHeaderComponent={
              <View style={styles.noticeBubble}>
                <Text style={styles.noticeText}>
                  <T>Sexual and violent contents are not allowed. All violators will be banned from the chatroom. Please respect each other and do not expose your personal info.</T>
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.luckyNumber) {
                const result = item.luckyNumber;
                return (
                  <View style={styles.luckyNumberCard}>
                    <View style={styles.luckyNumberSenderRow}>
                      {result.sender?.avatar ? (
                        <Image
                          source={{ uri: result.sender.avatar }}
                          style={styles.luckyNumberAvatar}
                        />
                      ) : null}
                      <Text style={styles.luckyNumberSender} numberOfLines={1}>
                        Lv.{result.sender?.wealthLevel || 1} {result.sender?.name || 'User'}
                      </Text>
                    </View>
                    <Text style={styles.luckyNumberLabel}><T>Lucky number</T></Text>
                    <Text style={styles.luckyNumberValue}>{result.number}</Text>
                  </View>
                );
              }

              return item.system ? (
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
                  {item.message ? (
                    <Text style={styles.chatMessageContent}>{item.message}</Text>
                  ) : null}
                  {item.imageUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setSelectedImagePreview(item.imageUrl)}
                      style={styles.chatImageWrap}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.chatImage}
                        resizeMode="cover"
                        onLoad={scrollChatToLatest}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            }}
          />
        </View>

        {/* ══ 5. FLOATING TRANSLUCENT BOTTOM CONTROL BAR ══ */}
        {!isChatInputActive && (
          <View style={[styles.floatingBottomBar, { paddingBottom: safeBottomPadding }]}>
            {/* Comment button pill */}
            <TouchableOpacity
              style={styles.commentPill}
              activeOpacity={0.8}
              onPress={() => {
                setIsChatInputActive(true);
                setIsEmojiPickerOpen(false);
              }}
            >
              <Text
                style={styles.commentPillText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {chatInput ? chatInput : t('Write a comment...')}
              </Text>
            </TouchableOpacity>

            {/* Quick Action Circle Icons */}
            <View style={styles.bottomIconGroup}>
              {/* Emoji */}
              <TouchableOpacity
                style={styles.bottomCircleBtn}
                activeOpacity={0.75}
                onPress={() => setRoomEmojiModalVisible(true)}
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
                onPress={handleToggleMic}
              >
                <Image
                  source={require('../../assets/icons/Mike.png')}
                  style={[
                    styles.bottomIconImg,
                    { tintColor: isMicMuted ? '#EF4444' : '#FFFFFF' },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Menu / DailyHunt / Room Tools */}
              <TouchableOpacity
                style={styles.bottomCircleBtn}
                activeOpacity={0.75}
                onPress={() => setRoomToolsModalVisible(true)}
              >
                <Image
                  source={require('../../assets/icons/DailyHunt.png')}
                  style={styles.bottomIconImg}
                  resizeMode="contain"
                />
                <View style={styles.redBadgeDot} />
              </TouchableOpacity>

              {/* Chat */}
              <TouchableOpacity
                style={styles.bottomCircleBtn}
                activeOpacity={0.75}
                onPress={() => {
                  setIsChatInputActive(true);
                  setIsEmojiPickerOpen(false);
                }}
              >
                <Text style={styles.bottomEmoji}>💬</Text>
              </TouchableOpacity>

              {/* Game */}
              <TouchableOpacity
                style={styles.bottomCircleBtn}
                activeOpacity={0.75}
                onPress={() => {}}
              >
                <Image
                  source={require('../../assets/icons/Game.png')}
                  style={styles.bottomIconImg}
                  resizeMode="contain"
                />
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
        )}

        {/* ══ 6. ACTIVE CHAT INPUT OVERLAY (White Card above keyboard matching screenshot) ══ */}
        {isChatInputActive && (
          <View style={styles.chatInputModalContainer} pointerEvents="box-none">
            {/* Transparent touch-to-dismiss backdrop above card */}
            <TouchableOpacity
              style={styles.chatModalBackdrop}
              activeOpacity={1}
              onPress={handleCloseChatInput}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.chatKeyboardCardWrapper,
                Platform.OS === 'android' && { paddingBottom: androidKeyboardOffset },
              ]}
            >
              <View
                ref={cardRef}
                collapsable={false}
                style={[
                  styles.chatWhiteCard,
                  {
                    paddingBottom: isEmojiPickerOpen
                      ? 10
                      : (Platform.OS === 'android' ? (androidKeyboardOffset > 0 ? 8 : 14) : Math.max(insets.bottom, 14)),
                  },
                ]}
              >
                {/* Row 1: Quick Action Tools (Photo gallery button only, T and AI removed as requested) */}
                <View style={styles.chatToolsRow}>
                  <TouchableOpacity
                    style={styles.chatToolBtn}
                    activeOpacity={0.75}
                    onPress={() => handlePickImage(false)}
                  >
                    <Text style={styles.chatToolPhotoIcon}>🖼️</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2: Message Input Bar */}
                <View style={styles.chatInputRow}>
                  {/* Emoji / Keyboard toggle button */}
                  <TouchableOpacity
                    style={styles.chatEmojiToggleBtn}
                    activeOpacity={0.7}
                    onPress={handleToggleEmojiPicker}
                  >
                    <Text style={styles.chatEmojiToggleIcon}>
                      {isEmojiPickerOpen ? '⌨️' : '😊'}
                    </Text>
                  </TouchableOpacity>

                  {/* Rounded pill input field */}
                  <View style={styles.chatTextInputCapsule}>
                    <TextInput
                      ref={chatInputRef}
                      style={styles.chatTextInput}
                      placeholder={t('Say hi')}
                      placeholderTextColor="#9CA3AF"
                      value={chatInput}
                      onChangeText={setChatInput}
                      autoFocus={!isEmojiPickerOpen}
                      returnKeyType="send"
                      onSubmitEditing={handleSendChat}
                    />
                  </View>

                  {/* Circular Send Button */}
                  <TouchableOpacity
                    style={[
                      styles.chatSendCircleBtn,
                      chatInput.trim().length > 0 && styles.chatSendCircleBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleSendChat}
                  >
                    <Text
                      style={[
                        styles.chatSendCircleIcon,
                        chatInput.trim().length > 0 && styles.chatSendCircleIconActive,
                      ]}
                    >
                      ➤
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom White Spacer so keyboard NEVER touches the buttons */}
                {!isEmojiPickerOpen && <View style={styles.chatBottomSpacer} />}

                {/* Emoji Picker Board */}
                {isEmojiPickerOpen && (
                  <View style={styles.emojiPickerContainer}>
                    <View style={styles.emojiPickerHeader}>
                      <Text style={styles.emojiPickerTitle}>{t('Emojis')}</Text>
                      <TouchableOpacity
                        style={styles.emojiBackspaceBtn}
                        onPress={() => setChatInput((prev) => prev.slice(0, -2))}
                      >
                        <Text style={styles.emojiBackspaceIcon}>⌫</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      style={styles.emojiGridScroll}
                      contentContainerStyle={styles.emojiGridContent}
                      keyboardShouldPersistTaps="always"
                      showsVerticalScrollIndicator={false}
                    >
                      {VOICE_ROOM_EMOJIS.map((emoji, index) => (
                        <TouchableOpacity
                          key={`emoji_${index}`}
                          style={styles.emojiItemBtn}
                          activeOpacity={0.6}
                          onPress={() => setChatInput((prev) => prev + emoji)}
                        >
                          <Text style={styles.emojiItemText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        )}

        {/* Fullscreen Photo Preview Modal */}
        {selectedImagePreview && (
          <Modal visible={!!selectedImagePreview} transparent animationType="fade">
            <View style={styles.imagePreviewModalBg}>
              <TouchableOpacity
                style={[styles.imagePreviewCloseBtn, { top: Math.max(20, insets.top + 10) }]}
                onPress={() => setSelectedImagePreview(null)}
              >
                <Text style={styles.imagePreviewCloseText}>✕</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImagePreview }}
                style={styles.imagePreviewLarge}
                resizeMode="contain"
              />
            </View>
          </Modal>
        )}

        {/* ══ PHOTO SEND CONFIRMATION MODAL (Clear Preview with Send, Cancel, and Crop options) ══ */}
        {selectedImageToSend && (
          <Modal visible={!!selectedImageToSend} transparent animationType="slide">
            <View style={styles.sendPhotoModalOverlay}>
              <View style={styles.sendPhotoModalCard}>
                {/* Header */}
                <View style={styles.sendPhotoHeader}>
                  <Text style={styles.sendPhotoTitle}><T>Send Photo to Room</T></Text>
                  <TouchableOpacity
                    style={styles.sendPhotoCloseBtn}
                    onPress={() => {
                      setSelectedImageToSend(null);
                      setImageCaption('');
                    }}
                  >
                    <Text style={styles.sendPhotoCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Image Preview Box */}
                <View style={styles.sendPhotoPreviewContainer}>
                  <Image
                    source={{ uri: selectedImageToSend.uri }}
                    style={styles.sendPhotoImage}
                    resizeMode="contain"
                  />
                  {/* Crop / Edit Quick Action Pill */}
                  <TouchableOpacity
                    style={styles.sendPhotoCropPill}
                    activeOpacity={0.8}
                    onPress={handleCropCurrentImage}
                  >
                    <Text style={styles.sendPhotoCropText}>✂️ <T>Crop / Edit</T></Text>
                  </TouchableOpacity>
                </View>

                {/* Caption / Message Input */}
                <View style={styles.sendPhotoCaptionBox}>
                  <TextInput
                    style={styles.sendPhotoCaptionInput}
                    placeholder={t('Add a caption... (optional)')}
                    placeholderTextColor="#9CA3AF"
                    value={imageCaption}
                    onChangeText={setImageCaption}
                    maxLength={120}
                  />
                </View>

                {/* Action Buttons: Cancel and Send */}
                <View style={styles.sendPhotoActionsRow}>
                  <TouchableOpacity
                    style={styles.sendPhotoCancelBtn}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedImageToSend(null);
                      setImageCaption('');
                    }}
                  >
                    <Text style={styles.sendPhotoCancelText}><T>Cancel</T></Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendPhotoConfirmBtn}
                    activeOpacity={0.8}
                    onPress={handleConfirmSendPhoto}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#4F46E5']}
                      style={styles.sendPhotoConfirmGrad}
                    >
                      <Text style={styles.sendPhotoConfirmText}>➤ <T>Send Photo</T></Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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

                {/* 👑 1. LEAVE HOSTING / REMOVE HOST (Owner, Admin, or Self) */}
                {Boolean(
                  (selectedSeatUser?.isHostSeat || selectedUserIdStr === roomOwnerId) &&
                    isHostActive &&
                    (
                      isSelf ||
                      isOwner ||
                      (isAdmin && selectedUserIdStr !== roomOwnerId)
                    )
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
                    onPress={() => {
                      if (isSelf) {
                        handleLeaveHosting();
                      } else {
                        socketRef.current?.emit('leave_host', {
                          roomId,
                          userId: selectedSeatUser._id,
                        });
                        showToast(t('Host stepped down from Host seat'), 'info');
                        setSelectedSeatUser(null);
                      }
                    }}
                  >
                    <Text style={styles.actionEmoji}>👑</Text>
                    <Text style={[styles.actionLabel, { color: '#F59E0B' }]}>
                      <T>{isSelf ? 'Leave Hosting' : 'Remove Host'}</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 👑 1B. TAKE HOST */}
                {Boolean(
                  (selectedSeatUser?.isHostSeat || selectedUserIdStr === roomOwnerId) &&
                    !isHostActive &&
                    (isOwner || (room?.hosts && room.hosts.some(h => (h._id ? h._id.toString() : h.toString()) === currentUserIdStr)))
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
                    <Text style={[styles.actionLabel, { color: '#10B981' }]}>
                      <T>Take Host</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 🛋️ LEAVE BOSS SEAT */}
                {Boolean(selectedSeatUser?.isBossSeat && isSelf) && (
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
                      handleLeaveBossSeat();
                      setSelectedSeatUser(null);
                    }}
                  >
                    <Text style={styles.actionEmoji}>🚪</Text>
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>
                      <T>Leave Boss Seat</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 🛋️ REMOVE FROM BOSS SEAT (Owner and Admin) */}
                {Boolean(
                  selectedSeatUser?.isBossSeat &&
                    (isOwner || isAdmin) &&
                    !isSelf &&
                    selectedUserIdStr !== roomOwnerId
                ) && (
                  <TouchableOpacity
                    style={[
                      styles.actionBox,
                      {
                        borderColor: '#F43F5E',
                        borderWidth: 1,
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      },
                    ]}
                    onPress={() => {
                      socketRef.current?.emit('leave_boss_seat', {
                        roomId,
                        userId: selectedSeatUser._id,
                      });
                      showToast(t('User removed from Boss Seat'), 'info');
                      setSelectedSeatUser(null);
                    }}
                  >
                    <Image
                      source={require('../../assets/icons/SofaSeat.png')}
                      style={{ width: 22, height: 22, marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.actionLabel, { color: '#F43F5E' }]}>
                      <T>Remove Seat</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 🚪 2. LEAVE SEAT (Self on mic seat) */}
                {Boolean(!selectedSeatUser?.isHostSeat && !selectedSeatUser?.isBossSeat && isSelf && mySeatIndex !== null) && (
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
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>
                      <T>Leave Seat</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 🪑 3. REMOVE FROM SEAT (Kick off the seat: Owner, Admin, Host) */}
                {Boolean(
                  !selectedSeatUser?.isHostSeat &&
                    !selectedSeatUser?.isBossSeat &&
                    (isOwner || isAdmin || isHost) &&
                    !isSelf &&
                    selectedUserIdStr !== roomOwnerId
                ) && (
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
                    <Image
                      source={require('../../assets/icons/SofaSeat.png')}
                      style={{ width: 22, height: 22, marginBottom: 4 }}
                      resizeMode="contain"
                    />
                    <Text style={[styles.actionLabel, { color: '#F43F5E' }]}>
                      <T>Remove Seat</T>
                    </Text>
                  </TouchableOpacity>
                )}

                {/* 👢 4. KICK FROM ROOM (Kick off the room: Owner, Admin, Host) */}
                {Boolean(
                  (isOwner || isAdmin || isHost) &&
                    !isSelf &&
                    selectedUserIdStr !== roomOwnerId
                ) && (
                  <TouchableOpacity
                    style={[styles.actionBox, styles.kickActionBox]}
                    onPress={() => setKickModalVisible(true)}
                  >
                    <Text style={styles.actionEmoji}>👢</Text>
                    <Text style={[styles.actionLabel, { color: '#EF4444' }]}>
                      <T>Kick (3d/Perm)</T>
                    </Text>
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

      {/* ══ VOICE ROOM EMOJI REACTION MODAL ══ */}
      <VoiceRoomEmojiModal
        visible={roomEmojiModalVisible}
        onClose={() => setRoomEmojiModalVisible(false)}
        onSelectEmoji={handleSendRoomEmoji}
      />

      {/* ══ VOICE ROOM TOOLS MODAL (Basic tools, Entertainment tools, Other tools) ══ */}
      <VoiceRoomToolsModal
        visible={roomToolsModalVisible}
        onClose={() => setRoomToolsModalVisible(false)}
        roomPkActive={Boolean(pkBattle)}
        onSelectTool={(tool, toggledState) => {
          if (tool?.id === 'members') {
            setRoomToolsModalVisible(false);
            setRoomMembersModalVisible(true);
          } else if (tool?.id === 'room_settings') {
            setRoomToolsModalVisible(false);
            setRoomSettingsModalVisible(true);
          } else if (tool?.id === 'seat_settings' || tool?.id === 'seat_setting') {
            setRoomToolsModalVisible(false);
            setSeatSettingsModalVisible(true);
          } else if (tool?.id === 'broadcast') {
            setRoomToolsModalVisible(false);
            setBroadcastModalVisible(true);
          } else if (tool?.id === 'lucky_packet') {
            setRoomToolsModalVisible(false);
            setLuckyPacketModalVisible(true);
          } else if (tool?.id === 'lucky_number') {
            setRoomToolsModalVisible(false);
            socketRef.current?.emit('request_lucky_number', { roomId });
          } else if (tool?.id === 'room_pk') {
            if (toggledState) {
              setRoomToolsModalVisible(false);
              setChoosePkModalVisible(true);
            } else {
              // Toggled OFF -> Instant Forfeit as requested by user
              if (pkBattle) {
                socketRef.current?.emit('forfeit_pk_battle', { roomId });
                showToast(t('You forfeited the battle by turning off Room PK.'), 'error');
              } else if (isMatchingPk) {
                socketRef.current?.emit('cancel_pk_match', { roomId });
                setIsMatchingPk(false);
                showToast(t('Matchmaking cancelled'), 'info');
              }
            }
          } else if (tool?.id === 'my_music') {
            setRoomToolsModalVisible(false);
            setLocalMusicPlayerVisible(true);
          } else if (tool?.id === 'sound_effect') {
            setRoomToolsModalVisible(false);
            setSoundEffectsModalVisible(true);
          } else {
            console.log('Room tool selected:', tool.name, toggledState);
          }
        }}
      />

      {/* ══ LOCAL MUSIC PLAYER (Play local music - Screenshot 1) ══ */}
      <LocalMusicPlayerModal
        visible={localMusicPlayerVisible}
        onClose={() => setLocalMusicPlayerVisible(false)}
        onOpenPlaylist={() => setMyMusicModalVisible(true)}
      />

      {/* ══ MY MUSIC MODAL (Screenshots 2, 3, 4 - List, Add, Edit/Delete) ══ */}
      <MyMusicModal
        visible={myMusicModalVisible}
        onClose={() => setMyMusicModalVisible(false)}
      />

      {/* ══ SOUND EFFECTS MODAL ══ */}
      <SoundEffectsModal
        visible={soundEffectsModalVisible}
        onClose={() => setSoundEffectsModalVisible(false)}
      />

      {/* ══ ROOM MEMBERS MODAL (Applicants, On Seat, Participants - Matching Screenshot 2) ══ */}
      <RoomMembersModal
        visible={roomMembersModalVisible}
        onClose={() => setRoomMembersModalVisible(false)}
        room={room}
        isHostActive={isHostActive}
        isHostMuted={isHostMuted}
        currentUser={currentUser}
        initialTab={roomMembersInitialTab}
        targetSeatIndex={targetSeatIndex}
        onInviteUser={handleInviteUserToSeat}
        onAcceptApplicant={handleAcceptSeatApplicant}
        onRejectApplicant={handleRejectSeatApplicant}
        onSelectUser={(selectedUser) => {
          setSelectedSeatUser(selectedUser);
        }}
      />

      {/* ══ SEAT POPOVER MODAL (Members / Invite - Matching User Screenshot) ══ */}
      {(() => {
        const popoverLayout = getSeatPopoverLayout();
        return (
          <Modal
            visible={seatPopoverVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSeatPopoverVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setSeatPopoverVisible(false)}>
              <View style={styles.seatPopoverOverlay}>
                <TouchableWithoutFeedback>
                  <View style={[styles.seatPopoverCard, popoverLayout.cardStyle]}>
                    {/* Upward pointer arrow physically attaching popover to the seat circle */}
                    <View
                      style={[
                        styles.seatPopoverArrow,
                        { left: popoverLayout.arrowOffset },
                      ]}
                    />

                    <TouchableOpacity
                      style={styles.seatPopoverItem}
                      activeOpacity={0.75}
                      onPress={handleOpenMembersFromPopover}
                    >
                      <Text style={styles.seatPopoverIconText}>👤</Text>
                      <Text style={styles.seatPopoverText}>
                        <T>Members</T>
                      </Text>
                    </TouchableOpacity>

                <View style={styles.seatPopoverDivider} />

                <TouchableOpacity
                  style={styles.seatPopoverItem}
                  activeOpacity={0.75}
                  onPress={handleOpenInviteFromPopover}
                >
                  <Image
                    source={require('../../assets/icons/SofaSeat.png')}
                    style={styles.seatPopoverSofaImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.seatPopoverText}>
                    <T>Invite</T>
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  })()}

      {/* ══ ROOM SETTINGS MODAL (Matching User Screenshot) ══ */}
      <RoomSettingsModal
        visible={roomSettingsModalVisible}
        onClose={() => setRoomSettingsModalVisible(false)}
        room={room}
        onToggleFreeMode={handleToggleFreeMode}
        onToggleRoomLock={handleToggleRoomLock}
        onOpenPeople={(tab) => {
          setRoomSettingsModalVisible(false);
          setMyPeopleInitialTab(tab || 'Host');
          setMyPeopleModalVisible(true);
        }}
        onOpenKickedUsers={() => {
          setRoomSettingsModalVisible(false);
          setKickedUsersModalVisible(true);
        }}
        onOpenBossSeat={() => {
          setRoomSettingsModalVisible(false);
          setBossSeatModalVisible(true);
        }}
        onOpenSeatSettings={() => {
          setRoomSettingsModalVisible(false);
          setSeatSettingsModalVisible(true);
        }}
        onSelectAction={(actionKey) => {
          if (actionKey === 'room_members') {
            setRoomSettingsModalVisible(false);
            setMyPeopleInitialTab('Members');
            setMyPeopleModalVisible(true);
          } else if (actionKey === 'kicked_users') {
            setRoomSettingsModalVisible(false);
            setKickedUsersModalVisible(true);
          } else if (actionKey === 'boss_seat') {
            setRoomSettingsModalVisible(false);
            setBossSeatModalVisible(true);
          } else if (actionKey === 'seat_settings') {
            setRoomSettingsModalVisible(false);
            setSeatSettingsModalVisible(true);
          } else {
            showToast(t('Feature coming soon!'), 'info');
          }
        }}
      />

      {/* ══ MY PEOPLE MODAL (Host / Admin / Members) ══ */}
      <MyPeopleModal
        visible={myPeopleModalVisible}
        onClose={() => {
          setMyPeopleModalVisible(false);
          setRoomSettingsModalVisible(true);
        }}
        room={room}
        initialTab={myPeopleInitialTab}
        currentUser={currentUser}
      />

      {/* ══ KICKED-OUT USERS MODAL (Matching Screenshot) ══ */}
      <KickedUsersModal
        visible={kickedUsersModalVisible}
        onClose={() => {
          setKickedUsersModalVisible(false);
          setRoomSettingsModalVisible(true);
        }}
        room={room}
        socketRef={socketRef}
      />

      {/* ══ BOSS SEAT MODAL (Matching Screenshot) ══ */}
      <BossSeatModal
        visible={bossSeatModalVisible}
        onClose={() => {
          setBossSeatModalVisible(false);
          setRoomSettingsModalVisible(true);
        }}
        room={room}
        currentUser={currentUser}
        socketRef={socketRef}
        onBossSeatPurchased={(updatedBossSeat, remainingCoins) => {
          setRoom((prev) => (prev ? { ...prev, bossSeat: updatedBossSeat } : prev));
          if (remainingCoins !== undefined && currentUser) {
            currentUser.coins = remainingCoins;
          }
        }}
      />

      {/* ══ SEAT SETTINGS MODAL (Regular & Special Seats - Matching User Screenshots) ══ */}
      <SeatSettingsModal
        visible={seatSettingsModalVisible}
        onClose={() => setSeatSettingsModalVisible(false)}
        currentLayout={room?.seatLayout}
        room={room}
        currentUser={currentUser}
        onApplyLayout={handleApplySeatLayout}
      />

      {/* ══ GLOBAL ROOM BROADCAST MODAL (Matching Screenshot) ══ */}
      <BroadcastModal
        visible={broadcastModalVisible}
        onClose={() => setBroadcastModalVisible(false)}
        roomId={roomId}
        roomTitle={room?.title || roomTitle}
        currentUser={currentUser}
        onBroadcastSent={(remainingCoins) => {
          if (currentUser && remainingCoins !== undefined) {
            currentUser.coins = remainingCoins;
          }
        }}
      />

      <LuckyPacketModal
        visible={luckyPacketModalVisible}
        onClose={() => setLuckyPacketModalVisible(false)}
        roomId={roomId}
        currentUser={currentUser}
        onPacketSent={(remainingCoins, packet) => {
          if (currentUser && remainingCoins !== undefined) {
            currentUser.coins = remainingCoins;
          }
          if (packet) upsertLuckyPacket(packet);
        }}
      />

      <LuckyPacketPasswordModal
        visible={Boolean(luckyPasswordPacket)}
        onClose={() => setLuckyPasswordPacket(null)}
        submitting={luckyClaimSubmitting}
        onSubmit={(pwd) => claimLuckyPacket(luckyPasswordPacket, pwd)}
      />

      <LuckyPacketResultModal
        visible={luckyResult.visible}
        wonCoins={luckyResult.wonCoins}
        onClose={() => setLuckyResult({ visible: false, wonCoins: 0 })}
      />

      {/* ══ GLOBAL FLYING BROADCAST MESSAGES ACROSS ALL ROOMS (Top-most Touch Layer) ══ */}
      {globalBroadcasts.map((broadcastItem, bIdx) => (
        <View
          key={broadcastItem.id || `b_${bIdx}`}
          style={{
            position: 'absolute',
            top: Math.max(16, insets.top) + 60 + (bIdx * 56),
            left: 0,
            right: 0,
            height: 60,
            zIndex: 99999,
            elevation: 99999,
          }}
          pointerEvents="box-none"
        >
          <FlyingBroadcastBanner
            broadcast={broadcastItem}
            currentRoomId={roomId}
            onPressRoom={(targetRoomId, targetRoomTitle) => {
              showToast(t('Leaving current room & entering broadcast room...'), 'info');
              // Cleanly leave current room on socket
              socketRef.current?.emit('leave_room', { roomId, userId: currentUser?._id });
              // Instantly replace screen to target room
              navigation.replace('VoiceRoom', {
                roomId: targetRoomId,
                roomTitle: targetRoomTitle || 'Voice Room',
              });
            }}
            onFinished={(finishedId) => {
              setGlobalBroadcasts((prev) => prev.filter((item) => item.id !== finishedId));
            }}
          />
        </View>
      ))}

      {globalLuckyPackets.map((packetItem, pIdx) => (
        <View
          key={packetItem.id || `lp_${pIdx}`}
          style={{
            position: 'absolute',
            top: Math.max(16, insets.top) + 60 + (globalBroadcasts.length * 56) + (pIdx * 56),
            left: 0,
            right: 0,
            height: 60,
            zIndex: 99999,
            elevation: 99999,
          }}
          pointerEvents="box-none"
        >
          <FlyingLuckyPacketBanner
            broadcast={packetItem}
            currentRoomId={roomId}
            onPressPacket={handleLuckyBannerPress}
            onPressRoom={(targetRoomId, targetRoomTitle) => {
              showToast(t('Leaving current room & entering lucky packet room...'), 'info');
              socketRef.current?.emit('leave_room', { roomId, userId: currentUser?._id });
              navigation.replace('VoiceRoom', {
                roomId: targetRoomId,
                roomTitle: targetRoomTitle || 'Voice Room',
              });
            }}
            onFinished={(finishedId) => {
              setGlobalLuckyPackets((prev) => prev.filter((item) => item.id !== finishedId));
            }}
          />
        </View>
      ))}
      {roomJoinBanners.map((joinBanner, joinIdx) => (
        <View
          key={joinBanner.id}
          style={{
            position: 'absolute',
            top:
              Math.max(16, insets.top) +
              60 +
              ((globalBroadcasts.length + globalLuckyPackets.length + joinIdx) * 56),
            left: 0,
            right: 0,
            height: 48,
            zIndex: 99999,
            elevation: 99999,
          }}
          pointerEvents="none"
        >
          <FlyingRoomJoinBanner
            user={joinBanner.user}
            onFinished={() => {
              setRoomJoinBanners((prev) => prev.filter((item) => item.id !== joinBanner.id));
            }}
          />
        </View>
      ))}
      {/* ══ REAL-TIME MOVABLE PK BATTLE FLOATING WIDGET (Matching Screenshot 2) ══ */}
      {Boolean(pkBattle) && (
        <PkBattleFloatingWidget
          battleData={pkBattle}
          remainingSeconds={pkRemainingSeconds}
          currentRoomId={roomId}
          isOwnerOrAdmin={isOwner || isAdmin}
          onClose={() => {
            socketRef.current?.emit('forfeit_pk_battle', { roomId });
            showToast(t('You forfeited the battle by turning off Room PK.'), 'error');
          }}
        />
      )}

      {/* ══ CHOOSE TO PK MODE MODAL (Matching Screenshot 1) ══ */}
      <ChoosePkModeModal
        visible={choosePkModalVisible}
        onClose={() => setChoosePkModalVisible(false)}
        onSelectMatch={() => {
          if (!socketRef.current) return;
          setIsMatchingPk(true);
          socketRef.current.emit('request_pk_match', {
            roomId,
            roomName: room?.title || roomTitle,
            roomAvatar: room?.coverImage || '',
          });
        }}
        onSelectInvite={() => {
          setInviteRoomPkModalVisible(true);
        }}
      />

      {/* ══ INVITE A ROOM MODAL (Matching Screenshot 3) ══ */}
      <InviteRoomPkModal
        visible={inviteRoomPkModalVisible}
        onClose={() => setInviteRoomPkModalVisible(false)}
        currentRoomId={roomId}
        onInviteRoom={(targetRoom) => {
          if (!socketRef.current) return;
          socketRef.current.emit('send_pk_invite', {
            fromRoomId: roomId,
            fromRoomName: room?.title || roomTitle,
            fromRoomAvatar: room?.coverImage || '',
            targetRoomId: targetRoom._id,
          });
        }}
      />

      {/* ══ INCOMING PK CHALLENGE MODAL ══ */}
      <PkInviteReceivedModal
        visible={Boolean(pkInviteReceived)}
        invitation={pkInviteReceived}
        onAccept={() => {
          if (!socketRef.current || !pkInviteReceived) return;
          socketRef.current.emit('respond_pk_invite', {
            fromRoomId: pkInviteReceived.fromRoomId,
            fromRoomName: pkInviteReceived.fromRoomName,
            fromRoomAvatar: pkInviteReceived.fromRoomAvatar,
            targetRoomId: roomId,
            targetRoomName: room?.title || roomTitle,
            targetRoomAvatar: room?.coverImage || '',
            accepted: true,
          });
          setPkInviteReceived(null);
        }}
        onReject={() => {
          if (!socketRef.current || !pkInviteReceived) return;
          socketRef.current.emit('respond_pk_invite', {
            fromRoomId: pkInviteReceived.fromRoomId,
            fromRoomName: pkInviteReceived.fromRoomName,
            fromRoomAvatar: pkInviteReceived.fromRoomAvatar,
            targetRoomId: roomId,
            targetRoomName: room?.title || roomTitle,
            targetRoomAvatar: room?.coverImage || '',
            accepted: false,
          });
          setPkInviteReceived(null);
        }}
      />

      {/* ══ PK BATTLE END RESULT MODAL (Win / Defeat / Draw) ══ */}
      <PkBattleResultModal
        visible={Boolean(pkResult)}
        resultData={pkResult}
        currentRoomId={roomId}
        onClose={() => setPkResult(null)}
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
  headerShareIcon: {
    width: 18,
    height: 18,
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
    height: 180,
    zIndex: 15,
    overflow: 'hidden',
  },
  luckyNumberCard: {
    alignSelf: 'flex-start',
    minWidth: 168,
    maxWidth: '100%',
    backgroundColor: 'rgba(30, 30, 45, 0.68)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.45)',
  },
  luckyNumberSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  luckyNumberAvatar: {
    width: 23,
    height: 23,
    borderRadius: 12,
    marginRight: 6,
  },
  luckyNumberSender: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  luckyNumberLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  luckyNumberValue: {
    color: '#FACC15',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
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
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 2,
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
    maxWidth: '92%',
  },
  chatSenderName: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  chatMessageContent: {
    color: '#FFFFFF',
    fontSize: 11,
    flexShrink: 1,
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
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 30,
  },
  commentPill: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 18,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  commentPillText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontSize: 15,
  },
  bottomIconImg: {
    width: 20,
    height: 20,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowColor: '#F43F5E',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomGiftGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bottomGiftEmoji: {
    fontSize: 19,
  },

  /* ── 6. Active Chat Input Overlay (White card matching screenshot) ── */
  chatInputModalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  chatModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  chatKeyboardCardWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  chatWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  chatToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  chatToolBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatToolPhotoIcon: {
    fontSize: 20,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  chatBottomSpacer: {
    height: 12,
    width: '100%',
  },
  chatEmojiToggleBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmojiToggleIcon: {
    fontSize: 24,
  },
  chatTextInputCapsule: {
    flex: 1,
    height: 42,
    backgroundColor: '#F3F4F6',
    borderRadius: 21,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  chatTextInput: {
    color: '#111827',
    fontSize: 14,
    paddingVertical: 0,
  },
  chatSendCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendCircleBtnActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  chatSendCircleIcon: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 2,
  },
  chatSendCircleIconActive: {
    color: '#FFFFFF',
  },

  /* ── Emoji Picker Board ── */
  emojiPickerContainer: {
    height: 250,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  emojiPickerTitle: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emojiBackspaceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  emojiBackspaceIcon: {
    fontSize: 18,
    color: '#4B5563',
  },
  emojiGridScroll: {
    flex: 1,
  },
  emojiGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  emojiItemBtn: {
    width: '10%',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiItemText: {
    fontSize: 22,
  },

  /* ── Image in Chat & Fullscreen Preview ── */
  chatImageWrap: {
    marginTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chatImage: {
    width: 140,
    height: 140,
    borderRadius: 10,
  },
  imagePreviewModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewCloseBtn: {
    position: 'absolute',
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  imagePreviewCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  imagePreviewLarge: {
    width: '92%',
    height: '75%',
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

  /* ── Photo Send Confirmation Modal ── */
  sendPhotoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sendPhotoModalCard: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendPhotoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sendPhotoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sendPhotoCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPhotoCloseIcon: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
  },
  sendPhotoPreviewContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#0F0F1A',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sendPhotoImage: {
    width: '100%',
    height: '100%',
  },
  sendPhotoCropPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendPhotoCropText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sendPhotoCaptionBox: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendPhotoCaptionInput: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 6,
  },
  sendPhotoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sendPhotoCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPhotoCancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendPhotoConfirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendPhotoConfirmGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPhotoConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── Seat Popover Styles (Matching Screenshot 1) ── */
  seatPopoverOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  seatPopoverCard: {
    position: 'absolute',
    backgroundColor: '#161622',
    borderRadius: 14,
    width: 138,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 9999,
  },
  seatPopoverArrow: {
    position: 'absolute',
    top: -6,
    width: 12,
    height: 12,
    backgroundColor: '#161622',
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderLeftColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 10,
  },
  seatPopoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  seatPopoverIconText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  seatPopoverSofaImg: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  seatPopoverText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  seatPopoverDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 12,
  },
});

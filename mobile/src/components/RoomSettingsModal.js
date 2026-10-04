import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

export default function RoomSettingsModal({
  visible,
  onClose,
  room,
  onSelectAction,
  onOpenPeople,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Local switch states matching Screenshot
  const [luckyNumberEnabled, setLuckyNumberEnabled] = useState(true);
  const [freeModeEnabled, setFreeModeEnabled] = useState(true);
  const [roomLockEnabled, setRoomLockEnabled] = useState(Boolean(room?.isLocked));

  const roomCoverUri =
    room?.coverImage ||
    room?.backgroundImage ||
    room?.owner?.avatar ||
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200';

  const roomTitle = room?.title || 'Voice Room';
  const displayRoomId =
    room?.roomId ||
    (room?._id ? (parseInt(room._id.toString().slice(-6), 16) || 8181995) : '8181995');
  const roomTopic = room?.topic || 'Chat';

  // Dynamic counts for members display (excluding room owner)
  const roomOwnerId = (room?.owner?._id || room?.owner || '').toString();
  const roomMemberCount = (room?.members || []).filter(
    (m) => (m._id ? m._id.toString() : m.toString()) !== roomOwnerId
  ).length;
  const adminCount = (room?.admins || []).filter(
    (a) => (a._id || a).toString() !== roomOwnerId
  ).length;
  const hostCount = (room?.hosts || []).filter(
    (h) => (h._id || h).toString() !== roomOwnerId
  ).length;
  const maxSeats = room?.seats?.length || 21;

  const handleItemClick = (key, title) => {
    if (key === 'host_team' && onOpenPeople) {
      onOpenPeople('Host');
      return;
    }
    if (key === 'admin_team' && onOpenPeople) {
      onOpenPeople('Admin');
      return;
    }
    if (key === 'room_members' && onOpenPeople) {
      onOpenPeople('Members');
      return;
    }
    if (onSelectAction) {
      onSelectAction(key);
    } else {
      showToast(t(`${title} feature coming soon!`), 'info');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(14, insets.top) }]}>
        {/* ══ 1. TOP HEADER ══ */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftSpacer} />
          <Text style={styles.headerTitle}>
            <T>Room Settings</T>
          </Text>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ══ 2. SCROLLABLE CONTENT ══ */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(30, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Room Profile Card */}
          <TouchableOpacity
            style={styles.roomProfileCard}
            activeOpacity={0.8}
            onPress={() => handleItemClick('room_info', 'Room Info')}
          >
            <Image
              source={{ uri: roomCoverUri }}
              style={styles.roomCoverImg}
              resizeMode="cover"
            />
            <View style={styles.roomInfoCol}>
              <Text style={styles.roomTitleText} numberOfLines={1}>
                {roomTitle}
              </Text>
              <Text style={styles.roomIdText}>ID: {displayRoomId}</Text>
              <Text style={styles.roomTopicText} numberOfLines={1}>
                {roomTopic}
              </Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>

          {/* ══ SECTION 1: MEMBERS ══ */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>
              <T>Members</T>
            </Text>

            {/* 1. Host Team */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('host_team', 'Host Team')}
            >
              <Text style={styles.menuIcon}>🎤</Text>
              <Text style={styles.menuTitle}>
                <T>Host Team</T> <Text style={styles.menuCount}>({hostCount}/{maxSeats})</Text>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* 2. Admin Team */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('admin_team', 'Admin Team')}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuTitle}>
                <T>Admin Team</T> <Text style={styles.menuCount}>({adminCount}/13)</Text>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* 3. Room Members */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('room_members', 'Room Members')}
            >
              <Text style={styles.menuIcon}>👥</Text>
              <Text style={styles.menuTitle}>
                <T>Room Members</T> <Text style={styles.menuCount}>({roomMemberCount}/140)</Text>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* 4. Kicked-out Users */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('kicked_users', 'Kicked-out Users')}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={styles.menuTitle}>
                <T>Kicked-out Users</T>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ══ SECTION 2: ROOM TOOLS ══ */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>
              <T>Room Tools</T>
            </Text>

            {/* 1. Boss Seat */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('boss_seat', 'Boss Seat')}
            >
              <Text style={styles.menuIcon}>🛋️</Text>
              <Text style={styles.menuTitle}>
                <T>Boss Seat</T>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* 2. Background */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.75}
              onPress={() => handleItemClick('background', 'Background')}
            >
              <Text style={styles.menuIcon}>🎨</Text>
              <Text style={styles.menuTitle}>
                <T>Background</T>
              </Text>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            {/* 3. Lucky Number (Toggle) */}
            <View style={styles.menuRowWithSwitch}>
              <Text style={styles.menuIcon}>🎲</Text>
              <View style={styles.switchInfoCol}>
                <Text style={styles.switchTitle}>
                  <T>Lucky Number</T>
                </Text>
                <Text style={styles.switchSubtitle}>
                  <T>Allow audience to send Lucky Number in the room</T>
                </Text>
              </View>
              <Switch
                value={luckyNumberEnabled}
                onValueChange={(val) => setLuckyNumberEnabled(val)}
                trackColor={{ false: '#4B5563', true: '#00D293' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 4. Free Mode (Toggle) */}
            <View style={styles.menuRowWithSwitch}>
              <Text style={styles.menuIcon}>🛋️</Text>
              <View style={styles.switchInfoCol}>
                <Text style={styles.switchTitle}>
                  <T>Free Mode</T>
                </Text>
                <Text style={styles.switchSubtitle}>
                  <T>Allow audience to take seats freely</T>
                </Text>
              </View>
              <Switch
                value={freeModeEnabled}
                onValueChange={(val) => setFreeModeEnabled(val)}
                trackColor={{ false: '#4B5563', true: '#00D293' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 5. Room Lock (Toggle) */}
            <View style={styles.menuRowWithSwitch}>
              <Text style={styles.menuIcon}>🔒</Text>
              <View style={styles.switchInfoCol}>
                <Text style={styles.switchTitle}>
                  <T>Room Lock</T>
                </Text>
                <Text style={styles.switchSubtitle}>
                  <T>Enter the room with password</T>
                </Text>
              </View>
              <Switch
                value={roomLockEnabled}
                onValueChange={(val) => {
                  setRoomLockEnabled(val);
                  handleItemClick('room_lock', 'Room Lock');
                }}
                trackColor={{ false: '#4B5563', true: '#00D293' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#26262B', // Dark charcoal matching Screenshot exactly
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeftSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  /* ══ TOP ROOM PROFILE CARD ══ */
  roomProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 24,
  },
  roomCoverImg: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#374151',
    marginRight: 14,
  },
  roomInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  roomTitleText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roomIdText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 3,
  },
  roomTopicText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  chevronIcon: {
    fontSize: 22,
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: 8,
  },

  /* ══ SECTIONS ══ */
  sectionWrap: {
    marginBottom: 28,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  menuIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuCount: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  /* ══ SWITCH ROWS ══ */
  menuRowWithSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  switchSubtitle: {
    fontSize: 11.5,
    color: '#9CA3AF',
    lineHeight: 15,
  },
});

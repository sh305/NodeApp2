import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Ellipse } from 'react-native-svg';
import api from '../api/client';
import AvatarWithFrame from '../components/AvatarWithFrame';
import RoomLockModal from '../components/RoomLockModal';
import GamingView from '../components/GamingView';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

// 1. Top Green Hut / Live Voice Icon (Authentic YoYo Green Hut Silhouette + White Equalizer Soundwave Bars)
const GreenHutIcon = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    {/* Solid Green Hut Silhouette (peaked rounded roof, straight sides, curved bottom) */}
    <Path
      d="M4.5 11.5L12.7 4.2C13.5 3.5 14.5 3.5 15.3 4.2L23.5 11.5C24.4 12.3 25 13.5 25 14.8V21.5C25 23.5 23.5 25 21.5 25H6.5C4.5 25 3 23.5 3 21.5V14.8C3 13.5 3.6 12.3 4.5 11.5Z"
      fill="#00C853"
    />
    {/* 3 Vertical White Soundwave Bars with Rounded Caps */}
    <Rect x="8.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#FFFFFF" />
    <Rect x="12.8" y="7.5" width="2.4" height="13.5" rx="1.2" fill="#FFFFFF" />
    <Rect x="17.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#FFFFFF" />
  </Svg>
);

// 2. Search Magnifying Glass Icon (Crisp Optical Magnifier in #2D3748 Charcoal)
const SearchIcon = ({ size = 24, color = '#2D3748' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="10.5" cy="10.5" r="6.8" stroke={color} strokeWidth="2.4" />
    <Path
      d="M15.8 15.8L21 21"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </Svg>
);

// 3. Bottom Nav Bar Icons (5 YoYo-Authentic Pixel-Perfect Tabs)
// Tab 1: Room (Solid Green Hut when active, clean outline when inactive)
const NavRoomIcon = ({ active }) => (
  <Svg width={25} height={25} viewBox="0 0 28 28" fill="none">
    <Path
      d="M4.5 11.5L12.7 4.2C13.5 3.5 14.5 3.5 15.3 4.2L23.5 11.5C24.4 12.3 25 13.5 25 14.8V21.5C25 23.5 23.5 25 21.5 25H6.5C4.5 25 3 23.5 3 21.5V14.8C3 13.5 3.6 12.3 4.5 11.5Z"
      fill={active ? '#00C853' : 'none'}
      stroke={active ? '#00C853' : '#64748B'}
      strokeWidth={active ? 0 : 2}
    />
    {active ? (
      <>
        <Rect x="8.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#FFFFFF" />
        <Rect x="12.8" y="7.5" width="2.4" height="13.5" rx="1.2" fill="#FFFFFF" />
        <Rect x="17.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#FFFFFF" />
      </>
    ) : (
      <>
        <Rect x="8.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#64748B" />
        <Rect x="12.8" y="7.5" width="2.4" height="13.5" rx="1.2" fill="#64748B" />
        <Rect x="17.3" y="11" width="2.4" height="7.5" rx="1.2" fill="#64748B" />
      </>
    )}
  </Svg>
);

// Tab 2: Gaming (Game Controller)
const NavGamingIcon = ({ active }) => {
  const color = active ? '#00C853' : '#64748B';
  return (
    <Svg width={25} height={25} viewBox="0 0 28 28" fill="none">
      <Path
        d="M6.5 8H21.5C24 8 26 10 26 12.5C26 15.5 24 19.5 21 21C19.5 21.8 18 20.8 17 19.5L15.5 17.5H12.5L11 19.5C10 20.8 8.5 21.8 7 21C4 19.5 2 15.5 2 12.5C2 10 4 8 6.5 8Z"
        fill={active ? '#00C853' : 'none'}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M6 13H10M8 11V15"
        stroke={active ? '#FFFFFF' : color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Circle cx="18" cy="12" r="1.3" fill={active ? '#FFFFFF' : color} />
      <Circle cx="21" cy="14" r="1.3" fill={active ? '#FFFFFF' : color} />
    </Svg>
  );
};

// Tab 3: Discover (Saturn Planet with Orbital Ring - matching original YoYo screenshot)
const NavDiscoverIcon = ({ active }) => {
  const color = active ? '#00C853' : '#64748B';
  return (
    <Svg width={25} height={25} viewBox="0 0 28 28" fill="none">
      <G transform="rotate(-28 14 14)">
        <Circle
          cx="14"
          cy="14"
          r="6.5"
          fill={active ? '#00C853' : 'none'}
          stroke={color}
          strokeWidth="2"
        />
        <Ellipse
          cx="14"
          cy="14"
          rx="12"
          ry="4"
          stroke={color}
          strokeWidth="1.8"
          fill="none"
        />
      </G>
    </Svg>
  );
};

// Tab 4: Message (Clean Speech Bubble with 3 Dots)
const NavMessageIcon = ({ active }) => {
  const color = active ? '#00C853' : '#64748B';
  return (
    <Svg width={25} height={25} viewBox="0 0 28 28" fill="none">
      <Path
        d="M5 13C5 7.8 8.8 4 14 4C19.2 4 23 7.8 23 13C23 18.2 19.2 22 14 22C12.2 22 10.5 21.4 9.2 20.4L5.5 21.8C5 22 4.5 21.6 4.6 21.1L5.2 17.5C5.1 16 5 14.5 5 13Z"
        fill={active ? '#00C853' : 'none'}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Circle cx="9.5" cy="13" r="1.3" fill={active ? '#FFFFFF' : color} />
      <Circle cx="14" cy="13" r="1.3" fill={active ? '#FFFFFF' : color} />
      <Circle cx="18.5" cy="13" r="1.3" fill={active ? '#FFFFFF' : color} />
    </Svg>
  );
};

// Tab 5: Me (User Silhouette Avatar + Red Notification Badge Dot on Top-Right - matching original YoYo screenshot)
const NavMeIcon = ({ active }) => {
  const color = active ? '#00C853' : '#64748B';
  return (
    <View style={{ width: 25, height: 25, position: 'relative' }}>
      <Svg width={25} height={25} viewBox="0 0 28 28" fill="none">
        <Circle
          cx="14"
          cy="9"
          r="4.5"
          fill={active ? '#00C853' : 'none'}
          stroke={color}
          strokeWidth="2"
        />
        <Path
          d="M6 24C6 19 9.5 16 14 16C18.5 16 22 19 22 24"
          fill={active ? '#00C853' : 'none'}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
      {/* Red Notification Dot on Top Right of Me */}
      <View style={styles.meBadgeDot} />
    </View>
  );
};

export default function HomeScreen({ navigation, currentUser, onLogout }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Top Tabs: 'Related' | 'Party' | 'Activity'
  const [topTab, setTopTab] = useState('Related');

  // Sub Tabs: 'Recently' | 'Following'
  const [subTab, setSubTab] = useState('Recently');
  const [recentRooms, setRecentRooms] = useState([]);
  const [followingRooms, setFollowingRooms] = useState([]);
  const [subTabLoading, setSubTabLoading] = useState(false);

  // Bottom Navigation Bar: 'Room' | 'Gaming' | 'Discover' | 'Message' | 'Me'
  const [bottomTab, setBottomTab] = useState('Room');

  // Search query state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Check-in Modal
  const [checkinClaimed, setCheckinClaimed] = useState(false);

  // Rooms State
  const [rooms, setRooms] = useState([]);
  const [myRoom, setMyRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        // Find user's created room
        if (currentUser) {
          const userRoom = res.data.rooms.find(
            (r) => r.owner && (r.owner._id === currentUser._id || r.owner === currentUser._id)
          );
          setMyRoom(userRoom || null);
        }
      }
    } catch (e) {
      console.error('Fetch rooms error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentRooms = async () => {
    try {
      const res = await api.get('/users/recent-rooms');
      if (res.data.success) {
        setRecentRooms(res.data.rooms || []);
      }
    } catch (e) {
      console.log('Fetch recent rooms error:', e);
    }
  };

  const fetchFollowingRooms = async () => {
    try {
      const res = await api.get('/users/following/rooms');
      if (res.data.success) {
        setFollowingRooms(res.data.rooms || []);
      }
    } catch (e) {
      console.log('Fetch following rooms error:', e);
    }
  };

  const [profileData, setProfileData] = useState(currentUser);

  const fetchUserProfile = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await api.get(`/users/${currentUser._id}/profile`);
      if (res.data.success) {
        setProfileData(res.data.user);
      }
    } catch (e) {
      console.log('Error fetching user profile:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRecentRooms();
    fetchFollowingRooms();
    fetchUserProfile();
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
      fetchRecentRooms();
      fetchFollowingRooms();
      fetchUserProfile();
    }, [currentUser])
  );

  const handleConfirmLogout = () => {
    Alert.alert(
      t('Logout Account'),
      t('Are you sure you want to logout?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Logout'),
          style: 'destructive',
          onPress: () => {
            if (onLogout) onLogout();
          },
        },
      ]
    );
  };

  const handleRoomClick = (room) => {
    // Record this room in user's recent rooms
    api.post(`/users/recent-rooms/${room._id}`).catch(() => {});
    if (room.isLocked) {
      setLockedRoomTarget(room);
    } else {
      navigation.navigate('VoiceRoom', { roomId: room._id, roomTitle: room.title });
    }
  };

  const handleVerifyLockedRoom = async (password) => {
    if (!lockedRoomTarget) return;
    try {
      const res = await api.post(`/rooms/${lockedRoomTarget._id}/verify-password`, { password });
      if (res.data.success) {
        const target = lockedRoomTarget;
        setLockedRoomTarget(null);
        navigation.navigate('VoiceRoom', { roomId: target._id, roomTitle: target.title });
      }
    } catch (err) {
      showToast(t('Wrong Password! Please enter correct room password'), 'error');
    }
  };

  const handleMineCardClick = () => {
    if (myRoom) {
      handleRoomClick(myRoom);
    } else {
      setCreateModalVisible(true);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      showToast(t('Please enter a room title'), 'error');
      return;
    }
    if (isLockedNewRoom && !newRoomPassword.trim()) {
      showToast(t('Please enter a password for your locked room'), 'error');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/rooms', {
        title: newRoomTitle,
        topic: newRoomTopic || 'Chill & Music 🎧',
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
        showToast(t('Voice Room Created Successfully! 🎉'), 'success');
        navigation.navigate('VoiceRoom', {
          roomId: res.data.room._id,
          roomTitle: res.data.room.title,
        });
      }
    } catch (e) {
      showToast(e.response?.data?.message || t('Failed to create room'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDailyCheckin = () => {
    if (checkinClaimed) {
      showToast(t('Already Claimed Today! Come back tomorrow 🎉'), 'info');
    } else {
      setCheckinClaimed(true);
      showToast(t('Check-in Successful! +100 Coins Claimed 🎉'), 'success');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />
      {/* 1. TOP HEADER NAVIGATION BAR */}
      {bottomTab === 'Room' ? (
        <View style={[styles.topHeader, { paddingTop: Math.max(16, insets.top) }]}>
          {/* Left 3 Category Tabs: Related, Party, Activity */}
          <View style={styles.topTabsGroup}>
            {['Related', 'Party', 'Activity'].map((tab) => {
              const isActive = topTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.topTabItem}
                  activeOpacity={0.8}
                  onPress={() => setTopTab(tab)}
                >
                  <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>
                    {t(tab)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Right Header Action Icons */}
          <View style={styles.topRightGroup}>
            {/* Green Hut Button (Create Room / Launch) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCreateModalVisible(true)}
              style={styles.topHutBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <GreenHutIcon size={26} />
            </TouchableOpacity>

            {/* Search Icon */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSearchVisible(!searchVisible)}
              style={styles.topSearchBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SearchIcon size={24} color="#2D3748" />
            </TouchableOpacity>
          </View>
        </View>
      ) : bottomTab === 'Gaming' ? null : (
        <View style={[styles.otherTopHeader, { paddingTop: Math.max(16, insets.top) }]}>
          <Text style={styles.otherTopHeaderTitle}>
            {bottomTab === 'Me' ? t('My Profile') : t(bottomTab)}
          </Text>
        </View>
      )}

      {/* Search Input Bar (Dropdown - Only on Room Tab) */}
      {searchVisible && bottomTab === 'Room' && (
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchBarInput}
            placeholder={t('Search rooms, stars, or friends...')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. MAIN CONTENT AREA */}
      {bottomTab === 'Gaming' ? (
        <GamingView
          currentUser={currentUser}
          insets={insets}
          onNavigateTab={setBottomTab}
        />
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Conditional Content: Only show Mine card, Sub-Tabs, Recently & Following when bottomTab === 'Room' and topTab === 'Related' */}
        {bottomTab === 'Room' && topTab === 'Related' ? (
          <>
            {/* 2.1 "MINE" BANNER CARD (Shows user's real created room, or prompt to create one) */}
            {myRoom ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleRoomClick(myRoom)}
                style={styles.mineCardOuter}
              >
                <LinearGradient
                  colors={['#00E676', '#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mineCardGradient}
                >
                  {/* Orange "Mine" Badge in Top Right */}
                  <View style={styles.mineOrangeBadge}>
                    <Text style={styles.mineBadgeText}>{t('Mine')}</Text>
                  </View>

                  {/* Left Room Avatar Image */}
                  <Image
                    source={{
                      uri:
                        myRoom.coverImage ||
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                    }}
                    style={styles.mineAvatar}
                  />

                  {/* Middle: Real Created Room Title */}
                  <View style={styles.mineTitleWrap}>
                    <Text style={styles.mineRoomTitle} numberOfLines={1}>
                      {myRoom.title}
                    </Text>
                    <Text style={styles.mineSubNotice}>
                      {myRoom.topic || t('🟢 Live Voice Chat')}
                    </Text>
                  </View>

                  {/* Right: Signal online member count (e.g. 📶 1) */}
                  <View style={styles.mineSignalWrap}>
                    <Text style={styles.mineSignalIcon}>📶</Text>
                    <Text style={styles.mineSignalCount}>
                      {myRoom.activeMemberCount || 0}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setCreateModalVisible(true)}
                style={styles.createRoomPromptCard}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createRoomPromptGradient}
                >
                  <View style={styles.createPromptIconWrap}>
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3059/3059518.png' }}
                      style={{ width: 28, height: 28, tintColor: '#FFFFFF' }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.createPromptTitle}>{t('Create Your Voice Room')}</Text>
                    <Text style={styles.createPromptSub}>{t('Go live, invite friends & start voice chat')}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* 2.2 SUB-TABS (Recently vs Following) */}
            <View style={styles.subTabsRow}>
              <TouchableOpacity
                style={styles.subTabItem}
                activeOpacity={0.8}
                onPress={() => setSubTab('Recently')}
              >
                <Text style={[styles.subTabText, subTab === 'Recently' && styles.subTabTextActive]}>
                  {t('Recently')}
                </Text>
                {subTab === 'Recently' && <View style={styles.subTabIndicator} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subTabItem}
                activeOpacity={0.8}
                onPress={() => setSubTab('Following')}
              >
                <Text style={[styles.subTabText, subTab === 'Following' && styles.subTabTextActive]}>
                  {t('Following')}
                </Text>
                {subTab === 'Following' && <View style={styles.subTabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* 2.3 SUB-TAB CONTENT (Recently vs Following) */}
            {subTab === 'Recently' ? (
              recentRooms.length === 0 ? (
                <View style={styles.subTabEmptyWrap}>
                  <View style={styles.subTabEmptyIconBox}>
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075908.png' }}
                      style={{ width: 42, height: 42 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.subTabEmptyTitle}>{t('No Recently Visited Rooms')}</Text>
                  <Text style={styles.subTabEmptySub}>
                    {t('Rooms you join will appear here so you can easily rejoin anytime!')}
                  </Text>
                </View>
              ) : (
                <View style={styles.subTabRoomList}>
                  {recentRooms.map((room) => (
                    <TouchableOpacity
                      key={`recent-${room._id}`}
                      style={styles.subTabRoomCard}
                      activeOpacity={0.8}
                      onPress={() => handleRoomClick(room)}
                    >
                      <Image
                        source={{
                          uri:
                            room.coverImage ||
                            room.owner?.avatar ||
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                        }}
                        style={styles.subTabRoomAvatar}
                      />
                      <View style={styles.subTabRoomInfo}>
                        <View style={styles.subTabRoomTitleRow}>
                          <Text style={styles.subTabRoomTitle} numberOfLines={1}>
                            {room.title}
                          </Text>
                          {room.isLocked && <Text style={styles.subTabLockBadge}>🔒</Text>}
                        </View>
                        <Text style={styles.subTabRoomHost} numberOfLines={1}>
                          👤 {room.owner?.name || t('Host')} • {room.topic || t('Voice Chat')}
                        </Text>
                      </View>
                      <View style={styles.subTabSignalWrap}>
                        <Text style={styles.subTabSignalIcon}>📶</Text>
                        <Text style={styles.subTabSignalCount}>
                          {room.activeMemberCount || 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              /* Following Tab Content */
              followingRooms.length === 0 ? (
                <View style={styles.subTabEmptyWrap}>
                  <View style={styles.subTabEmptyIconBox}>
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/476/476863.png' }}
                      style={{ width: 42, height: 42 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.subTabEmptyTitle}>{t('No Followed Rooms Yet')}</Text>
                  <Text style={styles.subTabEmptySub}>
                    {t('Follow hosts to see their live voice rooms appear here!')}
                  </Text>
                </View>
              ) : (
                <View style={styles.subTabRoomList}>
                  {followingRooms.map((room) => (
                    <TouchableOpacity
                      key={`following-${room._id}`}
                      style={styles.subTabRoomCard}
                      activeOpacity={0.8}
                      onPress={() => handleRoomClick(room)}
                    >
                      <Image
                        source={{
                          uri:
                            room.coverImage ||
                            room.owner?.avatar ||
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                        }}
                        style={styles.subTabRoomAvatar}
                      />
                      <View style={styles.subTabRoomInfo}>
                        <View style={styles.subTabRoomTitleRow}>
                          <Text style={styles.subTabRoomTitle} numberOfLines={1}>
                            {room.title}
                          </Text>
                          {room.isLocked && <Text style={styles.subTabLockBadge}>🔒</Text>}
                        </View>
                        <Text style={styles.subTabRoomHost} numberOfLines={1}>
                          💚 {room.owner?.name || t('Host')} ({t('Following')})
                        </Text>
                      </View>
                      <View style={styles.subTabSignalWrap}>
                        <Text style={styles.subTabSignalIcon}>📶</Text>
                        <Text style={styles.subTabSignalCount}>
                          {room.activeMemberCount || 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
          </>
        ) : bottomTab === 'Room' ? (
          <View style={styles.tabComingSoonWrap}>
            <View style={styles.tabComingSoonCircle}>
              <Text style={{ fontSize: 36 }}>{topTab === 'Party' ? '🎉' : '🏆'}</Text>
            </View>
            <Text style={styles.tabComingSoonTitle}>
              {topTab === 'Party' ? t('Party Rooms') : t('Activity & Events')}
            </Text>
            <Text style={styles.tabComingSoonSub}>
              {t('Coming soon')}
            </Text>
          </View>
        ) : bottomTab === 'Me' ? (
          /* ================= ME / USER PROFILE TAB ================= */
          <View style={styles.meProfileWrap}>
            <View style={styles.meProfileCard}>
              <AvatarWithFrame
                avatarUri={profileData?.avatar || currentUser?.avatar}
                level={profileData?.wealthLevel || 1}
                size={90}
              />
              <Text style={styles.meProfileName}>
                {profileData?.name || currentUser?.name || t('User')}
              </Text>
              <Text style={styles.meProfileId}>
                ID: {currentUser?._id ? currentUser._id.slice(-8) : '10001'}
              </Text>

              {/* Wallet Stats (Coins & Diamonds) */}
              <View style={styles.meWalletRow}>
                <View style={styles.meWalletPill}>
                  <Text style={styles.meWalletIcon}>🪙</Text>
                  <Text style={styles.meWalletValue}>
                    {profileData?.coins ?? currentUser?.coins ?? 1000}
                  </Text>
                  <Text style={styles.meWalletLabel}>{t('Coins')}</Text>
                </View>
                <View style={styles.meWalletPill}>
                  <Text style={styles.meWalletIcon}>💎</Text>
                  <Text style={styles.meWalletValue}>
                    {profileData?.diamonds ?? currentUser?.diamonds ?? 0}
                  </Text>
                  <Text style={styles.meWalletLabel}>{t('Diamonds')}</Text>
                </View>
              </View>

              {/* Wealth & Charm Badges */}
              <View style={styles.meBadgesRow}>
                <View style={styles.meWealthBadge}>
                  <Text style={styles.meBadgeText}>
                    💰 {t('Wealth')} Lv.{profileData?.wealthLevel || 1}
                  </Text>
                </View>
                <View style={styles.meCharmBadge}>
                  <Text style={styles.meBadgeText}>
                    💖 {t('Charm')} Lv.{profileData?.charmLevel || 1}
                  </Text>
                </View>
              </View>

              {/* Active Frame */}
              <View style={styles.meFrameBadge}>
                <Text style={styles.meFrameBadgeText}>
                  🎖️ {t('Active Frame')}: {profileData?.activeFrame?.name || t('Novice Glow')}
                </Text>
              </View>

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.meLogoutBtn}
                activeOpacity={0.8}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.meLogoutBtnText}>🚪 {t('Logout Account')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.tabComingSoonWrap}>
            <View style={styles.tabComingSoonCircle}>
              <Text style={{ fontSize: 36 }}>
                {bottomTab === 'Gaming' ? '🎮' : bottomTab === 'Discover' ? '🌍' : '💬'}
              </Text>
            </View>
            <Text style={styles.tabComingSoonTitle}>{t(bottomTab)}</Text>
            <Text style={styles.tabComingSoonSub}>
              {t('Coming soon')}
            </Text>
          </View>
        )}
      </ScrollView>
      )}

      {/* 3. FLOATING DAILY CHECK-IN 3D CALENDAR WIDGET (Only on Room Tab) */}
      {bottomTab === 'Room' && (
        <TouchableOpacity
          style={[styles.floatingCheckinWidget, { bottom: 85 + insets.bottom }]}
          activeOpacity={0.85}
          onPress={handleDailyCheckin}
        >
          <View style={styles.calendarIconContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png' }}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
            {/* Red Notification Dot */}
            {!checkinClaimed && <View style={styles.calendarRedDot} />}
          </View>
        </TouchableOpacity>
      )}

      {/* 4. FIXED BOTTOM NAVIGATION BAR (5 TABS: ALWAYS VISIBLE ON ALL TABS) */}
      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(10, insets.bottom) }]}>
        {/* Tab 1: Room */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setBottomTab('Room')}
        >
          <NavRoomIcon active={bottomTab === 'Room'} />
          <Text style={[styles.navLabel, bottomTab === 'Room' && styles.navLabelActive]}>
            {t('Room')}
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Gaming */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setBottomTab('Gaming')}
        >
          <NavGamingIcon active={bottomTab === 'Gaming'} />
          <Text style={[styles.navLabel, bottomTab === 'Gaming' && styles.navLabelActive]}>
            {t('Gaming')}
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Discover */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => {
            setBottomTab('Discover');
            showToast(t('Discover New Friends & Events! 🌍'), 'info');
          }}
        >
          <NavDiscoverIcon active={bottomTab === 'Discover'} />
          <Text style={[styles.navLabel, bottomTab === 'Discover' && styles.navLabelActive]}>
            {t('Discover')}
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Message */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => {
            setBottomTab('Message');
            showToast(t('No new messages 💬'), 'info');
          }}
        >
          <NavMessageIcon active={bottomTab === 'Message'} />
          <Text style={[styles.navLabel, bottomTab === 'Message' && styles.navLabelActive]}>
            {t('Message')}
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Me (Keeps user on the screen with bottom navigation bar intact!) */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => setBottomTab('Me')}
        >
          <NavMeIcon active={bottomTab === 'Me'} />
          <Text style={[styles.navLabel, bottomTab === 'Me' && styles.navLabelActive]}>
            {t('Me')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. ROOM LOCK MODAL */}
      {lockedRoomTarget && (
        <RoomLockModal
          visible={!!lockedRoomTarget}
          onClose={() => setLockedRoomTarget(null)}
          onVerifyPassword={handleVerifyLockedRoom}
          roomTitle={lockedRoomTarget.title}
        />
      )}

      {/* 6. CREATE ROOM MODAL */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeader}>🎙️ {t('Create Room')}</Text>

            <Text style={styles.modalLabel}>{t('Room Title')} *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('e.g. Desi Chill Beats & Masti')}
              placeholderTextColor="#94A3B8"
              value={newRoomTitle}
              onChangeText={setNewRoomTitle}
            />

            <Text style={styles.modalLabel}>{t('Topic / Bio')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('e.g. Singing, Chit-chat, Friends')}
              placeholderTextColor="#94A3B8"
              value={newRoomTopic}
              onChangeText={setNewRoomTopic}
            />

            {/* Lock / Password Toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>🔒 {t('Lock Room with Password')}</Text>
                <Text style={styles.switchSubtitle}>{t('Only users with PIN can enter')}</Text>
              </View>
              <Switch
                value={isLockedNewRoom}
                onValueChange={setIsLockedNewRoom}
                thumbColor={isLockedNewRoom ? '#10B981' : '#CBD5E1'}
                trackColor={{ true: '#A7F3D0', false: '#E2E8F0' }}
              />
            </View>

            {isLockedNewRoom && (
              <TextInput
                style={[styles.modalInput, { marginTop: 10 }]}
                placeholder={t('Enter 4-digit Room Password')}
                placeholderTextColor="#94A3B8"
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={newRoomPassword}
                onChangeText={setNewRoomPassword}
              />
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('Launch Room')}</Text>
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Crisp clean background matching screenshot
  },

  // 1. Top Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  topTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topTabItem: {
    paddingVertical: 4,
  },
  topTabText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#64748B', // Inactive gray
  },
  topTabTextActive: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00C853', // Bold Vibrant Green matching screenshot
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topHutBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSearchBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar Dropdown
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  searchClearBtn: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    padding: 4,
  },

  // 2. Scroll Body
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // 2.1 Mine Banner Card
  mineCardOuter: {
    width: '100%',
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginBottom: 16,
  },
  createRoomPromptCard: {
    width: '100%',
    borderRadius: 18,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 16,
  },
  createRoomPromptGradient: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createPromptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPromptTitle: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
  },
  createPromptSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  createPromptBtnPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  createPromptBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  mineCardGradient: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mineOrangeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6D00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 18,
  },
  mineBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  mineAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginRight: 14,
  },
  mineTitleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  mineRoomTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mineSubNotice: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  mineSignalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 14,
  },
  mineSignalIcon: {
    fontSize: 14,
  },
  mineSignalCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  // 2.2 Sub-Tabs (Recently vs Following)
  subTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 12,
  },
  subTabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  subTabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  subTabTextActive: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  subTabIndicator: {
    width: 32,
    height: 3.5,
    backgroundColor: '#00C853', // Active green bar under Following
    borderRadius: 2,
    marginTop: 4,
  },

  // 2.3 People Section
  peopleSectionHeader: {
    marginTop: 10,
    marginBottom: 12,
  },
  peopleSectionTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  // Sub-Tab Empty State
  subTabEmptyWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTabEmptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subTabEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  subTabEmptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },

  // Sub-Tab Room Cards
  subTabRoomList: {
    gap: 10,
    marginVertical: 8,
  },
  subTabRoomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  subTabRoomAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E2E8F0',
  },
  subTabRoomInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  subTabRoomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTabRoomTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subTabLockBadge: {
    fontSize: 12,
    marginLeft: 4,
  },
  subTabRoomHost: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
  },
  subTabSignalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subTabSignalIcon: {
    fontSize: 12,
  },
  subTabSignalCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },

  // No Rooms Card
  noRoomsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noRoomsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  noRoomsSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  createFirstRoomBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
  },
  createFirstRoomBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Tab Coming Soon Placeholder
  tabComingSoonWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 54,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tabComingSoonCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabComingSoonTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  tabComingSoonSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Other Top Header (Me, Gaming, Discover, Message)
  otherTopHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherTopHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Me / Profile Tab Styles
  meProfileWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  meProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  meProfileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  meProfileId: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  meWalletRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  meWalletPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  meWalletIcon: {
    fontSize: 18,
  },
  meWalletValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  meWalletLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  meBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  meWealthBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  meCharmBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  meBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  meFrameBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  meFrameBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  meLogoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  meLogoutBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
  },

  // Live Rooms Section
  liveRoomsSection: {
    marginTop: 20,
  },
  liveRoomCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveRoomCover: {
    width: 80,
    height: 80,
  },
  liveRoomDetails: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  liveRoomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveRoomTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
    flex: 1,
  },
  liveLockBadge: {
    fontSize: 12,
    marginLeft: 4,
  },
  liveRoomTopic: {
    color: '#64748B',
    fontSize: 11.5,
  },
  liveRoomStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  liveRoomSeats: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  liveRoomOnline: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  // 3. Floating Daily Check-in 3D Calendar Widget
  floatingCheckinWidget: {
    position: 'absolute',
    right: 16,
    zIndex: 99,
  },
  calendarIconContainer: {
    width: 58,
    height: 58,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarGlowBack: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#00E676',
    opacity: 0.85,
    shadowColor: '#00E676',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarPlate: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 3,
    justifyContent: 'space-between',
  },
  calendarRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -7,
  },
  calendarRing: {
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#F59E0B', // Golden wire rings
  },
  calendarGridLines: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 4,
  },
  calendarGridBox: {
    width: 8,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  calendarRedDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // 4. Fixed Bottom Navigation Bar
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  navIconImg: {
    width: 25,
    height: 25,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#00C853',
    fontWeight: '900',
  },
  meBadgeDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // 6. Create Room Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 16,
  },
  modalLabel: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#00C853',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

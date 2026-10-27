import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import api from '../api/client';

function BackArrowIcon({ size = 24, color = '#1E293B' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshCameraIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4V9H9M20 20V15H15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.49 9A9 9 0 005.64 5.64L4 9M3.51 15A9 9 0 0018.36 18.36L20 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClapperboardIcon({ size = 26, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V8H4V6Z"
        fill={color}
        fillOpacity="0.8"
      />
      <Path
        d="M4 8H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V8Z"
        fill={color}
        fillOpacity="0.4"
      />
      <Path
        d="M9.5 11L15.5 14L9.5 17V11Z"
        fill={color}
      />
    </Svg>
  );
}

export default function RoomProfileEditModal({
  visible,
  onClose,
  room,
  onSaveSuccess,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [roomTitle, setRoomTitle] = useState(room?.title || 'Voice Room');
  const [coverImage, setCoverImage] = useState(
    room?.coverImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300'
  );
  // Only 2 types: 'chatroom' or 'video_room' as requested
  const [roomType, setRoomType] = useState(room?.roomType || 'chatroom');
  const [rules, setRules] = useState(
    room?.rules ||
      'Sexual and violent contents are not allowed. All violators will be banned from the chatroom. Please respect each other and do not expose your personal info.'
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && room) {
      setRoomTitle(room.title || 'Voice Room');
      setCoverImage(
        room.coverImage ||
          'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300'
      );
      setRoomType(room.roomType || 'chatroom');
      setRules(
        room.rules ||
          'Sexual and violent contents are not allowed. All violators will be banned from the chatroom. Please respect each other and do not expose your personal info.'
      );
    }
  }, [visible, room]);

  const handlePickCoverImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setCoverImage(dataUri);
        showToast(t('Photo selected! Click Submit to save.'), 'info');
      }
    } catch (err) {
      showToast(t('Failed to pick photo'), 'error');
    }
  };

  const handleSubmit = async () => {
    if (!roomTitle.trim()) {
      showToast(t('Please enter a room name'), 'error');
      return;
    }

    const roomId = room?._id || room?.id;
    if (!roomId) {
      showToast(t('Room ID not found'), 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put(`/rooms/${roomId}/profile`, {
        title: roomTitle.trim(),
        coverImage,
        roomType,
        rules: rules.trim(),
      });

      if (res.data?.success) {
        showToast(t('Room settings updated successfully!'), 'success');
        if (onSaveSuccess) {
          onSaveSuccess(res.data.room);
        }
        onClose();
      } else {
        showToast(t(res.data?.message || 'Failed to update room settings'), 'error');
      }
    } catch (error) {
      console.error('handleSubmit error:', error);
      const msg = error.response?.data?.message || error.message || 'Error updating room settings';
      showToast(t(msg), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(12, insets.top) }]}>
        {/* ══ 1. HEADER (Back button & Title) ══ */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.75}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackArrowIcon size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            <T>Room Settings</T>
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(30, insets.bottom + 24) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ══ 2. ROOM COVER IMAGE WITH REFRESH ICON ══ */}
            <View style={styles.coverWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickCoverImage}
                style={styles.coverImageContainer}
              >
                <Image
                  source={{ uri: coverImage }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <View style={styles.refreshBadge}>
                  <RefreshCameraIcon size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* ══ 3. ROOM NAME INPUT (Matching Screenshot) ══ */}
            <View style={styles.nameSection}>
              <TextInput
                style={styles.nameInput}
                value={roomTitle}
                onChangeText={setRoomTitle}
                placeholder={t('Enter Room Name')}
                placeholderTextColor="#94A3B8"
                maxLength={40}
                textAlign="center"
              />
              <View style={styles.nameUnderline} />
            </View>

            {/* ══ 4. ROOM TYPE SECTION (Chatroom vs Video Room) ══ */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                <T>Room Type</T>
              </Text>
            </View>

            <View style={styles.roomTypeRow}>
              {/* Option 1: Chatroom (Default / Vibrant coral pink) */}
              <TouchableOpacity
                style={[
                  styles.roomTypeCard,
                  roomType === 'chatroom' && styles.roomTypeCardSelectedChatroom,
                ]}
                activeOpacity={0.8}
                onPress={() => setRoomType('chatroom')}
              >
                <LinearGradient
                  colors={
                    roomType === 'chatroom'
                      ? ['#FF3366', '#FF5E7E']
                      : ['#F1F5F9', '#E2E8F0']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roomTypeGrad}
                >
                  <Text style={styles.roomTypeIconEmoji}>😊</Text>
                  <Text
                    style={[
                      styles.roomTypeText,
                      roomType === 'chatroom'
                        ? styles.roomTypeTextActive
                        : styles.roomTypeTextInactive,
                    ]}
                  >
                    <T>Chatroom</T>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Option 2: Video Room (Sleek slate / dark) */}
              <TouchableOpacity
                style={[
                  styles.roomTypeCard,
                  roomType === 'video_room' && styles.roomTypeCardSelectedVideo,
                ]}
                activeOpacity={0.8}
                onPress={() => setRoomType('video_room')}
              >
                <LinearGradient
                  colors={
                    roomType === 'video_room'
                      ? ['#1E293B', '#334155']
                      : ['#F1F5F9', '#E2E8F0']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roomTypeGrad}
                >
                  <ClapperboardIcon
                    size={22}
                    color={roomType === 'video_room' ? '#38BDF8' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.roomTypeText,
                      roomType === 'video_room'
                        ? styles.roomTypeTextActive
                        : styles.roomTypeTextInactive,
                    ]}
                  >
                    <T>Video Room</T>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ══ 5. RULES SECTION (Description / Notice) ══ */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                <T>Rules</T>
              </Text>
            </View>

            <View style={styles.rulesContainer}>
              <TextInput
                style={styles.rulesInput}
                value={rules}
                onChangeText={(val) => setRules(val.slice(0, 150))}
                placeholder={t('Please edit the description of your room')}
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={150}
                textAlignVertical="top"
              />
              <Text style={styles.charCounter}>{rules.length}/100</Text>
            </View>

            {/* ══ 6. SUBMIT BUTTON (Gradient Green Pill - Matching Screenshot) ══ */}
            <View style={styles.submitContainer}>
              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.8}
                onPress={handleSubmit}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#00E676', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGrad}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>
                      <T>Submit</T>
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  coverWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  coverImageContainer: {
    width: 104,
    height: 104,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  refreshBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingHorizontal: 30,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 6,
    width: '100%',
  },
  nameUnderline: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '80%',
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  roomTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },
  roomTypeCard: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomTypeCardSelectedChatroom: {
    borderColor: '#00E676',
  },
  roomTypeCardSelectedVideo: {
    borderColor: '#00E676',
  },
  roomTypeGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  roomTypeIconEmoji: {
    fontSize: 20,
  },
  roomTypeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  roomTypeTextActive: {
    color: '#FFFFFF',
  },
  roomTypeTextInactive: {
    color: '#64748B',
  },
  rulesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 36,
  },
  rulesInput: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 110,
  },
  charCounter: {
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  submitContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#00E676',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

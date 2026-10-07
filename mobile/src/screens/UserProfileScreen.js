import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';
import ReportModal from '../components/ReportModal';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

// 1. Top Icons
const BackIcon = ({ size = 24, color = '#FFFFFF' }) => (
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

const BackChevron = ({ size = 24, color = '#1A1A1A' }) => (
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

const ShareIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 9L19 4M19 4H14M19 4V9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 9H7C5.89543 9 5 9.89543 5 11V18C5 19.1046 5.89543 20 7 20H14C15.1046 20 16 19.1046 16 18V15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.5 3.5C16.8978 3.10217 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10217 19.5 3.5C19.8978 3.89783 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10217 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRight = ({ size = 18, color = '#9E9E9E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5L16 12L9 19"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Basic Information Custom Icons (Matching Screenshot)
const CoverImageIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="16" rx="4" stroke={color} strokeWidth="1.8" />
    <Circle cx="8.5" cy="9" r="1.5" stroke={color} strokeWidth="1.8" />
    <Path d="M21 16L15.5 10.5L6 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GenderIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9.5" cy="14" r="5" stroke={color} strokeWidth="1.8" />
    <Path d="M13.5 10.5L19.5 4.5M19.5 4.5H15M19.5 4.5V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.5 19V22M7.5 20.5H11.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const HeightIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="8" cy="7" r="2.5" stroke={color} strokeWidth="1.8" />
    <Path d="M4 19V14C4 12.3431 5.34315 11 7 11H9C10.6569 11 12 12.3431 12 14V19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M18 4V20M15 6H18M16 10H18M15 14H18M16 18H18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const WeightIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="5" width="16" height="15" rx="3" stroke={color} strokeWidth="1.8" />
    <Path d="M10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5" stroke={color} strokeWidth="1.8" />
    <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.8" />
    <Path d="M12 12L13.5 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const OccupationIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
    <Path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const GlobeIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <Path d="M3 12H21" stroke={color} strokeWidth="1.8" />
    <Path d="M12 3C14.5 6 16 9 16 12C16 15 14.5 18 12 21C9.5 18 8 15 8 12C8 9 9.5 6 12 3Z" stroke={color} strokeWidth="1.8" />
  </Svg>
);

// Height & Weight Options (Max height: 300cm, Max weight: 800kg as requested)
const HEIGHT_OPTIONS = Array.from({ length: 300 - 50 + 1 }, (_, i) => `${50 + i}cm`);
const WEIGHT_OPTIONS = Array.from({ length: 800 - 20 + 1 }, (_, i) => `${20 + i}kg`);
const WHEEL_ITEM_HEIGHT = 44;

export default function UserProfileScreen({ route, navigation, currentUser, onLogout }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const userId = route.params?.userId || currentUser?._id;
  const isSelf = currentUser && (userId === currentUser._id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Profile'); // 'Profile' | 'Moment'
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSignature, setEditSignature] = useState('');
  const [editGender, setEditGender] = useState('Boy');
  const [editBirthday, setEditBirthday] = useState('1999-08-10');
  const [editCountry, setEditCountry] = useState('India');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editOccupation, setEditOccupation] = useState('');

  // Interactive field edit sub-modal
  const [activeField, setActiveField] = useState(null); // 'nickname' | 'bio' | 'gender' | 'birthday' | 'height' | 'weight' | 'occupation' | 'country' | 'avatar' | 'cover' | 'avatarUrl' | 'coverUrl'
  const [tempFieldValue, setTempFieldValue] = useState('');
  const [selectedWheelValue, setSelectedWheelValue] = useState('');
  const wheelListRef = useRef(null);

  const calculateAge = (birthday) => {
    if (!birthday) return 24;
    try {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : 24;
    } catch (e) {
      return 24;
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${userId}/profile`);
      if (res.data.success) {
        setProfile(res.data.user);
        setIsFollowing(res.data.user.isFollowing || false);
        setEditName(res.data.user.name || '');
        setEditSignature(res.data.user.signature || '');
        setEditGender(res.data.user.gender === 'female' ? 'Girl' : 'Boy');
        setEditBirthday(res.data.user.birthday || '1999-08-10');
        setEditCountry(res.data.user.country || 'India');
        setEditAvatar(res.data.user.avatar || '');
        setEditCover(res.data.user.coverImage || '');
        setEditHeight(res.data.user.height || '');
        setEditWeight(res.data.user.weight || '');
        setEditOccupation(res.data.user.occupation || '');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isBlocked) {
        showToast(t('Profile Inaccessible: User has blocked you'), 'error');
        navigation.goBack();
      } else {
        showToast(err.response?.data?.message || t('Failed to load user profile'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [userId])
  );

  const handleToggleFollow = async () => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      if (res.data.success) {
        setIsFollowing(res.data.following);
        showToast(t(res.data.message), 'success');
        fetchProfile();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Follow action failed'), 'error');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${profile?.name || 'User'} profile on YoYo! ID: ${displayId}`,
      });
    } catch (error) {
      // Ignored
    }
  };

  const handleSaveProfile = async (overrides = {}) => {
    setSavingEdit(true);
    try {
      const payload = {
        name: overrides.name !== undefined ? overrides.name : editName,
        signature: overrides.signature !== undefined ? overrides.signature : editSignature,
        gender: (overrides.gender !== undefined ? overrides.gender : editGender) === 'Girl' ? 'female' : 'male',
        birthday: overrides.birthday !== undefined ? overrides.birthday : editBirthday,
        country: overrides.country !== undefined ? overrides.country : editCountry,
        avatar: overrides.avatar !== undefined ? overrides.avatar : editAvatar,
        coverImage: overrides.coverImage !== undefined ? overrides.coverImage : editCover,
        height: overrides.height !== undefined ? overrides.height : editHeight,
        weight: overrides.weight !== undefined ? overrides.weight : editWeight,
        occupation: overrides.occupation !== undefined ? overrides.occupation : editOccupation,
      };

      const res = await api.put('/users/profile', payload);
      if (res.data.success) {
        showToast(t('Profile updated successfully'), 'success');

        // Update local AsyncStorage so MeProfileView and other components reflect changes immediately
        try {
          const stored = await AsyncStorage.getItem('@user_info');
          if (stored) {
            const parsed = JSON.parse(stored);
            const merged = { ...parsed, ...res.data.user };
            await AsyncStorage.setItem('@user_info', JSON.stringify(merged));
          }
        } catch (storageErr) {}

        setEditModalVisible(false);
        setActiveField(null);
        fetchProfile();
      }
    } catch (e) {
      showToast(t(e.response?.data?.message || 'Failed to update profile'), 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required!'), 'info');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAvatar = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setEditAvatar(newAvatar);
        setActiveField(null);
        showToast(t('Avatar updated! Tap Save to keep changes.'), 'info');
      }
    } catch (e) {
      showToast(t('Failed to open photo picker'), 'error');
    }
  };

  const handlePickCover = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required!'), 'info');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newCover = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setEditCover(newCover);
        setActiveField(null);
        showToast(t('Cover photo updated! Tap Save to keep changes.'), 'info');
      }
    } catch (e) {
      showToast(t('Failed to open photo picker'), 'error');
    }
  };

  const handleConfirmFieldEdit = () => {
    if (activeField === 'nickname') {
      if (tempFieldValue.trim()) setEditName(tempFieldValue.trim());
    } else if (activeField === 'bio') {
      setEditSignature(tempFieldValue);
    } else if (activeField === 'birthday') {
      if (tempFieldValue.trim()) setEditBirthday(tempFieldValue.trim());
    } else if (activeField === 'height') {
      setEditHeight(tempFieldValue.trim());
    } else if (activeField === 'weight') {
      setEditWeight(tempFieldValue.trim());
    } else if (activeField === 'occupation') {
      setEditOccupation(tempFieldValue.trim());
    } else if (activeField === 'country') {
      if (tempFieldValue.trim()) setEditCountry(tempFieldValue.trim());
    } else if (activeField === 'avatarUrl') {
      if (tempFieldValue.trim()) setEditAvatar(tempFieldValue.trim());
    } else if (activeField === 'coverUrl') {
      if (tempFieldValue.trim()) setEditCover(tempFieldValue.trim());
    }
    setActiveField(null);
  };

  const renderFieldEditorModal = () => {
    if (!activeField) return null;

    if (activeField === 'avatar') {
      return (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveField(null)}>
          <TouchableOpacity
            style={styles.fieldModalOverlay}
            activeOpacity={1}
            onPress={() => setActiveField(null)}
          >
            <View style={styles.sheetBox} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>{t('Change Avatar')}</Text>
              <TouchableOpacity
                style={styles.sheetBtn}
                activeOpacity={0.75}
                onPress={handlePickAvatar}
              >
                <Text style={styles.sheetBtnIcon}>📷</Text>
                <Text style={styles.sheetBtnText}>{t('Choose from Gallery')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetBtn}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editAvatar);
                  setActiveField('avatarUrl');
                }}
              >
                <Text style={styles.sheetBtnIcon}>🔗</Text>
                <Text style={styles.sheetBtnText}>{t('Enter Image URL')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetBtn}
                activeOpacity={0.75}
                onPress={() => {
                  const randomUrl =
                    'https://api.dicebear.com/7.x/bottts/png?seed=' +
                    Math.random().toString(36).substring(7);
                  setEditAvatar(randomUrl);
                  setActiveField(null);
                  showToast(t('Avatar randomized! Tap Save to keep changes.'), 'info');
                }}
              >
                <Text style={styles.sheetBtnIcon}>🎲</Text>
                <Text style={styles.sheetBtnText}>{t('Random Avatar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                activeOpacity={0.75}
                onPress={() => setActiveField(null)}
              >
                <Text style={styles.sheetCancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    if (activeField === 'cover') {
      return (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveField(null)}>
          <TouchableOpacity
            style={styles.fieldModalOverlay}
            activeOpacity={1}
            onPress={() => setActiveField(null)}
          >
            <View style={styles.sheetBox} onStartShouldSetResponder={() => true}>
              <Text style={styles.sheetTitle}>{t('Change Cover Photo')}</Text>
              <TouchableOpacity
                style={styles.sheetBtn}
                activeOpacity={0.75}
                onPress={handlePickCover}
              >
                <Text style={styles.sheetBtnIcon}>📷</Text>
                <Text style={styles.sheetBtnText}>{t('Choose from Gallery')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetBtn}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editCover);
                  setActiveField('coverUrl');
                }}
              >
                <Text style={styles.sheetBtnIcon}>🔗</Text>
                <Text style={styles.sheetBtnText}>{t('Enter Image URL')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                activeOpacity={0.75}
                onPress={() => setActiveField(null)}
              >
                <Text style={styles.sheetCancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    if (activeField === 'gender') {
      return (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveField(null)}>
          <TouchableOpacity
            style={styles.fieldModalOverlay}
            activeOpacity={1}
            onPress={() => setActiveField(null)}
          >
            <View style={styles.dialogBox} onStartShouldSetResponder={() => true}>
              <Text style={styles.dialogTitle}>{t('Select Gender')}</Text>
              <View style={styles.genderOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.genderOptionPill,
                    editGender === 'Boy' && styles.genderOptionPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setEditGender('Boy');
                    setActiveField(null);
                  }}
                >
                  <Text style={styles.genderOptionEmoji}>♂️</Text>
                  <Text
                    style={[
                      styles.genderOptionText,
                      editGender === 'Boy' && styles.genderOptionTextActive,
                    ]}
                  >
                    {t('Boy')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderOptionPill,
                    editGender === 'Girl' && styles.genderOptionPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setEditGender('Girl');
                    setActiveField(null);
                  }}
                >
                  <Text style={styles.genderOptionEmoji}>♀️</Text>
                  <Text
                    style={[
                      styles.genderOptionText,
                      editGender === 'Girl' && styles.genderOptionTextActive,
                    ]}
                  >
                    {t('Girl')}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.75}
                onPress={() => setActiveField(null)}
              >
                <Text style={styles.dialogCancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }

    if (activeField === 'height' || activeField === 'weight') {
      const isHeight = activeField === 'height';
      const wheelTitle = isHeight ? t('Height') : t('Weight');
      const wheelData = isHeight ? HEIGHT_OPTIONS : WEIGHT_OPTIONS;
      const fallbackVal = isHeight ? '152cm' : '42kg';
      const currentVal = selectedWheelValue || (isHeight ? editHeight : editWeight) || fallbackVal;
      const initialIndex = Math.max(0, wheelData.indexOf(currentVal));

      return (
        <Modal visible transparent animationType="slide" onRequestClose={() => setActiveField(null)}>
          <TouchableOpacity
            style={styles.wheelModalOverlay}
            activeOpacity={1}
            onPress={() => setActiveField(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.wheelSheetContainer, { paddingBottom: Math.max(20, insets.bottom) }]}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View style={styles.wheelSheetHeader}>
                <View style={{ width: 80 }} />
                <Text style={styles.wheelSheetTitle}>{wheelTitle}</Text>
                <TouchableOpacity
                  style={styles.wheelConfirmBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    const finalVal = selectedWheelValue || currentVal;
                    if (isHeight) {
                      setEditHeight(finalVal);
                    } else {
                      setEditWeight(finalVal);
                    }
                    setActiveField(null);
                  }}
                >
                  <Text style={styles.wheelConfirmText}>{t('Confirm')}</Text>
                </TouchableOpacity>
              </View>

              {/* Wheel Picker Container */}
              <View style={styles.wheelPickerContainer}>
                {/* Center Highlight Lines */}
                <View pointerEvents="none" style={styles.wheelSelectionHighlight} />

                <FlatList
                  ref={wheelListRef}
                  data={wheelData}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={WHEEL_ITEM_HEIGHT}
                  decelerationRate="fast"
                  getItemLayout={(_, index) => ({
                    length: WHEEL_ITEM_HEIGHT,
                    offset: WHEEL_ITEM_HEIGHT * index,
                    index,
                  })}
                  initialScrollIndex={initialIndex > 0 ? initialIndex : 0}
                  initialNumToRender={25}
                  maxToRenderPerBatch={35}
                  windowSize={11}
                  contentContainerStyle={{
                    paddingTop: WHEEL_ITEM_HEIGHT * 2,
                    paddingBottom: WHEEL_ITEM_HEIGHT * 2,
                  }}
                  onMomentumScrollEnd={(e) => {
                    const offsetY = e.nativeEvent.contentOffset.y;
                    const idx = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
                    if (idx >= 0 && idx < wheelData.length) {
                      setSelectedWheelValue(wheelData[idx]);
                    }
                  }}
                  renderItem={({ item, index }) => {
                    const isSelected = item === (selectedWheelValue || currentVal);
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.wheelItemRow}
                        onPress={() => {
                          setSelectedWheelValue(item);
                          wheelListRef.current?.scrollToOffset({
                            offset: index * WHEEL_ITEM_HEIGHT,
                            animated: true,
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            isSelected && styles.wheelItemTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      );
    }

    // Text / Date Input Dialogs
    let title = t('Edit');
    let placeholder = '';
    let isMultiline = false;

    if (activeField === 'nickname') {
      title = t('Nickname');
      placeholder = t('Enter nickname');
    } else if (activeField === 'bio') {
      title = t('Bio');
      placeholder = t('Tell something about yourself');
      isMultiline = true;
    } else if (activeField === 'birthday') {
      title = t('Birthday');
      placeholder = 'YYYY-MM-DD (e.g. 1999-08-10)';
    } else if (activeField === 'occupation') {
      title = t('Occupation');
      placeholder = 'e.g. Student, Designer';
    } else if (activeField === 'country') {
      title = t('Country or Region');
      placeholder = 'e.g. India';
    } else if (activeField === 'avatarUrl') {
      title = t('Enter Image URL');
      placeholder = 'https://...';
    } else if (activeField === 'coverUrl') {
      title = t('Enter Image URL');
      placeholder = 'https://...';
    }

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setActiveField(null)}>
        <TouchableOpacity
          style={styles.fieldModalOverlay}
          activeOpacity={1}
          onPress={() => setActiveField(null)}
        >
          <View style={styles.dialogBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <TextInput
              style={[
                styles.dialogInput,
                isMultiline && { height: 95, textAlignVertical: 'top' },
              ]}
              value={tempFieldValue}
              onChangeText={setTempFieldValue}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              multiline={isMultiline}
              autoFocus
            />

            {activeField === 'country' && (
              <View style={styles.quickPresetsWrap}>
                {['India', 'Pakistan', 'Bangladesh', 'USA', 'UAE', 'Nepal'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.presetPill}
                    onPress={() => setTempFieldValue(c)}
                  >
                    <Text style={styles.presetPillText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.75}
                onPress={() => setActiveField(null)}
              >
                <Text style={styles.dialogCancelText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                activeOpacity={0.75}
                onPress={handleConfirmFieldEdit}
              >
                <Text style={styles.dialogConfirmText}>{t('OK')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const formatStat = (count) => {
    if (!count) return '0';
    const num = Number(count);
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return String(num);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  if (!profile) return null;

  const displayId = profile.customId || (profile._id ? String(parseInt(profile._id.slice(-6), 16)).padStart(8, '0').slice(-8) : '10000001');
  const cpList = profile.cpRelationships || [];
  const topSupporters = profile.topSupporters || [];
  const hasActiveCp = cpList.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: isSelf ? 40 : 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. TOP HERO COVER PHOTO & OVERLAY */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri:
                profile.coverImage ||
                profile.avatar ||
                'https://api.dicebear.com/7.x/bottts/png?seed=' +
                  encodeURIComponent(profile.name || 'User'),
            }}
            style={styles.heroCoverImage}
            resizeMode="cover"
            blurRadius={profile.coverImage ? 0 : (Platform.OS === 'ios' ? 25 : 16)}
          />
          {/* Subtle gradient dark overlay for contrast */}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(15,15,26,0.9)']}
            style={styles.heroGradientOverlay}
          />

          {/* Top Bar Navigation (Back, Share, Edit) - Clean Transparent Header */}
          <View style={[styles.topNavBar, { paddingTop: Math.max(16, insets.top) }]}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <BackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.navRightGroup}>
              <TouchableOpacity
                style={styles.navCircleBtn}
                activeOpacity={0.8}
                onPress={handleShare}
              >
                <ShareIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {isSelf && (
                <TouchableOpacity
                  style={styles.navSquareBtn}
                  activeOpacity={0.8}
                  onPress={() => setEditModalVisible(true)}
                >
                  <EditIcon size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ranking Badge (Top-Right on Cover) */}
          <TouchableOpacity
            style={[styles.rankingBadge, { top: Math.max(16, insets.top) + 48 }]}
            activeOpacity={0.85}
            onPress={() => showToast(t('Ranking leaderboard'), 'info')}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rankingGradient}
            >
              <Text style={styles.rankingStarEmoji}>⭐</Text>
              <Text style={styles.rankingText}>{t('Ranking')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Hero Avatar & CP Area */}
          <View style={styles.heroAvatarArea}>
            {/* User Avatar Circle */}
            <View style={styles.mainAvatarWrapper}>
              <Image
                source={{
                  uri:
                    profile.avatar ||
                    'https://api.dicebear.com/7.x/bottts/png?seed=' +
                      encodeURIComponent(profile.name || 'User'),
                }}
                style={styles.mainAvatarImg}
              />
            </View>

            {/* If user has an active CP partner, show CP interlocking rings + partner avatar */}
            {hasActiveCp && (
              <>
                <View style={styles.cpRingConnector}>
                  <Text style={{ fontSize: 24 }}>💍</Text>
                  <Text style={styles.cpRingLvText}>Lv.{cpList[0]?.level || 1}</Text>
                  <Text style={styles.cpRingChangeText}>{t('Change')}</Text>
                </View>
                <View style={styles.partnerAvatarWrapper}>
                  <Image
                    source={{
                      uri:
                        cpList[0]?.partner?.avatar ||
                        'https://api.dicebear.com/7.x/bottts/png?seed=' +
                          encodeURIComponent(cpList[0]?.partner?.name || 'Partner'),
                    }}
                    style={styles.mainAvatarImg}
                  />
                </View>
              </>
            )}
          </View>

          {/* User Name & Details */}
          <View style={styles.heroUserInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroUserName} numberOfLines={1}>
                {profile.name || t('User')}
              </Text>
            </View>

            {/* Online Status & ID */}
            <View style={styles.heroStatusRow}>
              <View style={styles.onlineStatusWrap}>
                <View style={styles.onlineGreenDot} />
                <Text style={styles.onlineStatusText}>{t('Online')}</Text>
              </View>

              <TouchableOpacity
                style={styles.idCopyBtn}
                activeOpacity={0.7}
                onPress={() => {
                  showToast(t('ID Copied: ') + displayId, 'success');
                }}
              >
                <Text style={styles.idCopyText}>ID: {displayId}</Text>
                <Text style={styles.idCopyIcon}>❐</Text>
              </TouchableOpacity>
            </View>

            {/* Badges Row (Gender pill, VIP, Wealth, Charm) */}
            <View style={styles.heroBadgesRow}>
              {/* Gender Pill with dynamic calculated age */}
              <View
                style={[
                  styles.genderBadge,
                  { backgroundColor: profile.gender === 'female' ? '#FF6584' : '#4C6EF5' },
                ]}
              >
                <Text style={styles.genderBadgeText}>
                  {profile.gender === 'female' ? '♀️' : '♂️'} {calculateAge(profile.birthday)}
                </Text>
              </View>

              {/* VIP Badge */}
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>👑 {t('VIP')}</Text>
              </View>

              {/* Wealth Level */}
              <View style={styles.wealthBadge}>
                <Text style={styles.wealthBadgeText}>
                  💰 Lv.{profile.wealthLevel || 1}
                </Text>
              </View>

              {/* Charm Level */}
              <View style={styles.charmBadge}>
                <Text style={styles.charmBadgeText}>
                  💖 Lv.{profile.charmLevel || 1}
                </Text>
              </View>
            </View>

            {/* Golden Laurel Medal */}
            <View style={styles.medalCrestRow}>
              <Text style={{ fontSize: 32 }}>🎖️</Text>
            </View>
          </View>
        </View>

        {/* 2. STATS ROW (Followers, Following, Gifts, Contributed) */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.75}
            onPress={() => showToast(t('Followers: ') + (profile.followersCount || 0), 'info')}
          >
            <Text style={styles.statNumber}>{formatStat(profile.followersCount || 0)}</Text>
            <Text style={styles.statLabel}>{t('Followers')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.75}
            onPress={() => showToast(t('Following: ') + (profile.followingCount || 0), 'info')}
          >
            <Text style={styles.statNumber}>{formatStat(profile.followingCount || 0)}</Text>
            <Text style={styles.statLabel}>{t('Following')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.75}
            onPress={() => showToast(t('Gifts: ') + (profile.giftsReceived || 0), 'info')}
          >
            <Text style={styles.statNumber}>{formatStat(profile.giftsReceived || 0)}</Text>
            <Text style={styles.statLabel}>{t('Gifts')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.75}
            onPress={() => showToast(t('Contributed: ') + (profile.totalContributed || 0), 'info')}
          >
            <Text style={styles.statNumber}>{formatStat(profile.totalContributed || 0)}</Text>
            <Text style={styles.statLabel}>{t('Contributed')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. FAMILY BANNER ("Come to join the family!") */}
        <View style={styles.familyBannerOuter}>
          <LinearGradient
            colors={['#17C3B2', '#227C9D', '#3A86FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.familyBannerGradient}
          >
            <View style={styles.familyLeftGroup}>
              <View style={styles.familyLogoCircle}>
                <Text style={{ fontSize: 24 }}>🛡️</Text>
              </View>
              <Text style={styles.familyBannerTitle}>{t('Come to join the family!')}</Text>
            </View>
            <TouchableOpacity
              style={styles.familyJoinBtn}
              activeOpacity={0.85}
              onPress={() => showToast(t('Family feature coming soon!'), 'info')}
            >
              <Text style={styles.familyJoinBtnText}>{t('Join Now')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 4. TABS (Profile | Moment) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.75}
            onPress={() => setActiveTab('Profile')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'Profile' && styles.tabBtnTextActive]}>
              {t('Profile')}
            </Text>
            {activeTab === 'Profile' && <View style={styles.tabActiveBar} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            activeOpacity={0.75}
            onPress={() => {
              setActiveTab('Moment');
              showToast(t('Moments coming soon!'), 'info');
            }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'Moment' && styles.tabBtnTextActive]}>
              {t('Moment')}
            </Text>
            {activeTab === 'Moment' && <View style={styles.tabActiveBar} />}
          </TouchableOpacity>
        </View>

        {/* 5. TITLE SECTION */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            activeOpacity={0.75}
            onPress={() => showToast(t('Add Title coming soon'), 'info')}
          >
            <Text style={styles.sectionTitle}>{t('Title')}</Text>
            <ChevronRight size={18} color="#9E9E9E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dashedAddBtn}
            activeOpacity={0.75}
            onPress={() => showToast(t('Add title unlocked with wealth level'), 'info')}
          >
            <Text style={styles.dashedAddBtnText}>+ {t('Add')}</Text>
          </TouchableOpacity>
        </View>

        {/* 6. CP RELATIONSHIP SECTION */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            activeOpacity={0.75}
            onPress={() => showToast(t('CP Relationship details'), 'info')}
          >
            <Text style={styles.sectionTitle}>
              {t('CP Relationship')} ({cpList.length})
            </Text>
            <ChevronRight size={18} color="#9E9E9E" />
          </TouchableOpacity>

          {cpList.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cpListScroll}>
              {cpList.map((cp, idx) => (
                <View key={idx} style={styles.cpCardItem}>
                  <LinearGradient
                    colors={['#8EC5FC', '#E0C3FC']}
                    style={styles.cpCardGradient}
                  >
                    <Image
                      source={{
                        uri:
                          cp.partner?.avatar ||
                          'https://api.dicebear.com/7.x/bottts/png?seed=' +
                            encodeURIComponent(cp.partner?.name || 'Partner'),
                      }}
                      style={styles.cpPartnerAvatar}
                    />
                    <Text style={styles.cpLvBadge}>Lv.{cp.level || 1}</Text>
                    <View style={styles.cpTypePill}>
                      <Text style={styles.cpTypeText}>{t(cp.type || 'Bestie')}</Text>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.cpEmptyWrap}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>💑</Text>
              <Text style={styles.cpEmptyText}>{t('No CP Relationship yet')}</Text>
              <Text style={styles.cpEmptySub}>{t('Send a CP card in room to form a couple')}</Text>
            </View>
          )}
        </View>

        {/* 7. BASIC INFORMATION CARD */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('Basic Information')}</Text>

          {/* Personal Signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>{t('Personal Signature')}</Text>
            <Text style={styles.signatureText}>
              {profile.signature || t('No signature set yet')}
            </Text>
          </View>

          {/* 4 Info Pills Grid */}
          <View style={styles.infoPillsGrid}>
            <View style={styles.infoPillItem}>
              <Text style={styles.infoPillLabel}>{t('Gender')}</Text>
              <Text style={styles.infoPillValue}>
                {profile.gender === 'female' ? t('Girl') : t('Boy')}
              </Text>
            </View>

            <View style={styles.infoPillItem}>
              <Text style={styles.infoPillLabel}>{t('ID')}</Text>
              <Text style={styles.infoPillValue}>{displayId}</Text>
            </View>

            <View style={styles.infoPillItem}>
              <Text style={styles.infoPillLabel}>{t('birthday')}</Text>
              <Text style={styles.infoPillValue}>{profile.birthday || '1999-08-10'}</Text>
            </View>

            <View style={styles.infoPillItem}>
              <Text style={styles.infoPillLabel}>{t('Country or Region')}</Text>
              <Text style={styles.infoPillValue}>{profile.country || 'India'}</Text>
            </View>
          </View>
        </View>

        {/* 8. GAMES SECTION (Matching Screenshot 3) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('Games')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gamesRow}
          >
            {/* + Add Button */}
            <TouchableOpacity
              style={styles.gameAddBtn}
              activeOpacity={0.75}
              onPress={() => showToast(t('Add Game feature coming soon'), 'info')}
            >
              <Text style={styles.gameAddBtnText}>+ {t('Add')}</Text>
            </TouchableOpacity>

            {/* Mobile Legends Card */}
            <TouchableOpacity
              style={styles.gameCardItem}
              activeOpacity={0.85}
              onPress={() => showToast('Mobile Legends Master', 'info')}
            >
              <LinearGradient
                colors={['#7E57C2', '#5E35B1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gameCardGradient}
              >
                <View style={styles.gameIconWrap}>
                  <Text style={{ fontSize: 20 }}>⚔️</Text>
                </View>
                <View style={styles.gameInfoWrap}>
                  <Text style={styles.gameTitleText} numberOfLines={1}>Mobile Legends</Text>
                  <Text style={styles.gameSubText}>Master</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* LUDO Card */}
            <TouchableOpacity
              style={styles.gameCardItem}
              activeOpacity={0.85}
              onPress={() => showToast('LUDO: 94/296', 'info')}
            >
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gameCardGradient}
              >
                <View style={styles.gameIconWrap}>
                  <Text style={{ fontSize: 20 }}>🎲</Text>
                </View>
                <View style={styles.gameInfoWrap}>
                  <Text style={styles.gameTitleText} numberOfLines={1}>LUDO</Text>
                  <Text style={styles.gameSubText}>🏆 94/296</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 9. TOP SUPPORTERS SECTION (TOP 1, TOP 2, TOP 3) */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            activeOpacity={0.75}
            onPress={() => showToast(t('Top supporters leaderboard'), 'info')}
          >
            <Text style={styles.sectionTitle}>{t('Top Supporters')}</Text>
            <ChevronRight size={18} color="#9E9E9E" />
          </TouchableOpacity>

          <View style={styles.topSupportersRow}>
            {/* TOP 1 */}
            <View style={styles.supporterPodium}>
              <View style={[styles.supporterAvatarWrap, { borderColor: '#FFC107' }]}>
                <Image
                  source={{
                    uri:
                      topSupporters[0]?.avatar ||
                      'https://api.dicebear.com/7.x/bottts/png?seed=' +
                        encodeURIComponent(topSupporters[0]?.name || 'Top1'),
                  }}
                  style={styles.supporterImg}
                />
                <Text style={styles.supporterCrown}>👑</Text>
              </View>
              <View style={[styles.topRibbon, { backgroundColor: '#FFB300' }]}>
                <Text style={styles.topRibbonText}>TOP 1</Text>
              </View>
              <Text style={styles.supporterName} numberOfLines={1}>
                {topSupporters[0]?.name || t('Empty')}
              </Text>
            </View>

            {/* TOP 2 */}
            <View style={styles.supporterPodium}>
              <View style={[styles.supporterAvatarWrap, { borderColor: '#00B4D8' }]}>
                <Image
                  source={{
                    uri:
                      topSupporters[1]?.avatar ||
                      'https://api.dicebear.com/7.x/bottts/png?seed=' +
                        encodeURIComponent(topSupporters[1]?.name || 'Top2'),
                  }}
                  style={styles.supporterImg}
                />
              </View>
              <View style={[styles.topRibbon, { backgroundColor: '#00B4D8' }]}>
                <Text style={styles.topRibbonText}>TOP 2</Text>
              </View>
              <Text style={styles.supporterName} numberOfLines={1}>
                {topSupporters[1]?.name || t('Empty')}
              </Text>
            </View>

            {/* TOP 3 */}
            <View style={styles.supporterPodium}>
              <View style={[styles.supporterAvatarWrap, { borderColor: '#4361EE' }]}>
                <Image
                  source={{
                    uri:
                      topSupporters[2]?.avatar ||
                      'https://api.dicebear.com/7.x/bottts/png?seed=' +
                        encodeURIComponent(topSupporters[2]?.name || 'Top3'),
                  }}
                  style={styles.supporterImg}
                />
              </View>
              <View style={[styles.topRibbon, { backgroundColor: '#4361EE' }]}>
                <Text style={styles.topRibbonText}>TOP 3</Text>
              </View>
              <Text style={styles.supporterName} numberOfLines={1}>
                {topSupporters[2]?.name || t('Empty')}
              </Text>
            </View>
          </View>
        </View>

        {/* 9. THE WISH SECTION */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            activeOpacity={0.75}
            onPress={() => showToast(t('The Wish coming soon'), 'info')}
          >
            <Text style={styles.sectionTitle}>{t('The Wish')}</Text>
            <ChevronRight size={18} color="#9E9E9E" />
          </TouchableOpacity>
          <Text style={styles.wishSubtitle}>{t('No wish set yet')}</Text>
        </View>
      </ScrollView>

      {/* 10. FLOATING ACTION BUTTON (GREEN PENCIL FAB FOR EDITING PROFILE) */}
      {isSelf && (
        <TouchableOpacity
          style={[styles.floatingEditFab, { bottom: 25 + insets.bottom }]}
          activeOpacity={0.85}
          onPress={() => setEditModalVisible(true)}
        >
          <EditIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 11. BOTTOM ACTION BAR WHEN VISITING ANOTHER USER'S PROFILE */}
      {!isSelf && (
        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <TouchableOpacity
            style={[styles.bottomFollowBtn, isFollowing && styles.bottomFollowingBtn]}
            activeOpacity={0.85}
            onPress={handleToggleFollow}
          >
            <Text style={styles.bottomFollowBtnText}>
              {isFollowing ? t('Following') : `+ ${t('Follow')}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomReportBtn}
            activeOpacity={0.85}
            onPress={() => setReportModalVisible(true)}
          >
            <Text style={styles.bottomReportBtnText}>🚩 {t('Report')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 12. BASIC INFORMATION SCREEN (Matching User Screenshot) */}
      <Modal visible={editModalVisible} animationType="slide" statusBarTranslucent>
        <View style={[styles.basicInfoScreen, { paddingTop: Math.max(16, insets.top) }]}>
          {/* Top Bar Navigation */}
          <View style={styles.basicInfoHeader}>
            <TouchableOpacity
              style={styles.basicInfoBackBtn}
              activeOpacity={0.7}
              onPress={() => setEditModalVisible(false)}
            >
              <BackChevron size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <Text style={styles.basicInfoTitle}>{t('Basic Information')}</Text>

            <TouchableOpacity
              style={styles.basicInfoSaveBtn}
              activeOpacity={0.7}
              onPress={() => handleSaveProfile()}
              disabled={savingEdit}
            >
              {savingEdit ? (
                <ActivityIndicator size="small" color="#00C853" />
              ) : (
                <Text style={styles.basicInfoSaveBtnText}>{t('Save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.basicInfoScroll}
            contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            {/* Click to Change Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveField('avatar')}
                style={styles.avatarWrap}
              >
                <Image
                  source={{
                    uri:
                      editAvatar ||
                      profile.avatar ||
                      'https://api.dicebear.com/7.x/bottts/png?seed=' +
                        encodeURIComponent(editName || 'User'),
                  }}
                  style={styles.basicInfoAvatarImg}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveField('avatar')}
              >
                <Text style={styles.changeAvatarText}>{t('Click to Change Avatar')}</Text>
              </TouchableOpacity>
            </View>

            {/* Card 1: Cover Photo */}
            <View style={styles.infoCard}>
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => setActiveField('cover')}
              >
                <View style={styles.rowLeftGroup}>
                  <CoverImageIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Cover Photo')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  {Boolean(editCover) && (
                    <Image source={{ uri: editCover }} style={styles.coverThumbnail} />
                  )}
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Card 2: Nickname, Birthday, Bio */}
            <View style={styles.infoCard}>
              {/* Nickname */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editName);
                  setActiveField('nickname');
                }}
              >
                <Text style={styles.rowLabelText}>{t('Nickname')}</Text>
                <View style={styles.rowRightGroup}>
                  <Text style={styles.rowValueText} numberOfLines={1}>
                    {editName || t('Enter nickname')}
                  </Text>
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Birthday */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editBirthday);
                  setActiveField('birthday');
                }}
              >
                <Text style={styles.rowLabelText}>{t('Birthday')}</Text>
                <View style={styles.rowRightGroup}>
                  <Text style={styles.rowValueText}>{editBirthday || '1999-08-10'}</Text>
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Bio */}
              <TouchableOpacity
                style={[styles.infoRow, { alignItems: 'flex-start', paddingVertical: 14 }]}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editSignature);
                  setActiveField('bio');
                }}
              >
                <Text style={[styles.rowLabelText, { marginTop: 2 }]}>{t('Bio')}</Text>
                <View style={[styles.rowRightGroup, { flex: 1, justifyContent: 'flex-end', marginLeft: 16 }]}>
                  <Text style={styles.bioValueText} numberOfLines={4}>
                    {editSignature || t('Tell something about yourself')}
                  </Text>
                  <ChevronRight size={18} color="#C4C4C6" style={{ marginTop: 2 }} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Card 3: Gender, Height, Weight, Occupation, Country or Region */}
            <View style={styles.infoCard}>
              {/* Gender */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => setActiveField('gender')}
              >
                <View style={styles.rowLeftGroup}>
                  <GenderIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Gender')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  <Text style={styles.rowGrayValueText}>
                    {editGender === 'Girl' ? t('Girl') : t('Boy')}
                  </Text>
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Height */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedWheelValue(editHeight || '152cm');
                  setActiveField('height');
                }}
              >
                <View style={styles.rowLeftGroup}>
                  <HeightIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Height')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  {Boolean(editHeight) && <Text style={styles.rowValueText}>{editHeight}</Text>}
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Weight */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedWheelValue(editWeight || '42kg');
                  setActiveField('weight');
                }}
              >
                <View style={styles.rowLeftGroup}>
                  <WeightIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Weight')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  {Boolean(editWeight) && <Text style={styles.rowValueText}>{editWeight}</Text>}
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Occupation */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editOccupation);
                  setActiveField('occupation');
                }}
              >
                <View style={styles.rowLeftGroup}>
                  <OccupationIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Occupation')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  {Boolean(editOccupation) && (
                    <Text style={styles.rowValueText}>{editOccupation}</Text>
                  )}
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              {/* Country or Region */}
              <TouchableOpacity
                style={styles.infoRow}
                activeOpacity={0.75}
                onPress={() => {
                  setTempFieldValue(editCountry);
                  setActiveField('country');
                }}
              >
                <View style={styles.rowLeftGroup}>
                  <GlobeIcon size={22} color="#2C2C2E" />
                  <Text style={styles.rowLabelText}>{t('Country or Region')}</Text>
                </View>
                <View style={styles.rowRightGroup}>
                  <Text style={styles.rowValueText}>🇮🇳 {editCountry || 'India'}</Text>
                  <ChevronRight size={18} color="#C4C4C6" />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sub-Editor Modal for interactive field edit */}
          {renderFieldEditorModal()}
        </View>
      </Modal>

      {/* 13. REPORT MODAL */}
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmitReport={async ({ requestedBanDuration, reason, description }) => {
          await api.post('/reports', {
            reportedUserId: userId,
            requestedBanDuration,
            reason,
            description,
          });
          showToast(t('Report submitted successfully'), 'success');
        }}
        targetUserName={profile.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },

  // 1. Hero Cover & Header
  heroContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F0F1A',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  heroCoverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSquareBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Ranking Badge
  rankingBadge: {
    position: 'absolute',
    right: 0,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    overflow: 'hidden',
    zIndex: 5,
  },
  rankingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 4,
  },
  rankingStarEmoji: {
    fontSize: 14,
  },
  rankingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Avatar & CP Area
  heroAvatarArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mainAvatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  partnerAvatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 4,
  },
  mainAvatarImg: {
    width: '100%',
    height: '100%',
  },
  cpRingConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  cpRingLvText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cpRingChangeText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
  },

  // User details on Hero
  heroUserInfo: {
    paddingHorizontal: 20,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroUserName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  onlineStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E676',
  },
  onlineStatusText: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '700',
  },
  idCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  idCopyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  idCopyIcon: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  vipBadge: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  wealthBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wealthBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  charmBadge: {
    backgroundColor: '#0984E3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  charmBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  medalCrestRow: {
    marginTop: 4,
  },

  // 2. Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // 3. Family Banner
  familyBannerOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#17C3B2',
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  familyBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  familyLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  familyLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  familyJoinBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  familyJoinBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },

  // 4. Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    marginRight: 24,
    paddingBottom: 8,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8E93',
  },
  tabBtnTextActive: {
    color: '#1C1C1E',
    fontWeight: '900',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -1,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00C853',
  },

  // Generic Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  dashedAddBtn: {
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dashedAddBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },

  // CP Relationship
  cpListScroll: {
    flexDirection: 'row',
  },
  cpCardItem: {
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cpCardGradient: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cpPartnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 4,
  },
  cpLvBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cpTypePill: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
  },
  cpTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D3748',
  },
  cpEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cpEmptyText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  cpEmptySub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Basic Information
  signatureBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  signatureLabel: {
    fontSize: 11.5,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
    lineHeight: 18,
  },
  infoPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoPillItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoPillLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // Games section (Screenshot 3)
  gamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  gameAddBtn: {
    width: 88,
    height: 48,
    borderWidth: 1.4,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  gameAddBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  gameCardItem: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 48,
  },
  gameCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: '100%',
    minWidth: 130,
    gap: 8,
  },
  gameIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfoWrap: {
    justifyContent: 'center',
  },
  gameTitleText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  gameSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },

  // Top Supporters (Podium)
  topSupportersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 10,
  },
  supporterPodium: {
    alignItems: 'center',
    flex: 1,
  },
  supporterAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  supporterImg: {
    width: '100%',
    height: '100%',
  },
  supporterCrown: {
    position: 'absolute',
    top: -2,
    right: 2,
    fontSize: 14,
  },
  topRibbon: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: -8,
    elevation: 2,
  },
  topRibbonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  supporterName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },

  // Wish
  wishSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
  },

  // Floating Edit FAB
  floatingEditFab: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#00C853',
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },

  // Bottom action bar (for other users)
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  bottomFollowBtn: {
    flex: 2,
    backgroundColor: '#00C853',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  bottomFollowingBtn: {
    backgroundColor: '#64748B',
  },
  bottomFollowBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  bottomReportBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  bottomReportBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },

  // Basic Information Screen & Cards (Matching Screenshot)
  basicInfoScreen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  basicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  basicInfoBackBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
  },
  basicInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  basicInfoSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicInfoSaveBtnText: {
    color: '#00C853',
    fontWeight: '700',
    fontSize: 14.5,
  },
  basicInfoScroll: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  basicInfoAvatarImg: {
    width: '100%',
    height: '100%',
  },
  changeAvatarText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  rowLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabelText: {
    fontSize: 15.5,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  rowValueText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  rowGrayValueText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  bioValueText: {
    fontSize: 13.5,
    color: '#4B5563',
    textAlign: 'right',
    flex: 1,
    lineHeight: 19,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  coverThumbnail: {
    width: 32,
    height: 24,
    borderRadius: 4,
    marginRight: 4,
  },

  // Interactive Sub-Modal & Sheets
  fieldModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sheetBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  sheetBtnIcon: {
    fontSize: 20,
  },
  sheetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  sheetCancelBtn: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },

  dialogBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 14,
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 14,
  },
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  genderOptionPillActive: {
    backgroundColor: '#00C853',
  },
  genderOptionEmoji: {
    fontSize: 20,
  },
  genderOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
  quickPresetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presetPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  dialogActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  dialogConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#00C853',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Wheel Picker Bottom Sheet (Matching Height & Weight Screenshots)
  wheelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  wheelSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  wheelSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  wheelSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  wheelConfirmBtn: {
    backgroundColor: '#26D07C',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
  },
  wheelConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
  wheelPickerContainer: {
    height: 44 * 5,
    position: 'relative',
    overflow: 'hidden',
  },
  wheelSelectionHighlight: {
    position: 'absolute',
    top: 44 * 2,
    left: 0,
    right: 0,
    height: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
    zIndex: 10,
  },
  wheelItemRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  wheelItemTextSelected: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
});

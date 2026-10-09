import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { useToast } from './Toast';

// 1. Icons
const HeartOutlineIcon = ({ size = 22, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeartFilledIcon = ({ size = 22, color = '#EF4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    />
  </Svg>
);

const CommentBubbleIcon = ({ size = 22, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ size = 16, color = '#00C853' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PencilIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ImageIcon = ({ size = 24, color = '#00C853' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="2" />
    <Path
      d="M21 15l-5-5L5 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendIcon = ({ size = 20, color = '#00C853' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRight = ({ size = 18, color = '#94A3B8' }) => (
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

const BackChevron = ({ size = 24, color = '#1E293B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom Interactive Slider Component for Join Requirements
const RequirementSlider = ({
  value,
  onValueChange,
  max = 70,
  activeColor = '#FB923C',
  trackColor = '#FFEDD5',
  thumbColor = '#F97316',
}) => {
  const [sliderWidth, setSliderWidth] = useState(260);

  const calculateValueFromX = (locationX) => {
    if (sliderWidth <= 0) return 0;
    const clampedX = Math.max(0, Math.min(sliderWidth, locationX));
    const ratio = clampedX / sliderWidth;
    const newVal = Math.round(ratio * max);
    onValueChange(Math.max(0, Math.min(max, newVal)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        calculateValueFromX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        calculateValueFromX(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const progressPercent = max > 0 ? (value / max) * 100 : 0;

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.sliderActiveTrack,
            { width: `${progressPercent}%`, backgroundColor: activeColor },
          ]}
        />
      </View>
      <View
        style={[
          styles.sliderThumb,
          {
            left: `${progressPercent}%`,
            borderColor: thumbColor,
            backgroundColor: thumbColor,
          },
        ]}
      />
    </View>
  );
};

export default function DiscoverView({ currentUser, insets, navigation }) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // 3 Tabs: 'Following', 'Trending', 'Family'
  const [activeTab, setActiveTab] = useState('Trending');

  // Posts State
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Families State
  const [families, setFamilies] = useState([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  // Create Post Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [pickedImages, setPickedImages] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments Modal State
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fullscreen Image Viewer Modal
  const [viewingImageUrl, setViewingImageUrl] = useState(null);

  // ==========================================
  // FAMILY CREATION & SETTINGS STATE
  // ==========================================
  const [createFamilyModalVisible, setCreateFamilyModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyTag, setFamilyTag] = useState('');
  const [familyAnnouncement, setFamilyAnnouncement] = useState('');
  const [familyAvatar, setFamilyAvatar] = useState(null);
  const [reviewMethod, setReviewMethod] = useState('admin_review'); // 'automatic' | 'admin_review'
  const [tempReviewMethod, setTempReviewMethod] = useState('admin_review');
  const [reviewMethodModalVisible, setReviewMethodModalVisible] = useState(false);

  // Join Requirements State (User Level: max 70, Wealth Level: max 100)
  const [minUserLevel, setMinUserLevel] = useState(0); // 0 = no request, max 70
  const [minWealthLevel, setMinWealthLevel] = useState(0); // 0 = no request, max 100
  const [joinRequirementsModalVisible, setJoinRequirementsModalVisible] = useState(false);
  const [creatingFamily, setCreatingFamily] = useState(false);

  // Format relative timestamp
  const formatPostTime = (dateStr) => {
    if (!dateStr) return t('Just now');
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 60) return diffMin <= 1 ? t('Just now') : `${diffMin} ${t('minutes ago')}`;
      if (diffHours < 24) return `${diffHours} ${t('hours ago')}`;
      if (diffDays === 1) return t('1 days ago');
      return `${diffDays} ${t('days ago')}`;
    } catch {
      return t('Just now');
    }
  };

  // Fetch posts from API (Following or Trending)
  const fetchPosts = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) setLoadingPosts(true);
        const endpoint = activeTab === 'Following' ? '/posts/following' : '/posts/trending';
        const res = await api.get(endpoint);
        if (res.data?.success) {
          setPosts(res.data.posts || []);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        if (showLoader) setLoadingPosts(false);
      }
    },
    [activeTab]
  );

  // Fetch Recommended Families
  const fetchFamilies = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoadingFamilies(true);
      const res = await api.get('/families/recommendations');
      if (res.data?.success) {
        setFamilies(res.data.families || []);
      }
    } catch (err) {
      console.error('Error fetching families:', err);
    } finally {
      if (showLoader) setLoadingFamilies(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Family') {
      fetchFamilies(true);
    } else {
      fetchPosts(true);
    }
  }, [activeTab, fetchPosts, fetchFamilies]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'Family') {
      await fetchFamilies(false);
    } else {
      await fetchPosts(false);
    }
    setRefreshing(false);
  };

  // Toggle Like Handler
  const handleToggleLike = async (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id === postId) {
          const wasLiked = p.isLiked;
          return {
            ...p,
            isLiked: !wasLiked,
            likeCount: wasLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
          };
        }
        return p;
      })
    );

    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data?.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p._id === postId
              ? { ...p, isLiked: res.data.isLiked, likeCount: res.data.likeCount }
              : p
          )
        );
      }
    } catch (err) {
      fetchPosts(false);
    }
  };

  // Follow User from Trending Feed
  const handleFollowUser = async (targetUserId) => {
    try {
      const res = await api.post(`/users/${targetUserId}/follow`);
      if (res.data?.success) {
        showToast(
          res.data.following
            ? t('Followed user successfully!')
            : t('Unfollowed user'),
          'success'
        );
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.user?._id === targetUserId
              ? { ...p, isFollowing: res.data.following }
              : p
          )
        );
      }
    } catch (err) {
      showToast(t('Action failed'), 'error');
    }
  };

  // Pick Photos for new post
  const handlePickPhotos = async () => {
    try {
      if (pickedImages.length >= 2) {
        showToast(t('Maximum 2 photos allowed per post'), 'info');
        return;
      }
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast(t('Permission to access photos is required'), 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = `data:image/jpeg;base64,${asset.base64}`;
        setPickedImages((prev) => [...prev, dataUri].slice(0, 2));
      }
    } catch (err) {
      showToast(t('Failed to pick photo'), 'error');
    }
  };

  // Submit New Post
  const handleCreatePost = async () => {
    if (!postCaption.trim() && pickedImages.length === 0) {
      showToast(t('Please write a caption or add a photo'), 'error');
      return;
    }

    try {
      setSubmittingPost(true);
      const res = await api.post('/posts/create', {
        caption: postCaption.trim(),
        media: pickedImages,
      });

      if (res.data?.success) {
        showToast(t('Post shared successfully! 🎉'), 'success');
        setCreateModalVisible(false);
        setPostCaption('');
        setPickedImages([]);
        fetchPosts(false);
      } else {
        showToast(t(res.data?.message || 'Failed to create post'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create post';
      showToast(t(msg), 'error');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Open Comments Modal
  const handleOpenComments = async (post) => {
    setSelectedPostForComments(post);
    setCommentsList([]);
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post._id}/comments`);
      if (res.data?.success) {
        setCommentsList(res.data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add Comment to Post
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedPostForComments) return;
    try {
      setSubmittingComment(true);
      const res = await api.post(`/posts/${selectedPostForComments._id}/comment`, {
        text: newCommentText.trim(),
      });

      if (res.data?.success) {
        setCommentsList((prev) => [res.data.comment, ...prev]);
        setNewCommentText('');
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p._id === selectedPostForComments._id
              ? { ...p, commentCount: res.data.commentCount }
              : p
          )
        );
      }
    } catch (err) {
      showToast(t('Failed to post comment'), 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ==========================================
  // FAMILY CREATION & JOINING HANDLERS
  // ==========================================
  const handleOpenCreateFamily = () => {
    setCreateFamilyModalVisible(true);
  };

  // Pick Avatar for new family
  const handlePickFamilyAvatar = async () => {
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
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFamilyAvatar(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (err) {
      showToast(t('Failed to pick avatar'), 'error');
    }
  };

  // Create Family Submit
  const handleCreateFamilySubmit = async () => {
    const currentLevel = Math.max(
      currentUser?.userLevel || 1,
      currentUser?.wealthLevel || 1
    );

    if (currentLevel < 30) {
      showToast(
        t('Free create requires Level 30 or above. Your current level is LV.') +
          currentLevel,
        'error'
      );
      return;
    }

    if (!familyName.trim()) {
      showToast(t('Please enter Family Name'), 'error');
      return;
    }
    if (!familyTag.trim()) {
      showToast(t('Please enter Family Tag'), 'error');
      return;
    }

    try {
      setCreatingFamily(true);
      const res = await api.post('/families/create', {
        name: familyName.trim(),
        tag: familyTag.trim(),
        announcement: familyAnnouncement.trim(),
        avatar: familyAvatar,
        reviewMethod,
        minUserLevel,
        minWealthLevel,
      });

      if (res.data?.success) {
        showToast(t('Family created successfully! 🎉'), 'success');
        setCreateFamilyModalVisible(false);
        setFamilyName('');
        setFamilyTag('');
        setFamilyAnnouncement('');
        setFamilyAvatar(null);
        setMinUserLevel(0);
        setMinWealthLevel(0);
        fetchFamilies(false);
      } else {
        showToast(t(res.data?.message || 'Failed to create family'), 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create family';
      showToast(t(msg), 'error');
    } finally {
      setCreatingFamily(false);
    }
  };

  // Join Family Handler
  const handleJoinFamily = async (fam) => {
    try {
      const res = await api.post(`/families/${fam._id}/join`);
      if (res.data?.success) {
        if (res.data.status === 'joined') {
          showToast(t('Joined family successfully! 🎉'), 'success');
        } else {
          showToast(t('Join request submitted! Awaiting family admin review.'), 'info');
        }
        fetchFamilies(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to join family';
      showToast(t(msg), 'error');
    }
  };

  // Render Post Item
  const renderPostItem = ({ item }) => {
    const user = item.user || {};
    const media = item.media || [];
    const isCurrentUser = user._id === currentUser?._id;

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeaderRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (user._id && navigation) {
                navigation.navigate('UserProfile', { userId: user._id });
              }
            }}
            style={styles.avatarWrap}
          >
            <Image
              source={{
                uri:
                  user.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.userInfoWrap}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (user._id && navigation) {
                  navigation.navigate('UserProfile', { userId: user._id });
                }
              }}
            >
              <Text style={styles.userNameText} numberOfLines={1}>
                {user.name || t('User')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.userBioText} numberOfLines={1}>
              {user.signature || t('This user left no words.')}
            </Text>
          </View>

          {/* Follow '+' Button */}
          {activeTab === 'Trending' && !item.isFollowing && !isCurrentUser && (
            <TouchableOpacity
              style={styles.followPlusBtn}
              activeOpacity={0.75}
              onPress={() => handleFollowUser(user._id)}
            >
              <PlusIcon size={16} color="#00C853" />
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        {!!item.caption && (
          <Text style={styles.postCaptionText}>{item.caption}</Text>
        )}

        {/* Media */}
        {media.length === 1 && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setViewingImageUrl(media[0].url)}
            style={styles.singleImageContainer}
          >
            <Image
              source={{ uri: media[0].url }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {media.length >= 2 && (
          <View style={styles.twoImagesRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setViewingImageUrl(media[0].url)}
              style={styles.twoImageCol}
            >
              <Image
                source={{ uri: media[0].url }}
                style={styles.multiImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setViewingImageUrl(media[1].url)}
              style={styles.twoImageCol}
            >
              <Image
                source={{ uri: media[1].url }}
                style={styles.multiImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Meta */}
        <View style={styles.postMetaRow}>
          <Text style={styles.postTimeText}>{formatPostTime(item.createdAt)}</Text>

          <View style={styles.postActionsGroup}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={() => handleToggleLike(item._id)}
            >
              {item.isLiked ? (
                <HeartFilledIcon size={20} color="#EF4444" />
              ) : (
                <HeartOutlineIcon size={20} color="#64748B" />
              )}
              <Text
                style={[
                  styles.actionCountText,
                  item.isLiked && { color: '#EF4444', fontWeight: '800' },
                ]}
              >
                {item.likeCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.75}
              onPress={() => handleOpenComments(item)}
            >
              <CommentBubbleIcon size={20} color="#64748B" />
              <Text style={styles.actionCountText}>{item.commentCount || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.postCardSeparator} />
      </View>
    );
  };

  // Render Family Card
  const renderFamilyItem = ({ item }) => (
    <View style={styles.familyCard}>
      <Image
        source={{
          uri:
            item.avatar ||
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200',
        }}
        style={styles.familyAvatar}
      />

      <View style={styles.familyInfoBox}>
        <Text style={styles.familyName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.familyMetaRow}>
          <View style={styles.familyTagBadge}>
            <Text style={styles.familyTagBadgeText}>{item.tag}</Text>
          </View>
          <Text style={styles.familyIdText}>ID-{item.customId}</Text>
          <Text style={styles.familyMembersCount}>
            👥 {item.memberCount}/{item.maxMembers}
          </Text>
        </View>
      </View>

      {/* Join / Status Button */}
      {item.isMember ? (
        <View style={styles.familyJoinedBadge}>
          <Text style={styles.familyJoinedText}><T>Joined</T></Text>
        </View>
      ) : item.isPending ? (
        <View style={styles.familyPendingBadge}>
          <Text style={styles.familyPendingText}><T>Pending</T></Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.familyJoinBtn}
          activeOpacity={0.8}
          onPress={() => handleJoinFamily(item)}
        >
          <Text style={styles.familyJoinBtnText}><T>Join</T></Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(16, insets.top) }]}>
      {/* 1. TOP HEADER WITH 3 TABS: Following, Trending, Family */}
      <View style={styles.header}>
        <View style={styles.tabsRow}>
          {/* Tab 1: Following */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('Following')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Following' && styles.tabTextActive,
              ]}
            >
              <T>Following</T>
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Trending */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('Trending')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Trending' && styles.tabTextActive,
              ]}
            >
              <T>Trending</T>
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Family */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setActiveTab('Family')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'Family' && styles.tabTextActive,
              ]}
            >
              <T>Family</T>
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FAMILY TAB VIEW */}
      {activeTab === 'Family' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00C853']}
            />
          }
        >
          {/* Privilege Banner Card matching Screenshot 1 */}
          <View style={styles.privilegeBannerCard}>
            <Text style={styles.privilegeBannerTitle}>
              <T>Join the Family to unlock privileges</T>
            </Text>

            <View style={styles.privilegeGrid}>
              {/* Privilege 1: Double Crystals */}
              <View style={styles.privilegeItem}>
                <View style={[styles.privilegeIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={{ fontSize: 24 }}>💎</Text>
                </View>
                <Text style={styles.privilegeItemText} numberOfLines={2}>
                  <T>Get double Crystals</T>
                </Text>
              </View>

              {/* Privilege 2: Gift Rewards */}
              <View style={styles.privilegeItem}>
                <View style={[styles.privilegeIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={{ fontSize: 24 }}>🛡️</Text>
                </View>
                <Text style={styles.privilegeItemText} numberOfLines={2}>
                  <T>Get Gift Rewards</T>
                </Text>
              </View>

              {/* Privilege 3: Exclusive Tools */}
              <View style={styles.privilegeItem}>
                <View style={[styles.privilegeIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={{ fontSize: 24 }}>🧰</Text>
                </View>
                <Text style={styles.privilegeItemText} numberOfLines={2}>
                  <T>Unlock exclusive family tools</T>
                </Text>
              </View>

              {/* Privilege 4: Family Tasks */}
              <View style={styles.privilegeItem}>
                <View style={[styles.privilegeIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={{ fontSize: 24 }}>📋</Text>
                </View>
                <Text style={styles.privilegeItemText} numberOfLines={2}>
                  <T>Unlock Family Tasks</T>
                </Text>
              </View>
            </View>

            {/* + Create Button */}
            <TouchableOpacity
              style={styles.bannerCreateBtn}
              activeOpacity={0.85}
              onPress={handleOpenCreateFamily}
            >
              <LinearGradient
                colors={['#00E676', '#00C853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerCreateGradient}
              >
                <PlusIcon size={18} color="#FFFFFF" />
                <Text style={styles.bannerCreateBtnText}><T>Create</T></Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Family Recommendations Heading */}
          <Text style={styles.familySectionTitle}>
            <T>Family Recommendations</T>
          </Text>

          {loadingFamilies ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#00C853" />
            </View>
          ) : families.length === 0 ? (
            <View style={styles.familyEmptyBox}>
              <Text style={{ fontSize: 44, marginBottom: 8 }}>🏰</Text>
              <Text style={styles.emptyTitle}><T>No Families Created Yet</T></Text>
              <Text style={styles.emptySub}>
                <T>Be the first captain to create your family and invite members!</T>
              </Text>
            </View>
          ) : (
            <FlatList
              data={families}
              keyExtractor={(item) => item._id}
              renderItem={renderFamilyItem}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      ) : (
        /* 3. POSTS FEED (Following or Trending) */
        loadingPosts ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#00C853" />
          </View>
        ) : posts.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#00C853']}
              />
            }
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }}
              style={{ width: 80, height: 80, opacity: 0.5, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'Following'
                ? t('No Following Posts Yet')
                : t('No Trending Posts Yet')}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'Following'
                ? t('Follow users or explore trending feed to see new posts.')
                : t('Be the first to share a post, photo, or status with friends!')}
            </Text>

            {activeTab === 'Following' ? (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
                onPress={() => setActiveTab('Trending')}
              >
                <Text style={styles.emptyActionBtnText}><T>Explore Trending</T></Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.8}
                onPress={() => setCreateModalVisible(true)}
              >
                <Text style={styles.emptyActionBtnText}>✍️ <T>Create Post</T></Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={renderPostItem}
            contentContainerStyle={{
              paddingBottom: 110 + insets.bottom,
              paddingTop: 4,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#00C853']}
              />
            }
          />
        )
      )}

      {/* 4. FLOATING ACTION BUTTON (Pencil) */}
      <TouchableOpacity
        style={[styles.floatingActionBtn, { bottom: 95 + insets.bottom }]}
        activeOpacity={0.85}
        onPress={() => setCreateModalVisible(true)}
      >
        <LinearGradient
          colors={['#00E676', '#00C853']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingActionGradient}
        >
          <PencilIcon size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* 5. CREATE POST MODAL */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.createModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.createModalHeader, { paddingTop: Math.max(16, insets.top) }]}>
            <TouchableOpacity
              onPress={() => {
                setCreateModalVisible(false);
                setPostCaption('');
                setPickedImages([]);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.createModalCancelText}><T>Cancel</T></Text>
            </TouchableOpacity>

            <Text style={styles.createModalTitle}><T>New Post</T></Text>

            <TouchableOpacity
              style={[
                styles.createModalPostBtn,
                (!postCaption.trim() && pickedImages.length === 0) && {
                  opacity: 0.5,
                },
              ]}
              onPress={handleCreatePost}
              disabled={submittingPost || (!postCaption.trim() && pickedImages.length === 0)}
            >
              {submittingPost ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createModalPostBtnText}><T>Post</T></Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createModalBody} keyboardShouldPersistTaps="handled">
            <View style={styles.createModalUserRow}>
              <Image
                source={{
                  uri:
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                }}
                style={styles.createModalAvatar}
              />
              <View>
                <Text style={styles.createModalUserName}>
                  {currentUser?.name || t('You')}
                </Text>
                <Text style={styles.createModalVisibility}>
                  🌍 <T>Public</T>
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.createModalInput}
              placeholder={t("What's on your mind? Share thoughts, poetry, or moments...")}
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={6}
              value={postCaption}
              onChangeText={setPostCaption}
              autoFocus={true}
              textAlignVertical="top"
            />

            {pickedImages.length > 0 && (
              <View style={styles.previewImagesRow}>
                {pickedImages.map((imgUri, index) => (
                  <View key={index} style={styles.previewImageWrap}>
                    <Image source={{ uri: imgUri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setPickedImages((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {pickedImages.length < 2 && (
              <TouchableOpacity
                style={styles.addPhotoRowBtn}
                activeOpacity={0.8}
                onPress={handlePickPhotos}
              >
                <ImageIcon size={22} color="#00C853" />
                <Text style={styles.addPhotoBtnText}>
                  <T>Add Photo</T> ({pickedImages.length}/2)
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 6. CREATE A FAMILY MODAL matching Screenshot 2 */}
      <Modal
        visible={createFamilyModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCreateFamilyModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.createFamilyContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={[styles.createFamilyHeader, { paddingTop: Math.max(16, insets.top) }]}>
            <View style={{ width: 30 }} />
            <Text style={styles.createFamilyHeaderTitle}><T>Create a Family</T></Text>
            <TouchableOpacity
              onPress={() => setCreateFamilyModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.createFamilyCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createFamilyBody} keyboardShouldPersistTaps="handled">
            {/* Top Avatar Picker */}
            <View style={styles.familyAvatarPickerSection}>
              <View style={styles.familyAvatarBox}>
                {familyAvatar ? (
                  <Image source={{ uri: familyAvatar }} style={styles.familyAvatarPreview} />
                ) : (
                  <View style={styles.familyAvatarPlaceholder}>
                    <ImageIcon size={32} color="#94A3B8" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.familyAvatarChangeBtn}
                  activeOpacity={0.8}
                  onPress={handlePickFamilyAvatar}
                >
                  <Text style={styles.familyAvatarChangeText}><T>Change</T></Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Field 1: Family Name * */}
            <View style={styles.familyFieldGroup}>
              <Text style={styles.familyFieldLabel}>
                <T>Family Name</T><Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.familyInputRow}>
                <TextInput
                  style={styles.familyTextInput}
                  placeholder={t('Create a Name for your Family')}
                  placeholderTextColor="#94A3B8"
                  maxLength={20}
                  value={familyName}
                  onChangeText={setFamilyName}
                />
                <Text style={styles.familyInputCounter}>{familyName.length}/20</Text>
              </View>
            </View>

            {/* Field 2: Family Tag * */}
            <View style={styles.familyFieldGroup}>
              <Text style={styles.familyFieldLabel}>
                <T>Family Tag</T><Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.familyInputRow}>
                <TextInput
                  style={styles.familyTextInput}
                  placeholder={t('Set a Tag for your Family')}
                  placeholderTextColor="#94A3B8"
                  maxLength={8}
                  autoCapitalize="characters"
                  value={familyTag}
                  onChangeText={setFamilyTag}
                />
                <Text style={styles.familyInputCounter}>{familyTag.length}/8</Text>
              </View>
              <Text style={styles.familyTagWarning}>
                ❗ <T>Once the family tag is set, it cannot be changed!!!</T>
              </Text>
            </View>

            {/* Field 3: Family Announcement */}
            <View style={styles.familyFieldGroup}>
              <Text style={styles.familyFieldLabel}><T>Family Announcement</T></Text>
              <View style={styles.familyTextAreaBox}>
                <TextInput
                  style={styles.familyTextArea}
                  placeholder={t('Write an Announcement for your Family')}
                  placeholderTextColor="#94A3B8"
                  maxLength={500}
                  multiline={true}
                  numberOfLines={4}
                  value={familyAnnouncement}
                  onChangeText={setFamilyAnnouncement}
                  textAlignVertical="top"
                />
                <Text style={styles.familyTextAreaCounter}>{familyAnnouncement.length}/500</Text>
              </View>
            </View>

            {/* Field 4: Review method -> opens Screenshot 3 modal */}
            <TouchableOpacity
              style={styles.familySelectRow}
              activeOpacity={0.75}
              onPress={() => {
                setTempReviewMethod(reviewMethod);
                setReviewMethodModalVisible(true);
              }}
            >
              <Text style={styles.familySelectLabel}><T>Review method</T></Text>
              <View style={styles.familySelectValueRow}>
                <Text style={styles.familySelectValueText}>
                  {reviewMethod === 'automatic'
                    ? t('Pass automatically')
                    : t("Admin's Review")}
                </Text>
                <ChevronRight size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Field 5: Join Requirements -> opens Screenshots 4 & 5 modal */}
            <TouchableOpacity
              style={styles.familySelectRow}
              activeOpacity={0.75}
              onPress={() => setJoinRequirementsModalVisible(true)}
            >
              <Text style={styles.familySelectLabel}><T>Join Requirements</T></Text>
              <View style={styles.familySelectValueRow}>
                <Text style={styles.familySelectValueText}>
                  {minUserLevel === 0 && minWealthLevel === 0
                    ? t('no request')
                    : `LV.${minUserLevel || 0} / LV.${minWealthLevel || 0}`}
                </Text>
                <ChevronRight size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>

            {/* Notes Section matching Screenshot 2 */}
            <View style={styles.familyNotesBox}>
              <Text style={styles.familyNoteItem}>
                <T>1.Free create for above level 30</T>
              </Text>
              <Text style={styles.familyNoteItem}>
                <T>2.If family members receive coin gifts, the captain can also get some coin rewards</T>
              </Text>
              <Text style={styles.familyNoteItem}>
                <T>3. The Captain can receive 1%-5% of coin rebates from the Family members' gifts every month</T>
              </Text>
            </View>

            {/* Submit Button: Create for free */}
            <TouchableOpacity
              style={styles.familyCreateSubmitBtn}
              activeOpacity={0.85}
              onPress={handleCreateFamilySubmit}
              disabled={creatingFamily}
            >
              {creatingFamily ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.familyCreateSubmitBtnText}>
                  <T>Create for free</T>
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 7. REVIEW METHOD POPUP MODAL matching Screenshot 3 */}
      <Modal
        visible={reviewMethodModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReviewMethodModalVisible(false)}
      >
        <View style={styles.reviewModalOverlay}>
          <View style={styles.reviewModalBox}>
            {/* Option 1: Pass automatically */}
            <TouchableOpacity
              style={styles.reviewOptionRow}
              activeOpacity={0.8}
              onPress={() => setTempReviewMethod('automatic')}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.reviewOptionTitle}>
                  <T>Pass automatically</T>
                </Text>
                <Text style={styles.reviewOptionSub}>
                  <T>Users will automatically join the family after apply</T>
                </Text>
              </View>
              <View style={styles.radioOuterCircle}>
                {tempReviewMethod === 'automatic' && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.reviewDivider} />

            {/* Option 2: Admin's Review */}
            <TouchableOpacity
              style={styles.reviewOptionRow}
              activeOpacity={0.8}
              onPress={() => setTempReviewMethod('admin_review')}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.reviewOptionTitle}>
                  <T>Admin's Review</T>
                </Text>
                <Text style={styles.reviewOptionSub}>
                  <T>After the user applied, users can join the family after being confirmed by the family admin.</T>
                </Text>
              </View>
              <View style={styles.radioOuterCircle}>
                {tempReviewMethod === 'admin_review' && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
            </TouchableOpacity>

            {/* Bottom Actions: Cancel & Confirm */}
            <View style={styles.reviewBtnRow}>
              <TouchableOpacity
                style={styles.reviewCancelBtn}
                onPress={() => setReviewMethodModalVisible(false)}
              >
                <Text style={styles.reviewCancelBtnText}><T>Cancel</T></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewConfirmBtn}
                onPress={() => {
                  setReviewMethod(tempReviewMethod);
                  setReviewMethodModalVisible(false);
                }}
              >
                <Text style={styles.reviewConfirmBtnText}><T>Confirm</T></Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. JOIN REQUIREMENTS MODAL matching Screenshots 4 & 5 */}
      <Modal
        visible={joinRequirementsModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setJoinRequirementsModalVisible(false)}
      >
        <View style={[styles.joinReqContainer, { paddingTop: Math.max(16, insets.top) }]}>
          {/* Header */}
          <View style={styles.joinReqHeader}>
            <TouchableOpacity
              onPress={() => setJoinRequirementsModalVisible(false)}
              style={styles.joinReqBackBtn}
            >
              <BackChevron size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.joinReqHeaderTitle}><T>Join Requirements</T></Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.joinReqBody}>
            {/* Requirement 1: User level requirements (Max 70!) */}
            <View style={styles.joinReqBlock}>
              <View style={styles.joinReqTitleRow}>
                <View style={styles.joinReqTitleLeft}>
                  <View style={[styles.joinReqBadgeIcon, { backgroundColor: '#F97316' }]}>
                    <Text style={{ fontSize: 13, color: '#FFFFFF' }}>⭐</Text>
                  </View>
                  <Text style={styles.joinReqTitleText}>
                    <T>User level requirements</T>
                  </Text>
                </View>
                <Text style={styles.joinReqValueText}>
                  {minUserLevel === 0 ? t('no request') : `LV.${minUserLevel}`}
                </Text>
              </View>

              {/* Progress Slider (0 to 70) */}
              <RequirementSlider
                value={minUserLevel}
                onValueChange={setMinUserLevel}
                max={70}
                activeColor="#FB923C"
                trackColor="#FFEDD5"
                thumbColor="#F97316"
              />
            </View>

            {/* Requirement 2: Wealth level requirements (Max 100!) */}
            <View style={[styles.joinReqBlock, { marginTop: 36 }]}>
              <View style={styles.joinReqTitleRow}>
                <View style={styles.joinReqTitleLeft}>
                  <View style={[styles.joinReqBadgeIcon, { backgroundColor: '#3B82F6' }]}>
                    <Text style={{ fontSize: 13, color: '#FFFFFF' }}>💲</Text>
                  </View>
                  <Text style={styles.joinReqTitleText}>
                    <T>Wealth level requirements</T>
                  </Text>
                </View>
                <Text style={styles.joinReqValueText}>
                  {minWealthLevel === 0 ? t('no request') : `LV.${minWealthLevel}`}
                </Text>
              </View>

              {/* Progress Slider (0 to 100) */}
              <RequirementSlider
                value={minWealthLevel}
                onValueChange={setMinWealthLevel}
                max={100}
                activeColor="#60A5FA"
                trackColor="#DBEAFE"
                thumbColor="#3B82F6"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. COMMENTS MODAL */}
      <Modal
        visible={!!selectedPostForComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPostForComments(null)}
      >
        <View style={styles.commentModalOverlay}>
          <View style={[styles.commentModalBox, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>
                <T>Comments</T> ({commentsList.length})
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedPostForComments(null)}
                style={styles.commentModalCloseBtn}
              >
                <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.commentCenterBox}>
                <ActivityIndicator color="#00C853" size="small" />
              </View>
            ) : commentsList.length === 0 ? (
              <View style={styles.commentCenterBox}>
                <Text style={styles.noCommentsText}><T>No comments yet. Say something!</T></Text>
              </View>
            ) : (
              <FlatList
                data={commentsList}
                keyExtractor={(item) => item._id}
                style={styles.commentsFlatList}
                renderItem={({ item }) => (
                  <View style={styles.commentItemRow}>
                    <Image
                      source={{
                        uri:
                          item.user?.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContentBox}>
                      <View style={styles.commentTopRow}>
                        <Text style={styles.commentUserName}>
                          {item.user?.name || t('User')}
                        </Text>
                        <Text style={styles.commentTimeText}>
                          {formatPostTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.commentBodyText}>{item.text}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentTextInput}
                placeholder={t('Write a comment...')}
                placeholderTextColor="#94A3B8"
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <TouchableOpacity
                style={[
                  styles.commentSendBtn,
                  !newCommentText.trim() && { opacity: 0.4 },
                ]}
                onPress={handleAddComment}
                disabled={submittingComment || !newCommentText.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#00C853" />
                ) : (
                  <SendIcon size={20} color="#00C853" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10. FULLSCREEN IMAGE PREVIEW */}
      <Modal
        visible={!!viewingImageUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.fullscreenOverlay}
          activeOpacity={1}
          onPress={() => setViewingImageUrl(null)}
        >
          {viewingImageUrl && (
            <Image
              source={{ uri: viewingImageUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setViewingImageUrl(null)}
          >
            <Text style={styles.fullscreenCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header (Following, Trending, Family)
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 26,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    fontSize: 21,
    fontWeight: '900',
    color: '#00C853',
  },

  // 2. Privilege Banner Card (Screenshot 1)
  privilegeBannerCard: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  privilegeBannerTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
  },
  privilegeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  privilegeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privilegeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privilegeItemText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 16,
  },
  bannerCreateBtn: {
    alignSelf: 'center',
    width: '65%',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#00C853',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerCreateGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  bannerCreateBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  // Family Recommendations List
  familySectionTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  familyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  familyInfoBox: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  familyName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  familyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  familyTagBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  familyTagBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0284C7',
  },
  familyIdText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  familyMembersCount: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  familyJoinBtn: {
    borderWidth: 1.5,
    borderColor: '#00C853',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 18,
  },
  familyJoinBtnText: {
    color: '#00C853',
    fontWeight: '800',
    fontSize: 13.5,
  },
  familyJoinedBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  familyJoinedText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  familyPendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  familyPendingText: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12.5,
  },
  familyEmptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  // 3. Post Card
  postCard: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  userInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userBioText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  followPlusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  postCaptionText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  singleImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoImagesRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    height: 165,
    marginBottom: 12,
  },
  twoImageCol: {
    flex: 1,
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  multiImage: {
    width: '100%',
    height: '100%',
  },
  postMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  postTimeText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  postActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionCountText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '600',
  },
  postCardSeparator: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 10,
  },

  // 4. Floating Action Button
  floatingActionBtn: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: '#00C853',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  floatingActionGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 5. Create Family Modal (Screenshot 2)
  createFamilyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  createFamilyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  createFamilyHeaderTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  createFamilyCloseText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  createFamilyBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  familyAvatarPickerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  familyAvatarBox: {
    alignItems: 'center',
  },
  familyAvatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyAvatarPreview: {
    width: 76,
    height: 76,
    borderRadius: 16,
    marginBottom: 8,
  },
  familyAvatarChangeBtn: {
    backgroundColor: '#64748B',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  familyAvatarChangeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  familyFieldGroup: {
    marginBottom: 16,
  },
  familyFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  familyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  familyTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    paddingVertical: 10,
  },
  familyInputCounter: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
  },
  familyTagWarning: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  familyTextAreaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  familyTextArea: {
    fontSize: 14.5,
    color: '#0F172A',
    minHeight: 80,
  },
  familyTextAreaCounter: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  familySelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  familySelectLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  familySelectValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  familySelectValueText: {
    fontSize: 13.5,
    color: '#64748B',
    fontWeight: '600',
  },
  familyNotesBox: {
    marginTop: 18,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  familyNoteItem: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },
  familyCreateSubmitBtn: {
    backgroundColor: '#00C853',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  familyCreateSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  // 6. Review Method Modal (Screenshot 3)
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  reviewModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  reviewOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  reviewOptionSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  radioOuterCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C853',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  reviewBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 20,
    paddingTop: 8,
  },
  reviewCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  reviewCancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  reviewConfirmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  reviewConfirmBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00C853',
  },

  // 7. Join Requirements Modal (Screenshots 4 & 5)
  joinReqContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  joinReqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  joinReqBackBtn: {
    padding: 4,
  },
  joinReqHeaderTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  joinReqBody: {
    flex: 1,
    padding: 24,
  },
  joinReqBlock: {
    marginBottom: 10,
  },
  joinReqTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinReqTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinReqBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinReqTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  joinReqValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Custom Slider
  sliderContainer: {
    width: '100%',
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderActiveTrack: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // 8. Create Post Modal
  createModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  createModalCancelText: {
    fontSize: 15.5,
    color: '#64748B',
    fontWeight: '600',
  },
  createModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  createModalPostBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
  },
  createModalPostBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  createModalBody: {
    flex: 1,
    padding: 18,
  },
  createModalUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  createModalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  createModalUserName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  createModalVisibility: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  createModalInput: {
    fontSize: 16,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  previewImagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  previewImageWrap: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  addPhotoRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  addPhotoBtnText: {
    color: '#00C853',
    fontWeight: '700',
    fontSize: 14,
  },

  // 9. Comments Modal
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingTop: 16,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentModalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  commentModalCloseBtn: {
    padding: 6,
  },
  commentCenterBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCommentsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsFlatList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  commentItemRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContentBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  commentTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  commentBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 10. Fullscreen Image Modal
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // General States
  centerBox: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#00C853',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import api from '../api/client';

let MediaLibrary = null;
try {
  // eslint-disable-next-line global-require
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // Silent fallback
}

let DocumentPicker = null;
try {
  // eslint-disable-next-line global-require
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  // Silent fallback
}

// ── STRICT ADULT / PORN CONTENT FILTER ──
const PROHIBITED_KEYWORDS = [
  'porn', 'xxx', 'sex', 'nude', 'naked', 'adult', 'erotic', 'nsfw',
  'bhabhi', 'chut', 'boobs', 'fuck', 'strip', 'bra', 'pussy', 'penis',
  'dick', 'vagina', 'xvideos', 'pornhub', 'xnxx', 'redtube', 'youporn',
  'onlyfans', 'chaturbate', 'camgirl', 'hentai', 'milf', 'hardcore', 'incest'
];

function isAdultContent(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower) || lower.includes(word);
  });
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function CheckboxIcon({ checked = false, size = 22 }) {
  if (checked) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect width="24" height="24" rx="6" fill="#00E676" />
        <Polyline
          points="6 12 10.5 16.5 18 8"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="5.5"
        stroke="#94A3B8"
        strokeWidth="1.6"
        fill="transparent"
      />
    </Svg>
  );
}

export default function RoomVideoModal({
  visible,
  onClose,
  roomId,
  videoPlaylist = [],
  currentVideo = null,
  isHostOrAdmin = false,
  onVideoUpdated,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Tabs: 'playlist' | 'url_input' | 'phone_scan'
  const [activeTab, setActiveTab] = useState('playlist');

  // URL Input State
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);

  // Phone Videos State
  const [phoneVideos, setPhoneVideos] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [uploadingVideos, setUploadingVideos] = useState(false);

  useEffect(() => {
    if (visible) {
      if (videoPlaylist.length === 0) {
        setActiveTab('url_input');
      } else {
        setActiveTab('playlist');
      }
      setSelectedVideos(new Set());
    }
  }, [visible, videoPlaylist.length]);

  // ── Scan Phone for MP4 Videos ──
  const scanPhoneVideos = async () => {
    try {
      setScanning(true);
      if (MediaLibrary) {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.status === 'granted') {
          const res = await MediaLibrary.getAssetsAsync({
            mediaType: 'video',
            first: 100,
            sortBy: [['creationTime', false]],
          });

          if (res && res.assets && res.assets.length > 0) {
            const list = res.assets.map((asset) => ({
              id: asset.id,
              title: asset.filename || 'Local MP4 Video',
              uri: asset.uri,
              duration: asset.duration,
            }));
            setPhoneVideos(list);
            setScanning(false);
            return;
          }
        }
      }

      // Fallback: Pick via ImagePicker or DocumentPicker
      setScanning(false);
    } catch (e) {
      console.log('scanPhoneVideos error:', e);
      setScanning(false);
    }
  };

  const handleOpenPhoneScanner = () => {
    setActiveTab('phone_scan');
    scanPhoneVideos();
  };

  const handlePickSingleFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const fileName = asset.fileName || 'Phone Video';

        if (isAdultContent(fileName) || isAdultContent(asset.uri)) {
          showToast(t('Sexual and adult content is strictly prohibited!'), 'error');
          return;
        }

        await addVideoToBackend({
          title: fileName,
          url: asset.uri,
          source: 'local_upload',
          duration: asset.duration ? Math.round(asset.duration / 1000) : 0,
        });
      }
    } catch (err) {
      showToast(t('Failed to pick video from gallery'), 'error');
    }
  };

  const toggleSelectPhoneVideo = (vidId) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(vidId)) {
        next.delete(vidId);
      } else {
        next.add(vidId);
      }
      return next;
    });
  };

  const handleConfirmAddSelectedPhoneVideos = async () => {
    if (selectedVideos.size === 0) {
      showToast(t('Please select at least one video'), 'info');
      return;
    }

    try {
      setUploadingVideos(true);
      const toAdd = phoneVideos.filter((v) => selectedVideos.has(v.id));

      for (const item of toAdd) {
        if (isAdultContent(item.title) || isAdultContent(item.uri)) {
          showToast(t('Adult content skipped: ') + item.title, 'error');
          continue;
        }
        await addVideoToBackend({
          title: item.title,
          url: item.uri,
          source: 'local_upload',
          duration: Math.round(item.duration || 0),
        });
      }

      showToast(t('Videos added to room playlist!'), 'success');
      setActiveTab('playlist');
    } catch (err) {
      showToast(t('Error adding selected videos'), 'error');
    } finally {
      setUploadingVideos(false);
    }
  };

  // ── Add URL (YouTube or Direct MP4) ──
  const handleAddUrl = async () => {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      showToast(t('Please enter a video URL'), 'error');
      return;
    }

    // Adult validation
    if (isAdultContent(trimmedUrl) || isAdultContent(videoTitle)) {
      showToast(t('Sexual, pornographic or violent content is strictly prohibited!'), 'error');
      return;
    }

    try {
      setAddingUrl(true);
      const isYoutube =
        trimmedUrl.includes('youtube.com') ||
        trimmedUrl.includes('youtu.be') ||
        /^[a-zA-Z0-9_-]{11}$/.test(trimmedUrl);
      const defaultTitle = isYoutube ? 'YouTube Video' : 'Online Video';

      await addVideoToBackend({
        title: videoTitle.trim() || defaultTitle,
        url: trimmedUrl,
        source: isYoutube ? 'youtube' : 'direct_url',
        duration: 0,
      });

      setVideoUrl('');
      setVideoTitle('');
      showToast(t('Video added! Starting playback...'), 'success');
      setActiveTab('playlist');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add video';
      showToast(t(msg), 'error');
    } finally {
      setAddingUrl(false);
    }
  };

  const addVideoToBackend = async (videoData) => {
    const res = await api.post(`/rooms/${roomId}/videos/add`, videoData);
    if (res.data?.success && onVideoUpdated) {
      onVideoUpdated(res.data.videoPlaylist, res.data.currentVideo);
    }
  };

  const handlePlayVideo = async (video) => {
    try {
      const res = await api.post(`/rooms/${roomId}/videos/play`, {
        videoId: video.id,
        isPlaying: true,
      });
      if (res.data?.success && onVideoUpdated) {
        onVideoUpdated(res.data.videoPlaylist, res.data.currentVideo);
        showToast(t('Playing: ') + video.title, 'success');
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err) {
      showToast(t('Failed to play video'), 'error');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      const res = await api.post(`/rooms/${roomId}/videos/delete`, {
        videoId,
      });
      if (res.data?.success && onVideoUpdated) {
        onVideoUpdated(res.data.videoPlaylist, res.data.currentVideo);
        showToast(t('Video removed from playlist'), 'info');
      }
    } catch (err) {
      showToast(t('Failed to delete video'), 'error');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              <T>Room Videos</T>
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.75}
              onPress={onClose}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'playlist' && styles.tabItemActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('playlist')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'playlist' && styles.tabTextActive,
                ]}
              >
                <T>Playlist</T> ({videoPlaylist.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'url_input' && styles.tabItemActive]}
              activeOpacity={0.8}
              onPress={() => setActiveTab('url_input')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'url_input' && styles.tabTextActive,
                ]}
              >
                <T>Enter Video URL</T>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'phone_scan' && styles.tabItemActive]}
              activeOpacity={0.8}
              onPress={handleOpenPhoneScanner}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'phone_scan' && styles.tabTextActive,
                ]}
              >
                <T>Phone Videos</T>
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: PLAYLIST */}
          {activeTab === 'playlist' && (
            <View style={styles.contentWrap}>
              {videoPlaylist.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🎬</Text>
                  <Text style={styles.emptyText}>
                    <T>There is no video can be played.</T>
                  </Text>
                  <TouchableOpacity
                    style={styles.addNowBtn}
                    activeOpacity={0.8}
                    onPress={() => setActiveTab('url_input')}
                  >
                    <Text style={styles.addNowText}>
                      <T>Add Video</T>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={videoPlaylist}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  renderItem={({ item, index }) => {
                    const isPlaying = currentVideo?.id === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.videoItemRow,
                          isPlaying && styles.videoItemRowPlaying,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handlePlayVideo(item)}
                      >
                        <View style={styles.videoIndexBadge}>
                          {isPlaying ? (
                            <Text style={styles.playingEmoji}>▶️</Text>
                          ) : (
                            <Text style={styles.videoIndexText}>{index + 1}</Text>
                          )}
                        </View>
                        <View style={styles.videoMetaCol}>
                          <Text
                            style={[
                              styles.videoTitleText,
                              isPlaying && styles.videoTitlePlaying,
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.videoSourceText}>
                            {item.source === 'youtube'
                              ? 'YouTube'
                              : item.source === 'local_upload'
                              ? 'Phone Storage'
                              : 'Online MP4'}
                          </Text>
                        </View>
                        {isHostOrAdmin && (
                          <TouchableOpacity
                            style={styles.deleteVideoBtn}
                            activeOpacity={0.7}
                            onPress={() => handleDeleteVideo(item.id)}
                          >
                            <Text style={styles.deleteVideoIcon}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* TAB 2: ENTER VIDEO URL */}
          {activeTab === 'url_input' && (
            <View style={styles.contentWrap}>
              <Text style={styles.inputLabel}>
                <T>Video URL (YouTube or MP4)</T>
              </Text>
              <TextInput
                style={styles.textInput}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor="#64748B"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>
                <T>Video Title (Optional)</T>
              </Text>
              <TextInput
                style={styles.textInput}
                value={videoTitle}
                onChangeText={setVideoTitle}
                placeholder={t('Enter a title for this video')}
                placeholderTextColor="#64748B"
              />

              <View style={styles.prohibitedNotice}>
                <Text style={styles.prohibitedText}>
                  ⚠️ <T>Sexual and adult content is strictly prohibited and will be blocked automatically.</T>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={handleAddUrl}
                disabled={addingUrl}
              >
                <LinearGradient
                  colors={['#00E676', '#00C853']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGrad}
                >
                  {addingUrl ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>
                      <T>Add Video to Playlist</T>
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: PHONE VIDEOS */}
          {activeTab === 'phone_scan' && (
            <View style={styles.contentWrap}>
              <View style={styles.phoneScanHeader}>
                <TouchableOpacity
                  style={styles.pickGalleryBtn}
                  activeOpacity={0.8}
                  onPress={handlePickSingleFromGallery}
                >
                  <Text style={styles.pickGalleryText}>
                    📁 <T>Choose File from Gallery</T>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refreshScanBtn}
                  activeOpacity={0.7}
                  onPress={scanPhoneVideos}
                >
                  <Text style={styles.refreshScanText}>🔄 <T>Scan</T></Text>
                </TouchableOpacity>
              </View>

              {scanning ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color="#00E676" />
                  <Text style={styles.loadingText}>
                    <T>Scanning phone for MP4 videos...</T>
                  </Text>
                </View>
              ) : phoneVideos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    <T>No local videos found or permission not granted.</T>
                  </Text>
                  <TouchableOpacity
                    style={styles.addNowBtn}
                    activeOpacity={0.8}
                    onPress={handlePickSingleFromGallery}
                  >
                    <Text style={styles.addNowText}>
                      <T>Pick from Phone Gallery</T>
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <FlatList
                    data={phoneVideos}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 10 }}
                    renderItem={({ item }) => {
                      const isSelected = selectedVideos.has(item.id);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.phoneItemRow,
                            isSelected && styles.phoneItemRowSelected,
                          ]}
                          activeOpacity={0.75}
                          onPress={() => toggleSelectPhoneVideo(item.id)}
                        >
                          <CheckboxIcon checked={isSelected} size={22} />
                          <View style={styles.phoneMetaCol}>
                            <Text style={styles.phoneVideoTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.phoneVideoDuration}>
                              {formatDuration(item.duration)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />

                  {selectedVideos.size > 0 && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      activeOpacity={0.8}
                      onPress={handleConfirmAddSelectedPhoneVideos}
                      disabled={uploadingVideos}
                    >
                      <LinearGradient
                        colors={['#00E676', '#00C853']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionGrad}
                      >
                        {uploadingVideos ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.actionBtnText}>
                            <T>Add Selected Videos</T> ({selectedVideos.size})
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    minHeight: 400,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#2A2A3E',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },
  contentWrap: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'center',
  },
  addNowBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addNowText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  videoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  videoItemRowPlaying: {
    borderColor: '#00E676',
    borderWidth: 1.5,
  },
  videoIndexBadge: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  videoIndexText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  playingEmoji: {
    fontSize: 14,
  },
  videoMetaCol: {
    flex: 1,
  },
  videoTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  videoTitlePlaying: {
    color: '#00E676',
    fontWeight: '700',
  },
  videoSourceText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  deleteVideoBtn: {
    padding: 6,
  },
  deleteVideoIcon: {
    fontSize: 16,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  prohibitedNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  prohibitedText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 18,
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
  },
  actionGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  phoneScanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  pickGalleryBtn: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickGalleryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  refreshScanBtn: {
    backgroundColor: '#2A2A3E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  refreshScanText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  phoneItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  phoneItemRowSelected: {
    borderColor: '#00E676',
    borderWidth: 1,
  },
  phoneMetaCol: {
    flex: 1,
  },
  phoneVideoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  phoneVideoDuration: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = Math.max(420, Math.min(540, Math.round(SCREEN_HEIGHT * 0.62)));
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';
import api from '../api/client';

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

function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // Bare 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Standard watch query params (e.g. ?v=... or &v=...)
  const vMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) return vMatch[1];

  // youtu.be shortlinks (e.g. https://youtu.be/...)
  const youtuBeMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // YouTube Shorts (e.g. https://youtube.com/shorts/...)
  const shortsMatch = clean.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // YouTube Embed (e.g. https://youtube.com/embed/...)
  const embedMatch = clean.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // YouTube Live (e.g. https://youtube.com/live/...)
  const liveMatch = clean.match(/\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // /v/ path
  const vPathMatch = clean.match(/\/v\/([a-zA-Z0-9_-]{11})/);
  if (vPathMatch && vPathMatch[1]) return vPathMatch[1];

  return null;
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

  // Tabs: 'playlist' | 'url_input'
  const [activeTab, setActiveTab] = useState('playlist');

  // URL Input State
  const [videoUrl, setVideoUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);

  useEffect(() => {
    if (visible) {
      if (videoPlaylist.length === 0) {
        setActiveTab('url_input');
      } else {
        setActiveTab('playlist');
      }
    }
  }, [visible, videoPlaylist.length]);

  // ── Add URL (YouTube or Direct MP4) ──
  const handleAddUrl = async () => {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) {
      showToast(t('Please enter a video URL'), 'error');
      return;
    }

    // Adult validation
    if (isAdultContent(trimmedUrl)) {
      showToast(t('Sexual, pornographic or violent content is strictly prohibited!'), 'error');
      return;
    }

    try {
      setAddingUrl(true);
      const ytId = extractYoutubeId(trimmedUrl);
      const isYoutube =
        Boolean(ytId) ||
        trimmedUrl.includes('youtube.com') ||
        trimmedUrl.includes('youtu.be');
      let resolvedTitle = isYoutube ? 'YouTube Video' : 'Online Video';

      if (ytId) {
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
          );
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            if (data?.title) {
              resolvedTitle = data.title;
            }
          }
        } catch (e) {
          // If network fetch fails, backend will also try to resolve it
        }
      }

      await addVideoToBackend({
        title: resolvedTitle,
        url: trimmedUrl,
        source: isYoutube ? 'youtube' : 'direct_url',
        duration: 0,
      });

      setVideoUrl('');
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidWrap}
        >
          <View style={[styles.modalCard, { paddingBottom: Math.max(32, insets.bottom + 22) }]}>
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
                  🎬 <T>Add YouTube Video</T>
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
                        <T>Add YouTube Video</T>
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={videoPlaylist}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.flatList}
                    contentContainerStyle={{ paddingVertical: 10, paddingBottom: 40 }}
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
                                : 'Online Video'}
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
              <ScrollView
                style={styles.scrollWrap}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>
                  <T>YouTube Video Link or ID</T>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
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
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidWrap: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    height: MODAL_HEIGHT,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
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
    width: '100%',
  },
  flatList: {
    flex: 1,
    width: '100%',
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
    marginTop: 14,
    marginBottom: 20,
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

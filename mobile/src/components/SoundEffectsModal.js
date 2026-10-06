import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';

// Try to load expo-audio
let ExpoAudio = null;
try {
  ExpoAudio = require('expo-audio');
} catch (e) {}

// 10 Sound Effects — local bundled MP3 + PNG icon assets
const SOUND_EFFECTS = [
  {
    id: 'cheer',
    label: 'Cheer',
    color: '#FF6B6B',
    bgColor: 'rgba(255,107,107,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/cheer.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_cheer.png'),
  },
  {
    id: 'clap',
    label: 'Clap',
    color: '#FFB347',
    bgColor: 'rgba(255,179,71,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/clap.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_clap.png'),
  },
  {
    id: 'win',
    label: 'Win',
    color: '#FFD700',
    bgColor: 'rgba(255,215,0,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/win.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_win.png'),
  },
  {
    id: 'awkward',
    label: 'Awkward',
    color: '#98D8C8',
    bgColor: 'rgba(152,216,200,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/awkward.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_awkward.png'),
  },
  {
    id: 'laugh',
    label: 'Laugh',
    color: '#FFEB3B',
    bgColor: 'rgba(255,235,59,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/laugh.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_laugh.png'),
  },
  {
    id: 'mock',
    label: 'Mock',
    color: '#4CAF50',
    bgColor: 'rgba(76,175,80,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/mock.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_mock.png'),
  },
  {
    id: 'horror',
    label: 'Horror',
    color: '#A78BFA',
    bgColor: 'rgba(167,139,250,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/horror.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_horror.png'),
  },
  {
    id: 'wow',
    label: 'Wow',
    color: '#E040FB',
    bgColor: 'rgba(224,64,251,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/wow.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_wow.png'),
  },
  {
    id: 'cry',
    label: 'Cry',
    color: '#42A5F5',
    bgColor: 'rgba(66,165,245,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/cry.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_cry.png'),
  },
  {
    id: 'love',
    label: 'Love',
    color: '#F06292',
    bgColor: 'rgba(240,98,146,0.15)',
    // eslint-disable-next-line global-require
    asset: require('../../assets/sounds/love.mp3'),
    // eslint-disable-next-line global-require
    icon: require('../../assets/sounds/icon_love.png'),
  },
];

// Individual Sound Tile
function SoundTile({ item, onPlay, playingId }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isPlaying = playingId === item.id;

  useEffect(() => {
    if (isPlaying) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 25 }),
        Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true, speed: 20 }),
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 15 }),
      ]).start();
    }
  }, [isPlaying]);

  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: item.bgColor }, isPlaying && { borderColor: item.color }]}
      activeOpacity={0.7}
      onPress={() => onPlay(item)}
    >
      {isPlaying && <View style={[styles.playingRing, { borderColor: item.color }]} />}
      <Animated.Image
        source={item.icon}
        style={[styles.iconImg, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
      <Text style={[styles.tileLabel, isPlaying && { color: item.color }]}>
        <T>{item.label}</T>
      </Text>
      {isPlaying && <View style={[styles.playingDot, { backgroundColor: item.color }]} />}
    </TouchableOpacity>
  );
}

// Main Component
export default function SoundEffectsModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [playingId, setPlayingId] = useState(null);
  const playerRef = useRef(null);
  const stopTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(stopTimerRef.current);
      _stopCurrent();
    };
  }, []);

  const _stopCurrent = () => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.pause === 'function') playerRef.current.pause();
        if (typeof playerRef.current.remove === 'function') playerRef.current.remove();
      } catch (e) {}
      playerRef.current = null;
    }
  };

  const handlePlay = async (item) => {
    // Tap same tile again → stop
    if (playingId === item.id) {
      clearTimeout(stopTimerRef.current);
      _stopCurrent();
      setPlayingId(null);
      return;
    }

    clearTimeout(stopTimerRef.current);
    _stopCurrent();
    setPlayingId(item.id);

    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      try {
        // Activate audio session first
        if (typeof ExpoAudio.setIsAudioActiveAsync === 'function') {
          try { await ExpoAudio.setIsAudioActiveAsync(true); } catch (_e) {}
        }

        const player = ExpoAudio.createAudioPlayer(item.asset);
        playerRef.current = player;

        // Listen for when audio is loaded, THEN play — avoids race condition
        if (typeof player.addListener === 'function') {
          const sub = player.addListener('playbackStatusUpdate', (status) => {
            if (status && status.isLoaded && !status.playing) {
              try { player.play(); } catch (_e) {}
              sub.remove();
            }
          });
        } else {
          // Fallback: retry play() until it works (max 20 attempts × 100ms = 2s)
          let attempts = 0;
          const tryPlay = setInterval(() => {
            attempts++;
            try {
              if (playerRef.current) {
                playerRef.current.play();
                clearInterval(tryPlay);
              }
            } catch (_e) {}
            if (attempts >= 20) clearInterval(tryPlay);
          }, 100);
        }
      } catch (e) {
        console.log('[SoundFX] error:', e.message);
      }
    } else {
      console.log('[SoundFX] expo-audio not available');
    }

    // Auto-stop after 4 seconds
    stopTimerRef.current = setTimeout(() => {
      _stopCurrent();
      setPlayingId(null);
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}><T>Sound Effect</T></Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}><T>Tap a sound to play it</T></Text>

              {/* 4-column Grid */}
              <FlatList
                data={SOUND_EFFECTS}
                numColumns={4}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
                renderItem={({ item }) => (
                  <SoundTile item={item} onPlay={handlePlay} playingId={playingId} />
                )}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#181830',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  handleBar: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 14,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  subtitle: { fontSize: 12, color: '#6B7280', marginBottom: 18 },
  grid: { paddingBottom: 8 },
  tile: {
    flex: 1, margin: 5, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', borderWidth: 1.5,
    borderColor: 'transparent', minHeight: 85,
  },
  playingRing: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, borderWidth: 1.5,
  },
  iconImg: { width: 44, height: 44, marginBottom: 6 },
  tileLabel: { fontSize: 10, fontWeight: '600', color: '#CBD5E1', textAlign: 'center' },
  playingDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5,
  },
});

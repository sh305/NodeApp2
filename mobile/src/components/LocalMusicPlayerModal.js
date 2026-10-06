import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { musicPlayer } from '../services/musicPlayerService';

// ── SVG ICONS ──
function PrevIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="2.5" height="14" rx="1" fill={color} />
      <Path d="M19 6.5L9.5 12L19 17.5V6.5Z" fill={color} />
    </Svg>
  );
}

function NextIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6.5L14.5 12L5 17.5V6.5Z" fill={color} />
      <Rect x="17.5" y="5" width="2.5" height="14" rx="1" fill={color} />
    </Svg>
  );
}

function PlayIcon({ size = 32, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4.5L19.5 12L7 19.5V4.5Z" fill={color} />
    </Svg>
  );
}

function PauseIcon({ size = 30, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="5" width="3.5" height="14" rx="1.5" fill={color} />
      <Rect x="14.5" y="5" width="3.5" height="14" rx="1.5" fill={color} />
    </Svg>
  );
}

function PlaylistIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H15" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M3 12H13" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M3 18H11" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M17 10V16.5C17 17.88 15.88 19 14.5 19C13.12 19 12 17.88 12 16.5C12 15.12 13.12 14 14.5 14C15.4 14 16.18 14.48 16.6 15.2V11L21 9.5V8L17 9.5V10Z"
        fill={color}
      />
    </Svg>
  );
}

function SpeakerLowIcon({ size = 18, color = 'rgba(255,255,255,0.6)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
    </Svg>
  );
}

function SpeakerHighIcon({ size = 20, color = 'rgba(255,255,255,0.7)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
      <Path
        d="M15.54 8.46C16.48 9.4 17 10.65 17 12C17 13.35 16.48 14.6 15.54 15.54"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M19.07 4.93C20.94 6.8 22 9.3 22 12C22 14.7 20.94 17.2 19.07 19.07"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Faint Vinyl Record Watermark
function VinylWatermark() {
  return (
    <View style={styles.watermarkContainer} pointerEvents="none">
      <Svg width={220} height={220} viewBox="0 0 160 160" fill="none">
        <Circle cx="120" cy="120" r="80" stroke="rgba(255,255,255,0.04)" strokeWidth="18" />
        <Circle cx="120" cy="120" r="50" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        <Circle cx="120" cy="120" r="25" fill="rgba(255,255,255,0.03)" />
      </Svg>
    </View>
  );
}

export default function LocalMusicPlayerModal({
  visible,
  onClose,
  onOpenPlaylist,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [playerState, setPlayerState] = useState(musicPlayer.getState());
  const [sliderWidth, setSliderWidth] = useState(200);

  useEffect(() => {
    musicPlayer.init();
    const unsub = musicPlayer.subscribe((state) => {
      setPlayerState(state);
    });
    return unsub;
  }, []);

  const { currentSong, isPlaying, volume, playInOtherApps } = playerState;

  // Handle pan / tap on custom slider
  const handleSliderTouch = (evt) => {
    const touchX = evt.nativeEvent.locationX;
    if (sliderWidth > 0) {
      const newVol = Math.max(0, Math.min(1, touchX / sliderWidth));
      musicPlayer.setVolume(newVol);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handleSliderTouch,
    onPanResponderMove: (evt, gestureState) => {
      const touchX = evt.nativeEvent.locationX;
      if (sliderWidth > 0) {
        const newVol = Math.max(0, Math.min(1, touchX / sliderWidth));
        musicPlayer.setVolume(newVol);
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Outer tap = dismiss modal (music keeps playing) */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          {/* Inner tap on card = do nothing (stop propagation) */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                styles.playerCard,
                { marginBottom: Math.max(50, insets.bottom + 40) },
              ]}
            >
          <VinylWatermark />

          {/* Header Title */}
          <Text style={styles.headerTitle}>
            <T>Play local music</T>
          </Text>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            {/* Prev Button */}
            <TouchableOpacity
              style={styles.controlBtn}
              activeOpacity={0.7}
              onPress={() => musicPlayer.prev()}
            >
              <PrevIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Play/Pause Button */}
            <TouchableOpacity
              style={styles.playPauseBtn}
              activeOpacity={0.75}
              onPress={() => musicPlayer.togglePlay()}
            >
              {isPlaying ? (
                <PauseIcon size={30} color="#FFFFFF" />
              ) : (
                <PlayIcon size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.controlBtn}
              activeOpacity={0.7}
              onPress={() => musicPlayer.next()}
            >
              <NextIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Song Title (Truncated) */}
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong ? currentSong.title : t('No music added yet')}
            </Text>

            {/* Playlist Icon Button -> Opens Screenshot 2 "My music" list */}
            <TouchableOpacity
              style={styles.playlistBtn}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                if (onOpenPlaylist) onOpenPlaylist();
              }}
            >
              <PlaylistIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Volume Slider Row */}
          <View style={styles.volumeRow}>
            <TouchableOpacity
              onPress={() => musicPlayer.setVolume(volume > 0 ? 0 : 0.5)}
              activeOpacity={0.7}
            >
              <SpeakerLowIcon size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* Interactive Slider Bar */}
            <View
              style={styles.sliderTrackWrapper}
              onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              <View style={styles.sliderBackgroundTrack} />
              <View
                style={[
                  styles.sliderFilledTrack,
                  { width: `${Math.round(volume * 100)}%` },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${Math.max(0, Math.min(96, Math.round(volume * 100)))}%`,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => musicPlayer.setVolume(1.0)}
              activeOpacity={0.7}
            >
              <SpeakerHighIcon size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Play music in other apps Row */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleTitle}>
              <T>Play music in other apps</T>
            </Text>
            <Switch
              value={playInOtherApps}
              onValueChange={(val) => musicPlayer.setPlayInOtherApps(val)}
              trackColor={{ false: '#3E3863', true: '#22C55E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Explanation Text */}
          <Text style={styles.explanationText}>
            <T>
              After it is turned on, when you play music in other apps or when
              other app starts playing audio, users in the room can also hear it.
            </T>
          </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playerCard: {
    marginHorizontal: 16,
    backgroundColor: '#231E47',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    opacity: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBtn: {
    marginHorizontal: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songTitle: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  playlistBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderTrackWrapper: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderBackgroundTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sliderFilledTrack: {
    position: 'absolute',
    left: 0,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: -8,
    top: '50%',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
  },
});

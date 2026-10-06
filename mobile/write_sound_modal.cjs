const fs = require('fs');
const E = {
  cheer: '\uD83C\uDF89', clap: '\uD83D\uDC4F', win: '\uD83C\uDFC6', awkward: '\uD83D\uDE2C',
  laugh: '\uD83D\uDE02', boo: '\uD83D\uDC4E', horror: '\uD83D\uDC7B', drum: '\uD83E\uDD41',
  love: '\u2764\uFE0F', wow: '\uD83D\uDE2E', x: '\u2715'
};
const code = `import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, FlatList, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './TranslatedText';

let ExpoAudio = null;
try { ExpoAudio = require('expo-audio'); } catch (_) {}

const SOUND_EFFECTS = [
  { id: 'cheer',   label: 'Cheer',     emoji: '${E.cheer}',  color: '#F59E0B', uri: 'https://www.soundjay.com/human/sounds/applause-01.mp3' },
  { id: 'clap',    label: 'Clap',      emoji: '${E.clap}',   color: '#3B82F6', uri: 'https://www.soundjay.com/human/sounds/applause-8.mp3' },
  { id: 'win',     label: 'Win',       emoji: '${E.win}',    color: '#EAB308', uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3' },
  { id: 'awkward', label: 'Awkward',   emoji: '${E.awkward}',color: '#8B5CF6', uri: 'https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3' },
  { id: 'laugh',   label: 'Laugh',     emoji: '${E.laugh}',  color: '#22C55E', uri: 'https://www.soundjay.com/human/sounds/laughing-1.mp3' },
  { id: 'boo',     label: 'Mock',      emoji: '${E.boo}',    color: '#EF4444', uri: 'https://www.soundjay.com/human/sounds/boo-01.mp3' },
  { id: 'horror',  label: 'Horror',    emoji: '${E.horror}', color: '#6B7280', uri: 'https://www.soundjay.com/horror/sounds/horror-atmosphere-01.mp3' },
  { id: 'drum',    label: 'Drum Roll', emoji: '${E.drum}',   color: '#F97316', uri: 'https://www.soundjay.com/misc/sounds/drum-roll-1.mp3' },
  { id: 'love',    label: 'Love',      emoji: '${E.love}',   color: '#EC4899', uri: 'https://www.soundjay.com/misc/sounds/kiss-1.mp3' },
  { id: 'wow',     label: 'Wow',       emoji: '${E.wow}',    color: '#06B6D4', uri: 'https://www.soundjay.com/human/sounds/crowd-gasp-1.mp3' },
];

const AUTO_STOP_MS = 3500;

export default function SoundEffectsModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [activeId, setActiveId] = useState(null);
  const playerRef = useRef(null);
  const stopTimerRef = useRef(null);
  const scaleAnims = useRef(
    SOUND_EFFECTS.reduce((acc, s) => { acc[s.id] = new Animated.Value(1); return acc; }, {})
  ).current;

  const stopCurrent = useCallback(() => {
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.pause === 'function') playerRef.current.pause();
        if (typeof playerRef.current.remove === 'function') playerRef.current.remove();
      } catch (_) {}
      playerRef.current = null;
    }
    setActiveId(null);
  }, []);

  const playSound = useCallback(async (effect) => {
    if (activeId === effect.id) { stopCurrent(); return; }
    stopCurrent();
    Animated.sequence([
      Animated.spring(scaleAnims[effect.id], { toValue: 0.82, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnims[effect.id], { toValue: 1.08, useNativeDriver: true, speed: 30 }),
      Animated.spring(scaleAnims[effect.id], { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
    setActiveId(effect.id);
    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      try {
        const player = ExpoAudio.createAudioPlayer({ uri: effect.uri });
        playerRef.current = player;
        if (typeof player.play === 'function') player.play();
      } catch (err) { console.log('SoundEffect play error:', err); }
    }
    stopTimerRef.current = setTimeout(stopCurrent, AUTO_STOP_MS);
  }, [activeId, scaleAnims, stopCurrent]);

  const handleClose = useCallback(() => { stopCurrent(); onClose?.(); }, [stopCurrent, onClose]);

  const renderItem = useCallback(({ item }) => {
    const isActive = activeId === item.id;
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => playSound(item)} style={styles.tileWrapper}>
        <Animated.View style={[styles.tile, isActive && { borderColor: item.color, borderWidth: 2 }, { transform: [{ scale: scaleAnims[item.id] }] }]}>
          {isActive && <View style={[styles.glowRing, { shadowColor: item.color }]} />}
          <View style={[styles.emojiCircle, { backgroundColor: isActive ? item.color + '33' : 'rgba(255,255,255,0.07)', borderColor: isActive ? item.color : 'transparent', borderWidth: isActive ? 1.5 : 0 }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          <Text style={[styles.tileLabel, isActive && { color: item.color }]} numberOfLines={1}>
            <T>{item.label}</T>
          </Text>
          {isActive && (
            <View style={styles.playingDots}>
              {[0, 1, 2].map(i => <View key={i} style={[styles.dot, { backgroundColor: item.color }]} />)}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [activeId, scaleAnims, playSound]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
              <View style={styles.handleBar} />
              <View style={styles.header}>
                <Text style={styles.headerTitle}><T>Sound Effect</T></Text>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>${E.x}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}><T>Tap any sound to play it in the room</T></Text>
              <FlatList
                data={SOUND_EFFECTS}
                keyExtractor={(item) => item.id}
                numColumns={5}
                renderItem={renderItem}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#161528', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 20 },
  handleBar: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  subtitle: { fontSize: 12, color: '#6B7280', paddingHorizontal: 6, marginBottom: 18 },
  grid: { paddingHorizontal: 4 },
  tileWrapper: { flex: 1, alignItems: 'center', marginBottom: 18 },
  tile: { alignItems: 'center', width: 62, borderRadius: 16, padding: 6, borderColor: 'transparent', borderWidth: 2, position: 'relative' },
  glowRing: { position: 'absolute', width: 62, height: 62, borderRadius: 16, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  emojiCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 7 },
  emoji: { fontSize: 26 },
  tileLabel: { fontSize: 11, color: '#D1D5DB', fontWeight: '500', textAlign: 'center' },
  playingDots: { flexDirection: 'row', marginTop: 5, gap: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
`;
fs.writeFileSync('e:/NodeApp/mobile/src/components/SoundEffectsModal.js', code, { encoding: 'utf8' });
console.log('DONE - ' + code.length + ' chars');

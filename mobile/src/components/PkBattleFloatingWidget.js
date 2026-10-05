import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WIDGET_WIDTH = SCREEN_WIDTH - 24;
const WIDGET_HEIGHT = 80;

export default function PkBattleFloatingWidget({
  battleData, // { room1: { name, avatar, score }, room2: { name, avatar, score }, remainingSeconds }
  remainingSeconds,
  currentRoomId,
  isOwnerOrAdmin = false,
  onClose,
}) {
  // Draggable PanResponder setup
  const pan = useRef(new Animated.ValueXY({ x: 12, y: 110 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Format seconds into MM:SS
  const formatTime = (totalSec) => {
    const s = Math.max(0, totalSec || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const room1 = battleData?.room1 || { name: 'Room 1', score: 0 };
  const room2 = battleData?.room2 || { name: 'Room 2', score: 0 };

  const score1 = Number(room1.score || 0);
  const score2 = Number(room2.score || 0);
  const totalScore = score1 + score2;

  // Calculate Pink vs Blue percentage
  let pinkRatio = 50;
  if (totalScore > 0) {
    pinkRatio = Math.round((score1 / totalScore) * 100);
    pinkRatio = Math.max(8, Math.min(92, pinkRatio)); // keep both sides visible
  }
  const blueRatio = 100 - pinkRatio;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardGlow}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['rgba(220, 38, 38, 0.45)', 'rgba(24, 24, 43, 0.95)', 'rgba(37, 99, 235, 0.45)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.innerCard}
        >
          {/* Top Section: Room 1 (Left) | Timer Tab (Center) | Room 2 (Right) */}
          <View style={styles.topRow}>
            {/* Left Room Info */}
            <View style={styles.roomColLeft}>
              <View style={styles.avatarBorderLeft}>
                <Image
                  source={{
                    uri:
                      room1.avatar ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
                  }}
                  style={styles.roomAvatar}
                />
                <View style={styles.laurelBadgeLeft}>
                  <Text style={styles.laurelText}>👑</Text>
                </View>
              </View>
              <View style={styles.roomDetailsLeft}>
                <Text style={styles.roomName} numberOfLines={1}>
                  {room1.name}
                </Text>
                <Text style={styles.scoreTextLeft}>{score1} pts</Text>
              </View>
            </View>

            {/* Center Reverse Countdown Timer Tab matching Screenshot 2 */}
            <View style={styles.timerTab}>
              <Text style={styles.clockIcon}>🕒</Text>
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            </View>

            {/* Right Room Info */}
            <View style={styles.roomColRight}>
              <View style={styles.roomDetailsRight}>
                <Text style={styles.roomName} numberOfLines={1}>
                  {room2.name}
                </Text>
                <Text style={styles.scoreTextRight}>{score2} pts</Text>
              </View>
              <View style={styles.avatarBorderRight}>
                <Image
                  source={{
                    uri:
                      room2.avatar ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
                  }}
                  style={styles.roomAvatar}
                />
                <View style={styles.laurelBadgeRight}>
                  <Text style={styles.laurelText}>⚡</Text>
                </View>
              </View>

              {/* Close / Forfeit Button for Room Owner/Admin */}
              {isOwnerOrAdmin && Boolean(onClose) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom Dual-Color Dynamic Progress Bar matching Screenshot 2 */}
          <View style={styles.progressBarWrapper}>
            {/* Left Bar (Pink / Red) */}
            <View style={[styles.barSegmentLeft, { width: `${pinkRatio}%` }]}>
              <LinearGradient
                colors={['#FF1493', '#FF416C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.barFill}
              />
            </View>

            {/* Center Flash Glow Separator */}
            <View style={styles.centerGlowDivider} />

            {/* Right Bar (Cyan / Blue) */}
            <View style={[styles.barSegmentRight, { width: `${blueRatio}%` }]}>
              <LinearGradient
                colors={['#00C6FF', '#0072FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.barFill}
              />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDGET_WIDTH,
    zIndex: 9999,
  },
  cardGlow: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    shadowColor: '#FF2E93',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  innerCard: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 20,
    backgroundColor: '#161626',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roomColLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarBorderLeft: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FF416C',
    borderRadius: 18,
    padding: 1.5,
  },
  avatarBorderRight: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#00C6FF',
    borderRadius: 18,
    padding: 1.5,
  },
  roomAvatar: {
    width: 34,
    height: 34,
    borderRadius: 15,
    backgroundColor: '#334155',
  },
  laurelBadgeLeft: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  laurelBadgeRight: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  laurelText: {
    fontSize: 9,
  },
  roomDetailsLeft: {
    marginLeft: 6,
    flex: 1,
  },
  roomDetailsRight: {
    marginRight: 6,
    alignItems: 'flex-end',
    flex: 1,
  },
  roomName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scoreTextLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6584',
  },
  scoreTextRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  roomColRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  timerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FACC15',
    marginHorizontal: 4,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clockIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  closeBtn: {
    marginLeft: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  progressBarWrapper: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  barSegmentLeft: {
    height: '100%',
  },
  barSegmentRight: {
    height: '100%',
  },
  barFill: {
    flex: 1,
  },
  centerGlowDivider: {
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowRadius: 4,
    shadowOpacity: 1,
  },
});

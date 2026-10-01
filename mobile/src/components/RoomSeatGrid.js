import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarWithFrame from './AvatarWithFrame';
import AnimatedSeatEmoji from './AnimatedSeatEmoji';

const { width } = Dimensions.get('window');

// Animated pulse ring for host seat
function PulseRing({ active }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      opacity.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 950, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 950, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.1, duration: 950, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 950, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  if (!active) return null;
  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function RoomSeatGrid({
  seats = [],
  owner = null,
  isHostActive = true,
  isHostMuted = false,
  onSeatPress,
  onHostPress,
  currentUserId,
  isOwner = false,
  onTreasureBoxPress,
  roomGoldContributed = 0,
  isChestOpen = false,
  activeHostEmoji = null,
  activeSeatEmojis = {},
  onEmojiComplete = null,
}) {
  const COLUMNS = 4;
  const GRID_H_PADDING = 12;
  const SEAT_ITEM_WIDTH = (width - GRID_H_PADDING * 2) / COLUMNS;
  const totalSeats = seats.length || 8;
  const displaySeats = Array.from(
    { length: totalSeats },
    (_, i) => seats[i] || { seatIndex: i, user: null }
  );

  const isChestUnlocked = Boolean(isChestOpen || (roomGoldContributed && roomGoldContributed >= 12000));

  return (
    <View style={styles.container}>
      {/* ══ UPPER SECTION: Treasure Chest (Left) & Host Seat (Center) ══ */}
      <View style={styles.upperSection}>
        {/* Left: Treasure Chest with Progress Bar */}
        <View style={styles.chestContainer}>
          <TouchableOpacity
            style={styles.treasureChestWrapper}
            activeOpacity={0.8}
            onPress={onTreasureBoxPress}
          >
            <Image
              source={
                isChestUnlocked
                  ? require('../../assets/icons/golden_chest_open.png')
                  : require('../../assets/icons/golden_chest_closed.png')
              }
              style={styles.goldenChestImg}
              resizeMode="contain"
            />
            {/* Progress bar directly under chest */}
            <View style={styles.chestProgressTrack}>
              <LinearGradient
                colors={['#818CF8', '#C084FC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.chestProgressFill,
                  {
                    width: `${Math.min(
                      (roomGoldContributed / 12000) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Center: Host Seat */}
        <View style={styles.hostCenterContainer}>
          <TouchableOpacity
            style={styles.hostSeatWrapper}
            activeOpacity={0.8}
            onPress={() => onHostPress && onHostPress({ ...owner, isHostSeat: true })}
          >
            <View style={styles.hostGlowRing}>
              <PulseRing active={Boolean(isHostActive && !isHostMuted)} />

              <LinearGradient
                colors={
                  isHostActive && !isHostMuted
                    ? ['#FDE047', '#F59E0B', '#D97706']
                    : isHostActive && isHostMuted
                    ? ['rgba(156, 163, 175, 0.4)', 'rgba(107, 114, 128, 0.3)']
                    : ['rgba(139,92,246,0.5)', 'rgba(99,102,241,0.4)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.hostGradientBorder,
                  isHostActive && isHostMuted && { shadowOpacity: 0.1 },
                ]}
              >
                <View style={styles.hostInnerCircle}>
                  {isHostActive ? (
                    <Image
                      source={{
                        uri:
                          owner?.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                      }}
                      style={styles.hostAvatar}
                    />
                  ) : (
                    <View style={styles.vacantHostBox}>
                      <Image
                        source={require('../../assets/icons/SofaSeat.png')}
                        style={styles.vacantHostSofaImg}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  {/* Animated Reaction Emoji directly inside Host Avatar Profile circle */}
                  {activeHostEmoji && (
                    <AnimatedSeatEmoji
                      key={`host_emoji_${activeHostEmoji.id || activeHostEmoji.timestamp}`}
                      emoji={activeHostEmoji.emoji}
                      emojiData={activeHostEmoji.emojiData}
                      isHost={true}
                      size={53}
                      onComplete={() => onEmojiComplete && onEmojiComplete('host')}
                    />
                  )}
                </View>
              </LinearGradient>

              {/* Host Green / Red Mic Badge at bottom-right corner */}
              {isHostActive && (
                <View style={isHostMuted ? styles.hostMicBadgeMuted : styles.hostMicBadge}>
                  <Image
                    source={require('../../assets/icons/Mike.png')}
                    style={styles.hostMicIcon}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

            {/* Host Name with Crown */}
            <View style={styles.hostNameContainer}>
              <Text style={styles.hostCrownEmoji}>👑</Text>
              <Text style={styles.hostName} numberOfLines={1}>
                {isHostActive
                  ? owner?.name
                    ? `༻${owner.name}༺`
                    : 'Host'
                  : isOwner
                  ? 'Tap to Host'
                  : 'Host (Vacant)'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Right: Balanced Spacer */}
        <View style={styles.rightSpacer} />
      </View>

      {/* ══ 4×2 SOFA SEAT GRID (No.1 to No.8) ══ */}
      <View style={styles.gridContainer}>
        {displaySeats.map((seat, index) => {
          const isOccupied = seat && seat.user;
          const isMe = isOccupied && seat.user._id === currentUserId;
          const isLocked = seat?.isLockedByOwner;
          const seatNumber = index + 1;

          return (
            <TouchableOpacity
              key={`sofa_seat_${index}`}
              style={[styles.seatItem, { width: SEAT_ITEM_WIDTH }]}
              activeOpacity={0.75}
              onPress={() => onSeatPress(seat, index)}
            >
              {isOccupied ? (
                /* ── Occupied Seat ── */
                <View style={styles.occupiedWrapper}>
                  {Boolean(isMe && !seat.isMuted) && <View style={styles.mySeatGlow} />}
                  <AvatarWithFrame
                    avatarUri={seat.user.avatar}
                    level={seat.user.wealthLevel || 1}
                    size={46}
                    activeEmoji={activeSeatEmojis && activeSeatEmojis[index]}
                    onEmojiComplete={() => onEmojiComplete && onEmojiComplete(index)}
                  />

                  <Text style={styles.userName} numberOfLines={1}>
                    {seat.user.name}
                  </Text>
                  <Text style={styles.seatNumberText}>No.{seatNumber}</Text>
                  <View style={seat.isMuted ? styles.seatMicBadgeMuted : styles.seatMicBadge}>
                    <Image
                      source={require('../../assets/icons/Mike.png')}
                      style={styles.seatMicIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                /* ── Empty Seat: Vibrant Cyan / Sky-blue Glass Circle ── */
                <View style={styles.emptySeatWrapper}>
                  <View style={styles.seatGlowOuter}>
                    <LinearGradient
                      colors={
                        isLocked
                          ? ['rgba(239,68,68,0.55)', 'rgba(185,28,28,0.35)']
                          : ['rgba(56, 189, 248, 0.45)', 'rgba(14, 165, 233, 0.65)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sofaCircle}
                    >
                      <View style={styles.seatInner}>
                        {isLocked ? (
                          <View style={styles.lockedSeatWrap}>
                            <Image
                              source={require('../../assets/icons/SofaSeat.png')}
                              style={[styles.sofaSeatImg, styles.lockedSofaSeat]}
                              resizeMode="contain"
                            />
                            <View style={styles.lockBadge}>
                              <Text style={styles.lockedIcon}>🔒</Text>
                            </View>
                          </View>
                        ) : (
                          <Image
                            source={require('../../assets/icons/SofaSeat.png')}
                            style={styles.sofaSeatImg}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                  <Text style={styles.seatNumberText}>No.{seatNumber}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SEAT_SIZE = 48;
const SEAT_INNER = 38;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },

  /* ── Upper Section: Chest & Host ── */
  upperSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  chestContainer: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 6,
  },
  treasureChestWrapper: {
    alignItems: 'center',
  },
  goldenChestImg: {
    width: 52,
    height: 48,
  },
  chestProgressTrack: {
    height: 4,
    width: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  chestProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* ── Host Center ── */
  hostCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostSeatWrapper: {
    alignItems: 'center',
  },
  hostGlowRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.65)',
    zIndex: 0,
  },
  hostGradientBorder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1,
  },
  hostInnerCircle: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatar: {
    width: '100%',
    height: '100%',
  },
  vacantHostBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  hostMicBadge: {
    position: 'absolute',
    bottom: -1,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  hostMicBadgeMuted: {
    position: 'absolute',
    bottom: -1,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  hostMicIcon: {
    width: 10,
    height: 10,
    tintColor: '#FFFFFF',
  },
  hostNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    maxWidth: width * 0.45,
  },
  hostCrownEmoji: {
    fontSize: 12,
    marginRight: 3,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },

  /* ── Right Spacer ── */
  rightSpacer: {
    width: 60,
  },

  /* ── 4×N Sofa Seats Grid ── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    rowGap: 12,
    marginTop: 4,
  },
  seatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },

  /* ── Empty Seat ── */
  emptySeatWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatGlowOuter: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: SEAT_SIZE / 2,
  },
  sofaCircle: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: SEAT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  seatInner: {
    width: SEAT_INNER,
    height: SEAT_INNER,
    borderRadius: SEAT_INNER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sofaSeatImg: {
    width: 32,
    height: 32,
  },
  vacantHostSofaImg: {
    width: 36,
    height: 36,
  },
  lockedSeatWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedSofaSeat: {
    opacity: 0.45,
  },
  lockBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 16,
  },
  seatNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* ── Occupied Seat ── */
  occupiedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mySeatGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    top: -4,
    zIndex: 0,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    maxWidth: 68,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  seatMicBadge: {
    position: 'absolute',
    top: 30,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  seatMicBadgeMuted: {
    position: 'absolute',
    top: 30,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  seatMicIcon: {
    width: 9,
    height: 9,
    tintColor: '#FFFFFF',
  },
});

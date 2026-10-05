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
import { T } from './TranslatedText';

const SPECIAL_THEME_CONFIGS = {
  music: {
    name: 'Music',
    icon: '🎵',
    glowColor: '#06B6D4',
    borderColors: ['#06B6D4', '#3B82F6'],
    gradientColors: ['rgba(6, 182, 212, 0.45)', 'rgba(59, 130, 246, 0.65)'],
  },
  birthday: {
    name: 'Birthday',
    icon: '🎂',
    glowColor: '#A855F7',
    borderColors: ['#C084FC', '#9333EA'],
    gradientColors: ['rgba(192, 132, 252, 0.45)', 'rgba(147, 51, 234, 0.65)'],
  },
  royal: {
    name: 'Royal',
    icon: '👑',
    glowColor: '#F59E0B',
    borderColors: ['#FDE047', '#D97706'],
    gradientColors: ['rgba(253, 224, 71, 0.45)', 'rgba(217, 119, 6, 0.65)'],
  },
  magic: {
    name: 'Magic',
    icon: '🔮',
    glowColor: '#EC4899',
    borderColors: ['#F472B6', '#7C3AED'],
    gradientColors: ['rgba(244, 114, 182, 0.45)', 'rgba(124, 58, 237, 0.65)'],
  },
  dating: {
    name: 'Dating',
    icon: '💘',
    glowColor: '#F43F5E',
    borderColors: ['#FB7185', '#E11D48'],
    gradientColors: ['rgba(251, 113, 133, 0.45)', 'rgba(225, 29, 72, 0.65)'],
  },
  relationship: {
    name: 'Relationship',
    icon: '✨',
    glowColor: '#6366F1',
    borderColors: ['#818CF8', '#4F46E5'],
    gradientColors: ['rgba(129, 140, 248, 0.45)', 'rgba(79, 70, 229, 0.65)'],
  },
  wedding: {
    name: 'Wedding',
    icon: '💍',
    glowColor: '#FBBF24',
    borderColors: ['#FDE68A', '#F59E0B'],
    gradientColors: ['rgba(253, 230, 138, 0.45)', 'rgba(245, 158, 11, 0.65)'],
  },
};

const { width } = Dimensions.get('window');

// Animated pulse ring for host seat
function PulseRing({ active, color }) {
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
        color && { borderColor: color },
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
  bossSeat = null,
  onBossSeatPress = null,
  seatLayout = null,
}) {
  const isCustomActive = Boolean(seatLayout?.isActivated && seatLayout?.layoutId);
  const isSpecial = Boolean(isCustomActive && seatLayout?.type === 'special');
  const specialTheme = isCustomActive ? seatLayout?.specialTheme : null;
  const activeThemeConfig = isSpecial && specialTheme ? SPECIAL_THEME_CONFIGS[specialTheme] : null;

  const COLUMNS = isCustomActive ? (seatLayout?.columns || 4) : 4;
  const GRID_H_PADDING = COLUMNS === 5 ? 6 : 12;
  const SEAT_ITEM_WIDTH = (width - GRID_H_PADDING * 2) / COLUMNS;
  const seatSize = COLUMNS === 5 ? 44 : 48;
  const seatInner = COLUMNS === 5 ? 34 : 38;
  const avatarSize = COLUMNS === 5 ? 42 : 46;

  const totalSeats = isCustomActive ? (seatLayout?.seatCount || 8) : 8;
  const seatRefs = useRef([]);
  const upperSeatRef = useRef(null);
  const displaySeats = Array.from(
    { length: totalSeats },
    (_, i) => seats[i] || { seatIndex: i, user: null }
  );

  const hasUpperNormalSeat = Boolean(
    isCustomActive &&
    seatLayout?.type === 'regular'
  );
  const gridCount = hasUpperNormalSeat
    ? (seatLayout?.columns || 4) * (seatLayout?.rows || 2)
    : totalSeats;
  const gridSeats = displaySeats.slice(0, gridCount);
  const upperSeatIndex = gridCount;
  const upperNormalSeat = hasUpperNormalSeat
    ? (displaySeats[upperSeatIndex] || { seatIndex: upperSeatIndex, user: null })
    : null;

  const isBossSeatActive = Boolean(
    bossSeat &&
      bossSeat.isActive &&
      bossSeat.expiresAt &&
      new Date(bossSeat.expiresAt) > new Date()
  );
  const bossDaysLeft = isBossSeatActive
    ? Math.max(
        1,
        Math.ceil(
          (new Date(bossSeat.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const isBossOccupied = Boolean(isBossSeatActive && bossSeat.user);

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

        {/* Center: Host Seat + Normal Seat (if 10-seat layout) + Boss Seat (if purchased/active) */}
        <View
          style={[
            styles.upperSeatsPairContainer,
            isBossSeatActive && hasUpperNormalSeat && { gap: 10 },
          ]}
        >
          {/* 1. Host Seat */}
          <TouchableOpacity
            style={[
              styles.upperSeatWrapper,
              isBossSeatActive && hasUpperNormalSeat && { width: 68 },
            ]}
            activeOpacity={0.8}
            onPress={() => onHostPress && onHostPress({ ...owner, isHostSeat: true })}
          >
            <View style={styles.hostGlowRing}>
              <PulseRing
                active={Boolean(isHostActive && !isHostMuted)}
                color="rgba(245, 158, 11, 0.65)"
              />

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
                style={styles.hostGradientBorder}
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

                  {activeHostEmoji && (
                    <AnimatedSeatEmoji
                      key={`host_emoji_${activeHostEmoji.id || activeHostEmoji.timestamp}`}
                      emoji={activeHostEmoji.emoji}
                      emojiData={activeHostEmoji.emojiData}
                      isHost={true}
                      size={50}
                      onComplete={() => onEmojiComplete && onEmojiComplete('host')}
                    />
                  )}
                </View>
              </LinearGradient>

              {/* Host Green / Red Mic Badge */}
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

          {/* 2. Upper Normal Seat (Shown when 10-seat/regular layout is applied) */}
          {hasUpperNormalSeat && upperNormalSeat && (
            <TouchableOpacity
              ref={upperSeatRef}
              style={[
                styles.upperSeatWrapper,
                isBossSeatActive && { width: 68 },
              ]}
              activeOpacity={0.8}
              onPress={(e) => {
                const fallbackX = e?.nativeEvent?.pageX || 180;
                const fallbackY = e?.nativeEvent?.pageY || 120;
                if (upperSeatRef.current?.measureInWindow) {
                  upperSeatRef.current.measureInWindow((x, y, w, h) => {
                    if (typeof x === 'number' && !isNaN(x) && w > 0) {
                      onSeatPress &&
                        onSeatPress(upperNormalSeat, upperSeatIndex, {
                          x: x + w / 2,
                          y: y + h,
                          seatX: x,
                          seatY: y,
                          seatWidth: w,
                          seatHeight: h,
                        });
                    } else {
                      onSeatPress &&
                        onSeatPress(upperNormalSeat, upperSeatIndex, {
                          x: fallbackX,
                          y: fallbackY,
                          seatX: 180,
                          seatY: 100,
                          seatWidth: 54,
                          seatHeight: 54,
                        });
                    }
                  });
                } else {
                  onSeatPress &&
                    onSeatPress(upperNormalSeat, upperSeatIndex, {
                      x: fallbackX,
                      y: fallbackY,
                      seatX: 180,
                      seatY: 100,
                      seatWidth: 54,
                      seatHeight: 54,
                    });
                }
              }}
            >
              {upperNormalSeat.user ? (
                /* Occupied Normal Seat */
                <View style={styles.occupiedWrapper}>
                  {Boolean(
                    upperNormalSeat.user._id === currentUserId &&
                      !upperNormalSeat.isMuted
                  ) && (
                    <View
                      style={[
                        styles.mySeatGlow,
                        {
                          width: avatarSize + 8,
                          height: avatarSize + 8,
                          borderRadius: (avatarSize + 8) / 2,
                        },
                      ]}
                    />
                  )}
                  <AvatarWithFrame
                    avatarUri={upperNormalSeat.user.avatar}
                    level={upperNormalSeat.user.wealthLevel || 1}
                    size={avatarSize}
                    activeEmoji={activeSeatEmojis && activeSeatEmojis[upperSeatIndex]}
                    onEmojiComplete={() =>
                      onEmojiComplete && onEmojiComplete(upperSeatIndex)
                    }
                  />
                  <Text style={styles.userName} numberOfLines={1}>
                    {upperNormalSeat.user.name}
                  </Text>
                  <View
                    style={
                      upperNormalSeat.isMuted
                        ? styles.seatMicBadgeMuted
                        : styles.seatMicBadge
                    }
                  >
                    <Image
                      source={require('../../assets/icons/Mike.png')}
                      style={styles.seatMicIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                /* Empty Yellow Seat (Without No.9 text as requested) */
                <View style={styles.emptySeatWrapper}>
                  <View
                    style={[
                      styles.seatGlowOuter,
                      styles.upperYellowGlow,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        upperNormalSeat.isLockedByOwner
                          ? ['rgba(239,68,68,0.55)', 'rgba(185,28,28,0.35)']
                          : ['#FEF08A', '#FACC15', '#EAB308']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.upperNormalCircle}
                    >
                      <View style={styles.upperNormalInner}>
                        {upperNormalSeat.isLockedByOwner ? (
                          <View style={styles.lockedSeatWrap}>
                            <Image
                              source={require('../../assets/icons/SofaSeat.png')}
                              style={[
                                styles.sofaSeatImg,
                                styles.lockedSofaSeat,
                              ]}
                              resizeMode="contain"
                            />
                            <View style={styles.lockBadge}>
                              <Text style={styles.lockedIcon}>🔒</Text>
                            </View>
                          </View>
                        ) : (
                          <Image
                            source={require('../../assets/icons/SofaSeat.png')}
                            style={styles.upperNormalSofaImg}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* 3. Boss Seat (Rendered ONLY when purchased and active!) */}
          {isBossSeatActive && (
            <TouchableOpacity
              style={[
                styles.upperSeatWrapper,
                hasUpperNormalSeat && { width: 68 },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (isBossOccupied) {
                  onHostPress && onHostPress({ ...bossSeat.user, isBossSeat: true });
                } else {
                  onBossSeatPress && onBossSeatPress(bossSeat);
                }
              }}
            >
              <View style={styles.hostGlowRing}>
                <LinearGradient
                  colors={
                    isBossOccupied
                      ? ['#FFE57F', '#FFD700', '#FF8C00', '#FF1493']
                      : ['#FFD700', '#F59E0B', '#B45309']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bossGradientBorder}
                >
                  <View style={styles.bossInnerCircle}>
                    {isBossOccupied ? (
                      <Image
                        source={{
                          uri:
                            bossSeat.user?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                        }}
                        style={styles.hostAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#3B0764', '#701A75', '#BE185D', '#F43F5E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.vacantBossHostBox}
                      >
                        <Image
                          source={require('../../assets/icons/Boss Seat.png')}
                          style={styles.vacantBossSeatImg}
                          resizeMode="contain"
                        />
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>

                {/* Boss Seat Top Badge */}
                <View style={styles.bossSeatTopBadge}>
                  <Text style={styles.bossSeatTopBadgeText}>👑 BOSS</Text>
                </View>
              </View>

              <View style={styles.hostNameContainer}>
                <Text style={styles.hostCrownEmoji}>🛋️</Text>
                <Text style={styles.bossHostName} numberOfLines={1}>
                  {isBossOccupied
                    ? bossSeat.user?.name || 'Boss'
                    : 'Boss Active'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Right: Balanced Spacer for Chest */}
        <View style={styles.chestContainerSpacer} />
      </View>

      {/* ══ SPECIAL THEME STAGE BADGE (When Special Theme is active) ══ */}
      {isSpecial && activeThemeConfig && (
        <View style={styles.specialThemeHeader}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(0, 0, 0, 0.45)']}
            style={[
              styles.specialThemePill,
              { borderColor: activeThemeConfig.glowColor },
            ]}
          >
            <Text style={styles.specialThemeEmoji}>{activeThemeConfig.icon}</Text>
            <Text
              style={[
                styles.specialThemeTitle,
                { color: activeThemeConfig.glowColor },
              ]}
            >
              <T>{activeThemeConfig.name}</T> <T>Special Stage</T>
            </Text>
            <Text style={styles.specialThemeSparkle}>✨</Text>
          </LinearGradient>
        </View>
      )}

      {/* ══ SOFA SEAT GRID (Dynamic 4×N or 5×N) ══ */}
      <View
        style={[
          styles.gridContainer,
          COLUMNS === 5 && { paddingHorizontal: 4, rowGap: 10 },
        ]}
      >
        {gridSeats.map((seat, index) => {
          const isOccupied = seat && seat.user;
          const isMe = isOccupied && seat.user._id === currentUserId;
          const isLocked = seat?.isLockedByOwner;
          const seatNumber = index + 1;

          return (
            <TouchableOpacity
              key={`sofa_seat_${index}`}
              ref={(el) => {
                seatRefs.current[index] = el;
              }}
              style={[styles.seatItem, { width: SEAT_ITEM_WIDTH }]}
              activeOpacity={0.75}
              onPress={(e) => {
                const fallbackX = e?.nativeEvent?.pageX || (GRID_H_PADDING + (index % COLUMNS + 0.5) * SEAT_ITEM_WIDTH);
                const fallbackY = e?.nativeEvent?.pageY || (360 + Math.floor(index / COLUMNS) * 95);

                if (seatRefs.current[index]?.measureInWindow) {
                  seatRefs.current[index].measureInWindow((x, y, w, h) => {
                    if (typeof x === 'number' && !isNaN(x) && w > 0) {
                      onSeatPress &&
                        onSeatPress(seat, index, {
                          x: x + w / 2,
                          y: y + h,
                          seatX: x,
                          seatY: y,
                          seatWidth: w,
                          seatHeight: h,
                        });
                    } else {
                      onSeatPress &&
                        onSeatPress(seat, index, {
                          x: fallbackX,
                          y: fallbackY,
                          seatX: GRID_H_PADDING + (index % COLUMNS) * SEAT_ITEM_WIDTH,
                          seatY: 360 + Math.floor(index / COLUMNS) * 95,
                          seatWidth: SEAT_ITEM_WIDTH,
                          seatHeight: 65,
                        });
                    }
                  });
                } else {
                  onSeatPress &&
                    onSeatPress(seat, index, {
                    x: fallbackX,
                    y: fallbackY,
                    seatX: GRID_H_PADDING + (index % COLUMNS) * SEAT_ITEM_WIDTH,
                    seatY: 360 + Math.floor(index / COLUMNS) * 95,
                    seatWidth: SEAT_ITEM_WIDTH,
                    seatHeight: 65,
                  });
                }
              }}
            >
              {isOccupied ? (
                /* ── Occupied Seat ── */
                <View style={styles.occupiedWrapper}>
                  {Boolean(isMe && !seat.isMuted) && (
                    <View
                      style={[
                        styles.mySeatGlow,
                        {
                          width: avatarSize + 8,
                          height: avatarSize + 8,
                          borderRadius: (avatarSize + 8) / 2,
                        },
                      ]}
                    />
                  )}
                  <AvatarWithFrame
                    avatarUri={seat.user.avatar}
                    level={seat.user.wealthLevel || 1}
                    size={avatarSize}
                    activeEmoji={activeSeatEmojis && activeSeatEmojis[index]}
                    onEmojiComplete={() => onEmojiComplete && onEmojiComplete(index)}
                  />

                  <Text
                    style={[
                      styles.userName,
                      COLUMNS === 5 && { fontSize: 10, maxWidth: 58 },
                    ]}
                    numberOfLines={1}
                  >
                    {seat.user.name}
                  </Text>
                  <Text
                    style={[
                      styles.seatNumberText,
                      COLUMNS === 5 && { fontSize: 10, marginTop: 2 },
                    ]}
                  >
                    No.{seatNumber}
                  </Text>
                  <View style={seat.isMuted ? styles.seatMicBadgeMuted : styles.seatMicBadge}>
                    <Image
                      source={require('../../assets/icons/Mike.png')}
                      style={styles.seatMicIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                /* ── Empty Seat: Vibrant Cyan Glass Circle or Themed Circle ── */
                <View style={styles.emptySeatWrapper}>
                  <View
                    style={[
                      styles.seatGlowOuter,
                      { borderRadius: seatSize / 2 },
                      activeThemeConfig && { shadowColor: activeThemeConfig.glowColor },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isLocked
                          ? ['rgba(239,68,68,0.55)', 'rgba(185,28,28,0.35)']
                          : activeThemeConfig
                          ? activeThemeConfig.gradientColors
                          : ['rgba(56, 189, 248, 0.45)', 'rgba(14, 165, 233, 0.65)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.sofaCircle,
                        {
                          width: seatSize,
                          height: seatSize,
                          borderRadius: seatSize / 2,
                          borderColor: activeThemeConfig
                            ? activeThemeConfig.borderColors[0]
                            : 'rgba(255, 255, 255, 0.45)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.seatInner,
                          {
                            width: seatInner,
                            height: seatInner,
                            borderRadius: seatInner / 2,
                          },
                        ]}
                      >
                        {isLocked ? (
                          <View style={styles.lockedSeatWrap}>
                            {activeThemeConfig ? (
                              <Text
                                style={{
                                  fontSize: COLUMNS === 5 ? 16 : 18,
                                  opacity: 0.45,
                                }}
                              >
                                {activeThemeConfig.icon}
                              </Text>
                            ) : (
                              <Image
                                source={require('../../assets/icons/SofaSeat.png')}
                                style={[
                                  styles.sofaSeatImg,
                                  styles.lockedSofaSeat,
                                  COLUMNS === 5 && { width: 26, height: 26 },
                                ]}
                                resizeMode="contain"
                              />
                            )}
                            <View style={styles.lockBadge}>
                              <Text style={styles.lockedIcon}>🔒</Text>
                            </View>
                          </View>
                        ) : activeThemeConfig ? (
                          <Text style={{ fontSize: COLUMNS === 5 ? 16 : 19 }}>
                            {activeThemeConfig.icon}
                          </Text>
                        ) : (
                          <Image
                            source={require('../../assets/icons/SofaSeat.png')}
                            style={[
                              styles.sofaSeatImg,
                              COLUMNS === 5 && { width: 26, height: 26 },
                            ]}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                  <Text
                    style={[
                      styles.seatNumberText,
                      COLUMNS === 5 && { fontSize: 10, marginTop: 2 },
                    ]}
                  >
                    No.{seatNumber}
                  </Text>
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

  /* ── Special Theme Stage Header ── */
  specialThemeHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  specialThemePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  specialThemeEmoji: {
    fontSize: 13,
  },
  specialThemeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  specialThemeSparkle: {
    fontSize: 11,
  },

  /* ── Regular Layout Header Badge ── */
  regularLayoutHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  regularLayoutPill: {
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  regularLayoutTitle: {
    color: '#E0E7FF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  upperYellowGlow: {
    borderRadius: 27,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  upperNormalCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  upperNormalInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254, 240, 138, 0.25)',
  },
  upperNormalSofaImg: {
    width: 26,
    height: 26,
    tintColor: '#78350F',
  },

  /* ── Upper Section: Chest & Host ── */
  upperSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
    marginTop: 4,
  },
  chestContainer: {
    width: 52,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 6,
  },
  upperSeatsPairContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
  },
  upperSeatWrapper: {
    alignItems: 'center',
    width: 80,
  },
  chestContainerSpacer: {
    width: 52,
  },
  bossGradientBorder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1,
  },
  bossInnerCircle: {
    width: 53,
    height: 53,
    borderRadius: 26.5,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
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

  /* ── Boss Host Seat Overrides ── */
  bossHostGradientBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 1,
  },
  bossHostInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacantBossHostBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    position: 'relative',
  },
  bossCouchAura: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
  },
  vacantBossSeatImg: {
    width: 38,
    height: 38,
    tintColor: '#FFD700',
    shadowColor: '#FFE57F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  bossSparkle: {
    position: 'absolute',
    top: 4,
    right: 5,
    fontSize: 9,
  },
  bossSeatTopBadge: {
    position: 'absolute',
    top: -9,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 5,
  },
  bossSeatTopBadgeText: {
    color: '#78350F',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bossSeatCornerBadge: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    backgroundColor: '#831843',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.2,
    borderColor: '#FFD700',
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 5,
  },
  bossSeatCornerIcon: {
    width: 12,
    height: 12,
    tintColor: '#FFD700',
  },
  bossHostName: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
  },
  bossSeatStatusPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  bossSeatStatusPillText: {
    color: '#FFD700',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
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

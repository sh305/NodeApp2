import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import UserAvatarWithFrame from './UserAvatarWithFrame';

/**
 * FindMeAvatar
 *
 * Displays user avatar with:
 * 1. Smooth 360-degree rotating colorful neon gradient ring border when user is online.
 * 2. Chic "Find Me" pill badge at the bottom of avatar circle.
 * 3. Supports normal avatars or framed avatars (Level frames / Ludo frames).
 * 4. Tap handling to jump directly into the room where the user is active, or view profile.
 */
export default function FindMeAvatar({
  avatarUri,
  size = 50,
  isOnline = false,
  currentRoom = null,
  frame = null,
  level = 1,
  onPress,
  onFindMePress,
  style,
  disabled = false,
}) {
  const { t } = useLanguage();
  const spinValue = useRef(new Animated.Value(0)).current;

  // Only show online indicator and "Find Me" pill badge if user is genuinely inside an active voice room
  const hasActiveRoom = Boolean(
    currentRoom && (currentRoom._id || typeof currentRoom === 'string')
  );
  const showOnline = hasActiveRoom && Boolean(isOnline);

  useEffect(() => {
    if (!showOnline) {
      spinValue.setValue(0);
      return;
    }

    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [showOnline]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Dimensions
  const strokeWidth = size > 65 ? 3.5 : 2.8;
  const ringGap = 3;
  const ringSize = size + (strokeWidth + ringGap) * 2;
  const radius = (ringSize - strokeWidth) / 2;

  const defaultAvatar =
    avatarUri || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  const badgeFontSize = size > 65 ? 10.5 : 9;
  const badgePaddingH = size > 65 ? 7 : 5;
  const badgePaddingV = size > 65 ? 2.2 : 1.5;

  const gradientId = useRef(`findMeGrad_${Math.random().toString(36).substring(2, 9)}`).current;

  const content = (
    <View style={[styles.container, { width: ringSize, height: ringSize + (showOnline ? 6 : 0) }, style]}>
      {/* 1. Rotating Neon Circle Ring (Shown only when user is inside a room and online) */}
      {showOnline && (
        <Animated.View
          style={[
            styles.ringWrapper,
            {
              width: ringSize,
              height: ringSize,
              transform: [{ rotate: spin }],
            },
          ]}
          pointerEvents="none"
        >
          <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <Defs>
              <SvgGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
                <Stop offset="35%" stopColor="#00E676" stopOpacity="1" />
                <Stop offset="70%" stopColor="#76FF03" stopOpacity="1" />
                <Stop offset="100%" stopColor="#00B0FF" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={size > 65 ? '18 6 12 6' : '14 5 8 5'}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      )}

      {/* 2. Avatar / UserAvatarWithFrame */}
      <View
        style={[
          styles.avatarCenterWrap,
          {
            width: size,
            height: size,
            borderRadius: frame ? 0 : size / 2,
            overflow: frame ? 'visible' : 'hidden',
            top: (ringSize - size) / 2,
            left: (ringSize - size) / 2,
            backgroundColor: frame ? 'transparent' : '#1E1E2D',
          },
        ]}
      >
        {frame ? (
          <UserAvatarWithFrame
            avatarUri={defaultAvatar}
            frame={frame}
            level={level}
            size={size}
          />
        ) : (
          <Image
            source={{ uri: defaultAvatar }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        )}
      </View>

      {/* 3. "Find Me" Pill Badge (Shown only when user is inside a room and online) */}
      {showOnline && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onFindMePress || onPress}
          style={[
            styles.findMeBadgeWrap,
            {
              bottom: 0,
            },
          ]}
        >
          <LinearGradient
            colors={['#00E5FF', '#00C853']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.findMeBadge,
              {
                paddingHorizontal: badgePaddingH,
                paddingVertical: badgePaddingV,
              },
            ]}
          >
            <Text style={[styles.findMeText, { fontSize: badgeFontSize }]}>
              {t('Find Me')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (disabled || !onPress) {
    return content;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCenterWrap: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2D',
  },
  findMeBadgeWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 15,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
  findMeBadge: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  findMeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

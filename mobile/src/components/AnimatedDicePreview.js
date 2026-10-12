import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme styling for each unique 3D dice skin
const DICE_THEMES = {
  gc_dice_ice: {
    accent: '#38BDF8',
    bevelColor: 'rgba(125, 211, 252, 0.85)',
    depthColor: '#075985',
    gradient: ['#0284C7', '#0369A1', '#075985'],
    glow: 'rgba(56, 189, 248, 0.45)',
    dotColor: '#E0F2FE',
    numberBg: 'rgba(7, 89, 133, 0.85)',
    numberColor: '#FFFFFF',
    name: 'Ice',
  },
  gc_dice_faith: {
    accent: '#F59E0B',
    bevelColor: 'rgba(253, 230, 138, 0.9)',
    depthColor: '#78350F',
    gradient: ['#F59E0B', '#D97706', '#92400E'],
    glow: 'rgba(245, 158, 11, 0.55)',
    dotColor: '#FFFBEB',
    numberBg: 'rgba(120, 53, 15, 0.85)',
    numberColor: '#FFFBEB',
    name: 'Faith',
  },
  gc_dice_starry_sky: {
    accent: '#C084FC',
    bevelColor: 'rgba(233, 213, 255, 0.85)',
    depthColor: '#3B0764',
    gradient: ['#9333EA', '#7E22CE', '#4C1D95'],
    glow: 'rgba(192, 132, 252, 0.55)',
    dotColor: '#FAF5FF',
    numberBg: 'rgba(59, 7, 100, 0.85)',
    numberColor: '#FFFFFF',
    name: 'Starry Sky',
  },
  gc_dice_warrior: {
    accent: '#F97316',
    bevelColor: 'rgba(254, 215, 170, 0.85)',
    depthColor: '#431407',
    gradient: ['#C2410C', '#9A3412', '#7C2D12'],
    glow: 'rgba(249, 115, 22, 0.5)',
    dotColor: '#FFEDD5',
    numberBg: 'rgba(67, 20, 7, 0.85)',
    numberColor: '#FFFFFF',
    name: 'Warrior',
  },
  gc_dice_electronic: {
    accent: '#00E676',
    bevelColor: '#00E676',
    depthColor: '#052E16',
    gradient: ['#27272A', '#18181B', '#09090B'],
    glow: 'rgba(0, 230, 118, 0.55)',
    dotColor: '#00E676',
    numberBg: 'rgba(0, 0, 0, 0.88)',
    numberColor: '#00E676',
    name: 'Electronic',
  },
  gc_dice_dragon_ball: {
    accent: '#FF4500',
    bevelColor: 'rgba(251, 191, 36, 0.9)',
    depthColor: '#7F1D1D',
    gradient: ['#EA580C', '#DC2626', '#991B1B'],
    glow: 'rgba(255, 69, 0, 0.6)',
    dotColor: '#FEF08A',
    numberBg: 'rgba(127, 29, 29, 0.85)',
    numberColor: '#FEF08A',
    name: 'Dragon Ball',
  },
};

const DEFAULT_THEME = {
  accent: '#00E676',
  bevelColor: 'rgba(0, 230, 118, 0.85)',
  depthColor: '#064E3B',
  gradient: ['#059669', '#00E676', '#047857'],
  glow: 'rgba(0, 230, 118, 0.45)',
  dotColor: '#FFFFFF',
  numberBg: 'rgba(4, 120, 87, 0.85)',
  numberColor: '#FFFFFF',
  name: 'Dice',
};

// Clean Dice Face displaying ONLY the rolled number and its matching authentic pips
function DiceFaceRenderer({ value, size = 145, theme }) {
  const dotSize = Math.max(12, Math.round(size * 0.125));
  const numBadgeSize = Math.round(size * 0.32);
  const padding = Math.round(size * 0.12);

  const dotStyle = [
    styles.dot,
    {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      backgroundColor: theme.dotColor,
      shadowColor: theme.accent,
    },
  ];

  return (
    <View style={[styles.faceContentWrap, { padding }]}>
      {/* 4 Corner Pips for authentic dice structure */}
      <View style={styles.pipRowBetween}>
        {value >= 2 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}
        {value >= 4 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}
      </View>

      {/* Middle row: Extra pips for 6, plus the bold central number badge */}
      <View style={styles.pipRowCenter}>
        {value === 6 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}

        {/* The prominent single rolled number directly on the dice */}
        <View
          style={[
            styles.centerNumberBadge,
            {
              width: numBadgeSize,
              height: numBadgeSize,
              borderRadius: numBadgeSize / 2,
              backgroundColor: theme.numberBg,
              borderColor: theme.accent,
            },
          ]}
        >
          <Text style={[styles.centerNumberText, { color: theme.numberColor, fontSize: Math.round(numBadgeSize * 0.58) }]}>
            {value}
          </Text>
        </View>

        {value === 6 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}
      </View>

      {/* Bottom corner pips */}
      <View style={styles.pipRowBetween}>
        {value >= 4 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}
        {value >= 2 ? <View style={dotStyle} /> : <View style={{ width: dotSize, height: dotSize }} />}
      </View>
    </View>
  );
}

export default function AnimatedDicePreview({
  dice,
  size = 145,
  autoRoll = true,
  onRollComplete,
}) {
  const theme = (dice && DICE_THEMES[dice.id]) || DEFAULT_THEME;

  const [diceValue, setDiceValue] = useState(6);
  const [isRolling, setIsRolling] = useState(false);

  // Animated physics values
  const rollAnim = useRef(new Animated.Value(0)).current;
  const hopAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const auraPulseAnim = useRef(new Animated.Value(0.4)).current;

  const rollIntervalRef = useRef(null);

  // Subtle ambient aura breathing
  useEffect(() => {
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulseAnim, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraPulseAnim, {
          toValue: 0.4,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    auraLoop.start();
    return () => auraLoop.stop();
  }, []);

  // Auto roll on preview open
  useEffect(() => {
    if (autoRoll) {
      triggerRoll();
    }
    return () => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  const triggerRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    try {
      Vibration.vibrate(35);
    } catch (_) {}

    // Rapid random number scrambling on the dice face during rotation
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    rollIntervalRef.current = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
    }, 55);

    // Reset animated values
    rollAnim.setValue(0);
    hopAnim.setValue(0);
    scaleAnim.setValue(1);
    wobbleAnim.setValue(0);

    // Roll animation sequence:
    // 1080-degree rotation + hop up & spring landing bounce
    Animated.parallel([
      // 3 full 360-degree spins (1080 deg)
      Animated.timing(rollAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Hop up and land
      Animated.sequence([
        Animated.timing(hopAnim, {
          toValue: -36,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hopAnim, {
          toValue: 0,
          duration: 470,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]),

      // Squash and stretch spring
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),

      // Tumble wobble
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Clear scrambling interval
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }

      // Pick final random number between 1 and 6
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(finalValue);
      setIsRolling(false);

      try {
        Vibration.vibrate(20);
      } catch (_) {}

      if (onRollComplete) {
        onRollComplete(finalValue);
      }
    });
  };

  // 1080-degree spin rotation
  const spinInterpolation = rollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  // Tilt wobble
  const wobbleInterpolation = wobbleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  // Dynamic floor shadow
  const shadowScale = hopAnim.interpolate({
    inputRange: [-36, 0],
    outputRange: [0.65, 1],
    extrapolate: 'clamp',
  });

  const shadowOpacity = hopAnim.interpolate({
    inputRange: [-36, 0],
    outputRange: [0.25, 0.65],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Interactive Dice: user can tap the dice directly to re-roll anytime */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={triggerRoll}
        style={[styles.diceStage, { width: size + 36, height: size + 36 }]}
      >
        {/* Ambient Glow Aura */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowAura,
            {
              backgroundColor: theme.glow,
              opacity: auraPulseAnim,
              width: size + 28,
              height: size + 28,
              borderRadius: (size + 28) / 2,
            },
          ]}
        />

        {/* Dynamic Floor Shadow */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.floorShadow,
            {
              width: size * 0.76,
              height: 18,
              borderRadius: 9,
              transform: [{ scale: shadowScale }],
              opacity: shadowOpacity,
            },
          ]}
        />

        {/* 3D Animated Rolling Dice Cube */}
        <Animated.View
          style={[
            styles.diceCubeWrap,
            {
              width: size,
              height: size,
              transform: [
                { translateY: hopAnim },
                { scale: scaleAnim },
                { rotate: spinInterpolation },
                { rotateZ: wobbleInterpolation },
              ],
            },
          ]}
        >
          {/* 3D Extruded Depth Underlayer */}
          <View
            style={[
              styles.depthUnderlayer,
              {
                width: size,
                height: size,
                borderRadius: Math.round(size * 0.2),
                backgroundColor: theme.depthColor,
              },
            ]}
          />

          {/* Main 3D Die Face with skin materials and gradients */}
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.diceFaceBody,
              {
                width: size,
                height: size,
                borderRadius: Math.round(size * 0.2),
                borderColor: theme.bevelColor,
              },
            ]}
          >
            {/* Specular 3D Gloss Sheen */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.38)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.85, y: 0.85 }}
              style={[
                styles.specularShine,
                { borderRadius: Math.round(size * 0.2) },
              ]}
            />

            {/* Rolled Outcome: ONLY the current rolled number on the dice */}
            <DiceFaceRenderer value={diceValue} size={size} theme={theme} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  diceStage: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    alignSelf: 'center',
  },
  floorShadow: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  diceCubeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  depthUnderlayer: {
    position: 'absolute',
    top: 6,
    left: 4,
    opacity: 0.95,
  },
  diceFaceBody: {
    borderWidth: 2.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  faceContentWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pipRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  pipRowCenter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  dot: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 3,
  },
  centerNumberBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  centerNumberText: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

// Custom 4-point sparkle flare SVG
const StarSparkleSvg = ({ size = 16, color = '#FFFFFF', glowColor = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <RadialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={glowColor} stopOpacity="0.8" />
        <Stop offset="60%" stopColor={glowColor} stopOpacity="0.3" />
        <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#sparkGlow)" />
    <Path
      d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
      fill={color}
    />
  </Svg>
);

export default function AnimatedLudoFrame({
  skin,
  frameSize = 118,
  style,
}) {
  // 1. Orbiting light sweep animation (continuous circular rotation)
  const orbitAnim = useRef(new Animated.Value(0)).current;

  // 2. Crown headpiece jewel flare pulse
  const crownGlintAnim = useRef(new Animated.Value(0)).current;

  // 3. Staggered dice sparkle glints
  const diceGlint1 = useRef(new Animated.Value(0)).current;
  const diceGlint2 = useRef(new Animated.Value(0)).current;
  const diceGlint3 = useRef(new Animated.Value(0)).current;

  // 4. Subtle ambient rim aura breathing
  const auraPulseAnim = useRef(new Animated.Value(0.35)).current;

  // 5. Perimeter rim star twinkles
  const rimStarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Orbiting light beam: 4.2s smooth continuous loop
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    orbitLoop.start();

    // 2. Crown jewel glint: periodic flash every 2.4s
    const crownLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(crownGlintAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(crownGlintAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );
    crownLoop.start();

    // 3. Staggered dice glints
    const createDiceLoop = (anim, delayMs) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(1200 - delayMs > 0 ? 1200 - delayMs : 600),
        ])
      );
    };

    const d1 = createDiceLoop(diceGlint1, 0);
    const d2 = createDiceLoop(diceGlint2, 500);
    const d3 = createDiceLoop(diceGlint3, 900);
    d1.start();
    d2.start();
    d3.start();

    // 4. Rim aura breathing pulse
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulseAnim, {
          toValue: 0.85,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(auraPulseAnim, {
          toValue: 0.35,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    auraLoop.start();

    // 5. Rim side stars twinkling
    const rimLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(rimStarAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rimStarAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ])
    );
    rimLoop.start();

    return () => {
      orbitLoop.stop();
      crownLoop.stop();
      d1.stop();
      d2.stop();
      d3.stop();
      auraLoop.stop();
      rimLoop.stop();
    };
  }, []);

  // Theme-specific glow colors based on frame id
  const frameId = skin?.id || '';
  let themeAuraColor = 'rgba(255, 215, 0, 0.45)'; // default gold
  let themeSparkleColor = '#FFD700';
  let beamDotColor = '#FFF59D';

  if (frameId.includes('neon')) {
    themeAuraColor = 'rgba(0, 240, 255, 0.55)';
    themeSparkleColor = '#00F0FF';
    beamDotColor = '#E040FB';
  } else if (frameId.includes('emperor')) {
    themeAuraColor = 'rgba(255, 23, 68, 0.45)';
    themeSparkleColor = '#FFD700';
    beamDotColor = '#FF8A80';
  } else if (frameId.includes('star')) {
    themeAuraColor = 'rgba(255, 179, 0, 0.5)';
    themeSparkleColor = '#FFC107';
    beamDotColor = '#FFF9C4';
  } else if (frameId.includes('fantasy')) {
    themeAuraColor = 'rgba(224, 139, 255, 0.5)';
    themeSparkleColor = '#E1BEE7';
    beamDotColor = '#B2EBF2';
  }

  // Orbit rotation
  const orbitRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Crown flare transform
  const crownScale = crownGlintAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.3],
  });
  const crownRotate = crownGlintAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Dice glints transforms
  const diceScale1 = diceGlint1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1.15],
  });
  const diceScale2 = diceGlint2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1.2],
  });
  const diceScale3 = diceGlint3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1.15],
  });

  // Rim star transform
  const rimStarScale = rimStarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.1],
  });
  const rimStarRotate = rimStarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '60deg'],
  });

  const centerPos = frameSize / 2;
  const rimRadius = frameSize * 0.42;

  return (
    <View
      style={[
        styles.container,
        {
          width: frameSize,
          height: frameSize,
        },
        style,
      ]}
      pointerEvents="none"
    >
      {/* 1. Subtle Ambient Breathing Rim Aura (Backdrop glow) */}
      <Animated.View
        style={[
          styles.ambientAuraRing,
          {
            width: frameSize * 0.88,
            height: frameSize * 0.88,
            borderRadius: (frameSize * 0.88) / 2,
            borderColor: themeAuraColor,
            opacity: auraPulseAnim,
          },
        ]}
      />

      {/* 2. Rotating Light Beam / Energy Comet along the circular rim */}
      <Animated.View
        style={[
          styles.orbitTrack,
          {
            width: frameSize,
            height: frameSize,
            transform: [{ rotate: orbitRotate }],
          },
        ]}
      >
        {/* Shimmering comet head */}
        <View
          style={[
            styles.orbitComet,
            {
              backgroundColor: beamDotColor,
              shadowColor: beamDotColor,
              top: centerPos - rimRadius - 4,
              left: centerPos - 4,
            },
          ]}
        />
        {/* Trailing soft tail */}
        <View
          style={[
            styles.orbitCometTail,
            {
              backgroundColor: themeSparkleColor,
              top: centerPos - rimRadius - 2,
              left: centerPos + 4,
            },
          ]}
        />
      </Animated.View>

      {/* 3. The Stationary 3D Ludo Frame Image (Stationary, Clean, Unshaken) */}
      <Image
        source={
          typeof skin?.image === 'string'
            ? { uri: skin.image }
            : skin?.image
        }
        style={{
          width: frameSize,
          height: frameSize,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        resizeMode="contain"
      />

      {/* 4. Top Crown / Headpiece Jewel Starburst Flare */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            top: frameSize * 0.04,
            left: centerPos - 9,
            opacity: crownGlintAnim,
            transform: [{ scale: crownScale }, { rotate: crownRotate }],
          },
        ]}
      >
        <StarSparkleSvg size={18} color="#FFFFFF" glowColor={themeSparkleColor} />
      </Animated.View>

      {/* 5. Left Rim Gem Twinkle */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            top: centerPos - 8,
            left: centerPos - rimRadius - 7,
            opacity: rimStarAnim,
            transform: [{ scale: rimStarScale }, { rotate: rimStarRotate }],
          },
        ]}
      >
        <StarSparkleSvg size={14} color="#FFFFFF" glowColor={themeSparkleColor} />
      </Animated.View>

      {/* 6. Right Rim Gem Twinkle */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            top: centerPos - 8,
            left: centerPos + rimRadius - 7,
            opacity: rimStarAnim,
            transform: [{ scale: rimStarScale }, { rotate: rimStarRotate }],
          },
        ]}
      >
        <StarSparkleSvg size={14} color="#FFFFFF" glowColor={themeSparkleColor} />
      </Animated.View>

      {/* 7. Bottom Dice Sparkle 1 (Left Dice) */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            bottom: frameSize * 0.08,
            left: centerPos - frameSize * 0.22,
            opacity: diceGlint1,
            transform: [{ scale: diceScale1 }],
          },
        ]}
      >
        <StarSparkleSvg size={15} color="#FFFFFF" glowColor={themeSparkleColor} />
      </Animated.View>

      {/* 8. Bottom Dice Sparkle 2 (Center Dice) */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            bottom: frameSize * 0.05,
            left: centerPos - 7,
            opacity: diceGlint2,
            transform: [{ scale: diceScale2 }],
          },
        ]}
      >
        <StarSparkleSvg size={17} color="#FFFFFF" glowColor="#FFF59D" />
      </Animated.View>

      {/* 9. Bottom Dice Sparkle 3 (Right Dice) */}
      <Animated.View
        style={[
          styles.sparkleWrap,
          {
            bottom: frameSize * 0.08,
            left: centerPos + frameSize * 0.13,
            opacity: diceGlint3,
            transform: [{ scale: diceScale3 }],
          },
        ]}
      >
        <StarSparkleSvg size={15} color="#FFFFFF" glowColor={themeSparkleColor} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ambientAuraRing: {
    position: 'absolute',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  orbitTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitComet: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  orbitCometTail: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.75,
  },
  sparkleWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

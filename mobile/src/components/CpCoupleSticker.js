import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * ═══════════════════════════════════════════════════════════════
 *  CP COUPLE STICKER (Boy 👦 & Girl 👧 Animated Romantic Scenes)
 *  8 Distinctive Romantic Animated Scenes for Voice Room CP Tab
 * ═══════════════════════════════════════════════════════════════
 */
export default function CpCoupleSticker({
  id = 'cp_kiss',
  size = 52,
}) {
  const charSize = Math.round(size * 0.46);
  const centerItemSize = Math.round(size * 0.40);

  // ── Core Animation References ──
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let loop = null;

    switch (id) {
      case 'cp_kiss': {
        // Boy & Girl slide close, kiss pops, hearts float up
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 1.35, friction: 4, tension: 80, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: -10, duration: 600, useNativeDriver: true }),
              Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.delay(350),
            Animated.parallel([
              Animated.timing(anim1, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 0.85, friction: 5, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: 0, duration: 500, useNativeDriver: true }),
              Animated.timing(opacityAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            ]),
            Animated.delay(200),
          ])
        );
        break;
      }

      case 'cp_hug': {
        // Loving embrace: Boy & Girl hold together and gently sway
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 1.22, friction: 5, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(anim1, { toValue: -1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 0.95, friction: 5, useNativeDriver: true }),
            ]),
          ])
        );
        break;
      }

      case 'cp_propose': {
        // Ring sparkle gleaming + Girl jumping with joy
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.spring(pulseAnim, { toValue: 1.4, friction: 3, tension: 90, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: -7, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
              Animated.timing(anim1, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(pulseAnim, { toValue: 1.0, friction: 4, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: 0, duration: 400, useNativeDriver: true }),
              Animated.timing(anim1, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
            Animated.delay(300),
          ])
        );
        break;
      }

      case 'cp_dance': {
        // Ballroom waltz swing: rotating back and forth with music notes
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(anim2, { toValue: -1, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(floatY, { toValue: -6, duration: 550, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(anim1, { toValue: -1, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(anim2, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(floatY, { toValue: 2, duration: 550, useNativeDriver: true }),
            ]),
          ])
        );
        break;
      }

      case 'cp_holding_hands': {
        // Walking together rhythm: alternating cute step bobs
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: -4, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(anim2, { toValue: 3, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(floatY, { toValue: -5, duration: 280, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(anim1, { toValue: 3, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(anim2, { toValue: -4, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(floatY, { toValue: 0, duration: 280, useNativeDriver: true }),
            ]),
          ])
        );
        break;
      }

      case 'cp_heart_lock': {
        // Key enters Lock -> golden heart burst
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(anim2, { toValue: -1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.spring(pulseAnim, { toValue: 1.45, friction: 3, tension: 100, useNativeDriver: true }),
              Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),
            Animated.delay(400),
            Animated.parallel([
              Animated.timing(anim1, { toValue: 0, duration: 400, useNativeDriver: true }),
              Animated.timing(anim2, { toValue: 0, duration: 400, useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
              Animated.timing(opacityAnim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
            ]),
            Animated.delay(200),
          ])
        );
        break;
      }

      case 'cp_wedding': {
        // Bride & Groom bowing gently + Confetti celebration pop
        loop = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(anim1, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 1.25, friction: 4, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: -6, duration: 650, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(anim1, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.spring(pulseAnim, { toValue: 0.95, friction: 5, useNativeDriver: true }),
              Animated.timing(floatY, { toValue: 0, duration: 650, useNativeDriver: true }),
            ]),
          ])
        );
        break;
      }

      case 'cp_shy_love':
      default: {
        // Realistic "Lub-Dub" Heartbeat pulse + shy head turns
        loop = Animated.loop(
          Animated.sequence([
            Animated.spring(pulseAnim, { toValue: 1.35, friction: 4, tension: 120, useNativeDriver: true }),
            Animated.spring(pulseAnim, { toValue: 1.1, friction: 4, useNativeDriver: true }),
            Animated.spring(pulseAnim, { toValue: 1.45, friction: 4, tension: 130, useNativeDriver: true }),
            Animated.spring(pulseAnim, { toValue: 1.0, friction: 5, useNativeDriver: true }),
            Animated.timing(anim1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.delay(500),
            Animated.timing(anim1, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.delay(200),
          ])
        );
        break;
      }
    }

    if (loop) loop.start();
    return () => loop?.stop();
  }, [id]);

  // ══════════════════════════════════════════════════════════
  // RENDER DEDICATED SCENES
  // ══════════════════════════════════════════════════════════

  switch (id) {
    case 'cp_kiss': {
      const boyMove = anim1.interpolate({ inputRange: [0, 1], outputRange: [-4, 3] });
      const boyRotate = anim1.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '12deg'] });
      const girlMove = anim1.interpolate({ inputRange: [0, 1], outputRange: [4, -3] });
      const girlRotate = anim1.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '-12deg'] });

      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Boy */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                transform: [{ translateX: boyMove }, { rotate: boyRotate }],
                left: size * 0.08,
              },
            ]}
          >
            👦
          </Animated.Text>

          {/* Center Kiss Mark */}
          <Animated.View
            style={[
              styles.centerKissWrap,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatY }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.9 }}>💋</Text>
          </Animated.View>

          {/* Girl */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                transform: [{ translateX: girlMove }, { rotate: girlRotate }],
                right: size * 0.08,
              },
            ]}
          >
            👧
          </Animated.Text>

          {/* Floating Top Hearts */}
          <Animated.Text
            style={[
              styles.topHearts,
              {
                fontSize: size * 0.22,
                transform: [{ translateY: floatY }],
                opacity: opacityAnim,
              },
            ]}
          >
            💖
          </Animated.Text>
        </View>
      );
    }

    case 'cp_hug': {
      const swayRotate = anim1.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          <Animated.View
            style={[
              styles.couplePairWrap,
              {
                transform: [{ rotate: swayRotate }],
              },
            ]}
          >
            <Text style={{ fontSize: charSize * 1.05 }}>👦</Text>
            <Text style={{ fontSize: charSize * 1.05, marginLeft: -charSize * 0.35 }}>👧</Text>
          </Animated.View>

          {/* Floating Warm Heart */}
          <Animated.View
            style={[
              styles.centerBadgeWrap,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.85 }}>💖</Text>
          </Animated.View>

          <Text style={[styles.sparkleSide, { fontSize: size * 0.22, left: 4 }]}>✨</Text>
          <Text style={[styles.sparkleSide, { fontSize: size * 0.22, right: 4 }]}>✨</Text>
        </View>
      );
    }

    case 'cp_propose': {
      const girlHop = floatY;
      const ringScale = pulseAnim;
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Boy Kneeling / Holding */}
          <Text style={[styles.character, { fontSize: charSize, left: size * 0.06, bottom: size * 0.12 }]}>
            👦
          </Text>

          {/* Sparkling Diamond Ring in Center */}
          <Animated.View
            style={[
              styles.centerProposeWrap,
              {
                transform: [{ scale: ringScale }],
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.95 }}>💍</Text>
            <Text style={[styles.ringSparkle, { fontSize: size * 0.2 }]}>✨</Text>
          </Animated.View>

          {/* Girl Blushing with Joy */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                right: size * 0.06,
                transform: [{ translateY: girlHop }],
              },
            ]}
          >
            🥰
          </Animated.Text>
        </View>
      );
    }

    case 'cp_dance': {
      const boyTilt = anim1.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
      const girlTilt = anim2.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Boy Dancing */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize * 1.05,
                left: size * 0.08,
                transform: [{ rotate: boyTilt }, { translateY: floatY }],
              },
            ]}
          >
            🕺
          </Animated.Text>

          {/* Girl Dancing */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize * 1.05,
                right: size * 0.08,
                transform: [{ rotate: girlTilt }],
              },
            ]}
          >
            💃
          </Animated.Text>

          {/* Musical Notes Floating */}
          <Animated.View style={[styles.topMusicNotes, { transform: [{ translateY: floatY }] }]}>
            <Text style={{ fontSize: size * 0.24 }}>🎶</Text>
          </Animated.View>
        </View>
      );
    }

    case 'cp_holding_hands': {
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Boy Walking */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                left: size * 0.08,
                transform: [{ translateY: anim1 }],
              },
            ]}
          >
            👦
          </Animated.Text>

          {/* Handshake / Joined Hands */}
          <View style={styles.centerHandsWrap}>
            <Text style={{ fontSize: centerItemSize * 0.75 }}>🤝</Text>
          </View>

          {/* Girl Walking */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                right: size * 0.08,
                transform: [{ translateY: anim2 }],
              },
            ]}
          >
            👧
          </Animated.Text>

          {/* Floating Love Trails */}
          <Animated.View style={[styles.topFloatingLove, { transform: [{ translateY: floatY }] }]}>
            <Text style={{ fontSize: size * 0.22 }}>💕</Text>
          </Animated.View>
        </View>
      );
    }

    case 'cp_heart_lock': {
      const keyMove = anim1.interpolate({ inputRange: [0, 1], outputRange: [-4, 2] });
      const lockMove = anim2.interpolate({ inputRange: [0, 1], outputRange: [4, -2] });
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Boy with Key */}
          <Animated.View
            style={[
              styles.boyWithItemWrap,
              { left: size * 0.04, transform: [{ translateX: keyMove }] },
            ]}
          >
            <Text style={{ fontSize: charSize * 0.9 }}>👦</Text>
            <Text style={{ fontSize: size * 0.22, marginTop: -4 }}>🗝️</Text>
          </Animated.View>

          {/* Center Heart Burst */}
          <Animated.View
            style={[
              styles.centerBurstWrap,
              {
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.9 }}>💞</Text>
          </Animated.View>

          {/* Girl with Lock */}
          <Animated.View
            style={[
              styles.girlWithItemWrap,
              { right: size * 0.04, transform: [{ translateX: lockMove }] },
            ]}
          >
            <Text style={{ fontSize: charSize * 0.9 }}>👧</Text>
            <Text style={{ fontSize: size * 0.22, marginTop: -4 }}>🔐</Text>
          </Animated.View>
        </View>
      );
    }

    case 'cp_wedding': {
      const bowTilt = anim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] });
      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Groom Boy */}
          <Animated.View
            style={[
              styles.groomWrap,
              { left: size * 0.05, transform: [{ rotate: bowTilt }] },
            ]}
          >
            <Text style={{ fontSize: charSize }}>🤵</Text>
          </Animated.View>

          {/* Wedding Bouquet & Rings */}
          <Animated.View
            style={[
              styles.weddingCenterWrap,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatY }],
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.85 }}>💐</Text>
          </Animated.View>

          {/* Bride Girl */}
          <Animated.View
            style={[
              styles.brideWrap,
              { right: size * 0.05, transform: [{ rotate: bowTilt }] },
            ]}
          >
            <Text style={{ fontSize: charSize }}>👰</Text>
          </Animated.View>

          {/* Confetti Top */}
          <Text style={[styles.topSparkle, { fontSize: size * 0.2 }]}>🎉</Text>
        </View>
      );
    }

    case 'cp_shy_love':
    default: {
      const boyLook = anim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '10deg'] });
      const girlLook = anim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-10deg'] });

      return (
        <View style={[styles.root, { width: size, height: size }]}>
          {/* Shy Boy */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                left: size * 0.07,
                transform: [{ rotate: boyLook }],
              },
            ]}
          >
            👦
          </Animated.Text>

          {/* Beating Heartbeat Center */}
          <Animated.View
            style={[
              styles.centerHeartbeatWrap,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={{ fontSize: centerItemSize * 0.95 }}>💓</Text>
          </Animated.View>

          {/* Shy Girl */}
          <Animated.Text
            style={[
              styles.character,
              {
                fontSize: charSize,
                right: size * 0.07,
                transform: [{ rotate: girlLook }],
              },
            ]}
          >
            👧
          </Animated.Text>

          {/* Blush Dots */}
          <Text style={[styles.blushLeft, { fontSize: size * 0.18 }]}>🌸</Text>
          <Text style={[styles.blushRight, { fontSize: size * 0.18 }]}>🌸</Text>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  character: {
    position: 'absolute',
    textAlign: 'center',
  },
  couplePairWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerKissWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerBadgeWrap: {
    position: 'absolute',
    top: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerProposeWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    bottom: 4,
  },
  ringSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  centerHandsWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 2,
    zIndex: 5,
  },
  topHearts: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
    zIndex: 12,
  },
  topMusicNotes: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
    zIndex: 12,
  },
  topFloatingLove: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
    zIndex: 12,
  },
  topSparkle: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
    zIndex: 12,
  },
  sparkleSide: {
    position: 'absolute',
    top: 4,
  },
  boyWithItemWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  girlWithItemWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerBurstWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  groomWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  brideWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  weddingCenterWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 2,
    zIndex: 8,
  },
  centerHeartbeatWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  blushLeft: {
    position: 'absolute',
    bottom: 2,
    left: 4,
  },
  blushRight: {
    position: 'absolute',
    bottom: 2,
    right: 4,
  },
});

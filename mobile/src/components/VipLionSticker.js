import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function VipLionSticker({
  id = 'lion_cool',
  size = 48,
}) {
  const baseFontSize = Math.round(size * 0.72);

  switch (id) {
    case 'lion_cry':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          {/* Blue crying tears */}
          <Text style={[styles.tearLeft, { fontSize: size * 0.28 }]}>💧</Text>
          <Text style={[styles.tearRight, { fontSize: size * 0.28 }]}>💧</Text>
          <Text style={[styles.sweatTop, { fontSize: size * 0.24 }]}>💦</Text>
        </View>
      );

    case 'lion_cool':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          {/* Dark sunglasses overlay */}
          <Text style={[styles.sunglassesOverlay, { fontSize: size * 0.38 }]}>🕶️</Text>
          <Text style={[styles.sparkleTop, { fontSize: size * 0.22 }]}>✨</Text>
        </View>
      );

    case 'lion_heart':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          {/* Glowing Pink Heart held in paws */}
          <Text style={[styles.heartOverlay, { fontSize: size * 0.44 }]}>💖</Text>
        </View>
      );

    case 'lion_dj':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          {/* DJ Headphones and music notes */}
          <Text style={[styles.headphonesOverlay, { fontSize: size * 0.42 }]}>🎧</Text>
          <Text style={[styles.musicNoteOverlay, { fontSize: size * 0.24 }]}>🎵</Text>
        </View>
      );

    case 'lion_gift':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize * 0.92 }]}>🦁</Text>
          <Text style={[styles.miniSunglasses, { fontSize: size * 0.28 }]}>🕶️</Text>
          {/* "Gift Me" Red/Gold Banner */}
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.giftBannerPill}
          >
            <Text style={styles.giftBannerText}>🎁 Gift Me</Text>
          </LinearGradient>
        </View>
      );

    case 'lion_bye':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize * 0.92 }]}>🦁</Text>
          <Text style={[styles.wavingHandOverlay, { fontSize: size * 0.3 }]}>👋</Text>
          {/* "BYE" Gold/Amber Banner */}
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.byeBannerPill}
          >
            <Text style={styles.byeBannerText}>BYE</Text>
          </LinearGradient>
        </View>
      );

    case 'lion_rich':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          <Text style={[styles.sunglassesOverlay, { fontSize: size * 0.36 }]}>🕶️</Text>
          {/* Dollar cash bills */}
          <Text style={[styles.moneyBillOverlay, { fontSize: size * 0.34 }]}>💸</Text>
          <Text style={[styles.goldCoinOverlay, { fontSize: size * 0.24 }]}>💰</Text>
        </View>
      );

    case 'lion_roar':
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          {/* Blazing flame aura behind */}
          <Text style={[styles.flameBackdrop, { fontSize: size * 0.52 }]}>🔥</Text>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
          <Text style={[styles.roarMuscleOverlay, { fontSize: size * 0.26 }]}>⚡</Text>
        </View>
      );

    default:
      return (
        <View style={[styles.stickerContainer, { width: size, height: size }]}>
          <Text style={[styles.lionBase, { fontSize: baseFontSize }]}>🦁</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  stickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lionBase: {
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  /* 😭 Cry Lion */
  tearLeft: {
    position: 'absolute',
    bottom: 6,
    left: 4,
  },
  tearRight: {
    position: 'absolute',
    bottom: 6,
    right: 4,
  },
  sweatTop: {
    position: 'absolute',
    top: 0,
    right: 2,
  },

  /* 😎 Cool Lion */
  sunglassesOverlay: {
    position: 'absolute',
    top: 10,
  },
  sparkleTop: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  /* 💖 Heart Lion */
  heartOverlay: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
  },

  /* 🎧 DJ Lion */
  headphonesOverlay: {
    position: 'absolute',
    top: -2,
    alignSelf: 'center',
  },
  musicNoteOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
  },

  /* 🎁 Gift Me Lion */
  miniSunglasses: {
    position: 'absolute',
    top: 8,
  },
  giftBannerPill: {
    position: 'absolute',
    bottom: -3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBannerText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* 👋 Bye Lion */
  wavingHandOverlay: {
    position: 'absolute',
    top: 0,
    right: -2,
  },
  byeBannerPill: {
    position: 'absolute',
    bottom: -2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  byeBannerText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },

  /* 💸 Rich Lion */
  moneyBillOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -2,
  },
  goldCoinOverlay: {
    position: 'absolute',
    bottom: 0,
    left: -2,
  },

  /* 🔥 Roar Lion */
  flameBackdrop: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    opacity: 0.85,
  },
  roarMuscleOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
});

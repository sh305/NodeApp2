import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function AvatarWithFrame({
  avatarUri,
  level = 1,
  size = 54,
  frameName = '',
  showLevelBadge = true,
}) {
  // Determine frame border gradient color based on user wealth level
  const getFrameBorderColor = (lvl) => {
    if (lvl >= 50) return '#FFD700'; // Supreme Gold
    if (lvl >= 30) return '#E056FD'; // Royal Emerald/Purple
    if (lvl >= 15) return '#00D2D3'; // Sapphire Cyan
    if (lvl >= 6) return '#FF6B6B';  // Ruby Red
    return '#A4B0BE'; // Silver Novice
  };

  const borderColor = getFrameBorderColor(level);

  return (
    <View style={[styles.container, { width: size + 12, height: size + 12 }]}>
      {/* Frame Ring / Glow */}
      <View
        style={[
          styles.frameRing,
          {
            width: size + 6,
            height: size + 6,
            borderRadius: (size + 6) / 2,
            borderColor: borderColor,
            borderWidth: level >= 12 ? 3 : 2,
            shadowColor: borderColor,
          },
        ]}
      >
        <Image
          source={{
            uri:
              avatarUri ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      </View>

      {/* Level Badge Pill */}
      {showLevelBadge && (
        <View style={[styles.levelBadge, { backgroundColor: borderColor }]}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: '#1E1E2E',
  },
  avatarImage: {
    backgroundColor: '#2C2C3E',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
});

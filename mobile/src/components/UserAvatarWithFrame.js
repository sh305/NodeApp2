import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { getLudoFrameSkin } from '../constants/ludoFrameAssets';

export default function UserAvatarWithFrame({
  avatarUri,
  avatarSource,
  frame,
  size = 76,
  style,
  avatarStyle,
  frameScale = 1.72,
}) {
  // Resolve avatar source
  const resolvedAvatar = avatarSource
    ? avatarSource
    : avatarUri
    ? { uri: avatarUri }
    : { uri: 'https://api.dicebear.com/7.x/bottts/png?seed=User' };

  // Resolve frame skin
  let resolvedFrameImg = null;
  if (frame) {
    const skin = getLudoFrameSkin(frame);
    if (skin?.image) {
      resolvedFrameImg = typeof skin.image === 'string' ? { uri: skin.image } : skin.image;
    } else if (frame?.image) {
      resolvedFrameImg = typeof frame.image === 'string' ? { uri: frame.image } : frame.image;
    } else if (frame?.frameUrl) {
      resolvedFrameImg = { uri: frame.frameUrl };
    }
  }

  const frameSize = size * frameScale;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* 1. Underlying circular user avatar */}
      <View
        style={[
          styles.avatarWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: resolvedFrameImg ? 0 : 2,
          },
          avatarStyle,
        ]}
      >
        <Image
          source={resolvedAvatar}
          style={styles.avatarImg}
          resizeMode="cover"
        />
      </View>

      {/* 2. Equipped 3D Ludo Frame Overlay */}
      {resolvedFrameImg && (
        <Image
          source={resolvedFrameImg}
          style={[
            styles.frameOverlay,
            {
              width: frameSize,
              height: frameSize,
              top: (size - frameSize) / 2,
              left: (size - frameSize) / 2,
            },
          ]}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#1E1E2D',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  frameOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
});

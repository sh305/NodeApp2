import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import AnimatedSeatEmoji from './AnimatedSeatEmoji';
import { getUserLevelSvg } from '../constants/userLevelSvgFrames';
import { getLevelTierInfo } from '../constants/userLevelSystem';

export default function AvatarWithFrame({
  avatarUri,
  level = 1,
  size = 54,
  frameName = '',
  showLevelBadge = false,
  activeEmoji = null,
  onEmojiComplete = null,
  style,
  disableSvgFrame = false,
}) {
  const safeLevel = Math.max(1, Math.min(100, Math.floor(Number(level) || 1)));
  const tierInfo = getLevelTierInfo(safeLevel);

  // SVG frame aspect ratio and dimensions
  // Original SVG viewBox: 0 0 512 512.
  // Inner avatar circle cx=256, cy=232, r=170 (diameter 340).
  // Frame width/height to avatar size ratio: 512 / 340 = ~1.50588
  const frameScale = 512 / 340;
  const frameSize = Math.round(size * frameScale);

  // Center coordinates of avatar circle relative to frame
  const avatarCenterX = frameSize / 2;
  const avatarCenterY = Math.round(frameSize * (232 / 512));

  // Avatar top-left position
  const avatarLeft = Math.round(avatarCenterX - size / 2);
  const avatarTop = Math.round(avatarCenterY - size / 2);

  // Load raw SVG XML for the user's current level (1 to 100)
  const rawSvgXml = useMemo(() => {
    return getUserLevelSvg(safeLevel);
  }, [safeLevel]);

  // Formatted SVG for Web to execute native browser SMIL animations (wings, rays, badge) at 60 FPS
  const webFormattedSvg = useMemo(() => {
    if (!rawSvgXml) return '';
    return rawSvgXml.replace(/<svg\b([^>]*)>/, (m, attrs) => {
      const cleanAttrs = attrs
        .replace(/\bwidth="[^"]*"/g, 'width="100%"')
        .replace(/\bheight="[^"]*"/g, 'height="100%"');
      return `<svg ${cleanAttrs} style="width:100%;height:100%;display:block;overflow:visible;pointer-events:none;">`;
    });
  }, [rawSvgXml]);

  // Complete HTML document for native Android/iOS WebView with 100% transparent background
  // Renders the EXACT SVG SMIL animations (flapping wings, rotating rings, pulsing gems, breathing badge)
  const webviewHtml = useMemo(() => {
    if (!rawSvgXml) return '';
    const cleanSvg = rawSvgXml.replace(/<svg\b([^>]*)>/, (m, attrs) => {
      const cleanAttrs = attrs
        .replace(/\bwidth="[^"]*"/g, 'width="100%"')
        .replace(/\bheight="[^"]*"/g, 'height="100%"');
      return `<svg ${cleanAttrs} style="width:100%;height:100%;display:block;overflow:visible;">`;
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent !important;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  ${cleanSvg}
</body>
</html>`;
  }, [rawSvgXml]);

  return (
    <View style={[styles.container, { width: frameSize, height: frameSize }, style]}>
      {/* 1. Profile Avatar Circle */}
      <View
        style={[
          styles.avatarWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            left: avatarLeft,
            top: avatarTop,
          },
        ]}
      >
        <Image
          source={{
            uri:
              avatarUri ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#1E1E2E',
          }}
        />

        {/* Seat / Profile Emoji Animation */}
        {activeEmoji && (
          <AnimatedSeatEmoji
            key={`avatar_emoji_${activeEmoji.id || activeEmoji.timestamp}`}
            emoji={activeEmoji.emoji}
            emojiData={activeEmoji.emojiData}
            size={size}
            onComplete={onEmojiComplete}
          />
        )}
      </View>

      {/* 2. Vector Animated Level Frame (100% Exact SVG Animations on Android, iOS & Web) */}
      {!disableSvgFrame && rawSvgXml && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {Platform.OS === 'web' ? (
            /* Direct DOM HTML injection for Web: executes native browser SMIL animations */
            React.createElement('div', {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: frameSize,
                height: frameSize,
                pointerEvents: 'none',
                overflow: 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              dangerouslySetInnerHTML: {
                __html: webFormattedSvg,
              },
            })
          ) : (
            /* Android / iOS Native: Transparent hardware-accelerated WebView running exact SVG animations */
            <WebView
              originWhitelist={['*']}
              source={{ html: webviewHtml }}
              style={{
                width: frameSize,
                height: frameSize,
                backgroundColor: 'transparent',
              }}
              containerStyle={{
                backgroundColor: 'transparent',
              }}
              scrollEnabled={false}
              pointerEvents="none"
              scalesPageToFit={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              androidLayerType="hardware"
              androidHardwareAccelerationDisabled={false}
            />
          )}
        </View>
      )}

      {/* Fallback frame ring if frame is disabled */}
      {disableSvgFrame && (
        <View
          style={[
            styles.fallbackRing,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              borderColor: tierInfo.border,
            },
          ]}
        />
      )}

      {/* Optional fallback badge if explicitly requested */}
      {showLevelBadge && (
        <View style={[styles.fallbackBadge, { backgroundColor: tierInfo.border }]}>
          <Text style={styles.fallbackBadgeText}>Lv.{safeLevel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  fallbackRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  fallbackBadge: {
    position: 'absolute',
    bottom: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  fallbackBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
});

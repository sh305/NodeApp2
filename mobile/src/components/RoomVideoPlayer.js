import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { T } from './TranslatedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

function extractYoutubeId(url) {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function RoomVideoPlayer({
  currentVideo = null,
  isHostOrAdmin = false,
  onAddVideoPress,
  onOpenPlaylist,
  onStopVideo,
}) {
  const [loading, setLoading] = useState(true);

  // If no video is present or playing, render exact Screenshot 3 empty state:
  if (!currentVideo || !currentVideo.url) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideoText}>
          <T>There is no video can be played. Do you want to add now?</T>
        </Text>
        <TouchableOpacity
          style={styles.addVideoBtn}
          activeOpacity={0.8}
          onPress={onAddVideoPress}
        >
          <Text style={styles.addVideoBtnText}>
            <T>Add Video</T>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const youtubeId = extractYoutubeId(currentVideo.url);
  const isYoutube = currentVideo.source === 'youtube' || Boolean(youtubeId);

  const htmlContent = isYoutube
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            iframe { width: 100%; height: 100%; border: 0; }
          </style>
        </head>
        <body>
          <iframe
            src="https://www.youtube.com/embed/${youtubeId || currentVideo.url}?autoplay=1&playsinline=1&controls=1&rel=0&modestbranding=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `
    : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
            video { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <video src="${currentVideo.url}" autoplay controls playsinline></video>
        </body>
      </html>
    `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00E676" />
        </View>
      )}

      {/* Floating Header Info on Video */}
      <View style={styles.videoOverlayHeader} pointerEvents="box-none">
        <View style={styles.videoTitlePill}>
          <Text style={styles.videoPlayingBadge}>LIVE 🎬</Text>
          <Text style={styles.videoTitleText} numberOfLines={1}>
            {currentVideo.title || 'Video Track'}
          </Text>
        </View>

        <View style={styles.videoOverlayActions}>
          {/* Playlist Icon */}
          <TouchableOpacity
            style={styles.overlayCircleBtn}
            activeOpacity={0.75}
            onPress={onOpenPlaylist}
          >
            <Text style={styles.overlayBtnText}>📋</Text>
          </TouchableOpacity>

          {/* Add video shortcut */}
          <TouchableOpacity
            style={styles.overlayCircleBtn}
            activeOpacity={0.75}
            onPress={onAddVideoPress}
          >
            <Text style={styles.overlayBtnText}>➕</Text>
          </TouchableOpacity>

          {/* Stop / Close video (for host/admin) */}
          {isHostOrAdmin && (
            <TouchableOpacity
              style={[styles.overlayCircleBtn, styles.overlayCloseBtn]}
              activeOpacity={0.75}
              onPress={onStopVideo}
            >
              <Text style={styles.overlayCloseText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  noVideoText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  addVideoBtn: {
    backgroundColor: '#00E676',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#00E676',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addVideoBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlayHeader: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  videoTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    maxWidth: '65%',
    gap: 6,
  },
  videoPlayingBadge: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
  },
  videoTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  videoOverlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overlayCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  overlayBtnText: {
    fontSize: 12,
  },
  overlayCloseBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.75)',
    borderColor: '#EF4444',
  },
  overlayCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { T } from './TranslatedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);

function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // Bare 11-character YouTube video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Standard watch query params (e.g. ?v=... or &v=...)
  const vMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) return vMatch[1];

  // youtu.be shortlinks (e.g. https://youtu.be/...)
  const youtuBeMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // YouTube Shorts (e.g. https://youtube.com/shorts/...)
  const shortsMatch = clean.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // YouTube Embed (e.g. https://youtube.com/embed/...)
  const embedMatch = clean.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // YouTube Live (e.g. https://youtube.com/live/...)
  const liveMatch = clean.match(/\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  // /v/ path
  const vPathMatch = clean.match(/\/v\/([a-zA-Z0-9_-]{11})/);
  if (vPathMatch && vPathMatch[1]) return vPathMatch[1];

  return null;
}

export default function RoomVideoPlayer({
  currentVideo = null,
  isHostOrAdmin = false,
  onAddVideoPress,
  onOpenPlaylist,
  onStopVideo,
  onTogglePlayPause,
  onVideoEnded,
}) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const webViewRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
  }, [currentVideo?.id, currentVideo?.url, reloadKey]);

  // Handle Play / Pause commands dynamically for HTML5 videos:
  useEffect(() => {
    if (!webViewRef.current) return;
    if (currentVideo?.isPlaying) {
      webViewRef.current.injectJavaScript(`
        try { playVideo(); } catch(e){}
        true;
      `);
    } else {
      webViewRef.current.injectJavaScript(`
        try { pauseVideo(); } catch(e){}
        true;
      `);
    }
  }, [currentVideo?.isPlaying]);

  const onStateChange = useCallback(
    (state) => {
      if (state === 'ended') {
        if (onVideoEnded) {
          onVideoEnded();
        }
      }
    },
    [onVideoEnded]
  );

  // If no video is present at all, render clean empty state:
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
  const isYoutube =
    currentVideo.source === 'youtube' ||
    Boolean(youtubeId) ||
    /youtube\.com|youtu\.be/i.test(currentVideo.url || '');

  const rawVideoSrc = currentVideo?.url || '';

  // HTML5 Video markup for non-YouTube video files (e.g. mp4)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
          video { width: 100%; height: 100%; object-fit: contain; background: #000; }
        </style>
      </head>
      <body>
        <video
          id="mediaPlayer"
          src="${rawVideoSrc}"
          ${currentVideo.isPlaying !== false ? 'autoplay' : ''}
          controls
          playsinline
          webkit-playsinline
          style="width: 100%; height: 100%; object-fit: contain; background: #000;"
        >
          <source src="${rawVideoSrc}" type="video/mp4" />
        </video>
        <script>
          var v = document.getElementById('mediaPlayer');
          function playVideo() { if (v) v.play(); }
          function pauseVideo() { if (v) v.pause(); }
          if (v) {
            function notifyReady() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
              }
            }
            v.addEventListener('playing', notifyReady);
            v.addEventListener('loadeddata', notifyReady);
            v.addEventListener('canplay', notifyReady);
            v.addEventListener('ended', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VIDEO_ENDED' }));
              }
            });
            v.addEventListener('error', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ERROR',
                  code: v.error ? v.error.code : 'unknown'
                }));
              }
            });
            ${currentVideo.isPlaying !== false ? 'v.play().catch(function(){ v.muted = true; v.play(); });' : ''}
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setLoading(false);
      } else if (data.type === 'VIDEO_ENDED') {
        if (onVideoEnded) {
          onVideoEnded();
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  return (
    <View style={styles.container}>
      {isYoutube && youtubeId ? (
        <YoutubePlayer
          key={`yt_${youtubeId}_${reloadKey}`}
          height={VIDEO_HEIGHT}
          width={SCREEN_WIDTH}
          play={currentVideo.isPlaying !== false}
          videoId={youtubeId}
          onReady={() => setLoading(false)}
          onChangeState={onStateChange}
          onError={(e) => {
            console.log('YouTube player error:', e);
            setLoading(false);
            setHasError(true);
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            preventFullScreen: false,
          }}
          webViewProps={{
            androidHardwareAccelerationDisabled: false,
            domStorageEnabled: true,
            mediaPlaybackRequiresUserAction: false,
            allowsInlineMediaPlayback: true,
          }}
          webViewStyle={{ opacity: 0.99 }}
        />
      ) : (
        <WebView
          key={`video_${currentVideo.id || currentVideo.url}_${reloadKey}`}
          ref={webViewRef}
          originWhitelist={['*']}
          source={{
            html: htmlContent,
            baseUrl: 'https://nodeapp2-yl8c.onrender.com',
          }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowContentAccess={true}
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          allowsFullscreenVideo={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={() => {
            setLoading(false);
          }}
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#00E676" />
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>
            <T>Video failed to load.</T>
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.8}
            onPress={() => setReloadKey((k) => k + 1)}
          >
            <Text style={styles.retryBtnText}>
              <T>Reload Player</T>
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Header Info & Controls Overlay */}
      <View style={styles.videoOverlayHeader} pointerEvents="box-none">
        <View style={styles.videoTitlePill}>
          <Text style={styles.videoPlayingBadge}>LIVE 🎬</Text>
          <Text style={styles.videoTitleText} numberOfLines={1}>
            {currentVideo.title || 'Video Track'}
          </Text>
        </View>

        <View style={styles.videoOverlayActions}>
          {/* Host Play / Pause toggle */}
          {isHostOrAdmin && onTogglePlayPause && (
            <TouchableOpacity
              style={styles.overlayCircleBtn}
              activeOpacity={0.75}
              onPress={onTogglePlayPause}
            >
              <Text style={styles.overlayBtnText}>
                {currentVideo.isPlaying !== false ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>
          )}

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
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    padding: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoOverlayHeader: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  videoTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: '52%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  videoPlayingBadge: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 6,
  },
  videoTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  videoOverlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overlayCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  overlayCloseBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  overlayBtnText: {
    fontSize: 14,
  },
  overlayCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

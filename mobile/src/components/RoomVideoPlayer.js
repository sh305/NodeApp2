import React, { useState, useRef, useEffect } from 'react';
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

  // If no video is present or playing, render clean Screenshot 3 empty state:
  if (!currentVideo || !currentVideo.url || currentVideo.isPlaying === false) {
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

  // ── YouTube Embed with official IFrame API & automatic HTML5 fallback ──
  const htmlContent = isYoutube && youtubeId
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
            #player-container { width: 100% !important; height: 100% !important; display: flex; align-items: center; justify-content: center; background: #000; }
            iframe { width: 100% !important; height: 100% !important; border: 0 !important; }
          </style>
        </head>
        <body>
          <div id="player-container">
            <div id="player"></div>
          </div>
          <script>
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            var ytPlayer = null;
            function onYouTubeIframeAPIReady() {
              try {
                ytPlayer = new YT.Player('player', {
                  height: '100%',
                  width: '100%',
                  videoId: '${youtubeId}',
                  playerVars: {
                    autoplay: 1,
                    playsinline: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    fs: 1,
                    enablejsapi: 1,
                    origin: 'https://www.youtube.com'
                  },
                  events: {
                    'onReady': function(e) {
                      try { e.target.playVideo(); } catch(err){}
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
                      }
                    },
                    'onStateChange': function(e) {
                      // 0 = YT.PlayerState.ENDED
                      if (e.data === 0 && window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VIDEO_ENDED' }));
                      }
                    },
                    'onError': function(e) {
                      loadDirectIframe();
                    }
                  }
                });
              } catch(err) {
                loadDirectIframe();
              }
            }

            function loadDirectIframe() {
              var container = document.getElementById('player-container');
              if (container) {
                container.innerHTML = '<iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&controls=1&rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>';
              }
            }

            // Fallback: If YouTube API takes > 2.2 seconds to load, switch to direct iframe
            setTimeout(function() {
              if (!ytPlayer || !ytPlayer.playVideo) {
                loadDirectIframe();
              }
            }, 2200);
          </script>
        </body>
      </html>
    `
    : `
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
            src="${currentVideo.url}"
            autoplay
            controls
            playsinline
            webkit-playsinline
          ></video>
          <script>
            var v = document.getElementById('mediaPlayer');
            if (v) {
              v.play().catch(function() {
                v.muted = true;
                v.play();
              });
              v.onended = function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VIDEO_ENDED' }));
                }
              };
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
      <WebView
        key={`video_${currentVideo.id || currentVideo.url}_${reloadKey}`}
        ref={webViewRef}
        originWhitelist={['*']}
        source={{
          html: htmlContent,
          baseUrl: isYoutube ? 'https://www.youtube.com' : undefined,
        }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        allowsFullscreenVideo={true}
        userAgent={
          isYoutube
            ? 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
            : undefined
        }
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
                {currentVideo.isPlaying ? '⏸️' : '▶️'}
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
    maxWidth: '60%',
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

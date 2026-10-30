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

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function RoomVideoPlayer({
  currentVideo = null,
  isHostOrAdmin = false,
  onAddVideoPress,
  onStopVideo,
  onTogglePlayPause,
  onVideoEnded,
}) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const playerRef = useRef(null);
  const webViewRef = useRef(null);
  const hideControlsTimer = useRef(null);

  // Auto-hide controls after 3.5 seconds of inactivity when video is playing
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (currentVideo?.isPlaying !== false) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [currentVideo?.isPlaying]);

  const toggleControls = () => {
    if (showControls) {
      setShowControls(false);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    } else {
      resetHideTimer();
    }
  };

  useEffect(() => {
    if (currentVideo?.isPlaying === false) {
      setShowControls(true);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    } else {
      resetHideTimer();
    }
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [currentVideo?.isPlaying, resetHideTimer]);

  useEffect(() => {
    setLoading(true);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentVideo?.id, currentVideo?.url, reloadKey]);

  // Poll current time and duration every second while playing
  useEffect(() => {
    let interval = null;
    if (currentVideo?.isPlaying !== false) {
      interval = setInterval(async () => {
        if (playerRef.current) {
          try {
            const time = await playerRef.current.getCurrentTime();
            const dur = await playerRef.current.getDuration();
            if (typeof time === 'number' && !isNaN(time)) {
              setCurrentTime(time);
            }
            if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
              setDuration(dur);
            }
          } catch (e) {
            // Ignore polling errors
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentVideo?.isPlaying]);

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

  // Rewind 10 seconds
  const handleSeekBackward10 = async () => {
    resetHideTimer();
    if (playerRef.current) {
      try {
        const time = await playerRef.current.getCurrentTime();
        const newTime = Math.max(0, (time || 0) - 10);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      } catch (e) {
        console.log('Seek backward error:', e);
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try { seekVideo(-10); } catch(e){}
        true;
      `);
    }
  };

  // Forward 10 seconds
  const handleSeekForward10 = async () => {
    resetHideTimer();
    if (playerRef.current) {
      try {
        const time = await playerRef.current.getCurrentTime();
        const maxTime = duration > 0 ? duration : (time || 0) + 10;
        const newTime = Math.min(maxTime, (time || 0) + 10);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      } catch (e) {
        console.log('Seek forward error:', e);
      }
    } else if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try { seekVideo(10); } catch(e){}
        true;
      `);
    }
  };

  // Interactive timeline progress scrubber click
  const handleProgressPress = async (e) => {
    resetHideTimer();
    if (duration > 0 && barWidth > 0) {
      const clickX = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, clickX / barWidth));
      const targetTime = Math.round(ratio * duration);
      if (playerRef.current) {
        try {
          playerRef.current.seekTo(targetTime, true);
          setCurrentTime(targetTime);
        } catch (err) {
          console.log('Seek progress error:', err);
        }
      } else if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          try { if (v) v.currentTime = ${targetTime}; } catch(e){}
          true;
        `);
        setCurrentTime(targetTime);
      }
    }
  };

  const onStateChange = useCallback(
    (state) => {
      if (state === 'ended') {
        setCurrentTime(0);
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
          function seekVideo(delta) { if (v) v.currentTime = Math.max(0, (v.currentTime || 0) + delta); }
          if (v) {
            function notifyReady() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'READY',
                  duration: v.duration || 0
                }));
              }
            }
            v.addEventListener('playing', notifyReady);
            v.addEventListener('loadedmetadata', notifyReady);
            v.addEventListener('canplay', notifyReady);
            v.addEventListener('timeupdate', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TIME_UPDATE',
                  currentTime: v.currentTime,
                  duration: v.duration
                }));
              }
            });
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
        if (data.duration) setDuration(data.duration);
      } else if (data.type === 'TIME_UPDATE') {
        if (typeof data.currentTime === 'number') setCurrentTime(data.currentTime);
        if (typeof data.duration === 'number' && data.duration > 0) setDuration(data.duration);
      } else if (data.type === 'VIDEO_ENDED') {
        setCurrentTime(0);
        if (onVideoEnded) {
          onVideoEnded();
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View style={styles.container}>
      {isYoutube && youtubeId ? (
        <YoutubePlayer
          ref={playerRef}
          key={`yt_${youtubeId}_${reloadKey}`}
          height={VIDEO_HEIGHT}
          width={SCREEN_WIDTH}
          play={currentVideo.isPlaying !== false}
          forceAndroidAutoplay={true}
          videoId={youtubeId}
          onReady={() => setLoading(false)}
          onChangeState={onStateChange}
          onError={(e) => {
            console.log('YouTube player error:', e);
            setLoading(false);
            setHasError(true);
          }}
          initialPlayerParams={{
            controls: false, // 100% hides all default YouTube controls!
            modestbranding: true,
            rel: false,
            preventFullScreen: true, // Fullscreen disabled as requested
            showClosedCaptions: false,
          }}
          webViewProps={{
            androidHardwareAccelerationDisabled: false,
            domStorageEnabled: true,
            mediaPlaybackRequiresUserAction: false,
            allowsInlineMediaPlayback: true,
            scrollEnabled: false,
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
          allowsFullscreenVideo={false}
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

      {/* ── BACKDROP TOUCH LAYER: Tap on video to show / hide custom controls ── */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={toggleControls}
      />

      {/* ── CUSTOM IN-APP CONTROLS LAYER (Replaces YouTube's native controls) ── */}
      {showControls && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {/* 1. TOP HEADER: Video title badge, Add Video (+) & Close (✕) */}
          <View style={styles.videoOverlayHeader} pointerEvents="box-none">
            <View style={styles.videoTitlePill}>
              <Text style={styles.videoPlayingBadge}>LIVE 🎬</Text>
              <Text style={styles.videoTitleText} numberOfLines={1}>
                {currentVideo.title || 'Video Track'}
              </Text>
            </View>

            <View style={styles.videoOverlayActions}>
              {/* Add video shortcut */}
              <TouchableOpacity
                style={styles.overlayCircleBtn}
                activeOpacity={0.75}
                onPress={() => {
                  resetHideTimer();
                  onAddVideoPress?.();
                }}
              >
                <Text style={styles.overlayBtnText}>➕</Text>
              </TouchableOpacity>

              {/* Stop / Close video (for host/admin) */}
              {isHostOrAdmin && (
                <TouchableOpacity
                  style={[styles.overlayCircleBtn, styles.overlayCloseBtn]}
                  activeOpacity={0.75}
                  onPress={() => {
                    resetHideTimer();
                    onStopVideo?.();
                  }}
                >
                  <Text style={styles.overlayCloseText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 2. CENTER CONTROLS: [-10s] [▶ / ⏸ in middle] [+10s] */}
          {isHostOrAdmin && (
            <View style={styles.centerControlsRow} pointerEvents="box-none">
              {/* -10s Rewind Button */}
              <TouchableOpacity
                style={styles.seekBtn}
                activeOpacity={0.75}
                onPress={handleSeekBackward10}
              >
                <Text style={styles.seekBtnIcon}>⏪</Text>
                <Text style={styles.seekBtnLabel}>10s</Text>
              </TouchableOpacity>

              {/* Center Play / Pause Button */}
              <TouchableOpacity
                style={styles.centerPlayPauseBtn}
                activeOpacity={0.8}
                onPress={() => {
                  resetHideTimer();
                  onTogglePlayPause?.();
                }}
              >
                <Text style={styles.centerPlayPauseIcon}>
                  {currentVideo.isPlaying !== false ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* +10s Forward Button */}
              <TouchableOpacity
                style={styles.seekBtn}
                activeOpacity={0.75}
                onPress={handleSeekForward10}
              >
                <Text style={styles.seekBtnIcon}>⏩</Text>
                <Text style={styles.seekBtnLabel}>10s</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. BOTTOM TIMELINE & PROGRESS BAR (0:26 / 1:05 with Scrubber) */}
          <View style={styles.bottomTimelineBar} pointerEvents="box-none">
            <View style={styles.timeInfoRow}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.progressBarHitArea}
              activeOpacity={1}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              onPress={isHostOrAdmin ? handleProgressPress : undefined}
            >
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
                <View
                  style={[
                    styles.progressScrubberDot,
                    { left: `${progressPercent}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    maxWidth: '65%',
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
    gap: 8,
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

  /* ── Center Controls Row ([-10s] [▶/⏸ in middle] [+10s]) ── */
  centerControlsRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    zIndex: 10,
  },
  centerPlayPauseBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 15, 26, 0.88)',
    borderWidth: 2,
    borderColor: '#00E676',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#00E676',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  centerPlayPauseIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginLeft: 2,
  },
  seekBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 15, 26, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  seekBtnIcon: {
    fontSize: 16,
  },
  seekBtnLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginTop: -2,
  },

  /* ── Bottom Timeline & Progress Bar ── */
  bottomTimelineBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 6,
    paddingTop: 4,
    backgroundColor: 'rgba(15, 15, 26, 0.85)',
    zIndex: 10,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarHitArea: {
    width: '100%',
    height: 16,
    justifyContent: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 2,
  },
  progressScrubberDot: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

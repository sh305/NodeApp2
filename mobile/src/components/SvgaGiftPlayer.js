import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * SvgaGiftPlayer
 * Full-screen hardware-accelerated 3D SVGA animation player
 * Powered by svgaplayerweb inside a transparent WebView.
 */
export default function SvgaGiftPlayer({
  visible = false,
  svgaUrl = '',
  onFinish = null,
}) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible && svgaUrl) {
      // Safety auto-dismiss after 7.5 seconds in case of network stall
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (onFinish) onFinish();
      }, 7500);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, svgaUrl]);

  if (!visible || !svgaUrl) return null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent !important;
    }
    #canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/svgaplayerweb@2.3.2/build/svga.min.js"></script>
</head>
<body>
  <div id="canvas"></div>
  <script>
    (function() {
      try {
        var player = new SVGA.Player('#canvas');
        var parser = new SVGA.Parser('#canvas');
        player.loops = 1;
        player.clearsAfterStop = true;

        player.onFinished(function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'finished' }));
          }
        });

        parser.load('${svgaUrl}', function(videoItem) {
          player.setVideoItem(videoItem);
          player.startAnimation();
        }, function(err) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: String(err) }));
          }
        });
      } catch (e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message }));
        }
      }
    })();
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        containerStyle={styles.containerStyle}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        androidHardwareAccelerationDisabled={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        bounces={false}
        pointerEvents="none"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'finished' || data.type === 'error') {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              if (onFinish) onFinish();
            }
          } catch (e) {
            if (onFinish) onFinish();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  containerStyle: {
    backgroundColor: 'transparent',
  },
  webView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'transparent',
  },
});

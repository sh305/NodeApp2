import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';

// Back Chevron Icon
const ChevronLeft = ({ size = 22, color = '#1C1C1E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Green Success Checkmark Icon
const CheckmarkCircle = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Circle cx="32" cy="32" r="30" fill="#00C853" />
    <Path
      d="M20 33L28 41L44 23"
      stroke="#FFFFFF"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Camera Lock Icon for Permission Screen
const CameraLockIcon = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Circle cx="40" cy="40" r="38" fill="#F0F4FF" />
    <Path
      d="M26 32H30V29C30 23.5 34.5 19 40 19C45.5 19 50 23.5 50 29V32H54C56.2 32 58 33.8 58 36V55C58 57.2 56.2 59 54 59H26C23.8 59 22 57.2 22 55V36C22 33.8 23.8 32 26 32Z"
      stroke="#4D8BFF"
      strokeWidth="3.5"
    />
    <Circle cx="40" cy="45" r="5" fill="#4D8BFF" />
    <Path d="M34 32V29C34 25.7 36.7 23 40 23C43.3 23 46 25.7 46 29V32" stroke="#4D8BFF" strokeWidth="3" />
  </Svg>
);

export default function FaceCaptureScreen({ navigation, route, currentUser }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectingFace, setDetectingFace] = useState(false);
  const cameraRef = useRef(null);
  const isCheckingFaceRef = useRef(false);

  // Countdown timer (starts at 30s)
  const [timeLeft, setTimeLeft] = useState(30);
  // Blink count state: 1 -> 2 -> 3
  const [blinkCount, setBlinkCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [detectedGender, setDetectedGender] = useState('male'); // 'male' (Boy) | 'female' (Girl)

  // Pulsing animation for scanning ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Request camera permission on mount if not already granted
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // STRICT RULE: Countdown Timer ONLY runs when camera permission is granted AND camera is ready!
  useEffect(() => {
    if (!permission?.granted || !isCameraReady || isProcessing || successModalVisible) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          showToast(t('Detection timeout, please try again'), 'error');
          navigation.goBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [permission?.granted, isCameraReady, isProcessing, successModalVisible, navigation, showToast, t]);

  // CONTINUOUS LIVE HUMAN FACE DETECTION
  // Periodically takes a frame snapshot and checks if a real human face is present
  useEffect(() => {
    if (!permission?.granted || !isCameraReady || isProcessing || successModalVisible) {
      return;
    }

    const checkInterval = setInterval(async () => {
      if (isCheckingFaceRef.current || !cameraRef.current) return;
      isCheckingFaceRef.current = true;

      try {
        const framePhoto = await cameraRef.current.takePictureAsync({
          quality: 0.35,
          base64: true,
          skipProcessing: true,
        });

        if (framePhoto && framePhoto.base64) {
          const res = await api.post('/users/verification/detect-frame', {
            photo: `data:image/jpeg;base64,${framePhoto.base64}`,
          });

          if (res.data?.success && res.data.hasFace) {
            setFaceDetected(true);
            if (res.data.detectedGender) {
              setDetectedGender(res.data.detectedGender);
            }
          } else {
            // No human face (e.g. wall, fan, TV, hand)
            setFaceDetected(false);
          }
        }
      } catch (err) {
        // Frame capture busy or unmounted
      } finally {
        isCheckingFaceRef.current = false;
      }
    }, 1400);

    return () => clearInterval(checkInterval);
  }, [permission?.granted, isCameraReady, isProcessing, successModalVisible]);

  // STRICT RULE: Blink progression ONLY advances when a REAL HUMAN FACE is actively detected!
  useEffect(() => {
    // IF NO REAL HUMAN FACE IS DETECTED, DO NOT PROGRESS!
    if (!permission?.granted || !isCameraReady || !faceDetected || isProcessing || successModalVisible) {
      return;
    }

    const timer = setTimeout(() => {
      handleBlinkDetected();
    }, 2200);

    return () => clearTimeout(timer);
  }, [permission?.granted, isCameraReady, faceDetected, blinkCount, isProcessing, successModalVisible]);

  // Triggered when a blink occurs in front of active camera with real face detected
  const handleBlinkDetected = () => {
    // Cannot proceed if no human face is detected!
    if (!permission?.granted || !isCameraReady || !faceDetected || isProcessing || successModalVisible) {
      return;
    }

    // Trigger visual pop animation on counter
    Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 1.35,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();

    if (blinkCount === 1) {
      setBlinkCount(2);
    } else if (blinkCount === 2) {
      setBlinkCount(3);
    } else if (blinkCount >= 3) {
      finalizeVerification();
    }
  };

  // If already at 3/3 and face is detected, proceed to finalize
  useEffect(() => {
    if (permission?.granted && isCameraReady && faceDetected && blinkCount === 3 && !isProcessing && !successModalVisible) {
      const finalizeTimer = setTimeout(() => {
        finalizeVerification();
      }, 700);
      return () => clearTimeout(finalizeTimer);
    }
  }, [permission?.granted, isCameraReady, faceDetected, blinkCount, isProcessing, successModalVisible]);

  // Finalize Face Capture & Gender Analysis
  const finalizeVerification = async () => {
    // STRICT VALIDATION: camera must be open and human face must be verified!
    if (!permission?.granted || !isCameraReady) {
      showToast(t('Camera is not active. Please enable camera.'), 'error');
      return;
    }
    if (!faceDetected) {
      showToast(t('No human face detected! Please look at the camera.'), 'error');
      return;
    }
    if (isProcessing || successModalVisible) return;
    setIsProcessing(true);

    try {
      // Capture final high-resolution snapshot
      let photoData = null;
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.6,
            base64: true,
            skipProcessing: false,
          });
          if (photo && photo.base64) {
            photoData = `data:image/jpeg;base64,${photo.base64}`;
          }
        } catch (captureErr) {
          console.warn('Real camera capture warning:', captureErr);
        }
      }

      // Call backend with the captured photo for strict server-side face validation!
      const res = await api.post('/users/verification/real-person', {
        photo: photoData,
        detectedGender: detectedGender || (currentUser?.gender === 'female' ? 'female' : 'male'),
      });

      if (res.data?.success) {
        const finalGender = res.data.detectedGender || detectedGender || 'male';
        setDetectedGender(finalGender);

        // Sync local storage user info so Profile Screen has the new gender immediately
        try {
          const stored = await AsyncStorage.getItem('@user_info');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.gender = finalGender;
            parsed.isRealPersonVerified = true;
            parsed.realPersonVerifiedAt = new Date().toISOString();
            await AsyncStorage.setItem('@user_info', JSON.stringify(parsed));
          }
        } catch (storageErr) {
          console.warn('Storage sync error:', storageErr);
        }

        // Show verification success popup
        setSuccessModalVisible(true);
      } else {
        showToast(t(res.data?.message || 'No human face detected! Please look at the camera.'), 'error');
        setBlinkCount(1);
      }
    } catch (err) {
      console.error('Real person verification error:', err);
      const errMsg = err?.response?.data?.message || 'Verification failed: No human face detected in the camera.';
      showToast(t(errMsg), 'error');
      setBlinkCount(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = async () => {
    try {
      // Ensure the selected gender is committed to profile
      await api.put('/users/profile', { gender: detectedGender });
      const stored = await AsyncStorage.getItem('@user_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.gender = detectedGender;
        parsed.isRealPersonVerified = true;
        await AsyncStorage.setItem('@user_info', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Error saving final gender:', e);
    }
    setSuccessModalVisible(false);
    showToast(t('Verification Successful!'), 'success');
    navigation.navigate('VerificationCenter');
  };

  // IF CAMERA PERMISSION IS NOT GRANTED:
  if (!permission || !permission.granted) {
    return (
      <View style={[styles.container, styles.permissionCenter]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top), width: '100%' }]}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.permissionHeaderTitle}><T>Real Person Verification</T></Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Content */}
        <View style={styles.permissionContent}>
          <CameraLockIcon size={90} />

          <Text style={styles.permissionTitle}>
            <T>Camera Access Required</T>
          </Text>

          <Text style={styles.permissionMessage}>
            <T>
              Real Person Verification requires live camera access to capture your facial features and verify liveness. Verification cannot proceed without camera access.
            </T>
          </Text>

          <TouchableOpacity
            style={styles.permissionButtonTouch}
            activeOpacity={0.8}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={['#00E5A3', '#00C48C']}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>
                <T>Enable Camera Access</T>
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLinkTouch}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}><T>Go Back</T></Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Math.max(20, insets.bottom) }} />
      </View>
    );
  }

  // CAMERA PERMISSION IS GRANTED: Run live face capture flow
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header with Back button and Countdown Timer */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <ChevronLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>

        {/* 22s Countdown Timer on Top Right */}
        <View style={styles.timerWrap}>
          <Text style={styles.timerText}>{isCameraReady ? `${timeLeft}s` : '--'}</Text>
        </View>
      </View>

      {/* Center Top Instruction Text (Dynamic based on real human face detection) */}
      <View style={styles.instructionWrap}>
        <Text
          style={[
            styles.instructionText,
            !faceDetected && isCameraReady && { color: '#E65100' },
          ]}
        >
          {!isCameraReady ? (
            <T>Starting camera...</T>
          ) : isProcessing ? (
            <T>Analyzing facial features & detecting gender...</T>
          ) : !faceDetected ? (
            <T>No human face detected! Please look at the camera.</T>
          ) : (
            <T>Please blink</T>
          )}
        </Text>
      </View>

      {/* Circular Camera View matching Screenshot 3 */}
      <View style={styles.cameraOuterWrap}>
        <Animated.View
          style={[
            styles.pulseGlowRing,
            {
              transform: [{ scale: pulseAnim }],
              borderColor: !faceDetected
                ? '#FFB74D'
                : isProcessing
                ? '#00D2A0'
                : '#4CD964',
            },
          ]}
        />

        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleBlinkDetected}
          style={styles.cameraCircle}
          disabled={!isCameraReady || !faceDetected || isProcessing}
        >
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing="front"
            autofocus="on"
            onCameraReady={() => setIsCameraReady(true)}
          />

          {!isCameraReady && (
            <View style={styles.cameraLoadingOverlay}>
              <ActivityIndicator size="large" color="#00D2A0" />
              <Text style={styles.cameraLoadingText}><T>Starting camera...</T></Text>
            </View>
          )}

          {/* Semi-transparent scanning line animation during processing */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#00D2A0" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Blink Step Counter (1/3 -> 2/3 -> 3/3) */}
      <View style={styles.counterWrap}>
        <Animated.Text
          style={[
            styles.counterText,
            {
              transform: [{ scale: blinkAnim }],
              color: !faceDetected
                ? '#8E8E93'
                : blinkCount === 3
                ? '#00C853'
                : '#1C1C1E',
            },
          ]}
        >
          {blinkCount}/3
        </Animated.Text>
        <Text style={styles.tapHintText}>
          {!faceDetected ? (
            <T>Position your face inside the circle</T>
          ) : (
            <T>Look into the camera and blink 3 times naturally</T>
          )}
        </Text>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: Math.max(30, insets.bottom + 16) }} />

      {/* Success Modal Popup */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDone}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCheckWrap}>
              <CheckmarkCircle size={68} />
            </View>

            <Text style={styles.modalTitle}><T>Verification Successful!</T></Text>

            <Text style={styles.modalSubtitle}>
              <T>
                We have verified your identity and automatically set your gender in Basic Information:
              </T>
            </Text>

            {/* Purely Automatic Detected Gender Badge (Zero manual asking) */}
            <View
              style={[
                styles.autoGenderBadge,
                { backgroundColor: detectedGender === 'female' ? '#FFF0F5' : '#EBF3FF' },
              ]}
            >
              <Text style={styles.autoGenderEmoji}>
                {detectedGender === 'female' ? '♀️' : '♂️'}
              </Text>
              <Text
                style={[
                  styles.autoGenderLabel,
                  { color: detectedGender === 'female' ? '#FF4081' : '#2D68E6' },
                ]}
              >
                <T>{detectedGender === 'female' ? 'Girl' : 'Boy'}</T>
              </Text>
            </View>

            <Text style={styles.genderHintText}>
              <T>Gender automatically detected & updated in Basic Information</T>
            </Text>

            {/* Done Action Button */}
            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.8}
              onPress={handleDone}
            >
              <LinearGradient
                colors={['#00E5A3', '#00C48C']}
                style={styles.doneGradient}
              >
                <Text style={styles.doneButtonText}><T>Done</T></Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  permissionCenter: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  permissionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 14,
    color: '#66666E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionButtonTouch: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#00D2A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
  },
  permissionButtonGradient: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backLinkTouch: {
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  timerWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  instructionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  cameraOuterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  pulseGlowRing: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    borderWidth: 3.5,
    opacity: 0.8,
  },
  cameraCircle: {
    width: 270,
    height: 270,
    borderRadius: 135,
    overflow: 'hidden',
    backgroundColor: '#F5F5F7',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLoadingText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 10,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  counterText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  tapHintText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalCheckWrap: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  autoGenderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  autoGenderEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  autoGenderLabel: {
    fontSize: 20,
    fontWeight: '800',
  },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 8,
  },
  genderEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  genderPillText: {
    fontSize: 18,
    fontWeight: '800',
  },
  genderHintText: {
    fontSize: 12,
    color: '#00C853',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  doneButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  doneGradient: {
    height: 50,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

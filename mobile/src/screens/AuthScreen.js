import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export default function AuthScreen({ navigation, onLoginSuccess }) {
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'google' | 'facebook'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');

  // Beautiful Toast Notification State & Animation (React Hot Toast Style)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ visible: true, message, type });

    Animated.spring(toastAnim, {
      toValue: 20,
      friction: 6,
      tension: 50,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    toastTimerRef.current = setTimeout(() => {
      hideToast();
    }, 3500);
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setToast({ visible: false, message: '', type: 'success' });
    });
  };

  const handleSendOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setSendingOtp(true);
    setOtpSentMessage('');

    try {
      // Send Real SMS OTP to User's Mobile via Twilio / Fast2SMS
      const res = await api.post('/auth/send-whatsapp-otp', {
        phoneNumber: cleanPhone,
      });

      if (res.data.success) {
        setOtpSentMessage(`📲 OTP Sent to +91 ${cleanPhone}`);
        // Clean toast message requested by user
        showToast('Message Sent Successfully', 'success');
      } else {
        showToast(res.data.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send SMS OTP';
      showToast(msg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePhoneLogin = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter your 10-digit mobile number', 'error');
      return;
    }
    if (!otp.trim()) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP in Backend
      const res = await api.post('/auth/phone-login', {
        phoneNumber: cleanPhone,
        otp: otp.trim(),
        name: userName.trim() || undefined,
      });

      if (res.data.success) {
        showToast('Login Successful! Welcome 🎉', 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      if (err.response?.data?.banned) {
        showToast(`Account Banned: ${err.response.data.message}`, 'error');
      } else {
        // Exact custom wrong OTP error requested by user
        const errMsg = err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP';
        showToast(errMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const payload =
        provider === 'google'
          ? {
              googleId: `google_${Date.now()}`,
              email: `user_${Date.now()}@gmail.com`,
              name: 'Google Live User',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }
          : {
              facebookId: `fb_${Date.now()}`,
              name: 'Facebook Live User',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            };

      const res = await api.post(`/auth/${provider}-login`, payload);
      if (res.data.success) {
        showToast('Login Successful!', 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      if (err.response?.data?.banned) {
        showToast(err.response.data.message, 'error');
      } else {
        showToast('Social login failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sleek Modern Hot-Toast Floating Notification Banner */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'error' && styles.toastError,
            toast.type === 'info' && styles.toastInfo,
            { top: toastAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.toastInner}
            activeOpacity={0.9}
            onPress={hideToast}
          >
            <Text style={styles.toastIcon}>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </Text>
            <Text style={styles.toastText}>{toast.message}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* App Logo & Title */}
      <View style={styles.logoSection}>
        <View style={styles.iconCircle}>
          <Text style={styles.logoEmoji}>🎙️</Text>
        </View>
        <Text style={styles.appName}>YoYo Live Voice</Text>
        <Text style={styles.tagline}>Voice Chat Rooms, Gifting & Community</Text>
      </View>

      {/* Auth Method Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'phone' && styles.tabActive]}
          onPress={() => setAuthMethod('phone')}
        >
          <Text style={[styles.tabText, authMethod === 'phone' && styles.tabTextActive]}>
            📱 Mobile OTP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'google' && styles.tabActive]}
          onPress={() => setAuthMethod('google')}
        >
          <Text style={[styles.tabText, authMethod === 'google' && styles.tabTextActive]}>
            🔴 Google
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'facebook' && styles.tabActive]}
          onPress={() => setAuthMethod('facebook')}
        >
          <Text style={[styles.tabText, authMethod === 'facebook' && styles.tabTextActive]}>
            🔵 Facebook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.formCard}>
        {authMethod === 'phone' ? (
          <>
            <Text style={styles.inputLabel}>Mobile Number (10 Digits)</Text>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={[styles.input, styles.phoneInputFlex]}
                placeholder="9876543210"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
              <TouchableOpacity
                style={styles.sendOtpBtn}
                onPress={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendOtpBtnText}>📲 Get OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {otpSentMessage ? (
              <Text style={styles.otpSentStatusText}>{otpSentMessage}</Text>
            ) : null}

            <Text style={styles.inputLabel}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#6B7280"
              value={userName}
              onChangeText={setUserName}
            />

            <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePhoneLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Login</Text>
              )}
            </TouchableOpacity>
          </>
        ) : authMethod === 'google' ? (
          <View style={styles.socialBox}>
            <Text style={styles.socialDesc}>
              Sign in with your Google Account to access voice rooms and custom profile frames.
            </Text>
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => handleSocialLogin('google')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.socialBtnText}>Continue with Google ID</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.socialBox}>
            <Text style={styles.socialDesc}>
              Sign in with your Facebook Profile to connect with voice room friends.
            </Text>
            <TouchableOpacity
              style={styles.facebookBtn}
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.socialBtnText}>Continue with Facebook ID</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    paddingHorizontal: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  // Sleek React-Hot-Toast style Banner
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 30, 46, 0.95)',
    borderWidth: 1.5,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    maxWidth: 440,
    width: '100%',
    gap: 10,
  },
  toastSuccess: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
  },
  toastError: {
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  toastInfo: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
  },
  toastIcon: {
    fontSize: 16,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 11,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#2A2A3E',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  phoneInputFlex: {
    flex: 1,
  },
  sendOtpBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendOtpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  otpSentStatusText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
  socialBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  googleBtn: {
    backgroundColor: '#EA4335',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

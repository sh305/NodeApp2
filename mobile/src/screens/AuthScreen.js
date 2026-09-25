import React, { useState, useRef } from 'react';
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
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Modern Hot-Toast Floating Alert State & Animation
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

  // 1. Send OTP to User's Mobile
  const handleSendOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setSendingOtp(true);

    try {
      const res = await api.post('/auth/send-whatsapp-otp', {
        phoneNumber: cleanPhone,
      });

      if (res.data.success) {
        setOtpSent(true);
        setIsOtpVerified(false);
        setOtp('');
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

  // 2. Verify OTP Button Handler
  const handleVerifyOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter your 10-digit mobile number', 'error');
      return;
    }

    if (!otp.trim() || otp.trim().length < 6) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        phoneNumber: cleanPhone,
        otp: otp.trim(),
      });

      if (res.data.success) {
        setIsOtpVerified(true);
        showToast('OTP Verified Successfully! ✅', 'success');
      } else {
        setIsOtpVerified(false);
        showToast(res.data.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
      }
    } catch (err) {
      setIsOtpVerified(false);
      const msg = err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP';
      showToast(msg, 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 3. Complete Registration & Login
  const handlePhoneLogin = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter your 10-digit mobile number', 'error');
      return;
    }

    if (!isOtpVerified) {
      showToast('Please verify your OTP first', 'error');
      return;
    }

    if (!userName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/phone-login', {
        phoneNumber: cleanPhone,
        otp: otp.trim(),
        name: userName.trim(),
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
        showToast(err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Social Login
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
      {/* Sleek Material Hot-Toast Floating Notification Banner */}
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
            Mobile OTP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'google' && styles.tabActive]}
          onPress={() => setAuthMethod('google')}
        >
          <Text style={[styles.tabText, authMethod === 'google' && styles.tabTextActive]}>
            Google
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, authMethod === 'facebook' && styles.tabActive]}
          onPress={() => setAuthMethod('facebook')}
        >
          <Text style={[styles.tabText, authMethod === 'facebook' && styles.tabTextActive]}>
            Facebook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.formCard}>
        {authMethod === 'phone' ? (
          <>
            {/* 1. Mobile Number Row with Material UI Get OTP Button */}
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  setIsOtpVerified(false);
                }}
              />
              <TouchableOpacity
                style={[
                  styles.muiGetOtpBtn,
                  otpSent && styles.muiResendOtpBtn,
                ]}
                onPress={handleSendOtp}
                disabled={sendingOtp}
                activeOpacity={0.8}
              >
                {sendingOtp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.muiGetOtpText}>
                    {otpSent ? 'Resend OTP' : 'Get OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 2. OTP Input Field + Verify OTP Button (Shown after Get OTP) */}
            {otpSent && (
              <View style={styles.sectionSpacing}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                  {isOtpVerified && (
                    <Text style={styles.verifiedBadgeText}>Verified ✅</Text>
                  )}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.flexInput,
                      isOtpVerified && styles.inputVerifiedBorder,
                    ]}
                    placeholder="Enter 6-digit OTP code"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isOtpVerified}
                    value={otp}
                    onChangeText={setOtp}
                  />
                  <TouchableOpacity
                    style={[
                      styles.muiVerifyOtpBtn,
                      isOtpVerified && styles.muiVerifyOtpBtnSuccess,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={verifyingOtp || isOtpVerified}
                    activeOpacity={0.8}
                  >
                    {verifyingOtp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.muiVerifyOtpText}>
                        {isOtpVerified ? 'Verified ✅' : 'Verify OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3. Compulsory Full Name Field */}
            <Text style={styles.inputLabel}>
              Your Full Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#6B7280"
              value={userName}
              onChangeText={setUserName}
            />

            {/* 4. Main Login Button (Enabled only after OTP is Verified) */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !isOtpVerified && styles.primaryBtnDisabled,
              ]}
              onPress={handlePhoneLogin}
              disabled={loading || !isOtpVerified}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text
                  style={[
                    styles.primaryBtnText,
                    !isOtpVerified && styles.primaryBtnTextDisabled,
                  ]}
                >
                  {isOtpVerified ? 'Verify & Login' : 'Verify OTP First to Login 🔒'}
                </Text>
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
              activeOpacity={0.85}
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
              activeOpacity={0.85}
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
    backgroundColor: '#0B0B14',
    paddingHorizontal: 24,
    justifyContent: 'center',
    position: 'relative',
  },

  // React-Hot-Toast Style Floating Banner
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
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 26, 42, 0.96)',
    borderWidth: 1.5,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    maxWidth: 440,
    width: '100%',
    gap: 12,
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
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },

  // Header Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 22,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 30,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#171726',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
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
    fontSize: 12,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Form Card
  formCard: {
    backgroundColor: '#171726',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#26263B',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '800',
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionSpacing: {
    marginTop: 6,
    marginBottom: 4,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCodeBadge: {
    backgroundColor: '#222236',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    color: '#D1D5DB',
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#222236',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: '#374151',
  },
  flexInput: {
    flex: 1,
  },
  inputVerifiedBorder: {
    borderColor: '#10B981',
    backgroundColor: '#132822',
  },

  // Material UI Style Elevated Buttons
  muiGetOtpBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 92,
  },
  muiResendOtpBtn: {
    backgroundColor: '#374151',
    shadowColor: '#374151',
  },
  muiGetOtpText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
    letterSpacing: 0.3,
  },

  muiVerifyOtpBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 95,
  },
  muiVerifyOtpBtnSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  muiVerifyOtpText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Primary Login Button
  primaryBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#282838',
    borderColor: '#374151',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryBtnTextDisabled: {
    color: '#6B7280',
    fontWeight: '600',
  },

  // Social Login
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
    borderRadius: 12,
    alignItems: 'center',
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});

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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export default function AuthScreen({ navigation, onLoginSuccess }) {
  // 'landing' | 'phone' | 'email'
  const [activeModal, setActiveModal] = useState(null);

  // Phone Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneUserName, setPhoneUserName] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isPhoneOtpVerified, setIsPhoneOtpVerified] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // Gmail / Email Form State
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailUserName, setEmailUserName] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const [loading, setLoading] = useState(false);

  // Modern Hot-Toast Floating Notification State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });

    Animated.spring(toastAnim, {
      toValue: 24,
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

  // ---------------- PHONE AUTH HANDLERS ----------------
  const handleSendPhoneOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setPhoneSending(true);
    try {
      const res = await api.post('/auth/send-sms-otp', { phoneNumber: cleanPhone });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setIsPhoneOtpVerified(false);
        setPhoneOtp('');
        showToast('Message Sent Successfully', 'success');
      } else {
        showToast(res.data.message || 'Failed to send OTP', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send SMS OTP', 'error');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!phoneOtp.trim() || phoneOtp.trim().length < 6) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setPhoneVerifying(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phoneNumber: cleanPhone,
        otp: phoneOtp.trim(),
      });
      if (res.data.success) {
        setIsPhoneOtpVerified(true);
        showToast('OTP Verified Successfully! ✅', 'success');
      } else {
        setIsPhoneOtpVerified(false);
        showToast(res.data.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
      }
    } catch (err) {
      setIsPhoneOtpVerified(false);
      showToast(err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handlePhoneLoginSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!isPhoneOtpVerified) {
      showToast('Please verify your OTP first', 'error');
      return;
    }
    if (!phoneUserName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/phone-login', {
        phoneNumber: cleanPhone,
        otp: phoneOtp.trim(),
        name: phoneUserName.trim(),
      });
      if (res.data.success) {
        showToast('Login Successful! Welcome 🎉', 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GMAIL / EMAIL AUTH HANDLERS ----------------
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Please enter a valid Gmail / Email address', 'error');
      return;
    }

    setEmailSending(true);
    try {
      const res = await api.post('/auth/send-email-otp', { email: cleanEmail });
      if (res.data.success) {
        setEmailOtpSent(true);
        setIsEmailOtpVerified(false);
        setEmailOtp('');
        showToast('Message Sent Successfully', 'success');
      } else {
        showToast(res.data.message || 'Failed to send OTP to email', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send Email OTP', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!emailOtp.trim() || emailOtp.trim().length < 6) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setEmailVerifying(true);
    try {
      const res = await api.post('/auth/verify-email-otp', {
        email: cleanEmail,
        otp: emailOtp.trim(),
      });
      if (res.data.success) {
        setIsEmailOtpVerified(true);
        showToast('OTP Verified Successfully! ✅', 'success');
      } else {
        setIsEmailOtpVerified(false);
        showToast(res.data.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
      }
    } catch (err) {
      setIsEmailOtpVerified(false);
      showToast(err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP', 'error');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleEmailLoginSubmit = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!isEmailOtpVerified) {
      showToast('Please verify your OTP first', 'error');
      return;
    }
    if (!emailUserName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/email-login', {
        email: cleanEmail,
        otp: emailOtp.trim(),
        name: emailUserName.trim(),
      });
      if (res.data.success) {
        showToast('Login Successful! Welcome 🎉', 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Hot-Toast */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'error' && styles.toastError,
            { top: toastAnim },
          ]}
        >
          <TouchableOpacity style={styles.toastInner} activeOpacity={0.9} onPress={hideToast}>
            <Text style={styles.toastIcon}>{toast.type === 'success' ? '✅' : '❌'}</Text>
            <Text style={styles.toastText}>{toast.message}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Decorative 3D Gaming & Music Background Icons */}
      <View style={styles.bgDecorations} pointerEvents="none">
        <Text style={[styles.floatingIcon, { top: '10%', left: '8%', fontSize: 38, opacity: 0.25 }]}>🎙️</Text>
        <Text style={[styles.floatingIcon, { top: '15%', right: '10%', fontSize: 34, opacity: 0.28 }]}>🎵</Text>
        <Text style={[styles.floatingIcon, { top: '22%', right: '15%', fontSize: 42, opacity: 0.2 }]}>🎲</Text>
        <Text style={[styles.floatingIcon, { top: '35%', left: '12%', fontSize: 44, opacity: 0.22 }]}>🎮</Text>
        <Text style={[styles.floatingIcon, { bottom: '28%', right: '8%', fontSize: 36, opacity: 0.3 }]}>⭐</Text>
        <Text style={[styles.floatingIcon, { bottom: '18%', left: '14%', fontSize: 48, opacity: 0.25 }]}>🎲</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header & Big "Yo!" Logo matching screenshot */}
        <View style={styles.brandHeader}>
          <View style={styles.yoLogoContainer}>
            <Text style={styles.yoTextY}>Y</Text>
            <View style={styles.yoBubbleContainer}>
              <Text style={styles.yoTextO}>o</Text>
              <View style={styles.speechDot} />
            </View>
            <Text style={styles.yoExclamation}>!</Text>
          </View>

          <Text style={styles.hindiTagline}>वॉइस चैट, प्ले गेम्स, दोस्त बनाएं</Text>
          <Text style={styles.englishTagline}>Voice Chat, Play Games, Make Friends</Text>
        </View>

        {/* MAIN BUTTONS or ACTIVE AUTH FORM */}
        {!activeModal ? (
          <View style={styles.actionButtonsContainer}>
            {/* 1. Google / Gmail Sign In Pill Button */}
            <TouchableOpacity
              style={styles.pillButton}
              activeOpacity={0.85}
              onPress={() => setActiveModal('email')}
            >
              <View style={styles.googleIconBadge}>
                <Text style={styles.googleIconLetter}>G</Text>
              </View>
              <Text style={styles.pillButtonText}>गूगल / Gmail के साथ साइन इन करें</Text>
            </TouchableOpacity>

            {/* 2. Phone SMS Sign In Pill Button */}
            <TouchableOpacity
              style={[styles.pillButton, styles.phonePillButton]}
              activeOpacity={0.85}
              onPress={() => setActiveModal('phone')}
            >
              <View style={styles.phoneIconBadge}>
                <Text style={styles.phoneIconText}>📱</Text>
              </View>
              <Text style={styles.pillButtonText}>मोबाइल नंबर के साथ साइन इन करें</Text>
            </TouchableOpacity>
          </View>
        ) : activeModal === 'phone' ? (
          /* Phone OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>📱 Mobile Phone Login</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Number Row */}
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.countryBadge}>
                <Text style={styles.countryBadgeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(val) => {
                  setPhoneNumber(val);
                  setIsPhoneOtpVerified(false);
                }}
              />
              <TouchableOpacity
                style={[styles.muiBtn, phoneOtpSent && styles.muiBtnResend]}
                onPress={handleSendPhoneOtp}
                disabled={phoneSending}
                activeOpacity={0.8}
              >
                {phoneSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.muiBtnText}>{phoneOtpSent ? 'Resend' : 'Get OTP'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP Field + Verify OTP Button */}
            {phoneOtpSent && (
              <View style={styles.fieldSpacing}>
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                  {isPhoneOtpVerified && <Text style={styles.verifiedText}>Verified ✅</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput, isPhoneOtpVerified && styles.inputVerified]}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isPhoneOtpVerified}
                    value={phoneOtp}
                    onChangeText={setPhoneOtp}
                  />
                  <TouchableOpacity
                    style={[styles.muiVerifyBtn, isPhoneOtpVerified && styles.muiVerifyBtnSuccess]}
                    onPress={handleVerifyPhoneOtp}
                    disabled={phoneVerifying || isPhoneOtpVerified}
                    activeOpacity={0.8}
                  >
                    {phoneVerifying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.muiVerifyBtnText}>
                        {isPhoneOtpVerified ? 'Verified ✅' : 'Verify OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mandatory Name */}
            <Text style={styles.inputLabel}>
              Your Full Name <Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#9CA3AF"
              value={phoneUserName}
              onChangeText={setPhoneUserName}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primarySubmitBtn, !isPhoneOtpVerified && styles.primaryBtnLocked]}
              onPress={handlePhoneLoginSubmit}
              disabled={loading || !isPhoneOtpVerified}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primarySubmitBtnText, !isPhoneOtpVerified && styles.primaryBtnTextLocked]}>
                  {isPhoneOtpVerified ? 'Verify & Login' : 'Verify OTP First 🔒'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Gmail / Email OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>✉️ Gmail / Email Login</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Email Address Row */}
            <Text style={styles.inputLabel}>Gmail / Email Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="youremail@gmail.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setIsEmailOtpVerified(false);
                }}
              />
              <TouchableOpacity
                style={[styles.muiBtn, emailOtpSent && styles.muiBtnResend]}
                onPress={handleSendEmailOtp}
                disabled={emailSending}
                activeOpacity={0.8}
              >
                {emailSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.muiBtnText}>{emailOtpSent ? 'Resend' : 'Get OTP'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Email OTP Field + Verify OTP Button */}
            {emailOtpSent && (
              <View style={styles.fieldSpacing}>
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>Enter 6-Digit Email OTP</Text>
                  {isEmailOtpVerified && <Text style={styles.verifiedText}>Verified ✅</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput, isEmailOtpVerified && styles.inputVerified]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isEmailOtpVerified}
                    value={emailOtp}
                    onChangeText={setEmailOtp}
                  />
                  <TouchableOpacity
                    style={[styles.muiVerifyBtn, isEmailOtpVerified && styles.muiVerifyBtnSuccess]}
                    onPress={handleVerifyEmailOtp}
                    disabled={emailVerifying || isEmailOtpVerified}
                    activeOpacity={0.8}
                  >
                    {emailVerifying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.muiVerifyBtnText}>
                        {isEmailOtpVerified ? 'Verified ✅' : 'Verify OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mandatory Name */}
            <Text style={styles.inputLabel}>
              Your Full Name <Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#9CA3AF"
              value={emailUserName}
              onChangeText={setEmailUserName}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primarySubmitBtn, !isEmailOtpVerified && styles.primaryBtnLocked]}
              onPress={handleEmailLoginSubmit}
              disabled={loading || !isEmailOtpVerified}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primarySubmitBtnText, !isEmailOtpVerified && styles.primaryBtnTextLocked]}>
                  {isEmailOtpVerified ? 'Verify & Login' : 'Verify OTP First 🔒'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Language Selector & Terms matching screenshot */}
        <View style={styles.footerSection}>
          <TouchableOpacity style={styles.langPill} activeOpacity={0.8}>
            <Text style={styles.langPillText}>🌐 हिन्दी (Hindi)  ›</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            जारी रखकर आप <Text style={styles.termsLink}>&lt;&lt;सेवा की शर्तें&gt;&gt;</Text> और{' '}
            <Text style={styles.termsLink}>&lt;&lt;गोपनीयता नीति&gt;&gt;</Text> से सहमत होते हैं
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1FD866', // Vibrant energetic gaming green
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 24,
    alignItems: 'center',
  },

  // Floating background icons
  bgDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingIcon: {
    position: 'absolute',
    color: '#0D8F40',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 24, 33, 0.96)',
    borderWidth: 1.5,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
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
  toastIcon: {
    fontSize: 16,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },

  // Brand Header
  brandHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  yoLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  yoTextY: {
    fontSize: 76,
    fontWeight: '900',
    color: '#F4EB3B', // Vibrant cartoon yellow
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? 'Impact, sans-serif' : undefined,
  },
  yoBubbleContainer: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#F4EB3B',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  yoTextO: {
    display: 'none',
  },
  speechDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E232A',
    borderBottomRightRadius: 4,
  },
  yoExclamation: {
    fontSize: 76,
    fontWeight: '900',
    color: '#F4EB3B',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? 'Impact, sans-serif' : undefined,
  },
  hindiTagline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  englishTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  // Action Buttons
  actionButtonsContainer: {
    width: '100%',
    maxWidth: 380,
    gap: 16,
    marginVertical: 20,
  },
  pillButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  phonePillButton: {
    backgroundColor: '#FFFFFF',
  },
  googleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  googleIconLetter: {
    color: '#EA4335',
    fontWeight: '900',
    fontSize: 20,
  },
  phoneIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  phoneIconText: {
    fontSize: 18,
  },
  pillButtonText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
  },

  // Auth Form Card Modal
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginVertical: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#6B7280',
    fontWeight: '800',
    fontSize: 13,
  },

  inputLabel: {
    color: '#374151',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
  },
  labelFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  star: {
    color: '#EF4444',
  },
  verifiedText: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 11.5,
  },
  fieldSpacing: {
    marginTop: 4,
    marginBottom: 4,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  countryBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryBadgeText: {
    color: '#1F2937',
    fontWeight: '800',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  flexInput: {
    flex: 1,
  },
  inputVerified: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },

  // Material UI Buttons
  muiBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  muiBtnResend: {
    backgroundColor: '#6B7280',
  },
  muiBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  muiVerifyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 92,
  },
  muiVerifyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  muiVerifyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // Primary Login Submit Button
  primarySubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnLocked: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryBtnTextLocked: {
    color: '#9CA3AF',
  },

  // Footer
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#FFFFFF',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

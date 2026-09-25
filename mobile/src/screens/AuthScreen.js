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
  ScrollView,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';

// Clean Crisp Vector Google "G" Icon
const GoogleGIcon = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

// High-Tech Cyber Smartphone Vector Icon
const CyberPhoneIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="3.5" stroke="#00F0FF" strokeWidth="2" fill="#0A2540" />
    <Circle cx="12" cy="18" r="1.3" fill="#00F0FF" />
    <Path d="M10 5H14" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export default function AuthScreen({ navigation, onLoginSuccess }) {
  // 'phone' | 'email' | null
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
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'email' | 'phone' | null
  const [loading, setLoading] = useState(false);

  // Continuous Dynamic Floating Background Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating loop 1 (Vertical sway)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: -18,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Floating loop 2 (Opposite rhythm + scale)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 16,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    // Floating loop 3 (Gentle float)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, {
          toValue: -14,
          duration: 2900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim3, {
          toValue: 0,
          duration: 2900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  // Floating Hot-Toast Notification State
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

  // Completely Reset All State on Modal Close
  const handleCloseModal = () => {
    setActiveModal(null);
    // Reset Phone
    setPhoneNumber('');
    setPhoneOtp('');
    setPhoneUserName('');
    setPhoneOtpSent(false);
    setIsPhoneOtpVerified(false);
    setPhoneSending(false);
    setPhoneVerifying(false);

    // Reset Email
    setEmail('');
    setEmailOtp('');
    setEmailUserName('');
    setEmailOtpSent(false);
    setIsEmailOtpVerified(false);
    setEmailSending(false);
    setEmailVerifying(false);
  };

  // Open fresh modal
  const handleOpenModal = (type) => {
    handleCloseModal();
    setActiveModal(type);
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

      {/* Dynamic Animated Movable 3D Gaming & Music Background Icons */}
      <View style={styles.bgDecorations} pointerEvents="none">
        {/* Ambient Glow Orbs */}
        <View style={[styles.ambientGlowOrb, { top: -40, left: -40, backgroundColor: '#34D399' }]} />
        <View style={[styles.ambientGlowOrb, { bottom: 50, right: -40, backgroundColor: '#10B981' }]} />

        {/* Movable Icon Group 1 */}
        <Animated.View style={[styles.floatingWrap, { top: '8%', left: '8%', transform: [{ translateY: floatAnim1 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 42 }]}>🎙️</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingWrap, { top: '14%', right: '9%', transform: [{ translateY: floatAnim2 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 36 }]}>🎧</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingWrap, { top: '24%', left: '80%', transform: [{ translateY: floatAnim1 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 38 }]}>💎</Text>
        </Animated.View>

        {/* Movable Icon Group 2 */}
        <Animated.View style={[styles.floatingWrap, { top: '38%', left: '10%', transform: [{ translateY: floatAnim3 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 44 }]}>🎮</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingWrap, { bottom: '26%', right: '10%', transform: [{ translateY: floatAnim1 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 40 }]}>👑</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingWrap, { bottom: '16%', left: '12%', transform: [{ translateY: floatAnim2 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 46 }]}>🎲</Text>
        </Animated.View>

        <Animated.View style={[styles.floatingWrap, { bottom: '34%', left: '76%', transform: [{ translateY: floatAnim3 }] }]}>
          <Text style={[styles.floatingIcon, { fontSize: 34 }]}>🎵</Text>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header & Big "Yo!" Logo matching screenshot */}
        <View style={styles.brandHeader}>
          <View style={styles.yoLogoContainer}>
            <Text style={styles.yoTextY}>Y</Text>
            <View style={styles.yoBubbleContainer}>
              <View style={styles.speechDot} />
            </View>
            <Text style={styles.yoExclamation}>!</Text>
          </View>

          <Text style={styles.hindiTagline}>वॉइस चैट, प्ले गेम्स, दोस्त बनाएं</Text>
          <Text style={styles.englishTagline}>Voice Chat, Play Games, Make Friends</Text>
        </View>

        {/* MAIN BUTTONS or ACTIVE AUTH MODAL FORM */}
        {!activeModal ? (
          <View style={styles.actionButtonsContainer}>
            {/* 1. Google / Gmail Sign In Premium Pill */}
            <TouchableOpacity
              style={[
                styles.premiumPillButton,
                hoveredBtn === 'email' && styles.premiumPillButtonHoveredGoogle,
              ]}
              activeOpacity={0.88}
              onPress={() => handleOpenModal('email')}
              onMouseEnter={() => setHoveredBtn('email')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <View style={[styles.googleIconBadge, hoveredBtn === 'email' && styles.iconBadgeHovered]}>
                <GoogleGIcon size={24} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.premiumButtonTitle}>गूगल / Gmail के साथ साइन इन करें</Text>
                <Text style={styles.premiumButtonSub}>Instant 6-Digit Email OTP</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Mobile Phone Sign In Premium Pill */}
            <TouchableOpacity
              style={[
                styles.premiumPillButton,
                styles.phonePillGlow,
                hoveredBtn === 'phone' && styles.premiumPillButtonHoveredPhone,
              ]}
              activeOpacity={0.88}
              onPress={() => handleOpenModal('phone')}
              onMouseEnter={() => setHoveredBtn('phone')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <View style={[styles.phoneIconBadge, hoveredBtn === 'phone' && styles.phoneBadgeHovered]}>
                <CyberPhoneIcon size={24} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.premiumButtonTitle}>मोबाइल नंबर के साथ साइन इन करें</Text>
                <Text style={styles.premiumButtonSub}>Fast SMS Verification Code</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : activeModal === 'phone' ? (
          /* Phone OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <CyberPhoneIcon size={20} />
                <Text style={styles.cardTitle}>Mobile Phone Login</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
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
                  <Text style={styles.inputLabel}>Enter 6-Digit SMS OTP</Text>
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
                  {isPhoneOtpVerified ? 'Verify & Login' : 'Verify OTP First to Login 🔒'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Gmail / Email OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <GoogleGIcon size={20} />
                <Text style={styles.cardTitle}>Gmail / Email Login</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
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
                <Text style={styles.spamHelperText}>💡 Check your Gmail Inbox & Spam folder</Text>
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
                  {isEmailOtpVerified ? 'Verify & Login' : 'Verify OTP First to Login 🔒'}
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
    backgroundColor: '#12C85A', // Rich vibrant emerald gamer background
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 36 : 56,
    paddingBottom: 24,
    alignItems: 'center',
  },

  // Dynamic Animated Movable 3D Icons
  bgDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlowOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.3,
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
  },
  floatingWrap: {
    position: 'absolute',
  },
  floatingIcon: {
    opacity: 0.32,
    textShadowColor: 'rgba(0, 50, 20, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
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
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
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
    marginTop: 16,
    marginBottom: 24,
  },
  yoLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  yoTextY: {
    fontSize: 78,
    fontWeight: '900',
    color: '#F4EB3B', // Vibrant cartoon yellow
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? 'Impact, Arial Black, sans-serif' : undefined,
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
  speechDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E232A',
    borderBottomRightRadius: 4,
  },
  yoExclamation: {
    fontSize: 78,
    fontWeight: '900',
    color: '#F4EB3B',
    textShadowColor: 'rgba(0, 0, 0, 0.22)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? 'Impact, Arial Black, sans-serif' : undefined,
  },
  hindiTagline: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  englishTagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },

  // Premium Pill Action Buttons
  actionButtonsContainer: {
    width: '100%',
    maxWidth: 390,
    gap: 16,
    marginVertical: 18,
  },
  premiumPillButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
    transition: Platform.OS === 'web' ? 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
  },
  premiumPillButtonHoveredGoogle: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    transform: [{ scale: 1.025 }, { translateY: -2 }],
  },
  premiumPillButtonHoveredPhone: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    transform: [{ scale: 1.025 }, { translateY: -2 }],
  },
  phonePillGlow: {
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  googleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    transition: Platform.OS === 'web' ? 'transform 0.28s ease' : undefined,
  },
  iconBadgeHovered: {
    transform: [{ scale: 1.12 }],
    borderColor: '#10B981',
  },
  phoneIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#00F0FF',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    transition: Platform.OS === 'web' ? 'transform 0.28s ease' : undefined,
  },
  phoneBadgeHovered: {
    transform: [{ scale: 1.12 }],
    shadowOpacity: 0.6,
  },
  btnTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  premiumButtonTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  premiumButtonSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  // Auth Card Modal
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  cardHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 13,
  },

  inputLabel: {
    color: '#334155',
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
  spamHelperText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  countryBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  countryBadgeText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
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
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  muiBtnResend: {
    backgroundColor: '#64748B',
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
    minWidth: 94,
  },
  muiVerifyBtnSuccess: {
    backgroundColor: '#10B981',
  },
  muiVerifyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  // Primary Submit Button
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
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  primaryBtnTextLocked: {
    color: '#94A3B8',
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
    color: 'rgba(255, 255, 255, 0.95)',
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

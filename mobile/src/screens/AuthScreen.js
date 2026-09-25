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
  Easing,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';
import ScreenContainer from '../components/ScreenContainer';
import { useLanguage } from '../context/LanguageContext';

// Official Multi-Color Gmail 'M' Vector Icon (matching user reference screenshot)
const GmailOfficialIcon = ({ size = 26 }) => (
  <Svg width={size} height={(size * 38) / 48} viewBox="0 0 48 38" fill="none">
    {/* Left Blue Pillar with bottom-left rounded corner */}
    <Path
      d="M4 14.5L14 21V38H8a4 4 0 0 1-4-4V14.5z"
      fill="#4285F4"
    />
    {/* Right Green Pillar with bottom-right rounded corner */}
    <Path
      d="M44 14.5L34 21V38h6a4 4 0 0 0 4-4V14.5z"
      fill="#34A853"
    />
    {/* Top Right Amber/Yellow Fold */}
    <Path
      d="M34 21V7.8a3.2 3.2 0 0 1 5.1-2.5L44 9.5v5z"
      fill="#FBBC04"
    />
    {/* Top Left Dark Red Corner Shadow */}
    <Path
      d="M4 14.5v-5l4.9-4.2a3.2 3.2 0 0 1 5.1 2.5V21z"
      fill="#C5221F"
    />
    {/* Center Vibrant Red Envelope V Flap */}
    <Path
      d="M14 21L24 28.5 34 21V7.8a3.2 3.2 0 0 0-5.1-2.5L24 9.2l-4.9-3.9A3.2 3.2 0 0 0 14 7.8V21z"
      fill="#EA4335"
    />
  </Svg>
);

// Classic Blue Telephone Handset Vector Icon
const PhoneHandsetIcon = ({ size = 22, color = '#0284C7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.047 15.047 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1.01A11.36 11.36 0 0 1 8.57 3.9c0-.55-.45-1-1-1H3.97c-.55 0-1 .45-1 1C2.97 13.56 10.44 21.03 19.97 21.03c.55 0 1-.45 1-1v-3.65c0-.55-.45-1-.96-1z" />
  </Svg>
);

export default function AuthScreen({ navigation, onLoginSuccess }) {
  const { t, openLanguageModal, activeLanguagePillText } = useLanguage();

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
  const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null); // 'email' | 'phone' | null
  const [loading, setLoading] = useState(false);

  // Scroll View Ref for automatic keyboard focus scrolling
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (activeModal) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 60);
        }
      }
    );
    return () => {
      showSub.remove();
    };
  }, [activeModal]);

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
  const toastAnim = useRef(new Animated.Value(-120)).current;
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });

    Animated.spring(toastAnim, {
      toValue: 0,
      friction: 7,
      tension: 50,
      useNativeDriver: true,
    }).start();

    toastTimerRef.current = setTimeout(() => {
      hideToast();
    }, 3500);
  };

  const hideToast = () => {
    Animated.timing(toastAnim, {
      toValue: -120,
      duration: 260,
      useNativeDriver: true,
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
      showToast(t('msgValidPhone', 'Please enter a valid 10-digit mobile number'), 'error');
      return;
    }

    setPhoneSending(true);
    try {
      const res = await api.post('/auth/send-sms-otp', { phoneNumber: cleanPhone });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setIsPhoneOtpVerified(false);
        setPhoneOtp('');
        showToast(t('msgOtpSent', 'Message Sent Successfully'), 'success');
      } else {
        showToast(res.data.message || t('msgOtpFailed', 'Failed to send OTP'), 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('msgOtpFailed', 'Failed to send SMS OTP'), 'error');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!phoneOtp.trim() || phoneOtp.trim().length < 6) {
      showToast(t('msgEnter6DigitOtp', 'Please enter the 6-digit OTP code'), 'error');
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
        showToast(t('msgOtpVerified', 'OTP Verified Successfully! ✅'), 'success');
      } else {
        setIsPhoneOtpVerified(false);
        showToast(res.data.message || t('msgWrongOtp', 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
      }
    } catch (err) {
      setIsPhoneOtpVerified(false);
      showToast(err.response?.data?.message || t('msgWrongOtp', 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
    } finally {
      setPhoneVerifying(false);
    }
  };

  const handlePhoneLoginSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!isPhoneOtpVerified) {
      showToast(t('msgVerifyOtpFirst', 'Please verify your OTP first'), 'error');
      return;
    }
    if (!phoneUserName.trim()) {
      showToast(t('msgEnterFullName', 'Please enter your full name'), 'error');
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
        showToast(t('msgLoginSuccess', 'Login Successful! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('msgLoginFailed', 'Login failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GMAIL / EMAIL AUTH HANDLERS ----------------
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast(t('msgValidEmail', 'Please enter a valid Gmail / Email address'), 'error');
      return;
    }

    setEmailSending(true);
    try {
      const res = await api.post('/auth/send-email-otp', { email: cleanEmail });
      if (res.data.success) {
        setEmailOtpSent(true);
        setIsEmailOtpVerified(false);
        setEmailOtp('');
        showToast(t('msgOtpSent', 'Message Sent Successfully'), 'success');
      } else {
        showToast(res.data.message || t('msgOtpFailed', 'Failed to send OTP to email'), 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('msgOtpFailed', 'Failed to send Email OTP'), 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!emailOtp.trim() || emailOtp.trim().length < 6) {
      showToast(t('msgEnter6DigitOtp', 'Please enter the 6-digit OTP code'), 'error');
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
        showToast(t('msgOtpVerified', 'OTP Verified Successfully! ✅'), 'success');
      } else {
        setIsEmailOtpVerified(false);
        showToast(res.data.message || t('msgWrongOtp', 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
      }
    } catch (err) {
      setIsEmailOtpVerified(false);
      showToast(err.response?.data?.message || t('msgWrongOtp', 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleEmailLoginSubmit = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!isEmailOtpVerified) {
      showToast(t('msgVerifyOtpFirst', 'Please verify your OTP first'), 'error');
      return;
    }
    if (!emailUserName.trim()) {
      showToast(t('msgEnterFullName', 'Please enter your full name'), 'error');
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
        showToast(t('msgLoginSuccess', 'Login Successful! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(err.response?.data?.message || t('msgLoginFailed', 'Login failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#12C85A"
      contentContainerStyle={styles.scrollContent}
      scrollRef={scrollViewRef}
    >
      {/* Floating Hot-Toast */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'error' && styles.toastError,
            { transform: [{ translateY: toastAnim }] },
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

      {/* Top Header & Big "Yo!" Logo matching screenshot */}
      <View style={styles.brandHeader}>
        <View style={styles.yoLogoContainer}>
          <Text style={styles.yoTextY}>Y</Text>
          <View style={styles.yoBubbleContainer}>
            <View style={styles.speechDot} />
          </View>
          <Text style={styles.yoExclamation}>!</Text>
        </View>

        <Text style={styles.hindiTagline}>{t('Voice Chat, Play Games, Make Friends')}</Text>
        <Text style={styles.englishTagline}>{t('Connect with millions around the world')}</Text>
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
                <GmailOfficialIcon size={24} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.premiumButtonTitle}>{t('Sign in with Google / Gmail')}</Text>
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
                <PhoneHandsetIcon size={22} color="#0284C7" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.premiumButtonTitle}>{t('Sign in with Phone Number')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : activeModal === 'phone' ? (
          /* Phone OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <PhoneHandsetIcon size={20} color="#0284C7" />
                <Text style={styles.cardTitle}>{t('Mobile Phone Login')}</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Number Row */}
            <Text style={styles.inputLabel}>{t('Mobile Number')}</Text>
            <View style={styles.inputRow}>
              <View style={styles.phoneInputCombined}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryBadgeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneTextInputInside}
                  placeholder={t('Enter 10-digit number')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onChangeText={(val) => {
                    setPhoneNumber(val);
                    setIsPhoneOtpVerified(false);
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.muiBtn, phoneOtpSent && styles.muiBtnResend]}
                onPress={handleSendPhoneOtp}
                disabled={phoneSending}
                activeOpacity={0.8}
              >
                {phoneSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.muiBtnText}>{phoneOtpSent ? t('Resend') : t('Get OTP')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP Field + Verify OTP Button */}
            {phoneOtpSent && (
              <View style={styles.fieldSpacing}>
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>{t('Enter 6-Digit SMS OTP')}</Text>
                  {isPhoneOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput, isPhoneOtpVerified && styles.inputVerified]}
                    placeholder={t('Enter 6-digit OTP')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isPhoneOtpVerified}
                    value={phoneOtp}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
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
                        {isPhoneOtpVerified ? t('Verified ✅') : t('Verify OTP')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mandatory Name */}
            <Text style={styles.inputLabel}>
              {t('Your Full Name')} <Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('e.g. Rahul Sharma')}
              placeholderTextColor="#9CA3AF"
              value={phoneUserName}
              onFocus={() => {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
              }}
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
                  {isPhoneOtpVerified ? t('Verify & Login') : t('Verify OTP First to Login 🔒')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Gmail / Email OTP Modal Card */
          <View style={styles.authCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <GmailOfficialIcon size={22} />
                <Text style={styles.cardTitle}>{t('Gmail / Email Login')}</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Email Address Row */}
            <Text style={styles.inputLabel}>{t('Gmail / Email Address')}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder={t('Enter your email')}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onFocus={() => {
                  setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                }}
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
                  <Text style={styles.muiBtnText}>{emailOtpSent ? t('Resend') : t('Get OTP')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Email OTP Field + Verify OTP Button */}
            {emailOtpSent && (
              <View style={styles.fieldSpacing}>
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>{t('Enter 6-Digit Email OTP')}</Text>
                  {isEmailOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput, isEmailOtpVerified && styles.inputVerified]}
                    placeholder={t('Enter 6-digit OTP')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isEmailOtpVerified}
                    value={emailOtp}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
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
                        {isEmailOtpVerified ? t('Verified ✅') : t('Verify OTP')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.spamHelperText}>💡 {t('Check your Gmail Inbox & Spam folder')}</Text>
              </View>
            )}

            {/* Mandatory Name */}
            <Text style={styles.inputLabel}>
              {t('Your Full Name')} <Text style={styles.star}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('e.g. Rahul Sharma')}
              placeholderTextColor="#9CA3AF"
              value={emailUserName}
              onFocus={() => {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
              }}
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
                  {isEmailOtpVerified ? t('Verify & Login') : t('Verify OTP First to Login 🔒')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Language Selector & Terms matching user requirement */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.langPill}
            activeOpacity={0.8}
            onPress={openLanguageModal}
          >
            <Text style={styles.langPillText}>{activeLanguagePillText}  ›</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            {t('By continuing, you agree to our')}{' '}
            <Text style={styles.termsLink}>&lt;&lt;{t('Terms of Service')}&gt;&gt;</Text> {t('and')}{' '}
            <Text style={styles.termsLink}>&lt;&lt;{t('Privacy Policy')}&gt;&gt;</Text>
          </Text>
        </View>
    </ScreenContainer>
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'android' ? 36 : 24,
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
    top: Platform.OS === 'web' ? 24 : 44,
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#0284C7',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    transition: Platform.OS === 'web' ? 'transform 0.28s ease' : undefined,
  },
  phoneBadgeHovered: {
    transform: [{ scale: 1.12 }],
    borderColor: '#0284C7',
    shadowOpacity: 0.35,
  },
  btnTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  premiumButtonTitle: {
    color: '#0F172A',
    fontSize: 15.5,
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
    width: '100%',
  },
  phoneInputCombined: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryBadgeText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13,
  },
  phoneTextInputInside: {
    flex: 1,
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 78,
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
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
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
    marginTop: 16,
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
    marginTop: 18,
    paddingBottom: Platform.OS === 'android' ? 24 : 12,
    gap: 10,
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
    paddingHorizontal: 12,
  },
  termsLink: {
    color: '#FFFFFF',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

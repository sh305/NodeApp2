import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Keyboard,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import api from '../api/client';
import ScreenContainer from '../components/ScreenContainer';
import LanguageSelectorButton from '../components/LanguageSelectorButton';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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

// Interactive Animated Pill Button with Rich Hover (Web) & Press (Phone) Spring Physics
const InteractivePillButton = ({ onPress, variant = 'google', icon, title }) => {
  const isGoogle = variant === 'google';
  const [isHovered, setIsHovered] = useState(false);

  // Animated values for silky spring scaling, lift, rotation, and luminous glow
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Immediately cancel ongoing animations so mouse enter / exit never gets stuck
  const stopAllAnims = () => {
    scaleAnim.stopAnimation();
    translateYAnim.stopAnimation();
    iconScaleAnim.stopAnimation();
    iconRotateAnim.stopAnimation();
    glowAnim.stopAnimation();
  };

  const triggerHoverIn = () => {
    setIsHovered(true);
    stopAllAnims();
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.035,
        friction: 5,
        tension: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(translateYAnim, {
        toValue: -4,
        friction: 5,
        tension: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1.2,
        friction: 4,
        tension: 110,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Visible 24-degree dynamic rotation
      Animated.spring(iconRotateAnim, {
        toValue: isGoogle ? -1 : 1,
        friction: 4,
        tension: 110,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const triggerHoverOut = () => {
    setIsHovered(false);
    stopAllAnims();
    // Return all values back to normal promptly and cleanly
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 7,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Reset rotation back to 0 immediately
      Animated.spring(iconRotateAnim, {
        toValue: 0,
        friction: 6,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const triggerPressIn = () => {
    stopAllAnims();
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 5,
        tension: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(translateYAnim, {
        toValue: 1.5,
        friction: 5,
        tension: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 0.94,
        friction: 5,
        tension: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(iconRotateAnim, {
        toValue: 0,
        friction: 6,
        tension: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const triggerPressOut = () => {
    if (isHovered) {
      triggerHoverIn();
    } else {
      triggerHoverOut();
    }
  };

  // Distinct visible rotation: 24 degrees
  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-24deg', '0deg', '24deg'],
  });

  const animatedBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.9)', isGoogle ? '#10B981' : '#0284C7'],
  });

  const animatedBgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', isGoogle ? '#F0FDF4' : '#F0F9FF'],
  });

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.42],
  });

  const animatedShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 22],
  });

  return (
    <Animated.View
      style={[
        styles.animatedPillOuter,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
      onMouseEnter={triggerHoverIn}
      onMouseLeave={triggerHoverOut}
    >
      <Pressable
        onPress={onPress}
        onPressIn={triggerPressIn}
        onPressOut={triggerPressOut}
        onHoverIn={triggerHoverIn}
        onHoverOut={triggerHoverOut}
        style={styles.pressableFull}
      >
        <Animated.View
          style={[
            styles.premiumPillButton,
            {
              backgroundColor: animatedBgColor,
              borderColor: animatedBorderColor,
              shadowColor: isGoogle ? '#10B981' : '#0284C7',
              shadowOpacity: animatedShadowOpacity,
              shadowRadius: animatedShadowRadius,
            },
          ]}
        >
          {/* Animated Rotated + Scaled Icon with pointerEvents none */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.iconBadgeAnimWrap,
              {
                transform: [
                  { scale: iconScaleAnim },
                  { rotate: iconRotation },
                ],
              },
            ]}
          >
            {icon}
          </Animated.View>

          <View pointerEvents="none" style={styles.btnTextCol}>
            <Text style={styles.premiumButtonTitle}>{title}</Text>
          </View>

          {/* Micro arrow icon that glides forward when hovered/touched */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.arrowBadgeWrap,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
                transform: [
                  {
                    translateX: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 5],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 5l7 7-7 7"
                stroke={isGoogle ? '#10B981' : '#0284C7'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function AuthScreen({ navigation, onLoginSuccess }) {
  const { t, openLanguageModal, activeLanguagePillText } = useLanguage();
  const { showToast } = useToast();

  // 'phone' | 'email' | null
  const [activeModal, setActiveModal] = useState(null);

  // Phone Form State
  const [phoneMode, setPhoneMode] = useState('login'); // 'login' | 'register'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [phoneConfirmPassword, setPhoneConfirmPassword] = useState('');
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [showPhoneConfirmPassword, setShowPhoneConfirmPassword] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneUserName, setPhoneUserName] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isPhoneOtpVerified, setIsPhoneOtpVerified] = useState(false);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // Gmail / Email Form State
  const [gmailMode, setGmailMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailUserName, setEmailUserName] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
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

  // Completely Reset All State on Modal Close
  const handleCloseModal = () => {
    setActiveModal(null);
    // Reset Phone
    setPhoneMode('login');
    setPhoneNumber('');
    setPhonePassword('');
    setPhoneConfirmPassword('');
    setShowPhonePassword(false);
    setShowPhoneConfirmPassword(false);
    setPhoneOtp('');
    setPhoneUserName('');
    setPhoneOtpSent(false);
    setIsPhoneOtpVerified(false);
    setPhoneSending(false);
    setPhoneVerifying(false);

    // Reset Email
    setGmailMode('login');
    setEmail('');
    setEmailPassword('');
    setEmailConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      showToast(t('Please enter a valid 10-digit mobile number'), 'error');
      return;
    }

    setPhoneSending(true);
    try {
      const res = await api.post('/auth/send-sms-otp', { phoneNumber: cleanPhone });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setIsPhoneOtpVerified(false);
        setPhoneOtp('');
        showToast(t(res.data.message || 'SMS OTP code sent to your mobile!'), 'success');
      } else {
        showToast(t(res.data.message || 'Failed to send OTP'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to send SMS OTP'), 'error');
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!phoneOtp.trim() || phoneOtp.trim().length < 6) {
      showToast(t('Please enter the 6-digit OTP code'), 'error');
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
        showToast(t('OTP Verified Successfully! ✅'), 'success');
      } else {
        setIsPhoneOtpVerified(false);
        showToast(t(res.data.message || 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
      }
    } catch (err) {
      setIsPhoneOtpVerified(false);
      showToast(t(err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
    } finally {
      setPhoneVerifying(false);
    }
  };

  // Register User with Phone + Verified OTP + Password
  const handlePhoneRegisterSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast(t('Please enter a valid 10-digit mobile number'), 'error');
      return;
    }
    if (!isPhoneOtpVerified) {
      showToast(t('Please verify your OTP first'), 'error');
      return;
    }
    if (!phoneUserName.trim()) {
      showToast(t('Please enter your full name'), 'error');
      return;
    }
    if (!phonePassword || phonePassword.length < 4) {
      showToast(t('Password must be at least 4 characters long'), 'error');
      return;
    }
    if (phonePassword !== phoneConfirmPassword) {
      showToast(t('Password and Confirm Password do not match!'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/phone-register', {
        phoneNumber: cleanPhone,
        name: phoneUserName.trim(),
        password: phonePassword,
        confirmPassword: phoneConfirmPassword,
      });
      if (res.data.success) {
        showToast(t(res.data.message || 'Registration Successful! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Registration failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Login User with Mobile Number + Password
  const handlePhonePasswordLoginSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast(t('Please enter a valid 10-digit mobile number'), 'error');
      return;
    }
    if (!phonePassword || !phonePassword.trim()) {
      showToast(t('Please enter your password'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/phone-login', {
        phoneNumber: cleanPhone,
        password: phonePassword,
      });
      if (res.data.success) {
        showToast(t(res.data.message || 'Password Verified Successfully! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Invalid mobile number or password'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GMAIL / EMAIL AUTH HANDLERS ----------------

  // 1. Send OTP to Gmail
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast(t('Please enter a valid Gmail / Email address'), 'error');
      return;
    }

    setEmailSending(true);
    try {
      const res = await api.post('/auth/send-email-otp', { email: cleanEmail });
      if (res.data.success) {
        setEmailOtpSent(true);
        setIsEmailOtpVerified(false);
        setEmailOtp(''); // Khali rahega taaki user apni real email se OTP dekh kar dale
        showToast(t(res.data.message || 'OTP code sent to your Gmail inbox!'), 'success');
      } else {
        showToast(t(res.data.message || 'Failed to send OTP to email'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to send Email OTP'), 'error');
    } finally {
      setEmailSending(false);
    }
  };

  // 2. Verify Gmail OTP
  const handleVerifyEmailOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!emailOtp.trim() || emailOtp.trim().length < 6) {
      showToast(t('Please enter the 6-digit OTP code'), 'error');
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
        showToast(t('OTP Verified Successfully! ✅'), 'success');
      } else {
        setIsEmailOtpVerified(false);
        showToast(t(res.data.message || 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
      }
    } catch (err) {
      setIsEmailOtpVerified(false);
      showToast(t(err.response?.data?.message || 'Wrong OTP! Please enter correct 6 digit OTP'), 'error');
    } finally {
      setEmailVerifying(false);
    }
  };

  // 3. Register User with Gmail + Verified OTP + Password
  const handleEmailRegisterSubmit = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast(t('Please enter a valid Gmail / Email address'), 'error');
      return;
    }
    if (!isEmailOtpVerified) {
      showToast(t('Please verify your OTP first'), 'error');
      return;
    }
    if (!emailUserName.trim()) {
      showToast(t('Please enter your full name'), 'error');
      return;
    }
    if (!emailPassword || emailPassword.length < 4) {
      showToast(t('Password must be at least 4 characters long'), 'error');
      return;
    }
    if (emailPassword !== emailConfirmPassword) {
      showToast(t('Password and Confirm Password do not match!'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/email-register', {
        email: cleanEmail,
        name: emailUserName.trim(),
        password: emailPassword,
        confirmPassword: emailConfirmPassword,
      });
      if (res.data.success) {
        showToast(t(res.data.message || 'Registration Successful! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Registration failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Login User with Gmail + Password
  const handleEmailPasswordLoginSubmit = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast(t('Please enter a valid Gmail / Email address'), 'error');
      return;
    }
    if (!emailPassword || !emailPassword.trim()) {
      showToast(t('Please enter your password'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/email-login', {
        email: cleanEmail,
        password: emailPassword,
      });
      if (res.data.success) {
        showToast(t(res.data.message || 'Password Verified Successfully! Welcome 🎉'), 'success');
        await AsyncStorage.setItem('@auth_token', res.data.token);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Invalid email or password'), 'error');
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
            <InteractivePillButton
              variant="google"
              onPress={() => handleOpenModal('email')}
              icon={<GmailOfficialIcon size={38} />}
              title={t('Sign in with Google / Gmail')}
            />

            {/* 2. Mobile Phone Sign In Premium Pill */}
            <InteractivePillButton
              variant="phone"
              onPress={() => handleOpenModal('phone')}
              icon={<PhoneHandsetIcon size={28} color="#0284C7" />}
              title={t('Sign in with Phone Number')}
            />
          </View>
        ) : activeModal === 'phone' ? (
          /* Mobile Phone Tabbed Modal Card (Login User vs Register User) */
          <View style={styles.authCard}>
            {/* Modal Header */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <PhoneHandsetIcon size={22} color="#0284C7" />
                <Text style={styles.cardTitle}>
                  {phoneMode === 'register' ? t('Register New Account') : t('Mobile Number Login')}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 2 Beautiful Toggle Buttons (Login User vs Register User) */}
            <View style={styles.tabSwitcherContainer}>
              <TouchableOpacity
                style={[styles.tabButton, phoneMode === 'login' && styles.tabButtonActive]}
                onPress={() => setPhoneMode('login')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, phoneMode === 'login' && styles.tabButtonTextActive]}>
                  🔑 {t('Login User')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, phoneMode === 'register' && styles.tabButtonActive]}
                onPress={() => setPhoneMode('register')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, phoneMode === 'register' && styles.tabButtonTextActive]}>
                  ✨ {t('Register User')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= REGISTER USER FLOW ================= */}
            {phoneMode === 'register' ? (
              <View>
                {/* STEP 1: Mobile Number + Get OTP */}
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>
                    1. {t('Mobile Number')} <Text style={styles.star}>*</Text>
                  </Text>
                  {isPhoneOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.flexInput,
                      isPhoneOtpVerified && styles.inputVerified,
                    ]}
                    placeholder={t('Enter 10-digit number')}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isPhoneOtpVerified}
                    value={phoneNumber}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      setPhoneOtpSent(false);
                      setIsPhoneOtpVerified(false);
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.muiBtn,
                      phoneOtpSent && styles.muiBtnResend,
                      isPhoneOtpVerified && styles.muiBtnDisabled,
                    ]}
                    onPress={handleSendPhoneOtp}
                    disabled={phoneSending || isPhoneOtpVerified}
                    activeOpacity={0.8}
                  >
                    {phoneSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.muiBtnText}>
                        {isPhoneOtpVerified ? t('Verified') : (phoneOtpSent ? t('Resend') : t('Get OTP'))}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Prominent In-Card OTP Sent Confirmation Banner */}
                {phoneOtpSent && !isPhoneOtpVerified && (
                  <View style={styles.inlineSuccessBanner}>
                    <Text style={styles.inlineSuccessIcon}>📩</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inlineSuccessTitle}>{t('SMS OTP code sent to your mobile!')} ✅</Text>
                      <Text style={styles.inlineSuccessSub}>{t('Check your SMS messages')}</Text>
                    </View>
                  </View>
                )}

                {/* STEP 2: Enter OTP + Verify Button (Enabled after Get OTP) */}
                <View style={[styles.fieldSpacing, !phoneOtpSent && styles.fieldLockedOpacity]}>
                  <View style={styles.labelFlexRow}>
                    <Text style={styles.inputLabel}>
                      2. {t('Enter 6-Digit SMS OTP')} <Text style={styles.star}>*</Text>
                    </Text>
                    {!phoneOtpSent && <Text style={styles.stepLockNotice}>🔒 {t('Tap "Get OTP" first')}</Text>}
                    {isPhoneOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                  </View>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.flexInput,
                        !phoneOtpSent && styles.inputDisabled,
                        isPhoneOtpVerified && styles.inputVerified,
                      ]}
                      placeholder={phoneOtpSent ? t('Enter 6-digit OTP') : t('Waiting for OTP...')}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={phoneOtpSent && !isPhoneOtpVerified}
                      value={phoneOtp}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                      }}
                      onChangeText={setPhoneOtp}
                    />
                    <TouchableOpacity
                      style={[
                        styles.muiVerifyBtn,
                        !phoneOtpSent && styles.muiBtnDisabled,
                        isPhoneOtpVerified && styles.muiVerifyBtnSuccess,
                      ]}
                      onPress={handleVerifyPhoneOtp}
                      disabled={!phoneOtpSent || phoneVerifying || isPhoneOtpVerified}
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

                {/* STEP 3: Full Name, Password & Confirm Password (Enabled after OTP Verified) */}
                <View style={[styles.fieldSpacing, !isPhoneOtpVerified && styles.fieldLockedOpacity]}>
                  <View style={styles.labelFlexRow}>
                    <Text style={styles.inputLabel}>
                      3. {t('Your Full Name')} <Text style={styles.star}>*</Text>
                    </Text>
                    {!isPhoneOtpVerified && <Text style={styles.stepLockNotice}>🔒 {t('Verify OTP first')}</Text>}
                  </View>
                  <TextInput
                    style={[styles.input, !isPhoneOtpVerified && styles.inputDisabled]}
                    placeholder={t('e.g. Rahul Sharma')}
                    placeholderTextColor="#9CA3AF"
                    editable={isPhoneOtpVerified}
                    value={phoneUserName}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                    onChangeText={setPhoneUserName}
                  />

                  {/* Password Field */}
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                    4. {t('Create Password')} <Text style={styles.star}>*</Text>
                  </Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.flexInput, !isPhoneOtpVerified && styles.inputDisabled]}
                      placeholder={t('At least 4 characters')}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPhonePassword}
                      editable={isPhoneOtpVerified}
                      value={phonePassword}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 140);
                      }}
                      onChangeText={setPhonePassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowPhonePassword(!showPhonePassword)}
                      disabled={!isPhoneOtpVerified}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeIcon}>{showPhonePassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.labelFlexRow}>
                    <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                      5. {t('Confirm Password')} <Text style={styles.star}>*</Text>
                    </Text>
                    {phoneConfirmPassword.length > 0 && (
                      <Text
                        style={[
                          styles.matchIndicatorText,
                          phonePassword === phoneConfirmPassword ? styles.matchSuccess : styles.matchError,
                        ]}
                      >
                        {phonePassword === phoneConfirmPassword
                          ? `✓ ${t('Passwords Match')}`
                          : `✕ ${t('Mismatch')}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.flexInput,
                        !isPhoneOtpVerified && styles.inputDisabled,
                        phoneConfirmPassword.length > 0 &&
                          phonePassword === phoneConfirmPassword &&
                          styles.inputVerified,
                      ]}
                      placeholder={t('Re-enter your password')}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPhoneConfirmPassword}
                      editable={isPhoneOtpVerified}
                      value={phoneConfirmPassword}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 160);
                      }}
                      onChangeText={setPhoneConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowPhoneConfirmPassword(!showPhoneConfirmPassword)}
                      disabled={!isPhoneOtpVerified}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeIcon}>{showPhoneConfirmPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* STEP 4: Register Button */}
                {(() => {
                  const isReadyToRegister =
                    isPhoneOtpVerified &&
                    phoneUserName.trim().length > 0 &&
                    phonePassword.length >= 4 &&
                    phonePassword === phoneConfirmPassword;

                  return (
                    <TouchableOpacity
                      style={[styles.primarySubmitBtn, !isReadyToRegister && styles.primaryBtnLocked]}
                      onPress={handlePhoneRegisterSubmit}
                      disabled={loading || !isReadyToRegister}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text
                          style={[
                            styles.primarySubmitBtnText,
                            !isReadyToRegister && styles.primaryBtnTextLocked,
                          ]}
                        >
                          {isReadyToRegister
                            ? `✨ ${t('Register & Create Account')}`
                            : !isPhoneOtpVerified
                            ? `🔒 ${t('Verify OTP First')}`
                            : `🔒 ${t('Fill All Required Fields')}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })()}

                {/* Switch to Login Link */}
                <TouchableOpacity
                  style={styles.switchAuthModeLink}
                  onPress={() => setPhoneMode('login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthModeText}>
                    {t('Already have an account?')} <Text style={styles.switchAuthHighlight}>{t('Login User')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ================= LOGIN USER FLOW ================= */
              <View>
                {/* Mobile Number Row */}
                <Text style={styles.inputLabel}>
                  {t('Mobile Number')} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('Enter 10-digit number')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onChangeText={setPhoneNumber}
                />

                {/* Password Field */}
                <View style={[styles.labelFlexRow, { marginTop: 12 }]}>
                  <Text style={styles.inputLabel}>
                    {t('Password')} <Text style={styles.star}>*</Text>
                  </Text>
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder={t('Enter your password')}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPhonePassword}
                    value={phonePassword}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                    onChangeText={setPhonePassword}
                    onSubmitEditing={handlePhonePasswordLoginSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowPhonePassword(!showPhonePassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIcon}>{showPhonePassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.primarySubmitBtn,
                    (!phoneNumber.trim() || !phonePassword.trim()) && styles.primaryBtnLocked,
                  ]}
                  onPress={handlePhonePasswordLoginSubmit}
                  disabled={loading || !phoneNumber.trim() || !phonePassword.trim()}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text
                      style={[
                        styles.primarySubmitBtnText,
                        (!phoneNumber.trim() || !phonePassword.trim()) && styles.primaryBtnTextLocked,
                      ]}
                    >
                      🔑 {t('Login User')}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Switch to Register Link */}
                <TouchableOpacity
                  style={styles.switchAuthModeLink}
                  onPress={() => setPhoneMode('register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthModeText}>
                    {t('New to YoYo?')} <Text style={styles.switchAuthHighlight}>{t('Register User')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Gmail / Email Tabbed Modal Card (Login User vs Register User) */
          <View style={styles.authCard}>
            {/* Modal Header */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleWrap}>
                <GmailOfficialIcon size={24} />
                <Text style={styles.cardTitle}>
                  {gmailMode === 'register' ? t('Register New Account') : t('Gmail Account Login')}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 2 Beautiful Toggle Buttons (Login User vs Register User) */}
            <View style={styles.tabSwitcherContainer}>
              <TouchableOpacity
                style={[styles.tabButton, gmailMode === 'login' && styles.tabButtonActive]}
                onPress={() => setGmailMode('login')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, gmailMode === 'login' && styles.tabButtonTextActive]}>
                  🔑 {t('Login User')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, gmailMode === 'register' && styles.tabButtonActive]}
                onPress={() => setGmailMode('register')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, gmailMode === 'register' && styles.tabButtonTextActive]}>
                  ✨ {t('Register User')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= REGISTER USER FLOW ================= */}
            {gmailMode === 'register' ? (
              <View>
                {/* STEP 1: Gmail ID + Get OTP */}
                <View style={styles.labelFlexRow}>
                  <Text style={styles.inputLabel}>
                    1. {t('Enter Gmail ID')} <Text style={styles.star}>*</Text>
                  </Text>
                  {isEmailOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput, isEmailOtpVerified && styles.inputVerified]}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isEmailOtpVerified}
                    value={email}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                    onChangeText={(val) => {
                      setEmail(val);
                      setEmailOtpSent(false);
                      setIsEmailOtpVerified(false);
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.muiBtn,
                      emailOtpSent && styles.muiBtnResend,
                      isEmailOtpVerified && styles.muiBtnDisabled,
                    ]}
                    onPress={handleSendEmailOtp}
                    disabled={emailSending || isEmailOtpVerified}
                    activeOpacity={0.8}
                  >
                    {emailSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.muiBtnText}>
                        {isEmailOtpVerified ? t('Verified') : (emailOtpSent ? t('Resend') : t('Get OTP'))}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Prominent In-Card OTP Sent Confirmation Banner */}
                {emailOtpSent && !isEmailOtpVerified && (
                  <View style={styles.inlineSuccessBanner}>
                    <Text style={styles.inlineSuccessIcon}>📩</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inlineSuccessTitle}>{t('OTP code sent to your Gmail inbox!')} ✅</Text>
                      <Text style={styles.inlineSuccessSub}>{t('Check your Gmail inbox / spam folder')}</Text>
                    </View>
                  </View>
                )}

                {/* STEP 2: Enter OTP + Verify Button (Enabled after Get OTP) */}
                <View style={[styles.fieldSpacing, !emailOtpSent && styles.fieldLockedOpacity]}>
                  <View style={styles.labelFlexRow}>
                    <Text style={styles.inputLabel}>
                      2. {t('Enter 6-Digit Email OTP')} <Text style={styles.star}>*</Text>
                    </Text>
                    {!emailOtpSent && <Text style={styles.stepLockNotice}>🔒 {t('Tap "Get OTP" first')}</Text>}
                    {isEmailOtpVerified && <Text style={styles.verifiedText}>{t('Verified ✅')}</Text>}
                  </View>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.flexInput,
                        !emailOtpSent && styles.inputDisabled,
                        isEmailOtpVerified && styles.inputVerified,
                      ]}
                      placeholder={emailOtpSent ? t('Enter 6-digit OTP') : t('Waiting for OTP...')}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={emailOtpSent && !isEmailOtpVerified}
                      value={emailOtp}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                      }}
                      onChangeText={setEmailOtp}
                    />
                    <TouchableOpacity
                      style={[
                        styles.muiVerifyBtn,
                        !emailOtpSent && styles.muiBtnDisabled,
                        isEmailOtpVerified && styles.muiVerifyBtnSuccess,
                      ]}
                      onPress={handleVerifyEmailOtp}
                      disabled={!emailOtpSent || emailVerifying || isEmailOtpVerified}
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
                  {emailOtpSent && !isEmailOtpVerified && (
                    <Text style={styles.spamHelperText}>💡 {t('Check your Gmail Inbox & Spam folder')}</Text>
                  )}
                </View>

                {/* STEP 3: Full Name, Password & Confirm Password (Enabled after OTP Verified) */}
                <View style={[styles.fieldSpacing, !isEmailOtpVerified && styles.fieldLockedOpacity]}>
                  <View style={styles.labelFlexRow}>
                    <Text style={styles.inputLabel}>
                      3. {t('Your Full Name')} <Text style={styles.star}>*</Text>
                    </Text>
                    {!isEmailOtpVerified && <Text style={styles.stepLockNotice}>🔒 {t('Verify OTP first')}</Text>}
                  </View>
                  <TextInput
                    style={[styles.input, !isEmailOtpVerified && styles.inputDisabled]}
                    placeholder={t('e.g. Rahul Sharma')}
                    placeholderTextColor="#9CA3AF"
                    editable={isEmailOtpVerified}
                    value={emailUserName}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                    onChangeText={setEmailUserName}
                  />

                  {/* Password Field */}
                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                    4. {t('Create Password')} <Text style={styles.star}>*</Text>
                  </Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.flexInput, !isEmailOtpVerified && styles.inputDisabled]}
                      placeholder={t('At least 4 characters')}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      editable={isEmailOtpVerified}
                      value={emailPassword}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 140);
                      }}
                      onChangeText={setEmailPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={!isEmailOtpVerified}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.labelFlexRow}>
                    <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                      5. {t('Confirm Password')} <Text style={styles.star}>*</Text>
                    </Text>
                    {emailConfirmPassword.length > 0 && (
                      <Text
                        style={[
                          styles.matchIndicatorText,
                          emailPassword === emailConfirmPassword ? styles.matchSuccess : styles.matchError,
                        ]}
                      >
                        {emailPassword === emailConfirmPassword
                          ? `✓ ${t('Passwords Match')}`
                          : `✕ ${t('Mismatch')}`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.flexInput,
                        !isEmailOtpVerified && styles.inputDisabled,
                        emailConfirmPassword.length > 0 &&
                          emailPassword === emailConfirmPassword &&
                          styles.inputVerified,
                      ]}
                      placeholder={t('Re-enter your password')}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      editable={isEmailOtpVerified}
                      value={emailConfirmPassword}
                      onFocus={() => {
                        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 160);
                      }}
                      onChangeText={setEmailConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggleBtn}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={!isEmailOtpVerified}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '🙈'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* STEP 4: Register Button */}
                {(() => {
                  const isReadyToRegister =
                    isEmailOtpVerified &&
                    emailUserName.trim().length > 0 &&
                    emailPassword.length >= 4 &&
                    emailPassword === emailConfirmPassword;

                  return (
                    <TouchableOpacity
                      style={[styles.primarySubmitBtn, !isReadyToRegister && styles.primaryBtnLocked]}
                      onPress={handleEmailRegisterSubmit}
                      disabled={loading || !isReadyToRegister}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text
                          style={[
                            styles.primarySubmitBtnText,
                            !isReadyToRegister && styles.primaryBtnTextLocked,
                          ]}
                        >
                          {isReadyToRegister
                            ? `✨ ${t('Register & Create Account')}`
                            : !isEmailOtpVerified
                            ? `🔒 ${t('Verify OTP First')}`
                            : `🔒 ${t('Fill All Required Fields')}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })()}

                {/* Switch to Login Link */}
                <TouchableOpacity
                  style={styles.switchAuthModeLink}
                  onPress={() => setGmailMode('login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthModeText}>
                    {t('Already have an account?')} <Text style={styles.switchAuthHighlight}>{t('Login User')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ================= LOGIN USER FLOW ================= */
              <View>
                {/* Gmail Address */}
                <Text style={styles.inputLabel}>
                  {t('Enter Gmail ID')} <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                  onChangeText={setEmail}
                />

                {/* Password Field */}
                <View style={[styles.labelFlexRow, { marginTop: 12 }]}>
                  <Text style={styles.inputLabel}>
                    {t('Password')} <Text style={styles.star}>*</Text>
                  </Text>
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder={t('Enter your password')}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={emailPassword}
                    onFocus={() => {
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
                    }}
                    onChangeText={setEmailPassword}
                    onSubmitEditing={handleEmailPasswordLoginSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggleBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.primarySubmitBtn,
                    (!email.trim() || !emailPassword.trim()) && styles.primaryBtnLocked,
                  ]}
                  onPress={handleEmailPasswordLoginSubmit}
                  disabled={loading || !email.trim() || !emailPassword.trim()}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text
                      style={[
                        styles.primarySubmitBtnText,
                        (!email.trim() || !emailPassword.trim()) && styles.primaryBtnTextLocked,
                      ]}
                    >
                      🔑 {t('Login User')}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Switch to Register Link */}
                <TouchableOpacity
                  style={styles.switchAuthModeLink}
                  onPress={() => setGmailMode('register')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAuthModeText}>
                    {t('New to YoYo?')} <Text style={styles.switchAuthHighlight}>{t('Register User')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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

  // Center Pop-up Toast Modal Overlay
  toastModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Focus backdrop
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  toastInner: {
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
    maxWidth: 360,
    width: '100%',
    overflow: 'hidden',
  },
  toastTouchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },

  // In-Card OTP Sent Confirmation Banner
  inlineSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
    gap: 10,
  },
  inlineSuccessIcon: {
    fontSize: 22,
  },
  inlineSuccessTitle: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineSuccessSub: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
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
    fontSize: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
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
  animatedPillOuter: {
    width: '100%',
  },
  pressableFull: {
    width: '100%',
  },
  premiumPillButton: {
    width: '100%',
    borderRadius: 34,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1.5,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
    userSelect: Platform.OS === 'web' ? 'none' : undefined,
  },
  iconBadgeAnimWrap: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  arrowBadgeWrap: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 46,
    height: 46,
    overflow: 'hidden',
  },
  phoneInputCombinedFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    minHeight: 46,
    height: 46,
    overflow: 'hidden',
    marginBottom: 6,
  },
  countryCodeBadge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryBadgeText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 13.5,
  },
  phoneTextInputInside: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 15,
    fontWeight: '700',
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
  muiBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
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

  // 2-Tab Switcher (Login User vs Register User)
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  // Locked field indicators
  fieldLockedOpacity: {
    opacity: 0.75,
  },
  stepLockNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: '#94A3B8',
  },

  // Password Input Row with Eye Toggle
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  matchIndicatorText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  matchSuccess: {
    color: '#10B981',
  },
  matchError: {
    color: '#EF4444',
  },

  // Switch Auth Mode Link
  switchAuthModeLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchAuthModeText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
  },
  switchAuthHighlight: {
    color: '#4F46E5',
    fontWeight: '800',
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

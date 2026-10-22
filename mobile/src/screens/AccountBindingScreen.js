import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';
import * as WebBrowser from 'expo-web-browser';

try {
  WebBrowser.maybeCompleteAuthSession();
} catch (e) {}

const FB_APP_ID = '4171729949789896';
const FB_REDIRECT_URI = 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';
const FB_AUTH_URL = `https://www.facebook.com/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}&response_type=code&scope=public_profile,email&display=touch`;

const TW_CLIENT_ID = 'N3JzYXhzQ3BNSGVaQWMydnFTU2E6MTpjaQ';
const TW_REDIRECT_URI = 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';
const TW_CODE_VERIFIER = 'challenge12345678901234567890123456789012345';
const TW_AUTH_URL = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TW_CLIENT_ID}&redirect_uri=${encodeURIComponent(TW_REDIRECT_URI)}&scope=users.read%20tweet.read&state=state&code_challenge=${TW_CODE_VERIFIER}&code_challenge_method=plain`;

const SNAP_CLIENT_ID = '6d65546d-96a3-423e-9d5a-f48d01cdc1ee';
const SNAP_REDIRECT_URI = 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';
const SNAP_SCOPES = encodeURIComponent('https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar');
const SNAP_AUTH_URL = `https://accounts.snapchat.com/accounts/oauth2/auth?client_id=${SNAP_CLIENT_ID}&redirect_uri=${encodeURIComponent(SNAP_REDIRECT_URI)}&response_type=code&scope=${SNAP_SCOPES}&state=funmaza_snap_state`;

// Injected JS to hide "Continue with Google", "OR" divider, and "Sign up" button inside Snapchat WebView
const SNAP_INJECTED_JS = `
  (function() {
    function hideSnapchatExtras() {
      try {
        const elements = document.querySelectorAll('button, a, div, span, p');
        elements.forEach(function(el) {
          const txt = (el.innerText || el.textContent || '').trim();
          // Hide Continue with Google button
          if (txt.includes('Continue with Google') || txt.includes('Sign in with Google') || (txt.includes('Google') && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'))) {
            var target = el.closest('button') || el.closest('[role="button"]') || el;
            target.style.setProperty('display', 'none', 'important');
            target.style.setProperty('visibility', 'hidden', 'important');
            target.style.setProperty('height', '0px', 'important');
            target.style.setProperty('margin', '0px', 'important');
            target.style.setProperty('padding', '0px', 'important');
          }
          // Hide Sign up and New to Snapchat
          if (txt.includes('New to Snapchat?') || txt === 'Sign up' || txt === 'Sign Up') {
            if (el.tagName === 'A' || el.tagName === 'BUTTON' || txt.includes('New to Snapchat?')) {
              var pTarget = el.closest('div') || el;
              pTarget.style.setProperty('display', 'none', 'important');
              pTarget.style.setProperty('visibility', 'hidden', 'important');
              pTarget.style.setProperty('height', '0px', 'important');
            }
          }
          // Hide OR divider
          if (txt === 'OR' || txt === 'or' || txt === 'Or') {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('height', '0px', 'important');
          }
        });
      } catch (e) {}
    }
    hideSnapchatExtras();
    setInterval(hideSnapchatExtras, 200);
    try {
      var obs = new MutationObserver(hideSnapchatExtras);
      if (document.body) {
        obs.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          obs.observe(document.body, { childList: true, subtree: true });
        });
      }
    } catch (e) {}
  })();
  true;
`;

// Injected JS to hide "Sign in with Google" / "Continue with Google" inside Twitter WebView
const TW_INJECTED_JS = `
  (function() {
    function hideTwitterGoogle() {
      try {
        const elements = document.querySelectorAll('button, a, div, span, [role="button"]');
        elements.forEach(function(el) {
          const txt = (el.innerText || el.textContent || '').trim();
          if (txt.includes('Continue with Google') || txt.includes('Sign in with Google') || (txt.includes('Google') && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'))) {
            var target = el.closest('button') || el.closest('[role="button"]') || el;
            target.style.setProperty('display', 'none', 'important');
            target.style.setProperty('visibility', 'hidden', 'important');
            target.style.setProperty('height', '0px', 'important');
          }
        });
      } catch (e) {}
    }
    hideTwitterGoogle();
    setInterval(hideTwitterGoogle, 200);
    try {
      var obs = new MutationObserver(hideTwitterGoogle);
      if (document.body) {
        obs.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          obs.observe(document.body, { childList: true, subtree: true });
        });
      }
    } catch (e) {}
  })();
  true;
`;




// ══ SVG ICONS MATCHING SCREENSHOT ══
const BackArrowIcon = ({ size = 24, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightIcon = ({ size = 18, color = '#C7C7CC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5l7 7-7 7"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 1. Phone Handset / Smartphone Circle Icon (Matching screenshot)
const PhoneCircleIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#B0B5BA" />
    <Rect
      x="12"
      y="8.5"
      width="12"
      height="19"
      rx="2.5"
      stroke="#FFFFFF"
      strokeWidth="1.8"
    />
    <Circle cx="18" cy="24" r="1.2" fill="#FFFFFF" />
    <Path d="M15.5 11.5h5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const PhoneCallIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 2. Facebook Circle Icon (Matching screenshot)
const FacebookCircleIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#B0B5BA" />
    <Path
      d="M20.2 14.5h-1.8c-.8 0-1.1.4-1.1 1.2v1.6h2.8l-.4 2.8h-2.4v7.4h-3v-7.4h-2.4v-2.8h2.4v-2c0-2.4 1.4-3.8 3.7-3.8 1.1 0 2.1.1 2.4.1v2.9z"
      fill="#FFFFFF"
    />
  </Svg>
);

const FacebookBrandIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
);

const MessengerIcon = ({ size = 22, color = '#0084FF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.513 3.735 7.185V22l3.418-1.875c.91.252 1.87.39 2.847.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.002 12.443l-2.556-2.727-4.992 2.727 5.49-5.83 2.616 2.727 4.932-2.727-5.49 5.83z" />
  </Svg>
);

const WhatsAppIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.82 14.15c-.24.68-1.2 1.25-1.66 1.29-.44.04-1 .06-3.23-.84-2.22-.9-3.66-3.13-3.77-3.28-.11-.15-.9-1.2-1-2.28-.1-1.08.52-1.61.73-1.84.21-.23.46-.29.62-.29.15 0 .31 0 .44.01.14.01.33-.05.51.39.2.49.68 1.67.74 1.79.06.12.1.27.02.43-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.25.25-.11.49.14.24.63 1.04 1.35 1.68.93.83 1.71 1.09 1.95 1.21.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.59-.18 1.27z" />
  </Svg>
);

// 3. Official Google Multicolor G Icon (Matching screenshot)
const GoogleCircleIcon = ({ size = 36 }) => (
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

// 4. Twitter Circle Icon (Matching screenshot)
const TwitterCircleIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#B0B5BA" />
    <Path
      d="M25 12.8a6.2 6.2 0 01-1.8.5 3.1 3.1 0 001.4-1.7 6.2 6.2 0 01-2 .8 3.1 3.1 0 00-5.4 2.8 8.9 8.9 0 01-6.5-3.3 3.1 3.1 0 001 4.2 3.1 3.1 0 01-1.4-.4v.1a3.1 3.1 0 002.5 3.1 3.2 3.2 0 01-1.4.1 3.1 3.1 0 002.9 2.2 6.3 6.3 0 01-3.9 1.3H10a8.8 8.8 0 004.8 1.4c5.7 0 8.9-4.7 8.9-8.9v-.4a6.3 6.3 0 001.3-1.5z"
      fill="#FFFFFF"
    />
  </Svg>
);

// 5. VK Circle Icon (Matching screenshot)
const VkCircleIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#B0B5BA" />
    <Path
      d="M26 13h-2.2c-.8 0-1.1.4-1.5 1.3-1.6 3-3.1 5.3-4.2 5.3-.2 0-.4-.2-.4-.8V14c0-.7-.2-1-1-1h-2.4c-.4 0-.7.2-.7.5 0 .6.9.7 1 2.4v3.3c0 .7-.1.9-.4.9-.7 0-2.3-2.5-3.5-5.3-.2-.5-.6-.8-1.4-.8H8c-.8 0-1 .4-1 .8 0 .8 1.1 4.4 5.1 9.8C14.7 27 18 27 18.7 27h1.4c.5 0 .8-.3.8-1v-2c.7.2 1.6 1.1 2.2 2 .5.7 1 .9 1.8.9h2.2c.8 0 1.2-.4 1-1.2-.4-1.3-2.2-3.2-3.1-4.2-.4-.4-.5-.7 0-1.3 1.2-1.6 2.8-4.2 3-6.2.1-.5-.2-1-1-1z"
      fill="#FFFFFF"
    />
  </Svg>
);

// 6. Snapchat Circle Icon
const SnapchatCircleIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#FFFC00" />
    <Path
      d="M18 9.5c-3.5 0-5.8 2.3-5.8 5.6 0 .9.2 1.8.5 2.4-.6.3-1.4.7-1.6 1.4-.2.7.2 1.3.8 1.5.6.2 1.3.1 1.8-.2.4 1 1.1 1.8 2 2.1-.6.4-1.5.8-2 1.4-.4.5-.4 1.2 0 1.6.4.5 1.2.6 2 .5.7 1.4 2.1 1.9 3.8 1.9.7 0 1.4-.1 2-.4.6.3 1.3.4 2 .4 1.7 0 3.1-.5 3.8-1.9.8.1 1.6 0 2-.5.4-.4.4-1.1 0-1.6-.5-.6-1.4-1-2-1.4.9-.3 1.6-1.1 2-2.1.5.3 1.2.4 1.8.2.6-.2 1-.8.8-1.5-.2-.7-1-1.1-1.6-1.4.3-.6.5-1.5.5-2.4 0-3.3-2.3-5.6-5.8-5.6z"
      fill="#000000"
    />
    <Path
      d="M18 10.7c-2.8 0-4.6 1.8-4.6 4.4 0 .7.2 1.5.4 2 .2.4 0 .9-.3 1.1-.5.3-1.1.6-1.3 1.1-.1.4.1.8.5.9.5.1 1 .1 1.4-.1.4-.2 1-.1 1.2.3.4.8 1 1.4 1.7 1.6.4.1.7.6.5 1-.5.4-1.2.7-1.6 1.1-.2.3-.2.7.1.9.3.3.9.4 1.5.3.5-.1 1 .2 1.2.6.5 1.1 1.6 1.5 2.8 1.5.6 0 1.1-.1 1.6-.3.4-.2.8-.2 1.2 0 .5.2 1 .3 1.6.3 1.2 0 2.3-.4 2.8-1.5.2-.4.7-.7 1.2-.6.6.1 1.2 0 1.5-.3.3-.2.3-.6.1-.9-.4-.4-1.1-.7-1.6-1.1-.2-.4.1-.9.5-1 .7-.2 1.3-.8 1.7-1.6.2-.4.8-.5 1.2-.3.4.2.9.2 1.4.1.4-.1.6-.5.5-.9-.2-.5-.8-.8-1.3-1.1-.3-.2-.5-.7-.3-1.1.2-.5.4-1.3.4-2 0-2.6-1.8-4.4-4.6-4.4z"
      fill="#FFFFFF"
    />
  </Svg>
);

export default function AccountBindingScreen({ navigation, currentUser }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(currentUser || null);
  const [loading, setLoading] = useState(false);

  // ── 0. Phone Number Binding State (WhatsApp OTP Verification) ──
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState('input'); // 'input' | 'otp'
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  // ── 1. Google / Gmail Binding State with OTP ──
  const [googleChooserVisible, setGoogleChooserVisible] = useState(false);
  const [customGmailInput, setCustomGmailInput] = useState('');
  const [googleOtpStep, setGoogleOtpStep] = useState('input'); // 'input' | 'otp'
  const [googleOtp, setGoogleOtp] = useState('');
  const [googleCountdown, setGoogleCountdown] = useState(0);
  const [googleSending, setGoogleSending] = useState(false);
  const [googleVerifying, setGoogleVerifying] = useState(false);

  // ── 2. Facebook Binding State with Security OTP Verification ──
  const [fbChooserVisible, setFbChooserVisible] = useState(false);
  const [fbAccountInput, setFbAccountInput] = useState('');
  const [fbOtpStep, setFbOtpStep] = useState('input'); // 'input' | 'otp'
  const [fbOtp, setFbOtp] = useState('');
  const [fbCountdown, setFbCountdown] = useState(0);
  const [fbSending, setFbSending] = useState(false);
  const [fbVerifying, setFbVerifying] = useState(false);
  const [fbWebViewVisible, setFbWebViewVisible] = useState(false);

  // ── 3. Twitter Binding State ──
  const [twChooserVisible, setTwChooserVisible] = useState(false);
  const [customTwInput, setCustomTwInput] = useState('');
  const [twWebViewVisible, setTwWebViewVisible] = useState(false);
  const [twVerifying, setTwVerifying] = useState(false);

  // ── 3.1 Snapchat Binding State ──
  const [snapChooserVisible, setSnapChooserVisible] = useState(false);
  const [customSnapInput, setCustomSnapInput] = useState('');
  const [snapWebViewVisible, setSnapWebViewVisible] = useState(false);
  const [snapVerifying, setSnapVerifying] = useState(false);

  // ── 4. Final Confirmation Prompt Modal ──
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingBind, setPendingBind] = useState(null); // { provider, accountId, name, email, avatar, username }

  // ── 5. Unbind / Remove Account Binding State ──
  const [unbindModalVisible, setUnbindModalVisible] = useState(false);
  const [pendingUnbind, setPendingUnbind] = useState(null); // { provider, label, value }

  // Countdown timer refs
  const phoneTimerRef = useRef(null);
  const googleTimerRef = useRef(null);
  const fbTimerRef = useRef(null);

  useEffect(() => {
    fetchLatestProfile();
    return () => {
      if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
      if (googleTimerRef.current) clearInterval(googleTimerRef.current);
      if (fbTimerRef.current) clearInterval(fbTimerRef.current);
    };
  }, []);

  const fetchLatestProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_info');
      if (stored) {
        setProfile(JSON.parse(stored));
      }
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
      }
    } catch (_) {}
  };

  // Determine current bound status text for each item
  const googleBoundValue =
    profile?.googleId ||
    profile?.boundAccounts?.google?.id ||
    profile?.boundAccounts?.google?.email;

  const facebookBoundValue =
    profile?.facebookId ||
    profile?.boundAccounts?.facebook?.name;

  const twitterBoundValue =
    profile?.twitterId ||
    profile?.boundAccounts?.twitter?.username;

  const snapchatBoundValue =
    profile?.snapchatId ||
    profile?.boundAccounts?.snapchat?.displayName ||
    profile?.boundAccounts?.snapchat?.id;

  const phoneBoundValue =
    profile?.phone ||
    profile?.phoneNumber ||
    profile?.boundAccounts?.phone?.number;

  // ══════════════════════════════════════════════════
  // 1. PHONE HANDLER (WHATSAPP OTP VERIFICATION)
  // ══════════════════════════════════════════════════
  const startPhoneCountdown = () => {
    setPhoneCountdown(60);
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = setInterval(() => {
      setPhoneCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(phoneTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhoneClick = () => {
    if (phoneBoundValue) {
      setPendingUnbind({
        provider: 'phone',
        label: t('Phone Number'),
        value: `+91 ${phoneBoundValue}`,
      });
      setUnbindModalVisible(true);
      return;
    }
    setPhoneInput(profile?.phone || profile?.phoneNumber || '');
    setPhoneOtp('');
    setPhoneOtpStep('input');
    setPhoneModalVisible(true);
  };

  // Step 1: Send OTP to User's Phone via 2Factor.in Voice Call (or SMS)
  const handleSendPhoneOtp = async (channel = 'voice') => {
    const raw = phoneInput.trim().replace(/\D/g, '').slice(-10);
    if (!raw || raw.length !== 10) {
      showToast(t('Please enter a valid 10-digit mobile number'), 'error');
      return;
    }

    setPhoneSending(true);
    try {
      const endpoint = channel === 'sms' ? '/auth/send-sms-otp' : '/auth/send-voice-otp';
      const res = await api.post(endpoint, { phoneNumber: raw });
      if (res.data?.success) {
        if (channel === 'sms') {
          showToast(t('SMS OTP dispatched to your number! 💬'), 'success');
        } else {
          showToast(t('Automated voice call dialing your phone! Please answer to hear OTP 📞'), 'success');
        }
        setPhoneOtpStep('otp');
        startPhoneCountdown();
      } else {
        showToast(t(res.data?.message || 'Failed to initiate OTP call'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to initiate OTP call'), 'error');
    } finally {
      setPhoneSending(false);
    }
  };

  // Step 2: Verify Phone OTP (Voice / 2Factor)
  const handleVerifyPhoneOtp = async () => {
    const cleanOtp = phoneOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      showToast(t('Please enter the 6-digit OTP code'), 'error');
      return;
    }

    const raw = phoneInput.trim().replace(/\D/g, '').slice(-10);
    setPhoneVerifying(true);
    try {
      const res = await api.post('/auth/verify-voice-otp', {
        phoneNumber: raw,
        otp: cleanOtp,
      });

      if (res.data?.success) {
        showToast(t('Phone Number Verified Successfully! ✅'), 'success');
        setPhoneModalVisible(false);
        setPhoneOtpStep('input');
        setPhoneOtp('');

        // Open "Are you sure..." confirmation prompt requested by user
        setPendingBind({
          provider: 'phone',
          accountId: raw,
          name: profile?.name || `+91 ${raw}`,
          phoneNumber: raw,
          promptText: t('Are you sure do you want to bind your account to this phone number?'),
        });
        setConfirmModalVisible(true);
      } else {
        showToast(t(res.data?.message || 'Wrong OTP code!'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Wrong OTP code! Please enter correct 6 digit OTP'), 'error');
    } finally {
      setPhoneVerifying(false);
    }
  };

  // ══════════════════════════════════════════════════
  // 2. GOOGLE / GMAIL BINDING WITH REAL OTP FLOW
  // ══════════════════════════════════════════════════
  const handleGoogleClick = () => {
    if (googleBoundValue) {
      setPendingUnbind({
        provider: 'google',
        label: t('Google (Gmail)'),
        value: googleBoundValue,
      });
      setUnbindModalVisible(true);
      return;
    }
    setCustomGmailInput(profile?.email || '');
    setGoogleOtp('');
    setGoogleOtpStep('input');
    setGoogleChooserVisible(true);
  };

  const startGoogleCountdown = () => {
    setGoogleCountdown(60);
    if (googleTimerRef.current) clearInterval(googleTimerRef.current);
    googleTimerRef.current = setInterval(() => {
      setGoogleCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(googleTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP to user's Gmail
  const handleSendGoogleOtp = async (targetEmail) => {
    const raw = typeof targetEmail === 'string' ? targetEmail : customGmailInput;
    let clean = raw.trim().toLowerCase();
    if (!clean.includes('@') && clean.length > 0) {
      clean = `${clean}@gmail.com`;
    }
    if (!clean || !clean.includes('@') || !clean.includes('.') || clean.length < 6) {
      showToast(t('Please enter a valid Gmail address'), 'error');
      return;
    }
    setCustomGmailInput(clean);

    setGoogleSending(true);
    try {
      const res = await api.post('/auth/send-email-otp', { email: clean });
      if (res.data?.success) {
        showToast(t('OTP Sent to your Gmail! 📨'), 'success');
        setGoogleOtpStep('otp');
        startGoogleCountdown();
      } else {
        showToast(t(res.data?.message || 'Failed to send OTP'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to send OTP to Gmail'), 'error');
    } finally {
      setGoogleSending(false);
    }
  };

  // Step 2: Verify Gmail OTP -> Then open "Are you sure..." prompt
  const handleVerifyGoogleOtp = async () => {
    const cleanOtp = googleOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      showToast(t('Please enter the 6-digit OTP code'), 'error');
      return;
    }

    setGoogleVerifying(true);
    try {
      const res = await api.post('/auth/verify-email-otp', {
        email: customGmailInput.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (res.data?.success) {
        showToast(t('OTP Verified Successfully! ✅'), 'success');
        setGoogleChooserVisible(false);
        setGoogleOtpStep('input');

        // Open "Are you sure..." confirmation prompt requested by user
        setPendingBind({
          provider: 'google',
          accountId: `108${Math.floor(10000000000000000 + Math.random() * 90000000000000000)}`,
          email: customGmailInput.trim().toLowerCase(),
          name: profile?.name || customGmailInput.split('@')[0],
          avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          promptText: t('Are you sure do you want to bind your account to this gmail account?'),
        });
        setConfirmModalVisible(true);
      } else {
        showToast(t(res.data?.message || 'Invalid OTP code'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Wrong OTP code'), 'error');
    } finally {
      setGoogleVerifying(false);
    }
  };

  // ══════════════════════════════════════════════════
  // 3. FACEBOOK BINDING (OFFICIAL 1-CLICK & MESSENGER FLOW)
  // ══════════════════════════════════════════════════
  const handleStartFbOAuth = async () => {
    setFbChooserVisible(false);
    try {
      const result = await WebBrowser.openAuthSessionAsync(FB_AUTH_URL, FB_REDIRECT_URI);
      if (result.type === 'success' && result.url) {
        handleFbNavStateChange({ url: result.url });
      }
    } catch (err) {
      console.warn('FB WebBrowser fallback:', err);
      setFbWebViewVisible(true);
    }
  };

  const handleFbNavStateChange = async (navState) => {
    const url = navState.url;
    if (!url || !url.includes('funapp-2e00d.firebaseapp.com')) return;

    if (url.includes('access_token=') || url.includes('code=')) {
      let token = null;
      let code = null;

      const tokenMatch = url.match(/access_token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) token = tokenMatch[1];

      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch && codeMatch[1]) code = codeMatch[1];

      setFbWebViewVisible(false);
      setFbVerifying(true);
      try {
        const res = await api.post('/auth/facebook-verify-token', {
          accessToken: token,
          code,
        });
          if (res.data?.success && res.data?.profile) {
            const profileData = res.data.profile;
            showToast(t('Facebook Account Verified Successfully! ✅'), 'success');
            setPendingBind({
              provider: 'facebook',
              accountId: profileData.id,
              name: profileData.name || 'Facebook User',
              email: profileData.email || '',
              avatar: profileData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
              promptText: t('Are you sure do you want to bind your account to this facebook account?'),
            });
            setConfirmModalVisible(true);
          } else {
            showToast(t(res.data?.message || 'Failed to authenticate with Facebook'), 'error');
          }
        } catch (err) {
          showToast(t(err.response?.data?.message || 'Failed to verify Facebook profile'), 'error');
        } finally {
          setFbVerifying(false);
        }
    } else if (url.includes('error=') || url.includes('error_code=')) {
      setFbWebViewVisible(false);
      showToast(t('Facebook authentication cancelled or failed'), 'error');
    }
  };

  const handleFacebookClick = () => {
    if (facebookBoundValue) {
      setPendingUnbind({
        provider: 'facebook',
        label: t('Facebook'),
        value: facebookBoundValue,
      });
      setUnbindModalVisible(true);
      return;
    }
    setFbAccountInput(profile?.name ? profile.name.toLowerCase().replace(/\s+/g, '') : '');
    setFbOtp('');
    setFbOtpStep('input');
    setFbChooserVisible(true);
  };

  const startFbCountdown = () => {
    setFbCountdown(60);
    if (fbTimerRef.current) clearInterval(fbTimerRef.current);
    fbTimerRef.current = setInterval(() => {
      setFbCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(fbTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Send OTP to Facebook Messenger
  const handleSendFbOtp = async () => {
    const raw = fbAccountInput.trim().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '');
    if (!raw || raw.length < 3) {
      showToast(t('Please enter your Facebook ID or Username'), 'error');
      return;
    }

    setFbSending(true);
    try {
      const res = await api.post('/auth/generate-facebook-otp', { facebookId: raw });
      if (res.data?.success) {
        showToast(t('Opening Messenger to deliver OTP... 📨'), 'info');
        setFbOtpStep('otp');
        startFbCountdown();

        // Launch Facebook Messenger app
        if (res.data.messengerUrl) {
          Linking.openURL(res.data.messengerUrl).catch(() => {
            showToast(t('Could not open Messenger app. Please check your Messenger inbox.'), 'info');
          });
        }
      } else {
        showToast(t(res.data?.message || 'Failed to send Messenger OTP'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to dispatch Messenger OTP'), 'error');
    } finally {
      setFbSending(false);
    }
  };

  const handleReopenMessenger = () => {
    const messengerUrl = 'https://m.me/FunMazaLive';
    Linking.openURL(messengerUrl).catch(() => {
      showToast(t('Could not open Messenger app'), 'error');
    });
  };

  // Step 2: Verify Facebook Messenger OTP -> Then open "Are you sure..." prompt
  const handleVerifyFbOtp = async () => {
    const cleanOtp = fbOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      showToast(t('Please enter the 6-digit OTP code'), 'error');
      return;
    }

    const cleanFbId = fbAccountInput.trim().toLowerCase().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '');
    setFbVerifying(true);
    try {
      const res = await api.post('/auth/verify-facebook-otp', {
        facebookId: cleanFbId,
        otp: cleanOtp,
      });

      if (res.data?.success) {
        showToast(t('Messenger OTP Verified Successfully! ✅'), 'success');
        setFbChooserVisible(false);
        setFbOtpStep('input');

        // Open "Are you sure..." confirmation prompt requested by user
        setPendingBind({
          provider: 'facebook',
          accountId: cleanFbId,
          name: profile?.name || cleanFbId,
          avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          promptText: t('Are you sure do you want to bind your account to this facebook account?'),
        });
        setConfirmModalVisible(true);
      } else {
        showToast(t(res.data?.message || 'Wrong OTP code!'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Wrong OTP code! Please check your Facebook Messenger.'), 'error');
    } finally {
      setFbVerifying(false);
    }
  };

  // ══════════════════════════════════════════════════
  // 4. TWITTER BINDING FLOW
  // ══════════════════════════════════════════════════
  const handleTwitterClick = () => {
    if (twitterBoundValue) {
      setPendingUnbind({
        provider: 'twitter',
        label: t('Twitter'),
        value: twitterBoundValue,
      });
      setUnbindModalVisible(true);
      return;
    }
    const defaultTw = profile?.name ? `@${profile.name.toLowerCase().replace(/\s+/g, '')}` : '@twitter_user';
    setCustomTwInput(defaultTw);
    setTwChooserVisible(true);
  };

  const handleStartTwOAuth = async () => {
    setTwChooserVisible(false);
    try {
      const result = await WebBrowser.openAuthSessionAsync(TW_AUTH_URL, TW_REDIRECT_URI);
      if (result.type === 'success' && result.url) {
        handleTwNavStateChange({ url: result.url });
      }
    } catch (err) {
      console.warn('Twitter WebBrowser fallback:', err);
      setTwWebViewVisible(true);
    }
  };

  const handleTwNavStateChange = async (navState) => {
    const url = navState.url;
    if (!url) return;

    if (url === 'about:blank' || url.startsWith('about:')) {
      setTwWebViewVisible(false);
      return;
    }

    if (!url.includes('funapp-2e00d.firebaseapp.com')) return;

    if (url.includes('code=')) {
      let code = null;
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch && codeMatch[1]) code = codeMatch[1];

      setTwWebViewVisible(false);
      setTwVerifying(true);
      try {
        const res = await api.post('/auth/twitter-verify-token', {
          code,
          codeVerifier: TW_CODE_VERIFIER,
        });

        if (res.data?.success && res.data?.profile) {
          const profileData = res.data.profile;
          showToast(t('Twitter Account Verified Successfully! ✅'), 'success');
          setPendingBind({
            provider: 'twitter',
            accountId: profileData.id,
            username: profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`,
            name: profileData.name || profileData.username || 'Twitter User',
            avatar: profileData.avatar,
            promptText: t('Are you sure do you want to bind your account to this Twitter account?'),
          });
          setConfirmModalVisible(true);
        } else {
          showToast(t(res.data?.message || 'Failed to authenticate with Twitter'), 'error');
        }
      } catch (err) {
        showToast(t(err.response?.data?.message || 'Failed to verify Twitter account'), 'error');
      } finally {
        setTwVerifying(false);
      }
    } else if (url.includes('error=')) {
      setTwWebViewVisible(false);
      showToast(t('Twitter authentication cancelled or failed'), 'error');
    }
  };

  const handleTwSubmit = () => {
    let clean = customTwInput.trim();
    if (!clean.startsWith('@')) clean = `@${clean}`;
    setTwChooserVisible(false);
    setPendingBind({
      provider: 'twitter',
      accountId: `tw_${Date.now()}`,
      username: clean,
      name: profile?.name || clean.replace('@', ''),
      avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      promptText: t('Are you sure do you want to bind your account to this Twitter account?'),
    });
    setConfirmModalVisible(true);
  };

  // ══════════════════════════════════════════════════
  // 5. SNAPCHAT BINDING FLOW
  // ══════════════════════════════════════════════════
  const handleSnapchatClick = () => {
    if (snapchatBoundValue) {
      setPendingUnbind({
        provider: 'snapchat',
        label: t('Snapchat'),
        value: snapchatBoundValue,
      });
      setUnbindModalVisible(true);
      return;
    }
    const defaultSnap = profile?.name ? profile.name.toLowerCase().replace(/\s+/g, '') : 'snap_user';
    setCustomSnapInput(defaultSnap);
    setSnapChooserVisible(true);
  };

  const handleStartSnapOAuth = async () => {
    setSnapChooserVisible(false);
    try {
      const result = await WebBrowser.openAuthSessionAsync(SNAP_AUTH_URL, SNAP_REDIRECT_URI);
      if (result.type === 'success' && result.url) {
        handleSnapNavStateChange({ url: result.url });
      }
    } catch (err) {
      console.warn('Snapchat WebBrowser fallback:', err);
      setSnapWebViewVisible(true);
    }
  };

  const handleSnapNavStateChange = async (navState) => {
    const url = navState.url;
    if (!url) return;

    if (url === 'about:blank' || url.startsWith('about:')) {
      setSnapWebViewVisible(false);
      return;
    }

    if (!url.includes('funapp-2e00d.firebaseapp.com')) return;

    if (url.includes('code=')) {
      let code = null;
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch && codeMatch[1]) code = codeMatch[1];

      setSnapWebViewVisible(false);
      setSnapVerifying(true);
      try {
        const res = await api.post('/auth/snapchat-verify-token', { code });

        if (res.data?.success && res.data?.profile) {
          const profileData = res.data.profile;
          showToast(t('Snapchat Account Verified Successfully! ✅'), 'success');
          setPendingBind({
            provider: 'snapchat',
            accountId: profileData.id,
            name: profileData.name || 'Snapchat User',
            avatar: profileData.avatar,
            promptText: t('Are you sure do you want to bind your account to this Snapchat account?'),
          });
          setConfirmModalVisible(true);
        } else {
          showToast(t(res.data?.message || 'Failed to authenticate with Snapchat'), 'error');
        }
      } catch (err) {
        const errorDetail = err.response?.data?.message || err.message || 'Failed to verify Snapchat account';
        console.error('Snapchat verify error:', errorDetail, err);
        showToast(t(errorDetail), 'error');
      } finally {
        setSnapVerifying(false);
      }
    } else if (url.includes('error=')) {
      setSnapWebViewVisible(false);
      const descMatch = url.match(/[?&]error_description=([^&#]+)/);
      const errMatch = url.match(/[?&]error=([^&#]+)/);
      const snapErr = descMatch
        ? decodeURIComponent(descMatch[1].replace(/\+/g, ' '))
        : errMatch
        ? decodeURIComponent(errMatch[1])
        : 'Snapchat authentication cancelled or failed';
      showToast(t(snapErr), 'error');
    }
  };

  const handleSnapSubmit = () => {
    let clean = customSnapInput.trim();
    setSnapChooserVisible(false);
    setPendingBind({
      provider: 'snapchat',
      accountId: `snap_${Date.now()}`,
      name: clean || profile?.name || 'Snapchat User',
      avatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      promptText: t('Are you sure do you want to bind your account to this Snapchat account?'),
    });
    setConfirmModalVisible(true);
  };

  // 6. VK Click
  const handleVkClick = () => {
    showToast(t('VK account binding coming soon'), 'info');
  };

  // ══════════════════════════════════════════════════
  // 7. FINAL BINDING CONFIRMATION ("Yes, Bind")
  // ══════════════════════════════════════════════════
  const handleConfirmBinding = async () => {
    if (!pendingBind) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/bind-account', {
        provider: pendingBind.provider,
        accountId: pendingBind.accountId,
        email: pendingBind.email,
        name: pendingBind.name,
        username: pendingBind.username,
        avatar: pendingBind.avatar,
      });

      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        setConfirmModalVisible(false);
        setPendingBind(null);
        showToast(
          t(
            pendingBind.provider === 'google'
              ? 'Gmail account bound successfully!'
              : pendingBind.provider === 'facebook'
              ? 'Facebook account bound successfully!'
              : pendingBind.provider === 'phone'
              ? 'Phone number bound successfully!'
              : pendingBind.provider === 'snapchat'
              ? 'Snapchat account bound successfully!'
              : 'Twitter account bound successfully!'
          ),
          'success'
        );
      } else {
        showToast(t(res.data?.message || 'Failed to bind account'), 'error');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || t('Failed to bind account. Try again.');
      showToast(t(errMsg), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════
  // 6. FINAL UNBIND CONFIRMATION ("Yes, Remove")
  // ══════════════════════════════════════════════════
  const handleConfirmUnbind = async () => {
    if (!pendingUnbind) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/unbind-account', {
        provider: pendingUnbind.provider,
      });

      if (res.data?.success && res.data.user) {
        setProfile(res.data.user);
        await AsyncStorage.setItem('@user_info', JSON.stringify(res.data.user));
        setUnbindModalVisible(false);
        setPendingUnbind(null);
        showToast(t('Account binding removed successfully!'), 'success');
      } else {
        showToast(t(res.data?.message || 'Failed to remove account binding'), 'error');
      }
    } catch (err) {
      showToast(t(err.response?.data?.message || 'Failed to remove account binding'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ══ TOP HEADER ══ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <BackArrowIcon size={24} color="#2C2C2E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <T>Account Binding</T>
        </Text>

        <View style={{ width: 36 }} />
      </View>

      {/* ══ BINDING ITEMS LIST (MATCHING SCREENSHOT) ══ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(30, insets.bottom + 20) },
        ]}
      >
        <View style={styles.listContainer}>
          {/* 1. Phone Number */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handlePhoneClick}
          >
            <View style={styles.rowLeft}>
              <PhoneCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>Phone Number</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.statusText,
                  phoneBoundValue && styles.statusTextBound,
                ]}
              >
                {phoneBoundValue || <T>Bind on Account</T>}
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* 2. Facebook */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handleFacebookClick}
          >
            <View style={styles.rowLeft}>
              <FacebookCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>Facebook</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.statusText,
                  facebookBoundValue && styles.statusTextBound,
                ]}
              >
                {facebookBoundValue || <T>Bind on Account</T>}
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* 3. Google (Gmail) */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handleGoogleClick}
          >
            <View style={styles.rowLeft}>
              <GoogleCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>Google</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.statusText,
                  googleBoundValue && styles.statusTextBound,
                ]}
                numberOfLines={1}
              >
                {googleBoundValue || <T>Bind on Account</T>}
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* 4. Twitter */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handleTwitterClick}
          >
            <View style={styles.rowLeft}>
              <TwitterCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>Twitter</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.statusText,
                  twitterBoundValue && styles.statusTextBound,
                ]}
              >
                {twitterBoundValue || <T>Bind on Account</T>}
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* 5. Snapchat */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handleSnapchatClick}
          >
            <View style={styles.rowLeft}>
              <SnapchatCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>Snapchat</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text
                style={[
                  styles.statusText,
                  snapchatBoundValue && styles.statusTextBound,
                ]}
              >
                {snapchatBoundValue || <T>Bind on Account</T>}
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* 5. VK */}
          <TouchableOpacity
            style={styles.rowItem}
            activeOpacity={0.75}
            onPress={handleVkClick}
          >
            <View style={styles.rowLeft}>
              <VkCircleIcon size={36} />
              <Text style={styles.rowLabelText}>
                <T>VK</T>
              </Text>
            </View>

            <View style={styles.rowRight}>
              <Text style={styles.statusText}>
                <T>Bind on Account</T>
              </Text>
              <ChevronRightIcon size={18} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ══ 0. PHONE NUMBER BINDING VIA VOICE CALL OTP MODAL ══ */}
      <Modal
        visible={phoneModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.chooserOverlay}
          activeOpacity={1}
          onPress={() => setPhoneModalVisible(false)}
        >
          <View
            style={styles.chooserSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.fbHeaderRow}>
              <View style={styles.fbHeaderLeft}>
                <View style={[styles.fbLogoCircle, { backgroundColor: '#4F46E5' }]}>
                  <PhoneCallIcon size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.fbHeaderTitle, { color: '#818CF8' }]}>
                    <T>Bind Phone Number</T>
                  </Text>
                  <Text style={styles.fbHeaderSub}>
                    <T>Voice Call OTP Verification</T>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPhoneModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.chooserCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {phoneOtpStep === 'input' ? (
              /* STEP 1: Enter 10-digit mobile number */
              <>
                <Text style={styles.fbIntroText}>
                  <T>Enter your 10-digit mobile number. You will receive an automated voice call with your 6-digit OTP code.</T>
                </Text>

                <View style={styles.inputSectionCard}>
                  <Text style={styles.inputSectionLabel}>
                    <T>Your 10-Digit Mobile Number</T>
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[styles.gmailTextInput, { flex: 1, height: 46 }]}
                      placeholder={t('10-digit number')}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phoneInput}
                      onChangeText={setPhoneInput}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.waVerifyBtn,
                      { backgroundColor: '#4F46E5' },
                      (!phoneInput.trim() || phoneSending) && styles.submitGmailBtnDisabled,
                    ]}
                    disabled={!phoneInput.trim() || phoneSending}
                    activeOpacity={0.85}
                    onPress={() => handleSendPhoneOtp('voice')}
                  >
                    {phoneSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <PhoneCallIcon size={20} color="#FFFFFF" />
                        <Text style={styles.waVerifyBtnText}>
                          <T>Get OTP on Call</T>
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Fallback option for SMS */}
                  <TouchableOpacity
                    style={{ alignSelf: 'center', marginTop: 14 }}
                    disabled={phoneSending || !phoneInput.trim()}
                    onPress={() => handleSendPhoneOtp('sms')}
                  >
                    <Text style={{ color: '#9CA3AF', fontSize: 13, textDecorationLine: 'underline' }}>
                      💬 <T>Or Get OTP via SMS</T>
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* STEP 2: Enter 6-digit OTP from Voice Call */
              <View style={styles.inputSectionCard}>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.inputSectionLabel}>
                    <T>Enter 6-digit OTP received on call:</T>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPhoneOtpStep('input')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.changeEmailText}>
                      <T>Change</T>
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.targetAccountHighlight}>
                  +91 {phoneInput}
                </Text>

                <TextInput
                  style={[styles.gmailTextInput, styles.otpTextInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={phoneOtp}
                  onChangeText={setPhoneOtp}
                  autoFocus
                />

                <View style={styles.resendRow}>
                  {phoneCountdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      <T>Resend Call in</T> {phoneCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendPhoneOtp('voice')}
                      disabled={phoneSending}
                    >
                      <Text style={styles.resendActionText}>
                        <T>Call Again</T>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitGmailBtn,
                    { backgroundColor: '#4F46E5' },
                    (phoneOtp.length !== 6 || phoneVerifying) && styles.submitGmailBtnDisabled,
                  ]}
                  disabled={phoneOtp.length !== 6 || phoneVerifying}
                  activeOpacity={0.85}
                  onPress={handleVerifyPhoneOtp}
                >
                  {phoneVerifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitGmailBtnText}>
                      ✅ <T>Verify OTP & Continue</T>
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ 1. GOOGLE / GMAIL BINDING WITH REAL OTP MODAL ══ */}
      <Modal
        visible={googleChooserVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGoogleChooserVisible(false)}
      >
        <TouchableOpacity
          style={styles.chooserOverlay}
          activeOpacity={1}
          onPress={() => setGoogleChooserVisible(false)}
        >
          <View
            style={styles.chooserSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.chooserHeaderRow}>
              <View style={styles.chooserHeaderLeft}>
                <GoogleCircleIcon size={28} />
                <Text style={styles.chooserTitle}>
                  <T>Bind Google Account</T>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setGoogleChooserVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.chooserCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {googleOtpStep === 'input' ? (
              /* STEP 1: Enter Gmail Address & Send OTP */
              <>
                <Text style={styles.chooserSubtitle}>
                  <T>Enter your Gmail address to receive 6-digit OTP</T>
                </Text>

                {/* Quick device email badge */}
                {profile?.email ? (
                  <TouchableOpacity
                    style={styles.accountOptionCard}
                    activeOpacity={0.75}
                    onPress={() => handleSendGoogleOtp(profile.email)}
                  >
                    <Image
                      source={{
                        uri:
                          profile?.avatar ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                      }}
                      style={styles.accountAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountNameText}>
                        {profile?.name || 'My Google Account'}
                      </Text>
                      <Text style={styles.accountEmailText}>{profile.email}</Text>
                    </View>
                    <View style={styles.deviceBadge}>
                      <Text style={styles.deviceBadgeText}>
                        <T>Quick Send</T>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.inputSectionCard}>
                  <Text style={styles.inputSectionLabel}>
                    <T>Your Mobile Gmail Address</T>
                  </Text>
                  <View style={styles.gmailInputRow}>
                    <TextInput
                      style={styles.gmailTextInput}
                      placeholder="yourname@gmail.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={customGmailInput}
                      onChangeText={setCustomGmailInput}
                    />
                    {customGmailInput.length > 0 && !customGmailInput.includes('@') && (
                      <TouchableOpacity
                        style={styles.quickAtPill}
                        onPress={() =>
                          setCustomGmailInput((prev) => `${prev.trim()}@gmail.com`)
                        }
                      >
                        <Text style={styles.quickAtPillText}>+ @gmail.com</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitGmailBtn,
                      (!customGmailInput.trim() || googleSending) &&
                        styles.submitGmailBtnDisabled,
                    ]}
                    disabled={!customGmailInput.trim() || googleSending}
                    activeOpacity={0.8}
                    onPress={() => handleSendGoogleOtp()}
                  >
                    {googleSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitGmailBtnText}>
                        📨 <T>Send OTP & Continue</T>
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* STEP 2: Enter 6-digit OTP */
              <View style={styles.inputSectionCard}>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.inputSectionLabel}>
                    <T>Enter 6-digit OTP sent to:</T>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setGoogleOtpStep('input')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.changeEmailText}>
                      <T>Change</T>
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.targetAccountHighlight}>
                  {customGmailInput}
                </Text>

                <TextInput
                  style={[styles.gmailTextInput, styles.otpTextInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={googleOtp}
                  onChangeText={setGoogleOtp}
                  autoFocus
                />

                <View style={styles.resendRow}>
                  {googleCountdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      <T>Resend OTP in</T> {googleCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendGoogleOtp()}
                      disabled={googleSending}
                    >
                      <Text style={styles.resendActionText}>
                        <T>Resend OTP</T>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitGmailBtn,
                    (googleOtp.length !== 6 || googleVerifying) &&
                      styles.submitGmailBtnDisabled,
                  ]}
                  disabled={googleOtp.length !== 6 || googleVerifying}
                  activeOpacity={0.8}
                  onPress={handleVerifyGoogleOtp}
                >
                  {googleVerifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitGmailBtnText}>
                      ✅ <T>Verify OTP</T>
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ 2. FACEBOOK BINDING MODAL WITH MESSENGER OTP VERIFICATION ══ */}
      {/* ══ 2. FACEBOOK BINDING MODAL WITH OFFICIAL 1-CLICK & MANUAL OPTIONS ══ */}
      <Modal
        visible={fbChooserVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFbChooserVisible(false)}
      >
        <TouchableOpacity
          style={styles.chooserOverlay}
          activeOpacity={1}
          onPress={() => setFbChooserVisible(false)}
        >
          <View
            style={styles.chooserSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.fbHeaderRow}>
              <View style={styles.fbHeaderLeft}>
                <View style={[styles.fbLogoCircle, { backgroundColor: '#1877F2' }]}>
                  <FacebookBrandIcon size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.fbHeaderTitle, { color: '#1877F2' }]}>
                    <T>Bind Facebook Account</T>
                  </Text>
                  <Text style={styles.fbHeaderSub}>
                    <T>Meta Official Fast Bind</T>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setFbChooserVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.chooserCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {fbOtpStep === 'input' ? (
              /* STEP 1: Fast 1-Click Login or Manual Entry */
              <>
                <Text style={styles.fbIntroText}>
                  <T>Connect your verified Facebook profile to FunMaza for quick and secure 1-click account access.</T>
                </Text>

                <View style={styles.inputSectionCard}>
                  {/* Primary 1-Click Official Meta Login Button */}
                  <TouchableOpacity
                    style={styles.fbFastBtn}
                    activeOpacity={0.85}
                    onPress={handleStartFbOAuth}
                  >
                    <FacebookBrandIcon size={20} color="#FFFFFF" />
                    <Text style={styles.fbFastBtnText}>
                      <T>Continue with Facebook</T>
                    </Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>
                      <T>Or bind manually with Facebook ID</T>
                    </Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Text style={styles.inputSectionLabel}>
                    <T>Facebook ID or Username</T>
                  </Text>
                  <TextInput
                    style={styles.gmailTextInput}
                    placeholder="e.g. rahul.sharma or fb-username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    value={fbAccountInput}
                    onChangeText={setFbAccountInput}
                  />

                  <TouchableOpacity
                    style={[
                      styles.messengerBtn,
                      (!fbAccountInput.trim() || fbSending) && styles.submitGmailBtnDisabled,
                    ]}
                    disabled={!fbAccountInput.trim() || fbSending}
                    activeOpacity={0.85}
                    onPress={handleSendFbOtp}
                  >
                    {fbSending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MessengerIcon size={20} color="#FFFFFF" />
                        <Text style={styles.messengerBtnText}>
                          <T>Get OTP on Messenger</T>
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* STEP 2: Enter 6-digit OTP from Messenger */
              <View style={styles.inputSectionCard}>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.inputSectionLabel}>
                    <T>Enter 6-digit OTP sent to your Messenger:</T>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setFbOtpStep('input')}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.changeEmailText}>
                      <T>Change</T>
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.targetAccountHighlight}>
                  @{fbAccountInput}
                </Text>

                <TextInput
                  style={[styles.gmailTextInput, styles.otpTextInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={fbOtp}
                  onChangeText={setFbOtp}
                  autoFocus
                />

                {/* Check Messenger Re-open button */}
                <TouchableOpacity
                  style={styles.reopenMessengerBtn}
                  activeOpacity={0.8}
                  onPress={handleReopenMessenger}
                >
                  <MessengerIcon size={18} color="#0084FF" />
                  <Text style={styles.reopenMessengerBtnText}>
                    <T>Check Facebook Messenger</T>
                  </Text>
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  {fbCountdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      <T>Resend OTP in</T> {fbCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendFbOtp}
                      disabled={fbSending}
                    >
                      <Text style={styles.resendActionText}>
                        <T>Resend OTP</T>
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitGmailBtn,
                    (fbOtp.length !== 6 || fbVerifying) && styles.submitGmailBtnDisabled,
                  ]}
                  disabled={fbOtp.length !== 6 || fbVerifying}
                  activeOpacity={0.8}
                  onPress={handleVerifyFbOtp}
                >
                  {fbVerifying ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitGmailBtnText}>
                      ✅ <T>Verify OTP & Continue</T>
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ 2.1 FACEBOOK OFFICIAL OAUTH WEBVIEW MODAL ══ */}
      <Modal
        visible={fbWebViewVisible}
        animationType="slide"
        onRequestClose={() => setFbWebViewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0F0F1A', paddingTop: Math.max(16, insets.top) }}>
          <View style={styles.fbWebHeader}>
            <TouchableOpacity
              onPress={() => setFbWebViewVisible(false)}
              style={styles.fbWebCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.fbWebCloseText}>✕ <T>Cancel</T></Text>
            </TouchableOpacity>
            <Text style={styles.fbWebTitle}><T>Facebook Login</T></Text>
            <View style={{ width: 60 }} />
          </View>
          <WebView
            source={{ uri: FB_AUTH_URL }}
            onNavigationStateChange={handleFbNavStateChange}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (url && url.includes('funapp-2e00d.firebaseapp.com') && (url.includes('access_token=') || url.includes('code=') || url.includes('error='))) {
                handleFbNavStateChange({ url });
                return false;
              }
              return true;
            }}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webLoadingContainer}>
                <ActivityIndicator size="large" color="#1877F2" />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ══ 3. TWITTER BINDING MODAL ══ */}
      <Modal
        visible={twChooserVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTwChooserVisible(false)}
      >
        <TouchableOpacity
          style={styles.chooserOverlay}
          activeOpacity={1}
          onPress={() => setTwChooserVisible(false)}
        >
          <View
            style={styles.chooserSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.chooserHeaderRow}>
              <View style={styles.chooserHeaderLeft}>
                <TwitterCircleIcon size={28} />
                <Text style={styles.chooserTitle}>
                  <T>Bind Twitter Account</T>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTwChooserVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.chooserCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.chooserSubtitle}>
              <T>Choose your preferred binding method</T>
            </Text>

            <View style={styles.inputSectionCard}>
              {/* Option 1: Fast 1-Click Official Twitter (X) OAuth */}
              <TouchableOpacity
                style={[styles.fbFastBtn, { backgroundColor: '#000000', borderColor: '#333333', borderWidth: 1 }]}
                activeOpacity={0.85}
                onPress={handleStartTwOAuth}
              >
                <TwitterCircleIcon size={22} />
                <Text style={styles.fbFastBtnText}>
                  <T>Continue with Twitter (X)</T>
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  <T>Or bind manually with Twitter @handle</T>
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.inputSectionLabel}>
                <T>Twitter @handle</T>
              </Text>
              <TextInput
                style={styles.gmailTextInput}
                placeholder="@username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={customTwInput}
                onChangeText={setCustomTwInput}
              />

              <TouchableOpacity
                style={[
                  styles.submitGmailBtn,
                  !customTwInput.trim() && styles.submitGmailBtnDisabled,
                ]}
                disabled={!customTwInput.trim()}
                activeOpacity={0.8}
                onPress={handleTwSubmit}
              >
                <Text style={styles.submitGmailBtnText}>
                  <T>Continue to Bind</T>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ 3.1 TWITTER OFFICIAL OAUTH WEBVIEW MODAL ══ */}
      <Modal
        visible={twWebViewVisible}
        animationType="slide"
        onRequestClose={() => setTwWebViewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0F0F1A', paddingTop: Math.max(16, insets.top) }}>
          <View style={styles.fbWebHeader}>
            <TouchableOpacity
              onPress={() => setTwWebViewVisible(false)}
              style={styles.fbWebCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.fbWebCloseText}>✕ <T>Cancel</T></Text>
            </TouchableOpacity>
            <Text style={styles.fbWebTitle}><T>Twitter (X) Login</T></Text>
            <View style={{ width: 60 }} />
          </View>
          <WebView
            source={{ uri: TW_AUTH_URL }}
            onNavigationStateChange={handleTwNavStateChange}
            injectedJavaScript={TW_INJECTED_JS}
            injectedJavaScriptBeforeContentLoaded={TW_INJECTED_JS}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (!url) return true;
              if (url.startsWith('twitter://') || url.startsWith('intent://')) {
                Linking.openURL(url).catch(() => {});
                return false;
              }
              if (url.includes('accounts.google.com') || url.includes('appleid.apple.com')) {
                setTwWebViewVisible(false);
                showToast(t('Please use the Google option in Account Binding'), 'info');
                return false;
              }
              if (url.includes('funapp-2e00d.firebaseapp.com') && (url.includes('code=') || url.includes('error='))) {
                handleTwNavStateChange({ url });
                return false;
              }
              return true;
            }}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
            scalesPageToFit={true}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webLoadingContainer}>
                <ActivityIndicator size="large" color="#1DA1F2" />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ══ 3.2 SNAPCHAT BINDING MODAL ══ */}
      <Modal
        visible={snapChooserVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSnapChooserVisible(false)}
      >
        <TouchableOpacity
          style={styles.chooserOverlay}
          activeOpacity={1}
          onPress={() => setSnapChooserVisible(false)}
        >
          <View
            style={styles.chooserSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.chooserHeaderRow}>
              <View style={styles.chooserHeaderLeft}>
                <SnapchatCircleIcon size={28} />
                <Text style={styles.chooserTitle}>
                  <T>Bind Snapchat Account</T>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSnapChooserVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.chooserCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.chooserSubtitle}>
              <T>Choose your preferred binding method</T>
            </Text>

            <View style={styles.inputSectionCard}>
              {/* Option 1: Fast 1-Click Official Snapchat OAuth */}
              <TouchableOpacity
                style={[styles.fbFastBtn, { backgroundColor: '#FFFC00', shadowColor: '#FFFC00' }]}
                activeOpacity={0.85}
                onPress={handleStartSnapOAuth}
              >
                <SnapchatCircleIcon size={22} />
                <Text style={[styles.fbFastBtnText, { color: '#000000' }]}>
                  <T>Continue with Snapchat</T>
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  <T>Or bind manually with Snapchat ID</T>
                </Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.inputSectionLabel}>
                <T>Snapchat Username</T>
              </Text>
              <TextInput
                style={styles.gmailTextInput}
                placeholder="snapchat_username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={customSnapInput}
                onChangeText={setCustomSnapInput}
              />

              <TouchableOpacity
                style={[
                  styles.submitGmailBtn,
                  !customSnapInput.trim() && styles.submitGmailBtnDisabled,
                ]}
                disabled={!customSnapInput.trim()}
                activeOpacity={0.8}
                onPress={handleSnapSubmit}
              >
                <Text style={styles.submitGmailBtnText}>
                  <T>Continue to Bind</T>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ 3.3 SNAPCHAT OFFICIAL OAUTH WEBVIEW MODAL ══ */}
      <Modal
        visible={snapWebViewVisible}
        animationType="slide"
        onRequestClose={() => setSnapWebViewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0F0F1A', paddingTop: Math.max(16, insets.top) }}>
          <View style={styles.fbWebHeader}>
            <TouchableOpacity
              onPress={() => setSnapWebViewVisible(false)}
              style={styles.fbWebCloseBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.fbWebCloseText}>✕ <T>Cancel</T></Text>
            </TouchableOpacity>
            <Text style={styles.fbWebTitle}><T>Snapchat Login</T></Text>
            <View style={{ width: 60 }} />
          </View>
          <WebView
            source={{ uri: SNAP_AUTH_URL }}
            onNavigationStateChange={handleSnapNavStateChange}
            injectedJavaScript={SNAP_INJECTED_JS}
            injectedJavaScriptBeforeContentLoaded={SNAP_INJECTED_JS}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (!url) return true;
              if (url.startsWith('snapchat://') || url.startsWith('intent://')) {
                Linking.openURL(url).catch(() => {});
                return false;
              }
              if (url.includes('accounts.google.com') || url.includes('appleid.apple.com')) {
                setSnapWebViewVisible(false);
                showToast(t('Please use the Google option in Account Binding'), 'info');
                return false;
              }
              if (url.includes('funapp-2e00d.firebaseapp.com') && (url.includes('code=') || url.includes('error='))) {
                handleSnapNavStateChange({ url });
                return false;
              }
              return true;
            }}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
            scalesPageToFit={true}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webLoadingContainer}>
                <ActivityIndicator size="large" color="#FFFC00" />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* ══ 4. CONFIRMATION MODAL ("Are you sure do you want to bind...") ══ */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !loading && setConfirmModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => !loading && setConfirmModalVisible(false)}
        >
          <View
            style={styles.confirmCard}
            onStartShouldSetResponder={() => true}
          >
            {/* Header Icon */}
            <View style={styles.confirmIconWrap}>
              {pendingBind?.provider === 'google' ? (
                <GoogleCircleIcon size={46} />
              ) : pendingBind?.provider === 'facebook' ? (
                <FacebookCircleIcon size={46} />
              ) : pendingBind?.provider === 'phone' ? (
                <PhoneCircleIcon size={46} />
              ) : (
                <TwitterCircleIcon size={46} />
              )}
            </View>

            {/* Prompt Text requested by user */}
            <Text style={styles.confirmPromptTitle}>
              {pendingBind?.promptText}
            </Text>

            {/* Account Details Card */}
            <View style={styles.accountPreviewCard}>
              {pendingBind?.avatar ? (
                <Image
                  source={{ uri: pendingBind.avatar }}
                  style={styles.previewAvatar}
                />
              ) : pendingBind?.provider === 'phone' ? (
                <PhoneCircleIcon size={36} />
              ) : null}
              <View style={{ flex: 1, marginLeft: pendingBind?.provider === 'phone' ? 12 : 0 }}>
                <Text style={styles.previewName}>{pendingBind?.name}</Text>
                {pendingBind?.email ? (
                  <Text style={styles.previewSub}>{pendingBind.email}</Text>
                ) : pendingBind?.username ? (
                  <Text style={styles.previewSub}>{pendingBind.username}</Text>
                ) : pendingBind?.phoneNumber ? (
                  <Text style={styles.previewSub}>+91 {pendingBind.phoneNumber}</Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.confirmHintText}>
              <T>Once bound, you can log in directly without entering a password.</T>
            </Text>

            {/* Buttons Row */}
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                disabled={loading}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.yesBindBtn}
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleConfirmBinding}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.yesBindBtnText}>
                    <T>Yes, Bind</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* ══ 5. UNBIND / REMOVE ACCOUNT BINDING CONFIRMATION MODAL ══ */}
      <Modal
        visible={unbindModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !loading && setUnbindModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => !loading && setUnbindModalVisible(false)}
        >
          <View
            style={styles.confirmCard}
            onStartShouldSetResponder={() => true}
          >
            {/* Header Icon */}
            <View style={styles.confirmIconWrap}>
              {pendingUnbind?.provider === 'google' ? (
                <GoogleCircleIcon size={46} />
              ) : pendingUnbind?.provider === 'facebook' ? (
                <FacebookCircleIcon size={46} />
              ) : pendingUnbind?.provider === 'twitter' ? (
                <TwitterCircleIcon size={46} />
              ) : (
                <PhoneCircleIcon size={46} />
              )}
            </View>

            {/* Prompt requested by user */}
            <Text style={styles.confirmPromptTitle}>
              <T>Are you sure do you want to remove this account binding?</T>
            </Text>

            {/* Account Details Card */}
            <View style={styles.accountPreviewCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName}>{pendingUnbind?.label}</Text>
                <Text style={styles.previewSub}>{pendingUnbind?.value}</Text>
              </View>
            </View>

            <Text style={styles.confirmHintText}>
              <T>Removing this binding will disconnect this login method from your account.</T>
            </Text>

            {/* Buttons Row */}
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                disabled={loading}
                onPress={() => setUnbindModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeBindBtn}
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleConfirmUnbind}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.removeBindBtnText}>
                    <T>Yes, Remove</T>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 6,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 62,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabelText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    marginLeft: 14,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  statusTextBound: {
    color: '#1F2937',
    fontWeight: '500',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F2',
    marginLeft: 66,
  },

  // Chooser Bottom Sheet
  chooserOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  chooserSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  chooserHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chooserHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chooserTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  chooserCloseBtn: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chooserSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 38,
  },
  accountOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  accountNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  accountEmailText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  deviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  deviceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Direct Input Section Card
  inputSectionCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  gmailInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  gmailTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  otpTextInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: 6,
  },
  quickAtPill: {
    position: 'absolute',
    right: 8,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickAtPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  submitGmailBtn: {
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitGmailBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitGmailBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // OTP Verification view styles
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  changeEmailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  targetAccountHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendTimerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Confirm Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  confirmIconWrap: {
    marginBottom: 14,
  },
  confirmPromptTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  accountPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  confirmHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  yesBindBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesBindBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeBindBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBindBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Facebook 1-Tap Styles
  fbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fbHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fbLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1877F2',
  },
  fbHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  fbIntroText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 16,
  },
  fbProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E4E6EB',
    marginBottom: 16,
  },
  fbProfileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  fbProfileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#050505',
  },
  fbProfileStatus: {
    fontSize: 12,
    color: '#1877F2',
    marginTop: 2,
    fontWeight: '500',
  },
  switchAccountInputWrap: {
    marginBottom: 16,
  },
  fbContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1877F2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fbContinueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fbSecondaryLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  fbSecondaryLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1877F2',
  },
  fbDisclaimerText: {
    fontSize: 11,
    color: '#8A8D91',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  messengerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0084FF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  messengerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reopenMessengerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E7F3FF',
    marginBottom: 12,
  },
  reopenMessengerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0084FF',
  },

  // Phone WhatsApp Direct Verification Styles
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  countryCodeBadge: {
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  waVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
  },
  waVerifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waSuccessCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  waSuccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  waSuccessTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  waSuccessDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 10,
  },
  waCodeBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  waCodeBoxText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  reopenWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    marginBottom: 12,
  },
  reopenWaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  waConfirmBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fbFastBtn: {
    backgroundColor: '#1877F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginTop: 6,
    shadowColor: '#1877F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  fbFastBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  fbWebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E1E2D',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C3E',
  },
  fbWebCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  fbWebCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fbWebTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  webLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

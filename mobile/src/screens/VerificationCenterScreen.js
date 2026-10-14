import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgGradient, Stop, G } from 'react-native-svg';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';

// Custom 3D Glowing Shield Icon for Top Banner
const Shield3DIcon = ({ size = 110 }) => (
  <Svg width={size} height={size * 1.05} viewBox="0 0 120 126" fill="none">
    <Defs>
      <SvgGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A5C8FF" />
        <Stop offset="45%" stopColor="#4D8BFF" />
        <Stop offset="100%" stopColor="#2D68E6" />
      </SvgGradient>
      <SvgGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <Stop offset="60%" stopColor="#7EB3FF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#2554C7" stopOpacity="0.9" />
      </SvgGradient>
      <SvgGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#EDF4FF" />
      </SvgGradient>
    </Defs>
    {/* Soft Glow Shadow behind shield */}
    <Path
      d="M60 118C28 102 14 74 14 42V18L60 6L106 18V42C106 74 92 102 60 118Z"
      fill="#2955B6"
      opacity="0.3"
      transform="translate(0, 4)"
    />
    {/* Outer Shield Frame */}
    <Path
      d="M60 118C28 102 14 74 14 42V18L60 6L106 18V42C106 74 92 102 60 118Z"
      fill="url(#shieldBorder)"
    />
    {/* Inner Shield Body */}
    <Path
      d="M60 110C32 96 20 70 20 42V22L60 11L100 22V42C100 70 88 96 60 110Z"
      fill="url(#shieldGrad)"
    />
    {/* Top Metallic Highlight Arc */}
    <Path
      d="M26 26L60 16L94 26V36C80 28 40 28 26 36V26Z"
      fill="#FFFFFF"
      opacity="0.35"
    />
    {/* Bold 3D Checkmark */}
    <Path
      d="M48 62L56 70L74 48"
      stroke="url(#checkGrad)"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Right Arrow
const ChevronRight = ({ size = 18, color = '#C7C7CC' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Back Arrow
const ChevronLeft = ({ size = 22, color = '#FFFFFF' }) => (
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

// Badge Star Icon for Privileges
const BadgePrivilegeIcon = ({ color = '#4D8BFF', iconType = 'check' }) => (
  <View style={[styles.badgeIconBg, { backgroundColor: color + '15' }]}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.7 4.2L18.1 4.5L19.5 7.6L22.4 9.4L22 12.8L23.4 15.9L21.2 18.5L20.8 21.9L17.4 22.3L15.2 24.9L12 23.8L8.8 24.9L6.6 22.3L3.2 21.9L2.8 18.5L0.6 15.9L2 12.8L1.6 9.4L4.5 7.6L5.9 4.5L9.3 4.2L12 2Z"
        fill={color}
      />
      {iconType === 'check' ? (
        <Path
          d="M8.5 12.5L11 15L15.5 10.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <G fill="#FFFFFF">
          <Circle cx="12" cy="10" r="3" />
          <Path d="M7 17C7 14.5 9 13.5 12 13.5C15 13.5 17 14.5 17 17H7Z" />
        </G>
      )}
    </Svg>
  </View>
);

export default function VerificationCenterScreen({ navigation, route, currentUser }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    isRealPersonVerified: false,
    realPersonVerifiedAt: null,
    isAvatarVerified: false,
    isPhoneVerified: false,
    gender: '',
  });

  const fetchStatus = async () => {
    try {
      const res = await api.get('/users/verification/status');
      if (res.data?.success && res.data.data) {
        setStatus(res.data.data);
      }
    } catch (e) {
      // Fallback to currentUser properties
      if (currentUser) {
        setStatus({
          isRealPersonVerified: !!currentUser.isRealPersonVerified,
          realPersonVerifiedAt: currentUser.realPersonVerifiedAt,
          isAvatarVerified: !!currentUser.isAvatarVerified,
          isPhoneVerified: !!(currentUser.phoneNumber || currentUser.boundAccounts?.phone?.number),
          gender: currentUser.gender || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchStatus();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRealPersonClick = () => {
    navigation.navigate('RealPersonIntro');
  };

  const handleAvatarClick = () => {
    if (status.isAvatarVerified) {
      showToast(t('Avatar Verification has already been completed'), 'info');
      return;
    }
    showToast(t('Avatar verification is processed after uploading real profile avatar'), 'info');
  };

  const handlePhoneClick = () => {
    navigation.navigate('AccountBinding');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#5B8DF5' }]} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Gradient Banner with 3D Shield */}
      <LinearGradient
        colors={['#5B8DF5', '#80ACFA', '#B9D5FF', '#F5F7FB']}
        locations={[0, 0.45, 0.75, 1]}
        style={[styles.headerBanner, { paddingTop: Math.max(16, insets.top) }]}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}><T>Verification Center</T></Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* 3D Shield Illustration */}
        <View style={styles.shieldWrap}>
          <Shield3DIcon size={118} />
        </View>
      </LinearGradient>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Verification Information */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardHeaderTitle}><T>Verification Information</T></Text>

          {/* Row 1: Real Person Verification */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.75}
            onPress={handleRealPersonClick}
          >
            <LinearGradient
              colors={['#4F8BF9', '#3770E8']}
              style={styles.itemIconSquircle}
            >
              {/* Male/Female & Person symbol */}
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx="10" cy="14" r="5" stroke="#FFFFFF" strokeWidth="2.2" />
                <Path
                  d="M14 10L19 5M19 5H14.5M19 5V9.5"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </LinearGradient>

            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}><T>Real Person Verification</T></Text>
              {status.isRealPersonVerified ? (
                <Text style={styles.statusVerified}>✓ <T>Verified</T></Text>
              ) : (
                <Text style={styles.statusNotVerified}><T>Not Verified</T></Text>
              )}
            </View>

            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Row 2: Avatar Verification */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.75}
            onPress={handleAvatarClick}
          >
            <LinearGradient
              colors={['#00D2A0', '#00B887']}
              style={styles.itemIconSquircle}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke="#FFFFFF" strokeWidth="2.2" />
                <Path
                  d="M5 20C5 16.5 8 15 12 15C16 15 19 16.5 19 20"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </Svg>
            </LinearGradient>

            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}><T>Avatar Verification</T></Text>
              {status.isAvatarVerified ? (
                <Text style={styles.statusVerified}>✓ <T>Verified</T></Text>
              ) : (
                <Text style={styles.statusNotVerified}><T>Not Verified</T></Text>
              )}
            </View>

            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Row 3: Phone Verification */}
          <TouchableOpacity
            style={styles.itemRow}
            activeOpacity={0.75}
            onPress={handlePhoneClick}
          >
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.itemIconSquircle}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Rect x="6" y="2" width="12" height="20" rx="3" stroke="#FFFFFF" strokeWidth="2.2" />
                <Circle cx="12" cy="18" r="1.2" fill="#FFFFFF" />
              </Svg>
            </LinearGradient>

            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}><T>Phone Verification</T></Text>
              {status.isPhoneVerified ? (
                <Text style={styles.statusVerified}>✓ <T>Verified</T></Text>
              ) : (
                <Text style={styles.statusNotVerified}><T>Not Verified</T></Text>
              )}
            </View>

            <ChevronRight size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Card 2: Exclusive Privileges */}
        <View style={[styles.whiteCard, styles.privilegesCard]}>
          <Text style={styles.cardHeaderTitle}><T>Exclusive Privileges</T></Text>
          <Text style={styles.cardHeaderSubtitle}>
            <T>Complete the above verifications to unlock</T>
          </Text>

          {/* Privilege 1: Real Person Verification */}
          <View style={styles.privilegeRow}>
            <BadgePrivilegeIcon color="#4D8BFF" iconType="check" />
            <View style={styles.privilegeTextWrap}>
              <Text style={styles.privilegeTitle}><T>Real Person Verification</T></Text>
              <Text style={styles.privilegeDesc}>
                <T>Real person verification badge, unlock personal task rewards</T>
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Privilege 2: Avatar Verification */}
          <View style={styles.privilegeRow}>
            <BadgePrivilegeIcon color="#00D2A0" iconType="avatar" />
            <View style={styles.privilegeTextWrap}>
              <Text style={styles.privilegeTitle}><T>Avatar Verification</T></Text>
              <Text style={styles.privilegeDesc}>
                <T>Avatar verification badge</T>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  navBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  shieldWrap: {
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    marginTop: -16,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  privilegesCard: {
    marginTop: 2,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemIconSquircle: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  statusNotVerified: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5252',
  },
  statusVerified: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00C853',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F3',
    marginVertical: 4,
  },
  privilegeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  badgeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  privilegeTextWrap: {
    flex: 1,
  },
  privilegeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  privilegeDesc: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import ScreenContainer from '../components/ScreenContainer';
import { T } from '../components/TranslatedText';

// Custom Back Arrow
const BackArrowIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19L8 12L15 5"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleEmailPress = () => {
    Linking.openURL('mailto:funmaja@gmail.com').catch(() => {});
  };

  return (
    <ScreenContainer scrollable={false} backgroundColor="#0F0F1A">
      {/* ══ HEADER ══ */}
      <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={() => navigation?.goBack?.()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackArrowIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          <T>Privacy Policy</T>
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* ══ SCROLLABLE CONTENT ══ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(34, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Welcome Banner Card */}
        <View style={styles.introCard}>
          <Text style={styles.appNameBadge}>funMaza</Text>
          <Text style={styles.introText}>
            <T>Welcome to funMaza ("the App"). We are committed to protecting your personal data and your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.</T>
          </Text>
        </View>

        {/* ══ SECTION 1: Information We Collect ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>📁</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>1. Information We Collect</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Account Information</T>: </Text>
                <T>When you register, we collect your phone number, email address, social media login details (if used), user name, and profile picture.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Audio Data</T>: </Text>
                <T>As a voice chat application, we access your device’s microphone to transmit your voice in real-time chat rooms. We do not store your private audio chats on our servers unless required for safety or moderation.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Transaction Data</T>: </Text>
                <T>If you purchase virtual coins or diamonds, our third-party payment processors collect payment details. We do not store your full credit card or bank details on our servers.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Device & Technical Data</T>: </Text>
                <T>We automatically collect your IP address, device model, operating system, and app usage logs to ensure smooth app performance.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 2: How We Use Your Information ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⚙️</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>2. How We Use Your Information</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>To provide and manage your account and voice chat functionalities.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>To process your virtual gifting and coin purchases.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>To monitor and prevent fraud, abuse, harassment, or violations of our Terms of Service (such as managing user reports).</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 3: Permissions We Request ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🔑</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>3. Permissions We Request</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Microphone</T>: </Text>
                <T>Required to participate in live voice chat rooms.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Storage/Gallery</T>: </Text>
                <T>Required if you wish to upload a profile picture or send images.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.boldLabel}><T>Notifications</T>: </Text>
                <T>Required to notify you about gifts, follows, and room activities.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 4: Data Security & Retention ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🔒</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>4. Data Security & Retention</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>We implement industry-standard security measures to protect your personal information.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>We retain your information for as long as your account is active or as needed to provide you services.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 5: Contact Us ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>✉️</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>5. Contact Us</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>If you have any questions about this Privacy Policy, please contact us via the "Contact Us" menu inside the App or email us at:</T>{' '}
                <Text style={styles.emailHighlight} onPress={handleEmailPress}>
                  funmaja@gmail.com
                </Text>
              </Text>
            </View>
          </View>

          {/* Email Quick Action Card */}
          <TouchableOpacity
            style={styles.emailBtnCard}
            activeOpacity={0.8}
            onPress={handleEmailPress}
          >
            <Text style={styles.emailBtnEmoji}>📧</Text>
            <View style={styles.emailBtnInfo}>
              <Text style={styles.emailBtnLabel}><T>Official Support Email</T></Text>
              <Text style={styles.emailBtnAddress}>funmaja@gmail.com</Text>
            </View>
            <Text style={styles.emailBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Contact Us Support Button */}
        <TouchableOpacity
          style={styles.contactSupportBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (navigation?.navigate) {
              navigation.navigate('UserProblem');
            }
          }}
        >
          <Text style={styles.contactSupportText}>
            <T>Need Help? Open Support Center</T>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#0F0F1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerPlaceholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Intro Card
  introCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 16,
  },
  appNameBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  introText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
    fontWeight: '400',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionIconEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },

  // Bullet Lists
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    color: '#818CF8',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13.5,
    color: '#CBD5E1',
    lineHeight: 21,
    flex: 1,
  },
  boldLabel: {
    fontWeight: '700',
    color: '#F1F5F9',
  },
  emailHighlight: {
    color: '#818CF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Email Quick Action Card
  emailBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    padding: 12,
    marginTop: 14,
  },
  emailBtnEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  emailBtnInfo: {
    flex: 1,
  },
  emailBtnLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emailBtnAddress: {
    fontSize: 14,
    color: '#A5B4FC',
    fontWeight: '700',
  },
  emailBtnArrow: {
    fontSize: 20,
    color: '#818CF8',
    fontWeight: '700',
  },

  // Contact Support Button
  contactSupportBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  contactSupportText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '600',
  },
});

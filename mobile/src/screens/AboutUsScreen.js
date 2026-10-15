import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
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

export default function AboutUsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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
          <T>About Us</T>
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
        {/* App Hero Branding Card */}
        <View style={styles.heroCard}>
          <View style={styles.logoBadgeWrap}>
            <Text style={styles.logoEmoji}>🎙️</Text>
          </View>
          <Text style={styles.heroAppName}>funMaza</Text>
          <Text style={styles.heroTagline}>
            <T>Live Voice Chat & Virtual Gifting</T>
          </Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Welcome & Intro Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.bodyText}>
            <T>Welcome to funMaza, the ultimate live voice chat and gifting platform designed to bring people closer, no matter where they are.</T>
          </Text>
          <Text style={[styles.bodyText, { marginTop: 12 }]}>
            <T>Our app is built for creating real connections, sharing moments, and having fun in real-time. Whether you want to join exciting group voice chat rooms, meet new friends, showcase your talent, or express your appreciation through our unique virtual gifting system, funMaza offers a safe, vibrant, and interactive space for everyone.</T>
          </Text>
        </View>

        {/* ══ OUR MISSION ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🎯</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>Our Mission</T>
            </Text>
          </View>

          <Text style={styles.missionText}>
            <T>To build a global audio-community where voice bridges the gap between strangers, turning them into friends through meaningful conversations and interactive entertainment.</T>
          </Text>
        </View>

        {/* ══ WHY CHOOSE US? ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⭐</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>Why Choose Us?</T>
            </Text>
          </View>

          <View style={styles.featuresList}>
            {/* Feature 1 */}
            <View style={styles.featureItem}>
              <View style={styles.featureBulletWrap}>
                <Text style={styles.featureEmoji}>🎙️</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureHeading}>
                  <T>Live Voice Rooms</T>
                </Text>
                <Text style={styles.featureDesc}>
                  <T>High-quality, seamless group voice chats with people worldwide.</T>
                </Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureItem}>
              <View style={styles.featureBulletWrap}>
                <Text style={styles.featureEmoji}>🎁</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureHeading}>
                  <T>Virtual Gifting</T>
                </Text>
                <Text style={styles.featureDesc}>
                  <T>Express yourself and support your favorite hosts with beautiful animated gifts.</T>
                </Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureItem}>
              <View style={styles.featureBulletWrap}>
                <Text style={styles.featureEmoji}>🛡️</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureHeading}>
                  <T>Safe Community</T>
                </Text>
                <Text style={styles.featureDesc}>
                  <T>A secure environment backed by strong moderation tools to ensure positive interactions.</T>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thank You Footer Card */}
        <View style={styles.thankYouCard}>
          <Text style={styles.heartEmoji}>💖</Text>
          <Text style={styles.thankYouText}>
            <T>Thank you for being a part of our growing family. Let’s talk, connect, and share joy together!</T>
          </Text>
        </View>
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

  // Hero Card
  heroCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    marginBottom: 16,
  },
  logoBadgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 32,
  },
  heroAppName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTagline: {
    fontSize: 13,
    color: '#A5B4FC',
    fontWeight: '500',
    marginBottom: 10,
  },
  versionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#1E1E2D',
    borderRadius: 18,
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
  bodyText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
    fontWeight: '400',
  },
  missionText: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 23,
    fontStyle: 'normal',
    fontWeight: '500',
  },

  // Features List
  featuresList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureBulletWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureInfo: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },

  // Thank You Card
  thankYouCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginTop: 2,
  },
  heartEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  thankYouText: {
    fontSize: 13.5,
    color: '#C7D2FE',
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '600',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

export default function TermsScreen({ navigation }) {
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
          <T>Terms and Conditions</T>
        </Text>

        {/* Balance layout spacing */}
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
            <T>Welcome to funMaza ("the App"). By downloading, installing, registering, or using this App, you agree to comply with and be bound by the following Terms and Conditions.</T>
          </Text>
        </View>

        {/* ══ SECTION 1: User Accounts & Security ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🛡️</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>1. User Accounts & Security</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>You are solely responsible for safeguarding your login credentials and password.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>You are fully liable for all activities, messages, and voice transmissions that occur under your user ID.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 2: User Conduct & Live Voice Chat Rules ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⚖️</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>2. User Conduct & Live Voice Chat Rules</T>
            </Text>
          </View>

          <Text style={styles.subClauseText}>
            <T>You strictly agree NOT to use the App to:</T>
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Transmit, broadcast, or discuss any content that is abusive, obscene, sexually explicit, defamatory, vulgar, threatening, or racially offensive.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Host or participate in any room promoting hate speech, violence, illegal trade, or harassment.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Record, redistribute, or share audio conversations of other users without their express consent.</T>
              </Text>
            </View>
          </View>

          {/* Account Ban via Reports Highlight Box */}
          <View style={styles.banWarningCard}>
            <View style={styles.banWarningHeader}>
              <Text style={styles.banWarningIcon}>🚨</Text>
              <Text style={styles.banWarningTitle}>
                <T>Account Ban via Reports</T>
              </Text>
            </View>
            <Text style={styles.banWarningText}>
              <T>If a user’s ID receives more than 4 reports from other users due to community violations, the account will be automatically banned from the App, and the user will not be able to log in again. To appeal this ban or request reactivation, the user must reach out to our official support team via the "Contact Us" menu within the App.</T>
            </Text>
          </View>
        </View>

        {/* ══ SECTION 3: Virtual Goods, Coins & Gifting Policy ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🪙</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>3. Virtual Goods, Coins & Gifting Policy</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>The App features a virtual economy consisting of Coins, Diamonds, and virtual gifts.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>All virtual items, coins, and gifts hold no real-world monetary value and cannot be redeemed, transferred, or exchanged for fiat currency or tangible assets outside the App.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>All purchases of virtual coins and items are final and strictly non-refundable.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Any attempt to exploit, hack, or manipulate the gifting and coin balance system will result in an immediate and irreversible ban.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 4: Moderation & Termination of Service ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⚡</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>4. Moderation & Termination of Service</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>We reserve the right to monitor, review, mute, suspend, or permanently terminate any account at our discretion without prior notice if these Terms are breached.</T>
              </Text>
            </View>
          </View>
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
            <T>Have questions? Contact Us</T>
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
  subClauseText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 10,
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

  // Ban Warning Box
  banWarningCard: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  banWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  banWarningIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  banWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  banWarningText: {
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 20,
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

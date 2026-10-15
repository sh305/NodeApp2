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

export default function RefundPolicyScreen({ navigation }) {
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
          <T>Refund Policy</T>
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
            <T>Thank you for using funMaza ("the App"). Please read this policy carefully before purchasing any virtual goods, coins, diamonds, or features.</T>
          </Text>
        </View>

        {/* ══ SECTION 1: General Policy (No Refunds) ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🚫</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>1. General Policy (No Refunds)</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>All purchases of virtual currency (Coins, Diamonds, or Beans) and virtual gifts made within the App are final, non-cancelable, and strictly non-refundable.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Once virtual items or coins are credited to your account or gifted to another user, they cannot be exchanged back for cash, real-world money, or other goods and services.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 2: Payment Failure & Refund Assistance ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>💳</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>2. Payment Failure & Refund Assistance</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>In the event of a payment failure or failed transaction where money is deducted but items are not credited, you must reach out to us by navigating to the "Contact Us" menu within the App. Once you submit your query, our support team will reply to you there with detailed instructions on how your refund will be processed and issued.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 3: Account Banned/Terminated ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⚠️</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>3. Account Banned/Terminated</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>If your account is suspended, blocked, or permanently banned from the App due to a violation of our Terms and Conditions (e.g., receiving more than 4 reports for abusive behavior, hate speech, or harassment), any remaining balance of virtual coins, diamonds, or gifts in your account will be forfeited immediately. No refunds will be provided for banned accounts.</T>
              </Text>
            </View>
          </View>

          {/* Forfeit Notice Card */}
          <View style={styles.forfeitWarningCard}>
            <Text style={styles.forfeitWarningText}>
              <T>Remaining coins, diamonds, or gifts are forfeited immediately upon account ban. No refunds are provided.</T>
            </Text>
          </View>
        </View>

        {/* ══ SECTION 4: Exceptions & Timeline ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>⏳</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>4. Exceptions & Timeline</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Please allow up to 24 hours for virtual coins to reflect in your user ID after a successful transaction. If the balance does not update after 24 hours, kindly contact us via the "Contact Us" menu or email us at</T>{' '}
                <Text style={styles.emailHighlight} onPress={handleEmailPress}>
                  funmaja@gmail.com
                </Text>{' '}
                <T>along with your payment receipt and User ID.</T>
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
              <Text style={styles.emailBtnLabel}><T>Refund & Payment Support Email</T></Text>
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
            <T>Report Failed Transaction in Support Center</T>
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
  emailHighlight: {
    color: '#818CF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Forfeit Warning Box
  forfeitWarningCard: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  forfeitWarningText: {
    fontSize: 12.5,
    color: '#FCA5A5',
    lineHeight: 18,
    fontWeight: '600',
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

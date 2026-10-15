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

export default function IntellectualPropertyScreen({ navigation }) {
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
          <T>Intellectual Property Rights</T>
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
            <T>Welcome to funMaza ("the App"). All intellectual property rights regarding the App and its content belong strictly to us or our licensors. By using the App, you agree to respect these rights.</T>
          </Text>
        </View>

        {/* ══ SECTION 1: Ownership of App Materials ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>💻</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>1. Ownership of App Materials</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>All software, code, algorithms, user interfaces (UI), graphics, designs, logos, brand names, sound effects, and animations within the App are the exclusive property of funMaza.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>You are granted a limited, non-transferable, and revocable license to use the App solely for personal, non-commercial entertainment. You may not copy, modify, reverse-engineer, distribute, or create derivative works of our software or graphics.</T>
              </Text>
            </View>
          </View>
        </View>

        {/* ══ SECTION 2: Virtual Goods & Assets Protection ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>💎</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>2. Virtual Goods & Assets Protection</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>All digital assets, including but not limited to Virtual Coins, Diamonds, Badges, VIP frames, and Animated Gifts, are proprietary designs protected under intellectual property laws.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>Users do not own these digital assets; they only buy a limited license to use them inside the App. Any unauthorized duplication, modification, or external trade of these assets constitutes intellectual property theft and will result in legal action.</T>
              </Text>
            </View>
          </View>

          {/* Legal Protection Highlight */}
          <View style={styles.legalNoticeCard}>
            <Text style={styles.legalNoticeText}>
              <T>Any unauthorized duplication, modification, or external trade of these assets constitutes intellectual property theft and will result in legal action.</T>
            </Text>
          </View>
        </View>

        {/* ══ SECTION 3: User-Generated Content (UGC) ══ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.sectionIconEmoji}>🎤</Text>
            </View>
            <Text style={styles.sectionTitle}>
              <T>3. User-Generated Content (UGC)</T>
            </Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>By speaking in voice rooms, hosting audio streams, or uploading profile pictures, you retain ownership of your content. However, you grant the App a worldwide, royalty-free, perpetual license to host, display, reproduce, and transmit this content to deliver our services.</T>
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>
                <T>You warrant that any content you share or broadcast does not infringe upon the copyrights, trademarks, or privacy rights of any third party.</T>
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
            <T>IP Infringement Concerns? Contact Us</T>
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

  // Legal Notice Box
  legalNoticeCard: {
    marginTop: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  legalNoticeText: {
    fontSize: 12.5,
    color: '#FCA5A5',
    lineHeight: 18,
    fontWeight: '600',
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { T } from '../components/TranslatedText';
import { useToast } from '../components/Toast';

// ══ 1. SVG ICONS EXACTLY MATCHING SCREENSHOTS ══
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
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 1. Account Binding (Link Chains Icon)
const AccountBindingIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 2. Language (Globe Icon)
const LanguageGlobeIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.9" />
    <Path
      d="M2.5 12h19M12 2.5a14.5 14.5 0 013.8 9.5 14.5 14.5 0 01-3.8 9.5 14.5 14.5 0 01-3.8-9.5A14.5 14.5 0 0112 2.5z"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 3. VIP Settings (Crown with VIP outline)
const VipCrownIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 8l3.5 8.5h11L21 8l-4.5 3-4.5-6.5-4.5 6.5L3 8z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 19.5h12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Circle cx="3" cy="8" r="0.9" fill={color} />
    <Circle cx="12" cy="4.5" r="0.9" fill={color} />
    <Circle cx="21" cy="8" r="0.9" fill={color} />
  </Svg>
);

// 4. Online Status (Badge emblem / status shield)
const OnlineStatusIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 2.5z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="11.8" r="2.2" fill={color} />
  </Svg>
);

// 5. Comment Disabled (Chat bubble with slash)
const CommentDisabledIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.5 15a2 2 0 01-2 2H7l-4 4V5.5a2 2 0 012-2h13.5a2 2 0 012 2V15z"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 8.5l7 7M15.5 8.5l-7 7"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

// 6. Blacklist (User silhouette with slash)
const BlacklistIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 002 18.5V20"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8" cy="7.5" r="3.5" stroke={color} strokeWidth="1.9" />
    <Circle cx="17.5" cy="11" r="3.5" stroke={color} strokeWidth="1.8" />
    <Path d="M15 8.5l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

// 7. Join an Agency (Building with flag)
const JoinAgencyIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21h18M5 21V9.5l7-4.5 7 4.5V21"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 5V1.5M12 1.5h4.5l-1.2 1.8 1.2 1.7H12"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x="9.5" y="14" width="5" height="7" rx="0.8" stroke={color} strokeWidth="1.8" />
  </Svg>
);

// 8. Community Content Rules (Document with lines)
const ContentRulesIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2.5H6a2 2 0 00-2 2v15a2 2 0 002 2h12a2 2 0 002-2V8.5z"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2.5v6h6M8 13.5h8M8 17h5"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 9. Log out Icon (Door / Bracket with exit arrow)
const LogoutIcon = ({ size = 22, color = '#2C2C2E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function SettingScreen({ navigation, onLogout }) {
  const insets = useSafeAreaInsets();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { showToast } = useToast();

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [currentOnlineStatus, setCurrentOnlineStatus] = useState('Online');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_info');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.onlineStatus === 'invisible') {
            setCurrentOnlineStatus('Invisible');
          } else {
            setCurrentOnlineStatus('Online');
          }
        }
      } catch (e) {}
    };
    fetchStatus();
    const unsub = navigation?.addListener?.('focus', fetchStatus);
    return unsub;
  }, [navigation]);

  // Find active language display name
  const activeLangObj =
    LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  // Generic handler for menu items as requested: "in sab ka click per kya hoga wo bad ma batyunga ma"
  const handleItemPress = (key, title) => {
    if (key === 'accountBinding') {
      if (navigation?.navigate) {
        navigation.navigate('AccountBinding');
      } else {
        showToast(t('Account Binding'), 'info');
      }
      return;
    }
    if (key === 'onlineStatus') {
      if (navigation?.navigate) {
        navigation.navigate('OnlineStatus');
      } else {
        showToast(t('Online Status'), 'info');
      }
      return;
    }
    if (key === 'commentDisabled') {
      if (navigation?.navigate) {
        navigation.navigate('CommentDisabled');
      } else {
        showToast(t('Comment Disabled'), 'info');
      }
      return;
    }
    if (key === 'blacklist') {
      if (navigation?.navigate) {
        navigation.navigate('Blacklist');
      } else {
        showToast(t('Blacklist'), 'info');
      }
      return;
    }
    if (key === 'language') {
      setLanguageModalVisible(true);
      return;
    }
    if (key === 'terms') {
      if (navigation?.navigate) {
        navigation.navigate('Terms');
      } else {
        showToast(t('Terms and Conditions'), 'info');
      }
      return;
    }
    if (key === 'privacy') {
      if (navigation?.navigate) {
        navigation.navigate('Privacy');
      } else {
        showToast(t('Privacy Policy'), 'info');
      }
      return;
    }
    if (key === 'refund') {
      if (navigation?.navigate) {
        navigation.navigate('Refund');
      } else {
        showToast(t('Refund Policy'), 'info');
      }
      return;
    }
    if (key === 'ipRights') {
      if (navigation?.navigate) {
        navigation.navigate('IpRights');
      } else {
        showToast(t('Intellectual Property Rights'), 'info');
      }
      return;
    }
    if (key === 'about') {
      if (navigation?.navigate) {
        navigation.navigate('About');
      } else {
        showToast(t('About Us'), 'info');
      }
      return;
    }
    if (key === 'contact') {
      if (navigation?.navigate) {
        navigation.navigate('UserProblem');
      } else {
        showToast(t('Contact Us'), 'info');
      }
      return;
    }
    showToast(t(`${title} coming soon`), 'info');
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    if (onLogout) {
      onLogout();
    } else {
      showToast(t('Logged out successfully'), 'success');
      navigation.goBack();
    }
  };

  // ══ SECTION 1 ITEMS (WITH CUSTOM FLATICON-STYLE ICONS) ══
  const section1Items = [
    {
      key: 'accountBinding',
      title: 'Account Binding',
      icon: <AccountBindingIcon />,
    },
    {
      key: 'language',
      title: 'Language',
      icon: <LanguageGlobeIcon />,
      rightText: activeLangObj.name,
    },
    {
      key: 'vipSettings',
      title: 'VIP Settings',
      icon: <VipCrownIcon />,
    },
    {
      key: 'onlineStatus',
      title: 'Online Status',
      icon: <OnlineStatusIcon />,
      rightText: t(currentOnlineStatus),
    },
    {
      key: 'commentDisabled',
      title: 'Comment Disabled',
      icon: <CommentDisabledIcon />,
    },
    {
      key: 'blacklist',
      title: 'Blacklist',
      icon: <BlacklistIcon />,
    },
    {
      key: 'joinAgency',
      title: 'Join an Agency',
      icon: <JoinAgencyIcon />,
    },
    {
      key: 'communityRules',
      title: 'Community Content Rules',
      icon: <ContentRulesIcon />,
    },
  ];

  // ══ SECTION 2 ITEMS (CLEAN TEXT-ONLY LIST FROM SCREENSHOT 2) ══
  const section2Items = [
    { key: 'terms', title: 'Terms and Conditions' },
    { key: 'privacy', title: 'Privacy Policy' },
    { key: 'refund', title: 'Refund Policy' },
    { key: 'ipRights', title: 'Intellectual Property Rights' },
    { key: 'about', title: 'About Us' },
    { key: 'contact', title: 'Contact Us' },
  ];

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
          <T>Setting</T>
        </Text>

        {/* Symmetry placeholder */}
        <View style={{ width: 36 }} />
      </View>

      {/* ══ BODY SCROLL ══ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(34, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── CARD GROUP 1 (SCREENSHOT 1) ── */}
        <View style={styles.cardGroup}>
          {section1Items.map((item, index) => (
            <React.Fragment key={item.key}>
              <TouchableOpacity
                style={styles.rowItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.key, item.title)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrap}>{item.icon}</View>
                  <Text style={styles.rowTitleText}>
                    <T>{item.title}</T>
                  </Text>
                </View>

                <View style={styles.rowRight}>
                  {item.rightText && (
                    <Text style={styles.rowRightValueText}>
                      <T>{item.rightText}</T>
                    </Text>
                  )}
                  <ChevronRightIcon size={18} color="#C7C7CC" />
                </View>
              </TouchableOpacity>
              {index < section1Items.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── CARD GROUP 2 (SCREENSHOT 2) ── */}
        <View style={styles.cardGroup}>
          {section2Items.map((item, index) => (
            <React.Fragment key={item.key}>
              <TouchableOpacity
                style={styles.rowItemTextOnly}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item.key, item.title)}
              >
                <Text style={styles.rowTitleText}>
                  <T>{item.title}</T>
                </Text>
                <ChevronRightIcon size={18} color="#C7C7CC" />
              </TouchableOpacity>
              {index < section2Items.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── LOG OUT BUTTON ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => setLogoutModalVisible(true)}
        >
          <LogoutIcon size={20} color="#2C2C2E" />
          <Text style={styles.logoutBtnText}>
            <T>Log out</T>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ══ LANGUAGE SELECTOR MODAL ══ */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View
            style={styles.languageModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                <T>Select Language</T>
              </Text>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {LANGUAGES.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langOptionItem,
                      isSelected && styles.langOptionItemSelected,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setLanguage(lang.code);
                      setLanguageModalVisible(false);
                      showToast(t('Language changed successfully'), 'success');
                    }}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.langNameText,
                          isSelected && styles.langNameTextSelected,
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text style={styles.langNativeText}>{lang.nativeName}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.langCheckCircle}>
                        <Text style={styles.langCheckMark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ LOGOUT CONFIRMATION MODAL ══ */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLogoutModalVisible(false)}
        >
          <View
            style={styles.logoutModalCard}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.logoutModalTitle}>
              <T>Log out</T>
            </Text>
            <Text style={styles.logoutModalSub}>
              <T>Are you sure you want to log out of your account?</T>
            </Text>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelText}>
                  <T>Cancel</T>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                activeOpacity={0.8}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.logoutConfirmText}>
                  <T>Log out</T>
                </Text>
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
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#F7F8FA',
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
    paddingTop: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowItemTextOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 54,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowTitleText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRightValueText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 6,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F2',
    marginLeft: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 14,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  languageModalContent: {
    width: '100%',
    maxHeight: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
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
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  langOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },
  langOptionItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  langFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  langNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  langNameTextSelected: {
    color: '#4F46E5',
  },
  langNativeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  langCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCheckMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Logout Modal
  logoutModalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  logoutModalSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  logoutModalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  logoutCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

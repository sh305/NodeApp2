import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

// Pure RAM Cache (0 bytes stored on user's phone disk)
const ramCache = new Map();

const LanguageContext = createContext();

// Detect device system language
const detectDeviceLanguage = () => {
  try {
    const locale =
      Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.locale ||
      (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) ||
      'en';
    const code = locale.split(/[-_]/)[0].toLowerCase();
    const matched = LANGUAGES.find((l) => l.code === code);
    return matched ? matched.code : 'en';
  } catch (e) {
    return 'en';
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  // Live RAM translations (Zero phone disk storage)
  const [liveTranslations, setLiveTranslations] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dynamic set of all phrases used in the app (auto-accumulated at runtime)
  const knownPhrases = useRef(
    new Set([
      'Voice Chat, Play Games, Make Friends',
      'Sign in with Google / Gmail',
      'Instant 6-Digit Email OTP',
      'Sign in with Phone Number',
      'Fast SMS Verification Code',
      'Mobile Phone Login',
      'Gmail / Email Login',
      'Mobile Number',
      'Enter 10-digit number',
      'Get OTP',
      'Resend',
      'Enter 6-Digit SMS OTP',
      'Enter 6-Digit Email OTP',
      'Enter 6-digit OTP',
      'Verify OTP',
      'Verified ✅',
      'Your Full Name',
      'Verify & Login',
      'Verify OTP First to Login 🔒',
      'Gmail / Email Address',
      'By continuing, you agree to our',
      'Terms of Service',
      'Privacy Policy',
      'and',
      'Choose Language',
      'Search language...',
      'Please enter a valid 10-digit mobile number',
      'Message Sent Successfully',
      'Failed to send OTP',
      'Please enter the 6-digit OTP code',
      'OTP Verified Successfully! ✅',
      'Wrong OTP! Please enter correct 6 digit OTP',
      'Please verify your OTP first',
      'Please enter your full name',
      'Login Successful! Welcome 🎉',
      'Login failed',
      'Please enter a valid Gmail / Email address',
      'YoYo Rooms',
      '🟢 Live Voice Chat',
      'Logout',
      'Do you want to logout from your account?',
      'Cancel',
      'Create Room',
      'Register New Account',
      'Gmail Account Login',
      'Login User',
      'Register User',
      'Enter Gmail ID',
      'OTP code sent to your Gmail inbox!',
      'Failed to send OTP to email',
      'Failed to send Email OTP',
      'Create Password',
      'Confirm Password',
      'Passwords Match',
      'Mismatch',
      'Register & Create Account',
      'Already have an account?',
      'New to YoYo?',
      'Password Verified Successfully! Welcome 🎉',
      'Registration Successful! Welcome 🎉',
      'Registration failed',
      'Invalid email or password',
      'Password must be at least 4 characters long',
      'Password and Confirm Password do not match!',
      'Please enter your password',
      'Tap "Get OTP" first',
      'Verify OTP First',
      'Fill All Required Fields',
      'Check your Gmail Inbox & Spam folder',
      'Mobile Number Login',
      'Account not found with this Mobile Number! Please click Register User first.',
      'Please verify your Mobile OTP first before completing registration',
      'SMS OTP code sent to your mobile!',
      'Waiting for OTP...',
      'Re-enter your password',
      'At least 4 characters',
      'e.g. Rahul Sharma',
      'Related',
      'Party',
      'Activity',
      'Recently',
      'Following',
      'People you may like',
      'Follow',
      'Following',
      'Mine',
      'Room',
      'Gaming',
      'Discover',
      'Message',
      'Me',
      'Create Your Room',
      'Daily Check-in',
      'Check-in Successful! +100 Coins Claimed 🎉',
      'Virtual Lover',
      'YoYo Star',
      'YoYo Fan',
      'Your Online Soulmate',
      'Ludo',
      'Dominos',
      'UNO',
      'Games',
      'BETS',
      '1 ON 1',
      '4 Players',
      '2 Players (1 ON 1)',
      'Play Now',
      'Marvel Ludo',
      'Snake&Ladder',
      'Ludo Coin',
      '5/Point',
      '200 Limits/Round',
      'Get',
      'Claimed',
      'Daily Game Coins',
      'Claim free coins daily! Streak increases your reward.',
      'Game Bet',
      'Your Balance',
      'Game Coins',
      'Select Play Mode',
      'Online Battle',
      'Match with online players',
      'Local Play',
      'Pass & Play / vs AI',
      'Number of Players',
      'Insufficient Game Coins! Please claim free coins from the Silver Chest.',
      'Open Silver Chest 🎁',
      'Find Match & Play 🎮',
      'Start Local Game 🎮',
      'Exit Game',
      'Your Turn to Roll!',
      'Opponent is Rolling...',
      'Tap dice to roll!',
      'Waiting for opponent',
      'VICTORY! 🏆 +180 Coins',
      'MATCH OVER',
      'Done',
      'Your Cards (Tap to Play)',
      'Draw',
      'UNO! Only 1 card left! 🔥',
      'Dominoes Board',
      'Your Tiles (Tap matching tile)',
      'Featured Games',
      'Aap aaj ka Silver Chest pehle hi claim kar chuke hain! Kal dobara milega.',
      'Aap aaj ka Silver Chest pehle hi claim kar chuke hain! Ek din me sirf ek bar hi get kar sakte hain. Kal dobara aaiye ya previous games jeet kar coins badhaiye.',
      'Aap aaj ka Silver Chest reward pehle hi claim kar chuke hain! Kal dobara aaiye.',
      'View Streak Info ℹ️',
      'Victory!',
      'You won',
      'Game Coins!',
      'VICTORY! 🏆',
      'Coins',
      'Main Wallet Coins:',
      '(Use Game Coins to play games)',
      'Game Store coming soon! 🏪',
      'Opponent reached home! Better luck next time.',
      'Opponent finished their cards! Better luck next time.',
      'Drew a card from deck!',
      'Tile placed! Opponent thinking...',
      'Opponent placed a tile! Your turn.',
      'Tile dots must match the open end!',
      'Card must match color or number!',
      'Already Claimed for Today! Come back tomorrow',
      'Already Claimed for Today! Next claim available tomorrow',
      'Day 1',
      'Day 2',
      'Day 3',
      'Day 4',
      'Day 5',
      'Day 6',
      'Day 7',
      'Daily Reward Unlocked!',
      'Silver Chest Unlocked!',
      'Awesome! Close',
      'Collect & Close',
      'Coins added to your Game Balance',
      'Play Ludo, Dominos & UNO to win more!',
      'Day 1 Claimed!',
      'Day 2 Claimed!',
      'Day 3 Claimed!',
      'Day 4 Claimed!',
      'Day 5 Claimed!',
      'Day 6 Claimed!',
      'Day 7 Claimed!',
      'Quit Game?',
      'If you leave the match now, your bet coins will be forfeited!',
      'Keep Playing',
      'Quit Game',
      'Match forfeited!',
      'Match lost!',
      'Game Coins deducted.',
      'Insufficient Game Coins!',
      'DEFEAT 😢',
      'QUIT / FORFEITED ⚠️',
      'Ludo Classic',
      'Roll Dice',
      'Your Turn!',
      "Opponent's Turn",
      'Rolled a 6! Roll Again 🎲',
      'PK! Opponent token cut! ⚔️',
      'Token reached HOME! 🌟',
      'Tap glowing token to move',
      'No valid moves',
      'Tokens Home',
      'You',
      'Opponent',
      'Bonus Turn!',
    ])
  );

  const pendingRequests = useRef(new Set());

  useEffect(() => {
    initLanguage();
  }, []);

  const initLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('@app_language');
      const langToUse = savedLang || detectDeviceLanguage();
      setCurrentLanguage(langToUse);
      if (langToUse !== 'en') {
        fetchBatchTranslations(langToUse);
      }
    } catch (e) {
      setCurrentLanguage('en');
    }
  };

  /**
   * Translates all phrases in ONE single batch call to Backend (~0.2s)
   * 100% Dynamic: Zero hardcoded dictionaries on server or client!
   */
  const fetchBatchTranslations = async (langCode) => {
    if (langCode === 'en') {
      setLiveTranslations({});
      return;
    }

    try {
      const phrasesArray = Array.from(knownPhrases.current);
      const res = await api.post('/translations/batch', {
        texts: phrasesArray,
        targetLang: langCode,
      });

      if (res.data && res.data.success && res.data.translations) {
        setLiveTranslations(res.data.translations);
        Object.entries(res.data.translations).forEach(([k, v]) => {
          ramCache.set(`${langCode}:::${k}`, v);
        });
        setRefreshTrigger((v) => v + 1);
      }
    } catch (err) {
      console.warn('[LanguageContext] Batch translate error:', err);
    }
  };

  const setLanguage = (langCode) => {
    if (!LANGUAGES.some((l) => l.code === langCode)) return;
    try {
      // 1. Instant switch in UI
      setCurrentLanguage(langCode);
      setIsModalOpen(false);

      // 2. Remember choice (only 2 chars saved in AsyncStorage: e.g. 'hi')
      AsyncStorage.setItem('@app_language', langCode).catch(() => {});

      // 3. Fast batch translation request in parallel
      fetchBatchTranslations(langCode);
    } catch (e) {
      console.error('[LanguageContext] Error setting language:', e);
    }
  };

  /**
   * Universal translation function:
   * Translates ANY sentence dynamically.
   * Zero hardcoded dictionaries!
   */
  const t = (keyOrText, fallback = '') => {
    if (!keyOrText) return '';

    const textToTranslate = fallback || keyOrText;
    knownPhrases.current.add(textToTranslate);

    if (currentLanguage === 'en') {
      return textToTranslate;
    }

    // 1. Check live RAM batch translations
    if (liveTranslations && liveTranslations[textToTranslate] !== undefined) {
      return liveTranslations[textToTranslate];
    }
    if (liveTranslations && liveTranslations[keyOrText] !== undefined) {
      return liveTranslations[keyOrText];
    }

    // 2. Check RAM cache
    const cacheKey = `${currentLanguage}:::${textToTranslate}`;
    if (ramCache.has(cacheKey)) {
      return ramCache.get(cacheKey);
    }

    // 3. Dynamic single translation in background if not yet in batch
    if (!pendingRequests.current.has(cacheKey)) {
      pendingRequests.current.add(cacheKey);
      api
        .post('/translations/translate', {
          text: textToTranslate,
          targetLang: currentLanguage,
        })
        .then((res) => {
          pendingRequests.current.delete(cacheKey);
          if (res.data && res.data.success && res.data.translated) {
            ramCache.set(cacheKey, res.data.translated);
            setLiveTranslations((prev) => ({
              ...prev,
              [textToTranslate]: res.data.translated,
              [keyOrText]: res.data.translated,
            }));
          }
        })
        .catch(() => {
          pendingRequests.current.delete(cacheKey);
        });
    }

    return textToTranslate;
  };

  const activeLangObj =
    LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  const filteredLanguages = LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q)
    );
  });

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languagesList: LANGUAGES,
        openLanguageModal: () => {
          setSearchQuery('');
          setIsModalOpen(true);
        },
        closeLanguageModal: () => setIsModalOpen(false),
        activeLanguageName: activeLangObj.nativeName,
        activeLanguagePillText: `${activeLangObj.flag} ${activeLangObj.nativeName} (${activeLangObj.name})`,
      }}
    >
      {children}

      {/* Global Interactive Language Selection Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={() => setIsModalOpen(false)}
          />

          <View style={styles.sheetContainer}>
            {/* Sheet Handle */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>🌐 {t('Choose Language')}</Text>
                <Text style={styles.sheetSubtitle}>
                  Current: {activeLangObj.flag} {activeLangObj.nativeName} ({activeLangObj.name})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('Search language...')}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Language Grid / List */}
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === currentLanguage;
                return (
                  <TouchableOpacity
                    style={[styles.langItem, isSelected && styles.langItemSelected]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setLanguage(item.code);
                    }}
                  >
                    <View style={styles.langLeft}>
                      <Text style={styles.flagIcon}>{item.flag}</Text>
                      <View>
                        <Text style={[styles.nativeName, isSelected && styles.nativeNameSelected]}>
                          {item.nativeName}
                        </Text>
                        <Text style={styles.englishName}>{item.name}</Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkText}>✓</Text>
                      </View>
                    ) : (
                      <View style={styles.radioEmpty} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: '#1E1E2D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 24,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#374151',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262638',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearch: {
    color: '#9CA3AF',
    fontSize: 14,
    padding: 4,
  },
  listContent: {
    paddingBottom: 10,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262638',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langItemSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagIcon: {
    fontSize: 26,
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  nativeNameSelected: {
    color: '#818CF8',
  },
  englishName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
});

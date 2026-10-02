import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import VipLionSticker from './VipLionSticker';
import CpCoupleSticker from './CpCoupleSticker';
import { getIconScoutGif } from '../constants/iconScoutEmojis';
import { COUPLE_EMOJIS, getCoupleEmojiSource } from '../constants/coupleEmojis';
import { SEALS_EMOJIS_PAGES, getSealEmojiSource } from '../constants/sealsEmojis';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Emoji Categories & Pages (Matching Screenshot + Extra Emojis) ──
const EMOJI_CATEGORIES = [
  {
    id: 'classic',
    icon: '😄',
    badge: null,
    pages: [
      // Page 1 (Google Noto Animated Emojis)
      [
        { id: 'weary_sigh', emoji: '😩', label: 'Weary' },
        { id: 'laugh_cry', emoji: '😂', label: 'Laugh' },
        { id: 'loud_cry', emoji: '😭', label: 'Crying' },
        { id: 'heart_wink', emoji: '😘', label: 'Blow Kiss' },
        { id: 'heart_blush', emoji: '🥰', label: 'Love' },
        { id: 'giggle', emoji: '🤭', label: 'Giggle' },
        { id: 'shy_peek', emoji: '🙈', label: 'Shy' },
        { id: 'cool_shades', emoji: '😎', label: 'Cool' },
      ],
      // Page 2
      [
        { id: 'mask_face', emoji: '😷', label: 'Mask' },
        { id: 'shocked_wide', emoji: '😲', label: 'Shocked' },
        { id: 'screaming_shock', emoji: '😱', label: 'Scream' },
        { id: 'praying_hands', emoji: '🙏', label: 'Pray' },
        { id: 'fire_hype', emoji: '🔥', label: 'Fire' },
        { id: 'time_bomb', emoji: '💣', label: 'Bomb' },
        { id: 'hug_warm', emoji: '🤗', label: 'Hug' },
        { id: 'star_eyes', emoji: '🤩', label: 'Starry' },
      ],
      // Page 3
      [
        { id: 'money_face', emoji: '🤑', label: 'Rich' },
        { id: 'party_popper', emoji: '🥳', label: 'Party' },
        { id: 'pleading', emoji: '🥺', label: 'Pleading' },
        { id: 'rage_red', emoji: '😡', label: 'Angry' },
        { id: 'snore_sleep', emoji: '😴', label: 'Sleep' },
        { id: 'sleepy_sigh', emoji: '🥱', label: 'Sleepy' },
        { id: 'think_chin', emoji: '🤔', label: 'Thinking' },
        { id: 'vomit_green', emoji: '🤮', label: 'Sick' },
      ],
      // Page 4
      [
        { id: 'wink_smirk', emoji: '😉', label: 'Wink' },
        { id: 'smirk_wavy', emoji: '🥴', label: 'Smirk' },
        { id: 'angel_halo', emoji: '😇', label: 'Angel' },
        { id: 'lipstick_kiss', emoji: '💋', label: 'Kiss Mark' },
        { id: 'wave_hand', emoji: '👋', label: 'Wave' },
        { id: 'clap_hands', emoji: '👏', label: 'Clap' },
        { id: 'hundred_pts', emoji: '💯', label: '100' },
        { id: 'biceps_flex', emoji: '💪', label: 'Strong' },
      ],
    ],
  },
  {
    id: 'vip',
    icon: '🦁',
    badge: 'VIP',
    badgeColors: ['#F59E0B', '#D97706'],
    pages: [
      // Page 1: Official VIP Animated Emojis (Google Noto Animated)
      [
        {
          id: 'vip_lion',
          emoji: '🦁',
          label: 'Lion',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f981/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f981/512.gif',
        },
        {
          id: 'vip_wolf',
          emoji: '🐺',
          label: 'Wolf',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f43a/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f43a/512.gif',
        },
        {
          id: 'vip_panda',
          emoji: '🐼',
          label: 'Panda',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f43c/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f43c/512.gif',
        },
        {
          id: 'vip_unicorn',
          emoji: '🦄',
          label: 'Unicorn',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.gif',
        },
        {
          id: 'vip_dragon',
          emoji: '🐉',
          label: 'Dragon',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f409/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f409/512.gif',
        },
        {
          id: 'vip_hairy',
          emoji: '🫈',
          label: 'Hairy Creature',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fac8/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fac8/512.gif',
        },
        {
          id: 'vip_dancer',
          emoji: '💃',
          label: 'Dancer',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f483/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f483/512.gif',
        },
        {
          id: 'vip_phoenix',
          emoji: '🐦‍🔥',
          label: 'Phoenix',
          isVip: true,
          category: 'vip',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f426_200d_1f525/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f426_200d_1f525/512.gif',
        },
      ],

    ],
  },
  {
    id: 'cp',
    icon: '💖',
    badge: 'CP',
    badgeColors: ['#EC4899', '#DB2777'],
    pages: [
      COUPLE_EMOJIS,
    ],
  },
  {
    id: 'cat',
    icon: '🐱',
    badge: null,
    pages: [
      [
        {
          id: 'cat_smile',
          emoji: '😺',
          label: 'Smiling Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63a/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63a/512.gif',
        },
        {
          id: 'cat_joy',
          emoji: '😹',
          label: 'Joy Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f639/512.gif',
        },
        {
          id: 'cat_heart_eyes',
          emoji: '😻',
          label: 'Heart Eyes Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63b/512.gif',
        },
        {
          id: 'cat_smirk',
          emoji: '😼',
          label: 'Smirk Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63c/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63c/512.gif',
        },
        {
          id: 'cat_kissing',
          emoji: '😽',
          label: 'Kissing Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63d/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63d/512.gif',
        },
        {
          id: 'cat_scream',
          emoji: '🙀',
          label: 'Scream Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f640/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f640/512.gif',
        },
        {
          id: 'cat_crying',
          emoji: '😿',
          label: 'Crying Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63f/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63f/512.gif',
        },
        {
          id: 'cat_pouting',
          emoji: '😾',
          label: 'Pouting Cat',
          category: 'cat',
          lottieUrl: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63e/lottie.json',
          iconScoutGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f63e/512.gif',
        },
      ],
    ],
  },
  {
    id: 'seals',
    icon: '🦭',
    badge: null,
    pages: SEALS_EMOJIS_PAGES,
  },
];

export default function VoiceRoomEmojiModal({
  visible = false,
  onClose,
  onSelectEmoji,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const pagesListRef = useRef(null);

  const activeCategory = EMOJI_CATEGORIES[activeCategoryIndex] || EMOJI_CATEGORIES[0];
  const totalPages = activeCategory.pages.length;

  // Prefetch active page images so they load instantly from cache without lag
  React.useEffect(() => {
    if (visible && activeCategory?.pages?.length > 0) {
      const currentPageEmojis = activeCategory.pages[activePageIndex] || activeCategory.pages[0] || [];
      currentPageEmojis.forEach((item) => {
        const itemGif = item.iconScoutGif || getIconScoutGif(item.id, item.emoji);
        if (itemGif && typeof itemGif === 'string') {
          Image.prefetch(itemGif).catch(() => { });
        }
      });
    }
  }, [visible, activeCategoryIndex, activePageIndex]);

  const handleSwitchCategory = (index) => {
    setActiveCategoryIndex(index);
    setActivePageIndex(0);
    pagesListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handlePageScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== activePageIndex && page >= 0 && page < totalPages) {
      setActivePageIndex(page);
    }
  };

  const handleEmojiPress = (item) => {
    if (onSelectEmoji) {
      const iconScoutGif = item.iconScoutGif || getIconScoutGif(item.id, item.emoji);
      onSelectEmoji({
        ...item,
        iconScoutGif,
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop touch area to dismiss */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet Drawer */}
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Subtle Top Pull Bar */}
          <View style={styles.pullBarWrap}>
            <View style={styles.pullBar} />
          </View>

          {/* ══ TOP CATEGORY TABS (Classic 😄, VIP 🦁, CP 💖, Cat 🐱, Seals 🦭) ══ */}
          <View style={styles.tabBarWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBar}
            >
              {EMOJI_CATEGORIES.map((cat, index) => {
                const isActive = index === activeCategoryIndex;
                return (
                  <TouchableOpacity
                    key={`cat_${cat.id}`}
                    style={styles.tabBtn}
                    activeOpacity={0.75}
                    onPress={() => handleSwitchCategory(index)}
                  >
                    <View style={styles.tabIconRow}>
                      <Text style={styles.tabEmojiIcon}>{cat.icon}</Text>
                      {cat.badge && (
                        <LinearGradient
                          colors={cat.badgeColors || ['#F59E0B', '#D97706']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.tabBadge}
                        >
                          <Text style={styles.tabBadgeText}>{cat.badge}</Text>
                        </LinearGradient>
                      )}
                    </View>

                    {/* Active Indicator Underline */}
                    {isActive && <View style={styles.tabActiveIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ HORIZONTAL SWIPEABLE EMOJI PAGES (4×2 Grid, 8 per page) ══ */}
          {activeCategory.pages.length === 0 ? (
            <View style={styles.emptyCategoryWrap}>
              <Text style={styles.emptyCategoryIcon}>{activeCategory.icon}</Text>
              <Text style={styles.emptyCategoryTitle}>
                <T>{activeCategory.id.toUpperCase() + ' Emojis'}</T>
              </Text>
              <Text style={styles.emptyCategorySub}>
                <T>Coming Soon</T>
              </Text>
            </View>
          ) : (
            <FlatList
              ref={pagesListRef}
              data={activeCategory.pages}
              keyExtractor={(_, index) => `page_${activeCategory.id}_${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handlePageScroll}
              style={styles.pagesList}
              contentContainerStyle={styles.pagesContent}
              initialNumToRender={1}
              maxToRenderPerBatch={1}
              windowSize={2}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={({ item: pageEmojis }) => (
                <View style={styles.pageGridWrap}>
                  <View style={styles.gridRow}>
                    {pageEmojis.slice(0, 4).map((emojiItem) => {
                      const localGif = emojiItem.localGif || getCoupleEmojiSource(emojiItem.id) || getSealEmojiSource(emojiItem.id);
                      const itemGif = emojiItem.iconScoutGif || getIconScoutGif(emojiItem.id, emojiItem.emoji);
                      const isCpItem = emojiItem.category === 'cp' || emojiItem.id?.startsWith('cp_');
                      return (
                        <TouchableOpacity
                          key={emojiItem.id}
                          style={styles.emojiCell}
                          activeOpacity={0.7}
                          onPress={() => handleEmojiPress(emojiItem)}
                        >
                          <View style={styles.emojiVisualWrap}>
                            {localGif ? (
                              <Image
                                source={localGif}
                                style={{ width: 52, height: 52 }}
                                resizeMode="contain"
                              />
                            ) : isCpItem ? (
                              <CpCoupleSticker id={emojiItem.id} size={50} />
                            ) : itemGif ? (
                              <>
                                <Text style={[styles.emojiChar, { position: 'absolute', opacity: 0.35 }]}>
                                  {emojiItem.emoji}
                                </Text>
                                <Image
                                  source={{ uri: itemGif }}
                                  style={{ width: 44, height: 44 }}
                                  resizeMode="contain"
                                />
                              </>
                            ) : emojiItem.id?.startsWith('lion_') ? (
                              <VipLionSticker id={emojiItem.id} size={52} />
                            ) : (
                              <>
                                <Text style={styles.emojiChar}>{emojiItem.emoji}</Text>
                                {emojiItem.subEmoji && (
                                  <Text style={styles.subEmojiChar}>{emojiItem.subEmoji}</Text>
                                )}
                              </>
                            )}
                            {emojiItem.isVip && (
                              <View style={styles.vipTagWrap}>
                                <Text style={styles.vipTagText}>VIP</Text>
                              </View>
                            )}
                            {emojiItem.isCp && (
                              <View style={styles.cpTagWrap}>
                                <Text style={styles.cpTagText}>CP</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.gridRow}>
                    {pageEmojis.slice(4, 8).map((emojiItem) => {
                      const localGif = emojiItem.localGif || getCoupleEmojiSource(emojiItem.id) || getSealEmojiSource(emojiItem.id);
                      const itemGif = emojiItem.iconScoutGif || getIconScoutGif(emojiItem.id, emojiItem.emoji);
                      const isCpItem = emojiItem.category === 'cp' || emojiItem.id?.startsWith('cp_');
                      return (
                        <TouchableOpacity
                          key={emojiItem.id}
                          style={styles.emojiCell}
                          activeOpacity={0.7}
                          onPress={() => handleEmojiPress(emojiItem)}
                        >
                          <View style={styles.emojiVisualWrap}>
                            {localGif ? (
                              <Image
                                source={localGif}
                                style={{ width: 52, height: 52 }}
                                resizeMode="contain"
                              />
                            ) : isCpItem ? (
                              <CpCoupleSticker id={emojiItem.id} size={50} />
                            ) : itemGif ? (
                              <>
                                <Text style={[styles.emojiChar, { position: 'absolute', opacity: 0.35 }]}>
                                  {emojiItem.emoji}
                                </Text>
                                <Image
                                  source={{ uri: itemGif }}
                                  style={{ width: 44, height: 44 }}
                                  resizeMode="contain"
                                />
                              </>
                            ) : emojiItem.id?.startsWith('lion_') ? (
                              <VipLionSticker id={emojiItem.id} size={52} />
                            ) : (
                              <>
                                <Text style={styles.emojiChar}>{emojiItem.emoji}</Text>
                                {emojiItem.subEmoji && (
                                  <Text style={styles.subEmojiChar}>{emojiItem.subEmoji}</Text>
                                )}
                              </>
                            )}
                            {emojiItem.isVip && (
                              <View style={styles.vipTagWrap}>
                                <Text style={styles.vipTagText}>VIP</Text>
                              </View>
                            )}
                            {emojiItem.isCp && (
                              <View style={styles.cpTagWrap}>
                                <Text style={styles.cpTagText}>CP</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    {/* Placeholder cells for row 2 to preserve clean 4-column layout */}
                    {Array.from({ length: Math.max(0, 4 - pageEmojis.slice(4, 8).length) }).map((_, idx) => (
                      <View key={`empty_cp_pad_${idx}`} style={styles.emojiCell} />
                    ))}
                  </View>

                </View>
              )}
            />
          )}

          {/* ══ PAGINATION DOTS INDICATOR (• • • • •) ══ */}
          {totalPages > 1 && (
            <View style={styles.paginationRow}>
              {Array.from({ length: totalPages }).map((_, dotIdx) => (
                <View
                  key={`dot_${dotIdx}`}
                  style={[
                    styles.paginationDot,
                    dotIdx === activePageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* ══ DISCLAIMER / SAFETY NOTICE AT BOTTOM (Centered) ══ */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              <T>Sexual and violent contents are not allowed. All violators will be banned. Please report and do not expose personal info.</T>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#0F0F1E',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 20,
  },
  pullBarWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  pullBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },

  /* ── Tab Bar ── */
  tabBarWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    position: 'relative',
  },
  tabIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabEmojiIcon: {
    fontSize: 22,
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#10B981', // Neon mint/cyan underline from screenshot
  },

  /* ── Grid Pages ── */
  pagesList: {
    maxHeight: 210,
    marginTop: 8,
  },
  pagesContent: {
    alignItems: 'center',
  },
  pageGridWrap: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 6,
  },
  emojiCell: {
    width: (SCREEN_WIDTH - 48) / 4,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiVisualWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiChar: {
    fontSize: 42,
    textAlign: 'center',
  },
  subEmojiChar: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 18,
  },
  vipTagWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  vipTagText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '900',
  },
  cpTagWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EC4899',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  cpTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  /* ── Pagination Dots ── */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  /* ── Safety Disclaimer ── */
  disclaimerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 6,
    alignItems: 'center',
  },
  disclaimerText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },

  /* ── Empty Category Placeholder ── */
  emptyCategoryWrap: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyCategoryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyCategoryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCategorySub: {
    color: '#94A3B8',
    fontSize: 13,
  },
});

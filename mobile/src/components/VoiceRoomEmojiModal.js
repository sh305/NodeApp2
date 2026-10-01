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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import VipLionSticker from './VipLionSticker';
import { getIconScoutGif } from '../constants/iconScoutEmojis';

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
    icon: '👑',
    badge: 'VIP',
    badgeColors: ['#F59E0B', '#D97706'],
    pages: [],
  },
  {
    id: 'cp',
    icon: '💖',
    badge: 'CP',
    badgeColors: ['#EC4899', '#DB2777'],
    pages: [],
  },
  {
    id: 'games',
    icon: '🍒',
    badge: null,
    pages: [],
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
        if (itemGif) {
          Image.prefetch(itemGif).catch(() => {});
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

          {/* ══ TOP CATEGORY TABS (Classic 😄, VIP 🦁, CP 🖐️, Games 🍒) ══ */}
          <View style={styles.tabBar}>
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
                      const itemGif = emojiItem.iconScoutGif || getIconScoutGif(emojiItem.id, emojiItem.emoji);
                      return (
                        <TouchableOpacity
                          key={emojiItem.id}
                          style={styles.emojiCell}
                          activeOpacity={0.7}
                          onPress={() => handleEmojiPress(emojiItem)}
                        >
                          <View style={styles.emojiVisualWrap}>
                            {emojiItem.id?.startsWith('lion_') ? (
                              <VipLionSticker id={emojiItem.id} size={52} />
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
                            ) : (
                              <>
                                <Text style={styles.emojiChar}>{emojiItem.emoji}</Text>
                                {emojiItem.subEmoji && (
                                  <Text style={styles.subEmojiChar}>{emojiItem.subEmoji}</Text>
                                )}
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.gridRow}>
                    {pageEmojis.slice(4, 8).map((emojiItem) => {
                      const itemGif = emojiItem.iconScoutGif || getIconScoutGif(emojiItem.id, emojiItem.emoji);
                      return (
                        <TouchableOpacity
                          key={emojiItem.id}
                          style={styles.emojiCell}
                          activeOpacity={0.7}
                          onPress={() => handleEmojiPress(emojiItem)}
                        >
                          <View style={styles.emojiVisualWrap}>
                            {emojiItem.id?.startsWith('lion_') ? (
                              <VipLionSticker id={emojiItem.id} size={52} />
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
                            ) : (
                              <>
                                <Text style={styles.emojiChar}>{emojiItem.emoji}</Text>
                                {emojiItem.subEmoji && (
                                  <Text style={styles.subEmojiChar}>{emojiItem.subEmoji}</Text>
                                )}
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
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
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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

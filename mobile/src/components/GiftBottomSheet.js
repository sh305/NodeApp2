import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 5 Main Tabs matching Screenshot 1
const TABS = ['Hot', 'Lucky', 'Couple', 'Custom', 'VIP'];

// Combo Multiplier options (1, 9, 49, 99, 499, 999)
const COMBO_OPTIONS = [1, 9, 49, 99, 499, 999];

export default function GiftBottomSheet({
  visible,
  onClose,
  onSendGift,
  currentUser,
  targetUser = null,
  roomMembers = [],
  onOpenProfile,
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('Hot');
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [isAll, setIsAll] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(targetUser);
  const [recipientPopoverVisible, setRecipientPopoverVisible] = useState(false);
  const [comboPopoverVisible, setComboPopoverVisible] = useState(false);
  const [activePage, setActivePage] = useState(0);

  // Sync recipient when targetUser changes
  useEffect(() => {
    if (targetUser) {
      setSelectedRecipient(targetUser);
    }
  }, [targetUser]);

  const combinedMembers = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (targetUser && (targetUser._id || targetUser.id || targetUser.name)) {
      const tId = String(targetUser._id || targetUser.id || targetUser.name);
      seen.add(tId);
      list.push(targetUser);
    }
    (roomMembers || []).forEach((m) => {
      if (m) {
        const mId = String(m._id || m.id || m.name || '');
        if (mId && !seen.has(mId)) {
          seen.add(mId);
          list.push(m);
        }
      }
    });
    return list.length > 0 ? list : [{ name: 'Room Member', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }];
  }, [targetUser, roomMembers]);

  // Fetch gifts from API
  useEffect(() => {
    if (visible) {
      fetchGifts();
    }
  }, [visible]);

  const fetchGifts = async () => {
    try {
      setLoadingGifts(true);
      const res = await api.get('/gifts');
      if (res.data?.success && Array.isArray(res.data.gifts)) {
        setGifts(res.data.gifts);
        if (!selectedGift && res.data.gifts.length > 0) {
          setSelectedGift(res.data.gifts[0]);
        }
      }
    } catch (e) {
      console.log('Error fetching gifts:', e);
    } finally {
      setLoadingGifts(false);
    }
  };

  // Filter gifts by active tab (fallback to all if empty)
  const filteredGifts = useMemo(() => {
    const tabKey = activeTab.toLowerCase();
    const list = gifts.filter((g) => (g.category || 'hot').toLowerCase() === tabKey);
    return list.length > 0 ? list : gifts.slice(0, 8);
  }, [gifts, activeTab]);

  // Auto-select first gift when tab changes
  useEffect(() => {
    if (filteredGifts.length > 0) {
      setSelectedGift(filteredGifts[0]);
    }
  }, [activeTab, filteredGifts]);

  // Group gifts into pages of 8 (2 rows x 4 columns)
  const giftPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < filteredGifts.length; i += 8) {
      pages.push(filteredGifts.slice(i, i + 8));
    }
    return pages.length > 0 ? pages : [[]];
  }, [filteredGifts]);

  // Calculate recipients
  const finalRecipients = useMemo(() => {
    if (isAll) {
      // All room members or seat users (excluding self)
      const list = (roomMembers || []).filter(
        (m) => m && m._id && String(m._id) !== String(currentUser?._id)
      );
      return list.length > 0 ? list : (selectedRecipient ? [selectedRecipient] : []);
    }
    return selectedRecipient ? [selectedRecipient] : [];
  }, [isAll, roomMembers, selectedRecipient, currentUser?._id]);

  const totalCost = (selectedGift?.coinPrice || 10) * comboMultiplier * (finalRecipients.length || 1);

  // Handle Send Gift
  const handleSend = () => {
    if (!selectedGift) return;

    // Check user coins balance
    const userCoins = currentUser?.coins || 0;
    if (userCoins < totalCost) {
      showToast(t('Insufficient coins. Please recharge your wallet.'), 'error');
      if (navigation?.navigate) {
        onClose();
        navigation.navigate('Wallet', { initialTab: 'coins' });
      }
      return;
    }

    // Call onSendGift callback
    if (onSendGift) {
      onSendGift({
        gift: selectedGift,
        quantity: comboMultiplier,
        isAll,
        recipients: finalRecipients,
        totalCost,
      });
    }
  };

  const handleOpenWallet = (initialTab = 'coins') => {
    onClose();
    if (navigation?.navigate) {
      navigation.navigate('Wallet', { initialTab });
    }
  };

  const handleOpenProfileCard = () => {
    if (onOpenProfile) {
      onOpenProfile(selectedRecipient || targetUser);
    }
  };

  const currentDisplayRecipient = selectedRecipient || targetUser || {
    name: 'Room',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={() => {
          if (recipientPopoverVisible) {
            setRecipientPopoverVisible(false);
          } else {
            onClose();
          }
        }}
      >
        <TouchableOpacity
          style={[styles.sheetContainer, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
          activeOpacity={1}
          onPress={() => setRecipientPopoverVisible(false)}
        >
          {/* ══ 1. TOP CURRENCY & PROFILE BAR (Matching Screenshot 1) ══ */}
          <View style={styles.topCurrencyRow}>
            {/* Currencies Left */}
            <TouchableOpacity
              style={styles.currencyPillGroup}
              activeOpacity={0.85}
              onPress={() => handleOpenWallet('coins')}
            >
              {/* Gold Coins */}
              <View style={styles.singleCurrencyItem}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }}
                  style={styles.goldCoinIcon}
                />
                <Text style={styles.currencyValText}>{currentUser?.coins || 0}</Text>
              </View>

              {/* Diamonds (Blue Crystal) */}
              <View style={styles.singleCurrencyItem}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2856/2856860.png' }}
                  style={styles.diamondIcon}
                />
                <Text style={styles.currencyValText}>{currentUser?.diamonds || 0}</Text>
              </View>

              {/* Green Game Coins with Arrow */}
              <View style={styles.singleCurrencyItem}>
                <View style={styles.greenCoinCircle}>
                  <Text style={styles.greenCoinText}>🪙</Text>
                </View>
                <Text style={styles.greenValText}>{currentUser?.gameCoins || 0}</Text>
                <Text style={styles.chevronRight}>›</Text>
              </View>
            </TouchableOpacity>

            {/* Profile Button Right */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.profileBtnWrap}
              onPress={handleOpenProfileCard}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.profileBtnGradient}
              >
                <Text style={styles.profileBtnIcon}>👤</Text>
                <Text style={styles.profileBtnText}>{t('Profile')}</Text>
                <Text style={styles.profileBtnArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ══ 2. CATEGORY TABS (Hot, Lucky, Couple, Custom, VIP) ══ */}
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabBtn}
                  activeOpacity={0.75}
                  onPress={() => {
                    setActiveTab(tab);
                    setActivePage(0);
                  }}
                >
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {t(tab)}
                  </Text>
                  {isActive && <View style={styles.tabActiveBar} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ══ 3. GIFTS GRID (8 per page, 2 rows x 4 cols, swipable) ══ */}
          {loadingGifts && gifts.length === 0 ? (
            <View style={styles.giftsLoadingContainer}>
              <ActivityIndicator color="#00E5FF" size="large" />
            </View>
          ) : (
            <View style={styles.giftGridContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const page = Math.round(x / SCREEN_WIDTH);
                  if (page !== activePage) setActivePage(page);
                }}
                scrollEventThrottle={16}
              >
                {giftPages.map((pageGifts, pageIdx) => (
                  <View key={`page_${pageIdx}`} style={styles.giftPageWrap}>
                    <View style={styles.giftGrid8}>
                      {pageGifts.map((item) => {
                        const isSelected = selectedGift?._id === item._id;
                        return (
                          <TouchableOpacity
                            key={item._id}
                            activeOpacity={0.8}
                            style={[styles.giftBox, isSelected && styles.giftBoxSelected]}
                            onPress={() => setSelectedGift(item)}
                          >
                            {/* Top Badge (e.g. Train, 520, VIP) */}
                            {Boolean(item.badge) && (
                              <View style={styles.giftBadgeTag}>
                                <Text style={styles.giftBadgeText}>{item.badge}</Text>
                              </View>
                            )}

                            {/* Gift Image */}
                            <Image
                              source={{ uri: item.iconUrl }}
                              style={styles.giftGraphic}
                              resizeMode="contain"
                            />

                            {/* Price in Gold Coins */}
                            <View style={styles.giftPriceRow}>
                              <Text style={styles.coinTinyIcon}>🪙</Text>
                              <Text style={styles.giftPriceText}>{item.coinPrice}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Page Indicator Dots */}
              {giftPages.length > 1 && (
                <View style={styles.pageDotsRow}>
                  {giftPages.map((_, dotIdx) => (
                    <View
                      key={`dot_${dotIdx}`}
                      style={[
                        styles.pageDot,
                        activePage === dotIdx && styles.pageDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ══ 4. RECIPIENT SELECTION POPOVER MENU (Screenshot 2) ══ */}
          {recipientPopoverVisible && (
            <View style={styles.recipientPopover}>
              <ScrollView style={styles.popoverScroll} showsVerticalScrollIndicator={false}>
                {combinedMembers.map((m, idx) => {
                  const mId = m?._id || m?.id || idx;
                  const mName = m?.name || 'User';
                  const mAvatar =
                    m?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  return (
                    <TouchableOpacity
                      key={`recip_${mId}_${idx}`}
                      style={styles.popoverUserItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedRecipient(m);
                        setIsAll(false);
                        setRecipientPopoverVisible(false);
                      }}
                    >
                      <Image source={{ uri: mAvatar }} style={styles.popoverAvatar} />
                      <Text style={styles.popoverUserName} numberOfLines={1}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ══ 5. BOTTOM ACTION BAR (Screenshots 1, 2, 3) ══ */}
          <View style={styles.bottomActionBar}>
            {/* Recipient DP / 'All' Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.recipientBtn}
              onPress={() => setRecipientPopoverVisible((prev) => !prev)}
            >
              {isAll ? (
                <View style={styles.allRecipientBox}>
                  <Text style={styles.allText}>All</Text>
                  <Text style={styles.upCaretIcon}>▲</Text>
                </View>
              ) : (
                <View style={styles.singleRecipientBox}>
                  <Image
                    source={{ uri: currentDisplayRecipient.avatar }}
                    style={styles.recipientAvatarDp}
                  />
                  <Text style={styles.upCaretIcon}>▲</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Checkbox (Checked = All Mode, Unchecked = Single) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.checkboxWrap, isAll && styles.checkboxWrapActive]}
              onPress={() => {
                setIsAll((prev) => !prev);
                setRecipientPopoverVisible(false);
              }}
            >
              {isAll ? (
                <Text style={styles.checkmarkIcon}>✓</Text>
              ) : (
                <View style={styles.uncheckedBox} />
              )}
            </TouchableOpacity>

            {/* Eye / VIP Icon */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.eyeVipBtn}
              onPress={() => showToast(t('VIP preview'), 'info')}
            >
              <View style={styles.vipTinyTag}>
                <Text style={styles.vipTinyText}>VIP</Text>
              </View>
              <Text style={styles.eyeIcon}>👁️</Text>
            </TouchableOpacity>

            {/* Vertical Combo Popover (Matching YoYo & User request) */}
            {comboPopoverVisible && (
              <View style={styles.comboVerticalPopover}>
                <ScrollView
                  style={styles.comboVerticalScroll}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                >
                  {[999, 499, 99, 49, 9, 1].map((val) => {
                    const isSelected = comboMultiplier === val;
                    return (
                      <TouchableOpacity
                        key={`vcombo_${val}`}
                        style={[
                          styles.comboVerticalItem,
                          isSelected && styles.comboVerticalItemActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setComboMultiplier(val);
                          setComboPopoverVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.comboVerticalText,
                            isSelected && styles.comboVerticalTextActive,
                          ]}
                        >
                          {val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Combo Multiplier Numbers (1, 9, 49, 99, 499, 999) */}
            <View style={styles.comboScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.comboScrollContent}
              >
                {COMBO_OPTIONS.map((val) => {
                  const isSelected = comboMultiplier === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.comboPill, isSelected && styles.comboPillActive]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setComboMultiplier(val);
                        // Toggle vertical popover if tapped on already selected combo
                        if (isSelected) {
                          setComboPopoverVisible((prev) => !prev);
                        } else {
                          setComboPopoverVisible(false);
                        }
                      }}
                      onLongPress={() => setComboPopoverVisible(true)}
                    >
                      <Text
                        style={[
                          styles.comboText,
                          isSelected && styles.comboTextActive,
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Teal/Cyan Send Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sendButtonWrap}
              onPress={handleSend}
            >
              <LinearGradient
                colors={['#00E5FF', '#00E676']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendGradient}
              >
                <Text style={styles.sendButtonText}>{t('Send')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F101A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    borderTopWidth: 1.2,
    borderColor: '#26283D',
    minHeight: 460,
  },

  /* ══ 1. TOP CURRENCY & PROFILE BAR ══ */
  topCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  currencyPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  singleCurrencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  goldCoinIcon: {
    width: 17,
    height: 17,
    marginRight: 4,
  },
  diamondIcon: {
    width: 17,
    height: 17,
    marginRight: 4,
  },
  greenCoinCircle: {
    marginRight: 3,
  },
  greenCoinText: {
    fontSize: 13,
  },
  currencyValText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  greenValText: {
    color: '#00E676',
    fontWeight: '700',
    fontSize: 12.5,
  },
  chevronRight: {
    color: '#94A3B8',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '800',
  },
  profileBtnWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  profileBtnIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  profileBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  profileBtnArrow: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 3,
    fontWeight: '900',
  },

  /* ══ 2. CATEGORY TABS ══ */
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    marginRight: 22,
    alignItems: 'center',
    position: 'relative',
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 14.5,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: -1,
    width: '100%',
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  /* ══ 3. GIFTS GRID (8 per page) ══ */
  giftsLoadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftGridContainer: {
    minHeight: 235,
  },
  giftPageWrap: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 8,
  },
  giftGrid8: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftBox: {
    width: (SCREEN_WIDTH - 36) / 4,
    height: 105,
    backgroundColor: '#191A2A',
    borderRadius: 12,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  giftBoxSelected: {
    borderColor: '#00E5FF',
    backgroundColor: '#202238',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  giftBadgeTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 5,
  },
  giftBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  giftGraphic: {
    width: 52,
    height: 52,
    marginVertical: 2,
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  coinTinyIcon: {
    fontSize: 10.5,
    marginRight: 3,
  },
  giftPriceText: {
    color: '#FACC15',
    fontWeight: '800',
    fontSize: 11,
  },
  pageDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  pageDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 3,
  },
  pageDotActive: {
    width: 14,
    backgroundColor: '#00E676',
  },

  /* ══ 4. RECIPIENT POPOVER MENU ══ */
  recipientPopover: {
    position: 'absolute',
    bottom: 72,
    left: 12,
    width: 160,
    maxHeight: 210,
    backgroundColor: '#1E2032',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 50,
  },
  popoverScroll: {
    maxHeight: 194,
  },
  popoverUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  popoverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  popoverUserName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  /* ══ 5. BOTTOM ACTION BAR ══ */
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  recipientBtn: {
    marginRight: 6,
  },
  singleRecipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2032',
    padding: 3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#374151',
  },
  recipientAvatarDp: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  upCaretIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 3,
    marginRight: 2,
  },
  allRecipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2032',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  allText: {
    color: '#00E676',
    fontWeight: '900',
    fontSize: 12.5,
  },
  checkboxWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxWrapActive: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  uncheckedBox: {
    width: 14,
    height: 14,
  },
  eyeVipBtn: {
    position: 'relative',
    marginRight: 6,
    padding: 4,
  },
  vipTinyTag: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  vipTinyText: {
    color: '#000000',
    fontSize: 7.5,
    fontWeight: '900',
  },
  eyeIcon: {
    fontSize: 18,
  },
  comboScrollContainer: {
    flex: 1,
    marginRight: 8,
  },
  comboScrollContent: {
    alignItems: 'center',
  },
  comboPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  comboPillActive: {
    backgroundColor: '#FFFFFF',
  },
  comboText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 12.5,
  },
  comboTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  sendButtonWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendGradient: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  comboVerticalPopover: {
    position: 'absolute',
    bottom: 58,
    right: 86,
    width: 68,
    maxHeight: 180,
    backgroundColor: '#1E1E2D',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 999,
  },
  comboVerticalScroll: {
    maxHeight: 168,
  },
  comboVerticalItem: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboVerticalItemActive: {
    backgroundColor: '#6366F1',
  },
  comboVerticalText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  comboVerticalTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});

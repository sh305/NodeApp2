import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from './TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './Toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

export const REGULAR_LAYOUTS = [
  {
    id: 'regular_10',
    name: '10 Seats',
    sub: '(1+8+1)',
    seatCount: 9,
    columns: 4,
    rows: 2,
    reqLevel: 1,
    reqType: 'room',
  },
  {
    id: 'regular_12',
    name: '12 Seats',
    sub: '(Room Level ≥ 20)',
    seatCount: 11,
    columns: 5,
    rows: 2,
    reqLevel: 20,
    reqType: 'room',
  },
  {
    id: 'regular_14',
    name: '14 Seats',
    sub: '(Room Level ≥ 20)',
    seatCount: 13,
    columns: 4,
    rows: 3,
    reqLevel: 20,
    reqType: 'room',
  },
  {
    id: 'regular_17',
    name: '17 Seats',
    sub: '(Room Level ≥ 25)',
    seatCount: 16,
    columns: 5,
    rows: 3,
    reqLevel: 25,
    reqType: 'room',
  },
  {
    id: 'regular_22',
    name: '22 Seats',
    sub: '(Room Level ≥ 30)',
    seatCount: 21,
    columns: 5,
    rows: 4,
    reqLevel: 30,
    reqType: 'room',
  },
  {
    id: 'regular_27',
    name: '27 Seats',
    sub: '(VIP Level ≥ 6)',
    seatCount: 26,
    columns: 5,
    rows: 5,
    reqLevel: 6,
    reqType: 'vip',
  },
];

export const SPECIAL_LAYOUTS = [
  {
    id: 'special_music',
    name: 'Music',
    theme: 'music',
    image: require('../../assets/seats/special_music.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_birthday',
    name: 'Birthday',
    theme: 'birthday',
    image: require('../../assets/seats/special_birthday.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_royal',
    name: 'Royal',
    theme: 'royal',
    image: require('../../assets/seats/special_royal.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_magic',
    name: 'Magic',
    theme: 'magic',
    image: require('../../assets/seats/special_magic.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_dating',
    name: 'Dating',
    theme: 'dating',
    image: require('../../assets/seats/special_dating.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_relationship',
    name: 'Relationship',
    theme: 'relationship',
    image: require('../../assets/seats/special_relationship.jpg'),
    seatCount: 8,
    columns: 4,
  },
  {
    id: 'special_wedding',
    name: 'Wedding',
    theme: 'wedding',
    image: require('../../assets/seats/special_wedding.jpg'),
    seatCount: 8,
    columns: 4,
  },
];

export default function SeatSettingsModal({
  visible,
  onClose,
  currentLayout = null,
  room = null,
  currentUser = null,
  onApplyLayout,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('regular'); // 'regular' | 'special'
  const [selectedLayoutId, setSelectedLayoutId] = useState(
    currentLayout?.isActivated ? currentLayout?.layoutId || null : null
  );

  useEffect(() => {
    if (visible) {
      if (currentLayout?.isActivated && currentLayout?.layoutId) {
        setSelectedLayoutId(currentLayout.layoutId);
        setActiveTab(currentLayout.type || 'regular');
      } else {
        setSelectedLayoutId(null);
        setActiveTab('regular');
      }
    }
  }, [visible, currentLayout]);

  const currentRoomLevel = room?.roomLevel || 1;
  const currentVipLevel = currentUser?.vipLevel || room?.owner?.vipLevel || 0;

  const isLayoutUnlocked = (item) => {
    if (activeTab === 'special') return true;
    if (item.reqType === 'vip') {
      return currentVipLevel >= item.reqLevel || currentRoomLevel >= 35;
    }
    return currentRoomLevel >= item.reqLevel;
  };

  const handleSelectLayout = (item) => {
    if (selectedLayoutId === item.id) {
      // Toggle off / deselect if clicked again
      setSelectedLayoutId(null);
      return;
    }

    if (activeTab === 'regular' && !isLayoutUnlocked(item)) {
      if (item.reqType === 'vip') {
        showToast(
          `${t('Requires VIP Level')} ${item.reqLevel} ${t('or Room Level 35')}`,
          'info'
        );
      } else {
        showToast(
          `${t('Requires Room Level')} ${item.reqLevel} ${t('to unlock')}`,
          'info'
        );
      }
      return;
    }
    setSelectedLayoutId(item.id);
  };

  const isBossActiveInRoom = Boolean(
    room?.bossSeat?.isActive &&
      room?.bossSeat?.expiresAt &&
      new Date(room.bossSeat.expiresAt) > new Date()
  );

  const handleResetToDefault = () => {
    setSelectedLayoutId(null);
    if (onApplyLayout) {
      onApplyLayout({
        type: 'default',
        layoutId: null,
        isActivated: false,
        seatCount: 8,
        columns: 4,
        specialTheme: null,
      });
    }
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedLayoutId) {
      if (currentLayout?.isActivated) {
        handleResetToDefault();
        return;
      }
      showToast(t('Please select a seat layout first'), 'info');
      return;
    }

    let chosenItem = null;
    if (activeTab === 'regular') {
      chosenItem = REGULAR_LAYOUTS.find((l) => l.id === selectedLayoutId);
    } else {
      chosenItem = SPECIAL_LAYOUTS.find((l) => l.id === selectedLayoutId);
    }

    if (!chosenItem) return;

    if (onApplyLayout) {
      onApplyLayout({
        id: chosenItem.id,
        layoutId: chosenItem.id,
        type: activeTab,
        seatCount: chosenItem.seatCount,
        columns: chosenItem.columns,
        rows: chosenItem.rows,
        theme: chosenItem.theme,
        specialTheme: activeTab === 'special' ? chosenItem.theme : null,
      });
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop touchable */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header Title */}
          <Text style={styles.headerTitle}>
            <T>Seat Settings</T>
          </Text>

          {/* 2 Tabs: Regular Seat vs Special Seat */}
          <View style={styles.tabsRow}>
            {/* Tab 1: Regular Seat */}
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('regular')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'regular' && styles.tabTextActive,
                ]}
              >
                <T>Regular Seat</T>
              </Text>
              {activeTab === 'regular' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            {/* Tab 2: Special Seat */}
            <TouchableOpacity
              style={styles.tabBtn}
              activeOpacity={0.8}
              onPress={() => setActiveTab('special')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'special' && styles.tabTextActive,
                ]}
              >
                <T>Special Seat</T>
              </Text>
              {activeTab === 'special' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {/* Grid Content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'regular' ? (
              /* ══ REGULAR SEAT TAB (Matching Screenshot 1, 2, 3) ══ */
              <View style={styles.cardsGrid}>
                {REGULAR_LAYOUTS.map((item) => {
                  const isSelected = selectedLayoutId === item.id;
                  const unlocked = isLayoutUnlocked(item);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cardItem}
                      activeOpacity={0.85}
                      onPress={() => handleSelectLayout(item)}
                    >
                      {/* Miniature Cosmic Preview Card */}
                      <LinearGradient
                        colors={['#160833', '#2D1063', '#160833']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.previewCard,
                          isSelected && styles.previewCardSelected,
                        ]}
                      >
                        {/* Upper Row: Host Circle (mic) + Normal or Boss Sofa */}
                        <View style={styles.previewTopRow}>
                          <View style={styles.previewHostIconBox}>
                            <Image
                              source={require('../../assets/icons/SofaSeat.png')}
                              style={styles.previewTopSofaImg}
                              resizeMode="contain"
                            />
                          </View>
                          <View
                            style={
                              isBossActiveInRoom
                                ? styles.previewBossIconBox
                                : styles.previewNormalUpperIconBox
                            }
                          >
                            <Image
                              source={
                                isBossActiveInRoom
                                  ? require('../../assets/icons/Boss Seat.png')
                                  : require('../../assets/icons/SofaSeat.png')
                              }
                              style={
                                isBossActiveInRoom
                                  ? styles.previewTopBossImg
                                  : styles.previewTopSofaImg
                              }
                              resizeMode="contain"
                            />
                          </View>
                        </View>

                        {/* Rows of Miniature Mic Seats */}
                        <View
                          style={[
                            styles.previewSeatsContainer,
                            { gap: item.rows >= 4 ? 6 : 9 },
                          ]}
                        >
                          {Array.from({ length: item.rows }).map((_, rIdx) => (
                            <View
                              key={`p_row_${rIdx}`}
                              style={[
                                styles.previewSeatsRow,
                                { gap: item.columns === 5 ? 6 : 10 },
                              ]}
                            >
                              {Array.from({ length: item.columns }).map(
                                (_, cIdx) => {
                                  const seatNum = rIdx * item.columns + cIdx + 1;
                                  if (seatNum > item.seatCount) return null;
                                  const isCol5 = item.columns === 5;
                                  return (
                                    <View
                                      key={`p_seat_${seatNum}`}
                                      style={[
                                        styles.previewSeatCol,
                                        { width: isCol5 ? 24 : 28 },
                                      ]}
                                    >
                                      <View
                                        style={[
                                          styles.previewSeatCircle,
                                          isCol5 && styles.previewSeatCircleSmall,
                                        ]}
                                      >
                                        <Image
                                          source={require('../../assets/icons/SofaSeat.png')}
                                          style={
                                            isCol5
                                              ? styles.previewMiniSofaSmall
                                              : styles.previewMiniSofa
                                          }
                                          resizeMode="contain"
                                        />
                                      </View>
                                      <Text
                                        style={[
                                          styles.previewSeatNum,
                                          isCol5 && { fontSize: 6.5 },
                                        ]}
                                        numberOfLines={1}
                                      >
                                        No.{seatNum}
                                      </Text>
                                    </View>
                                  );
                                }
                              )}
                            </View>
                          ))}
                        </View>

                        {/* Lock Overlay if room level not met */}
                        {!unlocked && (
                          <View style={styles.lockedCardOverlay}>
                            <View style={styles.lockedBadgeBox}>
                              <Text style={styles.lockedBadgeIcon}>🔒</Text>
                            </View>
                          </View>
                        )}
                      </LinearGradient>

                      {/* Card Labels */}
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        <T>{item.name}</T>
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        <T>{item.sub}</T>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* ══ SPECIAL SEAT TAB (Matching Screenshot 4 & 5) ══ */
              <View style={styles.cardsGrid}>
                {SPECIAL_LAYOUTS.map((item) => {
                  const isSelected = selectedLayoutId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cardItem}
                      activeOpacity={0.85}
                      onPress={() => handleSelectLayout(item)}
                    >
                      {/* High-res Special Theme Image Thumbnail */}
                      <View
                        style={[
                          styles.specialImageWrap,
                          isSelected && styles.specialImageWrapSelected,
                        ]}
                      >
                        <Image
                          source={item.image}
                          style={styles.specialImage}
                          resizeMode="cover"
                        />
                      </View>

                      {/* Special Theme Title */}
                      <Text style={styles.specialTitle} numberOfLines={1}>
                        <T>{item.name}</T>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* ══ BOTTOM CONFIRM BUTTON (Matching Screenshot) ══ */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.okayBtn}
              activeOpacity={0.8}
              onPress={handleConfirm}
            >
              <Text style={styles.okayBtnText}>
                <T>Okay</T>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 38,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#00D293', // Mint green matching screenshot
  },
  scrollContent: {
    maxHeight: 460,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardItem: {
    width: CARD_WIDTH,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewCard: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  previewCardSelected: {
    borderColor: '#00D293',
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 12,
    paddingRight: 10,
  },
  previewHostIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBossIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNormalUpperIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTopSofaImg: {
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
  },
  previewTopBossImg: {
    width: 15,
    height: 15,
  },
  previewSeatsContainer: {
    width: '100%',
    justifyContent: 'center',
  },
  previewSeatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  previewSeatCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSeatCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2.5,
  },
  previewSeatCircleSmall: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
  },
  previewMiniSofa: {
    width: 11,
    height: 11,
    tintColor: '#FFFFFF',
  },
  previewMiniSofaSmall: {
    width: 9,
    height: 9,
    tintColor: '#FFFFFF',
  },
  previewSeatNum: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#E0E7FF',
    textAlign: 'center',
  },
  lockedCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  lockedBadgeBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  lockedBadgeIcon: {
    fontSize: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Special Seat Styles */
  specialImageWrap: {
    width: '100%',
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E1E2E',
    borderWidth: 2.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  specialImageWrapSelected: {
    borderColor: '#00D293', // Green selected border matching Screenshot 5
  },
  specialImage: {
    width: '100%',
    height: '100%',
  },
  specialTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },

  /* Bottom Actions */
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: 'center',
  },
  okayBtn: {
    width: '60%',
    backgroundColor: '#00D293', // Mint green button
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D293',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  okayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

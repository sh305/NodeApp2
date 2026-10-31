import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { GreedyBabyCharacter, ShinyCoinIcon } from './FoodIcons';
import { SlotMachineIcon, SevenIcon } from './SlotIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GamesListModal({
  visible,
  onClose,
  onSelectGame,
}) {
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Top Handle */}
              <View style={styles.handleBar} />

              {/* Header Row */}
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>
                  <T>Games</T>
                </Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  activeOpacity={0.75}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Games Scrollable Grid */}
              <ScrollView
                style={styles.gamesScroll}
                contentContainerStyle={styles.gamesContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Flagship Game: GREEDY BABY */}
                <TouchableOpacity
                  style={styles.gameCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onSelectGame('greedy_baby');
                  }}
                >
                  <LinearGradient
                    colors={['#4C1D95', '#2E1065', '#1E1B4B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gameCardGradient}
                  >
                    {/* Badge */}
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>🔥 <T>HOT GAME</T></Text>
                    </View>

                    {/* Game Visual / Character */}
                    <View style={styles.gameVisualWrap}>
                      <View style={styles.characterGlow}>
                        <GreedyBabyCharacter size={72} />
                      </View>
                    </View>

                    {/* Game Details */}
                    <View style={styles.gameInfoWrap}>
                      <Text style={styles.gameTitle}>
                        <T>Greedy Baby</T>
                      </Text>
                      <Text style={styles.gameSub}>
                        <T>Spin & win up to 45x gold coins!</T>
                      </Text>
                      <View style={styles.multiplierRow}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>5x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>10x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>15x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>25x</Text>
                        </View>
                        <View style={[styles.tagPill, styles.tagPillJackpot]}>
                          <Text style={styles.tagPillJackpotText}>45x 🌟</Text>
                        </View>
                      </View>
                    </View>

                    {/* Play Button */}
                    <View style={styles.playBtnWrap}>
                      <LinearGradient
                        colors={['#EC4899', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.playBtn}
                      >
                        <Text style={styles.playBtnText}>
                          <T>PLAY</T>
                        </Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. Flagship Game: SUPER SLOTS (500x Jackpot) */}
                <TouchableOpacity
                  style={[styles.gameCard, styles.slotsCardSpacing]}
                  activeOpacity={0.85}
                  onPress={() => {
                    onClose();
                    onSelectGame('super_slots');
                  }}
                >
                  <LinearGradient
                    colors={['#78350F', '#451A03', '#1C0A00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gameCardGradient}
                  >
                    {/* 500x Jackpot Badge */}
                    <View style={styles.jackpotBadge}>
                      <Text style={styles.jackpotBadgeText}>👑 <T>500X JACKPOT</T></Text>
                    </View>

                    {/* Game Visual / Slot Machine Icon */}
                    <View style={styles.gameVisualWrap}>
                      <View style={styles.slotIconGlow}>
                        <SlotMachineIcon size={68} />
                      </View>
                    </View>

                    {/* Game Details */}
                    <View style={styles.gameInfoWrap}>
                      <Text style={styles.gameTitle}>
                        <T>Super Slots</T>
                      </Text>
                      <Text style={styles.gameSub}>
                        <T>3-Reel Slots - Match 777 for 500x!</T>
                      </Text>
                      <View style={styles.multiplierRow}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>10x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>20x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>50x</Text>
                        </View>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>100x</Text>
                        </View>
                        <View style={[styles.tagPill, styles.tagPillSlotsJackpot]}>
                          <Text style={styles.tagPillSlotsJackpotText}>500x 👑</Text>
                        </View>
                      </View>
                    </View>

                    {/* Play Button */}
                    <View style={styles.playBtnWrap}>
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.playBtn}
                      >
                        <Text style={styles.playBtnText}>
                          <T>PLAY</T>
                        </Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>

              {/* Bottom Footer Note */}
              <View style={styles.footerNoteRow}>
                <ShinyCoinIcon size={16} />
                <Text style={styles.footerNoteText}>
                  <T>Play with your FunMaza gold coins & win big!</T>
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#131127',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 18,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  gamesScroll: {
    maxHeight: 380,
  },
  gamesContent: {
    paddingBottom: 10,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  slotsCardSpacing: {
    marginTop: 14,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#F59E0B',
  },
  gameCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  jackpotBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  jackpotBadgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
  },
  gameVisualWrap: {
    marginRight: 12,
  },
  characterGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(250, 204, 21, 0.5)',
  },
  slotIconGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253, 230, 138, 0.6)',
  },
  gameInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  gameSub: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
    marginBottom: 6,
  },
  multiplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  tagPillJackpot: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  tagPillJackpotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE047',
  },
  tagPillSlotsJackpot: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  tagPillSlotsJackpotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF08A',
  },
  playBtnWrap: {
    marginLeft: 8,
  },
  playBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#EC4899',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 6,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

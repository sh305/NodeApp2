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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { T } from './TranslatedText';
import { GreedyBabyCharacter, ShinyCoinIcon } from './FoodIcons';
import { SevenIcon } from './SlotIcons';
import { LionIcon } from './AnimalIcons';
import { SteeringWheelIcon } from './CarIcons';
import { GoldenPawIcon } from './ZooSlotIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Modern Square Game Tile for Greedy Baby
 */
function GreedyBabyTile() {
  return (
    <View style={styles.tileBox}>
      <LinearGradient
        colors={['#4C1D95', '#831843', '#BE185D', '#3B0764']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Star Sparkles */}
        <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.5" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FDE047" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#FDE047" opacity={0.7} />
          <Circle cx="82" cy="72" r="1.5" fill="#FDE047" opacity={0.8} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.9} />
        </Svg>

        {/* Top-Right Coin Badge */}
        <View style={styles.topRightCoin}>
          <ShinyCoinIcon size={18} />
        </View>

        {/* Cute Greedy Baby Character */}
        <View style={styles.characterContainer}>
          <GreedyBabyCharacter size={58} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonPink}>
          <Text style={styles.bottomRibbonText}>45X 🌟</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}

/**
 * Modern Square Game Tile for Super Slots (Crazy 777 Casino Style)
 */
function SuperSlotsTile() {
  return (
    <View style={[styles.tileBox, styles.slotsTileBorder]}>
      <LinearGradient
        colors={['#7F1D1D', '#B91C1C', '#EA580C', '#450A0A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Fiery Star Sparkles */}
        <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="82" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="20" cy="74" r="1.5" fill="#FDE047" opacity={0.7} />
          <Path d="M18 14 L19 17 L22 18 L19 19 L18 22 L17 19 L14 18 L17 17 Z" fill="#FEF08A" opacity={0.95} />
          <Path d="M78 22 L79 25 L82 26 L79 27 L78 30 L77 27 L74 26 L77 25 Z" fill="#FDE047" opacity={0.8} />
        </Svg>

        {/* Lucky 7 Symbol */}
        <View style={styles.slotCenterSymbol}>
          <SevenIcon size={52} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonGold}>
          <Text style={styles.bottomRibbonGoldText}>500X 👑</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}

/**
 * Modern Square Game Tile for Animal Race (Jungle Safari Style)
 */
function AnimalRaceTile() {
  return (
    <View style={[styles.tileBox, styles.animalTileBorder]}>
      <LinearGradient
        colors={['#064E3B', '#047857', '#B45309', '#78350F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Jungle Sparkles */}
        <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#4ADE80" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Lion King of Jungle */}
        <View style={styles.slotCenterSymbol}>
          <LionIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonGreen}>
          <Text style={styles.bottomRibbonGreenText}>25X 🌴</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}


/**
 * Modern Square Game Tile for Car Roulette (Speed Club Style)
 */
function CarRouletteTile() {
  return (
    <View style={[styles.tileBox, styles.carRouletteTileBorder]}>
      <LinearGradient
        colors={['#7F1D1D', '#991B1B', '#F59E0B', '#1E1B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Speed Sparkles */}
        <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#EF4444" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Steering Wheel Icon */}
        <View style={styles.slotCenterSymbol}>
          <SteeringWheelIcon size={52} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonRed}>
          <Text style={styles.bottomRibbonRedText}>40X 🏎️</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}


/**
 * Modern Square Game Tile for Zoo Slots (Wild Animal Jungle Style)
 */
function ZooSlotsTile() {
  return (
    <View style={[styles.tileBox, styles.zooSlotsTileBorder]}>
      <LinearGradient
        colors={['#064E3B', '#15803D', '#B45309', '#022C22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Jungle Sparkles */}
        <Svg width={96} height={96} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#4ADE80" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Golden Paw Wild Symbol */}
        <View style={styles.slotCenterSymbol}>
          <GoldenPawIcon size={52} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonAmber}>
          <Text style={styles.bottomRibbonAmberText}>500X 🐾</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}

export default function GamesListModal({
  visible,
  onClose,
  onSelectGame,
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

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
            <View style={[styles.sheetContainer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
              {/* Header: Title "Games" & Close "✕" */}
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

              {/* Games Grid Row (Screenshot matching) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gamesRow}
              >
                {/* 1. Greedy Baby */}
                <TouchableOpacity
                  style={styles.gameItem}
                  activeOpacity={0.82}
                  onPress={() => {
                    onClose();
                    onSelectGame('greedy_baby');
                  }}
                >
                  <GreedyBabyTile />
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    <T>Greedy Baby</T>
                  </Text>
                </TouchableOpacity>

                {/* 2. Super Slots */}
                <TouchableOpacity
                  style={styles.gameItem}
                  activeOpacity={0.82}
                  onPress={() => {
                    onClose();
                    onSelectGame('super_slots');
                  }}
                >
                  <SuperSlotsTile />
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    <T>Super Slots</T>
                  </Text>
                </TouchableOpacity>

                {/* 3. Animal Race */}
                <TouchableOpacity
                  style={styles.gameItem}
                  activeOpacity={0.82}
                  onPress={() => {
                    onClose();
                    onSelectGame('animal_race');
                  }}
                >
                  <AnimalRaceTile />
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    <T>Animal Race</T>
                  </Text>
                </TouchableOpacity>

                {/* 4. Car Roulette */}
                <TouchableOpacity
                  style={styles.gameItem}
                  activeOpacity={0.82}
                  onPress={() => {
                    onClose();
                    onSelectGame('car_roulette');
                  }}
                >
                  <CarRouletteTile />
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    <T>Car Roulette</T>
                  </Text>
                </TouchableOpacity>

                {/* 5. Zoo Slots */}
                <TouchableOpacity
                  style={styles.gameItem}
                  activeOpacity={0.82}
                  onPress={() => {
                    onClose();
                    onSelectGame('zoo_slots');
                  }}
                >
                  <ZooSlotsTile />
                  <Text style={styles.gameTitle} numberOfLines={1}>
                    <T>Zoo Slots</T>
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Page Indicator Dots (Matching screenshot) */}
              <View style={styles.dotsRow}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#110F20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  gamesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  gameItem: {
    alignItems: 'center',
    width: 96,
  },
  tileBox: {
    width: 96,
    height: 96,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.55)',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },
  slotsTileBorder: {
    borderColor: 'rgba(245, 158, 11, 0.65)',
    shadowColor: '#F59E0B',
  },
  animalTileBorder: {
    borderColor: 'rgba(34, 197, 94, 0.65)',
    shadowColor: '#10B981',
  },
  tileGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  topRightCoin: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 3,
  },
  slotCenterSymbol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  bottomRibbonPink: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(190, 24, 93, 0.88)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 224, 71, 0.4)',
    zIndex: 3,
  },
  bottomRibbonText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomRibbonGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(180, 83, 9, 0.92)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(254, 240, 138, 0.5)',
    zIndex: 3,
  },
  bottomRibbonGoldText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomRibbonGreen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 222, 128, 0.5)',
    zIndex: 3,
  },
  bottomRibbonGreenText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  gameTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 4,
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});

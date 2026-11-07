import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions,
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
import { GoldenDragonIcon } from './OceanKingIcons';
import { FruitCocktailIcon } from './FruitPartyIcons';
import { DragonTigerTileIcon } from './DragonTigerIcons';
import { ColorPredictionTileIcon } from './ColorPredictionIcons';
import { BullseyeDartsTileIcon } from './BullseyeDartsIcons';
import { MatkaCrackTileIcon } from './MatkaCrackIcons';
import { GoliSodaTileIcon } from './GoliSodaIcons';
import { CandyBonanzaTileIcon } from './CandyBonanzaIcons';
import { PlinkoTileIcon } from './PlinkoIcons';
import { NariyalTileIcon } from './NariyalIcons';

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
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.5" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FDE047" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#FDE047" opacity={0.7} />
          <Circle cx="82" cy="72" r="1.5" fill="#FDE047" opacity={0.8} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.9} />
        </Svg>

        {/* Top-Right Coin Badge */}
        <View style={styles.topRightCoin}>
          <ShinyCoinIcon size={16} />
        </View>

        {/* Cute Greedy Baby Character */}
        <View style={styles.characterContainer}>
          <GreedyBabyCharacter size={52} />
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
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="82" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="20" cy="74" r="1.5" fill="#FDE047" opacity={0.7} />
          <Path d="M18 14 L19 17 L22 18 L19 19 L18 22 L17 19 L14 18 L17 17 Z" fill="#FEF08A" opacity={0.95} />
          <Path d="M78 22 L79 25 L82 26 L79 27 L78 30 L77 27 L74 26 L77 25 Z" fill="#FDE047" opacity={0.8} />
        </Svg>

        {/* Lucky 7 Symbol */}
        <View style={styles.slotCenterSymbol}>
          <SevenIcon size={46} />
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
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#4ADE80" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Lion King of Jungle */}
        <View style={styles.slotCenterSymbol}>
          <LionIcon size={46} />
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
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#EF4444" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Steering Wheel Icon */}
        <View style={styles.slotCenterSymbol}>
          <SteeringWheelIcon size={46} />
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
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#4ADE80" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Golden Paw Wild Symbol */}
        <View style={styles.slotCenterSymbol}>
          <GoldenPawIcon size={46} />
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

/**
 * Modern Square Game Tile for Ocean King (Deep Sea Fishing Frenzy)
 */
function OceanKingTile() {
  return (
    <View style={[styles.tileBox, styles.oceanKingTileBorder]}>
      <LinearGradient
        colors={['#04101E', '#06283D', '#0077B6', '#00F5D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Ocean Sparkles & Bubbles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#00F5D4" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#38BDF8" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#00F5D4" opacity={0.9} />
        </Svg>

        {/* Golden Dragon King Symbol */}
        <View style={styles.slotCenterSymbol}>
          <GoldenDragonIcon size={46} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonCyan}>
          <Text style={styles.bottomRibbonCyanText}>300X 🐉</Text>
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
 * Modern Square Game Tile for Fruit Party (Lucky Fruit Wheel)
 */
function FruitPartyTile() {
  return (
    <View style={[styles.tileBox, styles.fruitPartyTileBorder]}>
      <LinearGradient
        colors={['#4C0519', '#831843', '#BE185D', '#3B0764']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Party Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FFE4E6" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#F43F5E" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FFE600" opacity={0.9} />
        </Svg>

        {/* Tropical Fruit Cocktail Symbol */}
        <View style={styles.slotCenterSymbol}>
          <FruitCocktailIcon size={46} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonMagenta}>
          <Text style={styles.bottomRibbonMagentaText}>100X 🍉</Text>
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
 * Modern Square Game Tile for Dragon vs Tiger (2-Card High-Stakes Showdown)
 */
function DragonTigerTile() {
  return (
    <View style={[styles.tileBox, styles.dragonTigerTileBorder]}>
      <LinearGradient
        colors={['#7F1D1D', '#991B1B', '#B45309', '#1E1B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Duel Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#F87171" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FDE047" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#F59E0B" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Dragon vs Tiger Clash Symbol */}
        <View style={styles.slotCenterSymbol}>
          <DragonTigerTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonCrimson}>
          <Text style={styles.bottomRibbonCrimsonText}>9X TIE ⚔️</Text>
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
 * Modern Square Game Tile for Color Prediction (Color Clash / Fast Parity)
 */
function ColorPredictionTile() {
  return (
    <View style={[styles.tileBox, styles.colorPredictionTileBorder]}>
      <LinearGradient
        colors={['#1E1138', '#3B0764', '#7E22CE', '#100520']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Mystic Aura Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#A855F7" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#34D399" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Color Prediction Triple-Sphere Symbol */}
        <View style={styles.slotCenterSymbol}>
          <ColorPredictionTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonPurple}>
          <Text style={styles.bottomRibbonPurpleText}>4.5X VIOLET 🔮</Text>
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
 * Modern Square Game Tile for Bullseye Darts (1-Shot Target Precision)
 */
function BullseyeDartsTile() {
  return (
    <View style={[styles.tileBox, styles.bullseyeDartsTileBorder]}>
      <LinearGradient
        colors={['#78350F', '#B45309', '#BE123C', '#1E1B4B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Darts Target Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FDE047" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#EF4444" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FDE047" opacity={0.9} />
        </Svg>

        {/* Bullseye Darts Clash Symbol */}
        <View style={styles.slotCenterSymbol}>
          <BullseyeDartsTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonGoldDark}>
          <Text style={styles.bottomRibbonGoldDarkText}>25X BULLSEYE 🎯</Text>
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
 * Modern Square Game Tile for Matka Crack (Treasure Pot Smash)
 */
function MatkaCrackTile() {
  return (
    <View style={[styles.tileBox, styles.matkaCrackTileBorder]}>
      <LinearGradient
        colors={['#78350F', '#B45309', '#D97706', '#2A1308']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Pot Treasure Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="1.8" fill="#FEF08A" opacity={0.85} />
          <Circle cx="80" cy="20" r="2" fill="#38BDF8" opacity={0.9} />
          <Circle cx="20" cy="74" r="1.5" fill="#F59E0B" opacity={0.7} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.9} />
        </Svg>

        {/* Matka Crack Emblem Symbol */}
        <View style={styles.slotCenterSymbol}>
          <MatkaCrackTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonAmberDark}>
          <Text style={styles.bottomRibbonAmberDarkText}>5X POT 🏺</Text>
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
 * Modern Square Game Tile for Goli Soda Pop (Marble Fizz 1-Shot)
 */
function GoliSodaTile() {
  return (
    <View style={[styles.tileBox, styles.goliSodaTileBorder]}>
      <LinearGradient
        colors={['#064E3B', '#047857', '#059669', '#022C22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Soda Fizz Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="18" cy="20" r="2" fill="#FEF08A" opacity={0.85} />
          <Circle cx="78" cy="22" r="1.8" fill="#38BDF8" opacity={0.9} />
          <Circle cx="22" cy="72" r="1.5" fill="#34D399" opacity={0.8} />
          <Path d="M76 14 L77 17 L80 18 L77 19 L76 22 L75 19 L72 18 L75 17 Z" fill="#FEF08A" opacity={0.9} />
        </Svg>

        {/* Goli Soda Emblem Symbol */}
        <View style={styles.slotCenterSymbol}>
          <GoliSodaTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonEmeraldDark}>
          <Text style={styles.bottomRibbonEmeraldDarkText}>5X FIZZ 🍾</Text>
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
 * Modern Square Game Tile for Candy Bonanza (Sweet Gems & 30X Sugar Bomb Slot)
 */
function CandyBonanzaTile() {
  return (
    <View style={[styles.tileBox, styles.candyBonanzaTileBorder]}>
      <LinearGradient
        colors={['#831843', '#BE185D', '#9333EA', '#180620']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Sweet Sugar Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="80" cy="20" r="2" fill="#F472B6" opacity={0.85} />
          <Circle cx="20" cy="74" r="1.6" fill="#38BDF8" opacity={0.8} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.95} />
        </Svg>

        {/* Candy Bonanza Emblem Symbol */}
        <View style={styles.slotCenterSymbol}>
          <CandyBonanzaTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonPinkDark}>
          <Text style={styles.bottomRibbonPinkDarkText}>30X BOMB 🍭</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}


/**
 * Modern Square Game Tile for Plinko Drop (Golden Ball Pegboard)
 */
function PlinkoTile() {
  return (
    <View style={[styles.tileBox, styles.plinkoTileBorder]}>
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#B45309', '#78350F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Golden Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="80" cy="20" r="2" fill="#FDE047" opacity={0.85} />
          <Circle cx="20" cy="74" r="1.6" fill="#F59E0B" opacity={0.8} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.95} />
        </Svg>

        {/* Plinko Emblem Symbol */}
        <View style={styles.slotCenterSymbol}>
          <PlinkoTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonAmberGold}>
          <Text style={styles.bottomRibbonAmberGoldText}>25X DROP 🟡</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}


/**
 * Modern Square Game Tile for Nariyal Phodo (Coconut Smash)
 */
function NariyalTile() {
  return (
    <View style={[styles.tileBox, styles.nariyalTileBorder]}>
      <LinearGradient
        colors={['#064E3B', '#047857', '#065F46', '#022C22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tileGradient}
      >
        {/* Tropical Sparkles */}
        <Svg width="100%" height="100%" viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx="16" cy="18" r="2" fill="#FEF08A" opacity={0.9} />
          <Circle cx="80" cy="20" r="2" fill="#34D399" opacity={0.85} />
          <Circle cx="20" cy="74" r="1.6" fill="#38BDF8" opacity={0.8} />
          <Path d="M78 12 L79 15 L82 16 L79 17 L78 20 L77 17 L74 16 L77 15 Z" fill="#FEF08A" opacity={0.95} />
        </Svg>

        {/* Coconut Emblem Symbol */}
        <View style={styles.slotCenterSymbol}>
          <NariyalTileIcon size={50} />
        </View>

        {/* Bottom Multiplier Ribbon */}
        <View style={styles.bottomRibbonEmeraldPearl}>
          <Text style={styles.bottomRibbonEmeraldPearlText}>20X PEARL 🥥</Text>
        </View>

        {/* Glass shine reflection overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'transparent']}
          style={styles.glassShine}
        />
      </LinearGradient>
    </View>
  );
}

// 15 Flagship Games Configuration
const GAMES = [
  {
    id: 'greedy_baby',
    title: 'Greedy Baby',
    TileComponent: GreedyBabyTile,
  },
  {
    id: 'super_slots',
    title: 'Super Slots',
    TileComponent: SuperSlotsTile,
  },
  {
    id: 'animal_race',
    title: 'Animal Race',
    TileComponent: AnimalRaceTile,
  },
  {
    id: 'car_roulette',
    title: 'Car Roulette',
    TileComponent: CarRouletteTile,
  },
  {
    id: 'zoo_slots',
    title: 'Zoo Slots',
    TileComponent: ZooSlotsTile,
  },
  {
    id: 'ocean_king',
    title: 'Ocean King',
    TileComponent: OceanKingTile,
  },
  {
    id: 'fruit_party',
    title: 'Fruit Party',
    TileComponent: FruitPartyTile,
  },
  {
    id: 'dragon_tiger',
    title: 'Dragon vs Tiger',
    TileComponent: DragonTigerTile,
  },
  {
    id: 'color_prediction',
    title: 'Color Prediction',
    TileComponent: ColorPredictionTile,
  },
  {
    id: 'bullseye_darts',
    title: 'Bullseye Darts',
    TileComponent: BullseyeDartsTile,
  },
  {
    id: 'matka_crack',
    title: 'Matka Crack',
    TileComponent: MatkaCrackTile,
  },
  {
    id: 'goli_soda',
    title: 'Goli Soda Pop',
    TileComponent: GoliSodaTile,
  },
  {
    id: 'candy_bonanza',
    title: 'Candy Bonanza',
    TileComponent: CandyBonanzaTile,
  },
  {
    id: 'plinko',
    title: 'Plinko Drop',
    TileComponent: PlinkoTile,
  },
  {
    id: 'nariyal',
    title: 'Nariyal Phodo',
    TileComponent: NariyalTile,
  },
];

// Helper to chunk games into exact rows of 3
function chunkIntoRows(items, cols = 3) {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export default function GamesListModal({
  visible,
  onClose,
  onSelectGame,
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (!visible) return null;

  // Exact 3-column measurements guaranteed not to wrap
  const horizontalPadding = 14;
  const gridGap = 10;
  const numColumns = 3;
  const itemWidth = Math.floor(
    (windowWidth - horizontalPadding * 2 - gridGap * (numColumns - 1)) / numColumns
  );

  const gameRows = chunkIntoRows(GAMES, numColumns);

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
            <View
              style={[
                styles.sheetContainer,
                {
                  paddingHorizontal: horizontalPadding,
                  minHeight: Math.min(520, Math.round(windowHeight * 0.70)),
                  maxHeight: Math.min(680, Math.round(windowHeight * 0.88)),
                  paddingBottom: Math.max(20, insets.bottom + 12),
                },
              ]}
            >
              {/* Header: Title "Games", Count Badge & Close "✕" */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeftGroup}>
                  <Text style={styles.headerTitle}>
                    <T>Games</T>
                  </Text>
                  <View style={styles.gameCountBadge}>
                    <Text style={styles.gameCountText}>{GAMES.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  activeOpacity={0.75}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Exact 3-Games-per-Row Grid Container */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
              >
                {gameRows.map((row, rowIndex) => (
                  <View
                    key={`row-${rowIndex}`}
                    style={[
                      styles.gamesRow,
                      { gap: gridGap },
                    ]}
                  >
                    {row.map((game) => {
                      const Tile = game.TileComponent;
                      return (
                        <TouchableOpacity
                          key={game.id}
                          style={[styles.gameItem, { width: itemWidth }]}
                          activeOpacity={0.82}
                          onPress={() => {
                            onClose();
                            onSelectGame(game.id);
                          }}
                        >
                          <Tile />
                          <Text style={styles.gameTitle} numberOfLines={1}>
                            <T>{game.title}</T>
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Invisible Spacers for row 2 to preserve exact column alignment */}
                    {Array.from({ length: numColumns - row.length }).map((_, idx) => (
                      <View key={`spacer-${rowIndex}-${idx}`} style={{ width: itemWidth }} />
                    ))}
                  </View>
                ))}
              </ScrollView>
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  gameCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gameCountText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '800',
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
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  gamesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  gameItem: {
    alignItems: 'center',
  },
  tileBox: {
    width: '100%',
    aspectRatio: 1,
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
  carRouletteTileBorder: {
    borderColor: 'rgba(239, 68, 68, 0.65)',
    shadowColor: '#EF4444',
  },
  zooSlotsTileBorder: {
    borderColor: 'rgba(16, 185, 129, 0.65)',
    shadowColor: '#10B981',
  },
  oceanKingTileBorder: {
    borderColor: 'rgba(0, 245, 212, 0.65)',
    shadowColor: '#00F5D4',
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
    marginTop: -3,
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
    marginTop: -3,
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
  bottomRibbonRed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(153, 27, 27, 0.92)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.5)',
    zIndex: 3,
  },
  bottomRibbonRedText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomRibbonAmber: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(120, 53, 15, 0.92)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 224, 71, 0.5)',
    zIndex: 3,
  },
  bottomRibbonAmberText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bottomRibbonCyan: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(3, 105, 161, 0.92)',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 245, 212, 0.5)',
    zIndex: 3,
  },
  bottomRibbonCyanText: {
    color: '#00F5D4',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
  },
  fruitPartyTileBorder: {
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  bottomRibbonMagenta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(190, 24, 93, 0.92)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRibbonMagentaText: {
    color: '#FFE600',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dragonTigerTileBorder: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  bottomRibbonCrimson: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(153, 27, 27, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.6)',
    zIndex: 3,
  },
  bottomRibbonCrimsonText: {
    color: '#FEF08A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  colorPredictionTileBorder: {
    borderWidth: 1.5,
    borderColor: '#A855F7',
  },
  bottomRibbonPurple: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(88, 28, 135, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 132, 252, 0.6)',
    zIndex: 3,
  },
  bottomRibbonPurpleText: {
    color: '#FDE047',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bullseyeDartsTileBorder: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  bottomRibbonGoldDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(180, 83, 9, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 224, 71, 0.6)',
    zIndex: 3,
  },
  bottomRibbonGoldDarkText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  matkaCrackTileBorder: {
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  bottomRibbonAmberDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(180, 83, 9, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 224, 71, 0.6)',
    zIndex: 3,
  },
  bottomRibbonAmberDarkText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  goliSodaTileBorder: {
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  bottomRibbonEmeraldDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(110, 231, 183, 0.6)',
    zIndex: 3,
  },
  bottomRibbonEmeraldDarkText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  candyBonanzaTileBorder: {
    borderWidth: 1.5,
    borderColor: '#EC4899',
  },
  bottomRibbonPinkDark: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(190, 24, 93, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 114, 182, 0.6)',
    zIndex: 3,
  },
  bottomRibbonPinkDarkText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  plinkoTileBorder: {
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  bottomRibbonAmberGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(217, 119, 6, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 224, 71, 0.6)',
    zIndex: 3,
  },
  bottomRibbonAmberGoldText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  nariyalTileBorder: {
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  bottomRibbonEmeraldPearl: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(52, 211, 153, 0.6)',
    zIndex: 3,
  },
  bottomRibbonEmeraldPearlText: {
    color: '#FEF08A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
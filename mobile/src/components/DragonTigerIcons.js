import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Rect,
  G,
  LinearGradient,
  RadialGradient,
  Defs,
  Stop,
} from 'react-native-svg';

/**
 * 1. Majestic Imperial Red Dragon Emblem (🐉)
 */
export function DragonEmblemIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="dragonFlame" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#F97316" />
          <Stop offset="80%" stopColor="#DC2626" />
          <Stop offset="100%" stopColor="#7F1D1D" />
        </LinearGradient>
        <LinearGradient id="dragonHorn" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
        <RadialGradient id="dragonEye" cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="70%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
      </Defs>

      {/* Flame Whiskers & Mane */}
      <Path
        d="M20 18 C14 10, 8 16, 6 24 C12 22, 16 26, 18 30"
        stroke="url(#dragonFlame)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M26 12 C20 4, 12 8, 10 16 C16 16, 20 20, 22 24"
        stroke="url(#dragonFlame)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Dragon Crown Horns */}
      <Path
        d="M32 16 C34 6, 44 4, 48 8 C44 14, 40 18, 36 20 Z"
        fill="url(#dragonHorn)"
      />
      <Path
        d="M36 18 C40 10, 50 10, 52 16 C48 20, 44 22, 40 24 Z"
        fill="url(#dragonHorn)"
      />

      {/* Dragon Head & Snout */}
      <Path
        d="M22 26 C24 20, 36 20, 40 26 C46 28, 54 34, 52 42 C50 48, 42 52, 34 50 C26 48, 22 42, 22 36 Z"
        fill="url(#dragonFlame)"
      />

      {/* Snout Details & Nose Horn */}
      <Path
        d="M52 42 L58 40 L54 44 Z"
        fill="#FDE047"
      />
      {/* Lower Jaw */}
      <Path
        d="M36 46 C42 48, 48 46, 50 44 C46 49, 38 52, 32 50 Z"
        fill="#991B1B"
      />
      {/* Sharp Teeth */}
      <Path d="M42 44 L44 48 L46 44 L48 48 L50 44" stroke="#FFF" strokeWidth="1.5" fill="none" />

      {/* Glowing Dragon Eye */}
      <Ellipse cx="34" cy="30" rx="4.5" ry="3" fill="url(#dragonEye)" transform="rotate(-15 34 30)" />
      <Path d="M34 28 L34 32" stroke="#451A03" strokeWidth="1.8" strokeLinecap="round" />

      {/* Long Whisker */}
      <Path
        d="M48 42 C54 48, 60 48, 62 42"
        stroke="#FDE047"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 2. Fierce Roaring Golden Tiger Emblem (🐯)
 */
export function TigerEmblemIcon({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="tigerFace" cx="50%" cy="45%" r="65%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="30%" stopColor="#F59E0B" />
          <Stop offset="75%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
        <LinearGradient id="tigerEar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>

      {/* Ears */}
      <Path d="M14 18 C12 10, 20 10, 24 16 Z" fill="url(#tigerEar)" />
      <Path d="M16 16 C15 12, 19 12, 21 16 Z" fill="#451A03" />
      <Path d="M50 18 C52 10, 44 10, 40 16 Z" fill="url(#tigerEar)" />
      <Path d="M48 16 C49 12, 45 12, 43 16 Z" fill="#451A03" />

      {/* Main Head Oval */}
      <Circle cx="32" cy="36" r="22" fill="url(#tigerFace)" />

      {/* White Muzzle & Cheeks */}
      <Path
        d="M20 38 C16 42, 18 50, 24 50 C28 50, 30 46, 32 44 C34 46, 36 50, 40 50 C46 50, 48 42, 44 38 C38 34, 26 34, 20 38 Z"
        fill="#FFFBEB"
      />

      {/* Black Tiger Stripes (Forehead & Cheeks) */}
      {/* Center King Symbol (王) style forehead stripes */}
      <Path d="M26 20 L38 20 M28 24 L36 24 M32 18 L32 28 M24 28 L40 28" stroke="#1C1917" strokeWidth="2" strokeLinecap="round" />
      {/* Left Cheek Stripes */}
      <Path d="M12 34 L18 36 M11 40 L19 41 M14 46 L20 45" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
      {/* Right Cheek Stripes */}
      <Path d="M52 34 L46 36 M53 40 L45 41 M50 46 L44 45" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />

      {/* Piercing Amber Eyes */}
      <Ellipse cx="24" cy="32" rx="3.5" ry="2.2" fill="#38BDF8" transform="rotate(10 24 32)" />
      <Circle cx="24" cy="32" r="1.3" fill="#0F172A" />
      <Ellipse cx="40" cy="32" rx="3.5" ry="2.2" fill="#38BDF8" transform="rotate(-10 40 32)" />
      <Circle cx="40" cy="32" r="1.3" fill="#0F172A" />

      {/* Nose */}
      <Path d="M30 40 L34 40 L32 43 Z" fill="#F43F5E" />

      {/* Roaring Mouth & Fangs */}
      <Path d="M28 45 Q32 49 36 45" stroke="#1C1917" strokeWidth="2" fill="none" />
      <Path d="M29 45 L30 48 L31 45" fill="#FFF" />
      <Path d="M33 45 L34 48 L35 45" fill="#FFF" />
    </Svg>
  );
}

/**
 * 3. Crossed Mystic Swords for TIE (⚔️)
 */
export function SwordsCrossedIcon({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="bladeGlow1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#A7F3D0" />
          <Stop offset="50%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
        <LinearGradient id="bladeGlow2" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#854D0E" />
        </LinearGradient>
      </Defs>

      {/* Sword 1: Top-Left to Bottom-Right */}
      <G transform="rotate(45 32 32)">
        <Rect x="30" y="8" width="4" height="38" rx="2" fill="url(#bladeGlow1)" />
        <Path d="M30 8 L32 4 L34 8 Z" fill="#E6FFFA" />
        {/* Guard & Hilt */}
        <Rect x="24" y="44" width="16" height="3" rx="1.5" fill="#FEF08A" />
        <Rect x="30" y="47" width="4" height="9" rx="1" fill="#78350F" />
        <Circle cx="32" cy="58" r="2.5" fill="#F59E0B" />
      </G>

      {/* Sword 2: Top-Right to Bottom-Left */}
      <G transform="rotate(-45 32 32)">
        <Rect x="30" y="8" width="4" height="38" rx="2" fill="url(#bladeGlow2)" />
        <Path d="M30 8 L32 4 L34 8 Z" fill="#FFF" />
        {/* Guard & Hilt */}
        <Rect x="24" y="44" width="16" height="3" rx="1.5" fill="#A7F3D0" />
        <Rect x="30" y="47" width="4" height="9" rx="1" fill="#064E3B" />
        <Circle cx="32" cy="58" r="2.5" fill="#10B981" />
      </G>

      {/* Center Impact Sparkle */}
      <Circle cx="32" cy="32" r="4" fill="#FFF" />
      <Path d="M32 24 L32 40 M24 32 L40 32" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 4. Realistic Playing Card Graphic (Front & Back)
 */
export function PlayingCardGraphic({
  card,
  isFaceDown = false,
  width = 90,
  height = 126,
}) {
  if (isFaceDown || !card) {
    return (
      <View style={[styles.cardContainer, { width, height }, styles.cardBack]}>
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#1E1B4B']}
          style={styles.cardBackGradient}
        >
          {/* Card Back Intricate Lattice Pattern */}
          <View style={styles.cardBackInnerBorder}>
            <Text style={styles.cardBackSymbol}>🎴</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const isRed = card.isRed;
  const suitColor = isRed ? '#DC2626' : '#0F172A';

  return (
    <View style={[styles.cardContainer, { width, height }]}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
        style={styles.cardFaceGradient}
      >
        {/* Top-Left Rank & Suit */}
        <View style={styles.cornerTopLeft}>
          <Text style={[styles.cornerRank, { color: suitColor }]}>{card.rank}</Text>
          <Text style={[styles.cornerSuit, { color: suitColor }]}>{card.suitSymbol}</Text>
        </View>

        {/* Center Large Suit / Emblem */}
        <View style={styles.cardCenter}>
          <Text style={[styles.centerSuitLarge, { color: suitColor }]}>
            {card.suitSymbol}
          </Text>
          {['J', 'Q', 'K'].includes(card.rank) && (
            <Text style={[styles.courtRankTag, { color: suitColor }]}>
              {card.name.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Bottom-Right Rank & Suit (Inverted) */}
        <View style={styles.cornerBottomRight}>
          <Text style={[styles.cornerRank, { color: suitColor }]}>{card.rank}</Text>
          <Text style={[styles.cornerSuit, { color: suitColor }]}>{card.suitSymbol}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * 5. Dragon vs Tiger Confrontation Emblem for Games List Modal Tile
 */
export function DragonTigerTileIcon({ size = 52 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="dtTileSplit" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#DC2626" />
          <Stop offset="45%" stopColor="#991B1B" />
          <Stop offset="55%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>

      {/* Yin-Yang Style Duel Base Circle */}
      <Circle cx="48" cy="48" r="44" fill="url(#dtTileSplit)" />
      <Circle cx="48" cy="48" r="40" fill="#0A0618" />

      {/* Left Dragon Face Side */}
      <Path d="M48 10 A38 38 0 0 0 48 86 Z" fill="rgba(239, 68, 68, 0.25)" />
      {/* Right Tiger Face Side */}
      <Path d="M48 10 A38 38 0 0 1 48 86 Z" fill="rgba(245, 158, 11, 0.25)" />

      {/* Center Lightning Slash */}
      <Path
        d="M52 8 L44 44 L54 48 L42 88"
        stroke="#FDE047"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="miter"
      />

      {/* Dragon Head (Left) */}
      <G transform="translate(10, 26) scale(0.65)">
        <DragonEmblemIcon size={48} />
      </G>

      {/* Tiger Head (Right) */}
      <G transform="translate(48, 26) scale(0.65)">
        <TigerEmblemIcon size={48} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  cardFaceGradient: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  cornerTopLeft: {
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  cornerBottomRight: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 15,
  },
  cornerSuit: {
    fontSize: 13,
    lineHeight: 14,
  },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSuitLarge: {
    fontSize: 34,
    lineHeight: 38,
  },
  courtRankTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  cardBack: {
    borderColor: '#FDE047',
    borderWidth: 2,
  },
  cardBackGradient: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackInnerBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardBackSymbol: {
    fontSize: 26,
  },
});


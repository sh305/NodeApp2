import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Defs,
  Stop,
} from 'react-native-svg';

/**
 * 1. Ornate Treasure Matka Graphic
 * Renders an authentic earthen/royal pot with intact or smashed state
 */
export function OrnateTreasureMatkaGraphic({
  size = 110,
  theme = 'ruby', // 'ruby' | 'gold' | 'jade'
  status = 'intact', // 'intact' | 'cracked' | 'smashed'
  prize = null, // 'diamond' | 'gold' | 'empty'
}) {
  const width = size;
  const height = size * 1.15;
  const cx = width / 2;

  // Theme palettes
  let potGradStart = '#991B1B';
  let potGradMid = '#DC2626';
  let potGradEnd = '#450A0A';
  let accentColor = '#FDE047';

  if (theme === 'gold') {
    potGradStart = '#B45309';
    potGradMid = '#F59E0B';
    potGradEnd = '#78350F';
    accentColor = '#FEF08A';
  } else if (theme === 'jade') {
    potGradStart = '#065F46';
    potGradMid = '#059669';
    potGradEnd = '#022C22';
    accentColor = '#A7F3D0';
  }

  const isSmashed = status === 'smashed';

  return (
    <View style={[styles.matkaWrapper, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 100 115`}>
        <Defs>
          {/* Pot Belly Radial Gradient */}
          <RadialGradient id={`potBellyGrad_${theme}`} cx="40%" cy="40%" r="60%">
            <Stop offset="0%" stopColor={potGradMid} />
            <Stop offset="70%" stopColor={potGradStart} />
            <Stop offset="100%" stopColor={potGradEnd} />
          </RadialGradient>

          {/* Golden Rim Gradient */}
          <LinearGradient id="goldRimGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>

          {/* Diamond Vault Glow */}
          <RadialGradient id="diamondAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#67E8F9" stopOpacity={0.9} />
            <Stop offset="60%" stopColor="#0284C7" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>

          {/* Gold Coins Glow */}
          <RadialGradient id="goldAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FEF08A" stopOpacity={0.9} />
            <Stop offset="60%" stopColor="#D97706" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Shadow under pot */}
        <Ellipse cx={50} cy={108} rx={36} ry={6} fill="rgba(0,0,0,0.45)" />

        {!isSmashed ? (
          /* ================= INTACT MATKA ================= */
          <G>
            {/* Round Pot Belly Body */}
            <Path
              d="M 50 32 C 22 32, 10 52, 10 74 C 10 96, 26 104, 50 104 C 74 104, 90 96, 90 74 C 90 52, 78 32, 50 32 Z"
              fill={`url(#potBellyGrad_${theme})`}
              stroke={accentColor}
              strokeWidth="2"
            />

            {/* Specular Highlight Arc */}
            <Path
              d="M 28 50 C 22 58, 22 72, 28 82"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Ornate Waist Pattern Band */}
            <Path
              d="M 12 72 Q 50 82 88 72"
              stroke="url(#goldRimGrad)"
              strokeWidth="4"
              fill="none"
            />
            {/* Jewels on waist band */}
            <Circle cx={28} cy={74} r={2.5} fill="#FEF08A" />
            <Circle cx={42} cy={76} r={2.5} fill="#FEF08A" />
            <Circle cx={50} cy={76.5} r={3} fill="#FFFFFF" />
            <Circle cx={58} cy={76} r={2.5} fill="#FEF08A" />
            <Circle cx={72} cy={74} r={2.5} fill="#FEF08A" />

            {/* Pot Neck Collar */}
            <Path
              d="M 32 34 L 30 20 L 70 20 L 68 34 Z"
              fill={`url(#potBellyGrad_${theme})`}
              stroke="url(#goldRimGrad)"
              strokeWidth="1.5"
            />

            {/* Top Lip & Golden Lid */}
            <Ellipse cx={50} cy={20} rx={22} ry={6} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1" />
            <Ellipse cx={50} cy={16} rx={16} ry={4} fill={potGradMid} />
            {/* Crown Finial */}
            <Circle cx={50} cy={10} r={4.5} fill="url(#goldRimGrad)" stroke="#FEF08A" strokeWidth="1" />
            <Circle cx={50} cy={8} r={1.5} fill="#FFFFFF" />
          </G>
        ) : (
          /* ================= SMASHED MATKA (TREASURE REVEALED) ================= */
          <G>
            {/* Cracked Pot Base Shell */}
            <Path
              d="M 16 78 C 14 96, 26 104, 50 104 C 74 104, 86 96, 84 78 C 76 86, 60 84, 50 90 C 40 84, 24 86, 16 78 Z"
              fill={`url(#potBellyGrad_${theme})`}
              stroke={accentColor}
              strokeWidth="1.5"
            />

            {/* Left Broken Shard */}
            <Path
              d="M 10 70 L 22 55 L 26 78 L 14 80 Z"
              fill={potGradStart}
              stroke="url(#goldRimGrad)"
              strokeWidth="1"
              transform="rotate(-15 15 70)"
            />

            {/* Right Broken Shard */}
            <Path
              d="M 85 70 L 75 54 L 72 76 L 86 78 Z"
              fill={potGradStart}
              stroke="url(#goldRimGrad)"
              strokeWidth="1"
              transform="rotate(18 80 70)"
            />

            {/* Crack Lightning Lines */}
            <Path
              d="M 30 84 L 38 94 L 46 88 L 54 98 L 64 88"
              stroke="#FEF08A"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Treasure Burst Based on Prize */}
            {prize === 'diamond' ? (
              /* 💎 DIAMOND VAULT (5X) */
              <G>
                {/* Aura Glow */}
                <Circle cx={50} cy={46} r={32} fill="url(#diamondAura)" />
                {/* Sunburst Rays */}
                <Path d="M 50 16 L 50 6 M 22 24 L 14 14 M 78 24 L 86 14 M 18 50 L 6 50 M 82 50 L 94 50" stroke="#67E8F9" strokeWidth="2.5" strokeLinecap="round" />
                {/* Big Sparkling 3D Diamond */}
                <Path d="M 32 36 L 68 36 L 80 50 L 50 78 L 20 50 Z" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="2" />
                <Path d="M 32 36 L 50 50 L 68 36" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                <Path d="M 20 50 L 50 50 L 80 50" stroke="#BAE6FD" strokeWidth="1.5" fill="none" />
                <Path d="M 50 50 L 50 78" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
                <Path d="M 32 36 L 20 50 L 50 78" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="#0284C7" opacity={0.6} />
                <Path d="M 68 36 L 80 50 L 50 78" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="#0369A1" opacity={0.6} />
                {/* Center Facet Glow */}
                <Path d="M 36 38 L 64 38 L 50 48 Z" fill="#E0F2FE" opacity={0.8} />
                <Circle cx={36} cy={42} r={2} fill="#FFFFFF" />
              </G>
            ) : prize === 'gold' ? (
              /* 🪙 GOLD OVERFLOW (2.5X) */
              <G>
                {/* Gold Glow */}
                <Circle cx={50} cy={55} r={30} fill="url(#goldAura)" />
                {/* Heaps of Golden Coins Spilling Out */}
                <Circle cx={40} cy={72} r={10} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1.2" />
                <Circle cx={60} cy={70} r={11} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1.2" />
                <Circle cx={50} cy={60} r={12} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1.5" />
                <Circle cx={34} cy={58} r={9} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1" />
                <Circle cx={66} cy={56} r={9} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1" />
                <Circle cx={50} cy={44} r={11} fill="url(#goldRimGrad)" stroke="#B45309" strokeWidth="1.5" />
                {/* Star on top coin */}
                <Path d="M 50 39 L 52 43 L 56 44 L 52 46 L 50 50 L 48 46 L 44 44 L 48 43 Z" fill="#FEF08A" />
                {/* Coin Sparkles */}
                <Circle cx={36} cy={34} r={2} fill="#FEF08A" />
                <Circle cx={64} cy={36} r={2} fill="#FEF08A" />
                <Circle cx={50} cy={28} r={2.5} fill="#FFFFFF" />
              </G>
            ) : (
              /* 🍂 EMPTY / DRY LEAF (0X) */
              <G>
                {/* Dust Puff Smoke */}
                <Circle cx={44} cy={60} r={12} fill="rgba(148, 163, 184, 0.4)" />
                <Circle cx={56} cy={58} r={14} fill="rgba(148, 163, 184, 0.35)" />
                <Circle cx={50} cy={48} r={10} fill="rgba(148, 163, 184, 0.3)" />
                {/* Dry Leaves / Dust Twigs */}
                <Path d="M 42 66 Q 48 56 58 64" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />
                <Path d="M 46 62 Q 52 72 44 76" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </G>
            )}
          </G>
        )}
      </Svg>

      {/* Smashed Prize Banner Tag */}
      {isSmashed && prize && (
        <View
          style={[
            styles.smashedTag,
            prize === 'diamond'
              ? styles.tagDiamond
              : prize === 'gold'
              ? styles.tagGold
              : styles.tagEmpty,
          ]}
        >
          <Text style={styles.smashedTagText}>
            {prize === 'diamond' ? '💎 5X' : prize === 'gold' ? '🪙 2.5X' : '🍂 0X'}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * 2. Royal Golden Hammer Graphic
 */
export function GoldenHammerGraphic({ size = 56 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="hammerHeadGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="50%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
        <LinearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#78350F" />
          <Stop offset="50%" stopColor="#92400E" />
          <Stop offset="100%" stopColor="#451A03" />
        </LinearGradient>
      </Defs>
      <G transform="rotate(35 32 32)">
        {/* Steel Handle */}
        <Path d="M 30 20 L 34 20 L 33 58 L 31 58 Z" fill="url(#handleGrad)" stroke="#F59E0B" strokeWidth="0.8" />
        {/* Grip Rings */}
        <Path d="M 29 44 L 35 44 M 29 50 L 35 50" stroke="#FEF08A" strokeWidth="1" />
        {/* Ornate Hammer Head */}
        <Path d="M 18 10 L 46 10 L 48 22 L 16 22 Z" fill="url(#hammerHeadGrad)" stroke="#FEF08A" strokeWidth="1.2" />
        {/* Center Jewel */}
        <Circle cx={32} cy={16} r={3} fill="#DC2626" stroke="#FEF08A" strokeWidth="0.8" />
        {/* Impact Spark */}
        <Path d="M 14 6 L 18 10 M 50 10 L 54 6" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

/**
 * 3. Matka Crack Tile Icon for GamesListModal
 */
export function MatkaCrackTileIcon({ size = 52 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <RadialGradient id="matkaTileBg" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#78350F" />
          <Stop offset="60%" stopColor="#451A03" />
          <Stop offset="100%" stopColor="#1E1B4B" />
        </RadialGradient>
        <RadialGradient id="potGradTile" cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="70%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
      </Defs>

      {/* Background Circle */}
      <Circle cx={48} cy={48} r="44" fill="url(#matkaTileBg)" stroke="#F59E0B" strokeWidth="2" />

      {/* Golden Aura Rings */}
      <Circle cx={48} cy={48} r="38" stroke="rgba(253, 224, 71, 0.4)" strokeWidth="1.2" strokeDasharray="4 3" fill="none" />

      {/* Golden Matka Body */}
      <Path
        d="M 48 34 C 28 34, 18 48, 18 64 C 18 80, 30 86, 48 86 C 66 86, 78 80, 78 64 C 78 48, 68 34, 48 34 Z"
        fill="url(#potGradTile)"
        stroke="#FEF08A"
        strokeWidth="1.8"
      />

      {/* Pot Neck & Lid */}
      <Ellipse cx={48} cy={34} rx={16} ry={4.5} fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
      <Circle cx={48} cy={27} r={3.5} fill="#FEF08A" />

      {/* Sparkling 5X Diamond Bursting Out */}
      <G transform="translate(48, 48) scale(0.65)">
        <Path d="M -16 -12 L 16 -12 L 24 2 L 0 26 L -24 2 Z" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
        <Path d="M -16 -12 L 0 2 L 16 -12" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <Path d="M -24 2 L 0 2 L 24 2" stroke="#BAE6FD" strokeWidth="1.5" fill="none" />
      </G>

      {/* Golden Hammer on top right */}
      <G transform="translate(62, 18) scale(0.65)">
        <GoldenHammerGraphic size={36} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  matkaWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  smashedTag: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 3,
  },
  tagDiamond: {
    backgroundColor: '#0284C7',
    borderColor: '#7DD3FC',
  },
  tagGold: {
    backgroundColor: '#D97706',
    borderColor: '#FEF08A',
  },
  tagEmpty: {
    backgroundColor: '#475569',
    borderColor: '#94A3B8',
  },
  smashedTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});


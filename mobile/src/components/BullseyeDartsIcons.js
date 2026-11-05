import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  G,
  LinearGradient,
  RadialGradient,
  Defs,
  Stop,
} from 'react-native-svg';

const DARTS_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const RED_DARTS_NUMBERS = [20, 18, 13, 10, 2, 3, 7, 8, 14, 12];

/**
 * 1. Tournament Dartboard Graphic
 * Renders authentic radial segments, double/triple rings, bullseye, and landed dart
 */
export function TournamentDartboardGraphic({
  size = 220,
  hitX = null, // -90 to +90
  hitY = null, // -90 to +90
  isFlying = false,
}) {
  const center = size / 2;
  const radius = size * 0.44;

  // Generate 20 radial segment paths
  const segments = [];
  for (let i = 0; i < 20; i++) {
    const num = DARTS_NUMBERS[i];
    const isRed = RED_DARTS_NUMBERS.includes(num);
    const startAngle = (i * 18 - 99) * (Math.PI / 180);
    const endAngle = ((i + 1) * 18 - 99) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    // Outer single segment
    const pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

    segments.push({
      num,
      isRed,
      pathD,
      color: isRed ? '#BE123C' : '#0F172A',
      accentColor: isRed ? '#EF4444' : '#10B981',
    });
  }

  // Calculate landed dart screen coordinates
  const dartScreenX = hitX !== null ? center + (hitX / 100) * radius : center;
  const dartScreenY = hitY !== null ? center + (hitY / 100) * radius : center;

  return (
    <View style={[styles.dartboardWrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Outer Rim Steel Gradient */}
          <RadialGradient id="dartboardRim" cx="50%" cy="50%" r="50%">
            <Stop offset="80%" stopColor="#1E1B4B" />
            <Stop offset="92%" stopColor="#312E81" />
            <Stop offset="100%" stopColor="#0B0914" />
          </RadialGradient>

          {/* Golden Eye Center Gradient */}
          <RadialGradient id="goldenEyeGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="45%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </RadialGradient>

          {/* Outer Bull Red Gradient */}
          <RadialGradient id="outerBullGrad" cx="40%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#F87171" />
            <Stop offset="60%" stopColor="#DC2626" />
            <Stop offset="100%" stopColor="#7F1D1D" />
          </RadialGradient>

          {/* Golden Dart Flight Gradient */}
          <LinearGradient id="dartFlightGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
        </Defs>

        {/* Outer Steel Dartboard Rim */}
        <Circle cx={center} cy={center} r={radius + 14} fill="url(#dartboardRim)" stroke="#4338CA" strokeWidth="2.5" />
        <Circle cx={center} cy={center} r={radius + 4} stroke="#FDE047" strokeWidth="1" strokeDasharray="4 4" fill="none" opacity={0.6} />

        {/* 20 Alternating Segments (Black & Red) */}
        {segments.map((seg, i) => (
          <Path key={`seg-${i}`} d={seg.pathD} fill={seg.color} />
        ))}

        {/* Double Precision Outer Ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.90}
          stroke="rgba(253, 224, 71, 0.4)"
          strokeWidth={radius * 0.10}
          fill="none"
        />

        {/* Triple Precision Inner Ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius * 0.54}
          stroke="rgba(245, 158, 11, 0.5)"
          strokeWidth={radius * 0.09}
          fill="none"
        />

        {/* Metallic Spider Wire Grid Rings */}
        <Circle cx={center} cy={center} r={radius} stroke="#94A3B8" strokeWidth="1.2" fill="none" />
        <Circle cx={center} cy={center} r={radius * 0.95} stroke="#E2E8F0" strokeWidth="1" fill="none" />
        <Circle cx={center} cy={center} r={radius * 0.85} stroke="#CBD5E1" strokeWidth="1" fill="none" />
        <Circle cx={center} cy={center} r={radius * 0.58} stroke="#E2E8F0" strokeWidth="1" fill="none" />
        <Circle cx={center} cy={center} r={radius * 0.50} stroke="#CBD5E1" strokeWidth="1" fill="none" />

        {/* Outer Bullseye (Green Ring - 10X) */}
        <Circle cx={center} cy={center} r={radius * 0.22} fill="url(#outerBullGrad)" stroke="#FEF08A" strokeWidth="1.8" />

        {/* Inner Golden Eye (Gold Center - 25X) */}
        <Circle cx={center} cy={center} r={radius * 0.10} fill="url(#goldenEyeGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
        <Circle cx={center - 2} cy={center - 2} r={radius * 0.03} fill="#FFFFFF" opacity={0.8} />

        {/* Impact Shockwave Ring if landed */}
        {hitX !== null && !isFlying && (
          <G>
            <Circle
              cx={dartScreenX}
              cy={dartScreenY}
              r={16}
              stroke="#FEF08A"
              strokeWidth="2.5"
              fill="none"
              opacity={0.85}
            />
            <Circle
              cx={dartScreenX}
              cy={dartScreenY}
              r={24}
              stroke="#F59E0B"
              strokeWidth="1.2"
              fill="none"
              opacity={0.5}
            />
            {/* Impact Spark Rays */}
            <Path
              d={`M ${dartScreenX - 8} ${dartScreenY} L ${dartScreenX + 8} ${dartScreenY} M ${dartScreenX} ${dartScreenY - 8} L ${dartScreenX} ${dartScreenY + 8}`}
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </G>
        )}

        {/* Landed Dart Graphic */}
        {hitX !== null && !isFlying && (
          <G transform={`translate(${dartScreenX}, ${dartScreenY}) rotate(-35)`}>
            {/* Dart Shadow */}
            <Ellipse cx={6} cy={8} rx={4} ry={2} fill="rgba(0,0,0,0.5)" />
            {/* Dart Steel Tip */}
            <Path d="M 0 0 L -2 -14 L 2 -14 Z" fill="#E2E8F0" />
            {/* Dart Brass Barrel */}
            <Path d="M -3 -14 L 3 -14 L 3 -30 L -3 -30 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.8" />
            {/* Dart Shaft */}
            <Path d="M -1.5 -30 L 1.5 -30 L 1.5 -44 L -1.5 -44 Z" fill="#1E293B" />
            {/* Dart Flights (Wings) */}
            <Path d="M 0 -44 L -10 -58 L 0 -54 L 10 -58 Z" fill="url(#dartFlightGrad)" stroke="#B45309" strokeWidth="0.8" />
            {/* Flight Center Spine */}
            <Path d="M 0 -44 L 0 -58" stroke="#FEF08A" strokeWidth="1.2" />
          </G>
        )}
      </Svg>
    </View>
  );
}

/**
 * 2. Flying Golden Dart Icon
 */
export function GoldenDartIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="dartGrad1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="50%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>
      <G transform="rotate(45 24 24)">
        {/* Steel Tip */}
        <Path d="M 24 4 L 22 14 L 26 14 Z" fill="#F1F5F9" />
        {/* Grip Barrel */}
        <Path d="M 21 14 L 27 14 L 27 28 L 21 28 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        {/* Shaft */}
        <Path d="M 22.5 28 L 25.5 28 L 25.5 38 L 22.5 38 Z" fill="#334155" />
        {/* Wings */}
        <Path d="M 24 38 L 14 46 L 24 42 L 34 46 Z" fill="url(#dartGrad1)" stroke="#D97706" strokeWidth="1" />
      </G>
    </Svg>
  );
}

/**
 * 3. Bullseye Target Reticle Icon
 */
export function BullseyeTargetIcon({ size = 32, color = '#EF4444' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="20" stroke={color} strokeWidth="3" fill="none" opacity={0.4} />
      <Circle cx="24" cy="24" r="14" stroke={color} strokeWidth="2.5" fill="none" opacity={0.7} />
      <Circle cx="24" cy="24" r="8" fill={color} />
      <Circle cx="24" cy="24" r="3" fill="#FFFFFF" />
      {/* Crosshairs */}
      <Path d="M 24 2 L 24 10 M 24 38 L 24 46 M 2 24 L 10 24 M 38 24 L 46 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 4. Bullseye Darts Game Tile Icon for GamesListModal
 */
export function BullseyeDartsTileIcon({ size = 52 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <RadialGradient id="dartsTileBg" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#831843" />
          <Stop offset="60%" stopColor="#4C0519" />
          <Stop offset="100%" stopColor="#1E1B4B" />
        </RadialGradient>
        <RadialGradient id="tileTargetGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#EF4444" />
          <Stop offset="75%" stopColor="#1E1B4B" />
          <Stop offset="100%" stopColor="#0F172A" />
        </RadialGradient>
      </Defs>

      {/* Base Background Circle */}
      <Circle cx="48" cy="48" r="44" fill="url(#dartsTileBg)" stroke="#F59E0B" strokeWidth="2" />

      {/* Target Concentric Rings */}
      <Circle cx="48" cy="48" r="36" fill="#1E293B" stroke="#E2E8F0" strokeWidth="1.5" />
      <Circle cx="48" cy="48" r="28" fill="#BE123C" stroke="#FEF08A" strokeWidth="1.2" />
      <Circle cx="48" cy="48" r="18" fill="#10B981" stroke="#FEF08A" strokeWidth="1.2" />
      <Circle cx="48" cy="48" r="9" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
      <Circle cx="48" cy="48" r="4" fill="#FEF08A" />

      {/* Piercing Dart in Bullseye */}
      <G transform="translate(48, 48) rotate(-45)">
        <Path d="M 0 0 L -3 -16 L 3 -16 Z" fill="#FFFFFF" />
        <Path d="M -4 -16 L 4 -16 L 4 -32 L -4 -32 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        <Path d="M 0 -32 L -12 -46 L 0 -42 L 12 -46 Z" fill="#FEF08A" stroke="#F59E0B" strokeWidth="1" />
      </G>

      {/* Golden Sparks */}
      <Circle cx="36" cy="36" r="2" fill="#FEF08A" />
      <Circle cx="60" cy="38" r="1.5" fill="#FEF08A" />
      <Circle cx="50" cy="24" r="2" fill="#FFFFFF" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  dartboardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});


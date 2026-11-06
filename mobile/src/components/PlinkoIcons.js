import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Ellipse,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';

/**
 * 🟡 Golden 3D Plinko Ball
 * High-gloss chrome gold metallic sphere with reflections and aura
 */
export function GoldenPlinkoBallGraphic({ size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <RadialGradient id="ballAura" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FDE047" stopOpacity="0.9" />
          <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#D97706" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="ballSphere" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="25%" stopColor="#FEF08A" />
          <Stop offset="55%" stopColor="#F59E0B" />
          <Stop offset="85%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
        <LinearGradient id="ballRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>
      </Defs>

      {/* Outer Glow Halo */}
      <Circle cx="16" cy="16" r="15" fill="url(#ballAura)" />

      {/* Main 3D Sphere Body */}
      <Circle cx="16" cy="16" r="11" fill="url(#ballSphere)" stroke="url(#ballRim)" strokeWidth="1.2" />

      {/* Primary Specular Highlight */}
      <Ellipse cx="13" cy="12" rx="3.5" ry="2.2" transform="rotate(-30 13 12)" fill="#FFFFFF" opacity={0.9} />

      {/* Secondary Rim Reflection */}
      <Path
        d="M21 21 C22 18, 22 14, 20 12"
        stroke="#FEF08A"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
    </Svg>
  );
}

/**
 * 📍 Plinko Peg Pin (Golden / Chrome Pin)
 */
export function PlinkoPegPinGraphic({ size = 12, glow = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Defs>
        <RadialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pinBody" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="40%" stopColor="#FDE047" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
      </Defs>
      {glow && <Circle cx="8" cy="8" r="7.5" fill="url(#pinGlow)" />}
      <Circle cx="8" cy="8" r="4.5" fill="url(#pinBody)" stroke="#FEF08A" strokeWidth="0.75" />
      <Circle cx="6.8" cy="6.5" r="1.3" fill="#FFFFFF" opacity={0.9} />
    </Svg>
  );
}

/**
 * 🏆 Plinko 25X Jackpot Crown / Cup
 */
export function PlinkoJackpotCupIcon({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="jackpotGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFBEB" />
          <Stop offset="40%" stopColor="#FDE047" />
          <Stop offset="80%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>
      {/* Crown contour */}
      <Path
        d="M6 10 L10 22 L22 22 L26 10 L19 15 L16 8 L13 15 Z"
        fill="url(#jackpotGold)"
        stroke="#FEF08A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Base */}
      <Rect x="9" y="23" width="14" height="3" rx="1.5" fill="#F59E0B" stroke="#FEF08A" strokeWidth="0.8" />
      {/* Jewels */}
      <Circle cx="6" cy="9.5" r="2" fill="#EF4444" stroke="#FFF" strokeWidth="0.6" />
      <Circle cx="16" cy="7.5" r="2.2" fill="#3B82F6" stroke="#FFF" strokeWidth="0.6" />
      <Circle cx="26" cy="9.5" r="2" fill="#EF4444" stroke="#FFF" strokeWidth="0.6" />
    </Svg>
  );
}

/**
 * 🟡 Plinko Drop Modern Square Game Tile Icon for GamesListModal
 */
export function PlinkoTileIcon({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="plinkoBgGlow" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="tileBallGrad" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="30%" stopColor="#FEF08A" />
          <Stop offset="70%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </RadialGradient>
        <LinearGradient id="tilePyramid" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#4338CA" stopOpacity="0.05" />
        </LinearGradient>
      </Defs>

      {/* Ambient Glow */}
      <Circle cx="32" cy="32" r="28" fill="url(#plinkoBgGlow)" />

      {/* Pyramid Silhouette Outline */}
      <Path
        d="M32 8 L54 48 L10 48 Z"
        fill="url(#tilePyramid)"
        stroke="#818CF8"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.6}
      />

      {/* Pegboard Golden Pins (Triangular array) */}
      {/* Row 1 (apex) */}
      <Circle cx="32" cy="14" r="2" fill="#FDE047" stroke="#F59E0B" strokeWidth="0.8" />

      {/* Row 2 */}
      <Circle cx="26" cy="22" r="1.8" fill="#FDE047" />
      <Circle cx="38" cy="22" r="1.8" fill="#FDE047" />

      {/* Row 3 */}
      <Circle cx="20" cy="30" r="1.8" fill="#FDE047" />
      <Circle cx="32" cy="30" r="1.8" fill="#FDE047" />
      <Circle cx="44" cy="30" r="1.8" fill="#FDE047" />

      {/* Row 4 */}
      <Circle cx="15" cy="38" r="1.8" fill="#FDE047" />
      <Circle cx="26" cy="38" r="1.8" fill="#FDE047" />
      <Circle cx="38" cy="38" r="1.8" fill="#FDE047" />
      <Circle cx="49" cy="38" r="1.8" fill="#FDE047" />

      {/* Bottom Multiplier Bucket Pockets */}
      <Rect x="10" y="47" width="8" height="6" rx="2" fill="#EF4444" opacity={0.9} />
      <Rect x="20" y="47" width="7" height="6" rx="2" fill="#F97316" opacity={0.9} />
      <Rect x="28.5" y="47" width="7" height="6" rx="2" fill="#10B981" opacity={0.9} />
      <Rect x="37" y="47" width="7" height="6" rx="2" fill="#F97316" opacity={0.9} />
      <Rect x="46" y="47" width="8" height="6" rx="2" fill="#EF4444" opacity={0.9} />

      {/* Falling Golden Ball in motion with bounce trail */}
      <Path
        d="M32 10 Q28 17 26 23 Q29 27 33 29"
        fill="none"
        stroke="#FDE047"
        strokeWidth="1.2"
        strokeDasharray="1.5,1.5"
        opacity={0.8}
      />

      {/* Golden 3D Ball */}
      <Circle cx="33" cy="28" r="6" fill="url(#tileBallGrad)" stroke="#FEF08A" strokeWidth="1" />
      <Ellipse cx="31.5" cy="26" rx="2" ry="1.2" fill="#FFFFFF" opacity={0.9} />

      {/* Sparkles */}
      <Path d="M48 10 L49 13 L52 14 L49 15 L48 18 L47 15 L44 14 L47 13 Z" fill="#FEF08A" />
      <Path d="M14 18 L14.7 20 L17 20.7 L14.7 21.4 L14 23.5 L13.3 21.4 L11 20.7 L13.3 20 Z" fill="#FDE047" />
      <Circle cx="49" cy="26" r="1.4" fill="#FFFFFF" opacity={0.8} />
    </Svg>
  );
}


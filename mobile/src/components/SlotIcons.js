import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';

/**
 * 7 (Lucky 7) - 500x Jackpot Symbol
 * Vibrant fiery red & golden lucky 7 with bevel & shine
 */
export const SevenIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="sevenGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="50%" stopColor="#DC2626" />
        <Stop offset="100%" stopColor="#991B1B" />
      </LinearGradient>
      <LinearGradient id="sevenGoldBorder" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
      <LinearGradient id="sevenShine" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    {/* Outer Glow / Shadow */}
    <Path
      d="M20 20 H80 L52 86 H32 L56 38 H20 Z"
      fill="rgba(0,0,0,0.3)"
      transform="translate(2, 4)"
    />
    {/* Golden Bevel Border */}
    <Path
      d="M17 17 H83 L53 88 H29 L55 35 H17 Z"
      fill="url(#sevenGoldBorder)"
    />
    {/* Main Fiery Body */}
    <Path
      d="M20 20 H80 L52 85 H32 L56 38 H20 Z"
      fill="url(#sevenGrad)"
    />
    {/* Highlight shine */}
    <Path
      d="M22 22 H78 L72 32 H54 L36 32 H22 Z"
      fill="url(#sevenShine)"
    />
    {/* Little star sparkles */}
    <Path
      d="M74 22 L76 27 L81 29 L76 31 L74 36 L72 31 L67 29 L72 27 Z"
      fill="#FEF08A"
    />
  </Svg>
);

/**
 * Diamond (💎) - 100x Payout Symbol
 * Brilliant cut cyan / sapphire gemstone with light reflections
 */
export const DiamondIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="diamondGradTop" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#67E8F9" />
        <Stop offset="100%" stopColor="#06B6D4" />
      </LinearGradient>
      <LinearGradient id="diamondGradCenter" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="100%" stopColor="#0284C7" />
      </LinearGradient>
      <LinearGradient id="diamondGradBottom" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#0EA5E9" />
        <Stop offset="100%" stopColor="#0369A1" />
      </LinearGradient>
      <LinearGradient id="diamondShine" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
      </LinearGradient>
    </Defs>
    {/* Outer Shadow */}
    <Polygon
      points="25,36 75,36 50,84"
      fill="rgba(0,0,0,0.25)"
      transform="translate(0, 3)"
    />
    {/* Diamond Upper Facets */}
    <Polygon points="35,22 65,22 50,36" fill="url(#diamondShine)" />
    <Polygon points="18,36 35,22 50,36" fill="#A5F3FC" />
    <Polygon points="65,22 82,36 50,36" fill="#67E8F9" />
    {/* Diamond Lower Facets */}
    <Polygon points="18,36 50,36 50,82" fill="url(#diamondGradBottom)" />
    <Polygon points="50,36 82,36 50,82" fill="url(#diamondGradCenter)" />
    {/* Center Core Brilliance */}
    <Polygon points="32,36 68,36 50,82" fill="url(#diamondGradTop)" />
    {/* Facet Lines */}
    <Path
      d="M35 22 L50 36 M65 22 L50 36 M18 36 L50 36 L82 36 M32 36 L50 82 M68 36 L50 82"
      stroke="#E0F2FE"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Sparkle on crown */}
    <Circle cx="35" cy="24" r="2.5" fill="#FFFFFF" />
    <Circle cx="72" cy="40" r="1.5" fill="#FFFFFF" />
  </Svg>
);

/**
 * Watermelon (🍉) - 50x Payout Symbol
 * Fresh sliced triangle watermelon with red meat, seeds, and green rinds
 */
export const WatermelonIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="wmRedGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F87171" />
        <Stop offset="50%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
      <LinearGradient id="wmRindGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#22C55E" />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Drop shadow */}
    <Path
      d="M16 26 C16 26 28 88 84 84 L80 18 Z"
      fill="rgba(0,0,0,0.2)"
      transform="translate(2, 3)"
    />
    {/* Outer Green Rind Arc */}
    <Path
      d="M16 26 C16 66 48 88 86 86 L80 74 C50 74 26 56 26 28 Z"
      fill="url(#wmRindGrad)"
    />
    {/* White / Light Green Inner Rind */}
    <Path
      d="M26 28 C26 56 50 74 80 74 L78 68 C52 68 32 50 32 29 Z"
      fill="#DCFCE7"
    />
    {/* Juicy Red Pulp */}
    <Path
      d="M32 29 C32 50 52 68 78 68 L76 18 Z"
      fill="url(#wmRedGrad)"
    />
    {/* Highlight sheen */}
    <Path
      d="M38 32 C40 44 48 54 62 60"
      stroke="#FCA5A5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Black Seeds */}
    <Circle cx="50" cy="38" r="2.8" fill="#1C1917" />
    <Circle cx="62" cy="34" r="2.8" fill="#1C1917" />
    <Circle cx="65" cy="46" r="2.8" fill="#1C1917" />
    <Circle cx="52" cy="52" r="2.8" fill="#1C1917" />
    <Circle cx="44" cy="44" r="2.5" fill="#1C1917" />
  </Svg>
);

/**
 * Grapes (🍇) - 20x Payout Symbol
 * Rich purple grape cluster with stem and green leaf
 */
export const GrapesIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="grapeOrb" cx="35%" cy="30%" r="65%">
        <Stop offset="0%" stopColor="#C084FC" />
        <Stop offset="40%" stopColor="#9333EA" />
        <Stop offset="100%" stopColor="#581C87" />
      </RadialGradient>
      <LinearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#4ADE80" />
        <Stop offset="100%" stopColor="#16A34A" />
      </LinearGradient>
    </Defs>
    {/* Stem */}
    <Path
      d="M50 16 C50 24 53 28 50 35"
      stroke="#78350F"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Path
      d="M50 20 C42 16 38 18 36 22"
      stroke="#78350F"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Vine Leaves */}
    <Path
      d="M52 22 C64 16 74 20 72 32 C60 34 54 28 52 22 Z"
      fill="url(#leafGrad)"
    />
    {/* Grape Grapes cluster */}
    {/* Row 1 (Top) */}
    <Circle cx="37" cy="40" r="10" fill="url(#grapeOrb)" />
    <Circle cx="53" cy="38" r="10" fill="url(#grapeOrb)" />
    <Circle cx="67" cy="42" r="10" fill="url(#grapeOrb)" />

    {/* Row 2 (Middle) */}
    <Circle cx="32" cy="54" r="10" fill="url(#grapeOrb)" />
    <Circle cx="47" cy="52" r="10.5" fill="url(#grapeOrb)" />
    <Circle cx="62" cy="55" r="10" fill="url(#grapeOrb)" />

    {/* Row 3 */}
    <Circle cx="40" cy="68" r="9.5" fill="url(#grapeOrb)" />
    <Circle cx="55" cy="67" r="9.5" fill="url(#grapeOrb)" />

    {/* Row 4 (Bottom tip) */}
    <Circle cx="48" cy="80" r="8.5" fill="url(#grapeOrb)" />

    {/* Highlights on spheres */}
    <Circle cx="35" cy="37" r="2.5" fill="#E9D5FF" />
    <Circle cx="51" cy="35" r="2.5" fill="#E9D5FF" />
    <Circle cx="45" cy="49" r="2.8" fill="#E9D5FF" />
    <Circle cx="46" cy="77" r="2" fill="#E9D5FF" />
  </Svg>
);

/**
 * Cherry (🍒) - 10x Payout Symbol
 * Double glossy red cherries with joined green stem & leaf
 */
export const CherryIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="cherryOrb1" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#F87171" />
        <Stop offset="35%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#7F1D1D" />
      </RadialGradient>
      <RadialGradient id="cherryOrb2" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FB7185" />
        <Stop offset="35%" stopColor="#E11D48" />
        <Stop offset="100%" stopColor="#881337" />
      </RadialGradient>
      <LinearGradient id="cherryStemGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#84CC16" />
        <Stop offset="100%" stopColor="#4D7C0F" />
      </LinearGradient>
    </Defs>
    {/* Stems */}
    <Path
      d="M58 20 C54 36 40 50 36 62"
      stroke="url(#cherryStemGrad)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M58 20 C64 36 70 48 68 60"
      stroke="url(#cherryStemGrad)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Top leaf */}
    <Path
      d="M58 20 C66 14 78 16 80 24 C72 26 64 24 58 20 Z"
      fill="#65A30D"
    />
    {/* Stem Joint */}
    <Circle cx="58" cy="20" r="3.5" fill="#4D7C0F" />

    {/* Shadows */}
    <Ellipse cx="36" cy="74" rx="17" ry="16" fill="rgba(0,0,0,0.25)" />
    <Ellipse cx="68" cy="70" rx="16" ry="15" fill="rgba(0,0,0,0.25)" />

    {/* Left Cherry Body */}
    <Circle cx="35" cy="70" r="17" fill="url(#cherryOrb1)" />
    {/* Left Highlight */}
    <Ellipse cx="30" cy="65" rx="5" ry="3" transform="rotate(-30 30 65)" fill="#FFFFFF" fillOpacity="0.75" />

    {/* Right Cherry Body */}
    <Circle cx="66" cy="66" r="16" fill="url(#cherryOrb2)" />
    {/* Right Highlight */}
    <Ellipse cx="62" cy="61" rx="4.5" ry="2.8" transform="rotate(-30 62 61)" fill="#FFFFFF" fillOpacity="0.75" />
  </Svg>
);

/**
 * Slot Machine Icon for game listing card
 */
export const SlotMachineIcon = ({ size = 64 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="machineGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="50%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#92400E" />
      </LinearGradient>
      <LinearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#1E1B4B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>
    {/* Machine Cabinet */}
    <Rect x="15" y="16" width="70" height="74" rx="10" fill="url(#machineGrad)" />
    <Rect x="18" y="19" width="64" height="70" rx="8" fill="#78350F" />
    <Rect x="20" y="21" width="60" height="64" rx="6" fill="#FBBF24" />

    {/* Reel Screen Area */}
    <Rect x="24" y="32" width="52" height="34" rx="4" fill="url(#screenGrad)" />

    {/* 3 Slot Reels */}
    <Rect x="27" y="36" width="13" height="26" rx="2" fill="#FFFFFF" />
    <Rect x="43.5" y="36" width="13" height="26" rx="2" fill="#FFFFFF" />
    <Rect x="60" y="36" width="13" height="26" rx="2" fill="#FFFFFF" />

    {/* 7 7 7 Display */}
    <SvgText x="33.5" y="55" fontSize="16" fontWeight="bold" fill="#DC2626" textAnchor="middle">7</SvgText>
    <SvgText x="50" y="55" fontSize="16" fontWeight="bold" fill="#DC2626" textAnchor="middle">7</SvgText>
    <SvgText x="66.5" y="55" fontSize="16" fontWeight="bold" fill="#DC2626" textAnchor="middle">7</SvgText>

    {/* Top Marquee */}
    <Rect x="26" y="24" width="48" height="6" rx="3" fill="#EF4444" />

    {/* Lever on right */}
    <Path d="M85 45 H92 V30" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="92" cy="27" r="5" fill="#EF4444" />
  </Svg>
);

export const SLOT_SYMBOLS = [
  { id: 'seven', name: '7', multiplier: 500, icon: SevenIcon, color: '#DC2626' },
  { id: 'diamond', name: 'Diamond', multiplier: 100, icon: DiamondIcon, color: '#0284C7' },
  { id: 'watermelon', name: 'Watermelon', multiplier: 50, icon: WatermelonIcon, color: '#16A34A' },
  { id: 'grapes', name: 'Grapes', multiplier: 20, icon: GrapesIcon, color: '#9333EA' },
  { id: 'cherry', name: 'Cherry', multiplier: 10, icon: CherryIcon, color: '#E11D48' },
];

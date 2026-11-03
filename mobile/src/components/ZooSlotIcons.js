import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import {
  LionIcon,
  TigerIcon,
  PandaIcon,
  ElephantIcon,
} from './AnimalIcons';

export { LionIcon, TigerIcon, PandaIcon, ElephantIcon };

/**
 * 1. Golden Paw (WILD Symbol) - 500X Grand Multiplier
 * Golden tiger/lion paw pad with sparkling claws & WILD badge
 */
export const GoldenPawIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="pawGlow" cx="50" cy="50" r="48">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="40%" stopColor="#F59E0B" />
        <Stop offset="80%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#78350F" />
      </RadialGradient>
      <LinearGradient id="goldPad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFBEB" />
        <Stop offset="30%" stopColor="#FDE047" />
        <Stop offset="70%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
      <LinearGradient id="wildRibbon" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#DC2626" />
        <Stop offset="50%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
    </Defs>
    {/* Outer Radiant Circle */}
    <Circle cx="50" cy="46" r="44" fill="url(#pawGlow)" stroke="#FDE047" strokeWidth="2.5" />
    <Circle cx="50" cy="46" r="40" stroke="#FFFBEB" strokeWidth="1" strokeOpacity={0.6} fill="none" />

    {/* Sparkles */}
    <Polygon points="22,14 24,18 28,20 24,22 22,26 20,22 16,20 20,18" fill="#FFFFFF" />
    <Polygon points="78,16 80,20 84,22 80,24 78,28 76,24 72,22 76,20" fill="#FFFFFF" />

    {/* 4 Toe Pads */}
    {/* Toe 1 (Far Left) */}
    <Ellipse cx="28" cy="28" rx="8" ry="11" fill="url(#goldPad)" stroke="#78350F" strokeWidth="1.5" />
    <Ellipse cx="27" cy="25" rx="3.5" ry="5" fill="#FFFFFF" opacity={0.6} />

    {/* Toe 2 (Center Left) */}
    <Ellipse cx="42" cy="20" rx="8.5" ry="12" fill="url(#goldPad)" stroke="#78350F" strokeWidth="1.5" />
    <Ellipse cx="41" cy="17" rx="3.5" ry="5.5" fill="#FFFFFF" opacity={0.7} />

    {/* Toe 3 (Center Right) */}
    <Ellipse cx="58" cy="20" rx="8.5" ry="12" fill="url(#goldPad)" stroke="#78350F" strokeWidth="1.5" />
    <Ellipse cx="57" cy="17" rx="3.5" ry="5.5" fill="#FFFFFF" opacity={0.7} />

    {/* Toe 4 (Far Right) */}
    <Ellipse cx="72" cy="28" rx="8" ry="11" fill="url(#goldPad)" stroke="#78350F" strokeWidth="1.5" />
    <Ellipse cx="71" cy="25" rx="3.5" ry="5" fill="#FFFFFF" opacity={0.6} />

    {/* Main Center Palm Pad */}
    <Path
      d="M30 46 C24 54 26 66 36 70 C44 73 56 73 64 70 C74 66 76 54 70 46 C64 38 58 44 50 42 C42 44 36 38 30 46 Z"
      fill="url(#goldPad)"
      stroke="#78350F"
      strokeWidth="2"
    />
    <Ellipse cx="44" cy="54" rx="7" ry="5" fill="#FFFFFF" opacity={0.5} />

    {/* WILD Red Ribbon Badge */}
    <Rect x="18" y="74" width="64" height="18" rx="9" fill="url(#wildRibbon)" stroke="#FDE047" strokeWidth="1.5" />
    {/* Stylized WILD text bars */}
    <Path
      d="M26 80 L29 86 L32 80 L35 86 L38 80 M43 80 L43 86 M48 80 L48 86 L53 86 M58 80 L58 86 C64 86 64 80 58 80 Z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * 2. Playful Monkey (15X Multiplier)
 */
export const MonkeyIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="monkeyFur" cx="50" cy="50" r="46">
        <Stop offset="0%" stopColor="#A16207" />
        <Stop offset="75%" stopColor="#78350F" />
        <Stop offset="100%" stopColor="#451A03" />
      </RadialGradient>
      <LinearGradient id="monkeyFace" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </LinearGradient>
    </Defs>
    {/* Outer Ears */}
    <Circle cx="20" cy="46" r="14" fill="url(#monkeyFur)" stroke="#451A03" strokeWidth="1.5" />
    <Circle cx="20" cy="46" r="8" fill="#FDE68A" />
    <Circle cx="80" cy="46" r="14" fill="url(#monkeyFur)" stroke="#451A03" strokeWidth="1.5" />
    <Circle cx="80" cy="46" r="8" fill="#FDE68A" />

    {/* Head Base */}
    <Circle cx="50" cy="50" r="34" fill="url(#monkeyFur)" />

    {/* Tuft of hair on head */}
    <Path d="M47 16 C48 10 52 10 53 16" stroke="#A16207" strokeWidth="3" strokeLinecap="round" />

    {/* Face Mask (Peanut / Heart Shape) */}
    {/* Left Face Cheek */}
    <Circle cx="41" cy="48" r="16" fill="url(#monkeyFace)" />
    {/* Right Face Cheek */}
    <Circle cx="59" cy="48" r="16" fill="url(#monkeyFace)" />
    {/* Lower Chin */}
    <Circle cx="50" cy="62" r="18" fill="url(#monkeyFace)" />

    {/* Big Expressive Eyes */}
    <Ellipse cx="42" cy="46" rx="4.5" ry="6" fill="#1F2937" />
    <Circle cx="43" cy="44" r="2" fill="#FFFFFF" />
    <Ellipse cx="58" cy="46" rx="4.5" ry="6" fill="#1F2937" />
    <Circle cx="59" cy="44" r="2" fill="#FFFFFF" />

    {/* Cute Nostrils */}
    <Circle cx="47" cy="57" r="1.5" fill="#78350F" />
    <Circle cx="53" cy="57" r="1.5" fill="#78350F" />

    {/* Wide Happy Grin */}
    <Path
      d="M40 64 C44 72 56 72 60 64"
      stroke="#78350F"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Red Tongue */}
    <Path d="M47 68 C49 71 51 71 53 68 Z" fill="#EF4444" />
  </Svg>
);

/**
 * 3. Golden Bananas (8X Multiplier)
 */
export const BananaIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="bananaYellow" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="40%" stopColor="#FACC15" />
        <Stop offset="80%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#CA8A04" />
      </LinearGradient>
      <RadialGradient id="bananaGlow" cx="50" cy="50" r="46">
        <Stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
        <Stop offset="100%" stopColor="transparent" />
      </RadialGradient>
    </Defs>
    {/* Soft glow circle */}
    <Circle cx="50" cy="50" r="44" fill="url(#bananaGlow)" />

    {/* Bunch of 3 Bananas */}
    {/* Banana 1 (Left Back) */}
    <Path
      d="M32 24 C40 38 42 62 26 76 C22 74 24 64 30 52 C34 42 34 32 30 26 Z"
      fill="#CA8A04"
    />

    {/* Banana 2 (Right Back) */}
    <Path
      d="M68 24 C60 38 58 62 74 76 C78 74 76 64 70 52 C66 42 66 32 70 26 Z"
      fill="#CA8A04"
    />

    {/* Banana 3 (Center Front, Large & Curved) */}
    <Path
      d="M44 20 C54 36 56 64 34 82 C38 84 52 78 62 60 C70 44 68 28 54 18 Z"
      fill="url(#bananaYellow)"
      stroke="#A16207"
      strokeWidth="2"
    />
    {/* Highlight shine stripe on central banana */}
    <Path
      d="M48 26 C54 38 56 56 46 72"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.6}
    />

    {/* Green Top Stem */}
    <Path d="M42 22 L52 14 L56 16 L48 24 Z" fill="#15803D" stroke="#14532D" strokeWidth="1.5" />
    <Circle cx="52" cy="15" r="2" fill="#86EFAC" />

    {/* Bottom Banana Tip */}
    <Circle cx="35" cy="82" r="2.5" fill="#713F12" />
  </Svg>
);

/**
 * 4. Bamboo Frame / Wild Sign Icon
 */
export const BambooSignIcon = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Left Bamboo Pole */}
    <Rect x="16" y="10" width="12" height="80" rx="4" fill="#16A34A" stroke="#14532D" strokeWidth="2" />
    <Path d="M16 35 L28 35 M16 60 L28 60" stroke="#FDE047" strokeWidth="2" />

    {/* Right Bamboo Pole */}
    <Rect x="72" y="10" width="12" height="80" rx="4" fill="#16A34A" stroke="#14532D" strokeWidth="2" />
    <Path d="M72 35 L84 35 M72 60 L84 60" stroke="#FDE047" strokeWidth="2" />

    {/* Top Bamboo Crossbar */}
    <Rect x="8" y="20" width="84" height="12" rx="4" fill="#22C55E" stroke="#14532D" strokeWidth="2" />

    {/* Center Zoo Signboard */}
    <Rect x="24" y="32" width="52" height="34" rx="8" fill="#B45309" stroke="#FDE047" strokeWidth="2" />
    {/* "ZOO" letters */}
    <Path
      d="M32 42 L42 42 L32 54 L42 54 M47 48 A6 6 0 1 1 47 49 M60 48 A6 6 0 1 1 60 49"
      stroke="#FEF08A"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


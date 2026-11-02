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

/**
 * 1. Lion (King of Jungle) - 25x Grand Multiplier
 */
export const LionIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="lionMane" cx="50" cy="50" r="46">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="75%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#78350F" />
      </RadialGradient>
      <LinearGradient id="lionFace" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="100%" stopColor="#FBBF24" />
      </LinearGradient>
      <LinearGradient id="crownGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FDE047" />
        <Stop offset="50%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#CA8A04" />
      </LinearGradient>
    </Defs>
    {/* Mane fluff petals */}
    <Circle cx="50" cy="54" r="42" fill="url(#lionMane)" />
    {/* Mane tufts around circle */}
    <Circle cx="20" cy="35" r="14" fill="#B45309" />
    <Circle cx="80" cy="35" r="14" fill="#B45309" />
    <Circle cx="14" cy="58" r="14" fill="#B45309" />
    <Circle cx="86" cy="58" r="14" fill="#B45309" />
    <Circle cx="26" cy="80" r="14" fill="#B45309" />
    <Circle cx="74" cy="80" r="14" fill="#B45309" />
    <Circle cx="50" cy="86" r="14" fill="#B45309" />

    {/* Ears */}
    <Circle cx="30" cy="30" r="10" fill="#D97706" />
    <Circle cx="30" cy="30" r="6" fill="#FDE68A" />
    <Circle cx="70" cy="30" r="10" fill="#D97706" />
    <Circle cx="70" cy="30" r="6" fill="#FDE68A" />

    {/* Royal Crown on Top */}
    <Polygon points="36,24 42,12 50,18 58,12 64,24" fill="url(#crownGold)" stroke="#B45309" strokeWidth="1.5" />
    <Circle cx="50" cy="18" r="2" fill="#EF4444" />
    <Circle cx="42" cy="12" r="1.5" fill="#3B82F6" />
    <Circle cx="58" cy="12" r="1.5" fill="#10B981" />

    {/* Head */}
    <Circle cx="50" cy="56" r="26" fill="url(#lionFace)" />

    {/* Eyes */}
    <Ellipse cx="41" cy="50" rx="4" ry="5.5" fill="#1F2937" />
    <Circle cx="42" cy="48" r="1.8" fill="#FFFFFF" />
    <Ellipse cx="59" cy="50" rx="4" ry="5.5" fill="#1F2937" />
    <Circle cx="60" cy="48" r="1.8" fill="#FFFFFF" />

    {/* Snout & Nose */}
    <Ellipse cx="50" cy="65" rx="11" ry="8" fill="#FFFBEB" />
    <Polygon points="46,59 54,59 50,64" fill="#78350F" />
    {/* Mouth */}
    <Path d="M47 66 C48 68 50 68 50 66 C50 68 52 68 53 66" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />

    {/* Whiskers */}
    <Path d="M34 64 L24 62 M34 67 L24 68 M66 64 L76 62 M66 67 L76 68" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * 2. Tiger (Bengal Tiger) - 15x Multiplier
 */
export const TigerIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="tigerFace" cx="50" cy="50" r="44">
        <Stop offset="0%" stopColor="#FB923C" />
        <Stop offset="70%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </RadialGradient>
    </Defs>
    {/* Ears */}
    <Circle cx="26" cy="26" r="12" fill="#EA580C" />
    <Circle cx="26" cy="26" r="7" fill="#FEF3C7" />
    <Circle cx="74" cy="26" r="12" fill="#EA580C" />
    <Circle cx="74" cy="26" r="7" fill="#FEF3C7" />

    {/* Head */}
    <Circle cx="50" cy="54" r="36" fill="url(#tigerFace)" />

    {/* Tiger Forehead Stripes */}
    <Path d="M46 22 L50 32 L54 22 Z" fill="#18181B" />
    <Path d="M38 28 L44 34 L36 34 Z" fill="#18181B" />
    <Path d="M62 28 L56 34 L64 34 Z" fill="#18181B" />

    {/* Cheek Stripes */}
    <Polygon points="18,48 30,50 20,54" fill="#18181B" />
    <Polygon points="18,58 32,60 22,64" fill="#18181B" />
    <Polygon points="82,48 70,50 80,54" fill="#18181B" />
    <Polygon points="82,58 68,60 78,64" fill="#18181B" />

    {/* White Chin & Snout */}
    <Ellipse cx="50" cy="68" rx="18" ry="14" fill="#FFFFFF" />

    {/* Nose */}
    <Polygon points="44,60 56,60 50,66" fill="#F43F5E" />

    {/* Eyes */}
    <Ellipse cx="38" cy="48" rx="5" ry="6" fill="#FEF08A" stroke="#18181B" strokeWidth="1.5" />
    <Circle cx="39" cy="48" r="3" fill="#18181B" />
    <Circle cx="37" cy="46" r="1" fill="#FFFFFF" />

    <Ellipse cx="62" cy="48" rx="5" ry="6" fill="#FEF08A" stroke="#18181B" strokeWidth="1.5" />
    <Circle cx="61" cy="48" r="3" fill="#18181B" />
    <Circle cx="59" cy="46" r="1" fill="#FFFFFF" />

    {/* Mouth */}
    <Path d="M45 70 C47 73 50 73 50 70 C50 73 53 73 55 70" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * 3. Cheetah (Lightning Fast) - 10x Multiplier
 */
export const CheetahIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="cheetahFace" cx="50" cy="50" r="42">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="75%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#D97706" />
      </RadialGradient>
    </Defs>
    {/* Ears */}
    <Circle cx="28" cy="24" r="11" fill="#D97706" />
    <Circle cx="28" cy="24" r="6" fill="#FDE68A" />
    <Circle cx="72" cy="24" r="11" fill="#D97706" />
    <Circle cx="72" cy="24" r="6" fill="#FDE68A" />

    {/* Head */}
    <Circle cx="50" cy="52" r="34" fill="url(#cheetahFace)" />

    {/* Distinctive Cheetah Spots */}
    <Circle cx="38" cy="26" r="3" fill="#1E1B4B" />
    <Circle cx="50" cy="24" r="2.5" fill="#1E1B4B" />
    <Circle cx="62" cy="26" r="3" fill="#1E1B4B" />
    <Circle cx="28" cy="44" r="2.5" fill="#1E1B4B" />
    <Circle cx="72" cy="44" r="2.5" fill="#1E1B4B" />
    <Circle cx="24" cy="58" r="3" fill="#1E1B4B" />
    <Circle cx="76" cy="58" r="3" fill="#1E1B4B" />

    {/* Iconic Cheetah Tear Lines (from inner eye to mouth) */}
    <Path d="M42 48 C40 56 42 66 45 70" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <Path d="M58 48 C60 56 58 66 55 70" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />

    {/* Eyes */}
    <Ellipse cx="40" cy="46" rx="4.5" ry="5.5" fill="#F59E0B" stroke="#18181B" strokeWidth="1.5" />
    <Circle cx="40" cy="46" r="2.8" fill="#18181B" />
    <Circle cx="39" cy="44" r="1" fill="#FFFFFF" />

    <Ellipse cx="60" cy="46" rx="4.5" ry="5.5" fill="#F59E0B" stroke="#18181B" strokeWidth="1.5" />
    <Circle cx="60" cy="46" r="2.8" fill="#18181B" />
    <Circle cx="59" cy="44" r="1" fill="#FFFFFF" />

    {/* Snout & Nose */}
    <Ellipse cx="50" cy="68" rx="12" ry="10" fill="#FFFBEB" />
    <Polygon points="46,62 54,62 50,67" fill="#18181B" />
    <Path d="M47 70 C48 72 50 72 50 70 C50 72 52 72 53 70" stroke="#18181B" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/**
 * 4. Elephant (Mighty Jumbo) - 5x Multiplier
 */
export const ElephantIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="elephantSkin" cx="50" cy="50" r="44">
        <Stop offset="0%" stopColor="#93C5FD" />
        <Stop offset="70%" stopColor="#3B82F6" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </RadialGradient>
    </Defs>
    {/* Big Elephant Ears */}
    <Ellipse cx="22" cy="46" rx="18" ry="24" fill="#3B82F6" />
    <Ellipse cx="24" cy="46" rx="12" ry="16" fill="#BFDBFE" />
    <Ellipse cx="78" cy="46" rx="18" ry="24" fill="#3B82F6" />
    <Ellipse cx="76" cy="46" rx="12" ry="16" fill="#BFDBFE" />

    {/* Head */}
    <Circle cx="50" cy="48" r="28" fill="url(#elephantSkin)" />

    {/* Cute Tusks */}
    <Path d="M38 64 C34 68 32 74 38 76 C40 74 42 70 42 66 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <Path d="M62 64 C66 68 68 74 62 76 C60 74 58 70 58 66 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

    {/* Raised Trunk (Sign of Good Luck!) */}
    <Path
      d="M46 54 C46 68 44 80 50 82 C56 84 58 76 56 68 C55 60 54 54 54 54 Z"
      fill="#2563EB"
    />
    <Ellipse cx="50" cy="82" rx="4" ry="2.5" fill="#60A5FA" />

    {/* Eyes */}
    <Circle cx="40" cy="44" r="4" fill="#1E293B" />
    <Circle cx="41" cy="42.5" r="1.5" fill="#FFFFFF" />

    <Circle cx="60" cy="44" r="4" fill="#1E293B" />
    <Circle cx="61" cy="42.5" r="1.5" fill="#FFFFFF" />

    {/* Rosy Cheeks */}
    <Circle cx="34" cy="54" r="4" fill="#F43F5E" opacity="0.4" />
    <Circle cx="66" cy="54" r="4" fill="#F43F5E" opacity="0.4" />
  </Svg>
);

/**
 * 5. Panda (Bamboo Master) - 3x Multiplier
 */
export const PandaIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Black Ears */}
    <Circle cx="26" cy="24" r="12" fill="#18181B" />
    <Circle cx="74" cy="24" r="12" fill="#18181B" />

    {/* White Head */}
    <Circle cx="50" cy="52" r="34" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />

    {/* Black Eye Patches */}
    <Ellipse cx="36" cy="46" rx="9" ry="11" transform="rotate(-15 36 46)" fill="#18181B" />
    <Ellipse cx="64" cy="46" rx="9" ry="11" transform="rotate(15 64 46)" fill="#18181B" />

    {/* Cute Eyes inside patches */}
    <Circle cx="37" cy="46" r="3.5" fill="#FFFFFF" />
    <Circle cx="37" cy="46" r="2" fill="#18181B" />
    <Circle cx="36" cy="45" r="0.8" fill="#FFFFFF" />

    <Circle cx="63" cy="46" r="3.5" fill="#FFFFFF" />
    <Circle cx="63" cy="46" r="2" fill="#18181B" />
    <Circle cx="62" cy="45" r="0.8" fill="#FFFFFF" />

    {/* Cute Black Nose */}
    <Ellipse cx="50" cy="62" rx="4.5" ry="3.5" fill="#18181B" />

    {/* Mouth */}
    <Path d="M47 66 C48 68 50 68 50 66 C50 68 52 68 53 66" stroke="#18181B" strokeWidth="1.5" strokeLinecap="round" />

    {/* Rosy Cheeks */}
    <Circle cx="26" cy="58" r="4.5" fill="#FB7185" opacity="0.4" />
    <Circle cx="74" cy="58" r="4.5" fill="#FB7185" opacity="0.4" />

    {/* Bamboo Shoot Leaf at Corner */}
    <Path d="M72 70 C76 66 84 66 86 68 C84 74 78 76 72 70 Z" fill="#22C55E" />
  </Svg>
);

/**
 * 6. Rabbit (Swift Bunny) - 2x Multiplier
 */
export const RabbitIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Long Bunny Ears */}
    <Ellipse cx="36" cy="22" rx="7" ry="20" transform="rotate(-10 36 22)" fill="#FFFFFF" stroke="#FBCFE8" strokeWidth="1.5" />
    <Ellipse cx="36" cy="22" rx="4" ry="14" transform="rotate(-10 36 22)" fill="#F472B6" />

    <Ellipse cx="64" cy="22" rx="7" ry="20" transform="rotate(10 64 22)" fill="#FFFFFF" stroke="#FBCFE8" strokeWidth="1.5" />
    <Ellipse cx="64" cy="22" rx="4" ry="14" transform="rotate(10 64 22)" fill="#F472B6" />

    {/* Round Head */}
    <Circle cx="50" cy="58" r="30" fill="#FFFFFF" stroke="#FBCFE8" strokeWidth="2" />

    {/* Shiny Big Eyes */}
    <Circle cx="40" cy="52" r="5" fill="#BE185D" />
    <Circle cx="41" cy="50" r="1.8" fill="#FFFFFF" />
    <Circle cx="39" cy="54" r="0.8" fill="#FFFFFF" />

    <Circle cx="60" cy="52" r="5" fill="#BE185D" />
    <Circle cx="61" cy="50" r="1.8" fill="#FFFFFF" />
    <Circle cx="59" cy="54" r="0.8" fill="#FFFFFF" />

    {/* Cute Pink Nose */}
    <Polygon points="48,60 52,60 50,63" fill="#F43F5E" />

    {/* Cute Buck Teeth & Mouth */}
    <Path d="M47 64 C48 66 50 66 50 64 C50 66 52 66 53 64" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="48.5" y="66" width="3" height="3" rx="0.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />

    {/* Chubby Rosy Cheeks */}
    <Circle cx="30" cy="62" r="5" fill="#FB7185" opacity="0.45" />
    <Circle cx="70" cy="62" r="5" fill="#FB7185" opacity="0.45" />

    {/* Whiskers */}
    <Path d="M28 58 L18 56 M28 62 L18 63 M72 58 L82 56 M72 62 L82 63" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

/**
 * 7. Finish Line Flag 🏁
 */
export const FinishFlagIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* Flag Pole */}
    <Rect x="4" y="4" width="3" height="24" rx="1.5" fill="#94A3B8" />
    {/* Checkered Flag Grid */}
    <Rect x="7" y="4" width="5" height="5" fill="#FFFFFF" />
    <Rect x="12" y="4" width="5" height="5" fill="#18181B" />
    <Rect x="17" y="4" width="5" height="5" fill="#FFFFFF" />
    <Rect x="22" y="4" width="5" height="5" fill="#18181B" />

    <Rect x="7" y="9" width="5" height="5" fill="#18181B" />
    <Rect x="12" y="9" width="5" height="5" fill="#FFFFFF" />
    <Rect x="17" y="9" width="5" height="5" fill="#18181B" />
    <Rect x="22" y="9" width="5" height="5" fill="#FFFFFF" />

    <Rect x="7" y="14" width="5" height="5" fill="#FFFFFF" />
    <Rect x="12" y="14" width="5" height="5" fill="#18181B" />
    <Rect x="17" y="14" width="5" height="5" fill="#FFFFFF" />
    <Rect x="22" y="14" width="5" height="5" fill="#18181B" />
  </Svg>
);

/**
 * 8. Trophy Gold Icon 🏆
 */
export const TrophyGoldIcon = ({ size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Defs>
      <LinearGradient id="trophyGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
    </Defs>
    {/* Cup Body */}
    <Path d="M8 6 H24 V16 C24 20 20 23 16 23 C12 23 8 20 8 16 Z" fill="url(#trophyGrad)" stroke="#B45309" strokeWidth="1" />
    {/* Handles */}
    <Path d="M8 9 H4 C4 15 8 16 8 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <Path d="M24 9 H28 C28 15 24 16 24 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Stem & Base */}
    <Rect x="14" y="23" width="4" height="4" fill="#D97706" />
    <Rect x="10" y="27" width="12" height="3" rx="1.5" fill="#78350F" />
    {/* Star */}
    <Polygon points="16,11 17.5,14 21,14.5 18.5,17 19,20.5 16,19 13,20.5 13.5,17 11,14.5 14.5,14" fill="#FFFFFF" opacity="0.9" />
  </Svg>
);

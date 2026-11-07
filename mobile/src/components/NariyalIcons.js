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
 * 🥥 Whole Tender Green Coconut Graphic
 * Authentic tropical fresh green coconut with husk sheen and stem
 */
export function WholeGreenCoconutGraphic({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="greenCocoGrad" cx="38%" cy="32%" r="68%">
          <Stop offset="0%" stopColor="#86EFAC" />
          <Stop offset="30%" stopColor="#22C55E" />
          <Stop offset="70%" stopColor="#15803D" />
          <Stop offset="100%" stopColor="#052E16" />
        </RadialGradient>
        <LinearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
        <RadialGradient id="shineGlow" cx="30%" cy="28%" r="40%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#86EFAC" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Shadow underneath */}
      <Ellipse cx="50" cy="92" rx="36" ry="7" fill="rgba(0,0,0,0.35)" />

      {/* Main Oval Coconut Body */}
      <Path
        d="M50 14
           C75 14, 88 35, 88 56
           C88 78, 72 90, 50 90
           C28 90, 12 78, 12 56
           C12 35, 25 14, 50 14 Z"
        fill="url(#greenCocoGrad)"
        stroke="#166534"
        strokeWidth="2"
      />

      {/* Natural Husk Rib Segments */}
      <Path
        d="M50 15 Q40 54 50 89"
        fill="none"
        stroke="#166534"
        strokeWidth="1.5"
        strokeDasharray="3,2"
        opacity={0.6}
      />
      <Path
        d="M50 15 Q68 50 68 82"
        fill="none"
        stroke="#15803D"
        strokeWidth="1.2"
        opacity={0.5}
      />
      <Path
        d="M50 15 Q32 50 32 82"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="1.2"
        opacity={0.5}
      />

      {/* Gloss Specular Highlight */}
      <Ellipse cx="38" cy="36" rx="14" ry="8" transform="rotate(-25 38 36)" fill="url(#shineGlow)" />
      <Circle cx="32" cy="30" r="3" fill="#FFFFFF" opacity={0.9} />
      <Circle cx="44" cy="38" r="2" fill="#FFFFFF" opacity={0.6} />

      {/* Top Stem & Cap */}
      <Path
        d="M44 14 C44 9, 47 4, 50 4 C53 4, 56 9, 56 14 Z"
        fill="url(#stemGrad)"
        stroke="#451A03"
        strokeWidth="1"
      />
      {/* 3-Point Star Calyx at base of stem */}
      <Path
        d="M40 15 L50 11 L60 15 L55 18 L45 18 Z"
        fill="#92400E"
      />
    </Svg>
  );
}

/**
 * 💎 Cracked Golden Pearl Coconut Graphic (20X Multiplier)
 * Cracked open coconut with an intensely radiating golden pearl & coins!
 */
export function CrackedGoldenPearlCoconutGraphic({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="pearlBurstGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
          <Stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#B45309" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="goldenPearlSphere" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="30%" stopColor="#FEF08A" />
          <Stop offset="65%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#92400E" />
        </RadialGradient>
        <LinearGradient id="huskDarkBrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#78350F" />
          <Stop offset="100%" stopColor="#451A03" />
        </LinearGradient>
      </Defs>

      {/* Ambient Pearl Flare */}
      <Circle cx="50" cy="46" r="42" fill="url(#pearlBurstGlow)" />

      {/* Left Cracked Shell Half */}
      <Path
        d="M10 50 C10 74, 25 88, 44 88 L38 52 L26 44 Z"
        fill="url(#huskDarkBrown)"
        stroke="#92400E"
        strokeWidth="2"
      />
      {/* Inner White Coconut Meat layer (Left) */}
      <Path
        d="M14 52 C14 72, 26 84, 40 84 L36 54 Z"
        fill="#FEF3C7"
      />

      {/* Right Cracked Shell Half */}
      <Path
        d="M90 50 C90 74, 75 88, 56 88 L62 52 L74 44 Z"
        fill="url(#huskDarkBrown)"
        stroke="#92400E"
        strokeWidth="2"
      />
      {/* Inner White Coconut Meat layer (Right) */}
      <Path
        d="M86 52 C86 72, 74 84, 60 84 L64 54 Z"
        fill="#FEF3C7"
      />

      {/* Radiating Light Beams */}
      <Path d="M50 12 L50 28 M50 64 L50 80 M22 46 L36 46 M64 46 L78 46" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M30 26 L40 36 M60 56 L70 66 M70 26 L60 36 M40 56 L30 66" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />

      {/* Big 3D Golden Pearl */}
      <Circle cx="50" cy="46" r="18" fill="url(#goldenPearlSphere)" stroke="#FEF08A" strokeWidth="1.5" />
      <Ellipse cx="45" cy="40" rx="5" ry="3" transform="rotate(-30 45 40)" fill="#FFFFFF" opacity={0.95} />
      <Circle cx="42" cy="38" r="2.2" fill="#FFFFFF" />

      {/* Mini Gold Coins bursting */}
      <Circle cx="28" cy="36" r="5" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
      <Circle cx="72" cy="38" r="5" fill="#FACC15" stroke="#B45309" strokeWidth="1" />
      <Circle cx="50" cy="18" r="4.5" fill="#FACC15" stroke="#B45309" strokeWidth="1" />

      {/* Multiplier Ribbon */}
      <Rect x="28" y="78" width="44" height="18" rx="9" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.2" />
      <Path d="M35 78 L38 82 L35 86" stroke="#FFF" strokeWidth="1" fill="none" />
    </Svg>
  );
}

/**
 * 🥥 Cracked Creamy Malai Coconut Graphic (5X Multiplier)
 * Coconut cracked open showing rich, thick creamy white coconut malai!
 */
export function CrackedMalaiCoconutGraphic({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="malaiCreamGrad" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="60%" stopColor="#F1F5F9" />
          <Stop offset="100%" stopColor="#CBD5E1" />
        </RadialGradient>
        <LinearGradient id="huskBrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#92400E" />
          <Stop offset="100%" stopColor="#451A03" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="50" cy="90" rx="34" ry="7" fill="rgba(0,0,0,0.3)" />

      {/* Coconut Half Shell Bowl */}
      <Path
        d="M15 48
           C15 76, 32 90, 50 90
           C68 90, 85 76, 85 48
           C85 46, 15 46, 15 48 Z"
        fill="url(#huskBrown)"
        stroke="#451A03"
        strokeWidth="2"
      />

      {/* Thick White Malai Rim & Scoop */}
      <Path
        d="M20 48
           C20 72, 34 84, 50 84
           C66 84, 80 72, 80 48
           C75 44, 25 44, 20 48 Z"
        fill="url(#malaiCreamGrad)"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />

      {/* Smooth Soft Cream Swirls */}
      <Path
        d="M30 54 Q44 64 60 56 Q68 50 72 54"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <Path
        d="M36 66 Q50 74 64 68"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Gloss Shimmers */}
      <Circle cx="40" cy="52" r="2.5" fill="#FFFFFF" opacity={0.9} />
      <Circle cx="56" cy="60" r="2" fill="#FFFFFF" opacity={0.8} />

      {/* Sparkles */}
      <Path d="M26 28 L27 31 L30 32 L27 33 L26 36 L25 33 L22 32 L25 31 Z" fill="#FDE047" />
      <Path d="M74 26 L75 29 L78 30 L75 31 L74 34 L73 31 L70 30 L73 29 Z" fill="#FDE047" />

      {/* Multiplier Ribbon */}
      <Rect x="30" y="78" width="40" height="18" rx="9" fill="#EA580C" stroke="#FEF08A" strokeWidth="1.2" />
    </Svg>
  );
}

/**
 * 💦 Cracked Fresh Water Coconut Graphic (2.5X Multiplier)
 * Coconut with fresh splashing water droplets and colorful straw!
 */
export function CrackedWaterCoconutGraphic({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="waterLiquid" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#E0F2FE" />
          <Stop offset="50%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </RadialGradient>
        <LinearGradient id="strawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EF4444" />
          <Stop offset="50%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#EF4444" />
        </LinearGradient>
      </Defs>

      {/* Coconut Body */}
      <Path
        d="M18 46
           C18 74, 33 88, 50 88
           C67 88, 82 74, 82 46
           C82 44, 18 44, 18 46 Z"
        fill="#15803D"
        stroke="#166534"
        strokeWidth="2"
      />

      {/* Clear Water Surface Inside */}
      <Ellipse cx="50" cy="46" rx="30" ry="12" fill="url(#waterLiquid)" stroke="#BAE6FD" strokeWidth="1.5" />

      {/* Water Ripples */}
      <Ellipse cx="48" cy="46" rx="16" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity={0.7} />

      {/* Red & White Drinking Straw */}
      <Path
        d="M60 48 L76 16 L84 18 L66 52 Z"
        fill="url(#strawGrad)"
        stroke="#B91C1C"
        strokeWidth="0.8"
      />

      {/* Splashing Water Droplets */}
      <Circle cx="32" cy="24" r="3.5" fill="#38BDF8" />
      <Circle cx="44" cy="18" r="4.5" fill="#38BDF8" />
      <Circle cx="58" cy="22" r="3" fill="#38BDF8" />
      <Circle cx="24" cy="34" r="2.5" fill="#BAE6FD" />

      {/* Multiplier Ribbon */}
      <Rect x="28" y="78" width="44" height="18" rx="9" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.2" />
    </Svg>
  );
}

/**
 * 🍂 Dry Shell Coconut Graphic (0X Ash)
 * Dry empty cracked husk
 */
export function DryHuskCoconutGraphic({ size = 80 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="dryHusk" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#57534E" />
          <Stop offset="100%" stopColor="#292524" />
        </LinearGradient>
      </Defs>
      {/* Broken dry shell */}
      <Path
        d="M20 50 C20 74, 34 86, 50 86 C66 86, 80 74, 80 50 L68 52 L58 48 L46 54 L34 48 Z"
        fill="url(#dryHusk)"
        stroke="#1C1917"
        strokeWidth="1.8"
      />
      <Path
        d="M26 54 Q36 68 48 60 Q60 54 72 58"
        stroke="#44403C"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Multiplier Ribbon */}
      <Rect x="30" y="76" width="40" height="18" rx="9" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
    </Svg>
  );
}

/**
 * 🔨 Heavy Coconut Chopper / Mallet Graphic
 */
export function HeavyCoconutChopperGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="chopperSteel" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F8FAFC" />
          <Stop offset="50%" stopColor="#94A3B8" />
          <Stop offset="100%" stopColor="#475569" />
        </LinearGradient>
        <LinearGradient id="chopperWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
      </Defs>

      {/* Wooden Handle */}
      <Rect
        x="6"
        y="42"
        width="26"
        height="8"
        rx="3"
        transform="rotate(-35 6 42)"
        fill="url(#chopperWood)"
        stroke="#451A03"
        strokeWidth="1"
      />

      {/* Heavy Steel Blade / Head */}
      <Path
        d="M24 16 L48 8 L54 26 L30 34 Z"
        fill="url(#chopperSteel)"
        stroke="#334155"
        strokeWidth="1.5"
      />
      {/* Blade bevel reflection */}
      <Path d="M26 18 L46 12 L50 24 L32 28 Z" fill="#FFFFFF" opacity={0.4} />

      {/* Impact Sparkle */}
      <Circle cx="50" cy="12" r="2.5" fill="#FEF08A" />
    </Svg>
  );
}

/**
 * 🥥 Nariyal Phodo Modern Square Game Tile Icon for GamesListModal
 */
export function NariyalTileIcon({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="nariyalTileGlow" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#052E16" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="tileCocoGrad" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#86EFAC" />
          <Stop offset="40%" stopColor="#22C55E" />
          <Stop offset="80%" stopColor="#15803D" />
          <Stop offset="100%" stopColor="#052E16" />
        </RadialGradient>
        <RadialGradient id="pearlGold" cx="35%" cy="30%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="40%" stopColor="#FDE047" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
      </Defs>

      {/* Ambient Tropical Glow */}
      <Circle cx="32" cy="32" r="28" fill="url(#nariyalTileGlow)" />

      {/* Main Coconut Silhouette */}
      <Path
        d="M32 10
           C48 10, 56 24, 56 38
           C56 52, 46 60, 32 60
           C18 60, 8 52, 8 38
           C8 24, 16 10, 32 10 Z"
        fill="url(#tileCocoGrad)"
        stroke="#166534"
        strokeWidth="1.2"
      />

      {/* Coconut Shell Crack */}
      <Path
        d="M32 12 Q28 26 34 38 Q30 48 32 58"
        stroke="#BAE6FD"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Shining 20X Golden Pearl in center */}
      <Circle cx="34" cy="36" r="9" fill="url(#pearlGold)" stroke="#FEF08A" strokeWidth="1" />
      <Ellipse cx="31.5" cy="33" rx="2.5" ry="1.4" fill="#FFFFFF" opacity={0.9} />

      {/* Splashing fresh water droplets */}
      <Circle cx="16" cy="20" r="2.5" fill="#38BDF8" />
      <Circle cx="48" cy="18" r="3" fill="#38BDF8" />
      <Circle cx="50" cy="46" r="2.2" fill="#BAE6FD" />
      <Circle cx="14" cy="44" r="2" fill="#38BDF8" />

      {/* Golden Sparkles */}
      <Path d="M46 10 L47 13 L50 14 L47 15 L46 18 L45 15 L42 14 L45 13 Z" fill="#FEF08A" />
      <Path d="M18 16 L18.7 18 L21 18.7 L18.7 19.4 L18 21.5 L17.3 19.4 L15 18.7 L17.3 18 Z" fill="#FDE047" />
    </Svg>
  );
}


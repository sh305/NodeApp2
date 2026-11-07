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
 * 🧜‍♀️ 30X Golden Mermaid Graphic (Grand Ocean Jackpot)
 */
export function GoldenMermaidGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="mermaidAura" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
          <Stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#B45309" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="mermaidTail" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
        <LinearGradient id="mermaidSkin" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FEF3C7" />
          <Stop offset="100%" stopColor="#FDE68A" />
        </LinearGradient>
      </Defs>

      {/* Outer Halo */}
      <Circle cx="50" cy="50" r="46" fill="url(#mermaidAura)" />

      {/* Flowing Golden Hair */}
      <Path
        d="M32 28 C24 40, 26 56, 36 66 C32 54, 34 38, 42 26 Z"
        fill="#F59E0B"
      />
      <Path
        d="M62 26 C72 38, 70 54, 60 66 C66 54, 64 38, 56 26 Z"
        fill="#D97706"
      />

      {/* Head / Torso */}
      <Circle cx="50" cy="28" r="12" fill="url(#mermaidSkin)" stroke="#F59E0B" strokeWidth="1" />
      {/* Crown */}
      <Path d="M42 20 L46 14 L50 18 L54 14 L58 20 Z" fill="#FDE047" stroke="#B45309" strokeWidth="0.8" />

      {/* Gentle Smiling Eyes */}
      <Circle cx="46" cy="27" r="1.5" fill="#451A03" />
      <Circle cx="54" cy="27" r="1.5" fill="#451A03" />
      <Path d="M48 33 Q50 35 52 33" stroke="#B45309" strokeWidth="1" fill="none" />

      {/* Torso */}
      <Path
        d="M44 38 L42 50 C44 54, 56 54, 58 50 L56 38 Z"
        fill="url(#mermaidSkin)"
      />

      {/* Golden Scaled Mermaid Tail */}
      <Path
        d="M42 50
           C42 66, 62 68, 58 80
           C56 86, 50 90, 50 92
           C50 90, 44 86, 42 80
           C38 68, 58 66, 58 50 Z"
        fill="url(#mermaidTail)"
        stroke="#FEF08A"
        strokeWidth="1.5"
      />

      {/* Double Fin Tail Flukes */}
      <Path
        d="M50 90
           C38 88, 28 94, 30 100
           C38 98, 48 94, 50 90 Z"
        fill="#FDE047"
      />
      <Path
        d="M50 90
           C62 88, 72 94, 70 100
           C62 98, 52 94, 50 90 Z"
        fill="#FDE047"
      />

      {/* Star Sparkles */}
      <Path d="M22 18 L23 21 L26 22 L23 23 L22 26 L21 23 L18 22 L21 21 Z" fill="#FEF08A" />
      <Path d="M78 18 L79 21 L82 22 L79 23 L78 26 L77 23 L74 22 L77 21 Z" fill="#FEF08A" />
      <Circle cx="80" cy="50" r="2.5" fill="#FDE047" />
      <Circle cx="20" cy="54" r="2.5" fill="#FDE047" />
    </Svg>
  );
}

/**
 * 🦈 12X Great White Shark Graphic
 */
export function GreatWhiteSharkGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sharkBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0891B2" />
          <Stop offset="50%" stopColor="#06B6D4" />
          <Stop offset="100%" stopColor="#E0F2FE" />
        </LinearGradient>
      </Defs>

      {/* Streamlined Shark Torso */}
      <Path
        d="M10 52
           C26 38, 64 34, 88 50
           C64 64, 28 66, 10 52 Z"
        fill="url(#sharkBody)"
        stroke="#0E7490"
        strokeWidth="1.5"
      />

      {/* Dorsal Fin */}
      <Path
        d="M46 36 L56 16 L66 35 Z"
        fill="#0891B2"
        stroke="#0E7490"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Pectoral Fin */}
      <Path
        d="M48 58 L38 78 L54 62 Z"
        fill="#0891B2"
      />

      {/* Tail Fin */}
      <Path
        d="M12 52 L2 34 L8 50 L2 68 Z"
        fill="#0891B2"
        stroke="#0E7490"
        strokeWidth="1"
      />

      {/* White Belly */}
      <Path
        d="M26 56 C44 64, 70 60, 84 52 C70 54, 44 54, 26 56 Z"
        fill="#FFFFFF"
        opacity={0.9}
      />

      {/* Fierce Eye & Gills */}
      <Circle cx="76" cy="46" r="3" fill="#042F2E" />
      <Circle cx="75" cy="45" r="1" fill="#FFFFFF" />

      {/* Gills */}
      <Path d="M62 48 L60 56 M58 48 L56 56 M54 48 L52 56" stroke="#164E63" strokeWidth="1.2" />

      {/* Teeth / Snout */}
      <Path d="M86 51 L82 54 L84 55 L80 57" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 🐙 5X Giant Kraken Octopus Graphic
 */
export function GiantKrakenGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="krakenHead" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#C084FC" />
          <Stop offset="60%" stopColor="#9333EA" />
          <Stop offset="100%" stopColor="#581C87" />
        </RadialGradient>
      </Defs>

      {/* Big Bulbous Head */}
      <Path
        d="M26 44
           C26 22, 74 22, 74 44
           C74 54, 64 62, 50 62
           C36 62, 26 54, 26 44 Z"
        fill="url(#krakenHead)"
        stroke="#7E22CE"
        strokeWidth="2"
      />

      {/* Wavy Tentacles */}
      <Path
        d="M32 58 Q18 74 14 90 Q22 92 26 80 Q32 68 36 60"
        fill="#9333EA"
        stroke="#6B21A8"
        strokeWidth="1.5"
      />
      <Path
        d="M42 60 Q34 76 32 94 Q40 92 42 78 Q44 68 46 60"
        fill="#A855F7"
        stroke="#6B21A8"
        strokeWidth="1.5"
      />
      <Path
        d="M58 60 Q66 76 68 94 Q60 92 58 78 Q56 68 54 60"
        fill="#A855F7"
        stroke="#6B21A8"
        strokeWidth="1.5"
      />
      <Path
        d="M68 58 Q82 74 86 90 Q78 92 74 80 Q68 68 64 60"
        fill="#9333EA"
        stroke="#6B21A8"
        strokeWidth="1.5"
      />

      {/* Cute Suction Cups */}
      <Circle cx="18" cy="84" r="2.2" fill="#F3E8FF" />
      <Circle cx="35" cy="86" r="2.2" fill="#F3E8FF" />
      <Circle cx="65" cy="86" r="2.2" fill="#F3E8FF" />
      <Circle cx="82" cy="84" r="2.2" fill="#F3E8FF" />

      {/* Big Mysterious Yellow Eyes */}
      <Ellipse cx="38" cy="46" rx="5" ry="6" fill="#FEF08A" stroke="#7E22CE" strokeWidth="1" />
      <Circle cx="39" cy="46" r="2.5" fill="#3B0764" />
      <Circle cx="37" cy="44" r="1.2" fill="#FFFFFF" />

      <Ellipse cx="62" cy="46" rx="5" ry="6" fill="#FEF08A" stroke="#7E22CE" strokeWidth="1" />
      <Circle cx="61" cy="46" r="2.5" fill="#3B0764" />
      <Circle cx="63" cy="44" r="1.2" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 🐡 2.5X Spiky Pufferfish Graphic
 */
export function SpikyPufferfishGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="pufferGrad" cx="38%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#6EE7B7" />
          <Stop offset="50%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </RadialGradient>
      </Defs>

      {/* Spikes Around Body */}
      {/* Top spikes */}
      <Path d="M40 22 L45 10 L50 22 M55 22 L60 10 L65 24 M28 32 L18 24 L30 36 M72 32 L82 24 L70 36" stroke="#047857" strokeWidth="2.5" fill="#34D399" />
      {/* Bottom spikes */}
      <Path d="M40 76 L45 88 L50 76 M55 76 L60 88 L65 74 M28 66 L18 74 L30 62 M72 66 L82 74 L70 62" stroke="#047857" strokeWidth="2.5" fill="#34D399" />

      {/* Round Ball Body */}
      <Circle cx="50" cy="50" r="30" fill="url(#pufferGrad)" stroke="#065F46" strokeWidth="2" />

      {/* Little Tail */}
      <Path d="M20 50 L8 40 L12 50 L8 60 Z" fill="#10B981" stroke="#065F46" strokeWidth="1.2" />

      {/* Pectoral Fin */}
      <Path d="M40 54 Q34 62 44 64" fill="#34D399" stroke="#065F46" strokeWidth="1.5" />

      {/* Cute Big Eyes */}
      <Circle cx="64" cy="42" r="7" fill="#FFFFFF" stroke="#065F46" strokeWidth="1.2" />
      <Circle cx="65" cy="42" r="3.5" fill="#064E3B" />
      <Circle cx="63" cy="40" r="1.5" fill="#FFFFFF" />

      {/* Puffy Lips */}
      <Ellipse cx="78" cy="52" rx="4" ry="3" fill="#F472B6" stroke="#BE185D" strokeWidth="1" />
    </Svg>
  );
}

/**
 * 🦀 0.6X Golden Beach Crab Graphic
 */
export function GoldenCrabGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="crabGrad" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#FB7185" />
          <Stop offset="60%" stopColor="#E11D48" />
          <Stop offset="100%" stopColor="#9F1239" />
        </RadialGradient>
      </Defs>

      {/* Legs Left */}
      <Path d="M30 52 Q18 48 10 56 M30 58 Q16 60 12 70 M30 64 Q20 72 16 82" stroke="#BE123C" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Legs Right */}
      <Path d="M70 52 Q82 48 90 56 M70 58 Q84 60 88 70 M70 64 Q80 72 84 82" stroke="#BE123C" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Claws Left */}
      <Path d="M26 40 Q16 28 20 18 Q28 24 28 32" stroke="#9F1239" strokeWidth="3.5" fill="#E11D48" />
      {/* Claws Right */}
      <Path d="M74 40 Q84 28 80 18 Q72 24 72 32" stroke="#9F1239" strokeWidth="3.5" fill="#E11D48" />

      {/* Crab Shell Body */}
      <Ellipse cx="50" cy="58" rx="24" ry="18" fill="url(#crabGrad)" stroke="#881337" strokeWidth="2" />

      {/* Eye Stalks */}
      <Path d="M42 42 L40 32 M58 42 L60 32" stroke="#BE123C" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="40" cy="30" r="4.5" fill="#FFFFFF" stroke="#881337" strokeWidth="1" />
      <Circle cx="40" cy="30" r="2" fill="#000000" />
      <Circle cx="60" cy="30" r="4.5" fill="#FFFFFF" stroke="#881337" strokeWidth="1" />
      <Circle cx="60" cy="30" r="2" fill="#000000" />

      {/* Smile */}
      <Path d="M44 64 Q50 70 56 64" stroke="#FFE4E6" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 🔱 High-Tech Golden Laser Harpoon Gun Graphic
 */
export function GoldenLaserHarpoonGraphic({ size = 70 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="harpoonGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFBEB" />
          <Stop offset="40%" stopColor="#FDE047" />
          <Stop offset="80%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
        <LinearGradient id="harpoonLaser" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" />
          <Stop offset="100%" stopColor="#0284C7" />
        </LinearGradient>
      </Defs>

      {/* Harpoon Base / Gun Turret */}
      <Path
        d="M34 88 L42 60 L58 60 L66 88 Z"
        fill="url(#harpoonGold)"
        stroke="#78350F"
        strokeWidth="1.5"
      />

      {/* Spear Barrel */}
      <Rect x="46" y="24" width="8" height="42" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />

      {/* Golden Trident Spearhead */}
      <Path
        d="M50 4
           L44 24 L48 22 L48 30 L52 30 L52 22 L56 24 Z"
        fill="url(#harpoonGold)"
        stroke="#FEF08A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Side Barbs */}
      <Path d="M38 18 L46 22 M62 18 L54 22" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />

      {/* Laser Glow Rings */}
      <Ellipse cx="50" cy="38" rx="8" ry="3" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
      <Ellipse cx="50" cy="48" rx="7" ry="2.5" fill="none" stroke="#38BDF8" strokeWidth="1.5" />

      {/* Coiled Rope / Cable */}
      <Path d="M46 70 Q40 76 46 82 Q54 86 52 74" stroke="#FDE047" strokeWidth="2" fill="none" />
    </Svg>
  );
}

/**
 * 🎣 Golden Harpoon Modern Square Game Tile Icon for GamesListModal
 */
export function HarpoonTileIcon({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="harpoonTileGlow" cx="50%" cy="45%" r="50%">
          <Stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#082F49" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="tileTrident" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="50%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>

      {/* Ocean Ambient Glow */}
      <Circle cx="32" cy="32" r="28" fill="url(#harpoonTileGlow)" />

      {/* Ocean Swirl Wave */}
      <Path
        d="M12 48 Q24 38 36 44 T60 38"
        stroke="#38BDF8"
        strokeWidth="2"
        fill="none"
        opacity={0.6}
      />

      {/* Golden Trident Harpoon Spear */}
      <Path
        d="M32 8 L24 24 L28 22 L28 44 L36 44 L36 22 L40 24 Z"
        fill="url(#tileTrident)"
        stroke="#FEF08A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Spear shaft */}
      <Rect x="30.5" y="42" width="3" height="16" rx="1.5" fill="#FDE047" />

      {/* Little Swimming Fish Silhouette */}
      <Path
        d="M48 20 C54 16, 58 24, 52 26 L56 30 L52 28 Z"
        fill="#38BDF8"
        opacity={0.8}
      />
      <Path
        d="M16 26 C12 28, 8 22, 14 20 L10 16 L14 18 Z"
        fill="#34D399"
        opacity={0.8}
      />

      {/* Air Bubbles */}
      <Circle cx="24" cy="18" r="2" fill="#BAE6FD" opacity={0.8} />
      <Circle cx="44" cy="36" r="2.5" fill="#BAE6FD" opacity={0.7} />
      <Circle cx="20" cy="40" r="1.5" fill="#BAE6FD" opacity={0.8} />

      {/* Sparkles */}
      <Path d="M48 8 L49 11 L52 12 L49 13 L48 16 L47 13 L44 12 L47 11 Z" fill="#FEF08A" />
    </Svg>
  );
}


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
 * 🍬 Jelly Bean (Pink Sweet Candy - 2X)
 */
export function JellyBeanGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="jellyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F472B6" />
          <Stop offset="40%" stopColor="#EC4899" />
          <Stop offset="100%" stopColor="#BE185D" />
        </LinearGradient>
        <RadialGradient id="jellyShine" cx="30%" cy="30%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <Stop offset="50%" stopColor="#FBCFE8" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Kidney/Bean Contour */}
      <Path
        d="M20 16 
           C28 12, 45 15, 48 24
           C52 32, 48 46, 38 50
           C26 54, 12 46, 12 34
           C12 24, 15 18, 20 16 Z"
        fill="url(#jellyGrad)"
        stroke="#9D174D"
        strokeWidth="1.5"
      />

      {/* Internal Gloss Highlight */}
      <Ellipse
        cx="28"
        cy="22"
        rx="10"
        ry="5"
        transform="rotate(-20 28 22)"
        fill="url(#jellyShine)"
      />
      {/* Small bright specular reflection dot */}
      <Circle cx="24" cy="20" r="2.2" fill="#FFFFFF" opacity={0.9} />
      <Circle cx="34" cy="26" r="1.5" fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

/**
 * 🐻 Gummy Bear (Translucent Orange Bear - 3X)
 */
export function GummyBearGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="bearGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FDBA74" />
          <Stop offset="40%" stopColor="#FB923C" />
          <Stop offset="100%" stopColor="#EA580C" />
        </LinearGradient>
      </Defs>

      {/* Ears */}
      <Circle cx="19" cy="17" r="6" fill="#F97316" stroke="#C2410C" strokeWidth="1" />
      <Circle cx="19" cy="17" r="3" fill="#FED7AA" />
      <Circle cx="41" cy="17" r="6" fill="#F97316" stroke="#C2410C" strokeWidth="1" />
      <Circle cx="41" cy="17" r="3" fill="#FED7AA" />

      {/* Head */}
      <Ellipse cx="30" cy="24" rx="14" ry="12" fill="url(#bearGrad)" stroke="#C2410C" strokeWidth="1.2" />

      {/* Eyes & Snout */}
      <Circle cx="25" cy="22" r="1.8" fill="#431407" />
      <Circle cx="35" cy="22" r="1.8" fill="#431407" />
      <Ellipse cx="30" cy="26.5" rx="4.5" ry="3.5" fill="#FED7AA" />
      <Ellipse cx="30" cy="25.5" rx="2" ry="1.2" fill="#431407" />

      {/* Body */}
      <Path
        d="M20 32 C16 38, 17 48, 22 52 C26 55, 34 55, 38 52 C43 48, 44 38, 40 32 Z"
        fill="url(#bearGrad)"
        stroke="#C2410C"
        strokeWidth="1.2"
      />

      {/* Belly Highlight */}
      <Ellipse cx="30" cy="42" rx="7" ry="6" fill="#FED7AA" opacity={0.4} />

      {/* Arms & Legs */}
      <Circle cx="15" cy="38" r="4.5" fill="#FB923C" />
      <Circle cx="45" cy="38" r="4.5" fill="#FB923C" />
      <Circle cx="23" cy="51" r="5" fill="#EA580C" />
      <Circle cx="37" cy="51" r="5" fill="#EA580C" />

      {/* Specular Shine */}
      <Path d="M22 20 C24 16, 28 16, 30 18" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

/**
 * 🍇 Grape Gummy Gem (Purple Faceted Sweet - 5X)
 */
export function GrapeGummyGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="grapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E9D5FF" />
          <Stop offset="30%" stopColor="#C084FC" />
          <Stop offset="70%" stopColor="#9333EA" />
          <Stop offset="100%" stopColor="#581C87" />
        </LinearGradient>
      </Defs>

      {/* Diamond / Gem Polygon */}
      <Path
        d="M30 10 L48 22 L40 50 L20 50 L12 22 Z"
        fill="url(#grapeGrad)"
        stroke="#3B0764"
        strokeWidth="1.5"
      />

      {/* Internal Facet Lines */}
      <Path d="M30 10 L30 35 L48 22" stroke="#FFFFFF" strokeWidth="1" opacity={0.6} />
      <Path d="M30 35 L12 22" stroke="#FFFFFF" strokeWidth="1" opacity={0.6} />
      <Path d="M30 35 L20 50" stroke="#FFFFFF" strokeWidth="1" opacity={0.5} />
      <Path d="M30 35 L40 50" stroke="#FFFFFF" strokeWidth="1" opacity={0.5} />

      {/* Top Facet Glow */}
      <Path d="M30 12 L44 22 L30 32 L16 22 Z" fill="#F3E8FF" opacity={0.4} />

      {/* Star Sparkle */}
      <Path
        d="M30 18 L31.5 21 L35 22 L31.5 23 L30 26 L28.5 23 L25 22 L28.5 21 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/**
 * 🍩 Donut Sprinkles (Chocolate Glaze & Rainbow - 8X)
 */
export function SprinkleDonutGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="doughGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FDE68A" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
        <LinearGradient id="glazeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F472B6" />
          <Stop offset="50%" stopColor="#EC4899" />
          <Stop offset="100%" stopColor="#DB2777" />
        </LinearGradient>
      </Defs>

      {/* Donut Dough Base */}
      <Circle cx="30" cy="30" r="22" fill="url(#doughGrad)" stroke="#B45309" strokeWidth="1.2" />

      {/* Pink Strawberry/Chocolate Wavy Glaze */}
      <Path
        d="M30 10 
           C38 9, 48 16, 50 25
           C52 35, 48 46, 38 49
           C28 52, 14 48, 10 38
           C7 28, 14 14, 24 10
           C26 12, 28 12, 30 10 Z"
        fill="url(#glazeGrad)"
      />

      {/* Donut Center Hole */}
      <Circle cx="30" cy="30" r="8" fill="#180620" stroke="#B45309" strokeWidth="1" />

      {/* Colorful Sprinkles */}
      <Rect x="20" y="16" width="5" height="2" rx="1" fill="#FEF08A" transform="rotate(30 20 16)" />
      <Rect x="36" y="16" width="5" height="2" rx="1" fill="#38BDF8" transform="rotate(-25 36 16)" />
      <Rect x="42" y="28" width="5" height="2" rx="1" fill="#4ADE80" transform="rotate(45 42 28)" />
      <Rect x="38" y="40" width="5" height="2" rx="1" fill="#FACC15" transform="rotate(-15 38 40)" />
      <Rect x="22" y="42" width="5" height="2" rx="1" fill="#FFFFFF" transform="rotate(60 22 42)" />
      <Rect x="14" y="28" width="5" height="2" rx="1" fill="#C084FC" transform="rotate(-40 14 28)" />

      {/* Glaze Shine */}
      <Path d="M22 13 C26 11, 34 11, 38 13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
    </Svg>
  );
}

/**
 * 🍭 Swirl Lollipop (Rainbow Carnival Lollipop - 15X)
 */
export function SwirlLollipopGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="stickGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#E2E8F0" />
          <Stop offset="50%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#CBD5E1" />
        </LinearGradient>
      </Defs>

      {/* White Plastic Stick */}
      <Rect x="28" y="32" width="4" height="24" rx="2" fill="url(#stickGrad)" stroke="#94A3B8" strokeWidth="0.8" />

      {/* Outer Candy Disk */}
      <Circle cx="30" cy="22" r="17" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.2" />

      {/* Spiral Swirl Bands */}
      <Path
        d="M30 22 
           M30 6 C38 6, 46 14, 46 22 C46 30, 38 38, 30 38 C22 38, 14 30, 14 22 C14 14, 22 6, 30 6"
        fill="none"
        stroke="#FEF08A"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <Path
        d="M30 11 C36 11, 41 16, 41 22 C41 28, 36 33, 30 33 C24 33, 19 28, 19 22 C19 16, 24 11, 30 11"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2.8"
      />
      <Path
        d="M30 16 C33 16, 36 19, 36 22 C36 25, 33 28, 30 28 C27 28, 24 25, 24 22 Z"
        fill="#A855F7"
      />

      {/* Center Swirl Core */}
      <Circle cx="30" cy="22" r="3" fill="#FFFFFF" />

      {/* Gloss reflection arc */}
      <Path d="M19 15 C22 10, 28 8, 34 9" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity={0.75} />
    </Svg>
  );
}

/**
 * 💣 Golden Sugar Bomb (30X Grand Sweet Jackpot!)
 */
export function GoldenSugarBombGraphic({ size = 50 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Defs>
        <RadialGradient id="goldBombGrad" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#FACC15" />
          <Stop offset="75%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#713F12" />
        </RadialGradient>
        <LinearGradient id="fuseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#94A3B8" />
          <Stop offset="100%" stopColor="#475569" />
        </LinearGradient>
      </Defs>

      {/* Fuse Neck Collar */}
      <Rect x="26" y="10" width="8" height="5" rx="2" fill="#713F12" />

      {/* Burning Fuse Cord */}
      <Path
        d="M30 10 C30 5, 36 6, 38 2"
        fill="none"
        stroke="url(#fuseGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Spark Star at Fuse Tip */}
      <Path
        d="M38 2 L40 0 L42 2 L44 0 L42 4 L44 6 L40 4 L38 6 Z"
        fill="#EF4444"
      />
      <Circle cx="40" cy="2" r="1.8" fill="#FACC15" />

      {/* Golden Bomb Sphere */}
      <Circle cx="30" cy="33" r="18" fill="url(#goldBombGrad)" stroke="#CA8A04" strokeWidth="1.5" />

      {/* Multiplier Badge 30X on Center */}
      <Rect x="20" y="27" width="20" height="12" rx="4" fill="#991B1B" stroke="#FDE047" strokeWidth="1" />
      <Path
        d="M23 31 H26 M23 33 H26 M23 35 H25 M32 31 L36 35 M36 31 L32 35"
        stroke="#FEF08A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Specular Shine Reflection */}
      <Ellipse cx="24" cy="24" rx="4" ry="2.2" transform="rotate(-30 24 24)" fill="#FFFFFF" opacity={0.85} />
      <Circle cx="21" cy="22" r="1.5" fill="#FFFFFF" opacity={0.9} />
    </Svg>
  );
}

/**
 * Universal Candy Symbol Renderer by ID
 */
export function CandySymbolRenderer({ id, size = 50 }) {
  switch (id) {
    case 'jelly_bean':
      return <JellyBeanGraphic size={size} />;
    case 'gummy_bear':
      return <GummyBearGraphic size={size} />;
    case 'grape_gummy':
      return <GrapeGummyGraphic size={size} />;
    case 'donut':
      return <SprinkleDonutGraphic size={size} />;
    case 'lollipop':
      return <SwirlLollipopGraphic size={size} />;
    case 'bomb':
      return <GoldenSugarBombGraphic size={size} />;
    default:
      return <SwirlLollipopGraphic size={size} />;
  }
}

/**
 * Candy Bonanza Modern Square Game Tile Icon for GamesListModal
 */
export function CandyBonanzaTileIcon({ size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="candyTileGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#F472B6" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#831843" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="tileLollipop" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F43F5E" />
          <Stop offset="50%" stopColor="#EC4899" />
          <Stop offset="100%" stopColor="#8B5CF6" />
        </LinearGradient>
      </Defs>

      {/* Background Soft Glow */}
      <Circle cx="32" cy="32" r="28" fill="url(#candyTileGlow)" />

      {/* Big Lollipop Stick */}
      <Rect x="30" y="32" width="4" height="24" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />

      {/* Swirl Lollipop Body */}
      <Circle cx="32" cy="24" r="18" fill="url(#tileLollipop)" stroke="#FDE047" strokeWidth="1.5" />

      {/* Swirl Ring */}
      <Path
        d="M32 9 C40 9, 47 16, 47 24 C47 32, 40 39, 32 39 C24 39, 17 32, 17 24"
        fill="none"
        stroke="#FEF08A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M32 14 C38 14, 42 19, 42 24 C42 29, 38 34, 32 34"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2.5"
      />
      <Circle cx="32" cy="24" r="4" fill="#FFFFFF" />

      {/* Floating mini candy sparkles */}
      <Circle cx="12" cy="18" r="2.5" fill="#F472B6" />
      <Circle cx="50" cy="16" r="3" fill="#FACC15" />
      <Circle cx="48" cy="46" r="2.2" fill="#4ADE80" />
      <Circle cx="14" cy="44" r="2" fill="#38BDF8" />

      {/* Star Shine */}
      <Path d="M48 10 L49 13 L52 14 L49 15 L48 18 L47 15 L44 14 L47 13 Z" fill="#FEF08A" />
    </Svg>
  );
}


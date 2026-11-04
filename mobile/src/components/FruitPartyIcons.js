import React from 'react';
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
 * 1. Lucky Cherry Icon (🍒)
 */
export function CherryIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="cherryGlow1" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FF4D6D" />
          <Stop offset="70%" stopColor="#C9184A" />
          <Stop offset="100%" stopColor="#590D22" />
        </RadialGradient>
        <RadialGradient id="cherryGlow2" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FF758F" />
          <Stop offset="70%" stopColor="#A4133C" />
          <Stop offset="100%" stopColor="#4A0519" />
        </RadialGradient>
        <LinearGradient id="cherryStem" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#4ADE80" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
      </Defs>

      {/* Stems */}
      <Path
        d="M20 42 C20 22, 38 12, 44 8"
        stroke="url(#cherryStem)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M44 46 C44 26, 42 16, 44 8"
        stroke="url(#cherryStem)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stem Leaf */}
      <Path
        d="M44 8 C52 4, 58 10, 52 16 C46 16, 44 12, 44 8 Z"
        fill="#22C55E"
      />
      <Path
        d="M44 8 Q50 12 52 16"
        stroke="#15803D"
        strokeWidth="1"
        fill="none"
      />

      {/* Left Cherry */}
      <Circle cx="22" cy="45" r="14" fill="url(#cherryGlow1)" />
      <Ellipse cx="17" cy="40" rx="4" ry="2.5" fill="#FFF" opacity={0.65} transform="rotate(-30 17 40)" />

      {/* Right Cherry */}
      <Circle cx="44" cy="48" r="13" fill="url(#cherryGlow2)" />
      <Ellipse cx="40" cy="43" rx="3.5" ry="2" fill="#FFF" opacity={0.65} transform="rotate(-30 40 43)" />
    </Svg>
  );
}

/**
 * 2. Juicy Orange Icon (🍊)
 */
export function OrangeIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="orangeGlow" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FED7AA" />
          <Stop offset="30%" stopColor="#FB923C" />
          <Stop offset="85%" stopColor="#EA580C" />
          <Stop offset="100%" stopColor="#9A3412" />
        </RadialGradient>
        <LinearGradient id="orangeLeaf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#86EFAC" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
      </Defs>

      {/* Top Leaf */}
      <Path
        d="M32 14 C26 6, 42 4, 46 12 C44 16, 36 16, 32 14 Z"
        fill="url(#orangeLeaf)"
      />
      {/* Top Stem */}
      <Rect x="30.5" y="10" width="3" height="7" rx="1.5" fill="#78350F" />

      {/* Main Orange Body */}
      <Circle cx="32" cy="38" r="22" fill="url(#orangeGlow)" />

      {/* Texture Pores / Dimples */}
      <Circle cx="24" cy="32" r="1" fill="#C2410C" opacity={0.5} />
      <Circle cx="28" cy="42" r="1.2" fill="#C2410C" opacity={0.5} />
      <Circle cx="38" cy="34" r="1" fill="#C2410C" opacity={0.5} />
      <Circle cx="34" cy="48" r="1" fill="#C2410C" opacity={0.5} />

      {/* Specular Shine Reflection */}
      <Ellipse cx="24" cy="28" rx="6" ry="3.5" fill="#FFF" opacity={0.55} transform="rotate(-35 24 28)" />
    </Svg>
  );
}

/**
 * 3. Golden Lemon Icon (🍋)
 */
export function LemonIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="lemonGlow" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#FACC15" />
          <Stop offset="85%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#A16207" />
        </RadialGradient>
        <LinearGradient id="lemonLeaf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#4ADE80" />
          <Stop offset="100%" stopColor="#166534" />
        </LinearGradient>
      </Defs>

      {/* Top Leaf */}
      <Path
        d="M20 18 C14 8, 30 10, 28 20 Z"
        fill="url(#lemonLeaf)"
      />

      {/* Lemon Body (Oval with side pointed tips) */}
      <G transform="rotate(-30 32 34)">
        {/* Left Tip */}
        <Path d="M12 34 L18 30 L18 38 Z" fill="#CA8A04" />
        {/* Right Tip */}
        <Path d="M52 34 L46 30 L46 38 Z" fill="#CA8A04" />
        {/* Lemon Egg Shape */}
        <Ellipse cx="32" cy="34" rx="20" ry="15" fill="url(#lemonGlow)" />
        {/* Light Shine */}
        <Ellipse cx="26" cy="28" rx="6" ry="2.5" fill="#FFF" opacity={0.6} />
      </G>
    </Svg>
  );
}

/**
 * 4. Royal Grapes Icon (🍇)
 */
export function GrapesIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="grapeGlow" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#E9D5FF" />
          <Stop offset="45%" stopColor="#A855F7" />
          <Stop offset="85%" stopColor="#7E22CE" />
          <Stop offset="100%" stopColor="#3B0764" />
        </RadialGradient>
        <LinearGradient id="grapeStem" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#86EFAC" />
          <Stop offset="100%" stopColor="#15803D" />
        </LinearGradient>
      </Defs>

      {/* Vine & Leaf */}
      <Path
        d="M32 16 C32 8, 38 4, 44 6 C40 10, 36 12, 32 16"
        stroke="#854D0E"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M26 14 C16 10, 22 4, 30 8 C32 12, 28 14, 26 14 Z"
        fill="url(#grapeStem)"
      />

      {/* Row 1 (Top 3) */}
      <Circle cx="23" cy="24" r="7" fill="url(#grapeGlow)" />
      <Circle cx="32" cy="22" r="7.5" fill="url(#grapeGlow)" />
      <Circle cx="41" cy="24" r="7" fill="url(#grapeGlow)" />

      {/* Row 2 (Middle 3) */}
      <Circle cx="20" cy="35" r="7" fill="url(#grapeGlow)" />
      <Circle cx="28" cy="33" r="7.5" fill="url(#grapeGlow)" />
      <Circle cx="37" cy="33" r="7.5" fill="url(#grapeGlow)" />
      <Circle cx="45" cy="35" r="7" fill="url(#grapeGlow)" />

      {/* Row 3 (Lower 2) */}
      <Circle cx="26" cy="45" r="6.8" fill="url(#grapeGlow)" />
      <Circle cx="37" cy="45" r="6.8" fill="url(#grapeGlow)" />

      {/* Bottom Tip 1 */}
      <Circle cx="32" cy="53" r="6.2" fill="url(#grapeGlow)" />

      {/* Highlights */}
      <Circle cx="30" cy="20" r="1.8" fill="#FFF" opacity={0.65} />
      <Circle cx="26" cy="31" r="1.8" fill="#FFF" opacity={0.65} />
      <Circle cx="35" cy="31" r="1.8" fill="#FFF" opacity={0.65} />
      <Circle cx="30" cy="51" r="1.5" fill="#FFF" opacity={0.65} />
    </Svg>
  );
}

/**
 * 5. Sweet Watermelon Icon (🍉)
 */
export function WatermelonIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="melonFlesh" cx="45%" cy="35%" r="70%">
          <Stop offset="0%" stopColor="#FDA4AF" />
          <Stop offset="40%" stopColor="#F43F5E" />
          <Stop offset="85%" stopColor="#E11D48" />
          <Stop offset="100%" stopColor="#9F1239" />
        </RadialGradient>
        <LinearGradient id="melonRind" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#22C55E" />
          <Stop offset="100%" stopColor="#14532D" />
        </LinearGradient>
      </Defs>

      {/* Outer Green Rind Arc */}
      <Path
        d="M8 20 A26 26 0 0 0 56 20 Z"
        fill="url(#melonRind)"
      />

      {/* Inner White Rind Layer */}
      <Path
        d="M10 20 A24 24 0 0 0 54 20 Z"
        fill="#DCFCE7"
      />

      {/* Juicy Red Flesh */}
      <Path
        d="M12 20 A22 22 0 0 0 52 20 Z"
        fill="url(#melonFlesh)"
      />

      {/* Seeds (Black teardrops) */}
      <Path d="M22 26 C22 24 23 23 24 23 C25 23 26 24 26 26 C26 27.5 24 29 24 29 C24 29 22 27.5 22 26 Z" fill="#18181B" />
      <Path d="M31 25 C31 23 32 22 33 22 C34 22 35 23 35 25 C35 26.5 33 28 33 28 C33 28 31 26.5 31 25 Z" fill="#18181B" />
      <Path d="M40 26 C40 24 41 23 42 23 C43 23 44 24 44 26 C44 27.5 42 29 42 29 C42 29 40 27.5 40 26 Z" fill="#18181B" />
      <Path d="M26 33 C26 31.5 27 30.5 28 30.5 C29 30.5 30 31.5 30 33 C30 34.5 28 36 28 36 C28 36 26 34.5 26 33 Z" fill="#18181B" />
      <Path d="M36 33 C36 31.5 37 30.5 38 30.5 C39 30.5 40 31.5 40 33 C40 34.5 38 36 38 36 C38 36 36 34.5 36 33 Z" fill="#18181B" />

      {/* Top Gloss Line */}
      <Path d="M14 20 L50 20" stroke="#FFF" strokeWidth="1.5" opacity={0.4} />
    </Svg>
  );
}

/**
 * 6. Golden Bell Icon (🔔)
 */
export function BellIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="bellGold" cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="35%" stopColor="#FACC15" />
          <Stop offset="75%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </RadialGradient>
        <LinearGradient id="bellHighlight" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
          <Stop offset="100%" stopColor="#FEF08A" stopOpacity={0.1} />
        </LinearGradient>
      </Defs>

      {/* Top Loop */}
      <Circle cx="32" cy="12" r="5" stroke="#F59E0B" strokeWidth="3" fill="none" />

      {/* Clapper Bottom Ball */}
      <Circle cx="32" cy="51" r="5" fill="#78350F" />

      {/* Bell Body */}
      <Path
        d="M32 16 C22 16 16 26 16 38 C16 43 12 46 10 48 L54 48 C52 46 48 43 48 38 C48 26 42 16 32 16 Z"
        fill="url(#bellGold)"
      />

      {/* Bell Rim Base */}
      <Rect x="10" y="47" width="44" height="4" rx="2" fill="#B45309" />

      {/* Gloss Highlight Stripe */}
      <Path
        d="M24 22 C22 28 21 34 20 42"
        stroke="url(#bellHighlight)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * 7. Diamond Star Icon (⭐)
 */
export function StarIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="starGlow" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#BAE6FD" />
          <Stop offset="30%" stopColor="#38BDF8" />
          <Stop offset="75%" stopColor="#0284C7" />
          <Stop offset="100%" stopColor="#0C4A6E" />
        </RadialGradient>
        <LinearGradient id="starFacet" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFF" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#38BDF8" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>

      {/* Outer Star Aura */}
      <Path
        d="M32 6 L39 22 L56 24 L44 36 L47 54 L32 45 L17 54 L20 36 L8 24 L25 22 Z"
        fill="url(#starGlow)"
        stroke="#E0F2FE"
        strokeWidth="1.5"
      />

      {/* 3D Facet Shadows */}
      <Path d="M32 6 L32 45 L17 54 Z" fill="rgba(0,0,0,0.25)" />
      <Path d="M32 6 L32 45 L47 54 Z" fill="url(#starFacet)" />

      {/* Diamond Sparkle Center */}
      <Circle cx="32" cy="30" r="3.5" fill="#FFF" />
      <Path d="M32 22 L32 38 M24 30 L40 30" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 8. Lucky BAR Crown Icon (👑 / BAR)
 */
export function GoldenBarIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="barGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="25%" stopColor="#FBBF24" />
          <Stop offset="60%" stopColor="#D97706" />
          <Stop offset="85%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
        <LinearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFF" />
          <Stop offset="50%" stopColor="#FDE047" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
      </Defs>

      {/* Mini Top Crown */}
      <Path
        d="M20 22 L24 12 L32 18 L40 12 L44 22 Z"
        fill="url(#crownGold)"
      />
      <Circle cx="24" cy="11" r="1.8" fill="#EC4899" />
      <Circle cx="32" cy="17" r="1.8" fill="#00F5D4" />
      <Circle cx="40" cy="11" r="1.8" fill="#EC4899" />

      {/* 3D Ingot Base Block */}
      <Rect
        x="6"
        y="24"
        width="52"
        height="26"
        rx="5"
        fill="url(#barGold)"
        stroke="#FEF08A"
        strokeWidth="1.5"
      />

      {/* Ingot Inner Recess */}
      <Rect
        x="9"
        y="27"
        width="46"
        height="20"
        rx="3"
        fill="#451A03"
      />

      {/* Shiny Text BAR Emboss */}
      <G fill="#FDE047">
        {/* B */}
        <Path d="M14 30 H21 C23 30 24 31 24 32.5 C24 33.5 23 34 22 34.5 C23.5 35 24.5 36 24.5 37.5 C24.5 39 23 40 21 40 H14 Z M16.5 32 V34 H20 C20.8 34 21.5 33.5 21.5 33 C21.5 32.5 20.8 32 20 32 Z M16.5 35.5 V38 H20.5 C21.3 38 22 37.5 22 37 C22 36.5 21.3 35.5 20.5 35.5 Z" />
        {/* A */}
        <Path d="M28 40 L31 30 H33.5 L36.5 40 H34 L33.2 37.5 H31.3 L30.5 40 Z M31.8 35.5 H32.7 L32.2 32.5 Z" />
        {/* R */}
        <Path d="M40 30 H45 C47 30 48.5 31.2 48.5 33 C48.5 34.5 47.5 35.5 46 36 L49 40 H46.5 L43.8 36.5 H42.5 V40 H40 Z M42.5 32 V34.5 H44.5 C45.3 34.5 46 34 46 33.2 C46 32.5 45.3 32 44.5 32 Z" />
      </G>

      {/* Top Metallic Reflection Edge */}
      <Path d="M8 25 L56 25" stroke="#FFF" strokeWidth="1" opacity={0.6} />
    </Svg>
  );
}

/**
 * 9. Tropical Cocktail Icon (🍹)
 */
export function FruitCocktailIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="cocktailJuice" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F43F5E" />
          <Stop offset="50%" stopColor="#FB923C" />
          <Stop offset="100%" stopColor="#FACC15" />
        </LinearGradient>
      </Defs>

      {/* Straw */}
      <Path
        d="M24 8 L32 26 L30 42"
        stroke="#38BDF8"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Umbrella */}
      <Path
        d="M38 10 C46 8, 54 16, 50 22 Z"
        fill="#EC4899"
      />
      <Path d="M44 14 L36 24" stroke="#FBBF24" strokeWidth="1.5" />

      {/* Glass Body */}
      <Path
        d="M16 22 L48 22 L36 46 L36 56 L44 56 L44 59 L20 59 L20 56 L28 56 L28 46 Z"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Juice Inside */}
      <Path
        d="M19 25 L45 25 L34 45 L30 45 Z"
        fill="url(#cocktailJuice)"
      />

      {/* Lime Wedge on Rim */}
      <Circle cx="16" cy="22" r="6" fill="#84CC16" />
      <Circle cx="16" cy="22" r="4.5" fill="#BEF264" />
    </Svg>
  );
}


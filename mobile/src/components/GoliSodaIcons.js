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
 * Modern Codd-Neck Goli Soda Bottle SVG Graphic
 * Renders an authentic Indian marble soda bottle with realistic glass transparency,
 * pinched glass marble neck, rubber rim washer, and dynamic animated fizz eruptions.
 *
 * @param {string} flavor - 'lemon' | 'berry' | 'jeera'
 * @param {string} state - 'sealed' | 'popping' | 'popped'
 * @param {string} prize - 'mega' | 'super' | 'flat' | null
 * @param {number} width - default 100
 * @param {number} height - default 170
 */
export function GoliSodaBottleGraphic({
  flavor = 'lemon',
  state = 'sealed',
  prize = null,
  width = 100,
  height = 170,
}) {
  // Flavor soda liquid colors
  const flavorPalettes = {
    lemon: {
      liquidLight: '#FEF08A',
      liquidMid: '#FACC15',
      liquidDark: '#CA8A04',
      glow: '#FDE047',
      label: 'NIMBU',
      labelColor: '#713F12',
    },
    berry: {
      liquidLight: '#F472B6',
      liquidMid: '#C084FC',
      liquidDark: '#7E22CE',
      glow: '#E879F9',
      label: 'KHATTA',
      labelColor: '#4C1D95',
    },
    jeera: {
      liquidLight: '#FDE68A',
      liquidMid: '#F59E0B',
      liquidDark: '#92400E',
      glow: '#FBBF24',
      label: 'JEERA',
      labelColor: '#451A03',
    },
  };

  const palette = flavorPalettes[flavor] || flavorPalettes.lemon;

  // Marble position: sealed = top neck (cy=42), popped = chamber shelf (cy=72)
  const isPopped = state === 'popped';
  const isPopping = state === 'popping';
  const marbleY = isPopped ? 70 : isPopping ? 56 : 41;

  return (
    <Svg width={width} height={height} viewBox="0 0 100 170">
      <Defs>
        {/* Glass outer cylinder gradient */}
        <LinearGradient id={`glassGrad_${flavor}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.45" />
          <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <Stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.1" />
          <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#059669" stopOpacity="0.45" />
        </LinearGradient>

        {/* Soda liquid core gradient */}
        <LinearGradient id={`liquidGrad_${flavor}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={palette.liquidDark} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={palette.liquidMid} stopOpacity="0.85" />
          <Stop offset="80%" stopColor={palette.liquidLight} stopOpacity="0.9" />
          <Stop offset="100%" stopColor={palette.liquidDark} stopOpacity="0.9" />
        </LinearGradient>

        {/* Emerald glass marble sphere 3D gradient */}
        <RadialGradient id="marbleGrad" cx="35%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="25%" stopColor="#A7F3D0" stopOpacity="0.9" />
          <Stop offset="60%" stopColor="#10B981" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#064E3B" stopOpacity="1" />
        </RadialGradient>

        {/* Mega fizz fountain gradient */}
        <LinearGradient id="megaFizzGrad" x1="50%" y1="100%" x2="50%" y2="0%">
          <Stop offset="0%" stopColor="#FACC15" stopOpacity="0.9" />
          <Stop offset="40%" stopColor="#38BDF8" stopOpacity="0.85" />
          <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#FEF08A" stopOpacity="0.3" />
        </LinearGradient>

        {/* Super fizz fountain gradient */}
        <LinearGradient id="superFizzGrad" x1="50%" y1="100%" x2="50%" y2="0%">
          <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
          <Stop offset="50%" stopColor="#FEF08A" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>

      {/* ══ FOUNTAIN FIZZ ERUPTIONS (When Popped) ══ */}
      {isPopped && prize === 'mega' && (
        <G>
          {/* Mega 5X Jet Stream */}
          <Path
            d="M50 25 C44 15, 30 -5, 38 -20 C42 -28, 58 -28, 62 -20 C70 -5, 56 15, 50 25 Z"
            fill="url(#megaFizzGrad)"
          />
          <Path
            d="M48 24 C40 10, 22 2, 18 -10 C24 -18, 38 -15, 46 15 Z"
            fill="url(#megaFizzGrad)"
            opacity={0.8}
          />
          <Path
            d="M52 24 C60 10, 78 2, 82 -10 C76 -18, 62 -15, 54 15 Z"
            fill="url(#megaFizzGrad)"
            opacity={0.8}
          />
          {/* Sparkles / Bubbles shooting up */}
          <Circle cx="35" cy="-12" r="3.5" fill="#FFFFFF" opacity={0.9} />
          <Circle cx="65" cy="-10" r="3" fill="#38BDF8" opacity={0.9} />
          <Circle cx="50" cy="-24" r="4.5" fill="#FEF08A" opacity={0.95} />
          <Circle cx="24" cy="-4" r="2.5" fill="#FFFFFF" opacity={0.8} />
          <Circle cx="76" cy="-2" r="2.5" fill="#FEF08A" opacity={0.8} />
          {/* Diamond star shine */}
          <Path
            d="M50 -32 L52 -27 L57 -25 L52 -23 L50 -18 L48 -23 L43 -25 L48 -27 Z"
            fill="#FEF08A"
          />
        </G>
      )}

      {isPopped && prize === 'super' && (
        <G>
          {/* Super 2.5X Foaming Overflow */}
          <Path
            d="M50 26 C43 18, 34 5, 42 -2 C48 -8, 56 -8, 60 -2 C68 5, 57 18, 50 26 Z"
            fill="url(#superFizzGrad)"
          />
          <Circle cx="44" cy="5" r="3.5" fill="#FFFFFF" opacity={0.9} />
          <Circle cx="56" cy="4" r="3" fill="#FEF08A" opacity={0.9} />
          <Circle cx="50" cy="-4" r="4" fill="#FFFFFF" opacity={0.95} />
          <Circle cx="38" cy="12" r="2.5" fill="#FEF08A" opacity={0.8} />
          <Circle cx="62" cy="11" r="2.5" fill="#FFFFFF" opacity={0.8} />
        </G>
      )}

      {isPopped && prize === 'flat' && (
        <G>
          {/* Flat 0X Tiny Smoke Puff */}
          <Ellipse cx="50" cy="22" rx="6" ry="3" fill="#94A3B8" opacity={0.5} />
          <Circle cx="48" cy="16" r="2.5" fill="#94A3B8" opacity={0.4} />
          <Circle cx="53" cy="11" r="2" fill="#CBD5E1" opacity={0.3} />
        </G>
      )}

      {/* ══ CODD BOTTLE GLASS SILHOUETTE ══ */}
      {/* Outer Glass Contour (Authentic Codd Neck with Pinches) */}
      <Path
        d="M40 25 
           L60 25 
           C63 25, 63 30, 60 32 
           L58 45 
           C55 52, 54 54, 53 58
           C52 64, 54 68, 56 70
           C60 74, 68 80, 72 88
           C75 94, 76 102, 76 112
           L76 150
           C76 158, 70 162, 50 162
           C30 162, 24 158, 24 150
           L24 112
           C24 102, 25 94, 28 88
           C32 80, 40 74, 44 70
           C46 68, 48 64, 47 58
           C46 54, 45 52, 42 45
           L40 32
           C37 30, 37 25, 40 25 Z"
        fill="url(#glassGrad_lemon)"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* ══ SODA LIQUID BODY ══ */}
      <Path
        d="M26 112
           C26 104, 28 96, 32 90
           C35 84, 42 78, 45 74
           L55 74
           C58 78, 65 84, 68 90
           C72 96, 74 104, 74 112
           L74 148
           C74 156, 68 160, 50 160
           C32 160, 26 156, 26 148
           Z"
        fill={`url(#liquidGrad_${flavor})`}
      />

      {/* Internal Rising Bubbles in Liquid */}
      <Circle cx="38" cy="140" r="1.8" fill="#FFFFFF" opacity={0.6} />
      <Circle cx="58" cy="132" r="2.2" fill="#FFFFFF" opacity={0.7} />
      <Circle cx="46" cy="120" r="1.5" fill="#FFFFFF" opacity={0.5} />
      <Circle cx="62" cy="105" r="2" fill="#FFFFFF" opacity={0.65} />
      <Circle cx="36" cy="100" r="1.6" fill="#FFFFFF" opacity={0.55} />
      <Circle cx="50" cy="88" r="2.4" fill="#FFFFFF" opacity={0.8} />

      {/* ══ PINCHED MARBLE CHAMBER (Internal Glass Shelf) ══ */}
      {/* Left and Right Indents / Pinches */}
      <Path
        d="M38 58 C42 60, 45 64, 44 70"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <Path
        d="M62 58 C58 60, 55 64, 56 70"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />

      {/* ══ THE GLASS MARBLE (GOLI) ══ */}
      <Circle
        cx="50"
        cy={marbleY}
        r="8.5"
        fill="url(#marbleGrad)"
        stroke="#047857"
        strokeWidth="1.2"
      />
      {/* Marble Specular Reflection */}
      <Circle cx="47.5" cy={marbleY - 3} r="2.2" fill="#FFFFFF" opacity={0.9} />

      {/* ══ RUBBER WASHER / GASKET AT MOUTH ══ */}
      <Rect
        x="41"
        y="25"
        width="18"
        height="3.5"
        rx="1.5"
        fill="#DC2626"
        opacity={0.9}
        stroke="#991B1B"
        strokeWidth="0.8"
      />

      {/* Top Glass Mouth Rim */}
      <Ellipse
        cx="50"
        cy="25"
        rx="9"
        ry="2.5"
        fill="#A7F3D0"
        fillOpacity="0.4"
        stroke="#10B981"
        strokeWidth="1"
      />

      {/* ══ BOTTLE VINTAGE EMBOSSED LABEL ══ */}
      <Rect
        x="33"
        y="118"
        width="34"
        height="18"
        rx="4"
        fill="rgba(255, 255, 255, 0.22)"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1"
      />
      {/* Subtle Star Badge on Label */}
      <Circle cx="50" cy="127" r="4.5" fill={palette.liquidLight} opacity={0.85} />
      <Path
        d="M50 124 L51 126.5 L53.5 127 L51 127.5 L50 130 L49 127.5 L46.5 127 L49 126.5 Z"
        fill={palette.labelColor}
      />

      {/* ══ GLASS REFLECTION HIGHLIGHTS ══ */}
      {/* Curved left rim highlight */}
      <Path
        d="M28 92 C27 100, 27 130, 28 145"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.4}
      />
      {/* Neck left highlight */}
      <Path
        d="M42 34 L40 45"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

/**
 * Traditional Wooden Goli Soda Opener T-Tool Graphic
 * The classic wooden peg that street vendors press onto the marble to pop it.
 */
export function WoodenOpenerGraphic({ width = 45, height = 45 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 60 60">
      <Defs>
        <LinearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D97706" />
          <Stop offset="40%" stopColor="#B45309" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
        <LinearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="50%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
      </Defs>

      {/* Top Handle Grip (T-Bar) */}
      <Rect
        x="6"
        y="8"
        width="48"
        height="12"
        rx="6"
        fill="url(#woodGrad)"
        stroke="#451A03"
        strokeWidth="1.2"
      />
      {/* Handle Highlight */}
      <Rect x="12" y="10" width="36" height="3" rx="1.5" fill="#FDE68A" opacity={0.4} />

      {/* Central Stem */}
      <Rect
        x="24"
        y="18"
        width="12"
        height="24"
        rx="2"
        fill="url(#woodGrad)"
        stroke="#451A03"
        strokeWidth="1"
      />

      {/* Brass / Hardwood Plunger Peg (Bottom Pin that touches the marble) */}
      <Path
        d="M26 42 L34 42 L32 54 C32 55.5, 28 55.5, 28 54 Z"
        fill="url(#brassGrad)"
        stroke="#854D0E"
        strokeWidth="1"
      />
      {/* Shine dot on bottom peg */}
      <Circle cx="30" cy="50" r="1.5" fill="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}

/**
 * Goli Soda Modern Square Game Tile Icon for GamesListModal
 */
export function GoliSodaTileIcon({ size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="tileSodaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="50%" stopColor="#059669" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
        <RadialGradient id="bubbleGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Background glow circle */}
      <Circle cx="32" cy="32" r="28" fill="url(#bubbleGlow)" />

      {/* Mini Codd Soda Bottle in Center */}
      <Path
        d="M28 12 L36 12 L35 22 C33 25, 33 26, 32 28 C31 31, 33 33, 35 35 C38 38, 43 42, 44 48 L44 56 C44 59, 41 60, 32 60 C23 60, 20 59, 20 56 L20 48 C21 42, 26 38, 29 35 C31 33, 33 31, 32 28 C31 26, 31 25, 29 22 Z"
        fill="url(#tileSodaGrad)"
        stroke="#6EE7B7"
        strokeWidth="1.5"
      />

      {/* Sparkling Pop Fountain Out of Top */}
      <Path
        d="M32 12 C28 6, 22 2, 24 -2 C28 -3, 36 2, 33 12 Z"
        fill="#FEF08A"
        opacity={0.9}
      />
      <Path
        d="M32 12 C36 6, 42 2, 40 -2 C36 -3, 28 2, 31 12 Z"
        fill="#38BDF8"
        opacity={0.9}
      />
      <Circle cx="23" cy="2" r="2.5" fill="#FEF08A" />
      <Circle cx="41" cy="1" r="2" fill="#38BDF8" />
      <Circle cx="32" cy="-4" r="3" fill="#FFFFFF" />

      {/* Green Glass Marble in Neck */}
      <Circle cx="32" cy="24" r="4.5" fill="#34D399" stroke="#065F46" strokeWidth="1" />
      <Circle cx="30.8" cy="22.5" r="1.3" fill="#FFFFFF" opacity={0.9} />

      {/* Bubbles in liquid */}
      <Circle cx="26" cy="46" r="1.8" fill="#FFFFFF" opacity={0.8} />
      <Circle cx="36" cy="50" r="1.5" fill="#FEF08A" opacity={0.9} />
      <Circle cx="31" cy="54" r="2.2" fill="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}


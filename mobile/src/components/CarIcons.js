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
 * 1. Ferrari (40x Grand Supercar Multiplier)
 * Italian Rosso Corsa Shield with Prancing Stallion & Tricolor Bar
 */
export const FerrariIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="ferrariRed" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="50%" stopColor="#DC2626" />
        <Stop offset="100%" stopColor="#991B1B" />
      </LinearGradient>
      <LinearGradient id="ferrariGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="50%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#A16207" />
      </LinearGradient>
    </Defs>
    {/* Shield Base */}
    <Path
      d="M20 18 C20 18 50 12 50 12 C50 12 80 18 80 18 C80 50 72 75 50 88 C28 75 20 50 20 18 Z"
      fill="url(#ferrariRed)"
      stroke="url(#ferrariGold)"
      strokeWidth="3.5"
    />
    {/* Italian Tricolor Top Bar */}
    <Path d="M26 21 L42 19 L42 24 L26 26 Z" fill="#10B981" />
    <Path d="M42 19 L58 19 L58 24 L42 24 Z" fill="#F8FAFC" />
    <Path d="M58 19 L74 21 L74 26 L58 24 Z" fill="#EF4444" />

    {/* Prancing Horse Silhouette */}
    <G transform="translate(32, 28) scale(0.38)">
      <Path
        d="M48 10 C50 6 54 4 58 4 C60 10 56 16 52 18 C56 20 62 26 60 32 C56 36 50 36 46 32 C44 38 42 46 44 54 C48 56 56 50 62 48 C66 48 70 54 66 58 C58 64 50 64 42 60 C38 68 34 78 36 88 C38 94 34 98 28 98 C24 98 24 92 28 86 C32 78 30 70 26 64 C20 72 16 82 18 94 C18 98 12 98 10 94 C8 82 14 68 22 56 C26 48 24 38 18 32 C12 28 10 22 14 18 C18 16 24 20 26 26 C30 22 34 14 38 8 C42 4 46 6 48 10 Z"
        fill="#FDE047"
      />
      {/* Dynamic Mane & Hooves Sparkles */}
      <Circle cx="64" cy="52" r="2.5" fill="#FFFFFF" />
      <Circle cx="28" cy="94" r="2" fill="#FFFFFF" />
    </G>

    {/* Multiplier Tag */}
    <Rect x="30" y="70" width="40" height="15" rx="7.5" fill="#7F1D1D" stroke="#FDE047" strokeWidth="1" />
    <Path d="M37 77 L41 77 M45 74 L45 81" stroke="#FEF08A" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * 2. Lamborghini (30x Supercar Multiplier)
 * Electric Gold / Black Hexagonal Shield with Raging Bull Silhouette
 */
export const LamborghiniIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="lamboBlack" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#1E293B" />
        <Stop offset="50%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#020617" />
      </LinearGradient>
      <LinearGradient id="lamboGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
    </Defs>
    {/* Hexagonal Shield */}
    <Polygon
      points="50,12 82,24 82,64 50,88 18,64 18,24"
      fill="url(#lamboBlack)"
      stroke="url(#lamboGold)"
      strokeWidth="3.5"
    />
    {/* Inner Gold Inset Line */}
    <Polygon
      points="50,18 76,28 76,60 50,81 24,60 24,28"
      stroke="url(#lamboGold)"
      strokeWidth="1"
      strokeOpacity={0.5}
      fill="none"
    />

    {/* Raging Bull Silhouette */}
    <G transform="translate(26, 28) scale(0.48)">
      {/* Horns */}
      <Path d="M22 14 C16 6 8 8 6 12 C10 16 16 16 22 20 Z" fill="#FDE047" />
      <Path d="M42 12 C48 4 58 6 60 10 C54 14 48 14 42 18 Z" fill="#FDE047" />
      {/* Muscular Bull Body & Shoulders */}
      <Path
        d="M20 22 C26 18 38 18 44 22 C52 26 62 24 70 30 C76 34 82 46 76 56 C70 66 60 70 54 74 C46 80 34 80 26 74 C18 68 14 56 16 44 C18 34 16 26 20 22 Z"
        fill="url(#lamboGold)"
      />
      {/* Front Powerful Legs */}
      <Path d="M24 68 L18 88 L26 90 L32 74 Z" fill="#D97706" />
      <Path d="M48 70 L54 88 L62 86 L56 70 Z" fill="#D97706" />
      {/* Golden Eye */}
      <Circle cx="30" cy="30" r="3" fill="#FFFFFF" />
      <Circle cx="30" cy="30" r="1.5" fill="#B45309" />
    </G>

    {/* Multiplier Tag */}
    <Rect x="30" y="69" width="40" height="14" rx="7" fill="#78350F" stroke="#FDE047" strokeWidth="1" />
  </Svg>
);

/**
 * 3. Maserati (20x Supercar Multiplier)
 * Royal Midnight Blue Oval with Neptune's Sharp Chrome Trident
 */
export const MaseratiIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="maseratiBlue" cx="50" cy="50" r="48">
        <Stop offset="0%" stopColor="#2563EB" />
        <Stop offset="70%" stopColor="#1E3A8A" />
        <Stop offset="100%" stopColor="#0F172A" />
      </RadialGradient>
      <LinearGradient id="chromeTrident" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="40%" stopColor="#E2E8F0" />
        <Stop offset="70%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#64748B" />
      </LinearGradient>
    </Defs>
    {/* Elegant Oval Base */}
    <Ellipse
      cx="50"
      cy="50"
      rx="38"
      ry="42"
      fill="url(#maseratiBlue)"
      stroke="url(#chromeTrident)"
      strokeWidth="3.5"
    />
    {/* Inner decorative silver ellipse */}
    <Ellipse
      cx="50"
      cy="50"
      rx="32"
      ry="36"
      stroke="#93C5FD"
      strokeWidth="1"
      strokeOpacity={0.4}
      fill="none"
    />

    {/* Neptune's Trident Spear */}
    <G transform="translate(24, 20) scale(0.52)">
      {/* Center Spear Tip */}
      <Polygon points="50,4 58,26 53,26 53,75 47,75 47,26 42,26" fill="url(#chromeTrident)" stroke="#DC2626" strokeWidth="1" />
      {/* Left Barb */}
      <Path
        d="M26 18 C26 38 44 48 48 50 L48 44 C42 42 34 34 34 22 L26 18 Z"
        fill="url(#chromeTrident)"
      />
      {/* Left Arrow Tip */}
      <Polygon points="26,14 34,22 24,24" fill="#DC2626" />
      {/* Right Barb */}
      <Path
        d="M74 18 C74 38 56 48 52 50 L52 44 C58 42 66 34 66 22 L74 18 Z"
        fill="url(#chromeTrident)"
      />
      {/* Right Arrow Tip */}
      <Polygon points="74,14 76,24 66,22" fill="#DC2626" />
      {/* Base Pedestal */}
      <Rect x="42" y="75" width="16" height="14" rx="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
    </G>

    {/* Multiplier Tag */}
    <Rect x="30" y="72" width="40" height="14" rx="7" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="1" />
  </Svg>
);

/**
 * 4. Porsche (10x Supercar Multiplier)
 * Stuttgart Crest Shield with Golden Antlers & Center Stallion
 */
export const PorscheIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="porscheGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FDE047" />
        <Stop offset="50%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#A16207" />
      </LinearGradient>
      <LinearGradient id="porscheRed" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
    </Defs>
    {/* Shield Body */}
    <Path
      d="M22 16 C22 16 50 14 50 14 C50 14 78 16 78 16 C78 52 70 74 50 86 C30 74 22 52 22 16 Z"
      fill="url(#porscheGold)"
      stroke="#78350F"
      strokeWidth="3"
    />
    {/* Four Quadrants Design (Stuttgart & Württemberg) */}
    {/* Top-Right & Bottom-Left Red Stripes */}
    <Path d="M50 18 L74 19 C74 34 66 48 50 48 Z" fill="url(#porscheRed)" />
    <Path d="M26 48 L50 48 C50 68 38 78 28 66 Z" fill="url(#porscheRed)" />
    {/* Black Bavarian Antler Stripes */}
    <Path d="M30 26 L46 26 M32 34 L46 34 M34 42 L46 42" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M54 56 L68 56 M54 64 L66 64 M54 72 L62 72" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

    {/* Center Golden Horse Shield Inset */}
    <Rect x="42" y="38" width="16" height="22" rx="3" fill="#FDE047" stroke="#0F172A" strokeWidth="1.5" />
    <Circle cx="50" cy="45" r="3" fill="#0F172A" />
    <Path d="M48 48 C48 53 52 53 52 56" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />

    {/* Multiplier Tag */}
    <Rect x="30" y="70" width="40" height="14" rx="7" fill="#713F12" stroke="#FDE047" strokeWidth="1" />
  </Svg>
);

/**
 * 5. Mercedes-Benz (5x Luxury Multiplier)
 * Classic Silver Chrome Circular Ring with 3-Pointed Radiating Star
 */
export const MercedesIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="mercChrome" cx="50" cy="50" r="48">
        <Stop offset="0%" stopColor="#334155" />
        <Stop offset="70%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </RadialGradient>
      <LinearGradient id="silverStar" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#CBD5E1" />
        <Stop offset="100%" stopColor="#64748B" />
      </LinearGradient>
      <LinearGradient id="silverShine" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#F8FAFC" />
        <Stop offset="100%" stopColor="#94A3B8" />
      </LinearGradient>
    </Defs>
    {/* Dark Chrome Circular Base */}
    <Circle cx="50" cy="50" r="40" fill="url(#mercChrome)" stroke="url(#silverStar)" strokeWidth="4" />
    {/* Inner Inset Silver Ring */}
    <Circle cx="50" cy="50" r="34" stroke="#94A3B8" strokeWidth="1" strokeOpacity={0.6} />

    {/* 3-Pointed Star */}
    {/* Top Point */}
    <Polygon points="50,50 46,50 50,18" fill="url(#silverStar)" />
    <Polygon points="50,50 54,50 50,18" fill="url(#silverShine)" />
    {/* Bottom-Right Point (120 deg) */}
    <Polygon points="50,50 52,53 78,66" fill="url(#silverStar)" />
    <Polygon points="50,50 49,49 78,66" fill="url(#silverShine)" />
    {/* Bottom-Left Point (240 deg) */}
    <Polygon points="50,50 51,49 22,66" fill="url(#silverStar)" />
    <Polygon points="50,50 48,53 22,66" fill="url(#silverShine)" />

    {/* Center Sphere Hub */}
    <Circle cx="50" cy="50" r="5" fill="#F8FAFC" />
    <Circle cx="49" cy="49" r="2" fill="#FFFFFF" />
  </Svg>
);

/**
 * 6. BMW (5x Luxury Multiplier)
 * Bavarian Azure Blue & White 4-Quadrant Roundel with Outer Black/Silver Ring
 */
export const BmwIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="bmwSilverRim" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
      <LinearGradient id="bmwBlue" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="100%" stopColor="#0284C7" />
      </LinearGradient>
    </Defs>
    {/* Outer Silver Ring */}
    <Circle cx="50" cy="50" r="41" fill="#0F172A" stroke="url(#bmwSilverRim)" strokeWidth="3" />
    {/* Outer Black Accent Band */}
    <Circle cx="50" cy="50" r="38" stroke="#334155" strokeWidth="4" />

    {/* Inner Roundel (Radius 26) */}
    <Circle cx="50" cy="50" r="26" fill="#FFFFFF" stroke="url(#bmwSilverRim)" strokeWidth="1.5" />
    {/* Top-Right Quadrant (Blue) */}
    <Path d="M50 50 L50 24 A26 26 0 0 1 76 50 Z" fill="url(#bmwBlue)" />
    {/* Bottom-Left Quadrant (Blue) */}
    <Path d="M50 50 L50 76 A26 26 0 0 1 24 50 Z" fill="url(#bmwBlue)" />

    {/* Cross dividing lines in Silver */}
    <Path d="M50 24 L50 76 M24 50 L76 50" stroke="url(#bmwSilverRim)" strokeWidth="1.5" />

    {/* Silver Center Pivot */}
    <Circle cx="50" cy="50" r="3" fill="#F8FAFC" />
  </Svg>
);

/**
 * 7. Audi (5x Luxury Multiplier)
 * 4 Interlocking Metallic Platinum Rings
 */
export const AudiIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="audiBg" cx="50" cy="50" r="48">
        <Stop offset="0%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#090D16" />
      </RadialGradient>
      <LinearGradient id="platinumRing" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="40%" stopColor="#CBD5E1" />
        <Stop offset="70%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
    </Defs>
    {/* Dark Rounded Plate */}
    <Rect
      x="8"
      y="18"
      width="84"
      height="64"
      rx="20"
      fill="url(#audiBg)"
      stroke="url(#platinumRing)"
      strokeWidth="2.5"
    />

    {/* 4 Interlocking Rings (Radii = 13, Y = 50) */}
    {/* Ring 1 (Leftmost, CX = 28) */}
    <Circle cx="28" cy="50" r="13" stroke="url(#platinumRing)" strokeWidth="3.2" fill="none" />
    {/* Ring 2 (CX = 43) */}
    <Circle cx="43" cy="50" r="13" stroke="url(#platinumRing)" strokeWidth="3.2" fill="none" />
    {/* Ring 3 (CX = 57) */}
    <Circle cx="57" cy="50" r="13" stroke="url(#platinumRing)" strokeWidth="3.2" fill="none" />
    {/* Ring 4 (Rightmost, CX = 72) */}
    <Circle cx="72" cy="50" r="13" stroke="url(#platinumRing)" strokeWidth="3.2" fill="none" />

    {/* Subtle highlights */}
    <Circle cx="28" cy="38" r="1.5" fill="#FFFFFF" />
    <Circle cx="43" cy="38" r="1.5" fill="#FFFFFF" />
    <Circle cx="57" cy="38" r="1.5" fill="#FFFFFF" />
    <Circle cx="72" cy="38" r="1.5" fill="#FFFFFF" />
  </Svg>
);

/**
 * 8. Volkswagen (5x Luxury Multiplier)
 * Classic Chrome Circular Monogram with Interlocking V and W
 */
export const VolkswagenIcon = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="vwBlue" cx="50" cy="50" r="44">
        <Stop offset="0%" stopColor="#3B82F6" />
        <Stop offset="60%" stopColor="#1D4ED8" />
        <Stop offset="100%" stopColor="#1E3A8A" />
      </RadialGradient>
      <LinearGradient id="vwChrome" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#E2E8F0" />
        <Stop offset="100%" stopColor="#94A3B8" />
      </LinearGradient>
    </Defs>
    {/* Outer Ring */}
    <Circle cx="50" cy="50" r="41" fill="url(#vwBlue)" stroke="url(#vwChrome)" strokeWidth="3.5" />
    {/* Inner Inset Ring */}
    <Circle cx="50" cy="50" r="34" stroke="#93C5FD" strokeWidth="1" strokeOpacity={0.5} />

    {/* "V" on Top */}
    <Path
      d="M32 26 L44 48 L56 48 L68 26 L60 26 L50 44 L40 26 Z"
      fill="url(#vwChrome)"
    />

    {/* "W" on Bottom */}
    <Path
      d="M26 44 L36 74 L44 74 L50 56 L56 74 L64 74 L74 44 L66 44 L58 66 L52 48 L48 48 L42 66 L34 44 Z"
      fill="url(#vwChrome)"
    />

    {/* Center Horizontal Separator Bar */}
    <Rect x="26" y="47" width="48" height="2" fill="#1E3A8A" />
  </Svg>
);

/**
 * Helper: Steering Wheel Icon
 */
export const SteeringWheelIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="wheelRim" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="50%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#78350F" />
      </LinearGradient>
      <LinearGradient id="spokeSilver" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#E2E8F0" />
        <Stop offset="100%" stopColor="#94A3B8" />
      </LinearGradient>
    </Defs>
    {/* Outer Thick Leather Steering Rim */}
    <Circle cx="50" cy="50" r="42" stroke="url(#wheelRim)" strokeWidth="7" fill="none" />
    {/* Grip Insets */}
    <Path d="M12 40 C10 46 10 54 12 60" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
    <Path d="M88 40 C90 46 90 54 88 60" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />

    {/* Center Boss / Horn Pad */}
    <Circle cx="50" cy="52" r="16" fill="#1E293B" stroke="url(#spokeSilver)" strokeWidth="2.5" />
    {/* Center Brand Badge */}
    <Circle cx="50" cy="52" r="7" fill="#EF4444" />
    <Path d="M47 52 L53 52 M50 49 L50 55" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

    {/* 3 Spokes */}
    {/* Left Horizontal Spoke */}
    <Path d="M15 50 L34 52" stroke="url(#spokeSilver)" strokeWidth="6" strokeLinecap="round" />
    {/* Right Horizontal Spoke */}
    <Path d="M85 50 L66 52" stroke="url(#spokeSilver)" strokeWidth="6" strokeLinecap="round" />
    {/* Bottom Spoke */}
    <Path d="M50 68 L50 85" stroke="url(#spokeSilver)" strokeWidth="6" strokeLinecap="round" />
  </Svg>
);

/**
 * Helper: Speedometer Gauge Icon
 */
export const SpeedometerDialIcon = ({ size = 48, speedPct = 0.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="gaugeArc" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#10B981" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#EF4444" />
      </LinearGradient>
    </Defs>
    {/* Background Arc */}
    <Path
      d="M20 75 A40 40 0 1 1 80 75"
      stroke="#334155"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* Dynamic Glowing Colored Arc */}
    <Path
      d="M20 75 A40 40 0 1 1 80 75"
      stroke="url(#gaugeArc)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray="188"
      strokeDashoffset={188 * (1 - Math.min(1, Math.max(0.1, speedPct)))}
      fill="none"
    />

    {/* Center Pivot */}
    <Circle cx="50" cy="55" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
    {/* Needle (angles dynamically) */}
    <G transform={`rotate(${speedPct * 180 - 90}, 50, 55)`}>
      <Path d="M50 55 L50 25" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </G>
  </Svg>
);

/**
 * Helper: Checkered Racing Flag Icon
 */
export const RacingFlagIcon = ({ size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Pole */}
    <Path d="M18 10 L18 90" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
    <Circle cx="18" cy="10" r="4" fill="#F59E0B" />
    {/* Checkered Flag Wave */}
    <G transform="translate(18, 12)">
      <Rect x="0" y="0" width="16" height="12" fill="#FFFFFF" />
      <Rect x="16" y="0" width="16" height="12" fill="#0F172A" />
      <Rect x="32" y="0" width="16" height="12" fill="#FFFFFF" />
      <Rect x="48" y="0" width="16" height="12" fill="#0F172A" />

      <Rect x="0" y="12" width="16" height="12" fill="#0F172A" />
      <Rect x="16" y="12" width="16" height="12" fill="#FFFFFF" />
      <Rect x="32" y="12" width="16" height="12" fill="#0F172A" />
      <Rect x="48" y="12" width="16" height="12" fill="#FFFFFF" />

      <Rect x="0" y="24" width="16" height="12" fill="#FFFFFF" />
      <Rect x="16" y="24" width="16" height="12" fill="#0F172A" />
      <Rect x="32" y="24" width="16" height="12" fill="#FFFFFF" />
      <Rect x="48" y="24" width="16" height="12" fill="#0F172A" />

      <Rect x="0" y="36" width="16" height="12" fill="#0F172A" />
      <Rect x="16" y="36" width="16" height="12" fill="#FFFFFF" />
      <Rect x="32" y="36" width="16" height="12" fill="#0F172A" />
      <Rect x="48" y="36" width="16" height="12" fill="#FFFFFF" />
    </G>
  </Svg>
);


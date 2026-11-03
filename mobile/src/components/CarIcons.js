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
 * 1. FERRARI (40X Grand Supercar)
 * Iconic Rosso Corsa Racing Red Italian Supercar (LaFerrari / 488 Style)
 * Front-3/4 sleek aerodynamic sports car with LED headlights & carbon accents
 */
export const FerrariIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="ferrariBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="45%" stopColor="#DC2626" />
        <Stop offset="100%" stopColor="#991B1B" />
      </LinearGradient>
      <LinearGradient id="ferrariGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#020617" />
      </LinearGradient>
      <LinearGradient id="ferrariLight" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FEF08A" />
      </LinearGradient>
      <RadialGradient id="ferrariGlow" cx="50" cy="50" r="48">
        <Stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} />
        <Stop offset="100%" stopColor="transparent" />
      </RadialGradient>
    </Defs>
    {/* Soft Glow */}
    <Circle cx="50" cy="50" r="46" fill="url(#ferrariGlow)" />

    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (Front & Rear Black Rims with Red Calipers) */}
    <Ellipse cx="19" cy="74" rx="7" ry="9" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
    <Circle cx="19" cy="74" r="3.5" fill="#DC2626" />
    <Ellipse cx="81" cy="74" rx="7" ry="9" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
    <Circle cx="81" cy="74" r="3.5" fill="#DC2626" />

    {/* Rear GT Wing / Spoiler */}
    <Path d="M22 46 L10 44 L12 40 L26 42 Z" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1" />
    <Path d="M78 46 L90 44 L88 40 L74 42 Z" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1" />
    <Rect x="16" y="38" width="68" height="3" rx="1.5" fill="#0F172A" stroke="#EF4444" strokeWidth="1" />

    {/* Sleek Aerodynamic Car Roof & Windshield */}
    <Path
      d="M32 40 C36 28 64 28 68 40 L76 56 C76 56 60 54 50 54 C40 54 24 56 24 56 Z"
      fill="url(#ferrariGlass)"
      stroke="#1E293B"
      strokeWidth="1.5"
    />
    {/* Glass Reflection Highlight */}
    <Path d="M38 34 C44 31 56 31 62 34 L66 48 L60 48 L56 36 Z" fill="#FFFFFF" opacity={0.35} />

    {/* Main Curvaceous Red Bodywork */}
    <Path
      d="M14 68 C12 60 16 54 24 52 C28 50 34 50 36 44 C38 40 44 38 50 38 C56 38 62 40 64 44 C66 50 72 50 76 52 C84 54 88 60 86 68 C86 73 80 75 72 75 C60 76 40 76 28 75 C20 75 14 73 14 68 Z"
      fill="url(#ferrariBody)"
      stroke="#FEF08A"
      strokeWidth="1.2"
    />

    {/* Side Air Scoops & Carbon Skirts */}
    <Path d="M16 66 L26 63 L26 69 L16 70 Z" fill="#0F172A" />
    <Path d="M84 66 L74 63 L74 69 L84 70 Z" fill="#0F172A" />

    {/* Front Hood Line & Sculpted Power Creases */}
    <Path d="M38 54 L44 68 M62 54 L56 68" stroke="#7F1D1D" strokeWidth="1.5" strokeLinecap="round" />

    {/* Aggressive LED Headlights (Glowing Yellow/White) */}
    <Polygon points="24,60 34,63 32,67 22,64" fill="url(#ferrariLight)" stroke="#FEF08A" strokeWidth="1" />
    <Polygon points="76,60 66,63 68,67 78,64" fill="url(#ferrariLight)" stroke="#FEF08A" strokeWidth="1" />

    {/* Center Italian Tricolor / Ferrari Shield Dot on Hood */}
    <Rect x="47" y="60" width="6" height="7" rx="2" fill="#FDE047" stroke="#000000" strokeWidth="0.8" />
    <Circle cx="50" cy="63" r="1.5" fill="#DC2626" />

    {/* Front Carbon Splitter / Lower Grille */}
    <Rect x="34" y="70" width="32" height="4" rx="2" fill="#020617" stroke="#475569" strokeWidth="0.8" />
  </Svg>
);

/**
 * 2. LAMBORGHINI (30X Supercar)
 * Giallo Auge Electric Gold/Yellow Hypercar (Aventador / Huracán Style)
 * Sharp angular stealth-fighter lines, Y-shaped daytime LEDs & aggressive hood
 */
export const LamborghiniIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="lamboBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="30%" stopColor="#FACC15" />
        <Stop offset="70%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#A16207" />
      </LinearGradient>
      <LinearGradient id="lamboGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" stopOpacity={0.7} />
        <Stop offset="35%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#000000" />
      </LinearGradient>
      <LinearGradient id="lamboLed" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#67E8F9" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.7} />

    {/* Wheels (Black Stealth Rims with Gold Calipers) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#090D16" stroke="#CA8A04" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#EAB308" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#090D16" stroke="#CA8A04" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#EAB308" />

    {/* Angular Stealth Cockpit & Windshield */}
    <Polygon
      points="34,36 50,30 66,36 74,54 50,52 26,54"
      fill="url(#lamboGlass)"
      stroke="#020617"
      strokeWidth="1.5"
    />
    <Path d="M42 34 L50 31 L58 34 L62 44 L38 44 Z" fill="#FFFFFF" opacity={0.3} />

    {/* Razor-Sharp Angular Hypercar Body */}
    <Polygon
      points="50,42 70,46 86,54 88,68 76,74 50,76 24,74 12,68 14,54 30,46"
      fill="url(#lamboBody)"
      stroke="#78350F"
      strokeWidth="1.5"
    />

    {/* Hood Aerodynamic Sharp Creases */}
    <Path d="M50 42 L50 64 M34 52 L42 66 M66 52 L58 66" stroke="#78350F" strokeWidth="1.4" strokeLinecap="round" />

    {/* Signature Y-Shaped LED Headlights */}
    {/* Left Y-Light */}
    <Path d="M22 60 L28 62 L32 59 M28 62 L30 66" stroke="url(#lamboLed)" strokeWidth="2.2" strokeLinecap="round" />
    {/* Right Y-Light */}
    <Path d="M78 60 L72 62 L68 59 M72 62 L70 66" stroke="url(#lamboLed)" strokeWidth="2.2" strokeLinecap="round" />

    {/* Hexagonal Front Air Intakes (Black Carbon) */}
    <Polygon points="26,67 36,66 38,72 24,72" fill="#020617" stroke="#78350F" strokeWidth="1" />
    <Polygon points="74,67 64,66 62,72 76,72" fill="#020617" stroke="#78350F" strokeWidth="1" />

    {/* Center Golden Bull Badge on Hood */}
    <Polygon points="50,56 53,60 50,63 47,60" fill="#78350F" stroke="#FEF08A" strokeWidth="0.8" />
    <Circle cx="50" cy="59" r="1" fill="#FEF08A" />

    {/* Lower Carbon Splitter */}
    <Polygon points="36,73 64,73 68,76 32,76" fill="#020617" stroke="#EAB308" strokeWidth="1" />
  </Svg>
);

/**
 * 3. MASERATI (20X Supercar)
 * Blu Infinito Deep Royal Blue Supercar (MC20 Style)
 * Wide chrome oval grille with vertical trident slats & curvaceous sports coupe
 */
export const MaseratiIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="maseratiBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="30%" stopColor="#2563EB" />
        <Stop offset="70%" stopColor="#1D4ED8" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
      <LinearGradient id="maseratiGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#020617" />
      </LinearGradient>
      <LinearGradient id="chromeGrille" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels */}
    <Ellipse cx="18" cy="74" rx="7" ry="9" fill="#0F172A" stroke="#93C5FD" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#2563EB" />
    <Ellipse cx="82" cy="74" rx="7" ry="9" fill="#0F172A" stroke="#93C5FD" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#2563EB" />

    {/* Windshield & Roof */}
    <Path
      d="M34 38 C38 28 62 28 66 38 L74 54 C74 54 60 52 50 52 C40 52 26 54 26 54 Z"
      fill="url(#maseratiGlass)"
      stroke="#020617"
      strokeWidth="1.5"
    />

    {/* Main Curvaceous Deep Royal Blue Body */}
    <Path
      d="M14 66 C12 58 16 52 24 50 C28 48 34 46 38 42 C40 38 46 36 50 36 C54 36 60 38 62 42 C66 46 72 48 76 50 C84 52 88 58 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#maseratiBody)"
      stroke="#93C5FD"
      strokeWidth="1.5"
    />

    {/* Swept-Back Diamond LED Headlights */}
    <Polygon points="22,58 32,60 30,65 20,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />
    <Polygon points="78,58 68,60 70,65 80,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />

    {/* Wide Chrome Concave Grille with Vertical Slats */}
    <Ellipse cx="50" cy="67" rx="16" ry="7" fill="#020617" stroke="url(#chromeGrille)" strokeWidth="1.5" />
    <Path d="M42 63 L42 71 M46 62 L46 72 M50 62 L50 72 M54 62 L54 72 M58 63 L58 71" stroke="#94A3B8" strokeWidth="1.2" />

    {/* Red Trident Logo in Center Grille */}
    <Polygon points="50,63 52,67 50,66 48,67" fill="#EF4444" />
    <Path d="M48 64 L50 67 L52 64" stroke="#FFFFFF" strokeWidth="0.8" />
  </Svg>
);

/**
 * 4. PORSCHE (10X Supercar)
 * Racing Yellow Metallic Sports Coupe (911 GT3 RS Style)
 * Iconic rounded dual oval headlights, curved flyline & high-downforce GT rear wing
 */
export const PorscheIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="porscheBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="40%" stopColor="#FACC15" />
        <Stop offset="80%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#854D0E" />
      </LinearGradient>
      <LinearGradient id="porscheGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#E0F2FE" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (Black Centerlock GT Rims) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#090D16" stroke="#FACC15" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#EF4444" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#090D16" stroke="#FACC15" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#EF4444" />

    {/* Porsche 911 GT3 Rear Swan-Neck Wing */}
    <Path d="M18 42 L12 36 L15 34 L22 40 Z" fill="#0F172A" />
    <Path d="M82 42 L88 36 L85 34 L78 40 Z" fill="#0F172A" />
    <Rect x="14" y="32" width="72" height="3.5" rx="1.5" fill="#0F172A" stroke="#EAB308" strokeWidth="1" />

    {/* Classic Curved 911 Greenhouse / Windshield */}
    <Path
      d="M32 36 C36 24 64 24 68 36 L76 52 C76 52 60 50 50 50 C40 50 24 52 24 52 Z"
      fill="url(#porscheGlass)"
      stroke="#1E293B"
      strokeWidth="1.5"
    />

    {/* Iconic Wide-Fender Bodywork */}
    <Path
      d="M14 66 C12 56 16 50 24 48 C28 46 34 44 38 40 C42 36 46 34 50 34 C54 34 58 36 62 40 C66 44 72 46 76 48 C84 50 88 56 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#porscheBody)"
      stroke="#713F12"
      strokeWidth="1.5"
    />

    {/* Iconic Rounded Oval 4-Point LED Headlights */}
    {/* Left Headlight */}
    <Ellipse cx="28" cy="56" rx="5.5" ry="7.5" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" />
    <Circle cx="28" cy="56" r="3" fill="#67E8F9" />
    {/* Right Headlight */}
    <Ellipse cx="72" cy="56" rx="5.5" ry="7.5" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" />
    <Circle cx="72" cy="56" r="3" fill="#67E8F9" />

    {/* Hood Center Stuttgart Crest Shield */}
    <Polygon points="50,48 52,52 50,55 48,52" fill="#CA8A04" stroke="#EF4444" strokeWidth="0.8" />

    {/* Lower Triple Bumper Air Intakes */}
    <Rect x="24" y="66" width="12" height="6" rx="2" fill="#020617" stroke="#475569" strokeWidth="1" />
    <Rect x="40" y="66" width="20" height="6" rx="2" fill="#020617" stroke="#475569" strokeWidth="1" />
    <Rect x="64" y="66" width="12" height="6" rx="2" fill="#020617" stroke="#475569" strokeWidth="1" />
  </Svg>
);

/**
 * 5. MERCEDES-BENZ (5X Luxury Car)
 * Iridium Silver Chrome Luxury Sports Coupe (AMG GT Style)
 * Panamericana vertical chrome grille, center 3-pointed star & sculpted long hood
 */
export const MercedesIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="mercBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="35%" stopColor="#E2E8F0" />
        <Stop offset="70%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
      <LinearGradient id="mercGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#E0F2FE" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
      <LinearGradient id="mercChrome" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#CBD5E1" />
        <Stop offset="100%" stopColor="#64748B" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (Silver Multi-Spoke Rims) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="url(#mercChrome)" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#CBD5E1" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="url(#mercChrome)" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#CBD5E1" />

    {/* Swept-Back Luxury AMG Greenhouse */}
    <Path
      d="M34 38 C38 28 62 28 66 38 L74 54 C74 54 60 52 50 52 C40 52 26 54 26 54 Z"
      fill="url(#mercGlass)"
      stroke="#1E293B"
      strokeWidth="1.5"
    />

    {/* Muscular Long-Hood Body */}
    <Path
      d="M14 66 C12 58 16 52 24 50 C28 48 34 46 38 42 C40 38 46 36 50 36 C54 36 60 38 62 42 C66 46 72 48 76 50 C84 52 88 58 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#mercBody)"
      stroke="#E2E8F0"
      strokeWidth="1.5"
    />

    {/* Angular Multibeam LED Headlights */}
    <Polygon points="22,58 32,60 30,65 20,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />
    <Polygon points="78,58 68,60 70,65 80,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />

    {/* Panamericana Chrome Grille */}
    <Ellipse cx="50" cy="66" rx="16" ry="8" fill="#090D16" stroke="url(#mercChrome)" strokeWidth="1.8" />
    <Path d="M40 61 L40 71 M44 59 L44 73 M47 58 L47 74 M53 58 L53 74 M56 59 L56 73 M60 61 L60 71" stroke="#94A3B8" strokeWidth="1.4" />

    {/* Center 3-Pointed Silver Star Badge on Grille */}
    <Circle cx="50" cy="66" r="5" fill="#0F172A" stroke="url(#mercChrome)" strokeWidth="1" />
    <Polygon points="50,66 49,66 50,62" fill="#FFFFFF" />
    <Polygon points="50,66 50,67 53,69" fill="#FFFFFF" />
    <Polygon points="50,66 50,67 47,69" fill="#FFFFFF" />
  </Svg>
);

/**
 * 6. BMW (5X Luxury Car)
 * Marina Bay Metallic Azure Blue Sports Coupe (BMW M4 / M8 Style)
 * Double kidney grille, twin-halo LED headlights & aggressive M power hood
 */
export const BmwIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="bmwBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="40%" stopColor="#0284C7" />
        <Stop offset="80%" stopColor="#0369A1" />
        <Stop offset="100%" stopColor="#082F49" />
      </LinearGradient>
      <LinearGradient id="bmwGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#020617" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (M Double-Spoke Rims) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#0284C7" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#0284C7" />

    {/* Windshield & Carbon Roof */}
    <Path
      d="M34 38 C38 28 62 28 66 38 L74 54 C74 54 60 52 50 52 C40 52 26 54 26 54 Z"
      fill="url(#bmwGlass)"
      stroke="#020617"
      strokeWidth="1.5"
    />

    {/* Muscular M-Sport Body */}
    <Path
      d="M14 66 C12 58 16 52 24 50 C28 48 34 46 38 42 C40 38 46 36 50 36 C54 36 60 38 62 42 C66 46 72 48 76 50 C84 52 88 58 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#bmwBody)"
      stroke="#7DD3FC"
      strokeWidth="1.5"
    />

    {/* Twin-Halo Angel Eye LED Headlights */}
    <Polygon points="20,58 32,59 30,64 18,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />
    <Polygon points="80,58 68,59 70,64 82,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />

    {/* Iconic Double Kidney Grille */}
    {/* Left Kidney */}
    <Rect x="37" y="62" width="11" height="9" rx="3.5" fill="#020617" stroke="#E2E8F0" strokeWidth="1.4" />
    <Path d="M40 64 L40 69 M44 64 L44 69" stroke="#64748B" strokeWidth="1" />
    {/* Right Kidney */}
    <Rect x="52" y="62" width="11" height="9" rx="3.5" fill="#020617" stroke="#E2E8F0" strokeWidth="1.4" />
    <Path d="M56 64 L56 69 M60 64 L60 69" stroke="#64748B" strokeWidth="1" />

    {/* Roundel BMW Badge on Hood */}
    <Circle cx="50" cy="56" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="0.8" />
    <Path d="M50 56 L50 52.5 A3.5 3.5 0 0 1 53.5 56 Z" fill="#0284C7" />
    <Path d="M50 56 L50 59.5 A3.5 3.5 0 0 1 46.5 56 Z" fill="#0284C7" />
  </Svg>
);

/**
 * 7. AUDI (5X Luxury Car)
 * Nardo Grey / Platinum Silver Supercar (Audi R8 V10 Style)
 * Wide singleframe honeycomb grille, Matrix laser LED headlights & carbon sideblades
 */
export const AudiIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="audiBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="40%" stopColor="#CBD5E1" />
        <Stop offset="80%" stopColor="#94A3B8" />
        <Stop offset="100%" stopColor="#475569" />
      </LinearGradient>
      <LinearGradient id="audiGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#E2E8F0" stopOpacity={0.7} />
        <Stop offset="40%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#020617" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (5-Spoke Blade Rims) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#DC2626" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#DC2626" />

    {/* Cockpit & Windshield */}
    <Path
      d="M34 38 C38 28 62 28 66 38 L74 54 C74 54 60 52 50 52 C40 52 26 54 26 54 Z"
      fill="url(#audiGlass)"
      stroke="#1E293B"
      strokeWidth="1.5"
    />

    {/* Low-Slung R8 Supercar Body */}
    <Path
      d="M14 66 C12 58 16 52 24 50 C28 48 34 46 38 42 C40 38 46 36 50 36 C54 36 60 38 62 42 C66 46 72 48 76 50 C84 52 88 58 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#audiBody)"
      stroke="#F8FAFC"
      strokeWidth="1.5"
    />

    {/* Sharp Matrix Laser LED Headlights */}
    <Polygon points="20,58 32,60 30,65 18,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />
    <Polygon points="80,58 68,60 70,65 82,63" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1" />

    {/* Hexagonal Singleframe Honeycomb Grille */}
    <Polygon
      points="36,63 64,63 68,73 32,73"
      fill="#090D16"
      stroke="#475569"
      strokeWidth="1.5"
    />

    {/* 4 Interlocking Rings Logo on Top Grille */}
    <Circle cx="44" cy="66" r="2.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
    <Circle cx="48" cy="66" r="2.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
    <Circle cx="52" cy="66" r="2.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
    <Circle cx="56" cy="66" r="2.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
  </Svg>
);

/**
 * 8. VOLKSWAGEN (5X Luxury Car)
 * Lapiz Blue Metallic Sport Fastback (Golf R / Arteon Style)
 * Full-width LED lightbar, aggressive front bumper winglets & sporty silhouette
 */
export const VolkswagenIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="vwBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="40%" stopColor="#3B82F6" />
        <Stop offset="80%" stopColor="#1D4ED8" />
        <Stop offset="100%" stopColor="#1E3A8A" />
      </LinearGradient>
      <LinearGradient id="vwGlass" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#DBEAFE" stopOpacity={0.8} />
        <Stop offset="40%" stopColor="#1E293B" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
    </Defs>
    {/* Road Shadow */}
    <Ellipse cx="50" cy="80" rx="42" ry="7" fill="#000000" opacity={0.65} />

    {/* Wheels (Estoril Diamond-Cut Rims with Blue R Calipers) */}
    <Ellipse cx="18" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#93C5FD" strokeWidth="1.5" />
    <Circle cx="18" cy="74" r="3" fill="#3B82F6" />
    <Ellipse cx="82" cy="74" rx="7.5" ry="9" fill="#0F172A" stroke="#93C5FD" strokeWidth="1.5" />
    <Circle cx="82" cy="74" r="3" fill="#3B82F6" />

    {/* Hatchback / Fastback Greenhouse */}
    <Path
      d="M34 38 C38 28 62 28 66 38 L74 54 C74 54 60 52 50 52 C40 52 26 54 26 54 Z"
      fill="url(#vwGlass)"
      stroke="#1E293B"
      strokeWidth="1.5"
    />

    {/* Sporty Lapiz Blue Body */}
    <Path
      d="M14 66 C12 58 16 52 24 50 C28 48 34 46 38 42 C40 38 46 36 50 36 C54 36 60 38 62 42 C66 46 72 48 76 50 C84 52 88 58 86 66 C86 73 80 75 70 75 C60 76 40 76 30 75 C20 75 14 73 14 66 Z"
      fill="url(#vwBody)"
      stroke="#BFDBFE"
      strokeWidth="1.5"
    />

    {/* Full-Width Front LED Lightbar & Headlights */}
    <Path d="M22 61 L78 61" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    <Polygon points="20,58 30,59 28,64 18,63" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1" />
    <Polygon points="80,58 70,59 72,64 82,63" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1" />

    {/* Center Round VW Monogram Badge */}
    <Circle cx="50" cy="62" r="4.5" fill="#1E3A8A" stroke="#FFFFFF" strokeWidth="1" />
    <Path d="M47 59.5 L50 63.5 L53 59.5 M46 62.5 L48.5 65 L50 63 M54 62.5 L51.5 65 L50 63" stroke="#FFFFFF" strokeWidth="0.8" />

    {/* Lower R Sport Grille with Blue Accent */}
    <Rect x="30" y="68" width="40" height="5" rx="2" fill="#090D16" stroke="#3B82F6" strokeWidth="1" />
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
    <Circle cx="50" cy="50" r="42" stroke="url(#wheelRim)" strokeWidth="7" fill="none" />
    <Path d="M12 40 C10 46 10 54 12 60" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
    <Path d="M88 40 C90 46 90 54 88 60" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="50" cy="52" r="16" fill="#1E293B" stroke="url(#spokeSilver)" strokeWidth="2.5" />
    <Circle cx="50" cy="52" r="7" fill="#EF4444" />
    <Path d="M47 52 L53 52 M50 49 L50 55" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M15 50 L34 52" stroke="url(#spokeSilver)" strokeWidth="6" strokeLinecap="round" />
    <Path d="M85 50 L66 52" stroke="url(#spokeSilver)" strokeWidth="6" strokeLinecap="round" />
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
    <Path
      d="M20 75 A40 40 0 1 1 80 75"
      stroke="#334155"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M20 75 A40 40 0 1 1 80 75"
      stroke="url(#gaugeArc)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray="188"
      strokeDashoffset={188 * (1 - Math.min(1, Math.max(0.1, speedPct)))}
      fill="none"
    />
    <Circle cx="50" cy="55" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
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
    <Path d="M18 10 L18 90" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
    <Circle cx="18" cy="10" r="4" fill="#F59E0B" />
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

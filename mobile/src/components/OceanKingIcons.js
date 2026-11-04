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
 * 1. Clownfish (Nemo) - 2X Safe Multiplier
 * Bright orange clownfish with 3 white stripes, black trims, fins and friendly eye
 */
export const ClownfishIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="clownBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FB923C" />
        <Stop offset="50%" stopColor="#EA580C" />
        <Stop offset="100%" stopColor="#C2410C" />
      </LinearGradient>
      <LinearGradient id="clownFin" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FDBA74" />
        <Stop offset="100%" stopColor="#EA580C" />
      </LinearGradient>
    </Defs>
    {/* Tail Fin */}
    <Path d="M72 50 L92 32 C92 42 90 48 92 68 Z" fill="url(#clownFin)" stroke="#7C2D12" strokeWidth="1.5" />
    <Path d="M86 38 C84 45 84 55 86 62" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Dorsal Fin */}
    <Path d="M40 28 C48 16 62 18 68 28 Z" fill="url(#clownFin)" stroke="#7C2D12" strokeWidth="1.5" />
    
    {/* Main Fish Body (Oval) */}
    <Ellipse cx="48" cy="50" rx="30" ry="22" fill="url(#clownBody)" stroke="#7C2D12" strokeWidth="1.5" />
    
    {/* Pectoral Fin */}
    <Path d="M42 54 C48 58 52 64 48 70 C42 68 40 60 42 54 Z" fill="#FDBA74" stroke="#7C2D12" strokeWidth="1" />

    {/* White Stripes with Black Border */}
    {/* Stripe 1 (Head) */}
    <Path d="M30 33 C33 44 33 56 30 67 C26 65 24 55 24 45 C24 35 26 34 30 33 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="1.2" />
    {/* Stripe 2 (Middle) */}
    <Path d="M48 29 C52 43 52 57 48 71 C44 70 42 57 42 43 C42 30 44 29 48 29 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="1.2" />
    {/* Stripe 3 (Base of tail) */}
    <Path d="M68 37 C70 46 70 54 68 63 C65 62 64 54 64 46 C64 38 65 38 68 37 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="1.2" />

    {/* Eye */}
    <Circle cx="22" cy="46" r="4.5" fill="#FFFFFF" stroke="#7C2D12" strokeWidth="1" />
    <Circle cx="21" cy="46" r="2.5" fill="#0F172A" />
    <Circle cx="20" cy="44.5" r="1" fill="#FFFFFF" />

    {/* Smile */}
    <Path d="M16 52 C18 55 21 55 23 53" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * 2. Pufferfish (Blowfish) - 4X Multiplier
 * Spiky cute golden-yellow pufferfish puffed up like a balloon with thorns and pout
 */
export const PufferfishIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="pufferBody" cx="46" cy="46" r="40">
        <Stop offset="0%" stopColor="#FEF08A" />
        <Stop offset="45%" stopColor="#FACC15" />
        <Stop offset="85%" stopColor="#EAB308" />
        <Stop offset="100%" stopColor="#CA8A04" />
      </RadialGradient>
    </Defs>
    {/* Tail */}
    <Path d="M78 50 L92 38 C90 48 90 52 92 62 Z" fill="#EAB308" stroke="#854D0E" strokeWidth="1.5" />
    
    {/* Spikes / Thorns */}
    <Polygon points="50,12 47,20 53,20" fill="#CA8A04" />
    <Polygon points="32,16 32,24 38,22" fill="#CA8A04" />
    <Polygon points="68,18 62,24 67,26" fill="#CA8A04" />
    <Polygon points="20,28 26,33 22,37" fill="#CA8A04" />
    <Polygon points="80,30 74,35 77,39" fill="#CA8A04" />
    <Polygon points="12,50 20,47 20,53" fill="#CA8A04" />
    <Polygon points="18,70 24,65 26,71" fill="#CA8A04" />
    <Polygon points="82,68 76,64 78,72" fill="#CA8A04" />
    <Polygon points="32,84 34,76 38,80" fill="#CA8A04" />
    <Polygon points="50,88 47,80 53,80" fill="#CA8A04" />
    <Polygon points="68,82 64,75 69,76" fill="#CA8A04" />

    {/* Round Puffed Body */}
    <Circle cx="50" cy="50" r="32" fill="url(#pufferBody)" stroke="#854D0E" strokeWidth="2" />
    
    {/* White Belly Arch */}
    <Path d="M26 56 C26 74 74 74 74 56 C62 66 38 66 26 56 Z" fill="#FEFCE8" opacity={0.75} />

    {/* Big Anime Eyes */}
    <Circle cx="35" cy="42" r="7" fill="#FFFFFF" stroke="#854D0E" strokeWidth="1.2" />
    <Circle cx="34" cy="42" r="4.5" fill="#1E293B" />
    <Circle cx="32.5" cy="40.5" r="1.8" fill="#FFFFFF" />

    <Circle cx="55" cy="42" r="7" fill="#FFFFFF" stroke="#854D0E" strokeWidth="1.2" />
    <Circle cx="54" cy="42" r="4.5" fill="#1E293B" />
    <Circle cx="52.5" cy="40.5" r="1.8" fill="#FFFFFF" />

    {/* Cheek Blushes */}
    <Ellipse cx="28" cy="52" rx="3.5" ry="2" fill="#F43F5E" opacity={0.5} />
    <Ellipse cx="62" cy="52" rx="3.5" ry="2" fill="#F43F5E" opacity={0.5} />

    {/* Pouty Lips */}
    <Path d="M42 54 C45 52 45 52 48 54 C45 57 45 57 42 54 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
  </Svg>
);

/**
 * 3. Electric Octopus - 8X Multiplier
 * Neon purple/magenta glowing octopus with suction cups and curled tentacles
 */
export const OctopusIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="octoGlow" cx="50" cy="40" r="38">
        <Stop offset="0%" stopColor="#E879F9" />
        <Stop offset="40%" stopColor="#C026D3" />
        <Stop offset="80%" stopColor="#9333EA" />
        <Stop offset="100%" stopColor="#581C87" />
      </RadialGradient>
    </Defs>
    {/* Tentacles */}
    {/* Far Left */}
    <Path d="M30 52 C20 58 12 70 20 84 C26 86 30 78 28 70 C28 62 34 56 38 54" stroke="#C026D3" strokeWidth="5.5" strokeLinecap="round" />
    {/* Mid Left */}
    <Path d="M38 56 C30 66 26 78 36 86 C42 86 42 76 38 68 C38 62 42 58 44 56" stroke="#9333EA" strokeWidth="5.5" strokeLinecap="round" />
    {/* Center Left */}
    <Path d="M46 58 C44 70 42 84 48 90 C54 90 52 78 50 68" stroke="#C026D3" strokeWidth="5.5" strokeLinecap="round" />
    {/* Center Right */}
    <Path d="M54 58 C56 70 58 84 52 90 C46 90 48 78 50 68" stroke="#9333EA" strokeWidth="5.5" strokeLinecap="round" />
    {/* Mid Right */}
    <Path d="M62 56 C70 66 74 78 64 86 C58 86 58 76 62 68 C62 62 58 58 56 56" stroke="#C026D3" strokeWidth="5.5" strokeLinecap="round" />
    {/* Far Right */}
    <Path d="M70 52 C80 58 88 70 80 84 C74 86 70 78 72 70 C72 62 66 56 62 54" stroke="#9333EA" strokeWidth="5.5" strokeLinecap="round" />

    {/* Suction Cups (Yellow dots) */}
    <Circle cx="18" cy="74" r="1.5" fill="#FEF08A" />
    <Circle cx="22" cy="80" r="1.5" fill="#FEF08A" />
    <Circle cx="82" cy="74" r="1.5" fill="#FEF08A" />
    <Circle cx="78" cy="80" r="1.5" fill="#FEF08A" />

    {/* Big Head / Bulb */}
    <Ellipse cx="50" cy="38" rx="26" ry="24" fill="url(#octoGlow)" stroke="#F0ABFC" strokeWidth="1.5" />
    
    {/* Forehead Sparkle */}
    <Circle cx="40" cy="24" r="3" fill="#FFFFFF" opacity={0.6} />

    {/* Big Glowing Eyes */}
    <Circle cx="40" cy="40" r="6" fill="#0F172A" stroke="#FDF4FF" strokeWidth="1.2" />
    <Circle cx="41.5" cy="39" r="2.2" fill="#38BDF8" />
    <Circle cx="42" cy="38.5" r="1" fill="#FFFFFF" />

    <Circle cx="60" cy="40" r="6" fill="#0F172A" stroke="#FDF4FF" strokeWidth="1.2" />
    <Circle cx="58.5" cy="39" r="2.2" fill="#38BDF8" />
    <Circle cx="58" cy="38.5" r="1" fill="#FFFFFF" />

    {/* Cute Mouth */}
    <Circle cx="50" cy="48" r="2.5" fill="#581C87" />
  </Svg>
);

/**
 * 4. Golden Sea Turtle - 15X Multiplier
 * Emerald green & golden patterned shell sea turtle with flippers
 */
export const TurtleIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="turtleShell" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="30%" stopColor="#10B981" />
        <Stop offset="70%" stopColor="#047857" />
        <Stop offset="100%" stopColor="#064E3B" />
      </LinearGradient>
      <LinearGradient id="turtleSkin" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#6EE7B7" />
        <Stop offset="100%" stopColor="#10B981" />
      </LinearGradient>
    </Defs>
    {/* Rear Flippers */}
    <Path d="M32 64 C20 72 16 84 26 86 C32 82 36 74 36 68 Z" fill="url(#turtleSkin)" stroke="#064E3B" strokeWidth="1.2" />
    <Path d="M68 64 C80 72 84 84 74 86 C68 82 64 74 64 68 Z" fill="url(#turtleSkin)" stroke="#064E3B" strokeWidth="1.2" />
    
    {/* Tiny Tail */}
    <Polygon points="50,78 46,88 54,88" fill="#10B981" stroke="#064E3B" strokeWidth="1" />

    {/* Front Flippers */}
    <Path d="M28 42 C12 32 6 18 16 16 C26 22 32 32 34 38 Z" fill="url(#turtleSkin)" stroke="#064E3B" strokeWidth="1.2" />
    <Path d="M72 42 C88 32 94 18 84 16 C74 22 68 32 66 38 Z" fill="url(#turtleSkin)" stroke="#064E3B" strokeWidth="1.2" />

    {/* Head */}
    <Ellipse cx="50" cy="22" rx="10" ry="12" fill="url(#turtleSkin)" stroke="#064E3B" strokeWidth="1.5" />
    {/* Turtle Eyes */}
    <Circle cx="44" cy="20" r="2.2" fill="#064E3B" />
    <Circle cx="43.5" cy="19.5" r="0.7" fill="#FFFFFF" />
    <Circle cx="56" cy="20" r="2.2" fill="#064E3B" />
    <Circle cx="55.5" cy="19.5" r="0.7" fill="#FFFFFF" />

    {/* Big Dome Shell */}
    <Ellipse cx="50" cy="52" rx="26" ry="28" fill="url(#turtleShell)" stroke="#FDE047" strokeWidth="2" />

    {/* Golden Hexagon Patterns on Shell */}
    <Polygon points="50,34 60,40 60,52 50,58 40,52 40,40" fill="none" stroke="#FDE047" strokeWidth="1.5" />
    <Polygon points="50,58 60,64 60,72 50,76 40,72 40,64" fill="none" stroke="#FDE047" strokeWidth="1.5" />
    <Path d="M40 40 L26 36 M60 40 L74 36 M40 52 L24 54 M60 52 L76 54 M40 64 L28 68 M60 64 L72 68" stroke="#FDE047" strokeWidth="1.5" />
  </Svg>
);

/**
 * 5. Hammerhead Shark - 30X Multiplier
 * Sleek, aggressive deep sea shark with glowing azure eyes and dorsal fin
 */
export const SharkIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="sharkBody" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="50%" stopColor="#0284C7" />
        <Stop offset="100%" stopColor="#0369A1" />
      </LinearGradient>
      <LinearGradient id="sharkBelly" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#F0F9FF" />
        <Stop offset="100%" stopColor="#BAE6FD" />
      </LinearGradient>
    </Defs>
    {/* Tail Fin */}
    <Path d="M72 48 L94 24 C90 40 88 48 94 68 L80 54 Z" fill="url(#sharkBody)" stroke="#0C4A6E" strokeWidth="1.5" />
    
    {/* Dorsal Fin */}
    <Path d="M46 36 L52 14 C56 20 62 28 64 36 Z" fill="url(#sharkBody)" stroke="#0C4A6E" strokeWidth="1.5" />

    {/* Shark Main Torpedo Body */}
    <Path d="M12 42 C12 36 28 36 46 36 C66 36 78 44 80 50 C78 56 66 62 46 62 C28 62 12 56 12 48 Z" fill="url(#sharkBody)" stroke="#0C4A6E" strokeWidth="1.5" />

    {/* Hammerhead T-Bar at Nose */}
    <Path d="M12 30 C16 30 18 36 18 48 C18 60 16 66 12 66 C8 66 6 60 6 48 C6 36 8 30 12 30 Z" fill="#0284C7" stroke="#0C4A6E" strokeWidth="1.5" />
    
    {/* Glowing Predator Eyes at Hammerhead tips */}
    <Circle cx="12" cy="33" r="2.5" fill="#FEF08A" stroke="#0C4A6E" strokeWidth="1" />
    <Circle cx="12" cy="63" r="2.5" fill="#FEF08A" stroke="#0C4A6E" strokeWidth="1" />

    {/* White Belly Swath */}
    <Path d="M22 52 C34 52 64 56 74 52 C68 58 50 61 22 58 Z" fill="url(#sharkBelly)" opacity={0.85} />

    {/* Sharp Gills */}
    <Path d="M38 42 L36 48 M42 41 L40 49 M46 42 L44 48" stroke="#0C4A6E" strokeWidth="1.5" strokeLinecap="round" />

    {/* Lower Pectoral Fin */}
    <Path d="M38 58 L28 74 C34 72 40 68 44 58 Z" fill="#0369A1" stroke="#0C4A6E" strokeWidth="1.2" />
  </Svg>
);

/**
 * 6. Deep Sea Mermaid - 60X Multiplier
 * Majestic siren with glowing aquatic hair, golden crown, and shimmering teal fish tail
 */
export const MermaidIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="mermaidHair" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="50%" stopColor="#DB2777" />
        <Stop offset="100%" stopColor="#9D174D" />
      </LinearGradient>
      <LinearGradient id="mermaidTail" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#2DD4BF" />
        <Stop offset="50%" stopColor="#0D9488" />
        <Stop offset="100%" stopColor="#115E59" />
      </LinearGradient>
    </Defs>
    {/* Tail Flukes */}
    <Path d="M60 78 C70 82 82 88 88 84 C84 76 76 74 66 70 Z" fill="url(#mermaidTail)" stroke="#042F2E" strokeWidth="1.2" />
    <Path d="M60 80 C66 88 74 96 82 94 C80 88 74 80 64 74 Z" fill="url(#mermaidTail)" stroke="#042F2E" strokeWidth="1.2" />

    {/* Curving Shimmering Tail Body */}
    <Path d="M46 54 C50 62 56 68 62 74 C54 74 46 66 42 54 Z" fill="url(#mermaidTail)" stroke="#5EEAD4" strokeWidth="1.5" />
    {/* Tail Scales */}
    <Circle cx="50" cy="62" r="1.5" fill="#CCFBF1" />
    <Circle cx="55" cy="68" r="1.5" fill="#CCFBF1" />

    {/* Flowing Mermaid Hair Behind */}
    <Path d="M34 26 C22 28 18 42 22 56 C26 66 32 72 38 74 C34 64 32 50 36 38 Z" fill="url(#mermaidHair)" />

    {/* Torso & Head */}
    <Ellipse cx="42" cy="46" rx="6" ry="8" fill="#FCE7F3" stroke="#9D174D" strokeWidth="1" />
    <Circle cx="44" cy="30" r="8" fill="#FCE7F3" stroke="#9D174D" strokeWidth="1" />

    {/* Golden Crown */}
    <Polygon points="40,24 42,20 44,23 46,19 48,23 50,20 52,24" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />

    {/* Seashell Top */}
    <Circle cx="41" cy="44" r="3" fill="#F472B6" />
    <Circle cx="46" cy="45" r="3" fill="#F472B6" />

    {/* Eye & Smile */}
    <Circle cx="46" cy="30" r="1.2" fill="#0F172A" />
    <Path d="M44 34 C45 35 46 35 47 34" stroke="#BE185D" strokeWidth="1" strokeLinecap="round" />

    {/* Sea Pearls */}
    <Circle cx="30" cy="20" r="1.8" fill="#FFFFFF" />
    <Circle cx="64" cy="36" r="2.2" fill="#FFFFFF" />
  </Svg>
);

/**
 * 7. Mega Kraken - 120X Multiplier
 * Deep abyss colossus squid with glowing red cyclops eye and monstrous razor suction tentacles
 */
export const KrakenIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="krakenCore" cx="50" cy="46" r="36">
        <Stop offset="0%" stopColor="#A855F7" />
        <Stop offset="50%" stopColor="#6B21A8" />
        <Stop offset="90%" stopColor="#3B0764" />
        <Stop offset="100%" stopColor="#1E0538" />
      </RadialGradient>
    </Defs>
    {/* Giant Curled Outer Tentacles */}
    <Path d="M26 48 C14 54 8 72 16 86 C24 92 30 84 26 74 C22 66 30 58 36 54" stroke="#7E22CE" strokeWidth="6" strokeLinecap="round" />
    <Path d="M74 48 C86 54 92 72 84 86 C76 92 70 84 74 74 C78 66 70 58 64 54" stroke="#7E22CE" strokeWidth="6" strokeLinecap="round" />
    
    <Path d="M36 56 C28 68 28 84 38 92 C46 94 48 82 42 72" stroke="#6B21A8" strokeWidth="6" strokeLinecap="round" />
    <Path d="M64 56 C72 68 72 84 62 92 C54 94 52 82 58 72" stroke="#6B21A8" strokeWidth="6" strokeLinecap="round" />

    {/* Center Grasping Arms */}
    <Path d="M46 62 C42 74 44 86 50 94" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
    <Path d="M54 62 C58 74 56 86 50 94" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />

    {/* Sharp Spiked Mantle (Squid Cone) */}
    <Path d="M50 10 L68 36 C68 46 62 54 50 56 C38 54 32 46 32 36 Z" fill="url(#krakenCore)" stroke="#C084FC" strokeWidth="2" />
    {/* Mantle Fins */}
    <Polygon points="50,10 64,18 56,24" fill="#581C87" />
    <Polygon points="50,10 36,18 44,24" fill="#581C87" />

    {/* Menacing Glowing Cyclops Eye */}
    <Circle cx="50" cy="40" r="9" fill="#18022E" stroke="#EF4444" strokeWidth="2.5" />
    <Circle cx="50" cy="40" r="5" fill="#EF4444" />
    <Circle cx="50" cy="40" r="2.5" fill="#FDE047" />
    <Circle cx="51.5" cy="38.5" r="1" fill="#FFFFFF" />

    {/* Suction Cups */}
    <Circle cx="16" cy="74" r="2" fill="#F472B6" />
    <Circle cx="84" cy="74" r="2" fill="#F472B6" />
  </Svg>
);

/**
 * 8. Golden Dragon King (Leviathan) - 300X Grand Multiplier
 * Majestic Oriental Dragon King with golden horns, flaming whiskers, and cosmic pearls
 */
export const GoldenDragonIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="dragonGold" cx="50" cy="48" r="46">
        <Stop offset="0%" stopColor="#FFFBEB" />
        <Stop offset="30%" stopColor="#FEF08A" />
        <Stop offset="60%" stopColor="#F59E0B" />
        <Stop offset="90%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#78350F" />
      </RadialGradient>
      <LinearGradient id="fireMane" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="50%" stopColor="#F97316" />
        <Stop offset="100%" stopColor="#FBBF24" />
      </LinearGradient>
    </Defs>
    {/* Glowing Golden Aura Disk */}
    <Circle cx="50" cy="50" r="46" fill="url(#dragonGold)" stroke="#FDE047" strokeWidth="2" />
    <Circle cx="50" cy="50" r="41" stroke="#FFFBEB" strokeWidth="1" strokeOpacity={0.6} fill="none" />

    {/* Flaming Dragon Antlers / Horns */}
    <Path d="M36 28 C30 18 24 14 18 16 C22 22 28 26 34 32" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
    <Path d="M26 18 C26 22 30 26 32 28" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

    <Path d="M64 28 C70 18 76 14 82 16 C78 22 72 26 66 32" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
    <Path d="M74 18 C74 22 70 26 68 28" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

    {/* Fiery Mane */}
    <Path d="M18 42 C14 34 20 28 26 34 C20 40 18 46 22 52" fill="url(#fireMane)" />
    <Path d="M82 42 C86 34 80 28 74 34 C80 40 82 46 78 52" fill="url(#fireMane)" />

    {/* Dragon Face Silhouette */}
    <Path d="M30 40 C34 32 66 32 70 40 C72 50 68 62 50 66 C32 62 28 50 30 40 Z" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />

    {/* Snout & Whiskers */}
    <Ellipse cx="50" cy="56" rx="14" ry="9" fill="#FDE047" stroke="#92400E" strokeWidth="1.5" />
    <Circle cx="44" cy="54" r="2" fill="#78350F" />
    <Circle cx="56" cy="54" r="2" fill="#78350F" />

    {/* Long Golden Whiskers */}
    <Path d="M40 58 C26 62 14 54 8 64" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M60 58 C74 62 86 54 92 64" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

    {/* Dragon Piercing Ruby Eyes */}
    <Polygon points="36,42 44,40 42,46" fill="#DC2626" />
    <Circle cx="40" cy="43" r="1.5" fill="#FEF08A" />

    <Polygon points="64,42 56,40 58,46" fill="#DC2626" />
    <Circle cx="60" cy="43" r="1.5" fill="#FEF08A" />

    {/* Dragon Pearl in Mouth */}
    <Circle cx="50" cy="74" r="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
    <Circle cx="48" cy="72" r="2.5" fill="#67E8F9" />
  </Svg>
);

/**
 * 9. Poseidon's Trident (Surge Weapon Icon)
 * Glowing 3-prong lightning trident
 */
export const TridentIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="tridentGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#FFFBEB" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
    </Defs>
    {/* Center Staff */}
    <Rect x="47" y="38" width="6" height="54" rx="3" fill="url(#tridentGold)" stroke="#78350F" strokeWidth="1" />
    
    {/* Center Spear Tip */}
    <Polygon points="50,6 43,26 47,26 47,40 53,40 53,26 57,26" fill="url(#tridentGold)" stroke="#78350F" strokeWidth="1.2" />

    {/* Left Curved Prong */}
    <Path d="M47 38 C32 38 24 28 22 14 L28 16 C30 26 36 32 47 32" fill="url(#tridentGold)" stroke="#78350F" strokeWidth="1" />
    <Polygon points="22,14 18,22 25,20" fill="url(#tridentGold)" />

    {/* Right Curved Prong */}
    <Path d="M53 38 C68 38 76 28 78 14 L72 16 C70 26 64 32 53 32" fill="url(#tridentGold)" stroke="#78350F" strokeWidth="1" />
    <Polygon points="78,14 82,22 75,20" fill="url(#tridentGold)" />

    {/* Energy Sparks */}
    <Circle cx="50" cy="18" r="2" fill="#38BDF8" />
    <Circle cx="21" cy="20" r="1.5" fill="#38BDF8" />
    <Circle cx="79" cy="20" r="1.5" fill="#38BDF8" />
  </Svg>
);

/**
 * 10. Submarine Radar Sonar Icon (Header Badge)
 */
export const SubmarineRadarIcon = ({ size = 34 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Circle cx="50" cy="50" r="46" fill="#041E34" stroke="#00F5D4" strokeWidth="2.5" />
    <Circle cx="50" cy="50" r="32" stroke="#00F5D4" strokeWidth="1.2" strokeOpacity={0.6} fill="none" />
    <Circle cx="50" cy="50" r="18" stroke="#00F5D4" strokeWidth="1.2" strokeOpacity={0.4} fill="none" />
    {/* Crosshairs */}
    <Path d="M50 4 L50 96 M4 50 L96 50" stroke="#00F5D4" strokeWidth="1" strokeOpacity={0.5} />
    {/* Radar Sweep Ray */}
    <Polygon points="50,50 82,18 90,32" fill="#00F5D4" opacity={0.35} />
    {/* Target Blip */}
    <Circle cx="70" cy="30" r="3.5" fill="#FDE047" />
  </Svg>
);


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
} from 'react-native-svg';

/**
 * 1. Chocolate Icon (Win 5 times)
 * Rich brown chocolate bar with silver foil wrapper and etched chocolate blocks
 */
export const ChocolateIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="chocGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#8D5B4C" />
        <Stop offset="50%" stopColor="#5D3A29" />
        <Stop offset="100%" stopColor="#3E271E" />
      </LinearGradient>
      <LinearGradient id="foilGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#E2E8F0" />
        <Stop offset="50%" stopColor="#CBD5E1" />
        <Stop offset="100%" stopColor="#94A3B8" />
      </LinearGradient>
      <LinearGradient id="wrapperGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
    </Defs>
    {/* Chocolate Bar Body */}
    <Rect x="14" y="8" width="36" height="48" rx="6" fill="url(#chocGrad)" stroke="#3E271E" strokeWidth="1.5" />
    {/* Grid of chocolate squares (top row exposed) */}
    <Rect x="18" y="12" width="12" height="11" rx="2" fill="#784838" />
    <Rect x="34" y="12" width="12" height="11" rx="2" fill="#6B3E2E" />
    <Rect x="18" y="26" width="12" height="11" rx="2" fill="#6B3E2E" />
    <Rect x="34" y="26" width="12" height="11" rx="2" fill="#5D3525" />
    {/* Foil paper wrapper with crinkled edges */}
    <Path d="M12 36 L24 33 L38 37 L52 34 L52 56 L12 56 Z" fill="url(#foilGrad)" />
    {/* Red outer wrapper sleeve */}
    <Rect x="12" y="40" width="40" height="18" rx="4" fill="url(#wrapperGrad)" />
    {/* Golden brand band */}
    <Rect x="12" y="46" width="40" height="5" fill="#FBBF24" opacity="0.9" />
  </Svg>
);

/**
 * 2. Pastry Icon (Win 5 times)
 * Layered chocolate/strawberry pastry slice topped with cream and bright red cherry
 */
export const PastryIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="spongeGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
      <LinearGradient id="chocPastry" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#78350F" />
        <Stop offset="100%" stopColor="#451A03" />
      </LinearGradient>
      <LinearGradient id="cherryGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#F43F5E" />
        <Stop offset="100%" stopColor="#9F1239" />
      </LinearGradient>
    </Defs>
    {/* Pastry Triangular Slice Base */}
    <Path d="M10 46 L32 20 L54 46 Z" fill="url(#spongeGrad)" />
    {/* Bottom Cake Layer */}
    <Path d="M10 46 L54 46 L52 52 L12 52 Z" fill="url(#chocPastry)" />
    {/* Middle Cream Layer (Vanilla Cream) */}
    <Path d="M16 39 L48 39 L46 43 L18 43 Z" fill="#FFFBEB" />
    {/* Strawberry Jelly / Jam Layer */}
    <Path d="M21 33 L43 33 L41 36 L23 36 Z" fill="#FB7185" />
    {/* Top Whipped Cream & Frosting */}
    <Path
      d="M32 20 C28 17 22 22 20 25 C18 29 25 31 32 30 C39 31 46 29 44 25 C42 22 36 17 32 20 Z"
      fill="#FFFFFF"
    />
    {/* Glossy Red Cherry on Top */}
    <Circle cx="32" cy="15" r="6" fill="url(#cherryGrad)" />
    <Circle cx="30" cy="13" r="1.5" fill="#FFFFFF" opacity="0.8" />
    {/* Cherry Stem */}
    <Path d="M33 11 C35 7 40 6 42 8" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * 3. Burger Icon (Win 5 times)
 * Juicy double cheeseburger with sesame seeds, green lettuce, tomato and melted cheese
 */
export const BurgerIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bunTop" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="60%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
      <LinearGradient id="pattyGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#78350F" />
        <Stop offset="100%" stopColor="#451A03" />
      </LinearGradient>
      <LinearGradient id="bunBottom" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </LinearGradient>
    </Defs>
    {/* Top Bun with Dome */}
    <Path d="M12 28 C12 16 22 10 32 10 C42 10 52 16 52 28 Z" fill="url(#bunTop)" />
    {/* White Sesame Seeds */}
    <Circle cx="24" cy="18" r="1" fill="#FEF3C7" />
    <Circle cx="32" cy="15" r="1.2" fill="#FEF3C7" />
    <Circle cx="40" cy="19" r="1" fill="#FEF3C7" />
    <Circle cx="28" cy="22" r="1" fill="#FEF3C7" />
    <Circle cx="36" cy="22" r="1" fill="#FEF3C7" />
    {/* Green Wavy Lettuce */}
    <Path
      d="M10 29 C12 33 16 27 20 30 C24 33 28 27 32 30 C36 33 40 27 44 30 C48 33 52 28 54 29 L54 31 L10 31 Z"
      fill="#22C55E"
    />
    {/* Red Tomato Slice */}
    <Rect x="12" y="32" width="40" height="4" rx="2" fill="#EF4444" />
    {/* Melted Yellow Cheese Triangle drip */}
    <Path d="M11 36 L53 36 L48 42 L42 38 L30 43 L22 37 L11 36 Z" fill="#FACC15" />
    {/* Grilled Meat Patty */}
    <Rect x="10" y="39" width="44" height="7" rx="3.5" fill="url(#pattyGrad)" />
    {/* Bottom Bun */}
    <Path d="M14 47 C14 47 14 55 32 55 C50 55 50 47 50 47 Z" fill="url(#bunBottom)" />
  </Svg>
);

/**
 * 4. Pani Puri Icon (Win 5 times)
 * Crispy golden round golgappa bowl filled with tangy green mint-coriander water & spices
 */
export const PaniPuriIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="puriGrad" cx="32" cy="36" r="26" fx="28" fy="24">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="40%" stopColor="#F59E0B" />
        <Stop offset="85%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#92400E" />
      </RadialGradient>
      <LinearGradient id="paniGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#10B981" />
        <Stop offset="50%" stopColor="#059669" />
        <Stop offset="100%" stopColor="#047857" />
      </LinearGradient>
    </Defs>
    {/* Crispy Golden Sphere / Puri Shell */}
    <Circle cx="32" cy="34" r="22" fill="url(#puriGrad)" />
    {/* Puri Top Hole Edge (Cracked crispy crust) */}
    <Ellipse cx="32" cy="24" rx="15" ry="9" fill="#B45309" />
    {/* Green Spicy Mint Tangy Water (Pani) Inside */}
    <Ellipse cx="32" cy="25" rx="13.5" ry="7.5" fill="url(#paniGrad)" />
    {/* Fresh Boondi & Spices Floating */}
    <Circle cx="26" cy="24" r="2.2" fill="#FBBF24" />
    <Circle cx="34" cy="23" r="2.5" fill="#FBBF24" />
    <Circle cx="39" cy="25" r="1.8" fill="#FBBF24" />
    <Circle cx="30" cy="27" r="1.5" fill="#FBBF24" />
    {/* Red Chili & Mint Garnish flake */}
    <Circle cx="28" cy="26" r="1" fill="#EF4444" />
    <Circle cx="36" cy="26" r="1" fill="#EF4444" />
    {/* Glossy reflection on crispy puri */}
    <Path
      d="M17 26 C15 30 15 38 18 43"
      stroke="#FEF3C7"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </Svg>
);

/**
 * 5. Chhola Bhatura Icon (Win 10 times)
 * Huge puffy golden bhatura served with spicy dark chhole curry bowl and sliced lemon
 */
export const ChholaBhaturaIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="bhaturaGrad" cx="30" cy="26" r="26" fx="24" fy="20">
        <Stop offset="0%" stopColor="#FFFBEB" />
        <Stop offset="30%" stopColor="#FDE68A" />
        <Stop offset="70%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </RadialGradient>
      <RadialGradient id="chholeGrad" cx="42" cy="40" r="14" fx="38" fy="36">
        <Stop offset="0%" stopColor="#92400E" />
        <Stop offset="70%" stopColor="#78350F" />
        <Stop offset="100%" stopColor="#451A03" />
      </RadialGradient>
    </Defs>
    {/* Puffed Oval Bhatura in background */}
    <Ellipse cx="27" cy="30" rx="20" ry="18" fill="url(#bhaturaGrad)" stroke="#B45309" strokeWidth="1" />
    {/* Golden fried blisters on bhatura */}
    <Ellipse cx="22" cy="26" rx="5" ry="3" fill="#D97706" opacity="0.6" />
    <Ellipse cx="31" cy="22" rx="4" ry="2.5" fill="#D97706" opacity="0.5" />
    <Ellipse cx="26" cy="36" rx="6" ry="3.5" fill="#D97706" opacity="0.5" />
    {/* Shiny Ceramic Chhole Bowl */}
    <Circle cx="44" cy="42" r="15" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
    {/* Spicy Chhole Curry */}
    <Circle cx="44" cy="42" r="13" fill="url(#chholeGrad)" />
    {/* Chickpeas (Kabuli Chane) */}
    <Circle cx="40" cy="40" r="3" fill="#D97706" />
    <Circle cx="47" cy="39" r="3" fill="#B45309" />
    <Circle cx="43" cy="46" r="2.8" fill="#D97706" />
    <Circle cx="49" cy="44" r="2.5" fill="#B45309" />
    {/* Ginger Julienne & Coriander on Chhole */}
    <Path d="M42 36 L46 41" stroke="#FEF08A" strokeWidth="1.2" strokeLinecap="round" />
    <Path d="M40 43 L45 44" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

/**
 * 6. Noodles Icon (Win 15 times)
 * Steaming hot red ramen bowl with curly noodles lifted by wooden chopsticks
 */
export const NoodlesIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#991B1B" />
      </LinearGradient>
      <LinearGradient id="noodleGrad" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#FDE047" />
        <Stop offset="50%" stopColor="#FACC15" />
        <Stop offset="100%" stopColor="#EAB308" />
      </LinearGradient>
    </Defs>
    {/* Wooden Chopsticks */}
    <Path d="M14 12 L48 24" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
    <Path d="M12 18 L52 26" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
    {/* Noodles Lifted by Chopsticks */}
    <Path
      d="M32 20 Q36 28 32 36 Q38 32 40 38"
      stroke="url(#noodleGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M36 22 Q42 27 38 36 Q42 34 44 38"
      stroke="url(#noodleGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Ceramic Ramen Bowl (Deep Red with gold rim) */}
    <Path d="M12 36 C12 52 22 56 32 56 C42 56 52 52 52 36 Z" fill="url(#bowlGrad)" />
    <Ellipse cx="32" cy="36" rx="20" ry="6" fill="#F87171" stroke="#FDE047" strokeWidth="1.5" />
    {/* Curly Noodles Mound inside bowl */}
    <Ellipse cx="32" cy="36" rx="17" ry="4.5" fill="#FBBF24" />
    {/* Hard-boiled Egg Half */}
    <Ellipse cx="25" cy="35" rx="4" ry="3" fill="#FFFFFF" />
    <Circle cx="25" cy="35" r="2" fill="#F97316" />
    {/* Green Scallions / Herbs */}
    <Circle cx="36" cy="34" r="1.5" fill="#15803D" />
    <Circle cx="39" cy="36" r="1.5" fill="#15803D" />
    <Circle cx="34" cy="37" r="1.5" fill="#15803D" />
  </Svg>
);

/**
 * 7. Idli Icon (Win 25 times)
 * Two fluffy white steamed south-indian idlis with fresh coconut chutney & red spicy sambar bowl
 */
export const IdliIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="idliGrad" cx="30" cy="24" r="16" fx="26" fy="20">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="70%" stopColor="#F8FAFC" />
        <Stop offset="100%" stopColor="#CBD5E1" />
      </RadialGradient>
      <LinearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#15803D" />
        <Stop offset="100%" stopColor="#166534" />
      </LinearGradient>
    </Defs>
    {/* Green Banana Leaf Plate */}
    <Ellipse cx="32" cy="40" rx="25" ry="16" fill="url(#leafGrad)" />
    <Path d="M10 40 L54 40" stroke="#22C55E" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
    {/* First Fluffy White Steamed Idli (Back) */}
    <Ellipse cx="24" cy="34" rx="14" ry="10" fill="url(#idliGrad)" stroke="#E2E8F0" strokeWidth="1" />
    <Circle cx="21" cy="32" r="1" fill="#94A3B8" opacity="0.3" />
    <Circle cx="27" cy="34" r="1" fill="#94A3B8" opacity="0.3" />
    {/* Second Fluffy White Steamed Idli (Front) */}
    <Ellipse cx="36" cy="42" rx="13" ry="9" fill="url(#idliGrad)" stroke="#E2E8F0" strokeWidth="1" />
    <Circle cx="33" cy="40" r="1" fill="#94A3B8" opacity="0.3" />
    <Circle cx="39" cy="42" r="1" fill="#94A3B8" opacity="0.3" />
    {/* Small Coconut Chutney Cup (White with green mustard tempering) */}
    <Circle cx="44" cy="28" r="9" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <Circle cx="44" cy="28" r="7.5" fill="#F8FAFC" />
    <Circle cx="42" cy="27" r="0.8" fill="#1E293B" />
    <Circle cx="45" cy="29" r="0.8" fill="#1E293B" />
    <Circle cx="46" cy="26" r="0.8" fill="#15803D" />
    {/* Sambar Bowl (Spicy orange curry with curry leaves) */}
    <Circle cx="16" cy="44" r="7" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <Circle cx="16" cy="44" r="5.5" fill="#EA580C" />
    <Path d="M15 43 C16 42 18 43 17 45" stroke="#15803D" strokeWidth="1" />
  </Svg>
);

/**
 * 8. Dosa Icon (Win 45 times - The Grand Jackpot Food!)
 * Giant golden-brown rolled crispy masala dosa with shiny potato stuffing and side dips
 */
export const DosaIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="dosaRoll" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#F59E0B" />
        <Stop offset="30%" stopColor="#D97706" />
        <Stop offset="60%" stopColor="#B45309" />
        <Stop offset="85%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#92400E" />
      </LinearGradient>
      <LinearGradient id="leafPlate" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#16A34A" />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Banana Leaf Base */}
    <Rect x="6" y="26" width="52" height="28" rx="8" fill="url(#leafPlate)" />
    {/* Banana leaf vein lines */}
    <Path d="M6 40 L58 40" stroke="#22C55E" strokeWidth="1.2" opacity="0.6" />
    {/* Giant Rolled Masala Dosa (Cylindrical crispy roll) */}
    <Path
      d="M10 28 L48 16 C53 14 56 22 52 26 L14 42 C10 44 6 32 10 28 Z"
      fill="url(#dosaRoll)"
      stroke="#78350F"
      strokeWidth="1.2"
    />
    {/* Crispy golden roasted stripes on Dosa */}
    <Path d="M22 28 L20 34" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M30 25 L28 32" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M38 22 L36 29" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    {/* Potato Masala Peeking out from edge */}
    <Circle cx="12" cy="35" r="3" fill="#FBBF24" />
    <Circle cx="11" cy="37" r="1.5" fill="#EA580C" />
    {/* Chutney Cup 1: White Coconut Chutney */}
    <Circle cx="20" cy="46" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <Circle cx="20" cy="46" r="4.8" fill="#F8FAFC" />
    <Circle cx="19" cy="45" r="0.8" fill="#15803D" />
    {/* Chutney Cup 2: Red Tomato-Garlic Chutney */}
    <Circle cx="35" cy="46" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <Circle cx="35" cy="46" r="4.8" fill="#DC2626" />
    {/* Chutney Cup 3: Hot Sambar */}
    <Circle cx="50" cy="44" r="6" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    <Circle cx="50" cy="44" r="4.8" fill="#D97706" />
  </Svg>
);

/**
 * Greedy Baby Center Character
 * Cute chubby animated baby face with cute chef hat, fork and spoon, rosy cheeks and sparkles!
 */
export const GreedyBabyCharacter = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <RadialGradient id="babySkin" cx="50" cy="45" r="35" fx="45" fy="38">
        <Stop offset="0%" stopColor="#FFF1EE" />
        <Stop offset="70%" stopColor="#FED7AA" />
        <Stop offset="100%" stopColor="#FDBA74" />
      </RadialGradient>
      <LinearGradient id="hatGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E2E8F0" />
      </LinearGradient>
      <LinearGradient id="spoonMetal" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#CBD5E1" />
        <Stop offset="100%" stopColor="#64748B" />
      </LinearGradient>
    </Defs>
    {/* Left Hand with Fork */}
    <Path d="M18 48 C16 40 18 30 22 24" stroke="url(#spoonMetal)" strokeWidth="3" strokeLinecap="round" />
    <Path d="M19 23 L25 24 M20 20 L22 25 M24 21 L23 25" stroke="url(#spoonMetal)" strokeWidth="2" strokeLinecap="round" />
    <Circle cx="21" cy="48" r="6" fill="#FDBA74" />

    {/* Right Hand with Spoon */}
    <Path d="M82 48 C84 40 82 30 78 24" stroke="url(#spoonMetal)" strokeWidth="3" strokeLinecap="round" />
    <Ellipse cx="77" cy="22" rx="4.5" ry="6" fill="url(#spoonMetal)" />
    <Circle cx="79" cy="48" r="6" fill="#FDBA74" />

    {/* Cute Baby Chef Hat */}
    <Path
      d="M32 30 C28 20 34 10 44 12 C48 6 58 6 62 12 C72 10 76 20 72 30 Z"
      fill="url(#hatGrad)"
      stroke="#CBD5E1"
      strokeWidth="1.5"
    />
    <Rect x="34" y="27" width="36" height="7" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />

    {/* Chubby Round Baby Face */}
    <Circle cx="52" cy="54" r="30" fill="url(#babySkin)" />

    {/* Baby Hair curl peeking under hat */}
    <Path d="M50 32 C54 36 52 38 48 37" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

    {/* Big Shiny Excited Eyes */}
    <Circle cx="42" cy="50" r="5.5" fill="#1E293B" />
    <Circle cx="44" cy="48" r="2" fill="#FFFFFF" />
    <Circle cx="41" cy="52" r="1" fill="#FFFFFF" />

    <Circle cx="62" cy="50" r="5.5" fill="#1E293B" />
    <Circle cx="64" cy="48" r="2" fill="#FFFFFF" />
    <Circle cx="61" cy="52" r="1" fill="#FFFFFF" />

    {/* Chubby Rosy Cheeks */}
    <Circle cx="34" cy="58" r="5.5" fill="#F43F5E" opacity="0.45" />
    <Circle cx="70" cy="58" r="5.5" fill="#F43F5E" opacity="0.45" />

    {/* Cute Open Mouth with Tongue (Excited for Food!) */}
    <Path
      d="M45 61 C45 69 59 69 59 61 Z"
      fill="#BE123C"
    />
    <Path
      d="M48 64 C50 67 54 67 56 64 Z"
      fill="#FB7185"
    />

    {/* Baby Bib with Cute Yellow Trim */}
    <Path d="M36 78 C36 88 68 88 68 78 Z" fill="#38BDF8" stroke="#FBBF24" strokeWidth="2" />
    <Circle cx="52" cy="82" r="2" fill="#FFFFFF" />
  </Svg>
);

/**
 * Gold Coin Icon
 */
export const ShinyCoinIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <RadialGradient id="coinG" cx="12" cy="12" r="11">
        <Stop offset="0%" stopColor="#FDE68A" />
        <Stop offset="70%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#B45309" />
      </RadialGradient>
    </Defs>
    <Circle cx="12" cy="12" r="11" fill="url(#coinG)" stroke="#FDE68A" strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="8.5" stroke="#D97706" strokeWidth="1" strokeDasharray="2 1" />
    <Path d="M12 7 V17 M9.5 9.5 H14.5 C15.5 9.5 15.5 12 14.5 12 H10 C9 12 9 14.5 10 14.5 H14.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

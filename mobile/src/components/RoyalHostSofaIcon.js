import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';

/**
 * Super Stylish Royal VIP Host Throne / Lounge Sofa Icon
 * Features a high royal curved backrest with tufted diamond stitching,
 * wide plush luxury seating cushion, royal curved armrests, and golden metallic legs.
 */
export default function RoyalHostSofaIcon({
  width = 46,
  height = 46,
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="hostSofaBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="50%" stopColor="#EDE9FE" stopOpacity={0.95} />
          <Stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.9} />
        </SvgLinearGradient>

        <SvgLinearGradient id="hostSofaCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#DDD6FE" stopOpacity={0.92} />
        </SvgLinearGradient>

        <SvgLinearGradient id="hostSofaArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#A78BFA" stopOpacity={0.8} />
        </SvgLinearGradient>

        <SvgLinearGradient id="goldLegsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FDE68A" stopOpacity={1} />
          <Stop offset="100%" stopColor="#F59E0B" stopOpacity={1} />
        </SvgLinearGradient>
      </Defs>

      <G>
        {/* Royal High Backrest Silhouette with Crown-like Arch */}
        <Path
          d="M 16 16 C 16 9, 24 7, 32 7 C 40 7, 48 9, 48 16 C 50 22, 50 31, 50 33 C 50 34.5, 14 34.5, 14 33 C 14 31, 14 22, 16 16 Z"
          fill="url(#hostSofaBackGrad)"
        />

        {/* Tufted Cushion Accents on Backrest */}
        <Circle cx="24" cy="17" r="1.5" fill="#8B5CF6" opacity={0.6} />
        <Circle cx="32" cy="15" r="1.8" fill="#8B5CF6" opacity={0.7} />
        <Circle cx="40" cy="17" r="1.5" fill="#8B5CF6" opacity={0.6} />
        <Circle cx="28" cy="24" r="1.5" fill="#8B5CF6" opacity={0.6} />
        <Circle cx="36" cy="24" r="1.5" fill="#8B5CF6" opacity={0.6} />

        {/* Diamond Tufting Crease Lines */}
        <Path
          d="M 24 17 L 32 15 L 40 17 M 24 17 L 28 24 L 32 15 L 36 24 L 40 17 M 28 24 L 32 31 L 36 24"
          stroke="#8B5CF6"
          strokeWidth="0.8"
          strokeOpacity={0.4}
          strokeLinecap="round"
        />

        {/* Extra Thick Plush Main Seating Cushion */}
        <Rect
          x="12"
          y="32"
          width="40"
          height="12"
          rx="5.5"
          fill="url(#hostSofaCushionGrad)"
        />

        {/* Left Royal Curved Armrest */}
        <Rect
          x="7"
          y="24"
          width="8.5"
          height="18"
          rx="4.25"
          fill="url(#hostSofaArmGrad)"
        />
        {/* Left Armrest Highlight Cap */}
        <Circle cx="11.25" cy="26" r="3.2" fill="#FFFFFF" opacity={0.9} />

        {/* Right Royal Curved Armrest */}
        <Rect
          x="48.5"
          y="24"
          width="8.5"
          height="18"
          rx="4.25"
          fill="url(#hostSofaArmGrad)"
        />
        {/* Right Armrest Highlight Cap */}
        <Circle cx="52.75" cy="26" r="3.2" fill="#FFFFFF" opacity={0.9} />

        {/* Lower Trim Ribbon */}
        <Path
          d="M 14 43.5 L 50 43.5 C 50 45, 14 45, 14 43.5 Z"
          fill="#7C3AED"
          opacity={0.7}
        />

        {/* 2 Royal Golden Metallic Legs */}
        <Rect x="15" y="44" width="3.5" height="6" rx="1.75" fill="url(#goldLegsGrad)" />
        <Rect x="45.5" y="44" width="3.5" height="6" rx="1.75" fill="url(#goldLegsGrad)" />
      </G>
    </Svg>
  );
}

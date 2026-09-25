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
 * Modern Stylish Luxury Sofa Icon matching YOYO Voice Room screenshot
 * Features sleek backrest, soft cushion, stylish curved armrests, and sofa legs.
 */
export default function StylishSofaIcon({
  width = 34,
  height = 34,
  color = '#FFFFFF',
  tint = '#E0E7FF',
}) {
  return (
    <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
      <Defs>
        <SvgLinearGradient id="sofaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="100%" stopColor={tint} stopOpacity={0.88} />
        </SvgLinearGradient>
        <SvgLinearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#CBD5E1" stopOpacity={0.9} />
        </SvgLinearGradient>
      </Defs>

      <G>
        {/* Rounded Backrest with top curve */}
        <Path
          d="M 14 13 C 14 10, 34 10, 34 13 C 35 17, 35 22, 35 23 C 35 24.5, 13 24.5, 13 23 C 13 22, 13 17, 14 13 Z"
          fill="url(#sofaGrad)"
        />

        {/* Backrest subtle tufting stitch marks */}
        <Circle cx="20" cy="17" r="1" fill="#94A3B8" opacity={0.6} />
        <Circle cx="28" cy="17" r="1" fill="#94A3B8" opacity={0.6} />

        {/* Thick Main Cushion (Seat base) */}
        <Rect
          x="11"
          y="23"
          width="26"
          height="8.5"
          rx="4"
          fill="url(#sofaGrad)"
        />

        {/* Left Armrest (Rounded Capsule) */}
        <Rect
          x="7.5"
          y="18"
          width="6"
          height="12.5"
          rx="3"
          fill="url(#armGrad)"
        />

        {/* Right Armrest (Rounded Capsule) */}
        <Rect
          x="34.5"
          y="18"
          width="6"
          height="12.5"
          rx="3"
          fill="url(#armGrad)"
        />

        {/* Bottom Base Trim */}
        <Path
          d="M 12 31.5 L 36 31.5 C 36 32.5, 12 32.5, 12 31.5 Z"
          fill="#94A3B8"
          opacity={0.8}
        />

        {/* 2 Sleek Sofa Legs */}
        <Rect x="12.5" y="32" width="2.5" height="4" rx="1.2" fill="#E2E8F0" />
        <Rect x="33" y="32" width="2.5" height="4" rx="1.2" fill="#E2E8F0" />
      </G>
    </Svg>
  );
}

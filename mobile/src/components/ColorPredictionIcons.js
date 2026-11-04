import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
 * 1. Oracle Crystal Orb Graphic (Centerpiece for Color Prediction)
 * Features pulsing aura rings, glass gloss, and glowing numbers/colors
 */
export function OracleCrystalOrbGraphic({
  size = 130,
  number = null,
  color = null,
  isRevealing = false,
  timerSeconds = 15,
}) {
  const orbRadius = size * 0.42;
  const center = size / 2;

  // Determine glow colors based on revealed color
  let primaryGlow = '#6366F1';
  let secondaryGlow = '#A855F7';
  let orbCoreColor = '#1E1B4B';
  let badgeColor = '#6366F1';

  if (color === 'green') {
    primaryGlow = '#10B981';
    secondaryGlow = '#34D399';
    orbCoreColor = '#064E3B';
    badgeColor = '#10B981';
  } else if (color === 'red') {
    primaryGlow = '#EF4444';
    secondaryGlow = '#F87171';
    orbCoreColor = '#7F1D1D';
    badgeColor = '#EF4444';
  } else if (color === 'violet' || color === 'violet_red' || color === 'violet_green') {
    primaryGlow = '#8B5CF6';
    secondaryGlow = '#C084FC';
    orbCoreColor = '#4C1D95';
    badgeColor = '#8B5CF6';
  }

  return (
    <View style={[styles.orbWrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {/* Outer Pulsing Aura Gradient */}
          <RadialGradient id="orbAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={primaryGlow} stopOpacity={0.65} />
            <Stop offset="65%" stopColor={secondaryGlow} stopOpacity={0.25} />
            <Stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </RadialGradient>

          {/* Core Glass Sphere Gradient */}
          <RadialGradient id="orbSphere" cx="35%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.5} />
            <Stop offset="25%" stopColor={secondaryGlow} stopOpacity={0.8} />
            <Stop offset="70%" stopColor={orbCoreColor} stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#0B0914" stopOpacity={1} />
          </RadialGradient>

          {/* Inner Light Swirl */}
          <LinearGradient id="innerSwirl" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FDE047" stopOpacity={0.7} />
            <Stop offset="50%" stopColor={primaryGlow} stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#818CF8" stopOpacity={0.4} />
          </LinearGradient>

          {/* Specular Highlight Gloss */}
          <LinearGradient id="glassGloss" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>

          {/* Golden Rune Ring */}
          <LinearGradient id="goldRuneRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="50%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
        </Defs>

        {/* Ambient Aura Background */}
        <Circle cx={center} cy={center} r={size * 0.48} fill="url(#orbAura)" />

        {/* Outer Celestial Orbit Ring */}
        <Circle
          cx={center}
          cy={center}
          r={orbRadius + 5}
          stroke="url(#goldRuneRing)"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          fill="none"
          opacity={0.85}
        />

        {/* Rune Markers on Orbit Ring */}
        <Circle cx={center} cy={center - orbRadius - 5} r="2.5" fill="#FEF08A" />
        <Circle cx={center} cy={center + orbRadius + 5} r="2.5" fill="#FEF08A" />
        <Circle cx={center - orbRadius - 5} cy={center} r="2.5" fill="#FEF08A" />
        <Circle cx={center + orbRadius + 5} cy={center} r="2.5" fill="#FEF08A" />

        {/* Main Crystal Orb Body */}
        <Circle
          cx={center}
          cy={center}
          r={orbRadius}
          fill="url(#orbSphere)"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1.5"
        />

        {/* Inner Mystical Nebula Rings */}
        <Ellipse
          cx={center}
          cy={center + 2}
          rx={orbRadius * 0.72}
          ry={orbRadius * 0.28}
          stroke="url(#innerSwirl)"
          strokeWidth="2.2"
          fill="none"
          opacity={0.7}
        />

        {/* Top Arc Gloss Highlight */}
        <Ellipse
          cx={center}
          cy={center - orbRadius * 0.45}
          rx={orbRadius * 0.55}
          ry={orbRadius * 0.25}
          fill="url(#glassGloss)"
        />
      </Svg>

      {/* Center Content: Number Reveal OR Countdown Timer */}
      <View style={styles.centerOverlay}>
        {isRevealing || number !== null ? (
          <View style={styles.resultRevealBox}>
            <Text
              style={[
                styles.revealNumberText,
                {
                  color:
                    color === 'green'
                      ? '#34D399'
                      : color === 'red'
                      ? '#F87171'
                      : '#C084FC',
                },
              ]}
            >
              {number !== null ? number : '?'}
            </Text>
            {color && (
              <View
                style={[
                  styles.resultColorTag,
                  { backgroundColor: badgeColor },
                ]}
              >
                <Text style={styles.resultColorTagText}>
                  {color.toUpperCase().replace('_', ' + ')}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownDigit}>{timerSeconds}s</Text>
            <Text style={styles.countdownSub}>PREDICT</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * 2. Green Emerald Gem Icon (🟢 2X)
 */
export function GreenGemIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="greenGemGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#A7F3D0" />
          <Stop offset="30%" stopColor="#34D399" />
          <Stop offset="70%" stopColor="#059669" />
          <Stop offset="100%" stopColor="#064E3B" />
        </LinearGradient>
      </Defs>
      {/* Octagonal Diamond Cut */}
      <Path
        d="M14 6 L34 6 L44 16 L44 32 L34 42 L14 42 L4 32 L4 16 Z"
        fill="url(#greenGemGrad)"
        stroke="#6EE7B7"
        strokeWidth="1.5"
      />
      {/* Facet Lines */}
      <Path d="M14 6 L18 18 L30 18 L34 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
      <Path d="M4 16 L18 18 L18 30 L4 32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      <Path d="M44 16 L30 18 L30 30 L44 32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      <Path d="M14 42 L18 30 L30 30 L34 42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      {/* Center Table */}
      <Path d="M18 18 L30 18 L30 30 L18 30 Z" fill="rgba(255,255,255,0.18)" />
      {/* Sparkle */}
      <Circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 3. Violet Amethyst Gem Icon (🟣 4.5X)
 */
export function VioletGemIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="violetGemGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#E9D5FF" />
          <Stop offset="30%" stopColor="#C084FC" />
          <Stop offset="70%" stopColor="#7E22CE" />
          <Stop offset="100%" stopColor="#3B0764" />
        </LinearGradient>
      </Defs>
      {/* Brilliant Cut Gem */}
      <Path
        d="M12 8 L36 8 L44 20 L24 44 L4 20 Z"
        fill="url(#violetGemGrad)"
        stroke="#D8B4FE"
        strokeWidth="1.5"
      />
      {/* Facet Lines */}
      <Path d="M12 8 L24 20 L36 8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
      <Path d="M4 20 L24 20 L44 20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
      <Path d="M24 20 L24 44" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
      <Path d="M12 8 L4 20 L24 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
      <Path d="M36 8 L44 20 L24 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
      {/* Sparkle */}
      <Circle cx="14" cy="12" r="1.5" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 4. Red Ruby Gem Icon (🔴 2X)
 */
export function RedGemIcon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="redGemGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FECDD3" />
          <Stop offset="30%" stopColor="#FB7185" />
          <Stop offset="70%" stopColor="#BE123C" />
          <Stop offset="100%" stopColor="#4C0519" />
        </LinearGradient>
      </Defs>
      {/* Octagonal Ruby Cut */}
      <Path
        d="M14 6 L34 6 L44 16 L44 32 L34 42 L14 42 L4 32 L4 16 Z"
        fill="url(#redGemGrad)"
        stroke="#FDA4AF"
        strokeWidth="1.5"
      />
      {/* Facet Lines */}
      <Path d="M14 6 L18 18 L30 18 L34 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" />
      <Path d="M4 16 L18 18 L18 30 L4 32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      <Path d="M44 16 L30 18 L30 30 L44 32" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      <Path d="M14 42 L18 30 L30 30 L34 42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
      {/* Center Table */}
      <Path d="M18 18 L30 18 L30 30 L18 30 Z" fill="rgba(255,255,255,0.18)" />
      {/* Sparkle */}
      <Circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </Svg>
  );
}

/**
 * 5. Color Prediction Game Tile Icon for GamesListModal (3-Color Energy Clash)
 */
export function ColorPredictionTileIcon({ size = 52 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <RadialGradient id="tileBgAura" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#4C1D95" />
          <Stop offset="70%" stopColor="#1E1B4B" />
          <Stop offset="100%" stopColor="#0B0914" />
        </RadialGradient>
        <LinearGradient id="greenOrb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#34D399" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
        <LinearGradient id="violetOrb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#C084FC" />
          <Stop offset="100%" stopColor="#7E22CE" />
        </LinearGradient>
        <LinearGradient id="redOrb" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FB7185" />
          <Stop offset="100%" stopColor="#DC2626" />
        </LinearGradient>
      </Defs>

      {/* Base Background Circle */}
      <Circle cx="48" cy="48" r="44" fill="url(#tileBgAura)" stroke="#A855F7" strokeWidth="2" />

      {/* Outer Mystic Orbit */}
      <Circle cx="48" cy="48" r="38" stroke="rgba(253, 224, 71, 0.4)" strokeWidth="1.2" strokeDasharray="4 3" fill="none" />

      {/* 3 Colliding Trinity Orbs */}
      {/* Top Violet Orb (Centerpiece) */}
      <Circle cx="48" cy="28" r="16" fill="url(#violetOrb)" stroke="#E9D5FF" strokeWidth="1.5" />
      <Circle cx="44" cy="24" r="3.5" fill="#FFFFFF" opacity={0.6} />

      {/* Bottom-Left Green Orb */}
      <Circle cx="30" cy="62" r="16" fill="url(#greenOrb)" stroke="#A7F3D0" strokeWidth="1.5" />
      <Circle cx="26" cy="58" r="3.5" fill="#FFFFFF" opacity={0.6} />

      {/* Bottom-Right Red Orb */}
      <Circle cx="66" cy="62" r="16" fill="url(#redOrb)" stroke="#FECDD3" strokeWidth="1.5" />
      <Circle cx="62" cy="58" r="3.5" fill="#FFFFFF" opacity={0.6} />

      {/* Center Golden Star Fusion */}
      <Path
        d="M48 42 L50 46 L54 48 L50 50 L48 54 L46 50 L42 48 L46 46 Z"
        fill="#FEF08A"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownDigit: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FEF08A',
    textShadowColor: 'rgba(234, 179, 8, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
  },
  countdownSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  resultRevealBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealNumberText: {
    fontSize: 34,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  resultColorTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  resultColorTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});


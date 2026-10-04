/**
 * Animated Lottie Frames Catalog for YoYo User Levels (Levels 1 to 100)
 * Uses high-performance 60 FPS hardware-accelerated Lottie JSON files.
 */

export const LOTTIE_TIER_SOURCES = {
  1: require('../../assets/lottie/frames/tier1_bronze.json'),
  2: require('../../assets/lottie/frames/tier2_gold.json'),
  3: require('../../assets/lottie/frames/tier3_cyan.json'),
  4: require('../../assets/lottie/frames/tier4_purple.json'),
  5: require('../../assets/lottie/frames/tier5_legend.json'),
};

/**
 * Returns Lottie JSON animation source & badge styling based on user level (1 to 100)
 */
export function getUserLevelLottieFrame(rawLevel) {
  const level = Math.max(1, Math.min(100, Math.floor(Number(rawLevel) || 1)));

  let tier = 1;
  let textColor = '#FFFFFF';
  let strokeColor = '#401F07';
  let badgeBg = '#864313';

  if (level >= 50) {
    tier = 5;
    textColor = '#FFFFFF';
    strokeColor = '#5B2503';
    badgeBg = '#B45309';
  } else if (level >= 30) {
    tier = 4;
    textColor = '#FFFFFF';
    strokeColor = '#3B0764';
    badgeBg = '#6B21A8';
  } else if (level >= 20) {
    tier = 3;
    textColor = '#FFFFFF';
    strokeColor = '#083344';
    badgeBg = '#0E7490';
  } else if (level >= 10) {
    tier = 2;
    textColor = '#FFFFFF';
    strokeColor = '#422006';
    badgeBg = '#854D0E';
  } else {
    tier = 1;
    textColor = '#FFFFFF';
    strokeColor = '#401F07';
    badgeBg = '#864313';
  }

  return {
    tier,
    source: LOTTIE_TIER_SOURCES[tier],
    levelText: String(level).padStart(2, '0'),
    textColor,
    strokeColor,
    badgeBg,
  };
}

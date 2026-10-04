/**
 * YoYo User Level Progression System (Level 1 to 100)
 * Cumulative EXP requirements based on official progression table.
 */

export const USER_LEVEL_PROGRESSION_TABLE = [
  { level: 1, exp: 1000 },
  { level: 2, exp: 1200 },
  { level: 3, exp: 1500 },
  { level: 4, exp: 1900 },
  { level: 5, exp: 2400 },
  { level: 6, exp: 3000 },
  { level: 7, exp: 3700 },
  { level: 8, exp: 4500 },
  { level: 9, exp: 5400 },
  { level: 10, exp: 6500 },
  { level: 11, exp: 7700 },
  { level: 12, exp: 9000 },
  { level: 13, exp: 10500 },
  { level: 14, exp: 12200 },
  { level: 15, exp: 14000 },
  { level: 16, exp: 16000 },
  { level: 17, exp: 18200 },
  { level: 18, exp: 20600 },
  { level: 19, exp: 23200 },
  { level: 20, exp: 26000 },
  { level: 21, exp: 29100 },
  { level: 22, exp: 32400 },
  { level: 23, exp: 36000 },
  { level: 24, exp: 39800 },
  { level: 25, exp: 44000 },
  { level: 26, exp: 48500 },
  { level: 27, exp: 53300 },
  { level: 28, exp: 58400 },
  { level: 29, exp: 63800 },
  { level: 30, exp: 69600 },
  { level: 31, exp: 75800 },
  { level: 32, exp: 82400 },
  { level: 33, exp: 89400 },
  { level: 34, exp: 96800 },
  { level: 35, exp: 104700 },
  { level: 36, exp: 113000 },
  { level: 37, exp: 121800 },
  { level: 38, exp: 131100 },
  { level: 39, exp: 140900 },
  { level: 40, exp: 151200 },
  { level: 41, exp: 162100 },
  { level: 42, exp: 173500 },
  { level: 43, exp: 185500 },
  { level: 44, exp: 198100 },
  { level: 45, exp: 211300 },
  { level: 46, exp: 225100 },
  { level: 47, exp: 239500 },
  { level: 48, exp: 254600 },
  { level: 49, exp: 270300 },
  { level: 50, exp: 286700 },
  { level: 51, exp: 303800 },
  { level: 52, exp: 321600 },
  { level: 53, exp: 340100 },
  { level: 54, exp: 359300 },
  { level: 55, exp: 379300 },
  { level: 56, exp: 400000 },
  { level: 57, exp: 421500 },
  { level: 58, exp: 443800 },
  { level: 59, exp: 466900 },
  { level: 60, exp: 490800 },
  { level: 61, exp: 515600 },
  { level: 62, exp: 541200 },
  { level: 63, exp: 567700 },
  { level: 64, exp: 595100 },
  { level: 65, exp: 623400 },
  { level: 66, exp: 652600 },
  { level: 67, exp: 682700 },
  { level: 68, exp: 713800 },
  { level: 69, exp: 745800 },
  { level: 70, exp: 778800 },
  { level: 71, exp: 812800 },
  { level: 72, exp: 847800 },
  { level: 73, exp: 883800 },
  { level: 74, exp: 920800 },
  { level: 75, exp: 958900 },
  { level: 76, exp: 998000 },
  { level: 77, exp: 1038200 },
  { level: 78, exp: 1079500 },
  { level: 79, exp: 1121900 },
  { level: 80, exp: 1165400 },
  { level: 81, exp: 1210000 },
  { level: 82, exp: 1255800 },
  { level: 83, exp: 1302700 },
  { level: 84, exp: 1350800 },
  { level: 85, exp: 1400100 },
  { level: 86, exp: 1450600 },
  { level: 87, exp: 1502300 },
  { level: 88, exp: 1555200 },
  { level: 89, exp: 1609400 },
  { level: 90, exp: 1664800 },
  { level: 91, exp: 1721500 },
  { level: 92, exp: 1779500 },
  { level: 93, exp: 1838800 },
  { level: 94, exp: 1899400 },
  { level: 95, exp: 1961300 },
  { level: 96, exp: 2024600 },
  { level: 97, exp: 2089200 },
  { level: 98, exp: 2155200 },
  { level: 99, exp: 2222600 },
  { level: 100, exp: 2291400 },
];

/**
 * Calculates user's level based on cumulative EXP.
 * Default is Level 1.
 */
export function getUserLevelFromExp(rawExp) {
  const exp = Math.max(0, Number(rawExp) || 0);
  const maxEntry = USER_LEVEL_PROGRESSION_TABLE[USER_LEVEL_PROGRESSION_TABLE.length - 1];

  if (exp >= maxEntry.exp) {
    return 100;
  }
  if (exp < USER_LEVEL_PROGRESSION_TABLE[0].exp) {
    return 1;
  }

  for (let i = USER_LEVEL_PROGRESSION_TABLE.length - 2; i >= 0; i--) {
    if (exp >= USER_LEVEL_PROGRESSION_TABLE[i].exp) {
      return USER_LEVEL_PROGRESSION_TABLE[i].level + 1;
    }
  }

  return 1;
}

/**
 * Get comprehensive EXP progress metrics for user profile & progress bar.
 */
export function getUserExpProgress(rawExp, explicitLevel = 1) {
  const exp = Math.max(0, Number(rawExp) || 0);
  const calculatedLevel = getUserLevelFromExp(exp);
  const currentLevel = Math.max(1, Math.min(100, Math.max(calculatedLevel, Number(explicitLevel) || 1)));

  if (currentLevel === 1) {
    const floorExp = 0;
    const targetExp = USER_LEVEL_PROGRESSION_TABLE[0].exp; // 1000
    const expInLevel = Math.max(0, exp);
    const expNeeded = Math.max(0, targetExp - exp);
    const percent = Math.min(100, Math.max(0, (expInLevel / targetExp) * 100));

    return {
      currentLevel: 1,
      nextLevel: 2,
      currentExp: exp,
      floorExp,
      targetExp,
      expNeeded,
      percent: Math.round(percent * 10) / 10,
      isMaxLevel: false,
    };
  }

  if (currentLevel >= 100) {
    const floorExp = USER_LEVEL_PROGRESSION_TABLE[98].exp;
    const targetExp = USER_LEVEL_PROGRESSION_TABLE[99].exp;

    return {
      currentLevel: 100,
      nextLevel: 100,
      currentExp: exp,
      floorExp,
      targetExp,
      expNeeded: 0,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const floorExp = USER_LEVEL_PROGRESSION_TABLE[currentLevel - 2].exp;
  const targetExp = USER_LEVEL_PROGRESSION_TABLE[currentLevel - 1].exp;
  const span = targetExp - floorExp;
  const expInLevel = Math.max(0, exp - floorExp);
  const expNeeded = Math.max(0, targetExp - exp);
  const percent = span > 0 ? Math.min(100, Math.max(0, (expInLevel / span) * 100)) : 100;

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    currentExp: exp,
    floorExp,
    targetExp,
    expNeeded,
    percent: Math.round(percent * 10) / 10,
    isMaxLevel: false,
  };
}

/**
 * Returns tier color and name for UI badges
 */
export function getLevelTierInfo(level) {
  const safeLevel = Math.max(1, Math.min(100, Math.floor(Number(level) || 1)));
  if (safeLevel >= 90) return { name: 'Divine', color: '#EC4899', bg: '#4A0E2E', border: '#F472B6' };
  if (safeLevel >= 70) return { name: 'Legend', color: '#F59E0B', bg: '#3D2005', border: '#FBBF24' };
  if (safeLevel >= 50) return { name: 'Royale', color: '#A855F7', bg: '#29104D', border: '#C084FC' };
  if (safeLevel >= 30) return { name: 'Master', color: '#06B6D4', bg: '#082F49', border: '#38BDF8' };
  if (safeLevel >= 10) return { name: 'Knight', color: '#10B981', bg: '#064E3B', border: '#34D399' };
  return { name: 'Novice', color: '#E2E8F0', bg: '#1E293B', border: '#94A3B8' };
}

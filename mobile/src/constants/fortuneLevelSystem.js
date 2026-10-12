/**
 * YoYo Fortune Level Progression System (Level 1 to 200)
 * Tracks user wealth and recharge progression starting from 2,000 coins.
 */

// Generate 200 Levels with authentic gaming curve matching app screenshots
export const FORTUNE_LEVEL_PROGRESSION_TABLE = (() => {
  const table = [];
  let current = 2000;
  for (let lvl = 1; lvl <= 200; lvl++) {
    table.push({ level: lvl, exp: current });
    const step = Math.round(1600 + lvl * 340 + Math.pow(lvl, 2) * 16.5);
    current += step;
  }
  return table;
})();

/**
 * Calculates Fortune Level based on cumulative recharge coins.
 */
export function getFortuneLevelFromRecharge(rawCoins) {
  const coins = Math.max(0, Number(rawCoins) || 0);
  const maxEntry = FORTUNE_LEVEL_PROGRESSION_TABLE[FORTUNE_LEVEL_PROGRESSION_TABLE.length - 1];

  if (coins >= maxEntry.exp) {
    return 200;
  }
  if (coins < FORTUNE_LEVEL_PROGRESSION_TABLE[0].exp) {
    return 1;
  }

  for (let i = FORTUNE_LEVEL_PROGRESSION_TABLE.length - 2; i >= 0; i--) {
    if (coins >= FORTUNE_LEVEL_PROGRESSION_TABLE[i].exp) {
      return FORTUNE_LEVEL_PROGRESSION_TABLE[i].level + 1;
    }
  }

  return 1;
}

/**
 * Returns comprehensive progress metrics for Fortune Level progress bar.
 */
export function getFortuneProgress(rawCoins, explicitLevel = 1) {
  const coins = Math.max(0, Number(rawCoins) || 0);
  const calculatedLevel = getFortuneLevelFromRecharge(coins);
  const currentLevel = Math.max(1, Math.min(200, Math.max(calculatedLevel, Number(explicitLevel) || 1)));

  if (currentLevel === 1) {
    const floorExp = 0;
    const targetExp = FORTUNE_LEVEL_PROGRESSION_TABLE[0].exp; // 2,000
    const expInLevel = Math.max(0, coins);
    const expNeeded = Math.max(0, targetExp - coins);
    const percent = Math.min(100, Math.max(0, (expInLevel / targetExp) * 100));

    return {
      currentLevel: 1,
      nextLevel: 2,
      currentExp: coins,
      floorExp,
      targetExp,
      expNeeded,
      percent: Math.round(percent * 10) / 10,
      isMaxLevel: false,
    };
  }

  if (currentLevel >= 200) {
    const floorExp = FORTUNE_LEVEL_PROGRESSION_TABLE[198].exp;
    const targetExp = FORTUNE_LEVEL_PROGRESSION_TABLE[199].exp;

    return {
      currentLevel: 200,
      nextLevel: 200,
      currentExp: coins,
      floorExp,
      targetExp,
      expNeeded: 0,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const floorExp = FORTUNE_LEVEL_PROGRESSION_TABLE[currentLevel - 2].exp;
  const targetExp = FORTUNE_LEVEL_PROGRESSION_TABLE[currentLevel - 1].exp;
  const span = targetExp - floorExp;
  const expInLevel = Math.max(0, coins - floorExp);
  const expNeeded = Math.max(0, targetExp - coins);
  const percent = span > 0 ? Math.min(100, Math.max(0, (expInLevel / span) * 100)) : 100;

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    currentExp: coins,
    floorExp,
    targetExp,
    expNeeded,
    percent: Math.round(percent * 10) / 10,
    isMaxLevel: false,
  };
}

/**
 * Returns tier color and style details matching user wealth in profile.
 */
export function getFortuneTierInfo(level) {
  const safeLevel = Math.max(1, Math.min(200, Math.floor(Number(level) || 1)));
  if (safeLevel >= 180) return { name: 'Emperor', color: '#EF4444', bg: '#450A0A', border: '#F87171' };
  if (safeLevel >= 140) return { name: 'Overlord', color: '#EC4899', bg: '#500724', border: '#F472B6' };
  if (safeLevel >= 100) return { name: 'Royal', color: '#F59E0B', bg: '#451A03', border: '#FBBF24' };
  if (safeLevel >= 60) return { name: 'Noble', color: '#A855F7', bg: '#3B0764', border: '#C084FC' };
  if (safeLevel >= 30) return { name: 'Tycoon', color: '#06B6D4', bg: '#083344', border: '#22D3EE' };
  if (safeLevel >= 10) return { name: 'Elite', color: '#10B981', bg: '#022C22', border: '#34D399' };
  return { name: 'Starter', color: '#F97316', bg: '#431407', border: '#FB923C' };
}

/**
 * Compact number formatting matching Screenshot 1 (e.g. 21.2K, 25K)
 */
export function formatCompact(num) {
  const n = Number(num) || 0;
  if (n < 1000) return String(n);
  if (n < 1000000) {
    const formatted = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  const formatted = (n / 1000000).toFixed(2).replace(/\.00$/, '');
  return `${formatted}M`;
}

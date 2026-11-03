const User = require('../models/User');

const GREEDY_BABY_FOODS = [
  { id: 'chocolate', name: 'Chocolate', multiplier: 5, weight: 22 },
  { id: 'pastry', name: 'Pastry', multiplier: 5, weight: 22 },
  { id: 'burger', name: 'Burger', multiplier: 5, weight: 22 },
  { id: 'pani_puri', name: 'Pani Puri', multiplier: 5, weight: 22 },
  { id: 'chhola_bhatura', name: 'Chhola Bhatura', multiplier: 10, weight: 10 },
  { id: 'noodles', name: 'Noodles', multiplier: 15, weight: 6 },
  { id: 'idli', name: 'Idli', multiplier: 25, weight: 3 },
  { id: 'dosa', name: 'Dosa', multiplier: 45, weight: 2 },
];

// Helper: Get today's date formatted as YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// In-memory recent results history for the room/server
let recentResults = ['chocolate', 'burger', 'pani_puri', 'chhola_bhatura', 'pastry', 'noodles', 'dosa', 'chocolate'];

/**
 * @desc    Get Greedy Baby game state & user info
 * @route   GET /api/games/greedy-baby/state
 */
exports.getGreedyBabyState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins greedyBabyStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.greedyBabyStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.greedyBabyStats.todayEarnings || 0;
        }
      }
    }

    // Real leaderboard from DB (defaults to 0 if no winners yet)
    let topUser = null;
    let todayUser = null;
    try {
      topUser = await User.findOne({ 'greedyBabyStats.totalWinnings': { $gt: 0 } })
        .sort({ 'greedyBabyStats.totalWinnings': -1 })
        .select('name avatar greedyBabyStats');

      const todayStr = getTodayString();
      todayUser = await User.findOne({
        'greedyBabyStats.lastEarningsDate': todayStr,
        'greedyBabyStats.todayEarnings': { $gt: 0 },
      })
        .sort({ 'greedyBabyStats.todayEarnings': -1 })
        .select('name avatar greedyBabyStats');
    } catch (e) {
      // ignore
    }

    const leaderboard = {
      weeklyPrize: 0,
      topWinner: topUser ? {
        name: topUser.name || 'User',
        avatar: topUser.avatar || '',
        coins: topUser.greedyBabyStats?.totalWinnings || 0,
      } : { name: '', avatar: '', coins: 0 },
      todayWinner: todayUser ? {
        name: todayUser.name || 'User',
        avatar: todayUser.avatar || '',
        coins: todayUser.greedyBabyStats?.todayEarnings || 0,
      } : { name: '', avatar: '', coins: 0 },
    };

    return res.status(200).json({
      success: true,
      foods: GREEDY_BABY_FOODS,
      recentResults,
      userCoins,
      todayEarnings,
      leaderboard,
    });
  } catch (error) {
    console.error('getGreedyBabyState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Place bet in Greedy Baby game
 * @route   POST /api/games/greedy-baby/bet
 */
exports.placeGreedyBabyBet = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body; // Object: { [foodId]: amount }
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    let totalBet = 0;
    for (const [foodId, amount] of Object.entries(bets)) {
      const num = Number(amount);
      if (num > 0) {
        totalBet += num;
      }
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Bet amount must be greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.coins || 0) < totalBet) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_COINS',
        message: 'Insufficient coins balance. Please recharge first.',
        currentCoins: user.coins || 0,
        requiredCoins: totalBet,
      });
    }

    // Atomically deduct coins
    const todayStr = getTodayString();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: -totalBet,
          'greedyBabyStats.gamesPlayed': 1,
        },
        $set: {
          'greedyBabyStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Bet placed successfully',
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
    });
  } catch (error) {
    console.error('placeGreedyBabyBet error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Claim or settle winning payout for Greedy Baby
 * @route   POST /api/games/greedy-baby/payout
 */
exports.claimGreedyBabyPayout = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { winningFoodId, totalWon } = req.body;
    const wonCoins = Math.floor(Number(totalWon) || 0);

    // Record result in history if valid
    if (winningFoodId) {
      recentResults.unshift(winningFoodId);
      if (recentResults.length > 20) {
        recentResults = recentResults.slice(0, 20);
      }
    }

    if (wonCoins <= 0) {
      const user = await User.findById(userId).select('coins greedyBabyStats');
      return res.status(200).json({
        success: true,
        remainingCoins: user?.coins || 0,
        todayEarnings: user?.greedyBabyStats?.todayEarnings || 0,
      });
    }

    const todayStr = getTodayString();
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Reset daily earnings if on a new date
    let currentTodayEarnings = 0;
    if (user.greedyBabyStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.greedyBabyStats.todayEarnings || 0;
    }

    const newTodayEarnings = currentTodayEarnings + wonCoins;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: wonCoins,
          'greedyBabyStats.totalWinnings': wonCoins,
        },
        $set: {
          'greedyBabyStats.todayEarnings': newTodayEarnings,
          'greedyBabyStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      wonCoins,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
    });
  } catch (error) {
    console.error('claimGreedyBabyPayout error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



// ==================== SUPER SLOTS CONTROLLER ====================
const SUPER_SLOTS_PAYTABLE = [
  { id: 'seven', name: '7', multiplier: 500, symbol: '7', weight: 8 },
  { id: 'diamond', name: 'Diamond', multiplier: 100, symbol: '💎', weight: 14 },
  { id: 'watermelon', name: 'Watermelon', multiplier: 50, symbol: '🍉', weight: 22 },
  { id: 'grapes', name: 'Grapes', multiplier: 20, symbol: '🍇', weight: 32 },
  { id: 'cherry', name: 'Cherry', multiplier: 10, symbol: '🍒', weight: 44 },
];

function pickRandomSlotSymbol() {
  const totalWeight = SUPER_SLOTS_PAYTABLE.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of SUPER_SLOTS_PAYTABLE) {
    if (random < item.weight) {
      return item.id;
    }
    random -= item.weight;
  }
  return 'cherry';
}

/**
 * @desc    Get Super Slots game state & user info
 * @route   GET /api/games/super-slots/state
 */
exports.getSuperSlotsState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins superSlotsStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.superSlotsStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.superSlotsStats.todayEarnings || 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      paytable: SUPER_SLOTS_PAYTABLE,
      userCoins,
      todayEarnings,
      jackpotPool: 500000,
    });
  } catch (error) {
    console.error('getSuperSlotsState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Execute a spin in Super Slots
 * @route   POST /api/games/super-slots/spin
 */
exports.spinSuperSlots = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { betAmount } = req.body;
    const bet = Math.floor(Number(betAmount) || 0);

    const validBets = [10, 50, 100, 1000, 10000];
    if (!validBets.includes(bet)) {
      return res.status(400).json({ success: false, message: 'Invalid bet amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.coins || 0) < bet) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_COINS',
        message: 'Insufficient coins balance. Please recharge first.',
        currentCoins: user.coins || 0,
        requiredCoins: bet,
      });
    }

    // Determine the 3 reel results
    const r1 = pickRandomSlotSymbol();
    const r2 = pickRandomSlotSymbol();
    const r3 = pickRandomSlotSymbol();
    const reels = [r1, r2, r3];

    // Calculate payout
    let multiplier = 0;
    let winType = 'none';

    if (r1 === r2 && r2 === r3) {
      const match = SUPER_SLOTS_PAYTABLE.find((p) => p.id === r1);
      multiplier = match ? match.multiplier : 10;
      winType = multiplier >= 500 ? 'jackpot' : 'win';
    } else {
      const cherryCount = reels.filter((r) => r === 'cherry').length;
      const sevenCount = reels.filter((r) => r === 'seven').length;
      if (sevenCount === 2) {
        multiplier = 5;
        winType = 'small';
      } else if (cherryCount === 2) {
        multiplier = 2;
        winType = 'small';
      }
    }

    const wonCoins = bet * multiplier;
    const netCoinChange = wonCoins - bet;
    const todayStr = getTodayString();

    let currentTodayEarnings = 0;
    if (user.superSlotsStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.superSlotsStats.todayEarnings || 0;
    }
    const newTodayEarnings = Math.max(0, currentTodayEarnings + wonCoins);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'superSlotsStats.totalWinnings': wonCoins,
          'superSlotsStats.spinsPlayed': 1,
        },
        $set: {
          'superSlotsStats.todayEarnings': newTodayEarnings,
          'superSlotsStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      reels,
      multiplier,
      wonCoins,
      winType,
      spentCoins: bet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
    });
  } catch (error) {
    console.error('spinSuperSlots error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ANIMAL RACE (JUNGLE SAFARI) CONTROLLER ====================
const ANIMAL_RACERS = [
  { id: 'lion', name: 'Lion', emoji: '🦁', title: 'King of Jungle', multiplier: 25, weight: 4, color: '#F59E0B' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', title: 'Bengal Tiger', multiplier: 15, weight: 8, color: '#EF4444' },
  { id: 'cheetah', name: 'Cheetah', emoji: '🐆', title: 'Speed Demon', multiplier: 10, weight: 14, color: '#F97316' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', title: 'Mighty Jumbo', multiplier: 5, weight: 24, color: '#3B82F6' },
  { id: 'panda', name: 'Panda', emoji: '🐼', title: 'Bamboo Master', multiplier: 3, weight: 35, color: '#10B981' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', title: 'Swift Bunny', multiplier: 2, weight: 50, color: '#EC4899' },
];

let recentRaceWinners = ['rabbit', 'panda', 'elephant', 'tiger', 'rabbit', 'cheetah', 'lion', 'panda'];

function pickWeightedWinner() {
  const totalWeight = ANIMAL_RACERS.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;
  for (const racer of ANIMAL_RACERS) {
    if (random < racer.weight) {
      return racer;
    }
    random -= racer.weight;
  }
  return ANIMAL_RACERS[ANIMAL_RACERS.length - 1];
}

/**
 * @desc    Get Animal Race game state & user info
 * @route   GET /api/games/animal-race/state
 */
exports.getAnimalRaceState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let coins = 0;
    let todayEarnings = 0;
    let totalWinnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins animalRaceStats');
      if (user) {
        coins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.animalRaceStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.animalRaceStats.todayEarnings || 0;
        }
        totalWinnings = user.animalRaceStats?.totalWinnings || 0;
      }
    }

    return res.status(200).json({
      success: true,
      coins,
      todayEarnings,
      totalWinnings,
      animals: ANIMAL_RACERS,
      recentWinners: recentRaceWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('getAnimalRaceState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Place bet and run the Animal Race (Atomic 1-step flow)
 * @route   POST /api/games/animal-race/run
 */
exports.runAnimalRace = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body; // { [animalId]: betAmount }
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    let totalBet = 0;
    for (const [animalId, amount] of Object.entries(bets)) {
      const num = Number(amount);
      if (num > 0) {
        totalBet += num;
      }
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Bet amount must be greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.coins || 0) < totalBet) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_COINS',
        message: 'Insufficient coins balance. Please recharge first.',
        currentCoins: user.coins || 0,
        requiredCoins: totalBet,
      });
    }

    // 1. Pick Winner
    const winner = pickWeightedWinner();

    // 2. Add winner to recent history
    recentRaceWinners.unshift(winner.id);
    if (recentRaceWinners.length > 20) {
      recentRaceWinners = recentRaceWinners.slice(0, 20);
    }

    // 3. Calculate winnings
    const betOnWinner = Number(bets[winner.id]) || 0;
    const wonCoins = betOnWinner * winner.multiplier;

    // 4. Update user balance & stats atomically
    const todayStr = getTodayString();
    let currentTodayEarnings = 0;
    if (user.animalRaceStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.animalRaceStats.todayEarnings || 0;
    }
    const newTodayEarnings = currentTodayEarnings + wonCoins;

    const netCoinChange = wonCoins - totalBet;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'animalRaceStats.totalWinnings': wonCoins,
          'animalRaceStats.racesPlayed': 1,
        },
        $set: {
          'animalRaceStats.todayEarnings': newTodayEarnings,
          'animalRaceStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    // 5. Generate rankings (winner is 1st, others shuffled for visual track)
    const otherRacers = ANIMAL_RACERS.filter((a) => a.id !== winner.id);
    for (let i = otherRacers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherRacers[i], otherRacers[j]] = [otherRacers[j], otherRacers[i]];
    }
    const rankings = [winner.id, ...otherRacers.map((r) => r.id)];

    return res.status(200).json({
      success: true,
      winner: winner.id,
      winnerDetails: winner,
      rankings,
      betOnWinner,
      wonCoins,
      netProfit: wonCoins - totalBet,
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentRaceWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('runAnimalRace error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════
// 4. CAR ROULETTE / LUXURY BRAND SPIN (Speed Club)
// ═══════════════════════════════════════════════════════════════

const CAR_BRANDS = [
  { id: 'ferrari', name: 'Ferrari', multiplier: 40, weight: 3, tier: 'supercar', color: '#EF4444', emoji: '🏎️' },
  { id: 'lamborghini', name: 'Lamborghini', multiplier: 30, weight: 5, tier: 'supercar', color: '#F59E0B', emoji: '🐂' },
  { id: 'maserati', name: 'Maserati', multiplier: 20, weight: 8, tier: 'supercar', color: '#3B82F6', emoji: '🔱' },
  { id: 'porsche', name: 'Porsche', multiplier: 10, weight: 12, tier: 'supercar', color: '#EAB308', emoji: '🐎' },
  { id: 'mercedes', name: 'Mercedes-Benz', multiplier: 5, weight: 18, tier: 'luxury', color: '#94A3B8', emoji: '⭐' },
  { id: 'bmw', name: 'BMW', multiplier: 5, weight: 18, tier: 'luxury', color: '#0EA5E9', emoji: '⚡' },
  { id: 'audi', name: 'Audi', multiplier: 5, weight: 18, tier: 'luxury', color: '#CBD5E1', emoji: '⭕' },
  { id: 'volkswagen', name: 'Volkswagen', multiplier: 5, weight: 18, tier: 'luxury', color: '#6366F1', emoji: '🚙' },
];

let recentCarWinners = ['mercedes', 'bmw', 'audi', 'porsche', 'volkswagen', 'maserati'];

function pickWeightedCarWinner() {
  const totalWeight = CAR_BRANDS.reduce((sum, item) => sum + item.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const car of CAR_BRANDS) {
    if (randomVal < car.weight) {
      return car;
    }
    randomVal -= car.weight;
  }
  return CAR_BRANDS[CAR_BRANDS.length - 1];
}

/**
 * @desc    Get Car Roulette game state & user info
 * @route   GET /api/games/car-roulette/state
 */
exports.getCarRouletteState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let coins = 0;
    let todayEarnings = 0;
    let totalWinnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins carRouletteStats');
      if (user) {
        coins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.carRouletteStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.carRouletteStats.todayEarnings || 0;
        }
        totalWinnings = user.carRouletteStats?.totalWinnings || 0;
      }
    }

    return res.status(200).json({
      success: true,
      coins,
      todayEarnings,
      totalWinnings,
      brands: CAR_BRANDS,
      recentWinners: recentCarWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('getCarRouletteState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Place bet and spin the Car Roulette
 * @route   POST /api/games/car-roulette/spin
 */
exports.spinCarRoulette = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body; // { [brandId]: betAmount }
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    let totalBet = 0;
    for (const [brandId, amount] of Object.entries(bets)) {
      const num = Number(amount);
      if (num > 0) {
        totalBet += num;
      }
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Bet amount must be greater than 0' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.coins || 0) < totalBet) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_COINS',
        message: 'Insufficient coins balance. Please recharge first.',
        currentCoins: user.coins || 0,
        requiredCoins: totalBet,
      });
    }

    // 1. Pick Winner with weighted probability
    const winner = pickWeightedCarWinner();

    // 2. Add winner to recent history
    recentCarWinners.unshift(winner.id);
    if (recentCarWinners.length > 20) {
      recentCarWinners = recentCarWinners.slice(0, 20);
    }

    // 3. Calculate winnings
    const betOnWinner = Number(bets[winner.id]) || 0;
    const wonCoins = betOnWinner * winner.multiplier;

    // 4. Update user balance & stats atomically
    const todayStr = getTodayString();
    let currentTodayEarnings = 0;
    if (user.carRouletteStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.carRouletteStats.todayEarnings || 0;
    }
    const newTodayEarnings = currentTodayEarnings + wonCoins;
    const netCoinChange = wonCoins - totalBet;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'carRouletteStats.totalWinnings': wonCoins,
          'carRouletteStats.roundsPlayed': 1,
        },
        $set: {
          'carRouletteStats.todayEarnings': newTodayEarnings,
          'carRouletteStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      winner: winner.id,
      winnerDetails: winner,
      betOnWinner,
      wonCoins,
      netProfit: wonCoins - totalBet,
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentCarWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('spinCarRoulette error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
  { id: 'lamborghini', name: 'Lamborghini', multiplier: 30, weight: 5, tier: 'supercar', color: '#F59E0B', emoji: '🏎️' },
  { id: 'maserati', name: 'Maserati', multiplier: 20, weight: 8, tier: 'supercar', color: '#3B82F6', emoji: '🏎️' },
  { id: 'porsche', name: 'Porsche', multiplier: 10, weight: 12, tier: 'supercar', color: '#EAB308', emoji: '🏎️' },
  { id: 'mercedes', name: 'Mercedes-Benz', multiplier: 5, weight: 18, tier: 'luxury', color: '#94A3B8', emoji: '🚗' },
  { id: 'bmw', name: 'BMW', multiplier: 5, weight: 18, tier: 'luxury', color: '#0EA5E9', emoji: '🚗' },
  { id: 'audi', name: 'Audi', multiplier: 5, weight: 18, tier: 'luxury', color: '#CBD5E1', emoji: '🚗' },
  { id: 'volkswagen', name: 'Volkswagen', multiplier: 5, weight: 18, tier: 'luxury', color: '#6366F1', emoji: '🚗' },
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


// ═══════════════════════════════════════════════════════════════
// 5. ZOO SLOTS / WILD ANIMAL REELS CONTROLLER
// ═══════════════════════════════════════════════════════════════

const ZOO_SLOT_SYMBOLS = [
  { id: 'wild_paw', name: 'Golden Paw', emoji: '🐾', multiplier: 500, weight: 3, isWild: true },
  { id: 'lion', name: 'Lion King', emoji: '🦁', multiplier: 250, weight: 4 },
  { id: 'tiger', name: 'Tiger Cub', emoji: '🐯', multiplier: 100, weight: 7 },
  { id: 'panda', name: 'Bamboo Panda', emoji: '🐼', multiplier: 50, weight: 12 },
  { id: 'elephant', name: 'Lucky Elephant', emoji: '🐘', multiplier: 25, weight: 18 },
  { id: 'monkey', name: 'Playful Monkey', emoji: '🐵', multiplier: 15, weight: 24 },
  { id: 'banana', name: 'Golden Bananas', emoji: '🍌', multiplier: 8, weight: 32 },
];

function pickRandomZooSymbol() {
  const totalWeight = ZOO_SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const s of ZOO_SLOT_SYMBOLS) {
    if (randomVal < s.weight) {
      return s.id;
    }
    randomVal -= s.weight;
  }
  return 'banana';
}

let recentZooWinners = ['wild_paw', 'lion', 'panda', 'tiger', 'monkey', 'elephant', 'banana', 'lion'];

/**
 * @desc    Get Zoo Slots game state & paytable
 * @route   GET /api/games/zoo-slots/state
 */
exports.getZooSlotsState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins zooSlotsStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.zooSlotsStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.zooSlotsStats.todayEarnings || 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      paytable: ZOO_SLOT_SYMBOLS,
      userCoins,
      todayEarnings,
      jackpotPool: 888888,
      recentWinners: recentZooWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('getZooSlotsState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Execute a spin in Zoo Slots (with Dynamic Wild & Bamboo Respin)
 * @route   POST /api/games/zoo-slots/spin
 */
exports.spinZooSlots = async (req, res) => {
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

    // 1. Initial 3 reels spin
    let r1 = pickRandomZooSymbol();
    let r2 = pickRandomZooSymbol();
    let r3 = pickRandomZooSymbol();
    let initialReels = [r1, r2, r3];

    let respinTriggered = false;

    // Dynamic Bamboo Respin: If reel 1 and 2 match or 1 is Wild, but reel 3 misses
    if ((r1 === r2 || r1 === 'wild_paw' || r2 === 'wild_paw') && r3 !== r1 && r3 !== r2) {
      // 30% chance for Bamboo Respin mystery trigger
      if (Math.random() < 0.30) {
        respinTriggered = true;
        // Respin reel 3
        r3 = pickRandomZooSymbol();
      }
    }

    const finalReels = [r1, r2, r3];

    // 2. Calculate Payout with Dynamic Wild Substitution
    let multiplier = 0;
    let winType = 'none';
    let wildBoost = 1;

    const hasWild = finalReels.includes('wild_paw');
    const wildCount = finalReels.filter((s) => s === 'wild_paw').length;

    // Check for 3 of a kind (direct or with wild)
    if (wildCount === 3) {
      multiplier = 500;
      winType = 'jackpot';
    } else {
      // Find non-wild symbols
      const nonWilds = finalReels.filter((s) => s !== 'wild_paw');
      const uniqueNonWilds = [...new Set(nonWilds)];

      if (uniqueNonWilds.length === 1) {
        // All non-wilds are identical -> 3 matching line!
        const matchedSymbolId = uniqueNonWilds[0];
        const matchConfig = ZOO_SLOT_SYMBOLS.find((s) => s.id === matchedSymbolId);
        multiplier = matchConfig ? matchConfig.multiplier : 8;

        if (hasWild) {
          // Dynamic Paw Roar Multiplier: 2x or 3x boost!
          wildBoost = Math.random() < 0.4 ? 3 : 2;
          multiplier *= wildBoost;
        }

        winType = multiplier >= 200 ? 'jackpot' : 'win';
      } else if (wildCount === 2) {
        multiplier = 10;
        winType = 'small';
      } else if (wildCount === 1) {
        multiplier = 2;
        winType = 'small';
      } else {
        // Check for any 3 animals (excluding bananas)
        const isAllAnimals = finalReels.every((s) => s !== 'banana' && s !== 'wild_paw');
        if (isAllAnimals) {
          multiplier = 3;
          winType = 'small';
        }
      }
    }

    const wonCoins = bet * multiplier;
    const netCoinChange = wonCoins - bet;
    const todayStr = getTodayString();

    // 3. Determine representative outcome symbol for recent history
    let outcomeSymbol = 'banana';
    if (multiplier > 0) {
      if (wildCount === 3) {
        outcomeSymbol = 'wild_paw';
      } else {
        const nonWilds = finalReels.filter((s) => s !== 'wild_paw');
        outcomeSymbol = nonWilds.length > 0 ? nonWilds[0] : 'wild_paw';
      }
    } else {
      if (r1 === r2 || r1 === r3) {
        outcomeSymbol = r1;
      } else if (r2 === r3) {
        outcomeSymbol = r2;
      } else {
        outcomeSymbol = finalReels[1] || finalReels[0];
      }
    }

    recentZooWinners.unshift(outcomeSymbol);
    if (recentZooWinners.length > 20) {
      recentZooWinners = recentZooWinners.slice(0, 20);
    }

    let currentTodayEarnings = 0;
    if (user.zooSlotsStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.zooSlotsStats.todayEarnings || 0;
    }
    const newTodayEarnings = Math.max(0, currentTodayEarnings + wonCoins);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'zooSlotsStats.totalWinnings': wonCoins,
          'zooSlotsStats.spinsPlayed': 1,
        },
        $set: {
          'zooSlotsStats.todayEarnings': newTodayEarnings,
          'zooSlotsStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      initialReels,
      reels: finalReels,
      respinTriggered,
      wildBoost,
      multiplier,
      wonCoins,
      winType,
      spentCoins: bet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentZooWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('spinZooSlots error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ══════════════════════════════════════════════════════════════════════════════════
// 6. OCEAN KING / FISHING FRENZY CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════════

const OCEAN_CREATURES = [
  { id: 'clownfish', name: 'Clownfish', multiplier: 2, weight: 35, color: '#FB923C', emoji: '🐠', tier: 'safe' },
  { id: 'pufferfish', name: 'Pufferfish', multiplier: 4, weight: 22, color: '#FACC15', emoji: '🐡', tier: 'safe' },
  { id: 'octopus', name: 'Electric Octopus', multiplier: 8, weight: 14, color: '#A855F7', emoji: '🐙', tier: 'safe' },
  { id: 'turtle', name: 'Golden Sea Turtle', multiplier: 15, weight: 10, color: '#10B981', emoji: '🐢', tier: 'mid' },
  { id: 'shark', name: 'Hammerhead Shark', multiplier: 30, weight: 7, color: '#0EA5E9', emoji: '🦈', tier: 'mid' },
  { id: 'mermaid', name: 'Deep Sea Mermaid', multiplier: 60, weight: 4.5, color: '#EC4899', emoji: '🧜‍♀️', tier: 'high' },
  { id: 'kraken', name: 'Mega Kraken', multiplier: 120, weight: 2.5, color: '#8B5CF6', emoji: '🦑', tier: 'high' },
  { id: 'dragon_king', name: 'Golden Dragon King', multiplier: 300, weight: 1.2, color: '#F59E0B', emoji: '🐉', tier: 'jackpot' },
];

let recentOceanWinners = ['clownfish', 'shark', 'turtle', 'pufferfish', 'dragon_king', 'mermaid', 'octopus', 'clownfish'];

function pickRandomOceanCreature() {
  const totalWeight = OCEAN_CREATURES.reduce((sum, c) => sum + c.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const c of OCEAN_CREATURES) {
    if (randomVal < c.weight) {
      return c;
    }
    randomVal -= c.weight;
  }
  return OCEAN_CREATURES[0];
}

/**
 * @desc    Get Ocean King game state & paytable
 * @route   GET /api/games/ocean-king/state
 */
exports.getOceanKingState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins oceanKingStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.oceanKingStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.oceanKingStats.todayEarnings || 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      creatures: OCEAN_CREATURES,
      userCoins,
      todayEarnings,
      jackpotPool: 999999,
      recentWinners: recentOceanWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('getOceanKingState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Play Ocean King round (with Poseidon\'s Trident Surge & dynamic catch)
 * @route   POST /api/games/ocean-king/play
 */
exports.playOceanKing = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body;
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    let totalBet = 0;
    const creatureIds = OCEAN_CREATURES.map((c) => c.id);

    for (const [key, val] of Object.entries(bets)) {
      if (!creatureIds.includes(key)) {
        return res.status(400).json({ success: false, message: 'Invalid sea creature: ' + key });
      }
      const amount = Math.floor(Number(val) || 0);
      if (amount < 0) {
        return res.status(400).json({ success: false, message: 'Bet amounts cannot be negative' });
      }
      totalBet += amount;
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Please place a bet on at least one sea creature' });
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

    // 1. Pick winning creature
    const winningCreature = pickRandomOceanCreature();

    // 2. Dynamic Poseidon\'s Trident Surge (20% chance to trigger 2X or 3X multiplier boost!)
    let tridentSurge = false;
    let surgeMultiplier = 1;
    if (Math.random() < 0.20) {
      tridentSurge = true;
      surgeMultiplier = Math.random() < 0.35 ? 3 : 2;
    }

    // 3. Prepend to recent history (max 20)
    recentOceanWinners.unshift(winningCreature.id);
    if (recentOceanWinners.length > 20) {
      recentOceanWinners = recentOceanWinners.slice(0, 20);
    }

    // 4. Calculate winnings
    const betOnWinner = Math.floor(Number(bets[winningCreature.id]) || 0);
    const effectiveMultiplier = winningCreature.multiplier * surgeMultiplier;
    const wonCoins = betOnWinner * effectiveMultiplier;
    const netCoinChange = wonCoins - totalBet;

    const todayStr = getTodayString();
    let currentTodayEarnings = 0;
    if (user.oceanKingStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.oceanKingStats.todayEarnings || 0;
    }
    const newTodayEarnings = Math.max(0, currentTodayEarnings + wonCoins);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'oceanKingStats.totalWinnings': wonCoins,
          'oceanKingStats.roundsPlayed': 1,
        },
        $set: {
          'oceanKingStats.todayEarnings': newTodayEarnings,
          'oceanKingStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      winningCreature,
      tridentSurge,
      surgeMultiplier,
      effectiveMultiplier,
      wonCoins,
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentOceanWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('playOceanKing error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ══════════════════════════════════════════════════════════════════════════════════
// 7. FRUIT PARTY / LUCKY FRUIT CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════════

const FRUIT_ITEMS = [
  { id: 'cherry', name: 'Lucky Cherry', multiplier: 2, weight: 34, color: '#EF4444', emoji: '🍒', tier: 'safe' },
  { id: 'orange', name: 'Juicy Orange', multiplier: 3, weight: 24, color: '#F97316', emoji: '🍊', tier: 'safe' },
  { id: 'lemon', name: 'Golden Lemon', multiplier: 5, weight: 16, color: '#EAB308', emoji: '🍋', tier: 'safe' },
  { id: 'grapes', name: 'Royal Grapes', multiplier: 10, weight: 11, color: '#A855F7', emoji: '🍇', tier: 'mid' },
  { id: 'watermelon', name: 'Sweet Melon', multiplier: 15, weight: 7.5, color: '#10B981', emoji: '🍉', tier: 'mid' },
  { id: 'bell', name: 'Golden Bell', multiplier: 25, weight: 4.5, color: '#F59E0B', emoji: '🔔', tier: 'high' },
  { id: 'star', name: 'Diamond Star', multiplier: 50, weight: 2.2, color: '#38BDF8', emoji: '⭐', tier: 'high' },
  { id: 'bar', name: 'Lucky BAR Crown', multiplier: 100, weight: 0.8, color: '#EC4899', emoji: '👑', tier: 'jackpot' },
];

let recentFruitWinners = ['cherry', 'watermelon', 'orange', 'grapes', 'bar', 'lemon', 'bell', 'cherry'];

function pickRandomFruitItem() {
  const totalWeight = FRUIT_ITEMS.reduce((sum, f) => sum + f.weight, 0);
  let randomVal = Math.random() * totalWeight;
  for (const f of FRUIT_ITEMS) {
    if (randomVal < f.weight) {
      return f;
    }
    randomVal -= f.weight;
  }
  return FRUIT_ITEMS[0];
}

/**
 * @desc    Get Fruit Party game state & paytable
 * @route   GET /api/games/fruit-party/state
 */
exports.getFruitPartyState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins fruitPartyStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.fruitPartyStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.fruitPartyStats.todayEarnings || 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      fruits: FRUIT_ITEMS,
      userCoins,
      todayEarnings,
      jackpotPool: 888888,
      recentWinners: recentFruitWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('getFruitPartyState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Play Fruit Party round (with Party Fever Multiplier Surge)
 * @route   POST /api/games/fruit-party/play
 */
exports.playFruitParty = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body;
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    let totalBet = 0;
    const fruitIds = FRUIT_ITEMS.map((f) => f.id);

    for (const [key, val] of Object.entries(bets)) {
      if (!fruitIds.includes(key)) {
        return res.status(400).json({ success: false, message: 'Invalid fruit symbol: ' + key });
      }
      const amount = Math.floor(Number(val) || 0);
      if (amount < 0) {
        return res.status(400).json({ success: false, message: 'Bet amounts cannot be negative' });
      }
      totalBet += amount;
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Please place a bet on at least one fruit' });
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

    // 1. Pick winning fruit
    const winningFruit = pickRandomFruitItem();

    // 2. Dynamic Party Fever Multiplier Surge (20% chance to boost multiplier by 2X or 3X!)
    let partyFever = false;
    let feverMultiplier = 1;
    if (Math.random() < 0.20) {
      partyFever = true;
      feverMultiplier = Math.random() < 0.35 ? 3 : 2;
    }

    // 3. Prepend to recent history (max 20)
    recentFruitWinners.unshift(winningFruit.id);
    if (recentFruitWinners.length > 20) {
      recentFruitWinners = recentFruitWinners.slice(0, 20);
    }

    // 4. Calculate winnings
    const betOnWinner = Math.floor(Number(bets[winningFruit.id]) || 0);
    const effectiveMultiplier = winningFruit.multiplier * feverMultiplier;
    const wonCoins = betOnWinner * effectiveMultiplier;
    const netCoinChange = wonCoins - totalBet;

    const todayStr = getTodayString();
    let currentTodayEarnings = 0;
    if (user.fruitPartyStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.fruitPartyStats.todayEarnings || 0;
    }
    const newTodayEarnings = Math.max(0, currentTodayEarnings + wonCoins);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'fruitPartyStats.totalWinnings': wonCoins,
          'fruitPartyStats.roundsPlayed': 1,
        },
        $set: {
          'fruitPartyStats.todayEarnings': newTodayEarnings,
          'fruitPartyStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      winningFruit,
      partyFever,
      feverMultiplier,
      effectiveMultiplier,
      wonCoins,
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentFruitWinners.slice(0, 10),
    });
  } catch (error) {
    console.error('playFruitParty error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ══════════════════════════════════════════════════════════════════════════════════
// 8. DRAGON VS TIGER (LEGENDARY 2-CARD SHOWDOWN) CONTROLLER
// ══════════════════════════════════════════════════════════════════════════════════

const SUITS = [
  { id: 'spades', symbol: '♠', color: '#1E293B', isRed: false },
  { id: 'hearts', symbol: '♥', color: '#EF4444', isRed: true },
  { id: 'clubs', symbol: '♣', color: '#1E293B', isRed: false },
  { id: 'diamonds', symbol: '♦', color: '#EF4444', isRed: true },
];

const RANKS = [
  { rank: 'A', value: 1, name: 'Ace' },
  { rank: '2', value: 2, name: '2' },
  { rank: '3', value: 3, name: '3' },
  { rank: '4', value: 4, name: '4' },
  { rank: '5', value: 5, name: '5' },
  { rank: '6', value: 6, name: '6' },
  { rank: '7', value: 7, name: '7' },
  { rank: '8', value: 8, name: '8' },
  { rank: '9', value: 9, name: '9' },
  { rank: '10', value: 10, name: '10' },
  { rank: 'J', value: 11, name: 'Jack' },
  { rank: 'Q', value: 12, name: 'Queen' },
  { rank: 'K', value: 13, name: 'King' },
];

let recentDragonTigerWinners = ['dragon', 'tiger', 'dragon', 'dragon', 'tiger', 'tie', 'tiger', 'dragon'];

function drawTwoCards() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        rank: rank.rank,
        value: rank.value,
        name: rank.name,
        suit: suit.id,
        suitSymbol: suit.symbol,
        isRed: suit.isRed,
      });
    }
  }

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const dragonCard = deck[0];
  const tigerCard = deck[1];

  let winner = 'tie';
  if (dragonCard.value > tigerCard.value) {
    winner = 'dragon';
  } else if (tigerCard.value > dragonCard.value) {
    winner = 'tiger';
  }

  const isSuitedTie = winner === 'tie' && dragonCard.suit === tigerCard.suit;

  return { dragonCard, tigerCard, winner, isSuitedTie };
}

/**
 * @desc    Get Dragon vs Tiger state
 * @route   GET /api/games/dragon-tiger/state
 */
exports.getDragonTigerState = async (req, res) => {
  try {
    const userId = req.user?._id;
    let userCoins = 0;
    let todayEarnings = 0;

    if (userId) {
      const user = await User.findById(userId).select('coins dragonTigerStats');
      if (user) {
        userCoins = user.coins || 0;
        const todayStr = getTodayString();
        if (user.dragonTigerStats?.lastEarningsDate === todayStr) {
          todayEarnings = user.dragonTigerStats.todayEarnings || 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      userCoins,
      todayEarnings,
      jackpotPool: 777777,
      recentWinners: recentDragonTigerWinners.slice(0, 12),
      multipliers: {
        dragon: 2,
        tiger: 2,
        tie: 9,
        suitedTie: 25,
      },
    });
  } catch (error) {
    console.error('getDragonTigerState error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Play Dragon vs Tiger round
 * @route   POST /api/games/dragon-tiger/play
 */
exports.playDragonTiger = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { bets } = req.body;
    if (!bets || typeof bets !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid bets object' });
    }

    const validSides = ['dragon', 'tiger', 'tie'];
    let totalBet = 0;

    for (const [side, val] of Object.entries(bets)) {
      if (!validSides.includes(side)) {
        return res.status(400).json({ success: false, message: 'Invalid betting side: ' + side });
      }
      const amount = Math.floor(Number(val) || 0);
      if (amount < 0) {
        return res.status(400).json({ success: false, message: 'Bet amounts cannot be negative' });
      }
      totalBet += amount;
    }

    if (totalBet <= 0) {
      return res.status(400).json({ success: false, message: 'Please place a bet on Dragon, Tiger, or Tie' });
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

    // 1. Draw 2 cards and determine outcome
    const { dragonCard, tigerCard, winner, isSuitedTie } = drawTwoCards();

    // 2. Prepend to history (max 20)
    recentDragonTigerWinners.unshift(winner);
    if (recentDragonTigerWinners.length > 20) {
      recentDragonTigerWinners = recentDragonTigerWinners.slice(0, 20);
    }

    // 3. Dynamic Imperial Dragon/Tiger Roar (15% chance to boost winner multiplier to 3X)
    let imperialBoost = false;
    let boostMultiplier = 1;
    if (winner !== 'tie' && Math.random() < 0.15) {
      imperialBoost = true;
      boostMultiplier = 1.5; // 2X * 1.5 = 3X total payout!
    }

    // 4. Calculate winnings
    let wonCoins = 0;
    const betDragon = Math.floor(Number(bets.dragon) || 0);
    const betTiger = Math.floor(Number(bets.tiger) || 0);
    const betTie = Math.floor(Number(bets.tie) || 0);

    let effectiveMultiplier = 2;

    if (winner === 'dragon') {
      effectiveMultiplier = Math.round(2 * boostMultiplier);
      wonCoins = betDragon * effectiveMultiplier;
    } else if (winner === 'tiger') {
      effectiveMultiplier = Math.round(2 * boostMultiplier);
      wonCoins = betTiger * effectiveMultiplier;
    } else if (winner === 'tie') {
      effectiveMultiplier = isSuitedTie ? 25 : 9;
      // Tie bet wins 9X (or 25X for suited tie)
      wonCoins = betTie * effectiveMultiplier;
      // Standard casino rule: on Tie, 50% of Dragon & Tiger bets are refunded!
      wonCoins += Math.floor((betDragon + betTiger) * 0.5);
    }

    const netCoinChange = wonCoins - totalBet;

    const todayStr = getTodayString();
    let currentTodayEarnings = 0;
    if (user.dragonTigerStats?.lastEarningsDate === todayStr) {
      currentTodayEarnings = user.dragonTigerStats.todayEarnings || 0;
    }
    const newTodayEarnings = Math.max(0, currentTodayEarnings + wonCoins);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          coins: netCoinChange,
          'dragonTigerStats.totalWinnings': wonCoins,
          'dragonTigerStats.roundsPlayed': 1,
        },
        $set: {
          'dragonTigerStats.todayEarnings': newTodayEarnings,
          'dragonTigerStats.lastEarningsDate': todayStr,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      winner,
      dragonCard,
      tigerCard,
      isSuitedTie,
      imperialBoost,
      effectiveMultiplier,
      wonCoins,
      spentCoins: totalBet,
      remainingCoins: updatedUser.coins,
      todayEarnings: newTodayEarnings,
      recentWinners: recentDragonTigerWinners.slice(0, 12),
    });
  } catch (error) {
    console.error('playDragonTiger error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

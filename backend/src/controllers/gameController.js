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

    // Default mock leaderboard if none exists
    const leaderboard = {
      weeklyPrize: 300000,
      topWinner: {
        name: 'King_Raftar',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        coins: 69251000,
      },
      todayWinner: {
        name: 'Aman_Star',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        coins: 4648800,
      },
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

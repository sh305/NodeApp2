const User = require('../models/User');
const Room = require('../models/Room');

// @desc    Get User Profile by ID (Enforces Block Logic)
// @route   GET /api/users/:id/profile
exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requesterId = req.user._id;

    const targetUser = await User.findById(targetUserId).select('-phoneNumber -email');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if target user has blocked requester
    const isBlockedByTarget = targetUser.blockedUsers.some(
      (blockedId) => blockedId.toString() === requesterId.toString()
    );

    if (isBlockedByTarget) {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: 'Aap is user ki ID visit nahi kar sakte kyunki unhone aapko block kiya hua hai.',
      });
    }

    // Check if requester has blocked target
    const isRequesterBlockedTarget = req.user.blockedUsers.some(
      (bId) => bId.toString() === targetUserId.toString()
    );

    return res.status(200).json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        gender: targetUser.gender,
        wealthLevel: targetUser.wealthLevel,
        charmLevel: targetUser.charmLevel,
        activeFrame: targetUser.activeFrame,
        isBlockedByYou: isRequesterBlockedTarget,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block a User
// @route   POST /api/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;

    if (targetUserId.toString() === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    if (!currentUser.blockedUsers.includes(targetUserId)) {
      currentUser.blockedUsers.push(targetUserId);
      await currentUser.save();
    }

    return res.status(200).json({
      success: true,
      message: 'User ko successfully block kar diya gaya hai. Ab wo aapki ID visit nahi kar payenge.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unblock a User
// @route   POST /api/users/:id/unblock
exports.unblockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== targetUserId.toString()
    );
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: 'User ko successfully unblock kar diya gaya hai.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get List of Blocked Users
// @route   GET /api/users/blocked/list
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name avatar wealthLevel activeFrame');
    return res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Follow a User (Follow / Unfollow)
// @route   POST /api/users/:id/follow
exports.toggleFollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    const isAlreadyFollowing = currentUser.following && currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (isAlreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = (targetUser.followers || []).filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({
        success: true,
        following: false,
        message: `Unfollowed ${targetUser.name}`,
      });
    } else {
      // Follow
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];

      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      return res.status(200).json({
        success: true,
        following: true,
        message: `Followed ${targetUser.name}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Active Live Rooms Created by Followed Users
// @route   GET /api/users/following/rooms
exports.getFollowingRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const followingIds = user.following || [];

    if (followingIds.length === 0) {
      return res.status(200).json({
        success: true,
        rooms: [],
      });
    }

    // Find rooms owned by followed users
    const rooms = await Room.find({
      owner: { $in: followingIds },
      isEnded: { $ne: true },
    })
      .populate('owner', 'name avatar wealthLevel activeFrame')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      rooms: rooms || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Visited Room
// @route   POST /api/users/recent-rooms/:roomId
exports.recordRecentRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user._id;

    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const user = await User.findById(currentUserId);
    if (!user.recentRooms) user.recentRooms = [];

    // Filter out if already present, then prepend to top (most recent first)
    user.recentRooms = user.recentRooms.filter((id) => id.toString() !== roomId.toString());
    user.recentRooms.unshift(roomId);

    // Keep max 25 recent rooms
    if (user.recentRooms.length > 25) {
      user.recentRooms = user.recentRooms.slice(0, 25);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Room recorded in recent history',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Recently Visited Rooms
// @route   GET /api/users/recent-rooms
exports.getRecentRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const recentRoomIds = user.recentRooms || [];

    if (recentRoomIds.length === 0) {
      return res.status(200).json({
        success: true,
        rooms: [],
      });
    }

    // Fetch rooms and preserve order
    const rooms = await Room.find({
      _id: { $in: recentRoomIds },
      isEnded: { $ne: true },
    }).populate('owner', 'name avatar wealthLevel activeFrame');

    // Sort by recentRoomIds order
    const roomMap = new Map();
    rooms.forEach((r) => roomMap.set(r._id.toString(), r));

    const orderedRooms = [];
    for (const rId of recentRoomIds) {
      const found = roomMap.get(rId.toString());
      if (found) orderedRooms.push(found);
    }

    return res.status(200).json({
      success: true,
      rooms: orderedRooms,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DAILY SILVER CHEST GAMING COINS SYSTEM =================
const CHEST_REWARDS = [100, 300, 600, 1000, 1500, 2200, 3500];

// @desc    Get Silver Chest Daily Claim Status
// @route   GET /api/users/game-chest/status
exports.getGameChestStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coins gameCoins gameChestStreak lastGameChestClaim');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const lastClaim = user.lastGameChestClaim ? new Date(user.lastGameChestClaim) : null;
    let canClaim = false;
    let streak = user.gameChestStreak || 0;

    if (!lastClaim) {
      canClaim = true;
      streak = 0;
    } else {
      const diffMs = now - lastClaim;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Check if last claim was on a previous calendar day (or >= 20 hours)
      const isSameDay =
        now.getFullYear() === lastClaim.getFullYear() &&
        now.getMonth() === lastClaim.getMonth() &&
        now.getDate() === lastClaim.getDate();

      if (isSameDay) {
        canClaim = false;
      } else if (diffHours < 48) {
        // Consecutive day
        canClaim = true;
      } else {
        // Streak broken after 48 hours
        streak = 0;
        canClaim = true;
      }
    }

    const nextRewardIndex = streak % CHEST_REWARDS.length;
    const nextReward = CHEST_REWARDS[nextRewardIndex];

    // Testing override: ensure 2,000 game coins for princeraie09@gmail.com
    if (user.email === 'princeraie09@gmail.com' && (user.gameCoins || 0) < 2000) {
      user.gameCoins = 2000;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      canClaim,
      streak,
      nextReward,
      gameCoins: user.gameCoins || 0,
      walletCoins: user.coins || 0,
      rewardTable: CHEST_REWARDS,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Claim Daily Silver Chest Reward (Free Green Game Coins)
// @route   POST /api/users/game-chest/claim
exports.claimGameChest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const lastClaim = user.lastGameChestClaim ? new Date(user.lastGameChestClaim) : null;
    let newStreak = 1;

    if (lastClaim) {
      const isSameDay =
        now.getFullYear() === lastClaim.getFullYear() &&
        now.getMonth() === lastClaim.getMonth() &&
        now.getDate() === lastClaim.getDate();

      if (isSameDay) {
        return res.status(400).json({
          success: false,
          message: 'Silver Chest already claimed for today! Come back tomorrow.',
        });
      }

      const diffHours = (now - lastClaim) / (1000 * 60 * 60);
      if (diffHours < 48) {
        newStreak = (user.gameChestStreak || 0) + 1;
      } else {
        newStreak = 1; // Streak reset
      }
    }

    const rewardIndex = (newStreak - 1) % CHEST_REWARDS.length;
    const rewardCoins = CHEST_REWARDS[rewardIndex];

    user.gameCoins = (user.gameCoins || 0) + rewardCoins;
    user.gameChestStreak = newStreak;
    user.lastGameChestClaim = now;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Badhai ho! Day ${newStreak} ka Silver Chest claim safal raha. +${rewardCoins} Game Coins mile! 🎉`,
      rewardCoins,
      gameCoins: user.gameCoins,
      streak: newStreak,
      canClaim: false,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deduct Game Coins for Bet
// @route   POST /api/users/game/deduct-bet
exports.deductGameBet = async (req, res) => {
  try {
    const { betAmount = 100 } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentCoins = user.gameCoins || 0;
    if (currentCoins < betAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Game Coins! ${betAmount} coins required.`,
      });
    }

    user.gameCoins = currentCoins - betAmount;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${betAmount} Game Coins bet placed! Good luck 🎮`,
      gameCoins: user.gameCoins,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Award Win Coins when User Wins a Game
// @route   POST /api/users/game/award-win
exports.awardGameWin = async (req, res) => {
  try {
    const { winAmount = 180, gameName = 'Game' } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const prize = Math.max(1, Number(winAmount) || 180);
    user.gameCoins = (user.gameCoins || 0) + prize;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Victory! You won +${prize} Game Coins! 🏆🎉`,
      gameCoins: user.gameCoins,
      winAmount: prize,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Game Loss or Quit Forfeit
// @route   POST /api/users/game/forfeit
exports.forfeitGame = async (req, res) => {
  try {
    const { betAmount = 100, gameName = 'Game', reason = 'quit' } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: reason === 'quit'
        ? `Bet of ${betAmount} Game Coins forfeited for quitting.`
        : `Bet of ${betAmount} Game Coins deducted for match loss.`,
      gameCoins: user.gameCoins,
      lostAmount: betAmount,
      reason,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




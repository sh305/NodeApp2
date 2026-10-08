const User = require('../models/User');
const Room = require('../models/Room');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get User Profile by ID (Enforces Block Logic)
// @route   GET /api/users/:id/profile
exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requesterId = req.user._id;

    const targetUser = await User.findById(targetUserId)
      .select('-phoneNumber -email')
      .populate('cpRelationships.partner', 'name avatar wealthLevel activeFrame gender');

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

    // Track profile visitors when another user visits (with timestamp)
    if (requesterId && requesterId.toString() !== targetUserId.toString()) {
      if (!targetUser.visitors) targetUser.visitors = [];
      const existingIdx = targetUser.visitors.findIndex((v) => {
        const vid = v && (v.user ? v.user.toString() : v.toString());
        return vid === requesterId.toString();
      });
      if (existingIdx >= 0) {
        targetUser.visitors[existingIdx] = {
          user: requesterId,
          visitedAt: new Date(),
        };
      } else {
        targetUser.visitors.unshift({
          user: requesterId,
          visitedAt: new Date(),
        });
      }
      await targetUser.save();
    }

    // Top 3 Supporters who gifted to targetUser
    let topSupporters = [];
    try {
      topSupporters = await Transaction.aggregate([
        { $match: { receiver: new mongoose.Types.ObjectId(targetUserId) } },
        {
          $group: {
            _id: '$sender',
            totalCoins: { $sum: '$totalCoins' },
            giftCount: { $sum: '$quantity' },
          },
        },
        { $sort: { totalCoins: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'senderInfo',
          },
        },
        { $unwind: '$senderInfo' },
        {
          $project: {
            _id: 1,
            name: '$senderInfo.name',
            avatar: '$senderInfo.avatar',
            wealthLevel: '$senderInfo.wealthLevel',
            totalCoins: 1,
          },
        },
      ]);
    } catch (aggErr) {
      console.warn('Error aggregating top supporters:', aggErr.message);
    }

    // Total contributed (coins gifted by targetUser)
    let totalContributed = targetUser.giftsSent || 0;
    try {
      const contAgg = await Transaction.aggregate([
        { $match: { sender: new mongoose.Types.ObjectId(targetUserId) } },
        { $group: { _id: null, total: { $sum: '$totalCoins' } } },
      ]);
      if (contAgg.length > 0 && contAgg[0].total > 0) {
        totalContributed = contAgg[0].total;
      }
    } catch (cErr) {
      // fallback to giftsSent
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        avatar: targetUser.avatar,
        gender: targetUser.gender || '',
        wealthLevel: targetUser.wealthLevel || 1,
        wealthExp: targetUser.wealthExp || 0,
        charmLevel: targetUser.charmLevel || 1,
        charmExp: targetUser.charmExp || 0,
        coins: targetUser.coins || 0,
        diamonds: targetUser.diamonds || 0,
        isVip: targetUser.isVip || false,
        vipLevel: targetUser.vipLevel || 0,
        activeFrame: targetUser.activeFrame,
        signature: targetUser.signature || '',
        birthday:
          targetUser.birthday && targetUser.birthday !== '1999-08-10'
            ? targetUser.birthday
            : '',
        country: targetUser.country || 'India',
        coverImage: targetUser.coverImage || '',
        height: targetUser.height || '',
        weight: targetUser.weight || '',
        occupation: targetUser.occupation || '',
        cpRelationships: targetUser.cpRelationships || [],
        topSupporters: topSupporters || [],
        totalContributed: totalContributed || 0,
        isBlockedByYou: isRequesterBlockedTarget,
        followersCount: targetUser.followers ? targetUser.followers.length : 0,
        followingCount: targetUser.following ? targetUser.following.length : 0,
        giftsSent: targetUser.giftsSent || 0,
        giftsReceived: targetUser.giftsReceived || 0,
        visitorsCount: targetUser.visitors ? targetUser.visitors.length : 0,
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

      // Auto update personal task: follow_1_person
      try {
        const UserTask = require('../models/UserTask');
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        let followTask = await UserTask.findOne({ user: currentUserId, date: todayStr, taskId: 'follow_1_person' });
        if (!followTask) {
          followTask = new UserTask({
            user: currentUserId,
            date: todayStr,
            taskId: 'follow_1_person',
            progress: 1,
            target: 1,
            completed: true,
            claimed: false,
            reward: 50,
          });
          await followTask.save();
        } else if (!followTask.claimed) {
          followTask.progress = Math.max(followTask.progress, 1);
          followTask.completed = true;
          await followTask.save();
        }
      } catch (taskErr) {
        console.warn('Error updating follow task:', taskErr.message);
      }

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

    const formattedRooms = (rooms || []).map((r) => {
      const rObj = r.toObject ? r.toObject() : r;
      rObj.activeMemberCount = r.activeMembers ? r.activeMembers.length : 0;
      return rObj;
    });

    return res.status(200).json({
      success: true,
      rooms: formattedRooms,
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
      if (found) {
        const rObj = found.toObject ? found.toObject() : found;
        rObj.activeMemberCount = found.activeMembers ? found.activeMembers.length : 0;
        orderedRooms.push(rObj);
      }
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

// @desc    Refund bet when user exits before game actually started (e.g. Time Bomb 'waiting' phase)
// @route   POST /api/users/game/refund-bet
exports.refundGameBet = async (req, res) => {
  try {
    const { betAmount = 100, gameName = 'Game', reason = 'game_not_started' } = req.body;
    const bet = Math.max(1, Number(betAmount) || 100);
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only refund if reason is game_not_started, draw, or tie to prevent abuse
    if (reason !== 'game_not_started' && reason !== 'draw' && reason !== 'tie') {
      return res.status(400).json({ success: false, message: 'Invalid refund reason.' });
    }

    user.gameCoins = (user.gameCoins || 0) + bet;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${bet} Game Coins refunded. Reason: ${reason}.`,
      gameCoins: user.gameCoins,
      refundedAmount: bet,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add EXP or reset level for user testing
// @route   POST /api/users/add-test-exp
exports.addTestExp = async (req, res) => {
  try {
    const { expToAdd, reset } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (reset) {
      user.wealthExp = 0;
      user.wealthLevel = 1;
      const { getUserFrameByLevel } = require('../services/levelService');
      const resetFrame = getUserFrameByLevel(1);
      user.activeFrame = resetFrame;
      await user.save();
      return res.status(200).json({
        success: true,
        user: {
          wealthLevel: user.wealthLevel,
          wealthExp: user.wealthExp,
          activeFrame: user.activeFrame,
        },
        message: 'Level and EXP reset to Level 1',
      });
    }

    const { addUserWealthExp } = require('../services/levelService');
    const result = addUserWealthExp(user, Math.max(0, parseInt(expToAdd, 10) || 0));
    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        wealthLevel: user.wealthLevel,
        wealthExp: user.wealthExp,
        activeFrame: user.activeFrame,
      },
      result,
      message: result.leveledUp
        ? `Leveled up to Level ${user.wealthLevel}!`
        : `Added ${expToAdd} EXP`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Current User Profile (Bio, Signature, Gender, Birthday, Country)
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, signature, gender, birthday, country, avatar, coverImage, height, weight, occupation } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (signature !== undefined) user.signature = signature.trim();
    if (gender && ['male', 'female', 'other', 'boy', 'girl'].includes(gender.toLowerCase())) {
      user.gender = gender.toLowerCase() === 'girl' ? 'female' : 'male';
    }
    if (birthday) user.birthday = birthday;
    if (country) user.country = country;
    if (avatar) user.avatar = avatar;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        gender: user.gender,
        signature: user.signature,
        birthday: user.birthday,
        country: user.country,
        coverImage: user.coverImage,
        height: user.height,
        weight: user.weight,
        occupation: user.occupation,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get followers of a user with mutual follow status
// @route   GET /api/users/:id/followers
// @access  Private
exports.getUserFollowers = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId).populate({
      path: 'followers',
      select: 'name avatar wealthLevel charmLevel signature gender customId followers following',
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId).select('following');
    const myFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));

    const list = (targetUser.followers || []).map((u) => {
      if (!u) return null;
      const uId = u._id.toString();
      const isFollowing = myFollowingSet.has(uId);
      const theirFollowingSet = new Set((u.following || []).map((id) => id.toString()));
      const isFollowedBy = theirFollowingSet.has(currentUserId.toString());
      const isMutual = isFollowing && isFollowedBy;

      return {
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        signature: u.signature || '',
        wealthLevel: u.wealthLevel || 1,
        charmLevel: u.charmLevel || 1,
        gender: u.gender || 'male',
        customId: u.customId || '',
        isFollowing,
        isFollowedBy,
        isMutual,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      users: list,
      count: list.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get users that target user is following with mutual follow status
// @route   GET /api/users/:id/following
// @access  Private
exports.getUserFollowing = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId).populate({
      path: 'following',
      select: 'name avatar wealthLevel charmLevel signature gender customId followers following',
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId).select('following');
    const myFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));

    const list = (targetUser.following || []).map((u) => {
      if (!u) return null;
      const uId = u._id.toString();
      const isFollowing = myFollowingSet.has(uId);
      const theirFollowingSet = new Set((u.following || []).map((id) => id.toString()));
      const isFollowedBy = theirFollowingSet.has(currentUserId.toString());
      const isMutual = isFollowing && isFollowedBy;

      return {
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        signature: u.signature || '',
        wealthLevel: u.wealthLevel || 1,
        charmLevel: u.charmLevel || 1,
        gender: u.gender || 'male',
        customId: u.customId || '',
        isFollowing,
        isFollowedBy,
        isMutual,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      users: list,
      count: list.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get visitors within 15 days of a user
// @route   GET /api/users/:id/visitors
// @access  Private
exports.getUserVisitors = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId).select('following');
    const myFollowingSet = new Set((currentUser?.following || []).map((id) => id.toString()));

    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Normalize visitors array
    const rawVisitors = targetUser.visitors || [];
    const normalized = [];

    for (const v of rawVisitors) {
      if (!v) continue;
      const visitorId = v.user ? v.user : v;
      const visitedAt = v.visitedAt ? new Date(v.visitedAt) : new Date();

      if (visitedAt >= fifteenDaysAgo) {
        normalized.push({
          userId: visitorId,
          visitedAt,
        });
      }
    }

    // Sort newest first
    normalized.sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt));

    // Populate user info
    const visitorUserIds = normalized.map((item) => item.userId);
    const populatedUsers = await User.find({
      _id: { $in: visitorUserIds },
    }).select('name avatar wealthLevel charmLevel signature gender customId followers following');

    const userMap = new Map();
    populatedUsers.forEach((u) => userMap.set(u._id.toString(), u));

    const list = [];
    const seen = new Set();

    for (const item of normalized) {
      const uIdStr = item.userId.toString();
      if (seen.has(uIdStr)) continue; // Keep only most recent visit per user
      seen.add(uIdStr);

      const u = userMap.get(uIdStr);
      if (!u) continue;

      const isFollowing = myFollowingSet.has(uIdStr);
      const theirFollowingSet = new Set((u.following || []).map((id) => id.toString()));
      const isFollowedBy = theirFollowingSet.has(currentUserId.toString());
      const isMutual = isFollowing && isFollowedBy;

      list.push({
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        signature: u.signature || '',
        wealthLevel: u.wealthLevel || 1,
        charmLevel: u.charmLevel || 1,
        gender: u.gender || 'male',
        customId: u.customId || '',
        visitedAt: item.visitedAt,
        isFollowing,
        isFollowedBy,
        isMutual,
      });
    }

    return res.status(200).json({
      success: true,
      visitors: list,
      count: list.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


const User = require('../models/User');

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

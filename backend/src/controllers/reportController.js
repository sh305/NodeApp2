const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Report a User ID (Options: 3days, 7days, permanent)
// @route   POST /api/reports
exports.submitReport = async (req, res) => {
  try {
    const { reportedUserId, roomId, reason, description, requestedBanDuration } = req.body;
    const reporterId = req.user._id;

    if (!['3days', '7days', 'permanent'].includes(requestedBanDuration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requestedBanDuration. Must be 3days, 7days, or permanent.',
      });
    }

    if (reportedUserId.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'Reported user does not exist' });
    }

    // Create Report Record
    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId,
      room: roomId || null,
      reason: reason || 'Inappropriate content / Voice',
      description: description || '',
      requestedBanDuration,
      status: 'applied',
    });

    // Apply Ban to target user account
    reportedUser.isBanned = true;
    reportedUser.banType = requestedBanDuration;
    reportedUser.bannedAt = new Date();
    reportedUser.banReason = reason;

    if (requestedBanDuration === '3days') {
      reportedUser.banExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    } else if (requestedBanDuration === '7days') {
      reportedUser.banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (requestedBanDuration === 'permanent') {
      reportedUser.banExpiresAt = null; // Permanent ban, never expires
    }

    await reportedUser.save();

    return res.status(201).json({
      success: true,
      message:
        requestedBanDuration === 'permanent'
          ? 'User ko permanent ban kar diya gaya hai. Wo ab is ID se dobara kabhi login nahi kar sakega.'
          : `User ko ${requestedBanDuration === '3days' ? '3 din' : '7 din'} ke liye ban kar diya gaya hai.`,
      report,
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Unban a User
// @route   POST /api/reports/unban/:userId
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = false;
    user.banType = null;
    user.banExpiresAt = null;
    user.bannedAt = null;
    user.banReason = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User account successfully unbanned.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

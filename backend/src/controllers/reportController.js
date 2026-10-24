const Report = require('../models/Report');
const User = require('../models/User');

// @desc    User submits a report with mandatory proof
// @route   POST /api/reports
exports.submitReport = async (req, res) => {
  try {
    const { reportedUserId, roomId, reason, description, proofUrl, proofType, requestedBanDuration } = req.body;
    const reporterId = req.user._id;

    // 1. Check if reporter's reporting privilege is currently blocked for false reporting
    if (req.user.reportingBlockedUntil && new Date() < new Date(req.user.reportingBlockedUntil)) {
      const daysRemaining = Math.ceil(
        (new Date(req.user.reportingBlockedUntil) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return res.status(403).json({
        success: false,
        message: `Your reporting privilege is suspended for ${daysRemaining} more day(s) due to previous false reports.`,
      });
    }

    // 2. Prevent self-reporting
    if (reportedUserId && reportedUserId.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    // 3. Verify target user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'Reported user does not exist' });
    }

    // 4. Mandatory proof check (Play Store UGC compliance & Anti-revenge)
    if (!proofUrl || !String(proofUrl).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Proof (Photo screenshot or video) is required to submit a report.',
      });
    }

    // 5. Enforce 24-hour rate limit between same reporter and target user
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentReport = await Report.findOne({
      reporter: reporterId,
      reportedUser: reportedUserId,
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (existingRecentReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a report for this user recently. Our moderation team is currently reviewing it.',
      });
    }

    // 6. Create Report Record with PENDING status (Requires Owner review)
    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId,
      room: roomId || null,
      reason: reason || 'Harassment / Abusive behavior',
      description: description ? description.trim() : '',
      proofUrl: String(proofUrl).trim(),
      proofType: proofType === 'video' ? 'video' : 'image',
      requestedBanDuration: ['3days', '7days', 'permanent'].includes(requestedBanDuration)
        ? requestedBanDuration
        : '3days',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety moderation team will review the submitted proof.',
      reportId: report._id,
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Owner: Get all reports grouped with stats and priority
// @route   GET /api/reports/admin/all
exports.getAdminReports = async (req, res) => {
  try {
    const rawReports = await Report.find()
      .populate('reporter', 'name avatar customId email falseReportStrikes')
      .populate('reportedUser', 'name avatar customId email phoneNumber isBanned banType banExpiresAt warningCount')
      .sort({ createdAt: -1 })
      .lean();

    // Group reports by reported user ID
    const userReportMap = {};
    let highPriorityCount = 0;
    let pendingCount = 0;

    rawReports.forEach((rep) => {
      if (!rep.reportedUser) return;
      const uId = rep.reportedUser._id.toString();

      if (!userReportMap[uId]) {
        userReportMap[uId] = {
          reportedUser: rep.reportedUser,
          totalReports: 0,
          pendingReports: 0,
          isBanned: Boolean(rep.reportedUser.isBanned),
          warningCount: rep.reportedUser.warningCount || 0,
          reports: [],
        };
      }

      userReportMap[uId].totalReports += 1;
      if (rep.status === 'pending') {
        userReportMap[uId].pendingReports += 1;
        pendingCount += 1;
      }
      userReportMap[uId].reports.push(rep);
    });

    const groupedUsers = Object.values(userReportMap).map((item) => {
      const isHighPriority = item.totalReports >= 3;
      if (isHighPriority && item.pendingReports > 0) {
        highPriorityCount += 1;
      }
      return {
        ...item,
        isHighPriority,
      };
    });

    // Sort: High priority pending users first, then by pending count
    groupedUsers.sort((a, b) => {
      if (a.isHighPriority && !b.isHighPriority) return -1;
      if (!a.isHighPriority && b.isHighPriority) return 1;
      return b.pendingReports - a.pendingReports;
    });

    return res.status(200).json({
      success: true,
      groupedUsers,
      totalReports: rawReports.length,
      pendingCount,
      highPriorityCount,
    });
  } catch (error) {
    console.error('Error in getAdminReports:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Owner: Send Official Warning Notice to Reported User
// @route   POST /api/reports/admin/warn/:userId
exports.warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { warningReason, warningMessage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const officialMessage =
      warningMessage && warningMessage.trim()
        ? warningMessage.trim()
        : 'Official Notice: Multiple reports have been filed against your profile for violating community rules. Please adhere to community guidelines. Subsequent violations will lead to an immediate ban.';

    user.warningCount = (user.warningCount || 0) + 1;
    if (!user.warnings) user.warnings = [];
    user.warnings.push({
      message: officialMessage,
      reason: warningReason || 'Community Guidelines Violation',
      issuedAt: new Date(),
      issuedBy: req.user._id,
    });

    await user.save();

    // Mark pending reports for this user as 'warned'
    await Report.updateMany(
      { reportedUser: userId, status: 'pending' },
      {
        status: 'warned',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        adminNote: `Warning #${user.warningCount} issued: ${officialMessage}`,
      }
    );

    // Real-time notification if socket io is active
    const io = req.app.get('io');
    if (io) {
      io.emit('official_user_warning', {
        userId: user._id.toString(),
        warningCount: user.warningCount,
        message: officialMessage,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Official warning #${user.warningCount} sent to ${user.name} successfully.`,
      warningCount: user.warningCount,
    });
  } catch (error) {
    console.error('Error sending warning to user:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Owner: Ban Reported User (3days, 7days, permanent)
// @route   POST /api/reports/admin/ban/:userId
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banDuration, banReason } = req.body;

    if (!['3days', '7days', 'permanent'].includes(banDuration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid banDuration. Must be 3days, 7days, or permanent.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = true;
    user.banType = banDuration;
    user.bannedAt = new Date();
    user.banReason = banReason || 'Violating community guidelines and harassment policy';

    if (banDuration === '3days') {
      user.banExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    } else if (banDuration === '7days') {
      user.banExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (banDuration === 'permanent') {
      user.banExpiresAt = null;
    }

    await user.save();

    // Mark pending reports as 'banned'
    await Report.updateMany(
      { reportedUser: userId, status: 'pending' },
      {
        status: 'banned',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        adminNote: `User banned for ${banDuration}. Reason: ${user.banReason}`,
      }
    );

    // Kick & force logout from any active voice rooms
    const io = req.app.get('io');
    if (io) {
      io.emit('force_user_banned', {
        userId: user._id.toString(),
        banType: banDuration,
        banExpiresAt: user.banExpiresAt,
        reason: user.banReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User has been successfully banned for ${banDuration}.`,
      banType: banDuration,
      banExpiresAt: user.banExpiresAt,
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Owner: Dismiss a report (optionally strike the reporter for fake report)
// @route   POST /api/reports/admin/dismiss/:reportId
exports.dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { isFake, adminNote } = req.body;

    const report = await Report.findById(reportId).populate('reporter');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'dismissed_fake';
    report.isFake = Boolean(isFake);
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.adminNote = adminNote || (isFake ? 'Marked as false/revenge report' : 'Report dismissed');
    await report.save();

    // If marked as intentional fake/malicious report, strike the reporter
    let strikeNotice = '';
    if (isFake && report.reporter) {
      const reporter = await User.findById(report.reporter._id);
      if (reporter) {
        reporter.falseReportStrikes = (reporter.falseReportStrikes || 0) + 1;
        if (reporter.falseReportStrikes >= 3) {
          // Block reporter from reporting for 30 days
          reporter.reportingBlockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          strikeNotice = ` Reporter received strike #${reporter.falseReportStrikes} and is now suspended from reporting for 30 days.`;
        } else {
          strikeNotice = ` Reporter received strike #${reporter.falseReportStrikes}.`;
        }
        await reporter.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Report dismissed successfully.${strikeNotice}`,
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin/Owner: Unban a User
// @route   POST /api/reports/admin/unban/:userId
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

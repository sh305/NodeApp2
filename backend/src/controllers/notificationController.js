const RechargeRequest = require('../models/RechargeRequest');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const FollowNotification = require('../models/FollowNotification');

// Get all system notifications for current user (including recharge rejected/approved/resolved)
exports.getSystemNotifications = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch recharge requests for user that represent notifications
    const recharges = await RechargeRequest.find({
      user: currentUserId,
      status: { $in: ['pending', 'rejected', 'proof_submitted', 'approved', 'resolved', 'problem'] },
    })
      .sort({ updatedAt: -1 })
      .limit(40);

    const systemNotifications = [];

    for (const r of recharges) {
      if (r.status === 'pending') {
        systemNotifications.push({
          id: `recharge_pending_${r._id}`,
          type: 'recharge_pending',
          title: 'Recharge Request Pending',
          body: `Your recharge request of ₹${r.amount} for ${r.coins} coins is pending owner confirmation.`,
          amount: r.amount,
          coins: r.coins,
          paymentMethod: r.paymentMethod,
          utrNumber: r.utrNumber,
          rechargeId: r._id,
          rechargeStatus: r.status,
          paymentProofImage: r.paymentProofImage,
          createdAt: r.createdAt,
        });
      } else if (r.status === 'problem') {
        systemNotifications.push({
          id: `recharge_problem_${r._id}`,
          type: 'recharge_problem',
          title: 'Query Under Review',
          body: `Your query for ₹${r.amount} has been submitted: "${r.disputeReason || 'Query under review'}"`,
          disputeReason: r.disputeReason,
          disputeProofImage: r.disputeProofImage,
          rejectionReason: r.rejectionReason,
          amount: r.amount,
          coins: r.coins,
          paymentMethod: r.paymentMethod,
          utrNumber: r.utrNumber,
          rechargeId: r._id,
          rechargeStatus: r.status,
          isAcknowledged: r.isAcknowledged,
          createdAt: r.disputedAt || r.updatedAt || r.createdAt,
        });
      } else if (r.status === 'rejected') {
        const rejectTime = new Date(r.rejectedAt || r.updatedAt || r.createdAt);
        // Exclude rejection notifications older than 24 hours
        if (rejectTime < twentyFourHoursAgo) {
          continue;
        }

        systemNotifications.push({
          id: `recharge_reject_${r._id}`,
          type: 'recharge_rejected',
          title: 'Coins Recharge Rejected',
          body: `Your payment of ₹${r.amount} was rejected. Reason: ${r.rejectionReason || 'Verification failed'}`,
          rejectionReason: r.rejectionReason,
          amount: r.amount,
          coins: r.coins,
          paymentMethod: r.paymentMethod,
          utrNumber: r.utrNumber,
          rechargeId: r._id,
          rechargeStatus: r.status,
          paymentProofImage: r.paymentProofImage,
          refundQrImage: r.refundQrImage,
          isAcknowledged: r.isAcknowledged,
          createdAt: r.updatedAt || r.createdAt,
        });
      } else if (r.status === 'resolved') {
        // If user already acknowledged or expired, skip
        if (r.isAcknowledged) {
          continue;
        }

        // 5 Minutes auto-expiry logic after user first viewed it
        const fiveMinutes = 5 * 60 * 1000;
        if (r.resolvedViewedAt) {
          const viewedTime = new Date(r.resolvedViewedAt).getTime();
          if (Date.now() - viewedTime >= fiveMinutes) {
            // Expired after 5 minutes! Mark permanently acknowledged and discard
            r.isAcknowledged = true;
            await r.save();
            continue;
          }
        } else {
          // First time user is opening/viewing this resolved notification: Start the 5 minute countdown!
          r.resolvedViewedAt = new Date();
          await r.save();
        }

        systemNotifications.push({
          id: `recharge_resolved_${r._id}`,
          type: 'recharge_resolved',
          title: 'Query / Dispute Resolved',
          body: r.resolveMessage || 'Your recharge dispute has been resolved by owner.',
          resolveMessage: r.resolveMessage,
          amount: r.amount,
          coins: r.coins,
          paymentMethod: r.paymentMethod,
          utrNumber: r.utrNumber,
          rechargeId: r._id,
          rechargeStatus: r.status,
          resolvedViewedAt: r.resolvedViewedAt,
          isAcknowledged: r.isAcknowledged,
          createdAt: r.resolvedAt || r.updatedAt || r.createdAt,
        });
      } else if (r.status === 'proof_submitted') {
        systemNotifications.push({
          id: `recharge_proof_${r._id}`,
          type: 'proof_submitted',
          title: 'Payment Proof Under Review',
          body: `Your payment proof for ₹${r.amount} has been submitted to owner for verification.`,
          amount: r.amount,
          coins: r.coins,
          paymentMethod: r.paymentMethod,
          utrNumber: r.utrNumber,
          rechargeId: r._id,
          rechargeStatus: r.status,
          paymentProofImage: r.paymentProofImage,
          refundQrImage: r.refundQrImage,
          isAcknowledged: r.isAcknowledged,
          createdAt: r.updatedAt || r.createdAt,
        });
      } else if (r.status === 'approved') {
        // If user already acknowledged or expired, skip
        if (r.isAcknowledged) {
          continue;
        }

        // 5 Minutes auto-expiry logic after user first viewed it
        const fiveMinutes = 5 * 60 * 1000;
        if (r.approvalViewedAt) {
          const viewedTime = new Date(r.approvalViewedAt).getTime();
          if (Date.now() - viewedTime >= fiveMinutes) {
            // Expired after 5 minutes! Mark permanently acknowledged and discard so it disappears forever
            r.isAcknowledged = true;
            await r.save();
            continue;
          }
        } else {
          // First time user is opening/viewing this approve notification: Start 5 minute countdown!
          r.approvalViewedAt = new Date();
          await r.save();
        }

        const coinsAwarded = r.approvedCoins || r.coins;
        const remarksText = r.approvalRemarks || r.adminNote || '';
        const bodyText = `Your payment was approved! ${coinsAwarded} Coins added to your wallet.` + (remarksText ? ` Remarks: ${remarksText}` : '');

        systemNotifications.push({
          id: `recharge_approved_${r._id}`,
          type: 'recharge_approved',
          title: 'Recharge Approved',
          body: bodyText,
          amount: r.amount,
          coins: coinsAwarded,
          remarks: remarksText,
          rechargeId: r._id,
          rechargeStatus: r.status,
          approvalViewedAt: r.approvalViewedAt,
          isAcknowledged: r.isAcknowledged,
          createdAt: r.approvedAt || r.updatedAt || r.createdAt,
        });
      }
    }

    // Sort notifications with newest on top
    systemNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      notifications: systemNotifications,
    });
  } catch (err) {
    console.error('Error fetching system notifications:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system notifications',
    });
  }
};

// Get total combined unread badges (Unread DMs + Active System & Family Alerts)
exports.getTotalUnreadBadgeCount = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Auto-acknowledge expired resolved requests (older than 5 min since viewed)
    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'resolved',
        resolvedViewedAt: { $ne: null, $lt: fiveMinutesAgo },
        isAcknowledged: false,
      },
      { $set: { isAcknowledged: true } }
    );

    // Auto-acknowledge expired approved requests (older than 5 min since viewed)
    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'approved',
        approvalViewedAt: { $ne: null, $lt: fiveMinutesAgo },
        isAcknowledged: false,
      },
      { $set: { isAcknowledged: true } }
    );

    // Auto-acknowledge expired rejected requests (older than 24 hours)
    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'rejected',
        updatedAt: { $lt: twentyFourHoursAgo },
        isAcknowledged: false,
      },
      { $set: { isAcknowledged: true } }
    );

    // Fetch user's last seen notifications timestamp
    const user = await User.findById(currentUserId).select('notificationsLastSeenAt');
    const lastSeenTime = user?.notificationsLastSeenAt ? new Date(user.notificationsLastSeenAt) : new Date(0);

    // 1. Unread Direct Messages (1-on-1 User Chats)
    const unreadMessagesCount = await DirectMessage.countDocuments({
      receiver: currentUserId,
      isRead: false,
    });

    // 2. Unread Pending Recharge Requests (unacknowledged, newer than lastSeenTime)
    const unreadPending = await RechargeRequest.countDocuments({
      user: currentUserId,
      status: { $in: ['pending', 'proof_submitted'] },
      isAcknowledged: false,
      createdAt: { $gt: lastSeenTime },
    });

    // 3. Unread Recharge Rejections (within 24 hours, unacknowledged, newer than lastSeenTime)
    const unreadRejections = await RechargeRequest.countDocuments({
      user: currentUserId,
      status: 'rejected',
      isAcknowledged: false,
      updatedAt: { $gte: twentyFourHoursAgo, $gt: lastSeenTime },
    });

    // 4. Unread Recharge Approvals (within 5 minutes, unacknowledged, newer than lastSeenTime)
    const unreadApprovals = await RechargeRequest.countDocuments({
      user: currentUserId,
      status: 'approved',
      isAcknowledged: false,
      updatedAt: { $gt: lastSeenTime },
      $or: [
        { approvalViewedAt: null },
        { approvalViewedAt: { $gte: fiveMinutesAgo } },
      ],
    });

    // 5. Unread Resolution Notifications (within 5 minutes, unacknowledged, newer than lastSeenTime)
    const unreadResolutions = await RechargeRequest.countDocuments({
      user: currentUserId,
      status: 'resolved',
      isAcknowledged: false,
      updatedAt: { $gt: lastSeenTime },
      $or: [
        { resolvedViewedAt: null },
        { resolvedViewedAt: { $gte: fiveMinutesAgo } },
      ],
    });

    // 6. Unread User Problems under review
    const unreadProblems = await RechargeRequest.countDocuments({
      user: currentUserId,
      status: 'problem',
      isAcknowledged: false,
      updatedAt: { $gt: lastSeenTime },
    });

    // Total System & Family Notifications
    const unreadNotificationsCount = unreadPending + unreadRejections + unreadApprovals + unreadResolutions + unreadProblems;

    // 7. Unread Follower Notifications
    const unreadFollowersCount = await FollowNotification.countDocuments({
      user: currentUserId,
      isRead: false,
    });

    // Grand total for bottom bar Message badge (DMs + Notifications + Followers)
    const totalUnread = unreadMessagesCount + unreadNotificationsCount + unreadFollowersCount;

    return res.json({
      success: true,
      totalUnread,
      unreadMessagesCount,
      unreadNotificationsCount,
      unreadFollowersCount,
      unreadPending,
      unreadRejections,
      unreadApprovals,
      unreadResolutions,
      unreadProblems,
    });
  } catch (err) {
    console.error('Error fetching total unread badge count:', err);
    return res.status(500).json({
      success: false,
      totalUnread: 0,
      unreadMessagesCount: 0,
      unreadNotificationsCount: 0,
    });
  }
};

// Mark all system and family notifications as seen (when user taps Notification menu)
exports.markNotificationsSeen = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const now = new Date();

    // 1. Update user's notificationsLastSeenAt
    await User.findByIdAndUpdate(currentUserId, {
      notificationsLastSeenAt: now,
    });

    // 2. Start 5-minute timer for any approved recharge notifications viewed
    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'approved',
        isAcknowledged: false,
        approvalViewedAt: null,
      },
      { $set: { approvalViewedAt: now } }
    );

    // 3. Start 5-minute timer for any resolved dispute notifications viewed
    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'resolved',
        isAcknowledged: false,
        resolvedViewedAt: null,
      },
      { $set: { resolvedViewedAt: now } }
    );

    return res.json({ success: true, notificationsLastSeenAt: now });
  } catch (err) {
    console.error('Error marking notifications seen:', err);
    return res.status(500).json({ success: false });
  }
};

// Explicitly mark resolved notifications as viewed by user
exports.markResolvedNotificationsAsViewed = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const now = new Date();

    await RechargeRequest.updateMany(
      {
        user: currentUserId,
        status: 'resolved',
        isAcknowledged: false,
        resolvedViewedAt: null,
      },
      {
        $set: { resolvedViewedAt: now },
      }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

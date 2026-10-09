const RechargeRequest = require('../models/RechargeRequest');
const User = require('../models/User');
const { validateRefundQrImage, validatePaymentProofImage, validatePaymentOrQrProof } = require('../utils/imageValidator');

// Validate proof image endpoint for real-time mobile validation
exports.validateProofImage = async (req, res) => {
  try {
    const { proofImage, utrNumber } = req.body;
    if (!proofImage) {
      return res.status(400).json({
        success: false,
        isValid: false,
        message: 'No image provided for validation',
      });
    }
    const check = await validatePaymentOrQrProof(proofImage, utrNumber || '');
    return res.json({
      success: check.isValid,
      isValid: check.isValid,
      type: check.type,
      message: check.message,
    });
  } catch (err) {
    console.error('Error validating proof image:', err);
    return res.status(500).json({
      success: false,
      isValid: false,
      message: 'Failed to validate image',
    });
  }
};

// Create new recharge request (or update current pending request)
exports.createRechargeRequest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { packageId, coins, bonus, amount, currency, priceDisplay, paymentMethod, utrNumber, proofImage } = req.body;

    if (!packageId || !coins || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required recharge information',
      });
    }

    if (!proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Please upload payment proof screenshot or QR code',
      });
    }

    // Validate that the image is a legitimate payment QR code or payment receipt
    const validationCheck = await validatePaymentOrQrProof(proofImage, utrNumber || '');
    if (!validationCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: validationCheck.message || 'Invalid payment proof: No valid QR code or payment details detected.',
      });
    }

    const cleanUtr = (utrNumber || validationCheck.extractedUtr || '').trim();

    // Create new independent recharge request
    const targetRequest = await RechargeRequest.create({
      user: userId,
      packageId,
      coins: Number(coins),
      bonus: Number(bonus || 0),
      amount: Number(amount),
      currency: currency || 'INR',
      priceDisplay: priceDisplay || `₹${amount}`,
      paymentMethod: paymentMethod || 'UPI QR',
      utrNumber: cleanUtr,
      paymentProofImage: proofImage,
      proofSubmittedAt: new Date(),
      status: 'pending',
    });

    // Notify room/global socket and user client
    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_request_created', {
        requestId: targetRequest._id,
        userId,
        amount: targetRequest.amount,
        paymentProofImage: targetRequest.paymentProofImage,
      });
      io.emit('recharge_proof_uploaded', {
        requestId: targetRequest._id,
        userId,
        amount: targetRequest.amount,
      });
      io.emit('recharge_status_updated', {
        requestId: targetRequest._id,
        userId,
        status: 'pending',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Recharge request submitted successfully. Please wait for confirmation.',
      request: targetRequest,
    });
  } catch (err) {
    console.error('Error in createRechargeRequest:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error creating recharge request',
    });
  }
};

// Get current user's latest active recharge request status
exports.getMyRechargeStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Find the latest pending request or proof_submitted request
    const pendingRequest = await RechargeRequest.findOne({
      user: userId,
      status: { $in: ['pending', 'proof_submitted'] },
    }).sort({ createdAt: -1 });

    if (pendingRequest) {
      return res.json({
        success: true,
        hasPending: true,
        request: pendingRequest,
      });
    }

    // Check for recent unacknowledged approved or rejected request
    const recentRequest = await RechargeRequest.findOne({
      user: userId,
      isAcknowledged: false,
    }).sort({ createdAt: -1 });

    const user = await User.findById(userId).select('coins diamonds wealthLevel charmLevel');

    return res.json({
      success: true,
      hasPending: false,
      request: recentRequest || null,
      coins: user?.coins || 0,
    });
  } catch (err) {
    console.error('Error in getMyRechargeStatus:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching recharge status',
    });
  }
};

// Upload Refund QR code for a rejected recharge request
exports.uploadRefundQr = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { qrImage } = req.body;

    if (!qrImage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid QR code image',
      });
    }

    const request = await RechargeRequest.findOne({
      _id: id,
      user: userId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    if (request.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Refund QR can only be submitted for rejected requests',
      });
    }

    // 1. Validate that the image contains a legitimate QR code
    const qrCheck = await validateRefundQrImage(qrImage);
    if (!qrCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: qrCheck.message || 'No QR code detected. Please upload a clear QR code image.',
      });
    }

    request.refundQrImage = qrImage;
    request.refundStatus = 'qr_uploaded';
    request.isAcknowledged = true; // Mark as acknowledged so user can make new purchases
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_refund_qr_uploaded', {
        requestId: request._id,
        userId,
      });
    }

    return res.json({
      success: true,
      message: 'Refund QR code uploaded successfully. Admin will process the refund shortly.',
      request,
    });
  } catch (err) {
    console.error('Error in uploadRefundQr:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error uploading refund QR',
    });
  }
};

// User: Upload payment proof screenshot to re-verify or dispute a rejection
exports.uploadPaymentProof = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { proofImage } = req.body;

    if (!proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment proof screenshot',
      });
    }

    const request = await RechargeRequest.findOne({
      _id: id,
      user: userId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    // 2. Validate that the image is a legitimate payment QR or receipt
    const check = await validatePaymentOrQrProof(proofImage, request.utrNumber);
    if (!check.isValid) {
      return res.status(400).json({
        success: false,
        message: check.message || 'Invalid payment proof: No valid QR code or payment details detected.',
      });
    }

    if (check.extractedUtr && !request.utrNumber) {
      request.utrNumber = check.extractedUtr;
    }
    request.paymentProofImage = proofImage;
    request.proofSubmittedAt = new Date();
    request.status = 'proof_submitted';
    request.isAcknowledged = false;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_proof_uploaded', {
        requestId: request._id,
        userId,
        amount: request.amount,
        coins: request.coins,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId,
        status: 'proof_submitted',
        amount: request.amount,
      });
    }

    return res.json({
      success: true,
      message: 'Payment proof submitted successfully. Owner will review your receipt.',
      request,
    });
  } catch (err) {
    console.error('Error in uploadPaymentProof:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error uploading payment proof',
    });
  }
};

// Acknowledge completed notification
exports.acknowledgeRequest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const request = await RechargeRequest.findOne({
      _id: id,
      user: userId,
    });

    if (request) {
      request.isAcknowledged = true;
      await request.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in acknowledgeRequest:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Get all recharge requests (Searchable table)
exports.getAllRechargeRequests = async (req, res) => {
  try {
    const { search, status } = req.query;

    const query = {};
    if (status && ['pending', 'approved', 'rejected', 'proof_submitted', 'resolved'].includes(status)) {
      query.status = status;
    }

    let requests = await RechargeRequest.find(query)
      .populate('user', 'name avatar wealthLevel charmLevel coins email')
      .sort({ createdAt: -1 })
      .limit(200);

    // Apply search filter in-memory across user name, user ID, paymentMethod, status, amount
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      requests = requests.filter((r) => {
        const userName = (r.user?.name || '').toLowerCase();
        const userIdStr = (r.user?._id ? r.user._id.toString() : '').toLowerCase();
        const shortId = userIdStr.slice(-8);
        const paymentMethod = (r.paymentMethod || '').toLowerCase();
        const statusStr = (r.status || '').toLowerCase();
        const amountStr = String(r.amount);
        const utrStr = (r.utrNumber || '').toLowerCase();

        return (
          userName.includes(q) ||
          userIdStr.includes(q) ||
          shortId.includes(q) ||
          paymentMethod.includes(q) ||
          statusStr.includes(q) ||
          amountStr.includes(q) ||
          utrStr.includes(q)
        );
      });
    }

    return res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error('Error in getAllRechargeRequests:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching recharge requests',
    });
  }
};

// Admin: Approve a recharge request
exports.approveRechargeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { coins, remarks } = req.body;

    const request = await RechargeRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This request is already approved',
      });
    }

    const totalCoinsToAdd = Number(coins) > 0 ? Number(coins) : (request.coins + (request.bonus || 0));
    const finalRemarks = remarks && typeof remarks === 'string' ? remarks.trim() : '';

    // Credit coins to user and update recharge stats
    const today = new Date().toISOString().split('T')[0];
    const updatedUser = await User.findByIdAndUpdate(
      request.user,
      {
        $inc: {
          coins: totalCoinsToAdd,
          totalRecharged: request.amount,
          wealthExp: Math.round(request.amount * 10),
        },
        hasRecharged: true,
        lastRechargeDate: today,
      },
      { new: true }
    ).select('name coins wealthLevel charmLevel');

    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedCoins = totalCoinsToAdd;
    request.approvalRemarks = finalRemarks;
    request.adminNote = finalRemarks || request.adminNote;
    request.approvalViewedAt = null; // 5-minute expiry countdown starts when user views it
    request.isAcknowledged = false;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_request_approved', {
        requestId: request._id,
        userId: request.user,
        amount: request.amount,
        coinsAwarded: totalCoinsToAdd,
        remarks: finalRemarks,
        newBalance: updatedUser?.coins,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId: request.user,
        status: 'approved',
        amount: request.amount,
        coinsAwarded: totalCoinsToAdd,
        remarks: finalRemarks,
        newBalance: updatedUser?.coins,
      });
    }

    return res.json({
      success: true,
      message: `Recharge approved! Added ${totalCoinsToAdd} coins to user.`,
      request,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error in approveRechargeRequest:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error approving recharge request',
    });
  }
};

// Admin: Reject a recharge request
exports.rejectRechargeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await RechargeRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    request.status = 'rejected';
    request.rejectedAt = new Date();
    const finalReason = reason && reason.trim() ? reason.trim() : 'Payment verification failed';
    request.rejectionReason = finalReason;
    request.adminNote = finalReason;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_request_rejected', {
        requestId: request._id,
        userId: request.user,
        amount: request.amount,
        reason: request.adminNote,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId: request.user,
        status: 'rejected',
        amount: request.amount,
        reason: request.rejectionReason,
      });
    }

    return res.json({
      success: true,
      message: 'Recharge request rejected. User may upload refund QR.',
      request,
    });
  } catch (err) {
    console.error('Error in rejectRechargeRequest:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting recharge request',
    });
  }
};

// Admin: Resolve a dispute / rejection with a custom resolution message for the user
exports.resolveRechargeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const request = await RechargeRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    const finalMsg = message && message.trim() ? message.trim() : 'Your query / dispute has been resolved by admin.';
    request.status = 'resolved';
    request.resolveMessage = finalMsg;
    request.resolvedAt = new Date();
    request.isAcknowledged = false; // User should see it in system notification until viewed/dismissed
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId: request.user,
        status: 'resolved',
        resolveMessage: finalMsg,
      });
    }

    return res.json({
      success: true,
      message: 'Recharge query marked as resolved successfully.',
      request,
    });
  } catch (err) {
    console.error('Error in resolveRechargeRequest:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error resolving recharge request',
    });
  }
};

// User: Submit query/dispute with reason and payment proof for a rejected recharge
exports.submitUserProblem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { reason, proofImage } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your reason or query description',
      });
    }

    if (!proofImage) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid payment proof screenshot',
      });
    }

    const request = await RechargeRequest.findOne({
      _id: id,
      user: userId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found',
      });
    }

    // Validate that image is a legitimate payment receipt / QR
    const check = await validatePaymentOrQrProof(proofImage, request.utrNumber);
    if (!check.isValid) {
      return res.status(400).json({
        success: false,
        message: check.message || 'Invalid payment proof: No valid QR code or payment details detected.',
      });
    }

    if (check.extractedUtr && !request.utrNumber) {
      request.utrNumber = check.extractedUtr;
    }

    request.status = 'problem';
    request.disputeReason = reason.trim();
    request.disputeProofImage = proofImage;
    request.disputedAt = new Date();
    request.isAcknowledged = false;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('user_problem_submitted', {
        requestId: request._id,
        userId,
        amount: request.amount,
        coins: request.coins,
        reason: request.disputeReason,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId,
        status: 'problem',
        amount: request.amount,
        disputeReason: request.disputeReason,
      });
    }

    return res.json({
      success: true,
      message: 'Your query and payment proof have been submitted successfully to owner.',
      request,
    });
  } catch (err) {
    console.error('Error in submitUserProblem:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting query',
    });
  }
};

// Admin: Get all User Problems (Disputed recharges)
exports.getAdminUserProblems = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status && ['problem', 'resolved', 'all'].includes(status)) {
      if (status !== 'all') {
        query.status = status;
      } else {
        query.status = { $in: ['problem', 'resolved'] };
      }
    } else {
      query.status = { $in: ['problem', 'resolved'] };
    }

    let problems = await RechargeRequest.find(query)
      .populate('user', 'name avatar wealthLevel charmLevel coins email phone')
      .sort({ disputedAt: -1, updatedAt: -1 })
      .limit(100);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      problems = problems.filter((item) => {
        const userName = (item.user?.name || '').toLowerCase();
        const userIdStr = (item.user?._id ? item.user._id.toString() : '').toLowerCase();
        const shortId = userIdStr.slice(-8);
        const reason = (item.disputeReason || '').toLowerCase();
        const prevReject = (item.rejectionReason || '').toLowerCase();
        return (
          userName.includes(q) ||
          userIdStr.includes(q) ||
          shortId.includes(q) ||
          reason.includes(q) ||
          prevReject.includes(q)
        );
      });
    }

    return res.json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (err) {
    console.error('Error in getAdminUserProblems:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user problems',
    });
  }
};

// Admin: Get pending User Problems count for badge
exports.getAdminProblemsCount = async (req, res) => {
  try {
    const count = await RechargeRequest.countDocuments({ status: 'problem' });
    return res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error('Error in getAdminProblemsCount:', err);
    return res.status(500).json({
      success: false,
      count: 0,
    });
  }
};

// Admin: Resolve User Problem from User Problems screen
exports.resolveUserProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, coins, remarks } = req.body;

    const request = await RechargeRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Dispute record not found',
      });
    }

    const finalMsg = message && message.trim() ? message.trim() : 'Your query has been reviewed and resolved by owner.';
    const coinsToCredit = Number(coins) > 0 ? Number(coins) : 0;
    const finalRemarks = remarks && remarks.trim() ? remarks.trim() : '';

    let updatedUser = null;
    if (coinsToCredit > 0) {
      const today = new Date().toISOString().split('T')[0];
      updatedUser = await User.findByIdAndUpdate(
        request.user,
        {
          $inc: {
            coins: coinsToCredit,
            totalRecharged: request.amount,
            wealthExp: Math.round(request.amount * 10),
          },
          hasRecharged: true,
          lastRechargeDate: today,
        },
        { new: true }
      ).select('name coins wealthLevel charmLevel');

      request.approvedCoins = coinsToCredit;
      request.approvalRemarks = finalRemarks || 'Coins credited on dispute resolution';
    }

    request.status = 'resolved';
    request.resolveMessage = finalMsg;
    request.resolvedAt = new Date();
    request.resolvedViewedAt = null; // 5-minute expiry countdown starts when user views it
    request.isAcknowledged = false;
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('user_problem_resolved', {
        requestId: request._id,
        userId: request.user,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId: request.user,
        status: 'resolved',
        resolveMessage: finalMsg,
        coinsAwarded: coinsToCredit,
      });
    }

    return res.json({
      success: true,
      message: `Problem resolved successfully.${coinsToCredit > 0 ? ` Credited ${coinsToCredit} coins.` : ''}`,
      request,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error in resolveUserProblem:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error resolving user problem',
    });
  }
};

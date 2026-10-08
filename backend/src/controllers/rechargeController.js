const RechargeRequest = require('../models/RechargeRequest');
const User = require('../models/User');
const { validateRefundQrImage, validatePaymentProofImage } = require('../utils/imageValidator');

// Create new recharge request
exports.createRechargeRequest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { packageId, coins, bonus, amount, currency, priceDisplay, paymentMethod, utrNumber } = req.body;

    if (!packageId || !coins || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required recharge information',
      });
    }

    const cleanUtr = (utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit UPI Reference / UTR Number from your payment receipt',
      });
    }

    // Check if this UTR was already used in an active pending or approved order
    const existingUtr = await RechargeRequest.findOne({
      utrNumber: cleanUtr,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingUtr) {
      return res.status(400).json({
        success: false,
        message: 'This UTR number has already been used for another recharge request.',
      });
    }

    // Check if user already has an active pending request
    const existingPending = await RechargeRequest.findOne({
      user: userId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending recharge request. Please wait for confirmation before making another purchase.',
        existingRequest: existingPending,
      });
    }

    const newRequest = await RechargeRequest.create({
      user: userId,
      packageId,
      coins: Number(coins),
      bonus: Number(bonus || 0),
      amount: Number(amount),
      currency: currency || 'INR',
      priceDisplay: priceDisplay || `₹${amount}`,
      paymentMethod,
      utrNumber: cleanUtr,
      status: 'pending',
    });

    // Notify room/global socket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_request_created', {
        requestId: newRequest._id,
        userId,
        amount: newRequest.amount,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Recharge request submitted successfully. Please wait for confirmation.',
      request: newRequest,
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

    // 2. Validate that the image is a legitimate payment receipt using OCR and UTR matching
    const ocrCheck = await validatePaymentProofImage(proofImage, request.utrNumber);
    if (!ocrCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: ocrCheck.message || 'Invalid payment proof: No payment details detected in this image.',
      });
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

    const totalCoinsToAdd = request.coins + (request.bonus || 0);

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
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('recharge_request_approved', {
        requestId: request._id,
        userId: request.user,
        amount: request.amount,
        coinsAwarded: totalCoinsToAdd,
        newBalance: updatedUser?.coins,
      });
      io.emit('recharge_status_updated', {
        requestId: request._id,
        userId: request.user,
        status: 'approved',
        amount: request.amount,
        coinsAwarded: totalCoinsToAdd,
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

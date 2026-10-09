const mongoose = require('mongoose');

const rechargeRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packageId: {
      type: String,
      required: true,
    },
    coins: {
      type: Number,
      required: true,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    priceDisplay: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'PhonePe',
    },
    utrNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'proof_submitted', 'resolved', 'problem'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    disputeReason: {
      type: String,
      default: '',
    },
    disputeProofImage: {
      type: String,
      default: null,
    },
    disputedAt: {
      type: Date,
      default: null,
    },
    resolveMessage: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedViewedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvalRemarks: {
      type: String,
      default: '',
    },
    approvedCoins: {
      type: Number,
      default: null,
    },
    approvalViewedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    paymentProofImage: {
      type: String,
      default: null,
    },
    proofSubmittedAt: {
      type: Date,
      default: null,
    },
    refundQrImage: {
      type: String,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'qr_uploaded', 'refunded'],
      default: 'none',
    },
    isAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RechargeRequest', rechargeRequestSchema);

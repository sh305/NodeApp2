const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'Harassment / Abusive behavior',
        'Inappropriate content / Voice',
        'Spamming & Advertisements',
        'Scam & Fraud',
        'Underage user',
        'Other',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    proofUrl: {
      type: String,
      required: [true, 'Proof photo or video is required to submit a report'],
    },
    proofType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    requestedBanDuration: {
      type: String,
      enum: ['3days', '7days', 'permanent'],
      default: '3days',
    },
    status: {
      type: String,
      enum: ['pending', 'warned', 'banned', 'dismissed_fake'],
      default: 'pending',
    },
    isFake: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index to quickly enforce 24-hour rate limit between same reporter and reportedUser
reportSchema.index({ reporter: 1, reportedUser: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);

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
    requestedBanDuration: {
      type: String,
      enum: ['3days', '7days', 'permanent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'applied', 'rejected'],
      default: 'applied', // Can be auto-applied or reviewed
    },
    actionTakenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);

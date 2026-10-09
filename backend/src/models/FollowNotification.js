const mongoose = require('mongoose');

const followNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

followNotificationSchema.index({ user: 1, follower: 1 });

module.exports = mongoose.model('FollowNotification', followNotificationSchema);

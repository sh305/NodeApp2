const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, default: 'User' },
    avatar: { type: String, default: '' },
    coins: { type: Number, default: 0, min: 0 },
    claimedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const luckyPacketSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    roomTitle: { type: String, default: 'Voice Room' },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: { type: String, default: 'User' },
    senderAvatar: { type: String, default: '' },
    senderIsVip: { type: Boolean, default: false },
    packetType: {
      type: String,
      enum: ['common', 'password', 'countdown'],
      required: true,
    },
    recipientCount: { type: Number, required: true, min: 20, max: 100 },
    totalCoins: { type: Number, required: true, min: 300 },
    remainingCoins: { type: Number, required: true, min: 0 },
    remainingShares: { type: [Number], default: [] },
    passwordHash: { type: String, default: null, select: false },
    opensAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'exhausted'],
      default: 'active',
      index: true,
    },
    claims: { type: [claimSchema], default: [] },
  },
  { timestamps: true }
);

luckyPacketSchema.index({ room: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('LuckyPacket', luckyPacketSchema);

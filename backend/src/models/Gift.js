const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['popular', 'luxury', 'effects', 'romantic'],
      default: 'popular',
    },
    coinPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    expReward: {
      type: Number,
      required: true,
    },
    iconUrl: {
      type: String,
      required: true,
    },
    animationUrl: {
      type: String, // SVGA, Lottie JSON, or WebP animation URL
      default: '',
    },
    soundUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gift', giftSchema);

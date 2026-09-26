const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 4,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    coins: {
      type: Number,
      default: 0, // Initial wallet coins (0 as requested)
      min: 0,
    },
    gameCoins: {
      type: Number,
      default: 0, // Initial game coins (0 as requested, claim from silver chest)
      min: 0,
    },
    gameChestStreak: {
      type: Number,
      default: 0,
    },
    lastGameChestClaim: {
      type: Date,
      default: null,
    },
    diamonds: {
      type: Number,
      default: 0,
      min: 0,
    },
    // User Wealth & Charm EXP and Levels
    wealthExp: {
      type: Number,
      default: 0,
    },
    wealthLevel: {
      type: Number,
      default: 1,
    },
    charmExp: {
      type: Number,
      default: 0,
    },
    charmLevel: {
      type: Number,
      default: 1,
    },
    // Active Avatar Frame
    activeFrame: {
      id: { type: String, default: 'frame_lv1' },
      name: { type: String, default: 'Starter Frame' },
      frameUrl: { type: String, default: 'https://assets.example.com/frames/frame_lv1.png' },
    },
    // User Ban System (Reporting Penalty)
    isBanned: {
      type: Boolean,
      default: false,
    },
    banType: {
      type: String,
      enum: [null, '3days', '7days', 'permanent'],
      default: null,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    banExpiresAt: {
      type: Date,
      default: null,
    },
    banReason: {
      type: String,
      default: '',
    },
    // Block System (User A blocks User B)
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Follow System
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Recently Visited Rooms
    recentRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helper method to verify if user account is currently banned
userSchema.methods.checkActiveBan = function () {
  if (!this.isBanned) return { banned: false };

  if (this.banType === 'permanent') {
    return {
      banned: true,
      type: 'permanent',
      message: 'Aapka account permanent ban kar diya gaya hai. Aap dubara login nahi kar sakte.',
    };
  }

  if (this.banExpiresAt && new Date() < this.banExpiresAt) {
    const daysLeft = Math.ceil((this.banExpiresAt - new Date()) / (1000 * 60 * 60 * 24));
    return {
      banned: true,
      type: this.banType,
      expiresAt: this.banExpiresAt,
      message: `Aapka account ${daysLeft} din ke liye suspend hai report ki wajah se.`,
    };
  }

  // Ban expired, reset status
  this.isBanned = false;
  this.banType = null;
  this.banExpiresAt = null;
  this.bannedAt = null;
  this.save();
  return { banned: false };
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

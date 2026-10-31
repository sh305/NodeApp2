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
    twitterId: {
      type: String,
      unique: true,
      sparse: true,
    },
    snapchatId: {
      type: String,
      unique: true,
      sparse: true,
    },
    telegramId: {
      type: String,
      unique: true,
      sparse: true,
    },
    instagramId: {
      type: String,
      unique: true,
      sparse: true,
    },
    boundAccounts: {
      google: { id: String, email: String, name: String, boundAt: Date },
      facebook: { id: String, name: String, email: String, boundAt: Date },
      twitter: { id: String, username: String, name: String, boundAt: Date },
      snapchat: { id: String, displayName: String, avatar: String, boundAt: Date },
      telegram: { id: String, username: String, firstName: String, lastName: String, photoUrl: String, boundAt: Date },
      phone: { number: String, boundAt: Date },
      instagram: { id: String, username: String, name: String, avatar: String, boundAt: Date },
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    coins: {
      type: Number,
      default: 0, // Initial wallet coins (0 as requested)
      min: 0,
    },
    greedyBabyStats: {
      todayEarnings: { type: Number, default: 0 },
      lastEarningsDate: { type: String, default: null },
      totalWinnings: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
    },
    superSlotsStats: {
      todayEarnings: { type: Number, default: 0 },
      lastEarningsDate: { type: String, default: null },
      totalWinnings: { type: Number, default: 0 },
      spinsPlayed: { type: Number, default: 0 },
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
    hasRecharged: {
      type: Boolean,
      default: false,
    },
    lastRechargeDate: {
      type: String, // 'YYYY-MM-DD'
      default: null,
    },
    totalRecharged: {
      type: Number,
      default: 0,
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
    userLevel: {
      type: Number,
      default: 1,
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      default: null,
    },
    // VIP Membership System
    isVip: {
      type: Boolean,
      default: false,
    },
    vipLevel: {
      type: Number,
      default: 0,
    },
    // Active Avatar Frame
    activeFrame: {
      id: { type: String, default: 'level_01' },
      name: { type: String, default: 'Level 1 Frame' },
      frameUrl: { type: String, default: '/icons/User Level Frame/level_01.svg' },
    },
    // User Role System (User, Admin, Owner)
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
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
    // Official Warning & Strike System
    warningCount: {
      type: Number,
      default: 0,
    },
    warnings: [
      {
        message: { type: String, default: '' },
        reason: { type: String, default: '' },
        issuedAt: { type: Date, default: Date.now },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    // Reporter Penalty System (Blocked if submitting repeated false reports)
    reportingBlockedUntil: {
      type: Date,
      default: null,
    },
    falseReportStrikes: {
      type: Number,
      default: 0,
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
    // Gifts & Profile Visitor Tracking
    giftsSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    giftsReceived: {
      type: Number,
      default: 0,
      min: 0,
    },
    visitors: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    // Recently Visited Rooms
    recentRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
    // Profile Bio & Personal Info
    signature: {
      type: String,
      default: '',
    },
    birthday: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'India',
    },
    coverImage: {
      type: String,
      default: '',
    },
    height: {
      type: String,
      default: '',
    },
    weight: {
      type: String,
      default: '',
    },
    occupation: {
      type: String,
      default: '',
    },
    // CP (Couple / Bestie) Relationships
    cpRelationships: [
      {
        partner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        type: {
          type: String,
          default: 'Bestie',
        },
        level: {
          type: Number,
          default: 1,
        },
        points: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Verification Center System
    isRealPersonVerified: {
      type: Boolean,
      default: false,
    },
    realPersonVerifiedAt: {
      type: Date,
      default: null,
    },
    isAvatarVerified: {
      type: Boolean,
      default: false,
    },
    avatarVerifiedAt: {
      type: Date,
      default: null,
    },
    // Online Status System (Online / Invisible for Super King)
    onlineStatus: {
      type: String,
      enum: ['online', 'invisible'],
      default: 'online',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    nobleLevel: {
      type: String,
      default: 'Super King',
    },
    // Users whose comments on this user's posts are disabled
    commentDisabledUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Timestamp when user last opened/viewed their notifications tab
    notificationsLastSeenAt: {
      type: Date,
      default: () => new Date(),
    },
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
      message: 'Your account has been permanently suspended due to community guideline violations.',
    };
  }

  if (this.banExpiresAt && new Date() < this.banExpiresAt) {
    const daysLeft = Math.ceil((this.banExpiresAt - new Date()) / (1000 * 60 * 60 * 24));
    return {
      banned: true,
      type: this.banType,
      expiresAt: this.banExpiresAt,
      message: `Your account has been suspended for ${daysLeft} more day(s) due to community violations.`,
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

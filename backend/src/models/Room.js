const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seatSchema = new mongoose.Schema(
  {
    seatIndex: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isLockedByOwner: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const kickedUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    kickType: {
      type: String,
      enum: ['3days', 'permanent'],
      required: true,
    },
    kickedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date, // null if permanent
    },
    reason: {
      type: String,
      default: 'Violating room rules',
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      default: 'Welcome to our voice room! Enjoy & chill 🎵',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Room Level & EXP System
    roomLevel: {
      type: Number,
      default: 1,
    },
    roomExp: {
      type: Number,
      default: 0,
    },
    // Room Frame
    roomFrame: {
      id: { type: String, default: 'room_frame_lv1' },
      name: { type: String, default: 'Silver Crest Frame' },
      frameUrl: { type: String, default: 'https://assets.example.com/frames/room_lv1.png' },
    },
    // Room Lock & Password
    isLocked: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    // Dynamically initialized seats
    seats: [seatSchema],
    // Kicked users list (3days vs permanent)
    kickedUsers: [kickedUserSchema],
    // Online participants in room
    activeMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helper function to calculate total seats for a given room level
roomSchema.methods.calculateTotalSeats = function () {
  const level = this.roomLevel || 1;
  const baseSeats = 8;
  const multiplier = Math.floor(level / 12);
  return baseSeats + multiplier * 4;
};

// Method to verify password when entering locked room
roomSchema.methods.verifyPassword = async function (enteredPassword) {
  if (!this.isLocked || !this.passwordHash) return true;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Method to check if a specific user is currently kicked from this room
roomSchema.methods.isUserKicked = function (userId) {
  const kickRecord = this.kickedUsers.find(
    (k) => k.user && k.user.toString() === userId.toString()
  );

  if (!kickRecord) return { kicked: false };

  // Permanent kick: cannot enter until room owner explicitly unkicks
  if (kickRecord.kickType === 'permanent') {
    return {
      kicked: true,
      kickType: 'permanent',
      message: 'Aapko is room se permanent kick kiya gaya hai. Room owner ke unblock karne tak aap enter nahi kar sakte.',
    };
  }

  // 3 Days kick: check if 3 days have passed
  if (kickRecord.expiresAt && new Date() < kickRecord.expiresAt) {
    const hoursLeft = Math.ceil((kickRecord.expiresAt - new Date()) / (1000 * 60 * 60));
    return {
      kicked: true,
      kickType: '3days',
      expiresAt: kickRecord.expiresAt,
      message: `Aapko is room se 3 din ke liye kick kiya gaya hai. (${hoursLeft} ghante bache hain)`,
    };
  }

  // If 3 days expired, remove kick record automatically
  this.kickedUsers = this.kickedUsers.filter(
    (k) => k.user && k.user.toString() !== userId.toString()
  );
  this.save();
  return { kicked: false };
};

// Synchronize seat array length when room level upgrades
roomSchema.methods.syncSeats = function () {
  const totalSeats = this.calculateTotalSeats();
  if (this.seats.length < totalSeats) {
    for (let i = this.seats.length; i < totalSeats; i++) {
      this.seats.push({
        seatIndex: i,
        user: null,
        isMuted: false,
        isLockedByOwner: false,
      });
    }
  }
};

module.exports = mongoose.model('Room', roomSchema);

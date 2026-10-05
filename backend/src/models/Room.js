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
      default: 'permanent',
    },
    kickedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    kickedByName: {
      type: String,
      default: 'Room Owner',
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
    hosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
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
    // Host seat active status
    isHostActive: {
      type: Boolean,
      default: true,
    },
    isHostMuted: {
      type: Boolean,
      default: false,
    },
    // Dynamically initialized seats
    seats: [seatSchema],
    // Boss Seat (Purchased tier 1/3/12 months)
    bossSeat: {
      isActive: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      purchasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
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
      isLocked: {
        type: Boolean,
        default: false,
      },
    },
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
  if (!userId) return { kicked: false };
  const kickRecord = this.kickedUsers.find((k) => {
    if (!k || !k.user) return false;
    const uid = k.user._id ? k.user._id.toString() : k.user.toString();
    return uid === userId.toString();
  });

  if (!kickRecord) return { kicked: false };

  // Permanent kick or no expiresAt: cannot enter until explicitly unblocked
  if (kickRecord.kickType === 'permanent' || !kickRecord.expiresAt) {
    return {
      kicked: true,
      kickType: 'permanent',
      message: 'You have been kicked out of this room. You cannot enter until you are unblocked.',
    };
  }

  // 3 Days kick: check if 3 days have passed
  if (kickRecord.expiresAt && new Date() < kickRecord.expiresAt) {
    const hoursLeft = Math.ceil((kickRecord.expiresAt - new Date()) / (1000 * 60 * 60));
    return {
      kicked: true,
      kickType: '3days',
      expiresAt: kickRecord.expiresAt,
      message: `You have been kicked from this room (${hoursLeft} hours remaining). You cannot enter until unblocked.`,
    };
  }

  // If 3 days expired, remove kick record automatically
  this.kickedUsers = this.kickedUsers.filter((k) => {
    if (!k || !k.user) return false;
    const uid = k.user._id ? k.user._id.toString() : k.user.toString();
    return uid !== userId.toString();
  });
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

// Check if Boss Seat is active and automatically expire if time is up
roomSchema.methods.checkBossSeatActive = function () {
  if (this.bossSeat && this.bossSeat.isActive) {
    if (this.bossSeat.expiresAt && new Date() > this.bossSeat.expiresAt) {
      this.bossSeat.isActive = false;
      this.bossSeat.user = null;
      this.bossSeat.expiresAt = null;
      this.save();
      return false;
    }
    return true;
  }
  return false;
};

module.exports = mongoose.model('Room', roomSchema);

const mongoose = require('mongoose');

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    tag: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 8,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200',
    },
    announcement: {
      type: String,
      default: '',
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customId: {
      type: Number,
      unique: true,
      index: true,
    },
    reviewMethod: {
      type: String,
      enum: ['automatic', 'admin_review'],
      default: 'admin_review',
    },
    minUserLevel: {
      type: Number,
      default: 0, // 0 = no request, max 70
      min: 0,
      max: 70,
    },
    minWealthLevel: {
      type: Number,
      default: 0, // 0 = no request, max 100
      min: 0,
      max: 100,
    },
    maxMembers: {
      type: Number,
      default: 1000,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['captain', 'admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pendingRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate 6-digit random customId if not present
familySchema.pre('save', async function (next) {
  if (!this.customId) {
    let uniqueId = Math.floor(100000 + Math.random() * 900000);
    let exists = await mongoose.models.Family.findOne({ customId: uniqueId });
    while (exists) {
      uniqueId = Math.floor(100000 + Math.random() * 900000);
      exists = await mongoose.models.Family.findOne({ customId: uniqueId });
    }
    this.customId = uniqueId;
  }
  next();
});

module.exports = mongoose.model('Family', familySchema);

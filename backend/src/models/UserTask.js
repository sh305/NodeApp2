const mongoose = require('mongoose');

const userTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' formatted string for daily grouping
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
    reward: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userTaskSchema.index({ user: 1, date: 1, taskId: 1 }, { unique: true });

module.exports = mongoose.model('UserTask', userTaskSchema);

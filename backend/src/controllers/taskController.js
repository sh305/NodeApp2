const User = require('../models/User');
const UserTask = require('../models/UserTask');

// Predefined 8 daily personal tasks matching screenshot
const TASK_DEFINITIONS = [
  {
    id: 'daily_sign_in',
    title: 'Daily Sign in',
    reward: 60,
    target: 1,
    unit: 'times',
  },
  {
    id: 'send_comments',
    title: 'Send comments in the room',
    reward: 50,
    target: 1,
    unit: 'msg',
  },
  {
    id: 'seated_5_mins',
    title: 'Seated for 5 minutes',
    reward: 20,
    target: 300, // 300 seconds (5 minutes)
    unit: 'sec',
  },
  {
    id: 'follow_1_person',
    title: 'Follow 1 people in chatroom',
    reward: 50,
    target: 1,
    unit: 'times',
  },
  {
    id: 'share_chatroom',
    title: 'Share 1 chatroom',
    reward: 50,
    target: 1,
    unit: 'times',
  },
  {
    id: 'finish_recharge',
    title: 'Finished recharge',
    reward: 20,
    target: 1,
    unit: 'times',
  },
  {
    id: 'stay_room_5_mins',
    title: 'Stay in the room for 5 minutes',
    reward: 30,
    target: 300, // 300 seconds (5 minutes)
    unit: 'sec',
  },
  {
    id: 'like_5_posts',
    title: 'Like 5 posts from others',
    reward: 60,
    target: 5,
    unit: 'likes',
  },
];

// Helper to get today's date string YYYY-MM-DD
const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get user's daily tasks and status
// @route   GET /api/tasks/status
exports.getTasksStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDateStr();

    const user = await User.findById(userId).select('diamonds coins hasRecharged lastRechargeDate');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch existing tasks for today
    let userTasks = await UserTask.find({ user: userId, date: today });
    const taskMap = new Map();
    userTasks.forEach((t) => taskMap.set(t.taskId, t));

    // Ensure all defined tasks exist in DB for today safely (atomic upsert to prevent E11000 duplicate race condition)
    const tasksOutput = [];
    for (const def of TASK_DEFINITIONS) {
      let taskDoc = taskMap.get(def.id);
      if (!taskDoc) {
        let isAutoCompleted = false;
        if (def.id === 'daily_sign_in') {
          isAutoCompleted = true; // Daily sign-in is ready to check-in
        } else if (def.id === 'finish_recharge') {
          // Only true if user has recharged today
          isAutoCompleted = Boolean(user.lastRechargeDate === today);
        }

        try {
          taskDoc = await UserTask.findOneAndUpdate(
            { user: userId, date: today, taskId: def.id },
            {
              $setOnInsert: {
                user: userId,
                date: today,
                taskId: def.id,
                progress: isAutoCompleted ? def.target : 0,
                target: def.target,
                completed: isAutoCompleted,
                claimed: false,
                reward: def.reward,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (dupErr) {
          if (dupErr.code === 11000) {
            taskDoc = await UserTask.findOne({ user: userId, date: today, taskId: def.id });
          } else {
            console.error(`Task upsert error for ${def.id}:`, dupErr);
          }
        }
      } else if (def.id === 'finish_recharge' && !taskDoc.claimed && user.lastRechargeDate !== today) {
        // Reset recharge task if user has not recharged today
        if (taskDoc.completed || taskDoc.progress > 0) {
          taskDoc.completed = false;
          taskDoc.progress = 0;
          try {
            await taskDoc.save();
          } catch (saveErr) {}
        }
      }

      tasksOutput.push({
        id: def.id,
        title: def.title,
        reward: def.reward,
        target: def.target,
        unit: def.unit,
        progress: taskDoc ? (taskDoc.progress || 0) : 0,
        completed: Boolean(taskDoc && taskDoc.completed),
        claimed: Boolean(taskDoc && taskDoc.claimed),
      });
    }

    return res.status(200).json({
      success: true,
      diamonds: user.diamonds || 0,
      coins: user.coins || 0,
      tasks: tasksOutput,
    });
  } catch (error) {
    console.error('getTasksStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task progress (e.g. comments, minutes, shares, likes)
// @route   POST /api/tasks/progress
exports.updateTaskProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDateStr();
    const { taskId, increment = 1, progress: explicitProgress } = req.body;

    const def = TASK_DEFINITIONS.find((d) => d.id === taskId);
    if (!def) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    let taskDoc = await UserTask.findOne({ user: userId, date: today, taskId });
    if (!taskDoc) {
      try {
        taskDoc = await UserTask.findOneAndUpdate(
          { user: userId, date: today, taskId },
          {
            $setOnInsert: {
              user: userId,
              date: today,
              taskId,
              progress: 0,
              target: def.target,
              completed: false,
              claimed: false,
              reward: def.reward,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dupErr) {
        taskDoc = await UserTask.findOne({ user: userId, date: today, taskId });
      }
    }

    // Don't update if already completed and claimed
    if (!taskDoc.claimed) {
      if (explicitProgress !== undefined) {
        taskDoc.progress = Math.max(taskDoc.progress, Number(explicitProgress));
      } else {
        taskDoc.progress += Number(increment);
      }

      if (taskDoc.progress >= taskDoc.target) {
        taskDoc.completed = true;
        taskDoc.progress = taskDoc.target;
      }
      await taskDoc.save();
    }

    return res.status(200).json({
      success: true,
      task: {
        id: taskDoc.taskId,
        progress: taskDoc.progress,
        target: taskDoc.target,
        completed: taskDoc.completed,
        claimed: taskDoc.claimed,
      },
    });
  } catch (error) {
    console.error('updateTaskProgress error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Claim reward for a completed task
// @route   POST /api/tasks/claim
exports.claimTaskReward = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = getTodayDateStr();
    const { taskId } = req.body;

    const def = TASK_DEFINITIONS.find((d) => d.id === taskId);
    if (!def) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    let taskDoc = await UserTask.findOne({ user: userId, date: today, taskId });
    if (!taskDoc) {
      // If daily sign-in, create as completed
      if (taskId === 'daily_sign_in') {
        taskDoc = await UserTask.create({
          user: userId,
          date: today,
          taskId,
          progress: def.target,
          target: def.target,
          completed: true,
          claimed: false,
          reward: def.reward,
        });
      } else {
        return res.status(400).json({ success: false, message: 'Task not started' });
      }
    }

    // Daily sign-in can be completed directly when user clicks Check-in
    if (taskId === 'daily_sign_in' && !taskDoc.completed) {
      taskDoc.completed = true;
      taskDoc.progress = def.target;
    }

    // Finished recharge must have actual recharge today
    if (taskId === 'finish_recharge') {
      const u = await User.findById(userId).select('lastRechargeDate');
      if (!u || u.lastRechargeDate !== today) {
        taskDoc.completed = false;
        taskDoc.progress = 0;
        await taskDoc.save();
        return res.status(400).json({
          success: false,
          message: 'Recharge criteria not completed today',
        });
      }
    }

    if (!taskDoc.completed) {
      return res.status(400).json({
        success: false,
        message: 'Task criteria not completed yet',
      });
    }

    if (taskDoc.claimed) {
      return res.status(400).json({
        success: false,
        message: 'Reward already claimed today',
      });
    }

    // Mark claimed and credit diamonds to user
    taskDoc.claimed = true;
    await taskDoc.save();

    const reward = def.reward;
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { diamonds: reward } },
      { new: true }
    ).select('diamonds coins name');

    return res.status(200).json({
      success: true,
      message: `Claimed ${reward} Diamonds successfully!`,
      reward,
      diamonds: user.diamonds,
      taskId,
    });
  } catch (error) {
    console.error('claimTaskReward error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

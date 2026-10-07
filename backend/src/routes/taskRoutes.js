const express = require('express');
const router = express.Router();
const {
  getTasksStatus,
  updateTaskProgress,
  claimTaskReward,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/status', protect, getTasksStatus);
router.post('/progress', protect, updateTaskProgress);
router.post('/claim', protect, claimTaskReward);

module.exports = router;

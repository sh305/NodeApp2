const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/blocked/list', protect, getBlockedUsers);
router.get('/:id/profile', protect, getUserProfile);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);

module.exports = router;

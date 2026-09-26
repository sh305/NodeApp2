const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
  toggleFollowUser,
  getFollowingRooms,
  recordRecentRoom,
  getRecentRooms,
  getGameChestStatus,
  claimGameChest,
  deductGameBet,
  awardGameWin,
  forfeitGame,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/game-chest/status', protect, getGameChestStatus);
router.post('/game-chest/claim', protect, claimGameChest);
router.post('/game/deduct-bet', protect, deductGameBet);
router.post('/game/award-win', protect, awardGameWin);
router.post('/game/forfeit', protect, forfeitGame);
router.get('/blocked/list', protect, getBlockedUsers);
router.get('/following/rooms', protect, getFollowingRooms);
router.get('/recent-rooms', protect, getRecentRooms);
router.post('/recent-rooms/:roomId', protect, recordRecentRoom);
router.post('/:id/follow', protect, toggleFollowUser);
router.get('/:id/profile', protect, getUserProfile);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);

module.exports = router;

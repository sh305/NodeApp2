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
  refundGameBet,
  addTestExp,
  updateProfile,
  getUserFollowers,
  getUserFollowing,
  getUserVisitors,
  getWalletBalance,
  exchangeGameCoins,
  purchaseStoreItem,
  getFollowerNotifications,
  markFollowersRead,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/wallet/balance', protect, getWalletBalance);
router.post('/wallet/exchange-game-coins', protect, exchangeGameCoins);
router.post('/store/purchase', protect, purchaseStoreItem);
router.get('/follower-notifications', protect, getFollowerNotifications);
router.post('/mark-followers-read', protect, markFollowersRead);

router.put('/profile', protect, updateProfile);
router.post('/add-test-exp', protect, addTestExp);
router.get('/game-chest/status', protect, getGameChestStatus);
router.post('/game-chest/claim', protect, claimGameChest);
router.post('/game/deduct-bet', protect, deductGameBet);
router.post('/game/award-win', protect, awardGameWin);
router.post('/game/forfeit', protect, forfeitGame);
router.post('/game/refund-bet', protect, refundGameBet);
router.get('/blocked/list', protect, getBlockedUsers);
router.get('/following/rooms', protect, getFollowingRooms);
router.get('/recent-rooms', protect, getRecentRooms);
router.post('/recent-rooms/:roomId', protect, recordRecentRoom);
router.get('/:id/followers', protect, getUserFollowers);
router.get('/:id/following', protect, getUserFollowing);
router.get('/:id/visitors', protect, getUserVisitors);
router.post('/:id/follow', protect, toggleFollowUser);
router.get('/:id/profile', protect, getUserProfile);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoomById,
  verifyRoomPassword,
  toggleLockRoom,
  kickUser,
  unkickUser,
  getKickedUsers,
} = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createRoom)
  .get(getRooms);

router.route('/:id')
  .get(protect, getRoomById);

router.post('/:id/verify-password', protect, verifyRoomPassword);
router.put('/:id/lock-status', protect, toggleLockRoom);
router.post('/:id/kick', protect, kickUser);
router.post('/:id/unkick', protect, unkickUser);
router.get('/:id/kicked-users', protect, getKickedUsers);

module.exports = router;

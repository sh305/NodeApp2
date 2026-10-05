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
  getRoomPeople,
  removeHost,
  removeAdmin,
  addHost,
  addAdmin,
  purchaseBossSeat,
  takeBossSeat,
  leaveBossSeat,
  toggleFreeMode,
  applyForSeat,
  acceptSeatApplicant,
  rejectSeatApplicant,
  updateSeatLayout,
} = require('../controllers/roomController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createRoom)
  .get(getRooms);

router.route('/:id')
  .get(protect, getRoomById);

router.get('/:id/people', protect, getRoomPeople);
router.post('/:id/remove-host', protect, removeHost);
router.post('/:id/remove-admin', protect, removeAdmin);
router.post('/:id/add-host', protect, addHost);
router.post('/:id/add-admin', protect, addAdmin);
router.post('/:id/verify-password', protect, verifyRoomPassword);
router.put('/:id/lock-status', protect, toggleLockRoom);
router.post('/:id/lock', protect, toggleLockRoom);
router.post('/:id/kick', protect, kickUser);
router.post('/:id/unkick', protect, unkickUser);
router.get('/:id/kicked-users', protect, getKickedUsers);
router.post('/:id/boss-seat/purchase', protect, purchaseBossSeat);
router.post('/:id/boss-seat/take', protect, takeBossSeat);
router.post('/:id/boss-seat/leave', protect, leaveBossSeat);
router.post('/:id/free-mode', protect, toggleFreeMode);
router.post('/:id/seat-applicants/apply', protect, applyForSeat);
router.post('/:id/seat-applicants/accept', protect, acceptSeatApplicant);
router.post('/:id/seat-applicants/reject', protect, rejectSeatApplicant);
router.put('/:id/seat-layout', protect, updateSeatLayout);
router.post('/:id/seat-layout', protect, updateSeatLayout);

module.exports = router;

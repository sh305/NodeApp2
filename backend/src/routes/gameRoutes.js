const express = require('express');
const router = express.Router();
const {
  getGreedyBabyState,
  placeGreedyBabyBet,
  claimGreedyBabyPayout,
  getSuperSlotsState,
  spinSuperSlots,
} = require('../controllers/gameController');
const { protect } = require('../middlewares/authMiddleware');

// Greedy Baby Routes
router.get('/greedy-baby/state', getGreedyBabyState);
router.post('/greedy-baby/bet', protect, placeGreedyBabyBet);
router.post('/greedy-baby/payout', protect, claimGreedyBabyPayout);

// Super Slots Routes
router.get('/super-slots/state', getSuperSlotsState);
router.post('/super-slots/spin', protect, spinSuperSlots);

module.exports = router;

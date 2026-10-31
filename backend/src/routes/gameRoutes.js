const express = require('express');
const router = express.Router();
const {
  getGreedyBabyState,
  placeGreedyBabyBet,
  claimGreedyBabyPayout,
} = require('../controllers/gameController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/greedy-baby/state', getGreedyBabyState);
router.post('/greedy-baby/bet', protect, placeGreedyBabyBet);
router.post('/greedy-baby/payout', protect, claimGreedyBabyPayout);

module.exports = router;

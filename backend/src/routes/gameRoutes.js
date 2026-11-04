const express = require('express');
const router = express.Router();
const {
  getGreedyBabyState,
  placeGreedyBabyBet,
  claimGreedyBabyPayout,
  getSuperSlotsState,
  spinSuperSlots,
  getAnimalRaceState,
  runAnimalRace,
  getCarRouletteState,
  spinCarRoulette,
  getZooSlotsState,
  spinZooSlots,
  getOceanKingState,
  playOceanKing,
  getFruitPartyState,
  playFruitParty,
} = require('../controllers/gameController');
const { protect } = require('../middlewares/authMiddleware');

// Greedy Baby Routes
router.get('/greedy-baby/state', getGreedyBabyState);
router.post('/greedy-baby/bet', protect, placeGreedyBabyBet);
router.post('/greedy-baby/payout', protect, claimGreedyBabyPayout);

// Super Slots Routes
router.get('/super-slots/state', getSuperSlotsState);
router.post('/super-slots/spin', protect, spinSuperSlots);

// Animal Race (Jungle Safari) Routes
router.get('/animal-race/state', getAnimalRaceState);
router.post('/animal-race/run', protect, runAnimalRace);

// Car Roulette (Luxury Brand Spin) Routes
router.get('/car-roulette/state', getCarRouletteState);
router.post('/car-roulette/spin', protect, spinCarRoulette);

// Zoo Slots (Wild Animal Reels) Routes
router.get('/zoo-slots/state', getZooSlotsState);
router.post('/zoo-slots/spin', protect, spinZooSlots);

// Ocean King (Fishing Frenzy) Routes
router.get('/ocean-king/state', getOceanKingState);
router.post('/ocean-king/play', protect, playOceanKing);

// Fruit Party / Lucky Fruit Routes
router.get('/fruit-party/state', getFruitPartyState);
router.post('/fruit-party/play', protect, playFruitParty);

module.exports = router;

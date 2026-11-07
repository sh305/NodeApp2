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
  getDragonTigerState,
  playDragonTiger,
  getColorPredictionState,
  playColorPrediction,
  getBullseyeDartsState,
  playBullseyeDarts,
  getMatkaCrackState,
  playMatkaCrack,
  getGoliSodaState,
  playGoliSoda,
  getCandyBonanzaState,
  spinCandyBonanza,
  getPlinkoState,
  dropPlinkoBall,
  getNariyalState,
  playNariyalSmash,
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

// Dragon vs Tiger Routes
router.get('/dragon-tiger/state', getDragonTigerState);
router.post('/dragon-tiger/play', protect, playDragonTiger);


// Color Prediction Routes
router.get('/color-prediction/state', getColorPredictionState);
router.post('/color-prediction/play', protect, playColorPrediction);


// Bullseye Darts Routes
router.get('/bullseye-darts/state', getBullseyeDartsState);
router.post('/bullseye-darts/play', protect, playBullseyeDarts);


// Matka Crack Routes
router.get('/matka-crack/state', getMatkaCrackState);
router.post('/matka-crack/play', protect, playMatkaCrack);

// Goli Soda Pop Routes
router.get('/goli-soda/state', getGoliSodaState);
router.post('/goli-soda/play', protect, playGoliSoda);

// Candy Bonanza Routes
router.get('/candy-bonanza/state', getCandyBonanzaState);
router.post('/candy-bonanza/spin', protect, spinCandyBonanza);

// Plinko Drop Routes
router.get('/plinko/state', getPlinkoState);
router.post('/plinko/drop', protect, dropPlinkoBall);

// Nariyal Phodo Routes
router.get('/nariyal/state', getNariyalState);
router.post('/nariyal/smash', protect, playNariyalSmash);

module.exports = router;

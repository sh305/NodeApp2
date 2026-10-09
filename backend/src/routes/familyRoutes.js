const express = require('express');
const router = express.Router();
const {
  getFamilyRecommendations,
  createFamily,
  joinFamily,
  getMyFamily,
} = require('../controllers/familyController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/recommendations', protect, getFamilyRecommendations);
router.post('/create', protect, createFamily);
router.post('/:id/join', protect, joinFamily);
router.get('/my-family', protect, getMyFamily);

module.exports = router;

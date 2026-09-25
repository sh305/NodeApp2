const express = require('express');
const router = express.Router();
const { submitReport, unbanUser } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, submitReport);
router.post('/unban/:userId', protect, unbanUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const { phoneLogin, googleLogin, facebookLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/phone-login', phoneLogin);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);
router.get('/me', protect, getMe);

module.exports = router;

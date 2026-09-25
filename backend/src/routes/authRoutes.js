const express = require('express');
const router = express.Router();
const {
  phoneLogin,
  googleLogin,
  facebookLogin,
  sendWhatsAppOtp,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/send-whatsapp-otp', sendWhatsAppOtp);
router.post('/phone-login', phoneLogin);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);
router.get('/me', protect, getMe);

module.exports = router;

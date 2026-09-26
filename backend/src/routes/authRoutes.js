const express = require('express');
const router = express.Router();
const {
  phoneLogin,
  phoneRegister,
  emailLogin,
  emailRegister,
  googleLogin,
  facebookLogin,
  sendWhatsAppOtp,
  sendEmailOtp,
  verifyOtpOnly,
  verifyEmailOtp,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/send-whatsapp-otp', sendWhatsAppOtp);
router.post('/send-sms-otp', sendWhatsAppOtp);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-otp', verifyOtpOnly);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/phone-login', phoneLogin);
router.post('/phone-register', phoneRegister);
router.post('/email-login', emailLogin);
router.post('/email-register', emailRegister);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);
router.get('/me', protect, getMe);

module.exports = router;

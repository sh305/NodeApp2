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
  verifyWhatsAppOtp,
  sendEmailOtp,
  verifyOtpOnly,
  verifyEmailOtp,
  getMe,
  bindAccount,
  unbindAccount,
  twitterLogin,
  generateWhatsAppCode,
  confirmWhatsAppVerify,
  generateFacebookOtp,
  verifyFacebookOtp,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/send-whatsapp-otp', sendWhatsAppOtp);
router.post('/verify-whatsapp-otp', verifyWhatsAppOtp);
router.post('/send-sms-otp', sendWhatsAppOtp);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-otp', verifyOtpOnly);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/generate-whatsapp-code', generateWhatsAppCode);
router.post('/confirm-whatsapp-verify', confirmWhatsAppVerify);
router.post('/generate-facebook-otp', generateFacebookOtp);
router.post('/verify-facebook-otp', verifyFacebookOtp);
router.post('/phone-login', phoneLogin);
router.post('/phone-register', phoneRegister);
router.post('/email-login', emailLogin);
router.post('/email-register', emailRegister);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);
router.post('/twitter-login', twitterLogin);
router.post('/bind-account', protect, bindAccount);
router.post('/unbind-account', protect, unbindAccount);
router.get('/me', protect, getMe);

module.exports = router;

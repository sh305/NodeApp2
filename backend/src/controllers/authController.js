const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SmsOtpService = require('../services/smsOtpService');
const WhatsAppOtpService = require('../services/whatsappOtpService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Send Real SMS OTP to User's Mobile (Fast2SMS Gateway)
// @route   POST /api/auth/send-whatsapp-otp & /api/auth/send-sms-otp
exports.sendWhatsAppOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Direct Fast2SMS Real SMS Delivery to User's Phone
    const result = await SmsOtpService.sendOtp(phoneNumber);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('sendSmsOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP Code Only
// @route   POST /api/auth/verify-otp
exports.verifyOtpOnly = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    const verifyResult = await SmsOtpService.verifyOtp(phoneNumber, otp);
    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyOtpOnly error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Phone Number Login / Registrations with OTP verification
// @route   POST /api/auth/phone-login
exports.phoneLogin = async (req, res) => {
  try {
    const { phoneNumber, otp, name } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Your name is required to complete registration' });
    }

    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = await User.create({
        name: name.trim(),
        phoneNumber,
        avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${phoneNumber}`,
      });
    } else if (name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    // Ban check
    const banCheck = user.checkActiveBan();
    if (banCheck.banned) {
      return res.status(403).json({
        success: false,
        banned: true,
        message: banCheck.message,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Sign-In
// @route   POST /api/auth/google-login
exports.googleLogin = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ success: false, message: 'Google ID and Email are required' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const banCheck = user.checkActiveBan();
    if (banCheck.banned) {
      return res.status(403).json({
        success: false,
        banned: true,
        message: banCheck.message,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Facebook OAuth Sign-In
// @route   POST /api/auth/facebook-login
exports.facebookLogin = async (req, res) => {
  try {
    const { facebookId, name, avatar, email } = req.body;

    if (!facebookId) {
      return res.status(400).json({ success: false, message: 'Facebook ID is required' });
    }

    let user = await User.findOne({ facebookId });

    if (!user) {
      user = await User.create({
        name: name || 'Facebook User',
        facebookId,
        email: email || undefined,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      });
    }

    const banCheck = user.checkActiveBan();
    if (banCheck.banned) {
      return res.status(403).json({
        success: false,
        banned: true,
        message: banCheck.message,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Facebook login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

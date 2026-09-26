const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SmsOtpService = require('../services/smsOtpService');
const WhatsAppOtpService = require('../services/whatsappOtpService');
const EmailOtpService = require('../services/emailOtpService');
const { cacheService } = require('../config/redis');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Send Real SMS OTP to User's Mobiles
// @route   POST /api/auth/send-whatsapp-otp & /api/auth/send-sms-otp
exports.sendWhatsAppOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const result = await SmsOtpService.sendOtp(phoneNumber);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('sendSmsOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send 6-Digit OTP to User's Gmail / Email
// @route   POST /api/auth/send-email-otp
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Gmail / Email address' });
    }

    const result = await EmailOtpService.sendOtp(email);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('sendEmailOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify SMS / Phone OTP
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

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const verifyResult = await SmsOtpService.verifyOtp(cleanPhone, otp);
    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
      });
    }

    // Mark phone as verified in cache for 15 minutes (900 seconds)
    await cacheService.set(`phone_verified:${cleanPhone}`, 'true', 900);

    return res.status(200).json({
      success: true,
      message: 'OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyOtpOnly error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Gmail / Email OTP
// @route   POST /api/auth/verify-email-otp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid Gmail / Email address is required' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const verifyResult = await EmailOtpService.verifyOtp(cleanEmail, otp);
    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
      });
    }

    // Mark email as verified in cache for 15 minutes (900 seconds)
    await cacheService.set(`email_verified:${cleanEmail}`, 'true', 900);

    return res.status(200).json({
      success: true,
      message: 'OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyEmailOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register New User with Gmail + Verified OTP + Password
// @route   POST /api/auth/email-register
exports.emailRegister = async (req, res) => {
  try {
    const { email, name, password, confirmPassword } = req.body;

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Gmail / Email address' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your Full Name' });
    }

    if (!password || password.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match!' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify that OTP was verified for this email
    const isVerified = await cacheService.get(`email_verified:${cleanEmail}`);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your Gmail OTP first before completing registration',
      });
    }

    let existingUser = await User.findOne({ email: cleanEmail });

    let user;
    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.password = password; // Will be encrypted by pre-save hook
      user = await existingUser.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: password,
        avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${cleanEmail}`,
      });
    }

    // Clear verification cache
    await cacheService.del(`email_verified:${cleanEmail}`);

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration Successful! Welcome 🎉',
      token,
      user,
    });
  } catch (error) {
    console.error('emailRegister error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login User with Gmail ID + Password
// @route   POST /api/auth/email-login
exports.emailLogin = async (req, res) => {
  try {
    const { email, password, otp, name } = req.body;

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Gmail / Email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this Gmail ID! Please click Register User first.',
      });
    }

    // Password login flow
    if (password) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect Password! Please enter the correct password.',
        });
      }
    } else if (otp) {
      // Legacy OTP login fallback
      const verifyResult = await EmailOtpService.verifyOtp(cleanEmail, otp);
      if (!verifyResult.valid) {
        return res.status(400).json({
          success: false,
          message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Password is required to login',
      });
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

    // Testing override: ensure 2,000 game coins for princeraie09@gmail.com
    if (cleanEmail === 'princeraie09@gmail.com') {
      if ((user.gameCoins || 0) < 2000) {
        user.gameCoins = 2000;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password Verified Successfully! Welcome 🎉',
      token,
      user,
    });
  } catch (error) {
    console.error('Email login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register New User with Mobile Number + Verified OTP + Password
// @route   POST /api/auth/phone-register
exports.phoneRegister = async (req, res) => {
  try {
    const { phoneNumber, name, password, confirmPassword } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your Full Name' });
    }

    if (!password || password.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match!' });
    }

    // Verify that OTP was verified for this phone number
    const isVerified = await cacheService.get(`phone_verified:${cleanPhone}`);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your Mobile OTP first before completing registration',
      });
    }

    let existingUser = await User.findOne({ phoneNumber: cleanPhone });

    let user;
    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.password = password; // Will be encrypted by pre-save hook
      user = await existingUser.save();
    } else {
      user = await User.create({
        name: name.trim(),
        phoneNumber: cleanPhone,
        password: password,
        avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${cleanPhone}`,
      });
    }

    // Clear verification cache
    await cacheService.del(`phone_verified:${cleanPhone}`);

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration Successful! Welcome 🎉',
      token,
      user,
    });
  } catch (error) {
    console.error('phoneRegister error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Phone Number Login with Password (or OTP fallback)
// @route   POST /api/auth/phone-login
exports.phoneLogin = async (req, res) => {
  try {
    const { phoneNumber, password, otp, name } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const user = await User.findOne({ phoneNumber: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this Mobile Number! Please click Register User first.',
      });
    }

    // Password login flow
    if (password) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect Password! Please enter the correct password.',
        });
      }
    } else if (otp) {
      // Legacy OTP login fallback
      const verifyResult = await SmsOtpService.verifyOtp(cleanPhone, otp);
      if (!verifyResult.valid) {
        return res.status(400).json({
          success: false,
          message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Password is required to login',
      });
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
      message: 'Password Verified Successfully! Welcome 🎉',
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

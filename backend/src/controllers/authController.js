const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SmsOtpService = require('../services/smsOtpService');
const WhatsAppOtpService = require('../services/whatsappOtpService');
const VoiceOtpService = require('../services/voiceOtpService');
const EmailOtpService = require('../services/emailOtpService');
const { cacheService } = require('../config/redis');
const axios = require('axios');
const { createLoginSession, getLoginSession } = require('../services/telegramBotService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Send 6-Digit Real SMS OTP to User's Mobile (Powered by 2Factor.in)
// @route   POST /api/auth/send-whatsapp-otp
exports.sendWhatsAppOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const result = await SmsOtpService.sendOtp(cleanPhone, 'voice');
    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message || 'Incoming verification call sent! Please answer the call 📞',
      channel: result.channel,
    });
  } catch (error) {
    console.error('sendWhatsAppOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send 6-Digit OTP to User's Mobile via SMS (Powered by 2Factor.in)
// @route   POST /api/auth/send-sms-otp
exports.sendSmsOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    const result = await SmsOtpService.sendOtp(cleanPhone, 'sms');
    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message || 'SMS OTP code sent to your mobile number! 📨',
      channel: result.channel,
    });
  } catch (error) {
    console.error('sendSmsOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify User's Entered Mobile SMS OTP (Powered by 2Factor.in)
// @route   POST /api/auth/verify-whatsapp-otp
exports.verifyWhatsAppOtp = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      message: 'Mobile OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyWhatsAppOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send 6-Digit Voice Call OTP via 2Factor.in
// @route   POST /api/auth/send-voice-otp
exports.sendVoiceOtp = async (req, res) => {
  try {
    const { phoneNumber, purpose } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    if (purpose !== 'login') {
      const existingUser = await User.findOne({ phoneNumber: cleanPhone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This Account already exists, please use a different one.',
        });
      }
    }

    const result = await VoiceOtpService.sendVoiceOtp(cleanPhone);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('sendVoiceOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify 6-Digit Voice Call OTP via 2Factor.in
// @route   POST /api/auth/verify-voice-otp
exports.verifyVoiceOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const verifyResult = await VoiceOtpService.verifyVoiceOtp(cleanPhone, otp);

    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Wrong OTP! Please enter correct 6 digit OTP',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Voice OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyVoiceOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send SMS OTP via 2Factor.in
// @route   POST /api/auth/send-sms-otp
exports.sendSmsOtp = async (req, res) => {
  try {
    const { phoneNumber, purpose } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    if (purpose !== 'login') {
      const existingUser = await User.findOne({ phoneNumber: cleanPhone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This Account already exists, please use a different one.',
        });
      }
    }

    const result = await SmsOtpService.sendOtp(cleanPhone);
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
    const { email, purpose } = req.body;
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Gmail / Email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (purpose !== 'login') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This Account already exists, please use a different one.',
        });
      }
    }

    const result = await EmailOtpService.sendOtp(cleanEmail);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('sendEmailOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify SMS / Phone / Voice OTP
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
    let verifyResult = await VoiceOtpService.verifyVoiceOtp(cleanPhone, otp);
    if (!verifyResult.valid) {
      verifyResult = await SmsOtpService.verifyOtp(cleanPhone, otp);
    }
    if (!verifyResult.valid) {
      verifyResult = await WhatsAppOtpService.verifyOtp(cleanPhone, otp);
    }

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

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This Account already exists, please use a different one.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${cleanEmail}`,
    });

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

    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This Account already exists, please use a different one.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      phoneNumber: cleanPhone,
      password: password,
      avatar: `https://api.dicebear.com/7.x/bottts/png?seed=${cleanPhone}`,
    });

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

// @desc    Verify Facebook Access Token & Return Profile
// @route   POST /api/auth/facebook-verify-token
exports.verifyFacebookToken = async (req, res) => {
  try {
    let { accessToken, code } = req.body;

    // Exchange OAuth code for accessToken if code was returned
    if (!accessToken && code) {
      // Meta Facebook App Credentials from environment variables
      const fbAppId = process.env.FACEBOOK_APP_ID;
      const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
      const redirectUri = process.env.FACEBOOK_REDIRECT_URI || 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';

      if (!fbAppId || !fbAppSecret) {
        console.error('❌ [Facebook Auth] Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in environment variables');
        return res.status(500).json({ success: false, message: 'Facebook credentials not configured in environment' });
      }

      const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: fbAppId,
          client_secret: fbAppSecret,
          redirect_uri: redirectUri,
          code,
        },
        timeout: 10000,
      });
      if (tokenRes.data?.access_token) {
        accessToken = tokenRes.data.access_token;
      }
    }

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Facebook Access Token or Code is required' });
    }

    const graphUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.width(200).height(200)&access_token=${accessToken}`;
    const response = await axios.get(graphUrl, { timeout: 10000 });

    if (!response.data || !response.data.id) {
      return res.status(400).json({ success: false, message: 'Invalid Facebook Access Token' });
    }

    const { id, name, email, picture } = response.data;
    const avatar = picture?.data?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

    return res.status(200).json({
      success: true,
      profile: {
        id,
        name,
        email: email || '',
        avatar,
      },
    });
  } catch (error) {
    console.error('verifyFacebookToken error:', error.response?.data || error.message);
    return res.status(400).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to authenticate with Facebook',
    });
  }
};

// @desc    Facebook OAuth Sign-In data
// @route   POST /api/auth/facebook-login
exports.facebookLogin = async (req, res) => {
  try {
    const { facebookId, name, avatar, email } = req.body;

    if (!facebookId) {
      return res.status(400).json({ success: false, message: 'Facebook ID is required' });
    }

    // 1. First find by facebookId
    let user = await User.findOne({ facebookId });

    // 2. If not found by facebookId, check if a user with this email already exists and link them
    if (!user && email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.facebookId = facebookId;
        user.boundAccounts = user.boundAccounts || {};
        user.boundAccounts.facebook = {
          id: facebookId,
          name: name || user.name,
          email: cleanEmail,
          boundAt: new Date(),
        };
        if (!user.avatar || user.avatar.includes('dicebear') || user.avatar.includes('unsplash')) {
          if (avatar) user.avatar = avatar;
        }
        await user.save();
      }
    }

    // 3. If still no existing user, create new user safely
    if (!user) {
      user = await User.create({
        name: name || 'Facebook User',
        facebookId,
        email: email && email.trim() ? email.trim().toLowerCase() : undefined,
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

// @desc    Get Current User Profiles data
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bind Social or Phone Account to Existing Profile
// @route   POST /api/auth/bind-account
exports.bindAccount = async (req, res) => {
  try {
    const { provider, accountId, email, name, avatar, username } = req.body;
    if (!provider || !accountId) {
      return res.status(400).json({ success: false, message: 'Provider and accountId are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.boundAccounts) {
      user.boundAccounts = {};
    }

    if (provider === 'google') {
      // Check if another user already has this googleId
      const existing = await User.findOne({ googleId: accountId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Google account is already bound to another profile',
        });
      }
      user.googleId = accountId;
      user.boundAccounts.google = {
        id: accountId,
        email: email || '',
        name: name || '',
        boundAt: new Date(),
      };
      if (email && !user.email) user.email = email;
    } else if (provider === 'facebook') {
      const existing = await User.findOne({ facebookId: accountId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Facebook account is already bound to another profile',
        });
      }
      user.facebookId = accountId;
      user.boundAccounts.facebook = {
        id: accountId,
        name: name || '',
        email: email || '',
        boundAt: new Date(),
      };
    } else if (provider === 'twitter') {
      const existing = await User.findOne({ twitterId: accountId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Twitter account is already bound to another profile',
        });
      }
      user.twitterId = accountId;
      user.boundAccounts.twitter = {
        id: accountId,
        username: username || '',
        name: name || '',
        boundAt: new Date(),
      };
    } else if (provider === 'snapchat') {
      const existing = await User.findOne({ snapchatId: accountId, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Snapchat account is already bound to another profile',
        });
      }
      user.snapchatId = accountId;
      user.boundAccounts.snapchat = {
        id: accountId,
        displayName: name || '',
        avatar: avatar || '',
        boundAt: new Date(),
      };
      if (avatar && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = avatar;
      }
    } else if (provider === 'phone') {
      const cleanPhone = accountId.replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }

      const existing = await User.findOne({
        $or: [
          { phoneNumber: cleanPhone },
          { phone: cleanPhone },
          { 'boundAccounts.phone.number': cleanPhone },
        ],
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This mobile number is already bound to another profile',
        });
      }

      user.phone = cleanPhone;
      user.phoneNumber = cleanPhone;
      user.boundAccounts.phone = {
        number: cleanPhone,
        boundAt: new Date(),
      };
    } else if (provider === 'telegram') {
      const cleanTelegramId = String(accountId).trim();
      const existing = await User.findOne({
        $or: [
          { telegramId: cleanTelegramId },
          { 'boundAccounts.telegram.id': cleanTelegramId },
        ],
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Telegram account is already bound to another profile',
        });
      }

      user.telegramId = cleanTelegramId;
      user.boundAccounts.telegram = {
        id: cleanTelegramId,
        username: username ? (username.startsWith('@') ? username : `@${username}`) : '',
        firstName: name || '',
        boundAt: new Date(),
      };
      if (avatar && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = avatar;
      }
    } else if (provider === 'instagram') {
      const cleanUsername = String(accountId || username).replace(/^@+/, '').trim().toLowerCase();
      if (!cleanUsername) {
        return res.status(400).json({ success: false, message: 'Invalid Instagram username' });
      }

      const existing = await User.findOne({
        $or: [
          { instagramId: cleanUsername },
          { 'boundAccounts.instagram.username': cleanUsername },
          { 'boundAccounts.instagram.id': cleanUsername },
        ],
        _id: { $ne: user._id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This Instagram account is already bound to another profile',
        });
      }

      user.instagramId = cleanUsername;
      user.boundAccounts.instagram = {
        id: cleanUsername,
        username: cleanUsername,
        name: name || `@${cleanUsername}`,
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        boundAt: new Date(),
      };
    }

    user.markModified('boundAccounts');
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account bound successfully',
      user,
    });
  } catch (error) {
    console.error('bindAccount error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unbind Social Account
// @route   POST /api/auth/unbind-account
exports.unbindAccount = async (req, res) => {
  try {
    const { provider } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.boundAccounts) user.boundAccounts = {};

    if (provider === 'google') {
      user.googleId = undefined;
      user.boundAccounts.google = undefined;
    } else if (provider === 'facebook') {
      user.facebookId = undefined;
      user.boundAccounts.facebook = undefined;
    } else if (provider === 'twitter') {
      user.twitterId = undefined;
      user.boundAccounts.twitter = undefined;
    } else if (provider === 'snapchat') {
      user.snapchatId = undefined;
      user.boundAccounts.snapchat = undefined;
    } else if (provider === 'phone') {
      user.phone = undefined;
      user.phoneNumber = undefined;
      user.boundAccounts.phone = undefined;
    } else if (provider === 'telegram') {
      user.telegramId = undefined;
      user.boundAccounts.telegram = undefined;
    } else if (provider === 'instagram') {
      user.instagramId = undefined;
      user.boundAccounts.instagram = undefined;
    }

    user.markModified('boundAccounts');
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account unbound successfully',
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Twitter OAuth 2.0 Code & Return User Profile
// @route   POST /api/auth/twitter-verify-token
exports.verifyTwitterToken = async (req, res) => {
  try {
    const { code, codeVerifier } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Twitter authorization code is required' });
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';
    const verifier = codeVerifier || 'challenge12345678901234567890123456789012345';

    if (!clientId || !clientSecret) {
      console.error('❌ [Twitter Auth] Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET in environment variables');
      return res.status(500).json({ success: false, message: 'Twitter credentials not configured in environment' });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('redirect_uri', redirectUri);
    params.append('code_verifier', verifier);

    const tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      timeout: 10000,
    });

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Failed to obtain Twitter access token' });
    }

    const profileRes = await axios.get(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      }
    );

    const twData = profileRes.data?.data;
    if (!twData || !twData.id) {
      return res.status(400).json({ success: false, message: 'Failed to retrieve Twitter user profile' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        id: twData.id,
        username: twData.username,
        name: twData.name || twData.username || 'Twitter User',
        avatar: twData.profile_image_url
          ? twData.profile_image_url.replace('_normal', '_400x400')
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
    });
  } catch (error) {
    console.error('verifyTwitterToken error:', error.response?.data || error.message);
    return res.status(400).json({
      success: false,
      message:
        error.response?.data?.error_description ||
        error.response?.data?.message ||
        'Failed to authenticate with Twitter',
    });
  }
};

// @desc    Twitter OAuth Direct Sign-In
// @route   POST /api/auth/twitter-login
exports.twitterLogin = async (req, res) => {
  try {
    const { twitterId, username, name, avatar } = req.body;
    if (!twitterId) {
      return res.status(400).json({ success: false, message: 'Twitter ID is required' });
    }

    let user = await User.findOne({ twitterId });
    if (!user) {
      user = await User.create({
        name: name || username || 'Twitter User',
        twitterId,
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Snapchat OAuth 2.0 Code & Return User Profile
// @route   POST /api/auth/snapchat-verify-token
exports.verifySnapchatToken = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Snapchat authorization code is required' });
    }

    const clientId =
      process.env.SNAPCHAT_CONFIDENTIAL_CLIENT_ID ||
      process.env.SNAPCHAT_CLIENT_ID;
    const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET;
    const redirectUri = process.env.SNAPCHAT_REDIRECT_URI || 'https://nodeapp2-yl8c.onrender.com/api/auth/snapchat-callback';

    if (!clientId || !clientSecret) {
      console.error('❌ [Snapchat Auth] Missing SNAPCHAT_CLIENT_ID or SNAPCHAT_CLIENT_SECRET in environment variables');
      return res.status(500).json({ success: false, message: 'Snapchat credentials not configured in environment' });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);

    let tokenRes;
    try {
      tokenRes = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });
    } catch (e1) {
      console.warn('Snapchat token request without basic auth failed, trying with Basic Auth header:', e1.response?.data || e1.message);
      tokenRes = await axios.post('https://accounts.snapchat.com/login/oauth2/access_token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        timeout: 10000,
      });
    }

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Failed to obtain Snapchat access token' });
    }

    // Query Snapchat Kit GraphQL for user info (Bitmoji avatar + Display Name)
    let snapData = { id: `snap_${Date.now()}`, name: 'Snapchat User', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' };

    try {
      const profileRes = await axios.post(
        'https://kit.snapchat.com/v1/me',
        {
          query: '{ me { externalId displayName bitmoji { avatar } } }',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );

      const me = profileRes.data?.data?.me;
      if (me) {
        snapData.id = me.externalId || me.displayName || snapData.id;
        snapData.name = me.displayName || 'Snapchat User';
        if (me.bitmoji?.avatar) {
          snapData.avatar = me.bitmoji.avatar;
        }
      }
    } catch (graphErr) {
      console.warn('Snapchat GraphQL user query note:', graphErr.response?.data || graphErr.message);
    }

    return res.status(200).json({
      success: true,
      profile: snapData,
    });
  } catch (error) {
    const errorDetail = error.response?.data?.error_description || error.response?.data?.message || error.message;
    console.error('verifySnapchatToken error:', error.response?.data || error.message);
    return res.status(400).json({
      success: false,
      message: errorDetail || 'Failed to authenticate with Snapchat',
    });
  }
};

// @desc    Snapchat OAuth Direct Sign-In
// @route   POST /api/auth/snapchat-login
exports.snapchatLogin = async (req, res) => {
  try {
    const { snapchatId, name, avatar } = req.body;
    if (!snapchatId) {
      return res.status(400).json({ success: false, message: 'Snapchat ID is required' });
    }

    let user = await User.findOne({
      $or: [{ snapchatId }, { 'boundAccounts.snapchat.id': snapchatId }],
    });

    if (!user) {
      const generatedName = name || `Snap_${Math.floor(1000 + Math.random() * 9000)}`;
      user = await User.create({
        name: generatedName,
        snapchatId,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        boundAccounts: {
          snapchat: {
            id: snapchatId,
            displayName: generatedName,
            avatar: avatar || '',
            boundAt: new Date(),
          },
        },
      });
    } else {
      if (!user.boundAccounts) user.boundAccounts = {};
      user.snapchatId = snapchatId;
      user.boundAccounts.snapchat = {
        id: snapchatId,
        displayName: name || user.name,
        avatar: avatar || user.avatar,
        boundAt: new Date(),
      };
      if (avatar && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = avatar;
      }
      user.markModified('boundAccounts');
      await user.save();
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
      message: 'Logged in with Snapchat successfully!',
      token,
      user,
    });
  } catch (error) {
    console.error('snapchatLogin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate Dynamic WhatsApp Deep-Link Code for FunMaza Phone Binding
// @route   POST /api/auth/generate-whatsapp-code
exports.generateWhatsAppCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
    }

    // Dynamic unique 5-digit verification code
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    // Store in Redis / memory cache for 10 minutes (600 seconds)
    await cacheService.set(`wa_verify:${cleanPhone}`, code, 600);
    await cacheService.set(`wa_code:${code}`, cleanPhone, 600);

    const targetNumber = process.env.WHATSAPP_VERIFY_NUMBER || '917982720270';
    const messageText = `Verify FunMaza Code: #${code}`;
    const deepLinkUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(messageText)}`;

    console.log(`📱 [FunMaza WhatsApp Direct] Generated code #${code} for +91${cleanPhone}`);

    return res.status(200).json({
      success: true,
      code,
      phoneNumber: cleanPhone,
      messageText,
      deepLinkUrl,
      targetNumber,
      message: `FunMaza verification code generated!`,
    });
  } catch (error) {
    console.error('generateWhatsAppCode error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm WhatsApp Deep-Link Verification for FunMaza
// @route   POST /api/auth/confirm-whatsapp-verify
exports.confirmWhatsAppVerify = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, message: 'Phone number and verification code are required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanCode = code.toString().replace(/\D/g, '');

    const storedCode = await cacheService.get(`wa_verify:${cleanPhone}`);
    if (!storedCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or not found. Please tap Send Code again.',
      });
    }

    if (storedCode.toString().trim() !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    // Delete single-use code
    await cacheService.del(`wa_verify:${cleanPhone}`);
    await cacheService.del(`wa_code:${cleanCode}`);

    // Mark as verified for 15 minutes
    await cacheService.set(`phone_verified:${cleanPhone}`, 'true', 900);

    return res.status(200).json({
      success: true,
      message: 'WhatsApp Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('confirmWhatsAppVerify error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate 6-Digit OTP for Facebook Messenger
// @route   POST /api/auth/generate-facebook-otp
exports.generateFacebookOtp = async (req, res) => {
  try {
    const { facebookId } = req.body;
    if (!facebookId || !facebookId.trim()) {
      return res.status(400).json({ success: false, message: 'Facebook ID / Username is required' });
    }

    const cleanFbId = facebookId.trim().toLowerCase().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '');
    if (!cleanFbId || cleanFbId.length < 3) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Facebook ID or Username' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in cache for 10 minutes (600 seconds)
    await cacheService.set(`fb_otp:${cleanFbId}`, otp, 600);

    const messengerPage = process.env.FACEBOOK_MESSENGER_PAGE || 'FunMazaLive';
    const messengerUrl = `https://m.me/${messengerPage}?ref=${encodeURIComponent(`OTP_${otp}`)}`;

    console.log(`📱 [Facebook Messenger OTP] Generated OTP [${otp}] for Facebook ID [${cleanFbId}]`);

    return res.status(200).json({
      success: true,
      facebookId: cleanFbId,
      messengerUrl,
      message: `OTP code dispatched to Facebook Messenger! 📨`,
    });
  } catch (error) {
    console.error('generateFacebookOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Facebook Messenger 6-Digit OTP
// @route   POST /api/auth/verify-facebook-otp
exports.verifyFacebookOtp = async (req, res) => {
  try {
    const { facebookId, otp } = req.body;
    if (!facebookId || !otp) {
      return res.status(400).json({ success: false, message: 'Facebook ID and OTP code are required' });
    }

    const cleanFbId = facebookId.trim().toLowerCase().replace(/^@/, '').replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '');
    const cleanOtp = otp.toString().trim();

    // Dev master bypass code
    if (cleanOtp === '123456' || cleanOtp === '000000') {
      return res.status(200).json({
        success: true,
        message: 'Facebook OTP Verified Successfully! ✅',
      });
    }

    const storedOtp = await cacheService.get(`fb_otp:${cleanFbId}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please tap Resend OTP.',
      });
    }

    if (storedOtp.toString().trim() !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Wrong OTP code! Please check your Facebook Messenger.',
      });
    }

    // Delete single-use OTP
    await cacheService.del(`fb_otp:${cleanFbId}`);

    return res.status(200).json({
      success: true,
      message: 'Facebook OTP Verified Successfully! ✅',
    });
  } catch (error) {
    console.error('verifyFacebookOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Facebook Access Token & Bind Account (Option 1 - 1-Click Facebook OAuth)
// @route   POST /api/auth/facebook-bind-oauth
exports.facebookBindOAuth = async (req, res) => {
  try {
    const { accessToken, facebookId, name, email, avatar } = req.body;

    let fbUser = null;
    if (accessToken) {
      try {
        const graphRes = await axios.get(
          `https://graph.facebook.com/me?access_token=${encodeURIComponent(accessToken)}&fields=id,name,email,picture.type(large)`
        );
        if (graphRes.data && graphRes.data.id) {
          fbUser = {
            id: graphRes.data.id,
            name: graphRes.data.name,
            email: graphRes.data.email || '',
            avatar: graphRes.data.picture?.data?.url || '',
          };
        }
      } catch (graphErr) {
        console.error('Meta Graph API token verification error:', graphErr?.response?.data || graphErr.message);
      }
    }

    const finalId = fbUser?.id || facebookId;
    const finalName = fbUser?.name || name || 'Facebook User';
    const finalEmail = fbUser?.email || email || '';
    const finalAvatar = fbUser?.avatar || avatar || '';

    if (!finalId) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify Facebook account. Please try again.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if another profile is already bound to this Facebook ID
    const existing = await User.findOne({ facebookId: finalId, _id: { $ne: user._id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This Facebook account is already bound to another profile',
      });
    }

    if (!user.boundAccounts) user.boundAccounts = {};
    user.facebookId = finalId;
    user.boundAccounts.facebook = {
      id: finalId,
      name: finalName,
      email: finalEmail,
      avatar: finalAvatar,
      boundAt: new Date(),
    };

    user.markModified('boundAccounts');
    await user.save();

    console.log(`✅ [Facebook OAuth Binding] Successfully bound Facebook [${finalName}] (ID: ${finalId}) to user [${user.name}]`);

    return res.status(200).json({
      success: true,
      message: 'Facebook account bound successfully! 🎉',
      user,
    });
  } catch (error) {
    console.error('facebookBindOAuth error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Snapchat OAuth Callback Bridge (Redirects to App Scheme)
// @route   GET /api/auth/snapchat-callback
exports.handleSnapchatCallback = (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const appDeepLink = `funmaza://snapchat-callback?${queryString}`;

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FunMaza Voice</title>
  <style>
    body { background-color: #0F0F1A; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .loader { border: 4px solid #1E1E2D; border-top: 4px solid #FFFC00; border-radius: 50%; width: 44px; height: 44px; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #FFFFFF; }
    p { font-size: 14px; color: #9CA3AF; margin: 0; }
    a.fallback-btn { margin-top: 24px; padding: 12px 24px; background: #6366F1; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; display: inline-block; }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h2>Logging into FunMaza...</h2>
  <p>Returning you to the app</p>
  <a class="fallback-btn" id="fallbackLink" href="${appDeepLink}">Open FunMaza Voice</a>
  <script>
    window.location.href = "${appDeepLink}";
  </script>
</body>
</html>`);
};

// @desc    Get Telegram Bot Info & Link for FunMaza
// @route   GET /api/auth/telegram-bot-info
exports.getTelegramBotInfo = async (req, res) => {
  try {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FunMazaApp_bot';
    const userId = req.user?._id;
    const botLink = userId
      ? `https://t.me/${botUsername}?start=bind_${userId}`
      : `https://t.me/${botUsername}`;

    return res.status(200).json({
      success: true,
      botUsername,
      botLink,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initialize Telegram Login Session
// @route   POST /api/auth/telegram-login-init
exports.initTelegramLoginSession = async (req, res) => {
  try {
    const session = createLoginSession();
    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      botUsername: session.botUsername,
      botUrl: session.botUrl,
    });
  } catch (error) {
    console.error('initTelegramLoginSession error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check Telegram Login Session Status
// @route   GET /api/auth/telegram-login-status/:sessionId
exports.checkTelegramLoginSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getLoginSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Login session expired or not found' });
    }
    if (session.status === 'success') {
      return res.status(200).json({
        success: true,
        status: 'success',
        token: session.token,
        user: session.user,
      });
    }
    return res.status(200).json({
      success: true,
      status: 'pending',
    });
  } catch (error) {
    console.error('checkTelegramLoginSession error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Direct Login with bound Telegram account (Disabled for security)
// @route   POST /api/auth/telegram-direct-login
exports.telegramDirectLogin = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Direct Telegram username login is disabled for account security. Please use 1-Tap Telegram Bot login.',
  });
};

// Helper: Verify whether Instagram account actually exists on Instagram
const verifyInstagramAccount = async (username) => {
  try {
    const res = await axios.get(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000,
    });
    const html = res.data || '';
    const titleMatch = typeof html === 'string' ? html.match(/<title>(.*?)<\/title>/) : null;
    const title = titleMatch ? titleMatch[1] : '';

    // Real Instagram profiles have title: "<Name> (@<username>) • Instagram photos and videos"
    const exists =
      title.includes('(') &&
      (title.includes('&#064;') || title.includes('@') || title.includes('Instagram photos and videos'));

    let realName = username;
    const nameMatch = title.match(/^(.*?)\s*[\(\•]/);
    if (nameMatch && nameMatch[1]) {
      realName = nameMatch[1].trim();
    }

    let avatar = null;
    if (typeof html === 'string') {
      const imgMatch =
        html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i) ||
        html.match(/"profile_pic_url(?:_hd)?":\s*"([^"]+)"/i);
      if (imgMatch && imgMatch[1]) {
        avatar = imgMatch[1].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
      }
    }

    return { exists, realName, title, avatar };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    // Strict format fallback
    const isValidFormat = /^[a-zA-Z0-9._]{1,30}$/.test(username);
    return { exists: isValidFormat, realName: username, fallback: true };
  }
};

// @desc    Direct Login / Sign-up with Instagram account (Username or ID)
// @route   POST /api/auth/instagram-direct-login
exports.instagramDirectLogin = async (req, res) => {
  try {
    const { identifier, instagramId, name: passedName, avatar: passedAvatar } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your Instagram @username' });
    }
    const clean = identifier.trim();
    const cleanWithAt = clean.startsWith('@') ? clean : `@${clean}`;
    const cleanWithoutAt = clean.replace(/^@+/, '');

    // Escape regex special characters just in case
    const escapedClean = cleanWithoutAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedWithAt = cleanWithAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const searchConditions = [
      { instagramId: new RegExp(`^${escapedClean}$`, 'i') },
      { 'boundAccounts.instagram.id': new RegExp(`^${escapedClean}$`, 'i') },
      { 'boundAccounts.instagram.username': new RegExp(`^${escapedClean}$`, 'i') },
      { 'boundAccounts.instagram.username': new RegExp(`^${escapedWithAt}$`, 'i') },
    ];

    if (instagramId) {
      const cleanId = String(instagramId).trim();
      const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchConditions.push(
        { instagramId: new RegExp(`^${escapedId}$`, 'i') },
        { 'boundAccounts.instagram.id': new RegExp(`^${escapedId}$`, 'i') }
      );
    }

    let user = await User.findOne({ $or: searchConditions });

    // SECURITY GUARD: Direct username hijacking protection
    // Existing accounts CANNOT be logged in via raw text input without completing Official Instagram Login!
    if (user && req.body.authSource !== 'instagram_webview') {
      return res.status(403).json({
        success: false,
        message: 'For security, please log in through the Official Instagram Login screen with your Instagram password.',
      });
    }

    let avatarUrl = (passedAvatar && typeof passedAvatar === 'string' && passedAvatar.startsWith('http')) ? passedAvatar : null;
    let generatedName = passedName || cleanWithoutAt;

    if (!cleanWithoutAt.startsWith('insta_')) {
      try {
        const check = await verifyInstagramAccount(cleanWithoutAt);
        if (!avatarUrl && check.avatar) avatarUrl = check.avatar;
        if (check.realName && !passedName) generatedName = check.realName;
      } catch (_) {}
    }

    if (!user) {
      if (req.body.authSource === 'instagram_webview') {
        if (cleanWithoutAt.startsWith('insta_')) {
          generatedName = 'Instagram User';
        }
      } else {
        // Direct text handle input: strictly verify existence
        const check = await verifyInstagramAccount(cleanWithoutAt);
        if (!check.exists) {
          return res.status(400).json({
            success: false,
            message: 'This Instagram account does not exist. Please enter a valid Instagram account.',
          });
        }
        if (check.realName) generatedName = check.realName;
        if (!avatarUrl && check.avatar) avatarUrl = check.avatar;
      }

      if (!avatarUrl) {
        avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      }

      const effectiveId = String(instagramId || cleanWithoutAt);

      user = await User.create({
        name: generatedName,
        instagramId: effectiveId,
        avatar: avatarUrl,
        boundAccounts: {
          instagram: {
            id: effectiveId,
            username: cleanWithoutAt,
            name: generatedName,
            avatar: avatarUrl,
            boundAt: new Date(),
          },
        },
      });
    } else {
      if (!user.boundAccounts) user.boundAccounts = {};
      let modified = false;
      const effectiveId = String(instagramId || user.instagramId || cleanWithoutAt);

      if (!user.instagramId) {
        user.instagramId = effectiveId;
        modified = true;
      }

      // ALWAYS set user's profile picture with their verified Instagram DP!
      if (avatarUrl && avatarUrl.startsWith('http')) {
        user.avatar = avatarUrl;
        user.markModified('avatar');
        modified = true;
      }

      if (!user.boundAccounts.instagram) {
        user.boundAccounts.instagram = {
          id: effectiveId,
          username: cleanWithoutAt,
          name: user.name || cleanWithoutAt,
          avatar: avatarUrl || user.avatar || '',
          boundAt: new Date(),
        };
        modified = true;
      } else {
        if (cleanWithoutAt && !cleanWithoutAt.startsWith('insta_') && user.boundAccounts.instagram.username !== cleanWithoutAt) {
          user.boundAccounts.instagram.username = cleanWithoutAt;
          modified = true;
        }
        if (avatarUrl) {
          user.boundAccounts.instagram.avatar = avatarUrl;
          modified = true;
        }
      }
      if (modified) {
        user.markModified('boundAccounts');
        await user.save();
      }
    }

    const banCheck = user.checkActiveBan ? user.checkActiveBan() : { banned: false };
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
      message: 'Logged in with Instagram successfully! 🎉',
      token,
      user,
    });
  } catch (error) {
    console.error('instagramDirectLogin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




// @desc    Handle 1-Tap redirect back into FunMaza mobile app from Telegram
// @route   GET /api/auth/telegram-redirect
exports.handleTelegramRedirect = async (req, res) => {
  const { token, sessionId } = req.query;
  const deepLink = `funmaza://auth-callback?token=${encodeURIComponent(token || '')}&sessionId=${encodeURIComponent(sessionId || '')}`;

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Returning to FunMaza...</title>
        <style>
          body {
            background-color: #0F0F1A;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
          }
          .card {
            background: rgba(30, 30, 45, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 24px;
            padding: 36px 24px;
            max-width: 360px;
            width: 100%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 12px;
          }
          h2 {
            margin: 0 0 8px 0;
            color: #00E676;
            font-size: 22px;
          }
          p {
            color: #94A3B8;
            font-size: 14px;
            margin: 0 0 24px 0;
            line-height: 20px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            color: #FFFFFF;
            padding: 14px 32px;
            border-radius: 20px;
            font-weight: 800;
            text-decoration: none;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          }
        </style>
        <script>
          window.location.href = "${deepLink}";
          setTimeout(function() {
            window.location.href = "${deepLink}";
          }, 300);
        </script>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h2>Authentication Successful!</h2>
          <p>Redirecting back to FunMaza app now...</p>
          <a class="btn" href="${deepLink}">Open FunMaza App</a>
        </div>
      </body>
    </html>
  `);
};

// @desc    Handle incoming Telegram Webhook updates
// @route   POST /api/auth/telegram-webhook
exports.handleTelegramWebhook = async (req, res) => {
  try {
    const update = req.body;
    if (update && update.message) {
      const { handleTelegramMessage } = require('../services/telegramBotService');
      await handleTelegramMessage(update.message);
    }
  } catch (err) {
    console.error('Telegram webhook handler error:', err.message);
  }
  return res.status(200).send('OK');
};

// @desc    Render In-App Telegram Login WebView Page (Solution 1)
// @route   GET /api/auth/telegram-login-page
exports.renderTelegramLoginPage = async (req, res) => {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FunMazaApp_bot';
  const session = createLoginSession();
  const sessionId = session.sessionId;

  return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Login with Telegram - FunMaza</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
    body {
      background: #0F0F1A;
      color: #FFFFFF;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
    }
    .card {
      background: #1E1E2D;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 30px 22px;
      width: 100%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    }
    .icon-circle {
      width: 68px;
      height: 68px;
      background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(42, 171, 238, 0.35);
    }
    .icon-circle svg {
      width: 36px;
      height: 36px;
      fill: #FFFFFF;
    }
    h1 {
      font-size: 21px;
      font-weight: 800;
      margin-bottom: 6px;
      color: #FFFFFF;
    }
    p.subtitle {
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.4;
      margin-bottom: 24px;
    }
    .widget-container {
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }
    .direct-tg-btn {
      width: 100%;
      background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(42, 171, 238, 0.35);
      margin-bottom: 8px;
    }
    .direct-tg-btn svg {
      width: 22px;
      height: 22px;
      fill: #FFFFFF;
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 18px 0;
      color: #64748B;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .divider:not(:empty)::before { margin-right: .75em; }
    .divider:not(:empty)::after { margin-left: .75em; }
    .bot-section {
      background: rgba(42, 171, 238, 0.08);
      border: 1px dashed rgba(42, 171, 238, 0.3);
      border-radius: 16px;
      padding: 14px;
      text-align: center;
    }
    .bot-section-title {
      font-size: 12px;
      font-weight: 700;
      color: #2AABEE;
      margin-bottom: 4px;
    }
    .bot-section-text {
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .code-badge {
      display: inline-block;
      background: #0F0F1A;
      color: #38BDF8;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      user-select: all;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #22C55E;
      margin-top: 18px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { opacity: 0.3; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.15); }
      100% { opacity: 0.3; transform: scale(0.9); }
    }
    .loading-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 15, 26, 0.95);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255,255,255,0.1);
      border-top-color: #2AABEE;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-circle">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
      </svg>
    </div>

    <h1>Sign in with Telegram</h1>
    <p class="subtitle">Fast, secure 1-tap authentication</p>

    <!-- Direct Telegram 1-Tap Login Button -->
    <button type="button" class="direct-tg-btn" onclick="openDirectTgAuth()">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/></svg>
      <span>Continue with Telegram</span>
    </button>

    <!-- Official Telegram Login Widget -->
    <div class="widget-container" id="widget-container">
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="large"
        data-radius="12"
        data-onauth="onTelegramAuth(user)"
        data-request-access="write">
      </script>
    </div>

    <div class="divider">or bot verification</div>

    <div class="bot-section">
      <div class="bot-section-title">⚡ 1-Tap Bot Code</div>
      <p class="bot-section-text">Send this code to <b>@${botUsername}</b>:</p>
      <div>
        <span class="code-badge">/start login_${sessionId}</span>
      </div>
    </div>

    <div class="status-pill">
      <div class="pulse-dot"></div>
      <span>Listening for Telegram login...</span>
    </div>
  </div>

  <div class="loading-overlay" id="loading-overlay">
    <div class="spinner"></div>
    <div style="font-size: 16px; font-weight: 700; color: #FFFFFF;">Logging in...</div>
    <div style="font-size: 13px; color: #94A3B8; margin-top: 6px;">Entering FunMaza</div>
  </div>

  <script>
    const sessionId = "${sessionId}";
    const botId = "8836145749";

    // Ensure window.open in WebView navigates the current frame instead of being dropped
    const origOpen = window.open;
    window.open = function(url, target, features) {
      if (url && (url.indexOf('oauth.telegram.org') !== -1 || url.indexOf('/auth') !== -1)) {
        window.location.href = url;
        return window;
      }
      return origOpen ? origOpen.apply(window, arguments) : null;
    };

    function showLoading() {
      document.getElementById('loading-overlay').style.display = 'flex';
    }

    function openDirectTgAuth() {
      showLoading();
      const origin = window.location.origin;
      const returnTo = window.location.origin + '/api/auth/telegram-login-page';
      window.location.href = 'https://oauth.telegram.org/auth?bot_id=' + encodeURIComponent(botId) +
        '&origin=' + encodeURIComponent(origin) +
        '&request_access=write&return_to=' + encodeURIComponent(returnTo);
    }

    function handleSuccess(token, user) {
      showLoading();
      const payload = {
        type: 'TELEGRAM_AUTH_SUCCESS',
        token: token,
        user: user
      };
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      } else {
        window.location.href = 'funmaza://auth-callback?token=' + encodeURIComponent(token);
      }
    }

    // Check if redirected back with tgAuthResult in URL hash/query
    function checkTgAuthResult() {
      try {
        const fullUrl = window.location.href;
        const match = fullUrl.match(/[#\?\&]tgAuthResult=([A-Za-z0-9\-_=]+)/);
        if (match && match[1]) {
          let b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          const tgUser = JSON.parse(atob(b64));
          if (tgUser && tgUser.id) {
            window.onTelegramAuth(tgUser);
          }
        }
      } catch (e) {
        console.error('Error parsing tgAuthResult:', e);
      }
    }

    // Called automatically by Telegram Widget on success
    window.onTelegramAuth = function(tgUser) {
      showLoading();
      fetch('/api/auth/telegram-widget-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgUser)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.token) {
          handleSuccess(data.token, data.user);
        } else {
          alert(data.message || 'Telegram login failed');
          document.getElementById('loading-overlay').style.display = 'none';
        }
      })
      .catch(err => {
        alert('Authentication error: ' + (err.message || 'Network error'));
        document.getElementById('loading-overlay').style.display = 'none';
      });
    };

    checkTgAuthResult();

    // Auto-polling for bot-initiated login
    const pollInterval = setInterval(() => {
      fetch('/api/auth/telegram-login-status/' + sessionId)
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.status === 'success' && data.token) {
            clearInterval(pollInterval);
            handleSuccess(data.token, data.user);
          }
        })
        .catch(() => {});
    }, 1800);
  </script>
</body>
</html>`);
};

// @desc    Handle Telegram Login Widget POST callback
// @route   POST /api/auth/telegram-widget-login
exports.handleTelegramWidgetLogin = async (req, res) => {
  try {
    const authData = req.body;
    if (!authData || !authData.id || !authData.hash) {
      return res.status(400).json({ success: false, message: 'Invalid Telegram authentication payload' });
    }

    const { verifyTelegramWidgetData } = require('../services/telegramBotService');
    const isValid = verifyTelegramWidgetData(authData);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Telegram authentication hash verification failed' });
    }

    let user = await User.findOne({
      $or: [
        { telegramId: String(authData.id) },
        { 'boundAccounts.telegram.id': String(authData.id) },
      ],
    });

    if (!user) {
      const displayName = [authData.first_name, authData.last_name].filter(Boolean).join(' ') || authData.username || `User_${String(authData.id).slice(-4)}`;
      user = await User.create({
        name: displayName,
        telegramId: String(authData.id),
        avatar: authData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        boundAccounts: {
          telegram: {
            id: String(authData.id),
            username: authData.username ? `@${authData.username.replace('@', '')}` : '',
            firstName: authData.first_name || '',
            lastName: authData.last_name || '',
            boundAt: new Date(),
          },
        },
      });
    }

    const banCheck = user.checkActiveBan ? user.checkActiveBan() : { banned: false };
    if (banCheck.banned) {
      return res.status(403).json({ success: false, message: `Account suspended: ${banCheck.message}` });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('handleTelegramWidgetLogin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle Telegram Login Widget GET callback (redirect mode)
// @route   GET /api/auth/telegram-widget-callback
exports.handleTelegramWidgetCallback = async (req, res) => {
  try {
    const authData = req.query;
    if (!authData || !authData.id || !authData.hash) {
      return res.status(400).send('Invalid Telegram auth request');
    }

    const { verifyTelegramWidgetData } = require('../services/telegramBotService');
    const isValid = verifyTelegramWidgetData(authData);
    if (!isValid) {
      return res.status(401).send('Telegram verification failed: Invalid signature');
    }

    let user = await User.findOne({
      $or: [
        { telegramId: String(authData.id) },
        { 'boundAccounts.telegram.id': String(authData.id) },
      ],
    });

    if (!user) {
      const displayName = [authData.first_name, authData.last_name].filter(Boolean).join(' ') || authData.username || `User_${String(authData.id).slice(-4)}`;
      user = await User.create({
        name: displayName,
        telegramId: String(authData.id),
        avatar: authData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        boundAccounts: {
          telegram: {
            id: String(authData.id),
            username: authData.username ? `@${authData.username.replace('@', '')}` : '',
            firstName: authData.first_name || '',
            lastName: authData.last_name || '',
            boundAt: new Date(),
          },
        },
      });
    }

    const banCheck = user.checkActiveBan ? user.checkActiveBan() : { banned: false };
    if (banCheck.banned) {
      return res.status(403).send(`Account Suspended: ${banCheck.message}`);
    }

    const token = generateToken(user._id);

    return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Successful</title>
  <style>
    body { background: #0F0F1A; color: #FFF; font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #2AABEE; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Login Successful!</h2>
  <p style="color: #94A3B8; margin-top: 8px;">Connecting to FunMaza...</p>
  <script>
    const payload = {
      type: 'TELEGRAM_AUTH_SUCCESS',
      token: '${token}',
      user: ${JSON.stringify(user)}
    };
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
    setTimeout(() => {
      window.location.href = 'funmaza://auth-callback?token=${token}';
    }, 600);
  </script>
</body>
</html>`);
  } catch (error) {
    console.error('handleTelegramWidgetCallback error:', error);
    return res.status(500).send('Authentication Error: ' + error.message);
  }
};

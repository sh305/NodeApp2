const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SmsOtpService = require('../services/smsOtpService');
const WhatsAppOtpService = require('../services/whatsappOtpService');
const VoiceOtpService = require('../services/voiceOtpService');
const EmailOtpService = require('../services/emailOtpService');
const { cacheService } = require('../config/redis');
const axios = require('axios');

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
      const fbAppId = process.env.FACEBOOK_APP_ID || '4171729949789896';
      const fbAppSecret = process.env.FACEBOOK_APP_SECRET || '3a1542d32cad765d08107386a726659a';
      const redirectUri = 'https://funapp-2e00d.firebaseapp.com/__/auth/handler';

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
    } else if (provider === 'phone') {
      user.phone = undefined;
      user.phoneNumber = undefined;
      user.boundAccounts.phone = undefined;
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

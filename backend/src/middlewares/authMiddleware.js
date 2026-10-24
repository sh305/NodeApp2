const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or deleted' });
      }

      // Auto-assign owner role if user email matches configured OWNER_EMAIL
      const ownerEmail = (process.env.OWNER_EMAIL || 'shivamraie09@gmail.com').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userEmail && userEmail === ownerEmail && user.role !== 'owner') {
        user.role = 'owner';
        await user.save();
      }

      // Check if user is currently banned due to reports
      const banStatus = user.checkActiveBan();
      if (banStatus.banned) {
        return res.status(403).json({
          success: false,
          banned: true,
          banType: banStatus.type,
          expiresAt: banStatus.expiresAt,
          message: banStatus.message,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const protectOwner = (req, res, next) => {
  const ownerEmail = (process.env.OWNER_EMAIL || 'shivamraie09@gmail.com').toLowerCase().trim();
  const userEmail = (req.user?.email || '').toLowerCase().trim();
  const isOwner = req.user?.role === 'owner' || (userEmail && userEmail === ownerEmail);

  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only the App Owner can access this moderation area.',
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'yoyo_super_secret_jwt_key_2026_!@#$%^'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {}
  }
  next();
};

module.exports = { protect, protectOwner, optionalAuth };

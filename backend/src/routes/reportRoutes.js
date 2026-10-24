const express = require('express');
const router = express.Router();
const {
  submitReport,
  getAdminReports,
  warnUser,
  banUser,
  dismissReport,
  unbanUser,
} = require('../controllers/reportController');
const { protect, protectOwner } = require('../middlewares/authMiddleware');

// Public User Endpoint: Submit report (Requires Authentication)
router.post('/', protect, submitReport);

// Owner / Super-Admin Moderation Endpoints (Protected by protectOwner)
router.get('/admin/all', protect, protectOwner, getAdminReports);
router.post('/admin/warn/:userId', protect, protectOwner, warnUser);
router.post('/admin/ban/:userId', protect, protectOwner, banUser);
router.post('/admin/dismiss/:reportId', protect, protectOwner, dismissReport);
router.post('/admin/unban/:userId', protect, protectOwner, unbanUser);

module.exports = router;

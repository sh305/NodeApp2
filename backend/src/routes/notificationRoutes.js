const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getSystemNotifications,
  getTotalUnreadBadgeCount,
  markNotificationsSeen,
  markResolvedNotificationsAsViewed,
} = require('../controllers/notificationController');

router.get('/system', protect, getSystemNotifications);
router.get('/unread-count', protect, getTotalUnreadBadgeCount);
router.post('/mark-seen', protect, markNotificationsSeen);
router.post('/mark-resolved-viewed', protect, markResolvedNotificationsAsViewed);

module.exports = router;

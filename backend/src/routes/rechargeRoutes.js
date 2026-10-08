const express = require('express');
const router = express.Router();
const {
  createRechargeRequest,
  getMyRechargeStatus,
  uploadRefundQr,
  uploadPaymentProof,
  acknowledgeRequest,
  getAllRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
  resolveRechargeRequest,
} = require('../controllers/rechargeController');
const { protect } = require('../middlewares/authMiddleware');

// User routes
router.get('/my-status', protect, getMyRechargeStatus);
router.post('/request', protect, createRechargeRequest);
router.post('/:id/upload-refund-qr', protect, uploadRefundQr);
router.post('/:id/upload-payment-proof', protect, uploadPaymentProof);
router.post('/:id/acknowledge', protect, acknowledgeRequest);

// Admin routes (Confirm Money)
router.get('/admin/list', protect, getAllRechargeRequests);
router.post('/admin/:id/approve', protect, approveRechargeRequest);
router.post('/admin/:id/reject', protect, rejectRechargeRequest);
router.post('/admin/:id/resolve', protect, resolveRechargeRequest);

module.exports = router;

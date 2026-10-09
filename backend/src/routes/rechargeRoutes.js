const express = require('express');
const router = express.Router();
const {
  validateProofImage,
  createRechargeRequest,
  getMyRechargeStatus,
  uploadRefundQr,
  uploadPaymentProof,
  acknowledgeRequest,
  getAllRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
  resolveRechargeRequest,
  submitUserProblem,
  getAdminUserProblems,
  getAdminProblemsCount,
  resolveUserProblem,
} = require('../controllers/rechargeController');
const { protect } = require('../middlewares/authMiddleware');

// User routes
router.get('/my-status', protect, getMyRechargeStatus);
router.post('/validate-proof', protect, validateProofImage);
router.post('/request', protect, createRechargeRequest);
router.post('/:id/upload-refund-qr', protect, uploadRefundQr);
router.post('/:id/upload-payment-proof', protect, uploadPaymentProof);
router.post('/:id/acknowledge', protect, acknowledgeRequest);
router.post('/:id/submit-problem', protect, submitUserProblem);

// Admin routes (Confirm Money & User Problems)
router.get('/admin/list', protect, getAllRechargeRequests);
router.post('/admin/:id/approve', protect, approveRechargeRequest);
router.post('/admin/:id/reject', protect, rejectRechargeRequest);
router.post('/admin/:id/resolve', protect, resolveRechargeRequest);
router.get('/admin/problems', protect, getAdminUserProblems);
router.get('/admin/problems-count', protect, getAdminProblemsCount);
router.post('/admin/:id/resolve-problem', protect, resolveUserProblem);

module.exports = router;

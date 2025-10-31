import express from 'express';
import {
  getPaymentDetails,
  processPayment,
  verifyPaymentStatus,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Get payment details for invoice (returns 402 with payment requirements)
router.get('/:invoiceId/details', getPaymentDetails);

// Process payment after x402 verification (protected by x402 middleware)
router.post('/process', processPayment);

// Check payment status
router.get('/:invoiceId/status', verifyPaymentStatus);

export default router;


/**
 * x402 Facilitator Controller
 * Handles payment processing requests
 */

import {
  getFacilitatorInfo,
  processPayment,
} from "../services/facilitator.service.js";
import { logger } from "../utils/logger.js";

/**
 * GET /api/facilitator/health
 * Get facilitator status and info
 */
export const getHealth = async (req, res, next) => {
  try {
    const info = getFacilitatorInfo();
    res.json(info);
  } catch (error) {
    logger.error("Error getting facilitator info:", error);
    next(error);
  }
};

/**
 * POST /api/facilitator/process
 * Process a payment with EIP-3009 transferWithAuthorization
 */
export const processPaymentRequest = async (req, res, next) => {
  try {
    const result = await processPayment(req.body);
    res.json(result);
  } catch (error) {
    logger.error("Error processing payment:", error);
    res.status(500).json({
      error: error.message,
      details: error.toString(),
    });
  }
};

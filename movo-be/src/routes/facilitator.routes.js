/**
 * x402 Facilitator Routes
 */

import express from "express";
import {
  getHealth,
  processPaymentRequest,
} from "../controllers/facilitator.controller.js";

const router = express.Router();

// GET /api/facilitator/health - Get facilitator status
router.get("/health", getHealth);

// POST /api/facilitator/process - Process payment
router.post("/process", processPaymentRequest);

export default router;

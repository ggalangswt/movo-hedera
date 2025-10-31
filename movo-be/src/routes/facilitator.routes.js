/** * x402 Facilitator Routes
 */

import express from "express";
import {
  getHealth,
  processPaymentRequest,
} from "../controllers/facilitator.controller.js";

const router = express.Router();

// Additional CORS headers for facilitator endpoints
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// GET /api/facilitator/health - Get facilitator status
router.get("/health", getHealth);

// POST /api/facilitator/process - Process payment
router.post("/process", processPaymentRequest);

export default router;

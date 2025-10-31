import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST, before any other imports
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

import express from "express";
import cors from "cors";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import merchantRoutes from "./routes/merchant.routes.js";
import facilitatorRoutes from "./routes/facilitator.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { logger } from "./utils/logger.js";
import { initializeFacilitator } from "./services/facilitator.service.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Note: x402 middleware removed for dynamic pricing
// Payment verification is handled manually in payment.controller.js
// Each invoice has different amount, so we can't use static middleware config

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/facilitator", facilitatorRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize facilitator
try {
  initializeFacilitator();
} catch (error) {
  logger.error("Failed to initialize facilitator:", error);
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Movo Backend running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 Network: ${process.env.X402_NETWORK}`);
  logger.info(`💡 Facilitator endpoint: /api/facilitator`);
});

export default app;

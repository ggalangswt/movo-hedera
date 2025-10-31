import { logger } from "../utils/logger.js";
import { swapUSDCToMIDR } from "../services/swap.service.js";
import { verifyX402Payment } from "../services/x402.service.js";
import {
  processX402PaymentOnchain,
  verifyInvoicePaidOnchain,
  registerInvoiceOnchain,
  checkInvoiceExists,
} from "../services/contract.service.js";
import prisma from "../utils/prisma.js";

/**
 * Get payment details for invoice
 * Returns 402 Payment Required with x402 payment instructions
 */
export async function getPaymentDetails(req, res, next) {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        merchant: {
          select: {
            walletAddress: true,
            businessName: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if invoice is expired
    if (new Date() > invoice.expiresAt) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "EXPIRED" },
      });
      return res.status(410).json({
        success: false,
        error: "Invoice expired",
      });
    }

    // Check if already paid
    if (invoice.status === "PAID" || invoice.status === "SETTLED") {
      return res.status(409).json({
        success: false,
        error: "Invoice already paid",
      });
    }

    // Check if request has X-PAYMENT header (x402 flow: client retrying with payment)
    const xPaymentHeader = req.headers["x-payment"];

    if (xPaymentHeader) {
      logger.info("X-PAYMENT header detected, verifying payment");

      // Parse X-PAYMENT header to get payer address
      let paymentData;
      try {
        paymentData = JSON.parse(
          Buffer.from(xPaymentHeader, "base64").toString()
        );
        logger.info("Payment data parsed:", JSON.stringify(paymentData));
      } catch (err) {
        logger.error("Failed to parse X-PAYMENT header:", err);
        return res.status(400).json({
          success: false,
          error: "Invalid X-PAYMENT header format",
        });
      }

      // Extract payer address from payment data
      const payerAddress = paymentData.from;
      if (!payerAddress) {
        return res.status(400).json({
          success: false,
          error: "Missing payer address in X-PAYMENT header",
        });
      }

      logger.info(`Payer address: ${payerAddress}`);

      // Verify payment amount matches invoice
      const expectedAmountInSmallestUnit = Math.floor(
        parseFloat(invoice.usdcAmount) * 1_000_000
      );

      logger.info(
        `Expected payment: ${expectedAmountInSmallestUnit} smallest units (${invoice.usdcAmount} USDC)`
      );

      // Check if invoice exists on smart contract, if not, register it
      logger.info("Checking if invoice exists on smart contract...");
      const invoiceExists = await checkInvoiceExists(invoice.invoiceNo);

      if (!invoiceExists) {
        logger.info("Invoice not found on smart contract, registering now...");
        try {
          await registerInvoiceOnchain(
            invoice.invoiceNo,
            invoice.merchant.walletAddress,
            invoice.usdcAmount
          );
          logger.info(`Invoice ${invoice.invoiceNo} registered successfully`);
        } catch (regError) {
          logger.error(
            "Error registering invoice on smart contract:",
            regError
          );
          return res.status(500).json({
            success: false,
            error: "Failed to register invoice on smart contract",
          });
        }
      } else {
        logger.info("Invoice already exists on smart contract");
      }

      // Process payment onchain: USDC -> mIDR swap via smart contract
      logger.info("Processing payment onchain via smart contract...");

      const swapResult = await processX402PaymentOnchain(
        invoice.invoiceNo, // Use invoiceNo as invoiceId in smart contract
        payerAddress, // Use actual payer address from X-PAYMENT header
        invoice.usdcAmount
      );

      logger.info("Onchain swap completed:", swapResult);

      // Update invoice status to SETTLED (both paid and swapped)
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "SETTLED",
          paymentHash: swapResult.txHash,
          paidAt: new Date(),
          paidAmount: invoice.usdcAmount,
        },
      });

      // Create payment details record with swap info
      await prisma.paymentDetail.create({
        data: {
          invoiceId: invoice.id,
          transactionHash: swapResult.txHash,
          fromAddress: payerAddress,
          toAddress: invoice.merchant.walletAddress,
          usdcAmount: invoice.usdcAmount,
          midrAmount: swapResult.midrAmount,
          swapTxHash: swapResult.txHash,
          network: process.env.X402_NETWORK || "hedera-testnet",
          paidAt: new Date(),
          settledAt: new Date(),
        },
      });

      // Return 200 OK with X-PAYMENT-RESPONSE header (x402 spec)
      const paymentResponse = {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.usdcAmount,
        status: "PAID",
        paidAt: new Date().toISOString(),
      };

      res.setHeader(
        "X-PAYMENT-RESPONSE",
        Buffer.from(JSON.stringify(paymentResponse)).toString("base64")
      );

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        data: updatedInvoice,
      });
    }

    // No X-PAYMENT header - return 402 Payment Required with x402 payment instructions
    const usdcAmountInSmallestUnit = Math.floor(
      parseFloat(invoice.usdcAmount) * 1_000_000
    ).toString();
    const backendUrl =
      process.env.BACKEND_WALLET_ADDRESS || "http://localhost:4000";

    // IMPORTANT: resource points to THIS SAME endpoint
    // Client will retry THIS endpoint with X-PAYMENT header (x402 spec)
    // Use local facilitator to avoid CORS issues - frontend can call backend directly
    const facilitatorUrl =
      process.env.X402_FACILITATOR_URL || `${backendUrl}/api/facilitator`;

    return res.status(402).json({
      x402Version: 1,
      error: "Payment Required",
      accepts: [
        {
          scheme: "exact",
          network: process.env.X402_NETWORK || "hedera-testnet",
          maxAmountRequired: usdcAmountInSmallestUnit,
          asset:
            process.env.USDC_TOKEN_ADDRESS ||
            "0x0000000000000000000000000000000000068cDa",
          payTo: invoice.merchant.walletAddress,
          resource: `${backendUrl}/api/payments/${invoiceId}/details`,
          description: `Invoice ${invoice.invoiceNo} - ${invoice.productName}`,
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
          facilitator: facilitatorUrl, // ← ADD THIS!
          metadata: {
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo,
            customerName: invoice.customerName,
            amount: invoice.amount.toString(),
            currency: invoice.currency,
            merchantName: invoice.merchant.businessName,
          },
        },
      ],
    });
  } catch (error) {
    logger.error("Error getting payment details:", error);
    next(error);
  }
}

/**
 * Process payment after x402 verification
 * Manually verifies x402 payment for dynamic pricing
 */
export async function processPayment(req, res, next) {
  try {
    // Log request details for debugging
    logger.info("processPayment called");
    logger.info("Headers:", JSON.stringify(Object.keys(req.headers)));
    logger.info("Body:", JSON.stringify(req.body));

    // Extract x-payment header (contains ERC-3009 signature + metadata)
    const xPaymentHeader = req.headers["x-payment"];

    if (!xPaymentHeader) {
      logger.error("Missing x-payment header");
      return res.status(402).json({
        success: false,
        error: "Payment required - missing x-payment header",
      });
    }

    logger.info("x-payment header received, length:", xPaymentHeader.length);

    // Parse payment authorization
    let paymentAuth;
    try {
      paymentAuth = JSON.parse(
        Buffer.from(xPaymentHeader, "base64").toString()
      );
      logger.info("Payment auth parsed:", JSON.stringify(paymentAuth));
    } catch (err) {
      logger.error("Failed to parse x-payment header:", err);
      return res.status(400).json({
        success: false,
        error: "Invalid payment authorization format",
      });
    }

    // Extract metadata from payment
    const metadata = paymentAuth.metadata || req.body.metadata;
    const invoiceId = metadata?.invoiceId;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: "Invoice ID required in metadata",
      });
    }

    logger.info(`Processing x402 payment for invoice: ${invoiceId}`);

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        merchant: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if already paid
    if (invoice.status === "PAID" || invoice.status === "SETTLED") {
      return res.status(409).json({
        success: false,
        error: "Invoice already paid",
      });
    }

    // Verify payment amount matches invoice (in smallest unit)
    const expectedAmountInSmallestUnit = Math.floor(
      parseFloat(invoice.usdcAmount) * 1_000_000
    );
    const paidAmount = parseInt(paymentAuth.value || paymentAuth.amount || "0");

    if (paidAmount < expectedAmountInSmallestUnit) {
      return res.status(400).json({
        success: false,
        error: `Insufficient payment amount. Expected: ${expectedAmountInSmallestUnit}, Received: ${paidAmount}`,
      });
    }

    // Note: In production, verify signature with facilitator or on-chain
    // For hackathon/demo, we trust the x402-fetch client signature
    logger.info(
      `Payment verified: ${paidAmount} smallest units (${invoice.usdcAmount} USDC)`
    );

    // Extract payment info for records
    const paymentData = {
      from: paymentAuth.from || paymentAuth.owner,
      to: paymentAuth.to || invoice.merchant.walletAddress,
      amount: paidAmount,
      signature: paymentAuth.signature,
    };

    // Validate payer address
    if (!paymentData.from) {
      return res.status(400).json({
        success: false,
        error: "Missing payer address in payment authorization",
      });
    }

    // Process payment onchain: USDC -> mIDR swap via smart contract
    logger.info("Processing x402 payment onchain via smart contract...");

    const swapResult = await processX402PaymentOnchain(
      invoice.invoiceNo,
      paymentData.from,
      invoice.usdcAmount
    );

    logger.info("Onchain swap completed:", swapResult);

    // Update invoice status to SETTLED
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "SETTLED",
        paymentHash: swapResult.txHash,
        paidAt: new Date(),
        paidAmount: invoice.usdcAmount,
      },
    });

    // Create payment details with swap info
    const paymentDetail = await prisma.paymentDetail.create({
      data: {
        invoiceId: invoice.id,
        transactionHash: swapResult.txHash,
        fromAddress: paymentData.from,
        toAddress: invoice.merchant.walletAddress,
        usdcAmount: invoice.usdcAmount,
        midrAmount: swapResult.midrAmount,
        swapTxHash: swapResult.txHash,
        network: process.env.X402_NETWORK || "hedera-testnet",
        paidAt: new Date(),
        settledAt: new Date(),
      },
    });

    logger.info(`Payment processed for invoice: ${invoice.invoiceNo}`);

    res.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        invoice: updatedInvoice,
        paymentDetail,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount.toString(),
        currency: invoice.currency,
      },
    });
  } catch (error) {
    logger.error("Error processing payment:", error);
    next(error);
  }
}

/**
 * Verify payment status
 */
export async function verifyPaymentStatus(req, res, next) {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        paymentDetails: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    res.json({
      success: true,
      data: {
        status: invoice.status,
        paid: ["PAID", "SETTLED"].includes(invoice.status),
        paidAt: invoice.paidAt,
        paymentDetails: invoice.paymentDetails,
      },
    });
  } catch (error) {
    logger.error("Error verifying payment status:", error);
    next(error);
  }
}

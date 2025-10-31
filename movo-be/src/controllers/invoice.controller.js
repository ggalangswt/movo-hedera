import { v4 as uuidv4 } from "uuid";
import { generateInvoiceNumber } from "../utils/invoice.utils.js";
import { sendInvoiceEmailService } from "../services/email.service.js";
import { convertToUSDC } from "../utils/currency.utils.js";
import { logger } from "../utils/logger.js";
import { registerInvoiceOnchain } from "../services/contract.service.js";
import prisma from "../utils/prisma.js";

/**
 * Create new invoice and automatically send email
 */
export async function createInvoice(req, res, next) {
  try {
    const {
      merchantId, // From authenticated user
      walletAddress, // Merchant wallet address (NEW)
      customerEmail,
      customerName,
      productName,
      description,
      amount,
      currency,
      expiresInDays = 7,
    } = req.body;

    // Find or create merchant by wallet address
    let finalMerchantId = merchantId;

    if (walletAddress && !merchantId) {
      logger.info(`Finding or creating merchant with wallet: ${walletAddress}`);

      // Use upsert for better performance (1 query instead of 2-3)
      const merchant = await prisma.merchant.upsert({
        where: {
          walletAddress: walletAddress.toLowerCase(),
        },
        update: {}, // No update needed
        create: {
          walletAddress: walletAddress.toLowerCase(),
          businessName: `Merchant ${walletAddress.slice(
            0,
            6
          )}...${walletAddress.slice(-4)}`,
          email: `merchant-${walletAddress.slice(2, 8).toLowerCase()}@movo.xyz`,
          profileCompleted: false,
        },
        select: {
          id: true,
        },
      });

      finalMerchantId = merchant.id;
      logger.info(`Merchant ready: ${merchant.id}`);
    }

    // Generate invoice number
    const invoiceNo = generateInvoiceNumber();

    // Calculate USDC amount
    const { usdcAmount, conversionRate } = convertToUSDC(amount, currency);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        customerEmail,
        customerName,
        productName,
        description,
        amount,
        currency,
        usdcAmount,
        conversionRate,
        expiresAt,
        status: "PREPARED",
        merchantId: finalMerchantId || "default-merchant-id",
      },
      include: {
        merchant: true,
      },
    });

    logger.info(`Invoice created in database: ${invoiceNo}`);

    // Register invoice on smart contract
    try {
      await registerInvoiceOnchain(
        invoiceNo,
        invoice.merchant.walletAddress,
        usdcAmount
      );
      logger.info(`Invoice registered on smart contract: ${invoiceNo}`);
    } catch (contractError) {
      logger.error(
        "Error registering invoice on smart contract:",
        contractError
      );
      // Continue anyway - invoice is created in database
      // Payment can still work if we fix the contract registration later
    }

    // Automatically send email
    try {
      await sendInvoiceEmailService(invoice);

      // Update status to SENT
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });

      logger.info(`Invoice email sent automatically: ${invoiceNo}`);

      res.status(201).json({
        success: true,
        message: "Invoice created and email sent successfully",
        data: {
          ...invoice,
          status: "SENT",
        },
      });
    } catch (emailError) {
      // If email fails, still return success but with warning
      logger.error("Error sending invoice email:", emailError);

      res.status(201).json({
        success: true,
        message: "Invoice created but email failed to send",
        warning: "Email delivery failed",
        data: invoice,
      });
    }
  } catch (error) {
    logger.error("Error creating invoice:", error);
    next(error);
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(req, res, next) {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true,
            walletAddress: true,
          },
        },
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
      data: invoice,
    });
  } catch (error) {
    logger.error("Error fetching invoice:", error);
    next(error);
  }
}

/**
 * Get all invoices for merchant
 */
export async function getInvoices(req, res, next) {
  try {
    const {
      merchantId,
      walletAddress,
      status,
      page = 1,
      limit = 100,
    } = req.query;

    logger.info(`GET /invoices - Query params:`, {
      merchantId,
      walletAddress,
      status,
      page,
      limit,
    });

    // Build where clause
    const where = {};

    // Filter by wallet address if provided (via merchant relation)
    if (walletAddress) {
      logger.info(
        `Searching for merchant with wallet address: ${walletAddress}`
      );

      // First find merchant with this wallet address
      const merchant = await prisma.merchant.findFirst({
        where: {
          walletAddress: {
            equals: walletAddress,
            mode: "insensitive", // Case insensitive comparison
          },
        },
      });

      logger.info(
        `Merchant found:`,
        merchant
          ? { id: merchant.id, walletAddress: merchant.walletAddress }
          : "None"
      );

      if (merchant) {
        where.merchantId = merchant.id;
      } else {
        // No merchant found with this wallet, return empty array
        logger.warn(`No merchant found with wallet address: ${walletAddress}`);
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
          },
        });
      }
    } else if (merchantId) {
      where.merchantId = merchantId;
    }

    if (status) where.status = status;

    logger.info(`Querying invoices with where clause:`, where);

    // Use transaction to run queries in parallel for better performance
    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNo: true,
          customerEmail: true,
          customerName: true,
          productName: true,
          description: true,
          amount: true,
          currency: true,
          usdcAmount: true,
          conversionRate: true,
          status: true,
          paymentHash: true,
          paidAt: true,
          createdAt: true,
          expiresAt: true,
          merchant: {
            select: {
              id: true,
              businessName: true,
              email: true,
              walletAddress: true,
            },
          },
          paymentDetails: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    logger.info(
      `Found ${total} invoices, returning ${invoices.length} in current page`
    );

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    next(error);
  }
}

/**
 * Send invoice via email
 */
export async function sendInvoiceEmail(req, res, next) {
  try {
    const { invoiceId } = req.params;

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

    // Send email
    await sendInvoiceEmailService(invoice);

    // Update status to SENT
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });

    logger.info(`Invoice email sent: ${invoice.invoiceNo}`);

    res.json({
      success: true,
      message: "Invoice sent successfully",
    });
  } catch (error) {
    logger.error("Error sending invoice email:", error);
    next(error);
  }
}

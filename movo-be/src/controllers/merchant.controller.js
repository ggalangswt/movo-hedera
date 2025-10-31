import { logger } from "../utils/logger.js";
import prisma from "../utils/prisma.js";

/**
 * Get merchant profile by wallet address
 */
export async function getMerchantProfile(req, res, next) {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    logger.info(`Getting merchant profile for wallet: ${walletAddress}`);

    // Use upsert for better performance (1 query instead of 2-3)
    const merchant = await prisma.merchant.upsert({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
      update: {}, // No update needed when just getting profile
      create: {
        walletAddress: walletAddress.toLowerCase(),
        email: `merchant-${walletAddress.slice(2, 8).toLowerCase()}@movo.xyz`,
        businessName: null,
        name: null,
        profileCompleted: false,
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        name: true,
        businessName: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    logger.error("Error getting merchant profile:", error);
    next(error);
  }
}

/**
 * Update merchant profile
 */
export async function updateMerchantProfile(req, res, next) {
  try {
    const { walletAddress } = req.params;
    const { email, name, businessName } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Wallet address is required",
      });
    }

    logger.info(`Updating merchant profile for wallet: ${walletAddress}`);

    // Use upsert for better performance - single atomic operation
    const merchant = await prisma.merchant.upsert({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        email:
          email ||
          `merchant-${walletAddress.slice(2, 8).toLowerCase()}@movo.xyz`,
        name,
        businessName,
        profileCompleted: !!(email && name && businessName),
      },
      update: {
        ...(email && { email }),
        ...(name !== undefined && { name }),
        ...(businessName !== undefined && { businessName }),
        // Recalculate profileCompleted based on all fields
        profileCompleted: {
          set: !!(email || name || businessName),
        },
      },
    });

    logger.info(`Merchant profile updated: ${merchant.id}`);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: merchant.id,
        walletAddress: merchant.walletAddress,
        email: merchant.email,
        name: merchant.name,
        businessName: merchant.businessName,
        profileCompleted: merchant.profileCompleted,
      },
    });
  } catch (error) {
    logger.error("Error updating merchant profile:", error);

    // Handle unique constraint errors
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        error: "Email already in use by another merchant",
      });
    }

    next(error);
  }
}

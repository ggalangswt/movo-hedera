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

    let merchant = await prisma.merchant.findFirst({
      where: {
        walletAddress: {
          equals: walletAddress,
          mode: "insensitive",
        },
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

    // If merchant doesn't exist, create a new one
    if (!merchant) {
      logger.info(`Creating new merchant for wallet: ${walletAddress}`);
      merchant = await prisma.merchant.create({
        data: {
          walletAddress,
          email: `merchant-${walletAddress.slice(2, 8)}@movo.xyz`,
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
    }

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

    // Find merchant
    let merchant = await prisma.merchant.findFirst({
      where: {
        walletAddress: {
          equals: walletAddress,
          mode: "insensitive",
        },
      },
    });

    if (!merchant) {
      // Create new merchant if doesn't exist
      merchant = await prisma.merchant.create({
        data: {
          walletAddress,
          email: email || `merchant-${walletAddress.slice(2, 8)}@movo.xyz`,
          name,
          businessName,
          profileCompleted: !!(email && name && businessName),
        },
      });
    } else {
      // Update existing merchant
      merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          ...(email && { email }),
          ...(name !== undefined && { name }),
          ...(businessName !== undefined && { businessName }),
          // Mark profile as completed if all required fields are filled
          profileCompleted: !!(
            (email || merchant.email) &&
            (name !== undefined ? name : merchant.name) &&
            (businessName !== undefined ? businessName : merchant.businessName)
          ),
        },
      });
    }

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

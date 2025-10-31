/**
 * Migration script to normalize wallet addresses to lowercase
 * Run this once after deploying the optimization changes
 */

import prisma from "../src/utils/prisma.js";
import { logger } from "../src/utils/logger.js";

async function migrateWalletAddresses() {
  try {
    logger.info("Starting wallet address normalization...");

    // Get all merchants
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        walletAddress: true,
      },
    });

    logger.info(`Found ${merchants.length} merchants to update`);

    let updated = 0;
    for (const merchant of merchants) {
      const lowerAddress = merchant.walletAddress.toLowerCase();

      if (merchant.walletAddress !== lowerAddress) {
        // Check if lowercase version already exists
        const existing = await prisma.merchant.findUnique({
          where: { walletAddress: lowerAddress },
        });

        if (existing && existing.id !== merchant.id) {
          logger.warn(
            `Duplicate found for ${merchant.walletAddress} - keeping older record`
          );
          // Delete the newer duplicate
          await prisma.merchant.delete({
            where: { id: merchant.id },
          });
        } else {
          // Safe to update
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { walletAddress: lowerAddress },
          });
          updated++;
        }
      }
    }

    logger.info(`✅ Migration complete! Updated ${updated} wallet addresses`);

    // Verify
    const afterCount = await prisma.merchant.count();
    logger.info(`Total merchants after migration: ${afterCount}`);
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateWalletAddresses()
  .then(() => {
    console.log("✅ Migration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default merchant
  const merchant = await prisma.merchant.upsert({
    where: { id: 'default-merchant-id' },
    update: {},
    create: {
      id: 'default-merchant-id',
      email: 'merchant@movo.xyz',
      walletAddress: process.env.MERCHANT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
      businessName: 'Movo Merchant',
    },
  });

  console.log('✅ Default merchant created:', merchant);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


/**
 * x402 Facilitator Service
 * Handles USDC payments on Base Sepolia with EIP-3009 transferWithAuthorization
 */

import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger.js";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// USDC EIP-3009 ABI
const USDC_ABI = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function balanceOf(address account) view returns (uint256)",
]);

let walletClient;
let publicClient;
let account;

/**
 * Initialize facilitator wallet and clients
 */
export function initializeFacilitator() {
  try {
    account = privateKeyToAccount(
      process.env.FACILITATOR_PRIVATE_KEY || process.env.PRIVATE_KEY
    );

    walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    logger.info("✅ Facilitator initialized");
    logger.info(`📍 Facilitator Wallet: ${account.address}`);
    logger.info(`💰 USDC Address: ${USDC_ADDRESS}`);
  } catch (error) {
    logger.error("❌ Failed to initialize facilitator:", error);
    throw error;
  }
}

/**
 * Get facilitator info
 */
export function getFacilitatorInfo() {
  if (!account) {
    throw new Error("Facilitator not initialized");
  }

  return {
    status: "ok",
    network: "base-sepolia",
    wallet: account.address,
    usdcAddress: USDC_ADDRESS,
  };
}

/**
 * Process payment with EIP-3009 transferWithAuthorization
 */
export async function processPayment(paymentData) {
  if (!walletClient || !publicClient) {
    throw new Error("Facilitator not initialized");
  }

  const { payment } = paymentData;

  if (!payment) {
    throw new Error("Payment data required");
  }

  logger.info("📨 Processing payment");
  logger.info(`From: ${payment.from}`);
  logger.info(`To: ${payment.to}`);
  logger.info(`Amount: ${payment.value}`);

  // Extract signature components
  const signature = payment.signature;
  const r = `0x${signature.slice(2, 66)}`;
  const s = `0x${signature.slice(66, 130)}`;
  const v = parseInt(signature.slice(130, 132), 16);

  logger.info("🔐 Processing transferWithAuthorization...");

  // Call transferWithAuthorization on USDC contract
  const txHash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "transferWithAuthorization",
    args: [
      payment.from,
      payment.to,
      BigInt(payment.value),
      BigInt(payment.validAfter || 0),
      BigInt(payment.validBefore),
      payment.nonce,
      v,
      r,
      s,
    ],
  });

  logger.info(`✅ Transaction sent: ${txHash}`);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  logger.info(`✅ Confirmed in block: ${receipt.blockNumber}`);

  return {
    success: true,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
  };
}

import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger.js";

// InvoicePayment Contract ABI (full ABI from deployed contract)
const INVOICE_PAYMENT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_usdcAddress", type: "address" },
      { internalType: "address", name: "_midrAddress", type: "address" },
      { internalType: "address", name: "_backendAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "invoiceId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountUSDC",
        type: "uint256",
      },
    ],
    name: "InvoiceCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "invoiceId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "payer",
        type: "address",
      },
    ],
    name: "InvoicePaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "invoiceId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountMIDR",
        type: "uint256",
      },
    ],
    name: "InvoiceSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "MIDR_ADDRESS",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIDR_DECIMALS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "USDC_ADDRESS",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "USDC_DECIMALS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "USDC_TO_MIDR_RATE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "backendAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amountUSDC", type: "uint256" }],
    name: "calculateMIDRAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_invoiceId", type: "string" }],
    name: "checkInvoiceExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amountIDR", type: "uint256" }],
    name: "convertIDRToUSDC",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amountUSDC", type: "uint256" }],
    name: "convertUSDCToIDR",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_merchant", type: "address" },
      { internalType: "uint256", name: "_amountUSDC", type: "uint256" },
      { internalType: "string", name: "_invoiceId", type: "string" },
    ],
    name: "createInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "depositMIDR",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractStats",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getExchangeRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_invoiceId", type: "string" }],
    name: "getInvoice",
    outputs: [
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint256", name: "amountUSDC", type: "uint256" },
      { internalType: "bool", name: "paid", type: "bool" },
      { internalType: "bool", name: "settled", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "paidAt", type: "uint256" },
      { internalType: "uint256", name: "settledAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMIDRLiquidity",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_merchant", type: "address" }],
    name: "getMerchantInvoiceCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_merchant", type: "address" }],
    name: "getMerchantInvoices",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUSDCBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "invoices",
    outputs: [
      { internalType: "address", name: "merchant", type: "address" },
      { internalType: "uint256", name: "amountUSDC", type: "uint256" },
      { internalType: "bool", name: "paid", type: "bool" },
      { internalType: "bool", name: "settled", type: "bool" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "paidAt", type: "uint256" },
      { internalType: "uint256", name: "settledAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_invoiceId", type: "string" }],
    name: "isInvoicePaid",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_invoiceId", type: "string" }],
    name: "isInvoiceSettled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_invoiceId", type: "string" },
      { internalType: "address", name: "_payer", type: "address" },
    ],
    name: "markAsPaid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "merchantInvoices",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_invoiceId", type: "string" },
      { internalType: "address", name: "_payer", type: "address" },
      { internalType: "uint256", name: "_usdcAmount", type: "uint256" },
    ],
    name: "processX402Payment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_newBackendAddress", type: "address" },
    ],
    name: "setBackendAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_invoiceId", type: "string" }],
    name: "settleInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_amountUSDC", type: "uint256" },
      { internalType: "uint256", name: "_amountMIDR", type: "uint256" },
    ],
    name: "simulateUSDCToMIDRSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalInvoices",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPaidInvoices",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSettledInvoices",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "withdrawMIDR",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "withdrawUSDC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// USDC Contract ABI (for approvals)
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Setup clients - will be initialized lazily
let walletClient;
let publicClient;
let account;

function initializeWalletClients() {
  if (walletClient && publicClient && account) {
    return; // Already initialized
  }

  // Validate private key
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set in environment variables");
  }

  // Remove 0x prefix if exists, then add it back
  const privateKey = process.env.PRIVATE_KEY.replace(/^0x/, "");

  // Validate private key format (must be 64 hex characters)
  if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      `Invalid PRIVATE_KEY format. Expected 64 hex characters, got: ${privateKey.length} characters`
    );
  }

  account = privateKeyToAccount(`0x${privateKey}`);

  logger.info(`Wallet initialized: ${account.address}`);

  walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL),
  });

  publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_SEPOLIA_RPC_URL),
  });
}

/**
 * Check if invoice exists on smart contract
 */
export async function checkInvoiceExists(invoiceNo) {
  try {
    initializeWalletClients();
    const contractAddress = process.env.CONTRACT_ADDRESS;

    const exists = await publicClient.readContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "checkInvoiceExists",
      args: [invoiceNo],
    });

    return exists;
  } catch (error) {
    logger.error(
      `Error checking invoice ${invoiceNo} on smart contract:`,
      error
    );
    return false;
  }
}

/**
 * Register invoice on smart contract
 */
export async function registerInvoiceOnchain(
  invoiceNo,
  merchantAddress,
  usdcAmount
) {
  try {
    initializeWalletClients();
    logger.info(`Registering invoice on smart contract: ${invoiceNo}`);
    logger.info(`Merchant: ${merchantAddress}, Amount: ${usdcAmount} USDC`);

    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Convert USDC amount to smallest unit (6 decimals)
    const usdcAmountInSmallestUnit = parseUnits(usdcAmount.toString(), 6);

    logger.info(`USDC amount in smallest unit: ${usdcAmountInSmallestUnit}`);

    // Call createInvoice on smart contract
    logger.info("Calling createInvoice on smart contract...");
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "createInvoice",
      args: [merchantAddress, usdcAmountInSmallestUnit, invoiceNo],
    });

    logger.info(`Transaction hash: ${txHash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    logger.info(`Transaction confirmed in block: ${receipt.blockNumber}`);
    //
    return {
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    };
  } catch (error) {
    logger.error("Error registering invoice onchain:", error);
    throw error;
  }
}

/**
 * Process x402 payment onchain: USDC -> mIDR swap
 */
export async function processX402PaymentOnchain(
  invoiceId,
  payerAddress,
  usdcAmount
) {
  try {
    initializeWalletClients();
    logger.info(`Processing x402 payment onchain for invoice: ${invoiceId}`);
    logger.info(`Payer: ${payerAddress}, Amount: ${usdcAmount} USDC`);

    const contractAddress = process.env.CONTRACT_ADDRESS;
    const usdcAddress = process.env.USDC_TOKEN_ADDRESS;

    // Check if invoice exists on smart contract
    const invoiceExists = await checkInvoiceExists(invoiceId);
    if (!invoiceExists) {
      logger.error(`Invoice ${invoiceId} does not exist on smart contract`);
      throw new Error(
        `Invoice ${invoiceId} must be registered on smart contract before payment`
      );
    }

    // Convert USDC amount to smallest unit (6 decimals)
    const usdcAmountInSmallestUnit = parseUnits(usdcAmount.toString(), 6);

    logger.info(`USDC amount in smallest unit: ${usdcAmountInSmallestUnit}`);

    // Step 1: Check backend USDC balance
    const backendBalance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });

    logger.info(`Backend USDC balance: ${backendBalance}`);

    if (backendBalance < usdcAmountInSmallestUnit) {
      throw new Error(
        `Insufficient USDC balance. Have: ${backendBalance}, Need: ${usdcAmountInSmallestUnit}`
      );
    }

    // Step 2: Check current allowance
    logger.info("Checking current USDC allowance...");
    const currentAllowance = await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account.address, contractAddress],
    });

    logger.info(`Current allowance: ${currentAllowance}`);

    // Step 3: Only approve if allowance is insufficient
    if (currentAllowance < usdcAmountInSmallestUnit) {
      logger.info(
        "Insufficient allowance, approving contract to spend USDC..."
      );

      // If there's existing allowance, reset to 0 first (some tokens require this)
      if (currentAllowance > 0n) {
        logger.info("Resetting existing allowance to 0...");
        const resetTx = await walletClient.writeContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [contractAddress, 0n],
        });
        await publicClient.waitForTransactionReceipt({ hash: resetTx });
        logger.info("Allowance reset confirmed");
      }

      // Approve the required amount
      const approveTx = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, usdcAmountInSmallestUnit],
      });

      logger.info(`Approval tx hash: ${approveTx}`);

      // Wait for approval confirmation
      const approvalReceipt = await publicClient.waitForTransactionReceipt({
        hash: approveTx,
        confirmations: 1, // Wait for 1 confirmation
      });
      logger.info(
        `USDC approval confirmed in block: ${approvalReceipt.blockNumber}`
      );

      // Add small delay to ensure blockchain state is updated
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      logger.info("Sufficient allowance already exists, skipping approval");
    }

    // Step 4: Call processX402Payment on smart contract
    logger.info("Calling processX402Payment on smart contract...");
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "processX402Payment",
      args: [invoiceId, payerAddress, usdcAmountInSmallestUnit],
    });

    logger.info(`Transaction hash: ${txHash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });
    logger.info(`Transaction confirmed in block: ${receipt.blockNumber}`);

    // Calculate mIDR amount (fixed rate: 1 USDC = 16,600 mIDR)
    const midrAmount = parseFloat(usdcAmount) * 16600;

    return {
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      usdcAmount: parseFloat(usdcAmount),
      midrAmount,
      status: "settled",
    };
  } catch (error) {
    logger.error("Error processing x402 payment onchain:", error);
    throw error;
  }
}

/**
 * Get invoice status from smart contract
 */
export async function getInvoiceStatus(invoiceId) {
  try {
    initializeWalletClients();
    const contractAddress = process.env.CONTRACT_ADDRESS;

    const [merchant, amountUSDC, paid, settled, createdAt, paidAt, settledAt] =
      await publicClient.readContract({
        address: contractAddress,
        abi: INVOICE_PAYMENT_ABI,
        functionName: "getInvoice",
        args: [invoiceId],
      });

    return {
      merchant,
      amountUSDC: amountUSDC.toString(),
      paid,
      settled,
      createdAt: createdAt.toString(),
      paidAt: paidAt.toString(),
      settledAt: settledAt.toString(),
    };
  } catch (error) {
    logger.error(`Error getting invoice status for ${invoiceId}:`, error);
    throw error;
  }
}

/**
 * Check contract liquidity
 */
export async function checkContractLiquidity() {
  try {
    initializeWalletClients();
    const contractAddress = process.env.CONTRACT_ADDRESS;

    const midrLiquidity = await publicClient.readContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "getMIDRLiquidity",
    });

    const usdcBalance = await publicClient.readContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "getUSDCBalance",
    });

    // Convert from smallest units
    const midrAmount = Number(midrLiquidity) / 100; // mIDR has 2 decimals
    const usdcAmount = Number(usdcBalance) / 1000000; // USDC has 6 decimals

    logger.info(
      `Contract liquidity - mIDR: ${midrAmount}, USDC: ${usdcAmount}`
    );

    return {
      midrLiquidity: midrAmount,
      usdcBalance: usdcAmount,
      canProcessPayments: midrAmount > 0,
    };
  } catch (error) {
    logger.error("Error checking contract liquidity:", error);
    throw error;
  }
}

/**
 * Verify invoice is paid onchain
 */
export async function verifyInvoicePaidOnchain(invoiceId) {
  try {
    initializeWalletClients();
    const contractAddress = process.env.CONTRACT_ADDRESS;

    const isPaid = await publicClient.readContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "isInvoicePaid",
      args: [invoiceId],
    });

    const isSettled = await publicClient.readContract({
      address: contractAddress,
      abi: INVOICE_PAYMENT_ABI,
      functionName: "isInvoiceSettled",
      args: [invoiceId],
    });

    return {
      isPaid,
      isSettled,
    };
  } catch (error) {
    logger.error(`Error verifying invoice ${invoiceId} onchain:`, error);
    return {
      isPaid: false,
      isSettled: false,
    };
  }
}

/**
 * Custom x402 Payment Implementation
 * Directly uses OUR facilitator (no limits!)
 */

import { WalletClient } from "viem";
import { defineChain } from "viem";

// Define Hedera Testnet chain
const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_HEDERA_RPC_URL ||
          "https://296.rpc.thirdweb.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Hashscan",
      url: "https://hashscan.io/testnet",
    },
  },
});

export interface PaymentDetails {
  x402Version: number;
  error: string;
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    asset: string;
    payTo: string;
    resource: string;
    description: string;
    mimeType: string;
    maxTimeoutSeconds: number;
    facilitator?: string;
    metadata?: any;
  }>;
}

export async function processX402Payment(
  walletClient: WalletClient,
  paymentEndpoint: string,
  facilitatorUrl: string = process.env.FACILITATOR_URL ||
    "http://localhost:4000/api/facilitator"
) {
  // Step 1: Get 402 payment details
  console.log("📡 Step 1: Getting payment details from", paymentEndpoint);

  const detailsResponse = await fetch(paymentEndpoint);
  const paymentDetails: PaymentDetails = await detailsResponse.json();

  if (detailsResponse.status !== 402) {
    throw new Error("Expected 402 Payment Required response");
  }

  const acceptData = paymentDetails.accepts[0];
  const useFacilitator = acceptData.facilitator || facilitatorUrl;

  console.log("✅ Got 402 response");
  console.log("🏦 Using facilitator:", useFacilitator);
  console.log("💰 Amount required:", acceptData.maxAmountRequired);

  // Step 2: Create EIP-3009 signature
  console.log("📝 Step 2: Creating payment signature...");

  const address = walletClient.account?.address;
  if (!address) {
    throw new Error("Wallet not connected");
  }

  // Generate random nonce
  const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  // EIP-3009 domain for USDC Hedera Testnet
  // Must match exact parameters from USDC contract
  const domain = {
    name: "USDC",
    version: "2",
    chainId: hederaTestnet.id,
    verifyingContract: acceptData.asset as `0x${string}`,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    from: address,
    to: acceptData.payTo as `0x${string}`,
    value: BigInt(acceptData.maxAmountRequired),
    validAfter: BigInt(validAfter),
    validBefore: BigInt(validBefore),
    nonce: nonce as `0x${string}`,
  };

  const signature = await walletClient.signTypedData({
    account: address,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  console.log("✅ Signature created");

  // Step 3: Send to facilitator
  console.log("📤 Step 3: Sending to facilitator...");

  const facilitatorResponse = await fetch(`${useFacilitator}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment: {
        from: address,
        to: acceptData.payTo,
        value: acceptData.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
        signature,
      },
    }),
  });

  if (!facilitatorResponse.ok) {
    const error = await facilitatorResponse.json();
    throw new Error(error.error || "Facilitator processing failed");
  }

  const facilitatorResult = await facilitatorResponse.json();
  console.log("✅ Facilitator processed payment:", facilitatorResult.txHash);

  // Step 4: Notify backend with X-PAYMENT header
  console.log("📤 Step 4: Notifying backend...");

  const paymentHeader = btoa(
    JSON.stringify({
      signature,
      txHash: facilitatorResult.txHash,
      from: address,
      amount: acceptData.maxAmountRequired,
    })
  );

  const finalResponse = await fetch(paymentEndpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-PAYMENT": paymentHeader,
    },
  });

  if (!finalResponse.ok) {
    const error = await finalResponse.json();
    throw new Error(error.error || "Backend confirmation failed");
  }

  const finalResult = await finalResponse.json();
  console.log("✅ Payment confirmed by backend!");

  return {
    success: true,
    txHash: facilitatorResult.txHash,
    result: finalResult,
  };
}

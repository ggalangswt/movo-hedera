/**
 * Simple x402 Facilitator for Movo
 * Handles USDC payments on Base Sepolia with NO amount limits
 */

import 'dotenv/config';
import express from 'express';
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const app = express();

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

const PORT = process.env.PORT || 3402;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Initialize wallet
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org')
});

// USDC EIP-3009 ABI
const USDC_ABI = parseAbi([
  'function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external',
  'function balanceOf(address account) view returns (uint256)'
]);

console.log('🚀 Simple x402 Facilitator Starting...');
console.log(`📍 Facilitator Wallet: ${account.address}`);
console.log(`🌐 Network: Base Sepolia`);
console.log(`💰 USDC Address: ${USDC_ADDRESS}`);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    network: 'base-sepolia',
    wallet: account.address,
    usdcAddress: USDC_ADDRESS
  });
});

// Process payment
app.post('/process', async (req, res) => {
  try {
    console.log('\n📨 Payment request received');
    
    const { payment } = req.body;
    
    if (!payment) {
      return res.status(400).json({ error: 'Payment data required' });
    }

    console.log(`From: ${payment.from}`);
    console.log(`To: ${payment.to}`);
    console.log(`Amount: ${payment.value}`);
    
    // Extract signature components
    const signature = payment.signature;
    const r = `0x${signature.slice(2, 66)}`;
    const s = `0x${signature.slice(66, 130)}`;
    const v = parseInt(signature.slice(130, 132), 16);

    console.log('🔐 Processing transferWithAuthorization...');
    
    // Call transferWithAuthorization on USDC contract
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'transferWithAuthorization',
      args: [
        payment.from,
        payment.to,
        BigInt(payment.value),
        BigInt(payment.validAfter || 0),
        BigInt(payment.validBefore),
        payment.nonce,
        v,
        r,
        s
      ]
    });

    console.log(`✅ Transaction sent: ${txHash}`);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);

    res.json({
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString()
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Facilitator running on http://localhost:${PORT}`);
  console.log(`💡 No amount limits!`);
  console.log(`\nReady to process payments...\n`);
});


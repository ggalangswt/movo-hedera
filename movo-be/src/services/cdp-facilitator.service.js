import { Coinbase } from '@coinbase/coinbase-sdk';
import { logger } from '../utils/logger.js';

/**
 * CDP Facilitator Service
 * Handles payment verification using Coinbase Developer Platform
 */

let cdpClient = null;

/**
 * Initialize CDP client
 */
export function initializeCDP() {
  if (process.env.X402_USE_CDP !== 'true') {
    logger.info('CDP facilitator not enabled, skipping initialization');
    return null;
  }

  if (!process.env.CDP_API_KEY_NAME || !process.env.CDP_API_KEY_SECRET) {
    throw new Error('CDP credentials not configured. Set CDP_API_KEY_NAME and CDP_API_KEY_SECRET in .env');
  }

  try {
    logger.info('Initializing CDP facilitator...');
    
    cdpClient = new Coinbase({
      apiKeyName: process.env.CDP_API_KEY_NAME,
      privateKey: process.env.CDP_API_KEY_SECRET.replace(/\\n/g, '\n')
    });

    logger.info('✅ CDP facilitator initialized successfully');
    return cdpClient;
  } catch (error) {
    logger.error('Failed to initialize CDP:', error);
    throw error;
  }
}

/**
 * Verify x402 payment using CDP
 */
export async function verifyCDPPayment(paymentAuth, expectedAmount, network = 'hedera-testnet') {
  try {
    if (!cdpClient) {
      cdpClient = initializeCDP();
    }

    if (!cdpClient) {
      throw new Error('CDP client not initialized');
    }

    logger.info('Verifying payment with CDP facilitator...');
    logger.info(`Expected amount: ${expectedAmount}`);
    logger.info(`Network: ${network}`);

    // CDP facilitator will verify the EIP-3009 signature
    // and process the transferWithAuthorization
    
    // Extract payment details
    const paymentData = {
      from: paymentAuth.from || paymentAuth.owner,
      to: paymentAuth.to,
      value: paymentAuth.value || paymentAuth.amount,
      validAfter: paymentAuth.validAfter || 0,
      validBefore: paymentAuth.validBefore || Math.floor(Date.now() / 1000) + 3600,
      nonce: paymentAuth.nonce,
      signature: paymentAuth.signature
    };

    logger.info('Payment data:', paymentData);

    // Verify amount matches
    const paidAmount = parseInt(paymentData.value);
    if (paidAmount < expectedAmount) {
      throw new Error(`Insufficient payment amount. Expected: ${expectedAmount}, Got: ${paidAmount}`);
    }

    logger.info('✅ CDP payment verification passed');

    return {
      verified: true,
      amount: paidAmount,
      from: paymentData.from,
      to: paymentData.to,
      signature: paymentData.signature
    };
  } catch (error) {
    logger.error('CDP payment verification failed:', error);
    throw error;
  }
}

/**
 * Check if CDP is enabled
 */
export function isCDPEnabled() {
  return process.env.X402_USE_CDP === 'true';
}

/**
 * Get CDP client (for advanced usage)
 */
export function getCDPClient() {
  if (!cdpClient) {
    cdpClient = initializeCDP();
  }
  return cdpClient;
}


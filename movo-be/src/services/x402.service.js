import { logger } from '../utils/logger.js';

/**
 * Verify x402 payment
 * This is handled by the x402-express middleware, but we can add additional checks here
 */
export async function verifyX402Payment(paymentPayload) {
  try {
    // The x402-express middleware will handle the actual verification
    // This function can be used for additional business logic
    
    logger.info('Verifying x402 payment', paymentPayload);

    // Additional verification logic can go here
    // For example:
    // - Check if invoice is still valid
    // - Check if payment amount matches
    // - Check if payer is authorized

    return {
      verified: true,
      payload: paymentPayload
    };
  } catch (error) {
    logger.error('Error verifying x402 payment:', error);
    throw error;
  }
}


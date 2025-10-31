// Currency conversion utilities

// Mock conversion rates for hackathon
const CONVERSION_RATES = {
  IDR: 16600, // 1 USDC = 16,600 IDR
  USD: 1,     // 1 USDC = 1 USD
  EUR: 0.92,  // 1 USDC = 0.92 EUR
  SGD: 1.35,  // 1 USDC = 1.35 SGD
};

/**
 * Convert fiat amount to USDC
 */
export function convertToUSDC(amount, currency) {
  const rate = CONVERSION_RATES[currency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const usdcAmount = parseFloat(amount) / rate;

  return {
    usdcAmount: parseFloat(usdcAmount.toFixed(6)),
    conversionRate: rate,
    originalAmount: amount,
    originalCurrency: currency
  };
}

/**
 * Convert USDC to fiat
 */
export function convertFromUSDC(usdcAmount, currency) {
  const rate = CONVERSION_RATES[currency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const fiatAmount = parseFloat(usdcAmount) * rate;

  return {
    fiatAmount: parseFloat(fiatAmount.toFixed(2)),
    conversionRate: rate,
    usdcAmount,
    currency
  };
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies() {
  return Object.keys(CONVERSION_RATES);
}


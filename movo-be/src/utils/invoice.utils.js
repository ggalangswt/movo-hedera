/**
 * Generate unique invoice number
 * Format: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 5-digit number
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  
  return `INV-${year}${month}${day}-${random}`;
}


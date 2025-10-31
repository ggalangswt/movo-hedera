import { z } from 'zod';

// Invoice creation validation schema
const invoiceSchema = z.object({
  merchantId: z.string().optional(),
  customerEmail: z.string().email('Invalid email format'),
  customerName: z.string().min(1, 'Customer name is required'),
  productName: z.string().min(1, 'Product/service name is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['IDR', 'USD', 'EUR', 'SGD'], {
    errorMap: () => ({ message: 'Invalid currency' })
  }),
  expiresInDays: z.number().int().positive().optional()
});

/**
 * Validate invoice creation request
 */
export function validateInvoiceCreation(req, res, next) {
  try {
    // Convert amount to number if it's a string
    if (typeof req.body.amount === 'string') {
      req.body.amount = parseFloat(req.body.amount);
    }

    invoiceSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
}


import express from 'express';
import {
  createInvoice,
  getInvoice,
  getInvoices,
  sendInvoiceEmail,
} from '../controllers/invoice.controller.js';
import { validateInvoiceCreation } from '../middleware/validation.middleware.js';

const router = express.Router();

// Create new invoice
router.post('/', validateInvoiceCreation, createInvoice);

// Get all invoices for merchant
router.get('/', getInvoices);

// Get specific invoice
router.get('/:invoiceId', getInvoice);

// Send invoice via email
router.post('/:invoiceId/send', sendInvoiceEmail);

export default router;


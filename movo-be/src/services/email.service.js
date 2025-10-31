import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../utils/logger.js';

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.EMAIL_API_KEY
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'resend') {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.EMAIL_API_KEY
      }
    });
  } else {
    // Gmail or custom SMTP
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

/**
 * Load and compile email template
 */
const getEmailTemplate = (templateName) => {
  const templatePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  return Handlebars.compile(templateSource);
};

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmailService(invoice) {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate('invoice-email');

    // Payment URL
    const paymentUrl = `${process.env.FRONTEND_URL}/invoice/${invoice.id}`;

    // Compile template with invoice data
    const htmlContent = template({
      customerName: invoice.customerName,
      invoiceNo: invoice.invoiceNo,
      productName: invoice.productName,
      description: invoice.description,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      usdcAmount: invoice.usdcAmount.toString(),
      expiresAt: new Date(invoice.expiresAt).toLocaleDateString(),
      paymentUrl,
      merchantName: invoice.merchant?.businessName || 'Movo Merchant',
      year: new Date().getFullYear()
    });

    // Email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: invoice.customerEmail,
      subject: `Invoice ${invoice.invoiceNo} - Payment Required`,
      html: htmlContent
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Invoice email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending invoice email:', error);
    throw error;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(invoice, paymentDetails) {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate('payment-confirmation');

    const htmlContent = template({
      customerName: invoice.customerName,
      invoiceNo: invoice.invoiceNo,
      productName: invoice.productName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      usdcAmount: paymentDetails.usdcAmount.toString(),
      transactionHash: paymentDetails.transactionHash,
      paidAt: new Date(paymentDetails.paidAt).toLocaleString(),
      merchantName: invoice.merchant?.businessName || 'Movo Merchant',
      year: new Date().getFullYear()
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: invoice.customerEmail,
      subject: `Payment Confirmed - Invoice ${invoice.invoiceNo}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Payment confirmation email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending payment confirmation email:', error);
    throw error;
  }
}


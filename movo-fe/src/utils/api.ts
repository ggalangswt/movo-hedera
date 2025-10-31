/**
 * API utility functions for Movo Frontend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  description?: string;
  amount: string;
  currency: string;
  usdcAmount: string;
  conversionRate?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  paidAmount?: string;
  paymentHash?: string;
  merchant?: {
    businessName: string;
    email: string;
    walletAddress: string;
  };
  paymentDetails?: any[];
}

export interface CreateInvoiceData {
  merchantId?: string;
  walletAddress?: string;
  customerEmail: string;
  customerName: string;
  productName: string;
  description?: string;
  amount: number;
  currency: string;
  expiresInDays?: number;
}

export interface MerchantProfile {
  id: string;
  walletAddress: string;
  email: string;
  name?: string;
  businessName?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMerchantProfileData {
  email?: string;
  name?: string;
  businessName?: string;
}

/**
 * Fetch all invoices for a merchant
 */
export async function fetchInvoices(
  walletAddress?: string, 
  merchantId?: string, 
  status?: string
): Promise<Invoice[]> {
  try {
    const params = new URLSearchParams();
    if (walletAddress) params.append('walletAddress', walletAddress);
    if (merchantId) params.append('merchantId', merchantId);
    if (status) params.append('status', status);
    
    const url = `${API_BASE_URL}/invoices${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

/**
 * Fetch single invoice by ID
 */
export async function fetchInvoice(invoiceId: string): Promise<Invoice> {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoice: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

/**
 * Create new invoice
 */
export async function createInvoice(data: CreateInvoiceData): Promise<Invoice> {
  try {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invoice');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Map backend status to frontend status
 */
export function mapInvoiceStatus(backendStatus: string): 'prepared' | 'paid' | 'expired' | 'overpaid' {
  const statusMap: Record<string, 'prepared' | 'paid' | 'expired' | 'overpaid'> = {
    'PREPARED': 'prepared',
    'SENT': 'prepared',
    'PAID': 'paid',
    'SETTLED': 'paid',
    'EXPIRED': 'expired',
    'OVERPAID': 'overpaid',
  };
  
  return statusMap[backendStatus.toUpperCase()] || 'prepared';
}

/**
 * Get merchant profile by wallet address
 */
export async function getMerchantProfile(walletAddress: string): Promise<MerchantProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/merchants/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch merchant profile: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching merchant profile:', error);
    throw error;
  }
}

/**
 * Update merchant profile
 */
export async function updateMerchantProfile(
  walletAddress: string,
  data: UpdateMerchantProfileData
): Promise<MerchantProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/merchants/${walletAddress}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update merchant profile');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating merchant profile:', error);
    throw error;
  }
}


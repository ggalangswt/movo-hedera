"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getMerchantProfile, type MerchantProfile } from "@/utils/api";
import { FaStickyNote } from "react-icons/fa";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface InvoiceData {
  customerEmail: string;
  customerName: string;
  productName: string;
  description: string;
  amount: string;
  currency: string;
  referenceKey: string;
  referenceValue: string;
}

interface CustomReference {
  key: string;
  value: string;
}

interface PreviewInvoiceProps {
  invoiceData: InvoiceData;
  customReferences: CustomReference[];
  onBack: () => void;
  onCreate: () => void;
}

export default function PreviewInvoice({
  invoiceData,
  customReferences,
  onBack,
  onCreate,
}: PreviewInvoiceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merchantProfile, setMerchantProfile] =
    useState<MerchantProfile | null>(null);
  const { address, isConnected } = useAccount();

  // Load merchant profile
  useEffect(() => {
    if (address) {
      getMerchantProfile(address).then(setMerchantProfile).catch(console.error);
    }
  }, [address]);

  const handleCreateInvoice = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address, // Use connected wallet as merchant
          customerEmail: invoiceData.customerEmail,
          customerName: invoiceData.customerName,
          productName: invoiceData.productName,
          description: invoiceData.description,
          amount: parseFloat(invoiceData.amount),
          currency: invoiceData.currency,
          expiresInDays: 7,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create invoice");
      }

      // Success! Call original onCreate to close and refresh
      onCreate();
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      setError(err.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: string, currency: string) => {
    if (!amount) return "0";

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return amount;

    switch (currency) {
      case "IDR":
        return `Rp. ${numAmount.toLocaleString("id-ID")}`;
      case "USD":
        return `$${numAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}`;
      case "USDT":
        return `${numAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })} USDT`;
      default:
        return `${numAmount.toLocaleString()} ${currency}`;
    }
  };

  const calculateUSDC = () => {
    const amount = parseFloat(invoiceData.amount);
    if (isNaN(amount)) return "0.00";

    // Mock conversion rates (1 USDC = X local currency)
    const rates: Record<string, number> = {
      IDR: 16600,
      USD: 1,
      EUR: 0.92,
      SGD: 1.35,
    };

    const rate = rates[invoiceData.currency] || 1;
    return (amount / rate).toFixed(6);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 disabled:opacity-50">
          ← Back to Edit
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold mb-1">Invoice Preview</h2>
              <p className="text-blue-100">Review before creating</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Invoice Number</div>
              <div className="text-lg font-bold">Will be generated</div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Merchant Info */}
          {merchantProfile && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">From:</h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-lg font-bold text-gray-900">
                  {merchantProfile.businessName || "Business Name Not Set"}
                </div>
                {merchantProfile.name && (
                  <div className="text-gray-700 mt-1">
                    Attn: {merchantProfile.name}
                  </div>
                )}
                <div className="text-gray-600 mt-1">
                  {merchantProfile.email}
                </div>
                {merchantProfile.walletAddress && (
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    {merchantProfile.walletAddress}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Bill To:</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900">
                {invoiceData.customerName}
              </div>
              <div className="text-gray-600">{invoiceData.customerEmail}</div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Product/Service:</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Product Name:</div>
                <div className="text-lg font-bold text-gray-900">
                  {invoiceData.productName}
                </div>
              </div>
              {invoiceData.description && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Description:</div>
                  <div className="text-gray-900">{invoiceData.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-gray-900">Amount:</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Total Amount</div>
                <div className="text-4xl font-bold text-gray-900 mb-3">
                  {formatCurrency(invoiceData.amount, invoiceData.currency)}
                </div>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">≈</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {calculateUSDC()} USDC
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Rate: 1 USDC ={" "}
                  {invoiceData.currency === "IDR" ? "16,600" : "1"}{" "}
                  {invoiceData.currency}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">
                Payment Currency:
              </div>
              <div className="text-lg font-bold text-gray-900">USDC</div>
              <div className="text-sm text-gray-500">USDC - Circle</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                Settlement Currency:
              </div>
              <div className="text-lg font-bold text-gray-900">IDR</div>
              <div className="text-sm text-gray-500">
                You'll receive in IDR (Rupiah)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Expires In:</div>
              <div className="text-lg font-bold text-gray-900">7 days</div>
              <div className="text-sm text-gray-500">From creation date</div>
            </div>
          </div>

          {/* Custom References */}
          {customReferences.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏷️</span>
                <h3 className="font-semibold text-gray-900">
                  Custom References
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customReferences.map((ref, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">{ref.key}:</div>
                    <div className="text-sm font-medium text-gray-900">
                      {ref.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Flow Info */}
        <div className="bg-blue-50 border-t border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-gray-900">Payment Flow:</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">1.</span>
              <span>Customer receives email with payment link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">2.</span>
              <span>
                Customer connects wallet and pays {calculateUSDC()} USDC
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">3.</span>
              <span>USDC automatically swapped to mIDR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">4.</span>
              <span>
                You receive ≈{" "}
                {formatCurrency(invoiceData.amount, invoiceData.currency)} in
                mIDR
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mx-6 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-yellow-800 flex gap-2">
            <FaStickyNote className="mt-0.5" />{" "}
            <strong>Automatic Email:</strong> Invoice will be automatically sent
            to customer's email after creation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            ← Back to Edit
          </button>
          <button
            onClick={handleCreateInvoice}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Creating & Sending...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Create & Send Invoice →
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

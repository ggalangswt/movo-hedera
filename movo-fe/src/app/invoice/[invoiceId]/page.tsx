"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { fetchInvoice, formatDate, type Invoice } from "@/utils/api";
import { processX402Payment } from "@/utils/x402-payment";
import { IoCash } from "react-icons/io5";
import Image from "next/image";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const invoiceId = params.invoiceId as string;

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      console.error("Failed to load invoice:", err);
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; bgColor: string }
    > = {
      PREPARED: {
        label: "Prepared",
        color: "text-gray-700",
        bgColor: "bg-gray-100",
      },
      SENT: { label: "Sent", color: "text-blue-700", bgColor: "bg-blue-100" },
      PENDING_PAYMENT: {
        label: "Pending",
        color: "text-yellow-700",
        bgColor: "bg-yellow-100",
      },
      PAID: { label: "Paid", color: "text-green-700", bgColor: "bg-green-100" },
      SETTLED: {
        label: "Settled",
        color: "text-green-700",
        bgColor: "bg-green-100",
      },
      EXPIRED: {
        label: "Expired",
        color: "text-red-700",
        bgColor: "bg-red-100",
      },
      CANCELLED: {
        label: "Cancelled",
        color: "text-red-700",
        bgColor: "bg-red-100",
      },
    };

    const statusInfo = statusMap[status] || statusMap["PREPARED"];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {statusInfo.label}
      </span>
    );
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;

    switch (currency) {
      case "IDR":
        return `Rp ${num.toLocaleString("id-ID")}`;
      case "USD":
        return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      default:
        return `${num.toLocaleString()} ${currency}`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handlePayment = async () => {
    if (!isConnected || !address || !walletClient) {
      setPaymentError("Please connect your wallet first");
      return;
    }

    try {
      setPaying(true);
      setPaymentError(null);

      // Step 1: Create payment signature
      setPaymentStep("Creating payment signature...");
      console.log("Starting x402 payment for invoice:", invoiceId);

      // Get payment endpoint from backend (GET endpoint that returns 402)
      const paymentEndpoint = `${BACKEND_URL}/payments/${invoiceId}/details`;

      // Step 2: Process x402 payment
      setPaymentStep("Processing payment...");
      const result = await processX402Payment(walletClient, paymentEndpoint);

      if (result.success) {
        setPaymentStep("Payment successful! Refreshing invoice...");
        console.log("Payment successful!", result);

        // Reload invoice to show updated status
        await loadInvoice();
        setPaymentStep("");
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      setPaymentError(err.message || "Payment failed. Please try again.");
      setPaymentStep("");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invoice Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "The invoice you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Invoices
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice #{invoice.invoiceNo}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Created: {formatDate(invoice.createdAt)}</span>
                <span>•</span>
                <span>Due: {formatDate(invoice.expiresAt)}</span>
              </div>
            </div>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* From & Bill To */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From */}
                {invoice.merchant && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      From
                    </h3>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {invoice.merchant.businessName || "Merchant"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {invoice.merchant.email}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {invoice.merchant.walletAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bill To */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Bill To
                  </h3>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {invoice.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {invoice.customerEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invoice Item
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        1
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.productName}
                          </p>
                          {invoice.description && (
                            <p className="text-sm text-gray-500">
                              {invoice.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Source Amount</span>
                    <span className="text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </span>
                  </div>
                  {invoice.usdcAmount && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Paid Amount</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {invoice.usdcAmount} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Fee</span>
                        <span className="flex items-center gap-1 text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          0.01 USDC
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">
                        Net Amount
                      </span>
                      <div className="text-right">
                        {invoice.usdcAmount && (
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {parseFloat(invoice.usdcAmount) + 0.01} USDC
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          ({formatCurrency(invoice.amount, invoice.currency)})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Summary
              </h3>

              <div className="space-y-4">
                {/* Invoice ID */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Invoice ID
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 font-mono truncate">
                      {invoice.id.slice(0, 8)}...{invoice.id.slice(-4)}
                    </p>
                    <button
                      onClick={() => copyToClipboard(invoice.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Invoice Number
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-900 font-mono">
                      {invoice.invoiceNo}
                    </p>
                    <button
                      onClick={() => copyToClipboard(invoice.invoiceNo)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Status
                  </label>
                  <div>{getStatusBadge(invoice.status)}</div>
                </div>

                {/* Customer */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Customer
                  </label>
                  <p className="text-sm text-gray-900">
                    {invoice.customerName}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Amount
                  </label>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.usdcAmount && (
                      <p className="text-xs text-gray-500">
                        ≈ {invoice.usdcAmount} USDC
                      </p>
                    )}
                  </div>
                </div>

                {/* Network */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                    Network
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Image
                        src="/base-network.svg"
                        alt="hedera logo"
                        width={25}
                        height={25}
                        className=""
                      />
                    </div>
                    <span className="text-sm text-gray-900">Hedera Testnet</span>
                  </div>
                </div>

                {/* Exchange Rate */}
                {invoice.conversionRate && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                      Exchange Rate
                    </label>
                    <p className="text-sm text-gray-900">
                      Rp{" "}
                      {parseFloat(invoice.conversionRate).toLocaleString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                )}

                {/* Payment Hash */}
                {invoice.paymentHash && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">
                      Tx Hash
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900 font-mono truncate">
                        {invoice.paymentHash.slice(0, 6)}...
                        {invoice.paymentHash.slice(-4)}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(invoice.paymentHash || "")
                        }
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <a
                        href={`https://hashscan.io/testnet/transaction/${invoice.paymentHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                        title="View on Explorer">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {invoice.status !== "PAID" && invoice.status !== "SETTLED" && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {/* Payment Error */}
                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{paymentError}</p>
                    </div>
                  )}

                  {/* Payment Step */}
                  {paymentStep && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <p className="text-blue-800 text-sm font-medium">
                          {paymentStep}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="text-center py-2">
                      <p className="text-gray-600 text-sm mb-3">
                        Connect your wallet to pay this invoice
                      </p>
                      <ConnectButton />
                    </div>
                  ) : (
                    <button
                      onClick={handlePayment}
                      disabled={paying || !walletClient}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {paying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="text-xl">
                            <IoCash />
                          </span>
                          Pay {invoice.usdcAmount} USDC
                        </>
                      )}
                    </button>
                  )}

                  {/* USDC Faucet Link */}
                  <div className="pt-3 text-center border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Need Hedera Testnet USDC?{" "}
                      <a
                        href="https://faucet.circle.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium underline">
                        Get some here
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import BalanceCard from "@/components/BalanceCard";
import InvoiceTable from "@/components/InvoiceTable";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import MerchantProfileModal from "@/components/MerchantProfileModal";
import {
  fetchInvoices,
  formatDate,
  mapInvoiceStatus,
  getMerchantProfile,
  type Invoice as APIInvoice,
  type MerchantProfile,
} from "@/utils/api";
import { IoCalendar } from "react-icons/io5";

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();

  // Merchant profile
  const [merchantProfile, setMerchantProfile] =
    useState<MerchantProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Real invoice data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      checkMerchantProfile();
      loadInvoices();
    } else {
      setInvoices([]);
      setMerchantProfile(null);
      setInvoices([]);
    }
  }, [isConnected, address]);
  const checkMerchantProfile = async () => {
    if (!address) return;
    try {
      const profile = await getMerchantProfile(address);
      setMerchantProfile(profile);
      if (!profile.profileCompleted) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Failed to load merchant profile:", error);
    }
  };

  const loadInvoices = async () => {
    if (!address) {
      setError("Please connect your wallet");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchInvoices(address);
      const transformedInvoices = data.map((invoice: APIInvoice) => ({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customerName,
        email: invoice.customerEmail,
        status: mapInvoiceStatus(invoice.status),
        created: formatDate(invoice.createdAt),
        expired: formatDate(invoice.expiresAt),
        paidAmount: invoice.amount,
        currency: invoice.currency,
        equivalentAmount: invoice.usdcAmount
          ? `≈ ${invoice.usdcAmount} USDC`
          : null,
      }));
      setInvoices(transformedInvoices);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const getCurrentDateTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateString = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `${timeString}, ${dateString}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        merchantProfile={merchantProfile}
        onEditProfile={() => setShowProfileModal(true)}
      />
      <main
        className={`flex-1 overflow-y-auto ${
          !isConnected ? "filter blur-sm" : ""
        }`}
      >
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Overview of your account activity and performance
                </p>
              </div>
              <div className="flex gap-1">
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">
                      Exchange Rate:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        1 USDC
                      </span>
                      <span className="text-gray-400">=</span>
                      <span className="text-sm font-semibold text-gray-600">
                        Rp16,600
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-lg">
                      <IoCalendar />
                    </span>
                    <span>{getCurrentDateTime()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <BalanceCard title="Rupiah Balance" currency="IDR" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Recent Invoices
                  </h2>
                  <p className="text-gray-600">Your latest Invoice activity</p>
                </div>
                <button
                  onClick={() => router.push("/invoices")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All
                </button>
              </div>

              {!isConnected ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 text-lg mb-2">
                    Please connect your wallet
                  </p>
                  <p className="text-gray-500">
                    Connect your wallet to view your invoices
                  </p>
                </div>
              ) : isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading invoices...</p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={loadInvoices}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : invoices.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600 text-lg mb-2">No invoices yet</p>
                  <p className="text-gray-500">
                    Create your first invoice to get started
                  </p>
                  <button
                    onClick={() => router.push("/invoices")}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Invoice
                  </button>
                </div>
              ) : (
                <InvoiceTable invoices={invoices.slice(0, 5)} />
              )}
            </div>
          </div>
        </div>
      </main>
      <WalletConnectModal />
      <MerchantProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileCompleted={() => {
          setShowProfileModal(false);
          checkMerchantProfile();
          loadInvoices();
        }}
      />
    </div>
  );
}

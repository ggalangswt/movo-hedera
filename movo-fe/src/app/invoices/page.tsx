"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Sidebar from "@/components/Sidebar";
import InvoiceTable from "@/components/InvoiceTable";
import CreateInvoiceForm from "@/components/CreateInvoiceForm";
import PreviewInvoice from "@/components/PreviewInvoice";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import MerchantProfileModal from "@/components/MerchantProfileModal";
import RefreshButton from "@/components/ui/RefreshButton";
import {
  fetchInvoices,
  formatDate,
  mapInvoiceStatus,
  getMerchantProfile,
  type Invoice as APIInvoice,
  type MerchantProfile,
} from "@/utils/api";
import { IoMdAddCircleOutline } from "react-icons/io";
import { MdDone, MdEmail } from "react-icons/md";
import { FaLink } from "react-icons/fa";

const InvoiceSuccessScreen = ({
  onBackToDashboard,
}: {
  onBackToDashboard: () => void;
}) => {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-md">
        {/* Animated Checkmark */}
        <div className="mb-6 relative">
          <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
            <svg
              className="w-16 h-16 text-green-600 animate-check-draw"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 0,
                  animation: "draw 0.5s ease-in-out 0.3s forwards",
                }}
              />
            </svg>
          </div>
          {/* Confetti effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-500 rounded-full animate-confetti"
                style={{
                  left: "50%",
                  top: "50%",
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 45}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">
          Invoice Created Successfully!
        </h1>
        <p
          className="text-lg text-gray-600 mb-8 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Your invoice has been created and is ready to be shared with your
          customer.
        </p>

        {/* Action Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <button
            onClick={onBackToDashboard}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              onBackToDashboard();
              setTimeout(
                () => window.scrollTo({ top: 0, behavior: "smooth" }),
                100
              );
            }}
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            View All Invoices
          </button>
        </div>

        {/* Stats or additional info */}
        <div
          className="mt-12 grid grid-cols-3 gap-4 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 flex justify-center">
              <MdDone />
            </div>
            <div className="text-sm text-gray-600 mt-1 text-center">
              Created
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 flex justify-center">
              <MdEmail />
            </div>
            <div className="text-sm text-gray-600 mt-1 text-center">
              Email Sent
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 flex justify-center">
              <FaLink />
            </div>
            <div className="text-sm text-gray-600 mt-1 text-center">
              Link Ready
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            transform: translate(-50%, -50%) rotate(var(--rotate, 0deg))
              translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--rotate, 0deg))
              translateY(-100px);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-confetti {
          animation: confetti 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default function InvoicesPage() {
  const { isConnected, address } = useAccount();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPreviewInvoice, setShowPreviewInvoice] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState(null);
  const [invoicePreviewReferences, setInvoicePreviewReferences] = useState([]);
  const [savedFormData, setSavedFormData] = useState(null);
  const [savedCustomReferences, setSavedCustomReferences] = useState([]);
  const [merchantProfile, setMerchantProfile] =
    useState<MerchantProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      checkMerchantProfile();
      loadInvoices();
    } else {
      setInvoices([]);
      setMerchantProfile(null);
      setIsLoading(false);
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

  const handlePreviewInvoice = (data: any, references: any) => {
    setInvoicePreviewData(data);
    setInvoicePreviewReferences(references);
    setSavedFormData(data);
    setSavedCustomReferences(references);
    setShowCreateInvoice(false);
    setShowPreviewInvoice(true);
  };

  const handleBackToEdit = () => {
    setShowPreviewInvoice(false);
    setShowCreateInvoice(true);
  };

  const handleCreateInvoice = async () => {
    console.log("Creating invoice with data:", invoicePreviewData);
    console.log("Custom references:", invoicePreviewReferences);

    // Reload invoices after creation
    await loadInvoices();

    // Clear form data
    setSavedFormData(null);
    setSavedCustomReferences([]);
    setInvoicePreviewData(null);
    setInvoicePreviewReferences([]);

    // Hide preview and show success screen
    setShowPreviewInvoice(false);
    setShowCreateInvoice(false);
    setShowSuccessScreen(true);
  };

  const handleBackFromSuccess = () => {
    setShowSuccessScreen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          {showSuccessScreen ? (
            <InvoiceSuccessScreen onBackToDashboard={handleBackFromSuccess} />
          ) : showPreviewInvoice && invoicePreviewData ? (
            <PreviewInvoice
              invoiceData={invoicePreviewData}
              customReferences={invoicePreviewReferences}
              onBack={handleBackToEdit}
              onCreate={handleCreateInvoice}
            />
          ) : showCreateInvoice ? (
            <CreateInvoiceForm
              onBack={() => setShowCreateInvoice(false)}
              onPreview={handlePreviewInvoice}
              initialData={savedFormData}
              initialReferences={savedCustomReferences}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                  <p className="text-gray-600 mt-1">
                    Manage and track your cryptocurrency payment invoices
                  </p>
                </div>
                <div className="flex gap-3">
                  <RefreshButton
                    onClick={loadInvoices}
                    title="Refresh invoices"
                  />
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="text-xl">
                      <IoMdAddCircleOutline />
                    </span>
                    Create Invoice
                  </button>
                </div>
              </div>

              {!isConnected ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 text-2xl mb-4">
                    👛 Please connect your wallet
                  </p>
                  <p className="text-gray-500 text-lg">
                    Connect your wallet to view and manage your invoices
                  </p>
                </div>
              ) : isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4 text-lg">
                    Loading invoices...
                  </p>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg border border-red-200 p-12 text-center">
                  <p className="text-red-600 text-lg mb-4">{error}</p>
                  <button
                    onClick={loadInvoices}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : invoices.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-600 text-xl mb-2">
                    No invoices found
                  </p>
                  <p className="text-gray-500 mb-6">
                    You haven&apos;t created any invoices yet for this wallet
                  </p>
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create Your First Invoice
                  </button>
                </div>
              ) : (
                <InvoiceTable invoices={invoices} />
              )}
            </div>
          )}
        </div>
      </main>
        <WalletConnectModal />
        <MerchantProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onProfileCompleted={() => {
            setShowProfileModal(false)
            checkMerchantProfile()
            loadInvoices()
          }}
        />
    </div>
  );
}

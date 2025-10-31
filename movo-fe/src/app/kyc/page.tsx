"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Sidebar from "@/components/Sidebar";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import Stepper, { Step } from "@/components/ui/Stepper";
import KYCStepUploadKTP from "@/components/kyc/KYCStepUploadKTP";
import KYCStepFaceComparison from "@/components/kyc/KYCStepFaceComparison";
import KYCStepLivenessTest from "@/components/kyc/KYCStepLivenessTest";
import KYCVerified from "@/components/kyc/KYCVerified";
import { motion } from "framer-motion";
import { MdVerifiedUser, MdCameraAlt, MdFace } from "react-icons/md";



interface KYCData {
  ktpImage?: File;
  ktpNumber?: string;
  fullName?: string;
  selfieImage?: Blob;
}

export default function KYCPage() {
  const { isConnected, address } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycData, setKYCData] = useState<KYCData>({});
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const steps: Step[] = [
    {
      label: "Upload KTP",
      description: "ID Card",
      icon: <MdVerifiedUser />,
    },
    {
      label: "Face Verification",
      description: "Selfie",
      icon: <MdCameraAlt />,
    },
    {
      label: "Liveness Test",
      description: "Live Detection",
      icon: <MdFace />,
    },
  ];

  // Check if user has completed KYC
  useEffect(() => {
    const checkKYCStatus = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      // Simulate API call to check KYC status
      setTimeout(() => {
        // Check localStorage or API for KYC status
        const kycStatus = localStorage.getItem(`kyc_status_${address}`);
        setIsKYCVerified(kycStatus === "verified");
        setIsLoading(false);
      }, 1000);
    };

    checkKYCStatus();
  }, [address]);

  const handleKTPUpload = (data: {
    ktpImage: File;
    ktpNumber: string;
    fullName: string;
  }) => {
    setKYCData({ ...kycData, ...data });
    setCurrentStep(1);
  };

  const handleFaceComparison = (data: { selfieImage: Blob }) => {
    setKYCData({ ...kycData, ...data });
    setCurrentStep(2);
  };

  const handleLivenessComplete = async () => {
    // Simulate API call to submit KYC data
    setIsLoading(true);

    // In production, send kycData to backend
    console.log("Submitting KYC data:", kycData);

    setTimeout(() => {
      // Save KYC status
      if (address) {
        localStorage.setItem(`kyc_status_${address}`, "verified");
        localStorage.setItem(
          `kyc_data_${address}`,
          JSON.stringify({
            fullName: kycData.fullName,
            ktpNumber: kycData.ktpNumber,
            verifiedDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            status: "verified",
          })
        );
      }
      setIsKYCVerified(true);
      setIsLoading(false);
    }, 2000);
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading KYC status...</p>
          </div>
        </main>
        <WalletConnectModal />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main
        className={`flex-1 overflow-y-auto ${
          !isConnected ? "filter blur-sm" : ""
        }`}
      >
        <div className="p-6 max-w-5xl mx-auto">
          {!isConnected ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center"
            >
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Wallet Connection Required
              </h2>
              <p className="text-gray-600">
                Please connect your wallet to access KYC verification
              </p>
            </motion.div>
          ) : isKYCVerified ? (
            <KYCVerified
              kycData={
                JSON.parse(
                  localStorage.getItem(`kyc_data_${address}`) || "{}"
                ) || {
                  fullName: kycData.fullName || "John Doe",
                  ktpNumber: kycData.ktpNumber || "1234567890123456",
                  verifiedDate: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  status: "verified",
                }
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  KYC Verification
                </h1>
                <p className="text-gray-600">
                  Complete your identity verification to unlock full platform features
                </p>
              </div>

              {/* Stepper */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  variant="circle"
                  showDescription={true}
                  allowClickableSteps={false}
                />
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
                {currentStep === 0 && (
                  <KYCStepUploadKTP onNext={handleKTPUpload} />
                )}
                {currentStep === 1 && (
                  <KYCStepFaceComparison
                    onNext={handleFaceComparison}
                    onBack={() => handleBackToStep(0)}
                  />
                )}
                {currentStep === 2 && (
                  <KYCStepLivenessTest
                    onComplete={handleLivenessComplete}
                    onBack={() => handleBackToStep(1)}
                  />
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  🔒 Your personal information is encrypted and securely stored.
                  We comply with data protection regulations.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <WalletConnectModal />
    </div>
  );
}
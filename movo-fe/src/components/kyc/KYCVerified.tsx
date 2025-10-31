"use client";

import React from "react";
import { motion } from "framer-motion";
import { MdVerified, MdPerson, MdCalendarToday, MdLocationOn } from "react-icons/md";

interface KYCVerifiedProps {
  kycData: {
    fullName: string;
    ktpNumber: string;
    verifiedDate: string;
    status: "verified" | "pending" | "rejected";
  };
}

export default function KYCVerified({ kycData }: KYCVerifiedProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "green";
      case "pending":
        return "yellow";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const statusColor = getStatusColor(kycData.status);

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <MdVerified className="text-6xl text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          KYC Verification Complete
        </h2>
        <p className="text-gray-600">
          Your identity has been successfully verified
        </p>
      </motion.div>

      {/* Verification Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Verification Details
          </h3>
          <span
            className={`px-4 py-2 bg-${statusColor}-100 text-${statusColor}-700 rounded-full text-sm font-semibold`}
          >
            {kycData.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MdPerson className="text-blue-600 text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="font-semibold text-gray-900">{kycData.fullName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MdLocationOn className="text-purple-600 text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">KTP Number (NIK)</p>
              <p className="font-semibold text-gray-900 font-mono">
                {kycData.ktpNumber}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MdCalendarToday className="text-green-600 text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Verification Date</p>
              <p className="font-semibold text-gray-900">
                {kycData.verifiedDate}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border-2 border-gray-200 p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          ✨ Benefits of Verified Account
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: "💰",
              title: "Higher Transaction Limits",
              description: "Access increased payment limits",
            },
            {
              icon: "🚀",
              title: "Faster Withdrawals",
              description: "Priority processing for payouts",
            },
            {
              icon: "🔒",
              title: "Enhanced Security",
              description: "Additional protection for your account",
            },
            {
              icon: "⭐",
              title: "Premium Features",
              description: "Unlock advanced platform features",
            },
          ].map((benefit, index) => (
            <div
              key={index}
              className="flex gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-3xl">{benefit.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {benefit.title}
                </h4>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🔐 <strong>Security Note:</strong> Your verification data is encrypted
          and stored securely. We never share your personal information with
          third parties without your consent.
        </p>
      </div>
    </div>
  );
}
"use client"

import { useState } from "react";
import { useAccount } from "wagmi";
import Sidebar from "@/components/Sidebar";
import { WalletConnectModal } from "@/components/WalletConnectModal";

export default function FAQPage() {
    const { isConnected } = useAccount();
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs = [
    {
      question: "What is Movo?",
      answer:
        "Movo is a cross-border payment platform leveraging the X402 protocol by Coinbase. It enables businesses to accept cryptocurrency payments and seamlessly convert them to local currencies like Indonesian Rupiah (IDR). With Movo, merchants can expand their global reach, reduce transaction fees, and receive payments instantly without the complexities of traditional international payment systems.",
    },
    {
      question: "How to use Movo?",
      answer:
        "Using Movo is simple: First, connect your crypto wallet to the platform. Then, create an invoice by entering your customer's details, amount, and currency. Share the invoice link with your customer, who can pay using USDC on Base network. Once paid, the payment is automatically converted to your preferred local currency and deposited to your account. You can track all transactions in real-time through your dashboard.",
    },
    {
      question: "What cryptocurrencies are supported?",
      answer:
        "Movo currently supports USDC (USD Coin) payments on the Base network. USDC is a stablecoin pegged to the US Dollar, providing price stability and fast transaction processing. We're continuously working to add support for more cryptocurrencies and blockchain networks.",
    },
    {
      question: "How long does it take to receive payments?",
      answer:
        "Crypto payments are processed almost instantly on the blockchain. Once your customer completes the payment, it's confirmed within seconds. The conversion to your local currency and settlement to your account typically happens within 1-2 business days, depending on your bank and location.",
    },
    {
      question: "What are the fees?",
      answer:
        "Movo charges competitive fees for our services. Transaction fees are typically 1-2% per invoice, significantly lower than traditional payment processors and international wire transfers. There are no hidden fees, no monthly subscriptions, and no setup costs. You only pay when you receive payments.",
    },
    {
      question: "Is Movo secure?",
      answer:
        "Yes, security is our top priority. All transactions are processed on-chain using smart contracts, providing transparency and immutability. We use industry-standard encryption for all data transmissions. Your wallet remains in your control at all times - we never have access to your private keys. All payments are verified on the blockchain before settlement.",
    },
    {
      question: "Where do I register?",
      answer:
        "Registration is simple! Just connect your crypto wallet (MetaMask, Coinbase Wallet, or other WalletConnect-compatible wallets) to our platform. Once connected, you'll be prompted to complete your merchant profile with basic business information. No lengthy paperwork or approval process required - you can start creating invoices immediately.",
    },
    {
      question: "Do I need KYC verification?",
      answer:
        "For basic functionality and small transaction volumes, KYC verification is not required. However, for higher transaction limits and to access additional features like direct bank payouts, you may need to complete KYC verification. This helps us comply with regulatory requirements and protect both merchants and customers.",
    },
    {
      question: "Which countries are supported?",
      answer:
        "Movo currently supports businesses in Indonesia with IDR settlements. We're actively expanding to more countries in Southeast Asia and beyond. If you're interested in using Movo in your country, please contact our support team to express your interest and we'll notify you when we launch in your region.",
    },
    {
      question: "How do I contact support?",
      answer:
        "Our support team is here to help! You can reach us through multiple channels: Email us at support@movo.com, join our Discord community for real-time assistance, or follow us on Twitter @MovoPayments. We typically respond within 24 hours and provide comprehensive documentation and tutorials on our website.",
    },
  ]

    const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  }

  return(
    <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main
        className={`flex-1 overflow-y-auto ${
          !isConnected ? "filter blur-sm" : ""
        }`}>
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h1>
                <p className="text-gray-600 mt-1">
                  Everything you need to know about Movo
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg border-2 ${
                    openIndex === index
                      ? "border-blue-500"
                      : "border-gray-200"
                  }`}>
                  <button
                    onClick={() => toggleFAQ(index)}
                    className={`w-full px-8 py-6 flex items-center justify-between text-left transition-all duration-300 ${
                      openIndex === index ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}>
                    <span className="text-xl font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        openIndex === index
                          ? "bg-blue-600 rotate-45"
                          : "bg-gray-100 hover:bg-blue-100"
                      }`}>
                      <svg
                        className={`w-6 h-6 transition-colors ${
                          openIndex === index
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === index
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}>
                    <div className="px-8 pb-6 bg-blue-50">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
        <WalletConnectModal />
    </div>
  )
}



"use client";

import Sidebar from "@/components/Sidebar";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { useAccount } from "wagmi";

export default function PayoutPage() {
  const { isConnected } = useAccount();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main
        className={`flex-1 overflow-y-auto ${
          !isConnected ? "filter blur-sm" : ""
        }`}>
        <div className="fixed inset-0 left-64 top-0 right-0 bottom-0">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 blur-md"></div>
          <div className="relative flex items-center justify-center h-full">
            <h2 className="text-6xl font-bold text-gray-800">Coming Soon</h2>
          </div>
        </div>
      </main>
      <WalletConnectModal />
    </div>
  );
}
"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { MdSpaceDashboard, MdPayments, MdVerifiedUser } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import { BsQuestionCircleFill } from "react-icons/bs";

interface SidebarProps {
  merchantProfile?: any;
  onEditProfile?: () => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: <MdSpaceDashboard />, path: "/dashboard" },
  { id: "invoices", label: "Invoices", icon: <FaFileInvoice /> , path: "/invoices"},
  { id: "payout", label: "Payout", icon: <MdPayments />, path: "/payout" },
  { id: "kyc", label: "KYC", icon: <MdVerifiedUser /> , path: "/kyc"},
  { id: "faq", label: "FAQ", icon: <BsQuestionCircleFill /> , path: "/faq"},
];

export default function Sidebar({
  merchantProfile,
  onEditProfile,
}: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-all duration-300 ${
              hoveredItem === "logo"
                ? "scale-110 shadow-lg shadow-blue-500/50"
                : ""
            }`}>
            <Image
              src="/movo non-text.png"
              alt="Movo Logo"
              width={30}
              height={30}
              className="object-contain scale-200"
            />
          </div>
          <span className="text-2xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            movo.
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  pathname === item.path
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}>
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          {isConnected && address ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {merchantProfile?.name ||
                    merchantProfile?.businessName ||
                    `${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {merchantProfile?.email || address}
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          ) : (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          )}

          {isDropdownOpen && isConnected && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
              {onEditProfile && (
                <>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onEditProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                  <div className="h-px bg-gray-200" />
                </>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address || "");
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
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
                Copy Address
              </button>
              <div className="h-px bg-gray-200" />
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  disconnect();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

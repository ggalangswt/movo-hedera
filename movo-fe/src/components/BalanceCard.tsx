"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useContractRead } from "wagmi";
import { formatUnits } from "viem";
import { mockErc20Abi } from "@/lib/abis/mockErc20Abis";
import RefreshButton from "./ui/RefreshButton";
// MIDR Token Address on Hedera Testnet
const IDR_TOKEN_ADDRESS = "0xd7d78C1758f4c26a166d06B7137D0123B9fd15f6";
const IDR_DECIMALS = 2;

interface BalanceCardProps {
  title: string;
  currency: string;
  onRefresh?: () => void;
}

export default function BalanceCard({
  title,
  currency,
  onRefresh,
}: BalanceCardProps) {
  const { address, isConnected } = useAccount();
  const [formattedBalance, setFormattedBalance] = useState("0.00");

  const { data: tokenBalance, refetch } = useContractRead({
    address: IDR_TOKEN_ADDRESS,
    abi: mockErc20Abi,
    functionName: "balanceOf",
    args: [address || "0x0"],
  });

  useEffect(() => {
    if (tokenBalance) {
      const formatted = formatUnits(tokenBalance, IDR_DECIMALS);
      setFormattedBalance(
        Number(formatted).toLocaleString("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  }, [tokenBalance]);

  const handleRefresh = () => {
    refetch?.();
    onRefresh?.();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm w-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <RefreshButton onClick={handleRefresh} title="Refresh Balance" />
      </div>
      <div className="text-3xl font-bold text-blue-600">
        Rp {formattedBalance}
      </div>
    </div>
  );
}

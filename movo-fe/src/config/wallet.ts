import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { http } from 'wagmi'

// Define Hedera Testnet chain
const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://296.rpc.thirdweb.com'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://296.rpc.thirdweb.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hashscan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
})

const config = getDefaultConfig({
  appName: 'Movo',
  projectId: 'c0c561979e95759ed2346631c0751314', // WalletConnect Cloud project ID
  chains: [hederaTestnet],
  transports: {
    [hederaTestnet.id]: http(process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://296.rpc.thirdweb.com'),
  },
})

export default config
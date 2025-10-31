import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'
import { http } from 'wagmi'

const config = getDefaultConfig({
  appName: 'Movo',
  projectId: 'c0c561979e95759ed2346631c0751314', // WalletConnect Cloud project ID
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
})

export default config
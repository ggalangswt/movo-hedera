import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'

export function WalletConnectModal() {
  const { isConnected } = useAccount()

  if (isConnected) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="relative rounded-2xl bg-gradient-to-b from-white to-gray-50 p-8 shadow-2xl w-[400px] text-center overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="absolute -left-20 -top-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Icon */}
        <div className="mb-6 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <svg 
              className="w-8 h-8 text-white"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="mb-4 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Connect Wallet
          </h2>
          <p className="mb-8 text-gray-600">
            Please connect your wallet to continue
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
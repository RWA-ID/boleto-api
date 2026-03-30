import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, base, sepolia, baseSepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'boleto.eth',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, base, sepolia, baseSepolia],
  ssr: false,
})

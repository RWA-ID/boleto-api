import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, base, sepolia, baseSepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const wagmiConfig = getDefaultConfig({
  appName: 'boleto.eth',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, base, sepolia, baseSepolia],
  transports: {
    [mainnet.id]:     http(process.env.NEXT_PUBLIC_ALCHEMY_MAINNET),
    [sepolia.id]:     http(process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA),
    [base.id]:        http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
})

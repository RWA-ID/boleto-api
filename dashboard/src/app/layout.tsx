'use client'

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { I18nProvider } from '@/lib/i18n'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>boleto.eth — Web3 Ticketing Protocol</title>
        <meta name="description" content="ENS subdomain-based NFT tickets for Latin American events" />
        <meta property="og:title" content="boleto.eth" />
        <meta property="og:description" content="Web3 ticketing infrastructure for Latin American events" />
        <meta property="og:url" content="https://boleto.eth.limo" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme({ accentColor: '#f97316', borderRadius: 'small' })}>
              <I18nProvider>
                {children}
              </I18nProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}

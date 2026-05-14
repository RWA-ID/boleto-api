'use client'

import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { I18nProvider } from '@/lib/i18n'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>boleto.eth — Ticketing infrastructure for live events</title>
        <meta name="description" content="Ticketing infrastructure for the next decade of live events in Latin America. Immutable inventory, programmatic royalties, white-label API." />
        <meta property="og:title" content="boleto.eth — Ticketing infrastructure" />
        <meta property="og:description" content="Ticketing infrastructure for the next decade of live events in Latin America." />
        <meta property="og:url" content="https://boleto.eth.limo" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={lightTheme({ accentColor: '#E25822', borderRadius: 'small' })}>
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

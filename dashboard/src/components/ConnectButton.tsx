'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <RainbowConnectButton
      accountStatus="address"
      chainStatus="none"
      showBalance={false}
    />
  )
}

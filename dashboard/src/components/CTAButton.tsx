'use client'

import Link from 'next/link'
import { CSSProperties, ReactNode } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Icon } from './Icon'

// Wallet-aware CTA.
// - Disconnected: button opens the RainbowKit connect modal.
// - Connected:    button is a normal link to `href`.
export function CTAButton({
  href,
  variant = 'primary',
  size = 'lg',
  className,
  style,
  children,
  connectLabel = 'Connect wallet',
  showArrow = false,
}: {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: CSSProperties
  children: ReactNode
  connectLabel?: string
  showArrow?: boolean
}) {
  const sizeCls = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''
  const cls = `btn btn-${variant} ${sizeCls} ${className ?? ''}`.trim()
  const arrow = showArrow ? <Icon name="arrow" size={size === 'lg' ? 16 : 14} /> : null
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain
        if (!connected) {
          return (
            <button
              type="button"
              className={cls}
              style={style}
              onClick={openConnectModal}
              disabled={!ready}
            >
              {connectLabel} {arrow}
            </button>
          )
        }
        return (
          <Link href={href} className={cls} style={style}>
            {children} {arrow}
          </Link>
        )
      }}
    </ConnectButton.Custom>
  )
}

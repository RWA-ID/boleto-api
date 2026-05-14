'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { Icon } from './Icon'
import { Wordmark } from './MarketingNav'
import { ConnectButton } from '@rainbow-me/rainbowkit'

type NavId = 'events' | 'create-event' | 'api-keys' | 'verify' | 'docs' | 'buy'

interface NavItem {
  id: NavId | 'webhooks' | 'royalties'
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  href: string | null
}

const NAV: NavItem[] = [
  { id: 'events',       label: 'Events',         icon: 'graph',    href: '/events' },
  { id: 'create-event', label: 'Create event',   icon: 'plus',     href: '/create-event' },
  { id: 'api-keys',     label: 'API keys',       icon: 'key',      href: '/api-keys' },
  { id: 'webhooks',     label: 'Webhooks',       icon: 'webhook',  href: null },
  { id: 'royalties',    label: 'Royalties',      icon: 'receipt',  href: null },
  { id: 'verify',       label: 'Gate scanner',   icon: 'qr',       href: '/verify' },
  { id: 'buy',          label: 'Checkout demo',  icon: 'ticket',   href: '/buy' },
  { id: 'docs',         label: 'Docs',           icon: 'bookOpen', href: '/docs' },
]

const LABELS: Record<string, string> = {
  events: 'Events',
  'create-event': 'Create event',
  'api-keys': 'API keys',
  verify: 'Gate scanner',
  docs: 'Docs',
  buy: 'Checkout',
}

export function AppShell({
  active,
  rightActions,
  children,
}: {
  active: NavId
  rightActions?: ReactNode
  children: ReactNode
}) {
  return (
    <div data-theme="console" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      background: 'var(--console-bg)',
      color: 'var(--console-text)',
    }}>
      {/* Sidebar */}
      <aside style={{
        borderRight: '1px solid var(--console-line)',
        background: 'var(--console-surface)',
        display: 'flex', flexDirection: 'column',
        padding: '18px 14px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{
          padding: '6px 8px 16px',
          marginBottom: 8,
          borderBottom: '1px solid var(--console-line)',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wordmark inverted accent="var(--accent-400)" />
          </Link>
          <div style={{
            marginTop: 12,
            padding: '6px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--console-line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--console-text-mute)' }}>Workspace</div>
              <div style={{ fontSize: 13, color: 'var(--console-text)', fontWeight: 500 }}>My organization</div>
            </div>
            <Icon name="chevronDown" size={14} style={{ color: 'var(--console-text-mute)' }} />
          </div>
          <div style={{
            marginTop: 8,
            display: 'flex', gap: 4,
            padding: 3,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--console-line)',
            borderRadius: 6,
          }}>
            {['Test', 'Live'].map((m, i) => (
              <button key={m} style={{
                flex: 1,
                background: i === 1 ? 'var(--accent-500)' : 'transparent',
                color: i === 1 ? '#fff' : 'var(--console-text-dim)',
                border: 'none', borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
                cursor: 'pointer',
              }}>{m}</button>
            ))}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(it => {
            const isActive = it.id === active
            const content = (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 13.5, fontWeight: 500,
                color: isActive ? 'var(--console-text)' : 'var(--console-text-dim)',
                background: isActive ? 'rgba(226,88,34,0.10)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-500)' : '2px solid transparent',
                paddingLeft: isActive ? 8 : 10,
                opacity: it.href ? 1 : 0.5,
                cursor: it.href ? 'pointer' : 'default',
              }}>
                <Icon name={it.icon} size={15} style={{ color: isActive ? 'var(--accent-400)' : 'var(--console-text-mute)' }} />
                {it.label}
                {!it.href && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.12em',
                    color: 'var(--console-text-mute)', textTransform: 'uppercase',
                  }}>Soon</span>
                )}
              </span>
            )
            return it.href
              ? <Link key={it.id} href={it.href}>{content}</Link>
              : <div key={it.id}>{content}</div>
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--console-line)' }}>
          <div style={{
            padding: 10, borderRadius: 8,
            background: 'rgba(226,88,34,0.08)',
            border: '1px solid rgba(226,88,34,0.18)',
          }}>
            <div style={{ fontSize: 11.5, color: 'var(--accent-400)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Test mode
            </div>
            <div style={{ fontSize: 12, color: 'var(--console-text-dim)', lineHeight: 1.5 }}>
              You&apos;re in test mode. No real USDC is moving.
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ minWidth: 0 }}>
        <header style={{
          height: 56,
          borderBottom: '1px solid var(--console-line)',
          background: 'var(--console-bg)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--console-text-dim)',
          }}>
            <span style={{ color: 'var(--console-text-mute)' }}>Console</span>
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--console-text)', fontWeight: 500 }}>{LABELS[active] ?? 'Events'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {rightActions}
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
          </div>
        </header>

        <div>{children}</div>
      </div>
    </div>
  )
}

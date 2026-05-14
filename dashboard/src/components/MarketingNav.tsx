'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { CTAButton } from './CTAButton'

export function Wordmark({ small = false, inverted = false, accent = 'var(--accent-600)' }: {
  small?: boolean; inverted?: boolean; accent?: string
}) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: small ? 18 : 21,
      fontWeight: 500,
      letterSpacing: '-0.015em',
      color: inverted ? '#fff' : 'var(--ink-900)',
      display: 'inline-flex',
      alignItems: 'baseline',
    }}>
      boleto<span style={{ color: accent, fontWeight: 500 }}>.eth</span>
    </span>
  )
}

const NAV_ITEMS: { id: string; label: string; href: string }[] = [
  { id: 'platforms',  label: 'Platforms',  href: '/#platforms' },
  { id: 'organizers', label: 'Organizers', href: '/#organizers' },
  { id: 'docs',       label: 'Docs',       href: '/docs' },
  { id: 'pricing',    label: 'Pricing',    href: '/#pricing' },
  { id: 'company',    label: 'Company',    href: '/#contact' },
]

export function MarketingNav() {
  const { locale, setLocale } = useI18n()
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(248,250,249,0.85)',
      backdropFilter: 'saturate(140%) blur(12px)',
      WebkitBackdropFilter: 'saturate(140%) blur(12px)',
      borderBottom: '1px solid var(--ink-100)',
    }}>
      <div className="container-wide" style={{
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wordmark />
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV_ITEMS.map(it => (
              <Link
                key={it.id}
                href={it.href}
                style={{
                  fontSize: 14, fontWeight: 500,
                  padding: '8px 12px',
                  borderRadius: 6,
                  color: 'var(--ink-500)',
                  transition: 'color 160ms, background 160ms',
                }}
              >{it.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid var(--ink-150)',
            borderRadius: 6, padding: 2,
            background: 'var(--paper-card)',
          }}>
            {(['en', 'es'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                style={{
                  border: 'none',
                  padding: '4px 8px',
                  fontSize: 11.5, fontWeight: 600,
                  borderRadius: 4,
                  letterSpacing: '0.06em',
                  background: locale === l ? 'var(--ink-900)' : 'transparent',
                  color: locale === l ? '#fff' : 'var(--ink-500)',
                  cursor: 'pointer',
                }}
              >{l.toUpperCase()}</button>
            ))}
          </div>
          <CTAButton href="/events" variant="ghost" size="sm" connectLabel="Connect to sign in">Sign in</CTAButton>
          <Link href="/#contact" className="btn btn-primary btn-sm">Talk to sales</Link>
        </div>
      </div>
    </header>
  )
}

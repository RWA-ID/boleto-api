'use client'

import Link from 'next/link'
import { Wordmark } from './MarketingNav'

type FooterLink = [string, string | null]

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      ['For platforms',  '/#platforms'],
      ['For organizers', '/#organizers'],
      ['Pricing',        '/#pricing'],
      ['Security',       '/#security'],
    ],
  },
  {
    title: 'Developers',
    links: [
      ['Documentation',  '/docs'],
      ['API reference',  '/docs'],
      ['Status',         null],
      ['Changelog',      null],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About',     '/#contact'],
      ['Customers', null],
      ['Careers',   null],
      ['Contact',   '/#contact'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Terms',         null],
      ['Privacy',       null],
      ['Trust center',  null],
      ['Compliance',    null],
    ],
  },
]

export function MarketingFooter() {
  return (
    <footer style={{
      background: 'var(--ink-900)',
      color: 'rgba(255,255,255,0.7)',
      padding: '80px 0 40px',
    }}>
      <div className="container-wide">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 60,
        }}>
          <div>
            <Wordmark inverted accent="var(--accent-400)" />
            <p style={{
              marginTop: 16, maxWidth: 320, fontSize: 14, lineHeight: 1.6,
              color: 'rgba(255,255,255,0.55)',
            }}>
              Ticketing infrastructure for the next decade of live events in Latin America.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                All systems operational
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
              <span>Status page</span>
            </div>
          </div>
          {COLUMNS.map(col => (
            <div key={col.title}>
              <div style={{
                fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                marginBottom: 16,
              }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href ? (
                      <Link href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{label}</Link>
                    ) : (
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          fontSize: 12.5, color: 'rgba(255,255,255,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>© 2026 boleto.eth</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>boleto.eth · v1.2.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <a href="https://github.com/RWA-ID/boleto-api" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D" target="_blank" rel="noopener noreferrer">Etherscan</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Icon } from '@/components/Icon'

const SECTIONS = [
  { title: 'Introduction', items: ['Quickstart', 'Authentication', 'Test vs live', 'Rate limits'] },
  { title: 'Core resources', items: ['Events', 'Tickets', 'Royalties', 'Webhooks'] },
  { title: 'Guides', items: ['Issuance flow', 'EIP-712 vouchers', 'Custodial wallets', 'CSV import'] },
  { title: 'Reference', items: ['API · v1', 'Webhook events', 'Errors', 'Changelog'] },
]

const PARAMS = [
  ['event_id',   'string',       'Identifier of the event to mint against.'],
  ['recipient',  'string · 0x',  'Recipient wallet. Use your custodial address for white-label.'],
  ['seat',       'string',       'Seat identifier — appears in the ENS subdomain.'],
  ['section',    'string',       'Section name (e.g. "VIP").'],
  ['row',        'string',       'Row identifier.'],
  ['price_usdc', 'decimal',      'Settled price for the royalty calculation.'],
] as const

const CURL_SAMPLE = `POST /v1/tickets/mint
Authorization: Bearer sk_live_••••

{
  "event_id":  "evt_01HC9F",
  "recipient": "0xA1c4...e8F2",
  "seat":      "A12",
  "section":   "VIP",
  "row":       "A",
  "price_usdc":"180.00"
}`

const NODE_SAMPLE = `import { Boleto } from "@boleto/node";

const boleto = new Boleto(process.env.BOLETO_SK);

await boleto.tickets.mint({
  eventId:   "evt_01HC9F",
  recipient: "0xA1c4...e8F2",
  seat:      "A12",
  section:   "VIP",
  row:       "A",
  priceUsdc: "180.00",
});`

const PYTHON_SAMPLE = `from boleto import Boleto

client = Boleto(api_key=os.environ["BOLETO_SK"])

client.tickets.mint(
    event_id="evt_01HC9F",
    recipient="0xA1c4...e8F2",
    seat="A12",
    section="VIP",
    row="A",
    price_usdc="180.00",
)`

const RESPONSE = `{
  "id": "tkt_01HCBE2",
  "tokenId": "1438",
  "ensName": "seat-a12.badbunny-cdmx26.boleto.eth",
  "contractTx": "0x7b…f3a1",
  "status": "minted",
  "issuedAt": "2026-03-01T14:22:38Z"
}`

export default function DocsPage() {
  const [tab, setTab] = useState<'curl' | 'node' | 'python'>('curl')
  const [active, setActive] = useState('Tickets')
  const sample = tab === 'curl' ? CURL_SAMPLE : tab === 'node' ? NODE_SAMPLE : PYTHON_SAMPLE

  return (
    <AppShell active="docs">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 380px', minHeight: 'calc(100vh - 56px)' }}>
        {/* Docs sub-nav */}
        <aside style={{
          padding: '24px 16px',
          borderRight: '1px solid var(--console-line)',
          background: 'var(--console-surface)',
          fontSize: 13,
        }}>
          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--console-text-mute)',
                marginBottom: 8,
              }}>{section.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(it => {
                  const isActive = it === active
                  return (
                    <li key={it}>
                      <button
                        onClick={() => setActive(it)}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'block', padding: '6px 10px',
                          borderRadius: 5,
                          background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: isActive ? 'var(--console-text)' : 'var(--console-text-dim)',
                          border: 'none', cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >{it}</button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Content */}
        <section style={{ padding: '40px 48px', maxWidth: 760, minWidth: 0 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-400)' }}>Core resources</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'white', margin: '8px 0 16px',
          }}>Tickets</h1>
          <p style={{ fontSize: 16, color: 'var(--console-text-dim)', lineHeight: 1.65, marginBottom: 28 }}>
            A <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>Ticket</code> is an ERC-721 NFT minted under an event&apos;s ENS subdomain. Each ticket carries a unique seat assignment, an EIP-2981 royalty configuration, and a deterministic on-chain identifier.
          </p>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
            letterSpacing: '-0.015em', color: 'white', margin: '16px 0 12px',
          }}>Mint a ticket</h2>
          <p style={{ fontSize: 14.5, color: 'var(--console-text-dim)', lineHeight: 1.65, marginBottom: 18 }}>
            Issue a single ticket directly to a buyer&apos;s wallet — or a custodial address you control. Requests are idempotent on <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>idempotency_key</code>.
          </p>

          <div style={{
            background: 'var(--console-card)', border: '1px solid var(--console-line)',
            borderRadius: 10, overflow: 'hidden', marginBottom: 28,
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '160px 110px 1fr',
              padding: '10px 16px',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--console-text-mute)',
              borderBottom: '1px solid var(--console-line)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div>Parameter</div><div>Type</div><div>Description</div>
            </div>
            {PARAMS.map(([p, t, d], i) => (
              <div key={p} style={{
                display: 'grid', gridTemplateColumns: '160px 110px 1fr',
                padding: '12px 16px', alignItems: 'flex-start',
                fontSize: 13,
                borderBottom: i < PARAMS.length - 1 ? '1px solid var(--console-line)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--console-text)' }}>{p}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-400)' }}>{t}</div>
                <div style={{ color: 'var(--console-text-dim)', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
            letterSpacing: '-0.015em', color: 'white', margin: '8px 0 12px',
          }}>Verify a ticket at the gate</h2>
          <p style={{ fontSize: 14.5, color: 'var(--console-text-dim)', lineHeight: 1.65 }}>
            POST the seat ENS to <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>/v1/tickets/verify</code> from your gate scanner. The response includes the redemption state, allowing the same NFT to be admitted exactly once.
          </p>
        </section>

        {/* Code panel */}
        <aside style={{
          padding: 24,
          borderLeft: '1px solid var(--console-line)',
          background: 'var(--console-surface)',
          position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflow: 'auto',
        }}>
          <div style={{
            display: 'flex', gap: 4, marginBottom: 12, padding: 3,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6, border: '1px solid var(--console-line)',
          }}>
            {(['curl', 'node', 'python'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '6px 8px',
                  fontSize: 11.5, fontWeight: 600,
                  border: 'none', borderRadius: 4,
                  background: tab === t ? 'var(--console-card)' : 'transparent',
                  color: tab === t ? 'var(--console-text)' : 'var(--console-text-mute)',
                  cursor: 'pointer',
                }}
              >{t === 'curl' ? 'cURL' : t === 'node' ? 'Node' : 'Python'}</button>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--console-text-mute)', letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: 8,
          }}>
            <span>Request</span>
            <button style={{
              border: '1px solid var(--console-line)', background: 'transparent',
              color: 'var(--console-text-mute)', borderRadius: 4,
              padding: '3px 8px', fontSize: 10.5,
              display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            }}><Icon name="copy" size={11} /> Copy</button>
          </div>
          <pre style={{
            margin: 0, padding: '14px 16px',
            background: '#070C18',
            border: '1px solid var(--console-line)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            overflow: 'auto',
          }}>{sample}</pre>

          <div style={{
            marginTop: 16, fontSize: 11, color: 'var(--console-text-mute)',
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
          }}>Response · 200</div>
          <pre style={{
            margin: '8px 0 0', padding: '14px 16px',
            background: '#070C18',
            border: '1px solid var(--console-line)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            overflow: 'auto',
          }}>{RESPONSE}</pre>

          <div style={{
            marginTop: 16, padding: '10px 12px',
            fontSize: 11.5, color: 'var(--console-text-dim)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--console-line)',
            borderRadius: 8, lineHeight: 1.55,
          }}>
            <span style={{ color: 'var(--accent-400)', fontWeight: 600 }}>200 OK · 384ms · mainnet</span><br />
            Response includes ENS subdomain, on-chain tokenId, and the settlement txHash.
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

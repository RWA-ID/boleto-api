'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { Icon } from '@/components/Icon'

type SubItem = { id: string; label: string }
const SECTIONS: { title: string; items: SubItem[] }[] = [
  {
    title: 'Introduction',
    items: [
      { id: 'quickstart',     label: 'Quickstart' },
      { id: 'auth',           label: 'Authentication' },
      { id: 'modes',          label: 'Test vs live' },
      { id: 'rate-limits',    label: 'Rate limits' },
    ],
  },
  {
    title: 'Core resources',
    items: [
      { id: 'events',         label: 'Events' },
      { id: 'tickets',        label: 'Tickets' },
      { id: 'royalties',      label: 'Royalties' },
      { id: 'webhooks',       label: 'Webhooks' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { id: 'issuance',       label: 'Issuance flow' },
      { id: 'vouchers',       label: 'EIP-712 vouchers' },
      { id: 'custodial',      label: 'Custodial wallets' },
      { id: 'csv-import',     label: 'CSV import' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'api-v1',         label: 'API · v1' },
      { id: 'webhook-events', label: 'Webhook events' },
      { id: 'errors',         label: 'Errors' },
      { id: 'changelog',      label: 'Changelog' },
    ],
  },
]

const MINT_REQUEST = `POST /v1/tickets/mint
Authorization: Bearer sk_live_••••

{
  "event_id":  "evt_01HC9F",
  "recipient": "0xA1c4...e8F2",
  "seat":      "A12",
  "section":   "VIP",
  "row":       "A",
  "price_usdc":"180.00"
}`

const MINT_RESPONSE = `{
  "id": "tkt_01HCBE2",
  "tokenId": "1438",
  "ensName": "seat-a12.badbunny-cdmx26.boleto.eth",
  "contractTx": "0x7b…f3a1",
  "status": "minted",
  "issuedAt": "2026-03-01T14:22:38Z"
}`

const PARAMS = [
  ['event_id',   'string',       'Identifier of the event to mint against.'],
  ['recipient',  'string · 0x',  'Recipient wallet. Use your custodial address for white-label.'],
  ['seat',       'string',       'Seat identifier — appears in the ENS subdomain.'],
  ['section',    'string',       'Section name (e.g. "VIP").'],
  ['row',        'string',       'Row identifier.'],
  ['price_usdc', 'decimal',      'Settled price for the royalty calculation.'],
] as const

const ERROR_CODES = [
  ['400 invalid_request',         'Missing or malformed parameter. Body included for inspection.'],
  ['401 unauthenticated',         'Missing / invalid API key.'],
  ['402 payment_required',        'Event invoice unpaid — finish the activation step first.'],
  ['409 idempotency_conflict',    'Same idempotency_key used with different parameters.'],
  ['422 inventory_exhausted',     'No seats left in the requested section.'],
  ['429 rate_limited',            'Too many requests — back off using Retry-After.'],
  ['500 internal_error',          'Server-side bug. Retry idempotently.'],
] as const

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{
      fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400,
      letterSpacing: '-0.015em', color: 'white', margin: '40px 0 12px',
      scrollMarginTop: 80,
    }}>{children}</h2>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14.5, color: 'var(--console-text-dim)', lineHeight: 1.7, marginBottom: 14 }}>{children}</p>
}
function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>{children}</code>
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{
      margin: '8px 0 20px', padding: '14px 16px',
      background: '#070C18',
      border: '1px solid var(--console-line)',
      borderRadius: 8,
      fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
      color: 'rgba(255,255,255,0.85)',
      overflow: 'auto',
    }}>{children}</pre>
  )
}

export default function DocsPage() {
  const [tab, setTab] = useState<'curl' | 'node' | 'python'>('curl')
  const [active, setActive] = useState('quickstart')

  // Update hash on click + reflect active section on hash change.
  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.slice(1)
      if (id) setActive(id)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const sample = tab === 'curl' ? MINT_REQUEST
    : tab === 'node' ? `import { Boleto } from "@boleto/node";\n\nconst boleto = new Boleto(process.env.BOLETO_SK);\n\nawait boleto.tickets.mint({\n  eventId:   "evt_01HC9F",\n  recipient: "0xA1c4...e8F2",\n  seat:      "A12",\n  section:   "VIP",\n  row:       "A",\n  priceUsdc: "180.00",\n});`
    : `from boleto import Boleto\n\nclient = Boleto(api_key=os.environ["BOLETO_SK"])\n\nclient.tickets.mint(\n    event_id="evt_01HC9F",\n    recipient="0xA1c4...e8F2",\n    seat="A12",\n    section="VIP",\n    row="A",\n    price_usdc="180.00",\n)`

  return (
    <AppShell active="docs">
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 380px', minHeight: 'calc(100vh - 56px)' }}>
        {/* Sub-nav */}
        <aside style={{
          padding: '24px 16px',
          borderRight: '1px solid var(--console-line)',
          background: 'var(--console-surface)',
          fontSize: 13,
          position: 'sticky', top: 56, alignSelf: 'start',
          maxHeight: 'calc(100vh - 56px)', overflowY: 'auto',
        }}>
          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--console-text-mute)', marginBottom: 8,
              }}>{section.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(it => {
                  const isActive = it.id === active
                  return (
                    <li key={it.id}>
                      <a
                        href={`#${it.id}`}
                        onClick={() => setActive(it.id)}
                        style={{
                          display: 'block', padding: '6px 10px',
                          borderRadius: 5,
                          background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: isActive ? 'var(--console-text)' : 'var(--console-text-dim)',
                          fontSize: 13,
                        }}
                      >{it.label}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Content */}
        <section style={{ padding: '40px 48px', maxWidth: 760, minWidth: 0 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-400)' }}>API reference</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'white', margin: '8px 0 16px',
          }}>boleto.eth API</h1>
          <P>
            The boleto.eth REST API issues, verifies, and redeems on-chain tickets. Every endpoint accepts JSON, returns JSON,
            and is idempotent on <Code>idempotency_key</Code>.
          </P>

          {/* INTRODUCTION */}
          <H2 id="quickstart">Quickstart</H2>
          <P>Create an event, get an API key, mint your first ticket. The whole loop is three calls.</P>
          <Pre>{`# 1. Create the event (signs USDC fee on activation)
curl -X POST https://api.boleto.eth/v1/events \\
  -H "Authorization: Bearer sk_live_••••" \\
  -d '{"artistSlug":"badbunny","eventSlug":"cdmx26","eventName":"Most Wanted",...}'

# 2. Activate it on-chain
curl -X POST https://api.boleto.eth/v1/events/<invoice_id>/confirm \\
  -H "Authorization: Bearer sk_live_••••" \\
  -d '{"txHash":"0x..."}'

# 3. Mint a ticket
curl -X POST https://api.boleto.eth/v1/tickets/mint \\
  -H "Authorization: Bearer sk_live_••••" \\
  -d '{"event_id":"evt_01HC9F","recipient":"0xA1c4...e8F2","seat":"A12",...}'`}</Pre>

          <H2 id="auth">Authentication</H2>
          <P>
            Pass your secret key as a bearer token on every request. Keys begin with <Code>sk_test_</Code> for sandbox and
            <Code>sk_live_</Code> for production. Never embed a key in browser code — proxy requests through your backend.
          </P>

          <H2 id="modes">Test vs live</H2>
          <P>
            Test keys exercise the full API surface but do not move USDC, register ENS, or mint on mainnet. Use them in CI.
            Live keys touch Ethereum mainnet — every request costs gas-equivalent infrastructure spend, so keep credentials tight.
          </P>

          <H2 id="rate-limits">Rate limits</H2>
          <P>
            100 req/s default per workspace. Bursts up to 500 are absorbed for ~3 seconds. Headers <Code>X-RateLimit-Limit</Code>,
            <Code>X-RateLimit-Remaining</Code>, and <Code>Retry-After</Code> are returned on every call. Email{' '}
            <a href="mailto:support@boleto.eth" style={{ color: 'var(--accent-400)' }}>support@boleto.eth</a> for higher limits.
          </P>

          {/* CORE RESOURCES */}
          <H2 id="events">Events</H2>
          <P>
            An <Code>Event</Code> is the unit of inventory. Creating one provisions an ENS subdomain (<Code>artist-slug.boleto.eth</Code>),
            deploys an ERC-721 collection, and configures royalties. Activation is a single USDC transfer on mainnet.
          </P>

          <H2 id="tickets">Tickets</H2>
          <P>
            A <Code>Ticket</Code> is an ERC-721 NFT minted under an event&apos;s ENS subdomain. Each ticket carries a unique seat
            assignment, an EIP-2981 royalty configuration, and a deterministic on-chain identifier.
          </P>
          <div style={{
            background: 'var(--console-card)', border: '1px solid var(--console-line)',
            borderRadius: 10, overflow: 'hidden', margin: '8px 0 18px',
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
                padding: '12px 16px', alignItems: 'flex-start', fontSize: 13,
                borderBottom: i < PARAMS.length - 1 ? '1px solid var(--console-line)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--console-text)' }}>{p}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-400)' }}>{t}</div>
                <div style={{ color: 'var(--console-text-dim)', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>

          <H2 id="royalties">Royalties</H2>
          <P>
            Every ticket carries an EIP-2981 royalty record. Splits are set on event creation and enforced by all
            EIP-2981-compliant marketplaces (OpenSea, Magic Eden, Blur). Promoter royalty defaults to 1% — set per event 0–10%.
          </P>

          <H2 id="webhooks">Webhooks</H2>
          <P>
            Every state transition (event activated, ticket minted, ticket transferred, ticket redeemed, royalty settled) emits
            a signed webhook. Requests carry an HMAC <Code>X-Boleto-Signature</Code> header so you can verify authenticity.
          </P>

          {/* GUIDES */}
          <H2 id="issuance">Issuance flow</H2>
          <P>
            Issuance is a two-step deploy + mint flow. Activate the event once (one USDC settlement), then mint tickets lazily
            as buyers complete checkout. Gas is paid by buyers via EIP-712 vouchers, or by you in custodial mode.
          </P>

          <H2 id="vouchers">EIP-712 vouchers</H2>
          <P>
            A voucher is a signed message authorizing a single ticket mint. Sign with your operator key, hand the voucher to
            the buyer wallet, the buyer redeems on-chain. No counterfeits — duplicates revert at the contract.
          </P>

          <H2 id="custodial">Custodial wallets</H2>
          <P>
            White-label deployments mint into a custodial address you control, then transfer to the buyer when they connect.
            Buyers never see the word &ldquo;wallet&rdquo; on the happy path.
          </P>

          <H2 id="csv-import">CSV import</H2>
          <P>
            Bulk-load seat inventory from a CSV. One row per seat. Required columns: <Code>seat_number</Code>, <Code>section</Code>,
            <Code>row</Code>, <Code>price_usdc</Code>. Optional: <Code>gate</Code>, <Code>tier</Code>, <Code>notes</Code>.
            50,000 seats validate in under 30 seconds.
          </P>

          {/* REFERENCE */}
          <H2 id="api-v1">API · v1</H2>
          <P>The API is versioned in the URL path. Breaking changes ship under <Code>/v2</Code>; <Code>/v1</Code> remains supported for 24 months after deprecation.</P>

          <H2 id="webhook-events">Webhook events</H2>
          <P>
            <Code>event.activated</Code>, <Code>ticket.minted</Code>, <Code>ticket.transferred</Code>, <Code>ticket.redeemed</Code>,
            <Code>royalty.settled</Code>, <Code>event.completed</Code>.
          </P>

          <H2 id="errors">Errors</H2>
          <div style={{
            background: 'var(--console-card)', border: '1px solid var(--console-line)',
            borderRadius: 10, overflow: 'hidden', margin: '8px 0 20px',
          }}>
            {ERROR_CODES.map(([code, desc], i) => (
              <div key={code} style={{
                display: 'grid', gridTemplateColumns: '220px 1fr',
                padding: '12px 16px', fontSize: 13,
                borderBottom: i < ERROR_CODES.length - 1 ? '1px solid var(--console-line)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--accent-400)' }}>{code}</div>
                <div style={{ color: 'var(--console-text-dim)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          <H2 id="changelog">Changelog</H2>
          <P>
            <Code>v1.2.0</Code> — 2026-05: ENS gateway upgrade, &lt;400ms p95 mint latency.<br />
            <Code>v1.1.0</Code> — 2026-04: EIP-2981 enforcement on Blur, CSV streaming import.<br />
            <Code>v1.0.0</Code> — 2026-02: First production release on Ethereum mainnet.
          </P>
        </section>

        {/* Sticky code panel */}
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--console-text-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            <span>Request</span>
            <button
              onClick={() => navigator.clipboard?.writeText(sample)}
              style={{
                border: '1px solid var(--console-line)', background: 'transparent',
                color: 'var(--console-text-mute)', borderRadius: 4,
                padding: '3px 8px', fontSize: 10.5,
                display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              }}
            ><Icon name="copy" size={11} /> Copy</button>
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

          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--console-text-mute)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Response · 200</div>
          <pre style={{
            margin: '8px 0 0', padding: '14px 16px',
            background: '#070C18',
            border: '1px solid var(--console-line)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.85)',
            overflow: 'auto',
          }}>{MINT_RESPONSE}</pre>

          <div style={{
            marginTop: 16, padding: '10px 12px',
            fontSize: 11.5, color: 'var(--console-text-dim)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--console-line)',
            borderRadius: 8, lineHeight: 1.55,
          }}>
            <span style={{ color: 'var(--accent-400)', fontWeight: 600 }}>200 OK · 384ms · mainnet</span><br />
            Response includes ENS subdomain, on-chain tokenId, and settlement txHash.
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

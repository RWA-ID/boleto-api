'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Icon, PartnerSlot } from '@/components/Icon'
import { CredentialTicket } from '@/components/CredentialTicket'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'
import { ContactForm } from '@/components/ContactForm'

// ────────────────────────────────────────────────
// Section helpers
// ────────────────────────────────────────────────
function SectionEyebrow({ children, color = 'var(--accent-600)' }: { children: React.ReactNode; color?: string }) {
  return <div className="eyebrow" style={{ marginBottom: 14, color }}>{children}</div>
}

// ────────────────────────────────────────────────
// 1. HERO
// ────────────────────────────────────────────────
function Hero() {
  const { locale } = useI18n()
  const headlineEn = 'Ticketing infrastructure for the next decade of live events in Latin America.'
  const headlineEs = 'Infraestructura de boletería para la próxima década de eventos en vivo en Latinoamérica.'
  const subEn = 'Issue tickets as immutable inventory. Capture royalties on every resale. White-label our API or run on the dashboard. The blockchain is the rails — your brand stays on top.'
  const subEs = 'Emite tickets como inventario inmutable. Captura regalías en cada reventa. Marca blanca sobre nuestra API o usa el dashboard. Tu marca al frente, la blockchain por debajo.'

  return (
    <section style={{
      position: 'relative',
      paddingTop: 88, paddingBottom: 96,
      background: 'linear-gradient(180deg, #F8FAF9 0%, #F4F2EC 100%)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(11,18,32,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(11,18,32,0.025) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)',
      }} />

      <div className="container-wide" style={{ position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--ink-100)',
              borderRadius: 100,
              fontSize: 12.5, fontWeight: 500,
              color: 'var(--ink-600)',
              marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-500)' }} />
              <span style={{ color: 'var(--ink-700)' }}>Now serving</span>
              <span style={{ color: 'var(--ink-400)' }}>—</span>
              <span>MX, BR, AR, CL, CO, PE</span>
            </div>

            <h1 className="display-1">{locale === 'es' ? headlineEs : headlineEn}</h1>

            <p className="lede" style={{ marginTop: 28, maxWidth: '54ch' }}>
              {locale === 'es' ? subEs : subEn}
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <Link href="/#contact" className="btn btn-primary btn-lg">
                Talk to sales <Icon name="arrow" size={16} />
              </Link>
              <Link href="/docs" className="btn btn-ghost btn-lg">
                Read the docs
              </Link>
            </div>

            <div style={{
              marginTop: 48,
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
              paddingTop: 24, borderTop: '1px solid var(--ink-100)',
            }}>
              {[
                { value: '99.99%', label: 'Settlement uptime' },
                { value: '<400ms', label: 'Mint latency, p95' },
                { value: 'EIP-2981', label: 'Royalty standard' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--ink-900)' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ transform: 'rotate(-2.2deg)', transformOrigin: 'center' }}>
              <CredentialTicket />
            </div>
            <div style={{
              position: 'absolute', right: -20, top: 40,
              transform: 'rotate(4deg) scale(0.92)', zIndex: -1, opacity: 0.6, filter: 'blur(0.5px)',
            }}>
              <div style={{
                width: 440, height: 260, background: '#fff', border: '1px solid #E4E2D9',
                borderRadius: 14, boxShadow: '0 20px 50px -20px rgba(11,18,32,0.15)',
              }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 2. LOGO STRIP
// ────────────────────────────────────────────────
function LogoStrip() {
  return (
    <section style={{ padding: '48px 0', borderBottom: '1px solid var(--ink-100)', background: 'var(--paper)' }}>
      <div className="container-wide">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--ink-400)', textTransform: 'uppercase' }}>
            Trusted by ticketing teams across LATAM
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <PartnerSlot>Logo slot {i + 1}</PartnerSlot>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 3. THE PLATFORM — three layers
// ────────────────────────────────────────────────
function PlatformLayers() {
  const layers = [
    {
      name: 'Contracts', runtime: 'Ethereum L1', icon: 'contract' as const,
      desc: 'Solidity contracts handle ENS subdomain registration, ERC-721 ticket minting, and ERC-2981 royalty splits. Audited, immutable, and public on Etherscan.',
      bullets: ['BoletoTickets — ERC-721 + ERC-2981', 'EventRegistry — ENS NameWrapper', 'Splitter — protocol + promoter payouts'],
    },
    {
      name: 'API', runtime: 'REST · JSON · OpenAPI', icon: 'api' as const,
      desc: 'A single REST surface for issuance, verification, redemption, and webhooks. Idempotent requests, EIP-712 gasless minting vouchers, language-agnostic SDKs.',
      bullets: ['POST /events — register & deploy', 'POST /tickets/mint — issue inventory', 'POST /tickets/verify — gate-side check'],
    },
    {
      name: 'Dashboard', runtime: 'Operator console', icon: 'dashboard' as const,
      desc: 'A no-code surface for organizers: create events, upload seat CSVs, monitor real-time inventory, run venue check-in, reconcile royalty payouts.',
      bullets: ['Event wizard & CSV seat import', 'Live mint monitor & redemption log', 'Royalty + payout reporting'],
    },
  ]
  return (
    <section style={{ padding: '120px 0', background: 'var(--paper)' }}>
      <div className="container-wide">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <SectionEyebrow>The platform</SectionEyebrow>
          <h2 className="display-1" style={{ fontSize: 'clamp(36px, 3.8vw, 56px)' }}>
            Three layers. One contract surface. Yours to white-label.
          </h2>
          <p className="lede" style={{ marginTop: 18 }}>
            We run the cryptographic primitives so your team doesn&apos;t have to. You ship the buyer experience.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {layers.map((l, i) => (
            <div key={l.name} className="card" style={{ padding: 28, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent-50)', color: 'var(--accent-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(226,88,34,0.2)', flexShrink: 0,
                }}>
                  <Icon name={l.icon} size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--ink-400)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Layer 0{i + 1}</div>
                  <div className="h4" style={{ marginTop: 2, whiteSpace: 'nowrap' }}>{l.name}</div>
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11.5,
                color: 'var(--ink-500)', padding: '4px 8px',
                background: 'var(--ink-75)', borderRadius: 4,
                display: 'inline-block', marginBottom: 14, whiteSpace: 'nowrap',
              }}>{l.runtime}</div>
              <p style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.6, margin: '0 0 18px' }}>{l.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {l.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                    <Icon name="check" size={14} style={{ color: 'var(--accent-600)', marginTop: 3 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 4. FOR TICKETING PLATFORMS
// ────────────────────────────────────────────────
const CURL_EXAMPLE = `curl -X POST https://api.boleto.eth/v1/tickets/mint \\
  -H "Authorization: Bearer sk_live_••••WnAq" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_id":  "evt_01HC9F",
    "recipient": "0xA1c4...e8F2",
    "seat":      "A12",
    "section":   "VIP",
    "row":       "A",
    "price_usdc": "180.00"
  }'`

const NODE_EXAMPLE = `import { Boleto } from "@boleto/node";

const boleto = new Boleto(process.env.BOLETO_SK);

const ticket = await boleto.tickets.mint({
  eventId:   "evt_01HC9F",
  recipient: buyerWallet,
  seat:      "A12",
  section:   "VIP",
  row:       "A",
  priceUsdc: "180.00",
});

// ticket.tokenId        → "1438"
// ticket.ensName        → "seat-a12.badbunny-cdmx26.boleto.eth"
// ticket.contractTx     → "0x7…"`

const PYTHON_EXAMPLE = `from boleto import Boleto

client = Boleto(api_key=os.environ["BOLETO_SK"])

ticket = client.tickets.mint(
    event_id="evt_01HC9F",
    recipient=buyer_wallet,
    seat="A12",
    section="VIP",
    row="A",
    price_usdc="180.00",
)`

function ForPlatforms() {
  const [tab, setTab] = useState<'curl' | 'node' | 'python'>('curl')
  const code = tab === 'curl' ? CURL_EXAMPLE : tab === 'node' ? NODE_EXAMPLE : PYTHON_EXAMPLE
  return (
    <section id="platforms" style={{ padding: '120px 0', background: '#0B1220', color: 'rgba(255,255,255,0.85)' }}>
      <div className="container-wide">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>For ticketing platforms</div>
            <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.4vw, 52px)', color: 'white' }}>
              An API your engineers can integrate before lunch.
            </h2>
            <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)', maxWidth: '50ch' }}>
              Wire boleto.eth in as the inventory and royalty backend. Keep your checkout, your branding, your seat map. We handle issuance, identity, and on-chain settlement.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '32px 0 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                ['White-label issuance', 'Your buyer never sees the word "wallet". We mint to a custodial address you control, transfer on demand.'],
                ['Idempotent + signed webhooks', 'Every state transition (mint, transfer, redeem, royalty) signed and replayable. No reconciliation drift.'],
                ['Time-to-integration', '~2 days to sandbox, ~10 days to first event in production. Reference customer averages.'],
              ].map(([title, body]) => (
                <li key={title} style={{ display: 'flex', gap: 14 }}>
                  <div style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                    background: 'rgba(226,88,34,0.15)', color: 'var(--accent-400)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                  }}>
                    <Icon name="check" size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'white', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{body}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/docs" className="btn btn-ghost" style={{ marginTop: 36, color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}>
              Read the integration guide <Icon name="arrow" size={15} />
            </Link>
          </div>

          <div style={{
            background: '#070C18', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {(['curl', 'node', 'python'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '14px 16px',
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'transparent',
                  color: tab === t ? 'var(--accent-400)' : 'rgba(255,255,255,0.4)',
                  borderBottom: tab === t ? '2px solid var(--accent-500)' : '2px solid transparent',
                  border: 'none', borderRadius: 0, cursor: 'pointer', fontWeight: 600,
                }}>{t === 'curl' ? 'cURL' : t === 'node' ? 'Node' : 'Python'}</button>
              ))}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', borderRadius: 5,
                  padding: '4px 9px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <Icon name="copy" size={12} /> Copy
                </button>
              </div>
            </div>
            <pre style={{
              margin: 0, padding: '24px 28px',
              fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.65,
              color: 'rgba(255,255,255,0.88)', overflow: 'auto', maxHeight: 380,
            }}>{code}</pre>
            <div style={{
              padding: '12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11.5, fontFamily: 'var(--font-mono)',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>200 OK · 384ms · mainnet</span>
              <span>← response includes ENS, tokenId, txHash</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 5. FOR EVENT ORGANIZERS
// ────────────────────────────────────────────────
function ForOrganizers() {
  return (
    <section id="organizers" style={{ padding: '120px 0', background: 'var(--paper)' }}>
      <div className="container-wide">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 80, alignItems: 'center' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--sh-3)' }}>
            <div style={{ background: '#0A0F1A', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                app.boleto.eth/events/badbunny-cdmx26
              </span>
            </div>
            <div style={{ background: '#0A0F1A', padding: 24, color: 'var(--console-text)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--console-text-mute)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                    badbunny-cdmx26.boleto.eth
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: '#fff', letterSpacing: '-0.015em' }}>
                    Bad Bunny — Most Wanted Tour
                  </div>
                </div>
                <span className="chip chip-success">
                  <span className="chip-dot" /> On sale
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  ['Inventory', '65,000'],
                  ['Minted', '42,318'],
                  ['Royalties', '$8,432'],
                  ['Scan-ins', '0'],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: 12, background: 'var(--console-card)', borderRadius: 8, border: '1px solid var(--console-line)' }}>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--console-text-mute)' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{
                height: 80, display: 'flex', alignItems: 'flex-end', gap: 3,
                padding: 8, background: 'var(--console-card)',
                border: '1px solid var(--console-line)', borderRadius: 8,
              }}>
                {[18, 24, 32, 28, 41, 52, 64, 58, 70, 52, 44, 38, 30, 24].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`,
                    background: i === 8 ? 'var(--accent-500)' : 'rgba(226,88,34,0.35)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--console-text-mute)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Hourly mints — last 14h</span>
                <span>Peak: 70 mints/hr · 14:00 CST</span>
              </div>
            </div>
          </div>

          <div>
            <SectionEyebrow>For event organizers</SectionEyebrow>
            <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.4vw, 52px)' }}>
              Run your event like a Stripe dashboard, not a wallet app.
            </h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Upload a seat CSV. Set royalty splits. Watch inventory deplete in real time. Scan tickets at the gate from any phone. Reconcile payouts in one screen. No crypto vocabulary required.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 36 }}>
              {[
                { i: 'upload' as const,  t: 'CSV seat import',     b: '50,000 seats imported in <30s. Drag, drop, deploy.' },
                { i: 'scan' as const,    t: 'Phone-based scanner', b: 'No app install. Works on any browser at the gate.' },
                { i: 'receipt' as const, t: 'Royalty payouts',     b: 'Hardcoded splits, automatic settlement, audit log.' },
                { i: 'shield' as const,  t: 'Fraud reduction',     b: 'Counterfeit-proof inventory, immutable redemption log.' },
              ].map(item => (
                <div key={item.t} style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 7,
                    background: 'var(--ink-75)', color: 'var(--ink-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid var(--ink-100)',
                  }}>
                    <Icon name={item.i} size={16} />
                  </div>
                  <div>
                    <div className="h4" style={{ fontSize: 15, marginBottom: 3 }}>{item.t}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.5 }}>{item.b}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/events" className="btn btn-secondary" style={{ marginTop: 36 }}>
              Open the operator console <Icon name="arrow" size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 6. WHY ON-CHAIN MATTERS
// ────────────────────────────────────────────────
function WhyOnChain() {
  const items = [
    { tag: 'Fraud',   t: 'Counterfeit-proof inventory',         b: 'Each ticket is a cryptographically unique credential. Duplication is mathematically impossible — not a marketing claim.' },
    { tag: 'Revenue', t: 'Programmatic royalty enforcement',    b: 'Your cut of every resale settles at the protocol level via ERC-2981. No scraper, no marketplace deals, no leakage.' },
    { tag: 'CX',      t: 'Portable buyer identity',             b: 'ENS subdomains mean a buyer’s ticket history follows them across platforms — useful for VIP perks, abuse prevention, and loyalty.' },
    { tag: 'Audit',   t: 'Permanent audit trail',               b: 'Every mint, transfer, and redemption is recorded on Ethereum L1 — verifiable by your CFO, your auditor, or a regulator.' },
  ]
  return (
    <section style={{ padding: '120px 0', background: '#F4F2EC' }}>
      <div className="container-wide">
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
          <SectionEyebrow>The substrate</SectionEyebrow>
          <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.4vw, 52px)' }}>
            Four things on-chain rails buy you. None of them require your team to care about crypto.
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
          background: 'var(--ink-100)', border: '1px solid var(--ink-100)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {items.map(i => (
            <div key={i.t} style={{ background: 'var(--paper-card)', padding: 36 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--accent-600)', marginBottom: 14,
              }}>{i.tag}</div>
              <h3 className="h3" style={{ marginBottom: 12 }}>{i.t}</h3>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-500)', lineHeight: 1.6 }}>{i.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 7. PRICING
// ────────────────────────────────────────────────
function Pricing() {
  const tiers = [
    {
      name: 'Standard', range: '1 – 999 tickets / event',
      price: '$0.35', unit: 'per ticket issued',
      audience: 'Small venues & independent promoters',
      features: ['REST API + dashboard', 'Email support', 'Standard ENS subdomain', 'EIP-2981 royalties', 'Etherscan verified contracts'],
      cta: 'Get Started', ctaHref: '/create-event', ctaStyle: 'ghost' as const, popular: false,
    },
    {
      name: 'Pro', range: '1,000 – 9,999 tickets / event',
      price: '$0.25', unit: 'per ticket issued',
      audience: 'Festivals, regional tours, mid-size venues',
      features: ['Everything in Standard', 'Webhook delivery SLA', 'Priority Slack support', 'Custom royalty splits', 'Multi-event organization roles'],
      cta: 'Get Started', ctaHref: '/create-event', ctaStyle: 'primary' as const, popular: true,
    },
    {
      name: 'Enterprise', range: '10,000+ tickets / event',
      price: '$0.15', unit: 'per ticket issued',
      audience: 'Ticketing platforms & arena operators',
      features: ['Everything in Pro', 'White-label API + custodial', 'Dedicated environment', '99.99% uptime SLA + indemnity', 'In-region support · MX, BR, AR'],
      cta: 'Talk to sales', ctaHref: '/#contact', ctaStyle: 'secondary' as const, popular: false,
    },
  ]
  return (
    <section id="pricing" style={{ padding: '120px 0', background: 'var(--paper)' }}>
      <div className="container-wide">
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.4vw, 52px)' }}>
            One upfront fee. Your ticket revenue stays 100% yours.
          </h2>
          <p className="lede" style={{ marginTop: 18, marginLeft: 'auto', marginRight: 'auto' }}>
            We charge per ticket issued, not per ticket sold. Resale royalties settle directly to your wallet.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {tiers.map(t => (
            <div key={t.name} className="card" style={{
              padding: 32, position: 'relative',
              borderColor: t.popular ? 'var(--accent-500)' : 'var(--ink-100)',
              boxShadow: t.popular ? '0 0 0 1px var(--accent-500), 0 18px 40px -16px rgba(226,88,34,0.25)' : 'var(--sh-1)',
            }}>
              {t.popular && (
                <div style={{
                  position: 'absolute', top: -11, left: 24,
                  background: 'var(--accent-500)', color: 'white',
                  padding: '3px 10px', borderRadius: 4,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>Most events</div>
              )}
              <div className="h3" style={{ marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>{t.range}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 400,
                  letterSpacing: '-0.04em', color: 'var(--ink-900)', lineHeight: 1,
                }}>{t.price}</span>
                <span style={{ fontSize: 14, color: 'var(--ink-400)' }}>USDC</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 20 }}>{t.unit}</div>
              <div style={{
                padding: '10px 12px', background: 'var(--ink-75)',
                borderRadius: 6, fontSize: 12.5, color: 'var(--ink-600)', marginBottom: 24,
              }}>{t.audience}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--ink-700)', lineHeight: 1.5 }}>
                    <Icon name="check" size={14} style={{ color: 'var(--accent-600)', marginTop: 4 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={t.ctaHref} className={`btn btn-${t.ctaStyle}`} style={{ width: '100%' }}>
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: 'var(--ink-400)' }}>
          Royalty split is set per event (0–10% promoter + 1% protocol). Settle in USDC, USDT, or EURC on mainnet.
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 8. SECURITY & COMPLIANCE
// ────────────────────────────────────────────────
function Security() {
  const items = [
    { tag: 'AUDIT',      t: 'Contract audit roadmap', b: 'Third-party audit engaged with Spearbit pre-mainnet. Reports will be published in full. Bug bounty live on Immunefi at launch.' },
    { tag: 'STANDARD',   t: 'EIP-2981 royalty',       b: 'Industry-standard royalty interface, enforced by OpenSea, Magic Eden, Blur and major LATAM exchanges.' },
    { tag: 'KMS',        t: 'Key management',         b: 'Promoter keys via WalletConnect; custodial-mode keys held in AWS Nitro Enclaves with multi-party signing. Hot keys rotate automatically.' },
    { tag: 'PROOF',      t: 'On-chain verifiability', b: 'Every issuance and redemption verifiable from Etherscan. No backend trust required to prove buyer authenticity.' },
    { tag: 'COMPLIANCE', t: 'SOC 2 — planned',        b: 'On the roadmap with Vanta once volume warrants it. Until then we ship the same controls and publish our security posture openly.' },
    { tag: 'RESIDENCY',  t: 'Regional residency',     b: 'Operator metadata stored in-region where required (MX, BR, AR). On-chain data is by definition portable.' },
  ]
  return (
    <section id="security" style={{ padding: '120px 0', background: 'var(--ink-900)', color: 'rgba(255,255,255,0.85)' }}>
      <div className="container-wide">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 80, alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Security &amp; compliance</div>
            <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.4vw, 50px)', color: 'white' }}>
              The audit and compliance story, in plain English.
            </h2>
            <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', maxWidth: '46ch' }}>
              The boring parts your in-house counsel will want to read. Here&apos;s where we are today, and where we&apos;re going.
            </p>
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--accent-400)' }}>
                <Icon name="external" size={14} /> View contracts on Etherscan
              </a>
              <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--accent-400)' }}>
                <Icon name="external" size={14} /> Read the integration docs
              </Link>
              <Link href="/#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--accent-400)' }}>
                <Icon name="external" size={14} /> Request audit reports
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {items.map(item => (
              <div key={item.t} style={{
                padding: 24,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.16em', color: 'var(--accent-400)', marginBottom: 12 }}>{item.tag}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 6 }}>{item.t}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{item.b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 9. CASE STUDY (placeholder)
// ────────────────────────────────────────────────
function CaseStudy() {
  return (
    <section style={{ padding: '120px 0', background: 'var(--paper)' }}>
      <div className="container-wide">
        <div style={{
          padding: 64,
          background: 'linear-gradient(180deg, #FAFAF7 0%, #F4F2EC 100%)',
          borderRadius: 20, border: '1px dashed var(--ink-200)', textAlign: 'center',
        }}>
          <div className="eyebrow" style={{ color: 'var(--ink-400)', marginBottom: 14 }}>Case study · placeholder</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400,
            letterSpacing: '-0.02em', color: 'var(--ink-700)',
            maxWidth: 640, margin: '0 auto', lineHeight: 1.25,
          }}>
            &ldquo;First reference customer pull-quote goes here — a one-sentence outcome paired with an attributed name + title.&rdquo;
          </div>
          <div style={{ marginTop: 24, fontSize: 13.5, color: 'var(--ink-400)' }}>
            ATTRIBUTION · Title · Company · Logo slot
          </div>
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// 10. FINAL CTA + CONTACT
// ────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '120px 0 80px', background: 'var(--paper)' }}>
      <div className="container-wide" style={{ maxWidth: 980 }}>
        <div className="card" style={{ padding: 64, textAlign: 'center', borderRadius: 20 }}>
          <h2 className="display-1" style={{ fontSize: 'clamp(34px, 3.6vw, 56px)' }}>
            Ready to issue your first event?
          </h2>
          <p className="lede" style={{ marginTop: 18, marginLeft: 'auto', marginRight: 'auto' }}>
            A 30-minute call with our team. We&apos;ll scope the integration, run the cost model, and send a key the same day.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <Link href="/create-event" className="btn btn-primary btn-lg">
              Get Started <Icon name="arrow" size={15} />
            </Link>
            <Link href="/docs" className="btn btn-ghost btn-lg">
              Read the docs
            </Link>
          </div>
          <div style={{ marginTop: 28, fontSize: 12.5, color: 'var(--ink-400)' }}>
            Or book directly · <Link href="/#contact" style={{ color: 'var(--accent-600)' }}>schedule a call →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" style={{ padding: '80px 0 120px', background: 'var(--paper)' }}>
      <div className="container-wide" style={{ maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <SectionEyebrow>Contact</SectionEyebrow>
          <h2 className="display-1" style={{ fontSize: 'clamp(30px, 3vw, 44px)' }}>
            Talk to the team.
          </h2>
          <p className="lede" style={{ marginTop: 14, marginLeft: 'auto', marginRight: 'auto' }}>
            Tell us about your event or platform and we&apos;ll be in touch within one business day.
          </p>
        </div>
        <div className="card" style={{ padding: 40 }}>
          <ContactForm />
        </div>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────
// LANDING
// ────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main style={{ background: 'var(--paper)' }}>
        <Hero />
        <LogoStrip />
        <PlatformLayers />
        <ForPlatforms />
        <ForOrganizers />
        <WhyOnChain />
        <Pricing />
        <Security />
        <CaseStudy />
        <FinalCTA />
        <ContactSection />
      </main>
      <MarketingFooter />
    </>
  )
}

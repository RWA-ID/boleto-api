'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_BASE = 'https://boleto-api-production.up.railway.app'
const CONTRACT = '0x9650d442779368e0A039351eD7c75c3E93de372D'

// ── Types ─────────────────────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PATCH'

interface Endpoint {
  id:       string
  method:   Method
  path:     string
  title:    string
  auth:     boolean
  desc:     string
  body?:    string
  response: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    id:     'create-event',
    method: 'POST',
    path:   '/v1/events',
    title:  'Create Event',
    auth:   false,
    desc:   'Create a new event and upload ticket inventory. Returns an invoice with fee amount and payment address. Pay the USDC fee to the payment address then call /confirm to activate.',
    body: `{
  "artistSlug":     "badbunny",
  "eventSlug":      "miami25",
  "promoterWallet": "0xYOUR_WALLET",
  "eventName":      "Bad Bunny — Miami 2025",
  "eventDate":      "2025-12-01",
  "imageUri":       "ipfs://...",
  "tickets": [
    {
      "seat_number": "A-101",
      "price_usdc":  "150.00",
      "section":     "Floor VIP",
      "row":         "A",
      "gate":        "1"
    }
  ]
}`,
    response: `{
  "invoiceId":      "inv_a1b2c3d4",
  "ensName":        "badbunny-miami25.boleto.eth",
  "ticketCount":    1,
  "feeDue":         "0.35",
  "paymentAddress": "0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b",
  "status":         "pending_payment",
  "expiresAt":      "2025-01-02T00:00:00.000Z"
}`,
  },
  {
    id:     'confirm',
    method: 'POST',
    path:   '/v1/events/:invoiceId/confirm',
    title:  'Activate Event',
    auth:   false,
    desc:   'Verify USDC payment and activate the event. Registers the ENS subdomain (artist-event.boleto.eth) and the event on the BoletoTickets contract. Issues an API key for the promoter wallet (one per wallet).',
    body: `{ "txHash": "0xYOUR_USDC_PAYMENT_TX_HASH" }`,
    response: `{
  "eventId":         "uuid",
  "ensName":         "badbunny-miami25.boleto.eth",
  "contractAddress": "${CONTRACT}",
  "onChainEventId":  "0x...",
  "ensTxHash":       "0x...",
  "status":          "active",
  "apiKey":          "blt_...",
  "apiKeyNote":      "Save this API key — it will not be shown again."
}`,
  },
  {
    id:     'get-event',
    method: 'GET',
    path:   '/v1/events/:id',
    title:  'Get Event',
    auth:   false,
    desc:   'Fetch event details. The :id parameter accepts a UUID, invoiceId, or full ENS name (e.g. badbunny-miami25.boleto.eth).',
    response: `{
  "id":             "uuid",
  "ensName":        "badbunny-miami25.boleto.eth",
  "eventName":      "Bad Bunny — Miami 2025",
  "status":         "active",
  "totalTickets":   50000,
  "promoterWallet": "0x...",
  "onChainEventId": "0x...",
  "eventDate":      "2025-12-01T00:00:00.000Z",
  "imageUri":       "ipfs://..."
}`,
  },
  {
    id:     'list-events',
    method: 'GET',
    path:   '/v1/events',
    title:  'List My Events',
    auth:   true,
    desc:   'Returns all events for the authenticated promoter wallet, ordered by creation date.',
    response: `{
  "promoterName": "Live Nation Latin America",
  "bannerUri":    "https://...",
  "events": [
    {
      "id":           "uuid",
      "eventName":    "Bad Bunny — Miami 2025",
      "ensName":      "badbunny-miami25.boleto.eth",
      "status":       "active",
      "totalTickets": 50000,
      "eventDate":    "2025-12-01T00:00:00.000Z"
    }
  ]
}`,
  },
  {
    id:     'inventory',
    method: 'GET',
    path:   '/v1/events/:eventId/inventory',
    title:  'Get Ticket Inventory',
    auth:   true,
    desc:   'Returns the full ticket inventory for an event including mint status, token IDs, and owner wallets. Use this to power your seat map UI.',
    response: `{
  "eventId":         "uuid",
  "ensName":         "badbunny-miami25.boleto.eth",
  "contractAddress": "${CONTRACT}",
  "totalTickets":    50000,
  "minted":          1240,
  "available":       48760,
  "tickets": [
    {
      "id":          "uuid",
      "seatNumber":  "A-101",
      "priceUsdc":   "150.00",
      "minted":      true,
      "tokenId":     "42",
      "ownerWallet": "0xBUYER",
      "metadataUri": "ipfs://...",
      "qrCodeUri":   "ipfs://...",
      "mintTxHash":  "0x..."
    }
  ]
}`,
  },
  {
    id:     'voucher',
    method: 'POST',
    path:   '/v1/events/:eventId/voucher',
    title:  'Generate Voucher',
    auth:   true,
    desc:   'Generate an EIP-712 signed voucher for a buyer after they purchase. The buyer submits this voucher directly to mintWithVoucher() on the contract from their own wallet. They pay their own gas (~$0.50–$2.00). Metadata is uploaded to IPFS and cached on first call.',
    body: `{
  "seatNumber":  "A-101",
  "buyerWallet": "0xBUYER_WALLET"
}`,
    response: `{
  "contractAddress": "${CONTRACT}",
  "eventId":         "0x...",
  "to":              "0xBUYER_WALLET",
  "seatNumber":      "A-101",
  "tokenUri":        "ipfs://...",
  "signature":       "0x...",
  "ensName":         "badbunny-miami25.boleto.eth",
  "eventName":       "Bad Bunny — Miami 2025",
  "qrCodeUri":       "ipfs://..."
}`,
  },
  {
    id:     'mint',
    method: 'POST',
    path:   '/v1/events/:eventId/mint',
    title:  'Mint Ticket (Backend)',
    auth:   true,
    desc:   'Mint a ticket directly from the backend on behalf of a buyer. Use this for a gasless buyer experience where the platform absorbs the gas cost. Also registers the seat ENS subdomain (seat-id.event.boleto.eth) owned by the buyer.',
    body: `{
  "seatNumber": "A-101",
  "toWallet":   "0xBUYER_WALLET"
}`,
    response: `{
  "tokenId":     "42",
  "txHash":      "0x...",
  "seatNumber":  "A-101",
  "seatEnsName": "a-101.badbunny-miami25.boleto.eth",
  "ensName":     "badbunny-miami25.boleto.eth",
  "metadataUri": "ipfs://...",
  "qrCodeUri":   "ipfs://...",
  "ownerWallet": "0xBUYER_WALLET"
}`,
  },
  {
    id:     'profile-get',
    method: 'GET',
    path:   '/v1/profile',
    title:  'Get Profile',
    auth:   true,
    desc:   'Fetch your promoter profile including display name and banner image.',
    response: `{
  "id":            "uuid",
  "promoterName":  "Live Nation Latin America",
  "bannerUri":     "https://...",
  "walletAddress": "0x..."
}`,
  },
  {
    id:     'profile-patch',
    method: 'PATCH',
    path:   '/v1/profile',
    title:  'Update Profile',
    auth:   true,
    desc:   'Update your promoter display name and/or banner image. Both fields are optional.',
    body: `{
  "promoterName": "Live Nation Latin America",
  "bannerUri":    "https://your-banner.jpg"
}`,
    response: `{ "success": true, "promoterName": "Live Nation Latin America" }`,
  },
]

const SECTIONS = [
  { id: 'overview',   label: 'Overview'    },
  { id: 'auth',       label: 'Auth'        },
  { id: 'contracts',  label: 'Contracts'   },
  { id: 'endpoints',  label: 'Endpoints'   },
  { id: 'metadata',   label: 'NFT Metadata'},
  { id: 'integration',label: 'Integration' },
]

// ── Components ────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<Method, string> = {
  GET:   'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20',
  POST:  'bg-[#E25822]/10 text-[#E25822] border border-[#E25822]/20',
  PATCH: 'bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20',
}

function Badge({ method }: { method: Method }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${METHOD_COLORS[method]}`}>
      {method}
    </span>
  )
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative group">
      <pre className="bg-[#0A0F1A] border border-[#131C30] rounded-lg p-4 text-xs font-mono text-[#E8ECF3] overflow-x-auto whitespace-pre">
        {code}
      </pre>
      <button onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 bg-[#1F2A44] text-[#8B95AB] text-xs font-mono rounded opacity-0 group-hover:opacity-100 hover:text-[#E8ECF3] transition-all">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false)
  return (
    <div id={ep.id} className="bg-[#131C30] border border-[#1F2A44] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#131C30] transition-colors">
        <Badge method={ep.method} />
        <code className="text-sm font-mono text-[#E8ECF3] flex-1">{ep.path}</code>
        {ep.auth && (
          <span className="text-xs text-[#8B95AB] font-mono border border-[#1F2A44] px-2 py-0.5 rounded">
            🔑 Auth
          </span>
        )}
        <span className="text-[#E25822] font-bold text-lg leading-none">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-[#1F2A44] p-5 space-y-4">
          <p className="text-sm text-[#9CA3AF]">{ep.desc}</p>

          {ep.body && (
            <div className="space-y-1">
              <p className="text-xs text-[#5E6A85] font-mono uppercase tracking-wider">Request Body</p>
              <CodeBlock code={ep.body} />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-[#5E6A85] font-mono uppercase tracking-wider">Response</p>
            <CodeBlock code={ep.response} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  function scrollTo(id: string) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="min-h-screen bg-[#0A0F1A] text-[#E8ECF3]">
      {/* Nav */}
      <nav className="border-b border-[#1F2A44] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0F1A] z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-[#E25822] font-bold">boleto.eth</Link>
          <span className="text-[#2B395C]">/</span>
          <span className="text-[#E8ECF3]">API Docs</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/RWA-ID/boleto-api" target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#8B95AB] hover:text-[#E8ECF3] font-mono transition-colors">
            GitHub →
          </a>
          <Link href="/create-event"
            className="px-3 py-1.5 bg-[#E25822] text-white rounded-lg text-xs font-mono font-bold hover:bg-[#C24A1E] transition-colors">
            Get API Key
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                  activeSection === s.id
                    ? 'bg-[#E25822]/10 text-[#E25822]'
                    : 'text-[#8B95AB] hover:text-[#E8ECF3]'
                }`}>
                {s.label}
              </button>
            ))}
            <div className="pt-4 border-t border-[#1F2A44] space-y-1">
              <p className="text-xs text-[#5E6A85] font-mono px-3 pb-1">Endpoints</p>
              {ENDPOINTS.map((ep) => (
                <button key={ep.id} onClick={() => { setActiveSection('endpoints'); document.getElementById(ep.id)?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="w-full text-left px-3 py-1.5 rounded text-xs font-mono text-[#5E6A85] hover:text-[#E8ECF3] transition-colors flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${ep.method === 'GET' ? 'text-[#22c55e]' : ep.method === 'POST' ? 'text-[#E25822]' : 'text-[#a78bfa]'}`}>
                    {ep.method}
                  </span>
                  {ep.title}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-16 min-w-0">

          {/* Overview */}
          <section id="overview" className="space-y-4">
            <h1 className="font-mono text-3xl font-bold">API Reference</h1>
            <p className="text-[#9CA3AF] leading-relaxed">
              boleto.eth is a Web3 ticketing protocol that issues permanent ENS subdomain identities and ERC-721 NFT tickets for events.
              Platforms integrate via REST API — no smart contract knowledge required.
            </p>
            <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-2">
              <p className="text-xs text-[#5E6A85] font-mono uppercase tracking-wider">Base URL</p>
              <CodeBlock code={API_BASE} lang="text" />
            </div>
          </section>

          {/* Auth */}
          <section id="auth" className="space-y-4">
            <h2 className="font-mono text-xl font-bold">Authentication</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Protected endpoints require an API key in the Authorization header.
              API keys are issued automatically when you activate your first event — one key per promoter wallet.
            </p>
            <CodeBlock code={`Authorization: Bearer blt_your_api_key_here`} lang="http" />
            <div className="bg-[#E25822]/5 border border-[#E25822]/20 rounded-xl p-4">
              <p className="text-sm text-[#E25822] font-mono font-bold mb-1">Save your API key</p>
              <p className="text-xs text-[#9CA3AF]">
                Your API key is only shown once when you activate your first event. Store it securely.
                If lost, contact support with your promoter wallet address.
              </p>
            </div>
          </section>

          {/* Contracts */}
          <section id="contracts" className="space-y-4">
            <h2 className="font-mono text-xl font-bold">Smart Contracts</h2>
            <div className="space-y-3">
              {[
                { label: 'BoletoTickets (Ethereum Mainnet)', value: CONTRACT, link: `https://etherscan.io/address/${CONTRACT}` },
                { label: 'Platform Treasury', value: '0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b', link: null },
              ].map(({ label, value, link }) => (
                <div key={label} className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#8B95AB] mb-1">{label}</p>
                    <p className="font-mono text-sm text-[#E8ECF3] break-all">{value}</p>
                  </div>
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#E25822] font-mono flex-shrink-0 hover:underline">
                      Etherscan →
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#5E6A85] font-mono uppercase tracking-wider">mintWithVoucher() — buyer self-mint</p>
              <CodeBlock code={`// Solidity interface
function mintWithVoucher(
  bytes32 eventId,    // from /voucher response
  address to,         // buyer wallet
  string  seatNumber, // from /voucher response
  string  tokenUri,   // from /voucher response
  bytes   signature   // from /voucher response
) external`} lang="solidity" />
            </div>
          </section>

          {/* Endpoints */}
          <section id="endpoints" className="space-y-4">
            <h2 className="font-mono text-xl font-bold">Endpoints</h2>
            <div className="space-y-3">
              {ENDPOINTS.map((ep) => <EndpointCard key={ep.id} ep={ep} />)}
            </div>
          </section>

          {/* NFT Metadata */}
          <section id="metadata" className="space-y-4">
            <h2 className="font-mono text-xl font-bold">NFT Metadata</h2>
            <p className="text-[#9CA3AF] text-sm">
              Each ticket NFT follows the OpenSea metadata standard. Metadata is generated and pinned to IPFS
              automatically when the first voucher or mint is requested for a seat.
              All CSV columns you provide at event creation are included as NFT traits.
            </p>
            <CodeBlock code={`{
  "name":          "Bad Bunny — Miami 2025 — Seat A-101",
  "description":   "Official boleto.eth ticket for Bad Bunny — Miami 2025",
  "image":         "ipfs://<your_event_banner>",
  "animation_url": "ipfs://<qr_code_png>",
  "attributes": [
    { "trait_type": "ENS Name",   "value": "badbunny-miami25.boleto.eth" },
    { "trait_type": "Event",      "value": "Bad Bunny — Miami 2025" },
    { "trait_type": "Seat",       "value": "A-101" },
    { "trait_type": "Section",    "value": "Floor VIP" },
    { "trait_type": "Row",        "value": "A" },
    { "trait_type": "Gate",       "value": "1" }
  ]
}`} />
            <p className="text-xs text-[#5E6A85]">
              The <code className="text-[#E8ECF3]">animation_url</code> is a scannable QR code PNG that links to the boleto.eth verification page.
              On OpenSea, this displays when a buyer interacts with their ticket.
            </p>
          </section>

          {/* Integration */}
          <section id="integration" className="space-y-6">
            <h2 className="font-mono text-xl font-bold">Platform Integration</h2>
            <p className="text-[#9CA3AF] text-sm">
              boleto.eth is designed as a backend rail. Platforms keep their own UX — buyers never leave your app.
            </p>

            <div className="space-y-3">
              {[
                {
                  step: '1',
                  title: 'Create event + upload seats',
                  code: `const res = await fetch('${API_BASE}/v1/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    artistSlug: 'badbunny', eventSlug: 'miami25',
    promoterWallet: '0xYOUR_WALLET',
    eventName: 'Bad Bunny — Miami 2025',
    tickets: csvRows   // your seat inventory
  })
})
const { invoiceId, feeDue, paymentAddress } = await res.json()
// Send feeDue USDC to paymentAddress, then call /confirm`,
                },
                {
                  step: '2',
                  title: 'Pull inventory for your seat map',
                  code: `const { tickets } = await fetch(
  \`${API_BASE}/v1/events/\${eventId}/inventory\`,
  { headers: { Authorization: \`Bearer \${API_KEY}\` } }
).then(r => r.json())

// tickets[] has: seatNumber, priceUsdc, minted, ownerWallet
// Render in your own seat map UI`,
                },
                {
                  step: '3a',
                  title: 'On purchase — voucher (buyer pays gas)',
                  code: `// After buyer pays on your platform:
const voucher = await fetch(
  \`${API_BASE}/v1/events/\${eventId}/voucher\`,
  {
    method: 'POST',
    headers: { Authorization: \`Bearer \${API_KEY}\` },
    body: JSON.stringify({ seatNumber: 'A-101', buyerWallet: '0x...' })
  }
).then(r => r.json())

// Pass voucher to your frontend:
// buyer calls contract.mintWithVoucher(...voucher) from their wallet`,
                },
                {
                  step: '3b',
                  title: 'On purchase — backend mint (gasless)',
                  code: `// Platform pays gas, buyer receives NFT silently:
await fetch(\`${API_BASE}/v1/events/\${eventId}/mint\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${API_KEY}\` },
  body: JSON.stringify({ seatNumber: 'A-101', toWallet: '0xBUYER' })
})
// NFT lands in buyer wallet. Done.`,
                },
                {
                  step: '4',
                  title: 'Venue scanning',
                  code: `// QR code on every NFT links to:
// https://boleto.eth.limo/verify?event=badbunny-miami25.boleto.eth&seat=A-101
// Shows valid/invalid + owner wallet in real time

// Or verify in your own scanner app:
const inv = await fetch(\`/v1/events/\${eventId}/inventory\`).then(r => r.json())
const ticket = inv.tickets.find(t => t.seatNumber === scannedSeat)
const isValid = ticket?.minted && ticket?.ownerWallet === expectedWallet`,
                },
              ].map(({ step, title, code }) => (
                <div key={step} className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#E25822] text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </span>
                    <h3 className="font-mono font-bold text-sm">{title}</h3>
                  </div>
                  <CodeBlock code={code} lang="js" />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}

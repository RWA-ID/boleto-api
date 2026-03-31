'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { API_BASE } from '@/lib/api'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Row({ label, value, orange, mono, small }: {
  label: string; value: string; orange?: boolean; mono?: boolean; small?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[#666] text-sm flex-shrink-0">{label}</span>
      <span className={`text-right break-all ${orange ? 'text-[#f97316]' : 'text-[#f0f0f0]'} ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Inventory table ───────────────────────────────────────────────────────────

function InventoryTable({ tickets }: { tickets: any[] }) {
  const [filter, setFilter] = useState<'all' | 'available' | 'minted'>('all')
  const filtered = tickets.filter((t) => {
    if (filter === 'available') return !t.minted
    if (filter === 'minted')    return t.minted
    return true
  })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(['all', 'available', 'minted'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors ${
              filter === f ? 'bg-[#f97316] text-white' : 'bg-[#1f1f1f] text-[#666] hover:text-[#f0f0f0]'
            }`}>
            {f} ({f === 'all' ? tickets.length : f === 'available' ? tickets.filter(t => !t.minted).length : tickets.filter(t => t.minted).length})
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#1f1f1f]">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1f1f1f] bg-[#111]">
              <th className="text-left px-3 py-2 text-[#555] font-normal">Seat</th>
              <th className="text-left px-3 py-2 text-[#555] font-normal">Price</th>
              <th className="text-left px-3 py-2 text-[#555] font-normal">Status</th>
              <th className="text-left px-3 py-2 text-[#555] font-normal">Token ID</th>
              <th className="text-left px-3 py-2 text-[#555] font-normal">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((t: any) => (
              <tr key={t.id} className="border-b border-[#161616] hover:bg-[#161616]">
                <td className="px-3 py-2 text-[#f0f0f0]">{t.seatNumber}</td>
                <td className="px-3 py-2 text-[#f0f0f0]">${t.priceUsdc}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    t.minted ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f97316]/10 text-[#f97316]'
                  }`}>{t.minted ? 'minted' : 'available'}</span>
                </td>
                <td className="px-3 py-2 text-[#666]">{t.tokenId || '—'}</td>
                <td className="px-3 py-2 text-[#555]">{t.ownerWallet ? `${t.ownerWallet.slice(0,6)}…${t.ownerWallet.slice(-4)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <p className="text-center text-[#444] text-xs py-2 font-mono">Showing first 200 of {filtered.length}</p>
        )}
      </div>
    </div>
  )
}

// ── Branding editor ───────────────────────────────────────────────────────────

function BrandingEditor({ apiKey, initial }: { apiKey: string; initial: { promoterName?: string; bannerUri?: string } }) {
  const [promoterName, setPromoterName] = useState(initial.promoterName || '')
  const [bannerUri,    setBannerUri]    = useState(initial.bannerUri    || '')
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

  async function save() {
    setSaving(true)
    try {
      await fetch(`${API_BASE}/v1/profile`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ promoterName, bannerUri }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-4">
      <h2 className="font-mono font-bold text-xs text-[#666] uppercase tracking-wider">Branding</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[#666] mb-1">Company / Promoter Name</label>
          <input
            value={promoterName}
            onChange={(e) => setPromoterName(e.target.value)}
            placeholder="e.g. Live Nation Latin America"
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#f97316]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#666] mb-1">Banner Image URL</label>
          <input
            value={bannerUri}
            onChange={(e) => setBannerUri(e.target.value)}
            placeholder="https://... or ipfs://..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#f97316]"
          />
        </div>
        {bannerUri && (
          <img src={bannerUri.startsWith('ipfs://') ? bannerUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : bannerUri}
            alt="Banner preview" className="w-full h-24 object-cover rounded-lg border border-[#2a2a2a]" />
        )}
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-[#f97316] text-white rounded-lg text-sm font-mono font-bold disabled:opacity-50 hover:bg-[#ea6c0a] transition-colors">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}

// ── Single event dashboard ────────────────────────────────────────────────────

function EventDashboard({ eventId, apiKey }: { eventId: string; apiKey?: string }) {
  const [event,     setEvent]     = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)
  const [profile,   setProfile]   = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    Promise.all([
      fetch(`${API_BASE}/v1/events/${eventId}`).then((r) => r.json()),
      fetch(`${API_BASE}/v1/events/${eventId}/inventory`).then((r) => r.json()),
      apiKey
        ? fetch(`${API_BASE}/v1/profile`, { headers }).then((r) => r.json())
        : Promise.resolve(null),
    ])
      .then(([e, inv, prof]) => { setEvent(e); setInventory(inv); setProfile(prof); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [eventId, apiKey])

  if (loading) return <div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading event…</div>
  if (error || !event || event.error) return (
    <div className="text-center py-20 text-red-400 font-mono">{error || event?.message || 'Event not found'}</div>
  )

  const bannerUri = profile?.bannerUri || event.imageUri
  const promoterName = profile?.promoterName || profile?.name

  return (
    <div className="space-y-6">
      {/* Banner */}
      {bannerUri && (
        <div className="rounded-xl overflow-hidden border border-[#1f1f1f] h-36">
          <img src={bannerUri.startsWith('ipfs://') ? bannerUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : bannerUri}
            alt="Event banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          {promoterName && <p className="text-xs text-[#f97316] font-mono mb-1">{promoterName}</p>}
          <h1 className="font-mono text-2xl font-bold">{event.eventName}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex-shrink-0 ${
          event.status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f97316]/20 text-[#f97316]'
        }`}>{event.status}</span>
      </div>

      {/* Event Info */}
      <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-3">
        <Row label="ENS Name"        value={event.ensName}            orange />
        <Row label="Event Date"      value={event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '—'} />
        <Row label="Total Tickets"   value={event.totalTickets?.toLocaleString()} />
        <Row label="Promoter Wallet" value={event.promoterWallet} mono small />
      </div>

      {/* Contract Info */}
      <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-3">
        <h2 className="font-mono font-bold text-xs text-[#666] uppercase tracking-wider">Contract</h2>
        <Row label="BoletoTickets (Ethereum)" value={inventory?.contractAddress || '—'} mono small />
        <Row label="On-Chain Event ID"        value={event.onChainEventId || '—'} mono small />
      </div>

      {/* Stats */}
      {inventory && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',     value: inventory.totalTickets, color: 'text-[#f0f0f0]', border: 'border-[#1f1f1f]' },
            { label: 'Available', value: inventory.available,    color: 'text-[#f97316]', border: 'border-[#f97316]/20' },
            { label: 'Minted',    value: inventory.minted,       color: 'text-[#22c55e]', border: 'border-[#22c55e]/20' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`bg-[#161616] border ${border} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-mono font-bold ${color}`}>{value?.toLocaleString()}</p>
              <p className="text-xs text-[#666] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Branding (only if authenticated) */}
      {apiKey && (
        <BrandingEditor apiKey={apiKey} initial={{ promoterName: profile?.promoterName, bannerUri: profile?.bannerUri }} />
      )}

      {/* API Integration */}
      <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-3">
        <h2 className="font-mono font-bold text-xs text-[#666] uppercase tracking-wider">API Integration</h2>
        <p className="text-xs text-[#555]">Use your API key to generate vouchers for buyers or mint directly.</p>
        <pre className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 text-xs font-mono text-[#f0f0f0] overflow-x-auto whitespace-pre">{`// Generate signed voucher for buyer self-mint
POST ${API_BASE}/v1/events/${eventId}/voucher
Authorization: Bearer YOUR_API_KEY
{ "seatNumber": "A-101", "buyerWallet": "0xBUYER" }

// Or: backend mints directly (gasless for buyer)
POST ${API_BASE}/v1/events/${eventId}/mint
Authorization: Bearer YOUR_API_KEY
{ "seatNumber": "A-101", "toWallet": "0xBUYER" }`}</pre>
      </div>

      {/* Inventory Table */}
      {inventory?.tickets?.length > 0 && (
        <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-4">
          <h2 className="font-mono font-bold text-xs text-[#666] uppercase tracking-wider">Ticket Inventory</h2>
          <InventoryTable tickets={inventory.tickets} />
        </div>
      )}
    </div>
  )
}

// ── My Events list ────────────────────────────────────────────────────────────

function MyEvents({ apiKey }: { apiKey: string }) {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/v1/events`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [apiKey])

  if (loading) return <div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading your events…</div>
  if (error || data?.error) return (
    <div className="text-center py-20 text-red-400 font-mono">{error || data?.message}</div>
  )

  const { promoterName, bannerUri, events = [] } = data

  return (
    <div className="space-y-6">
      {/* Promoter banner */}
      {bannerUri && (
        <div className="rounded-xl overflow-hidden border border-[#1f1f1f] h-32">
          <img src={bannerUri.startsWith('ipfs://') ? bannerUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : bannerUri}
            alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          {promoterName && <p className="text-xs text-[#f97316] font-mono">{promoterName}</p>}
          <h1 className="font-mono text-2xl font-bold">My Events</h1>
        </div>
        <Link href="/create-event"
          className="px-4 py-2 bg-[#f97316] text-white rounded-lg text-sm font-mono font-bold hover:bg-[#ea6c0a] transition-colors">
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-[#666] font-mono">
          No events yet. <Link href="/create-event" className="text-[#f97316] hover:underline">Create your first event →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e: any) => (
            <Link key={e.id} href={`/events?id=${e.id}&key=${apiKey}`}
              className="block bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f97316]/40 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono font-bold text-[#f0f0f0] group-hover:text-[#f97316] transition-colors truncate">{e.eventName}</p>
                  <p className="text-xs text-[#f97316] font-mono mt-0.5">{e.ensName}</p>
                  <p className="text-xs text-[#555] mt-1">{e.totalTickets?.toLocaleString()} tickets{e.eventDate ? ` · ${new Date(e.eventDate).toLocaleDateString()}` : ''}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold flex-shrink-0 ${
                  e.status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f97316]/10 text-[#f97316]'
                }`}>{e.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Branding editor */}
      <BrandingEditor apiKey={apiKey} initial={{ promoterName, bannerUri }} />
    </div>
  )
}

// ── Connect prompt ────────────────────────────────────────────────────────────

function ConnectPrompt() {
  return (
    <div className="text-center py-20 space-y-4">
      <p className="text-[#666] font-mono">Connect your wallet to view your events</p>
      <ConnectButton />
    </div>
  )
}

// ── API key input ─────────────────────────────────────────────────────────────

function ApiKeyGate({ onKey }: { onKey: (k: string) => void }) {
  const [key, setKey] = useState('')
  return (
    <div className="text-center py-20 space-y-4 max-w-md mx-auto">
      <p className="text-[#666] font-mono text-sm">Enter your API key to view your events</p>
      <div className="flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="blt_..."
          className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#444] focus:outline-none focus:border-[#f97316] font-mono"
        />
        <button onClick={() => key && onKey(key)}
          className="px-4 py-2 bg-[#f97316] text-white rounded-lg text-sm font-mono font-bold hover:bg-[#ea6c0a] transition-colors">
          Go
        </button>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

function EventsRoot() {
  const params  = useSearchParams()
  const eventId = params.get('id')
  const keyParam = params.get('key')

  const { address, isConnected } = useAccount()
  const [apiKey, setApiKey] = useState<string | null>(keyParam)

  // Persist API key in sessionStorage
  useEffect(() => {
    if (keyParam) {
      sessionStorage.setItem('boleto_api_key', keyParam)
      setApiKey(keyParam)
    } else {
      const stored = sessionStorage.getItem('boleto_api_key')
      if (stored) setApiKey(stored)
    }
  }, [keyParam])

  // Show single event dashboard
  if (eventId) {
    return <EventDashboard eventId={eventId} apiKey={apiKey ?? undefined} />
  }

  // Show My Events list
  if (apiKey) {
    return <MyEvents apiKey={apiKey} />
  }

  // No key — show API key gate (wallet connect is nice-to-have UX but key is what matters)
  return <ApiKeyGate onKey={setApiKey} />
}

export default function EventPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <nav className="border-b border-[#1f1f1f] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-[#f97316] font-bold">boleto.eth</Link>
          <span className="text-[#666]">/</span>
          <span className="text-[#f0f0f0]">Events</span>
        </div>
        <ConnectButton />
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading…</div>}>
          <EventsRoot />
        </Suspense>
      </div>
    </main>
  )
}

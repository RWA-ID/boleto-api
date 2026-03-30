'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE } from '@/lib/api'

function Row({ label, value, orange, mono, small }: { label: string; value: string; orange?: boolean; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[#666] text-sm flex-shrink-0">{label}</span>
      <span className={`text-right break-all ${orange ? 'text-[#f97316]' : 'text-[#f0f0f0]'} ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'}`}>
        {value}
      </span>
    </div>
  )
}

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
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors ${
              filter === f
                ? 'bg-[#f97316] text-white'
                : 'bg-[#1f1f1f] text-[#666] hover:text-[#f0f0f0]'
            }`}
          >
            {f} {f === 'all' ? `(${tickets.length})` : f === 'available' ? `(${tickets.filter(t => !t.minted).length})` : `(${tickets.filter(t => t.minted).length})`}
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
                  }`}>
                    {t.minted ? 'minted' : 'available'}
                  </span>
                </td>
                <td className="px-3 py-2 text-[#666]">{t.tokenId || '—'}</td>
                <td className="px-3 py-2 text-[#555] text-xs">{t.ownerWallet ? `${t.ownerWallet.slice(0, 6)}…${t.ownerWallet.slice(-4)}` : '—'}</td>
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

function EventDashboard() {
  const params  = useSearchParams()
  const eventId = params.get('id')

  const [event,     setEvent]     = useState<any>(null)
  const [inventory, setInventory] = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) { setLoading(false); return }

    Promise.all([
      fetch(`${API_BASE}/v1/events/${eventId}`).then((r) => r.json()),
      fetch(`${API_BASE}/v1/events/${eventId}/inventory`).then((r) => r.json()),
    ])
      .then(([e, inv]) => { setEvent(e); setInventory(inv); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [eventId])

  if (!eventId) return <div className="text-center py-20 text-[#666]">No event ID provided.</div>
  if (loading)  return <div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading event…</div>
  if (error || !event || event.error) return (
    <div className="text-center py-20 text-red-400 font-mono">{error || event?.message || 'Event not found'}</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-2xl font-bold">{event.eventName}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
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
          <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-4 text-center">
            <p className="text-2xl font-mono font-bold text-[#f0f0f0]">{inventory.totalTickets?.toLocaleString()}</p>
            <p className="text-xs text-[#666] mt-1">Total</p>
          </div>
          <div className="bg-[#161616] border border-[#f97316]/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-mono font-bold text-[#f97316]">{inventory.available?.toLocaleString()}</p>
            <p className="text-xs text-[#666] mt-1">Available</p>
          </div>
          <div className="bg-[#161616] border border-[#22c55e]/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-mono font-bold text-[#22c55e]">{inventory.minted?.toLocaleString()}</p>
            <p className="text-xs text-[#666] mt-1">Minted</p>
          </div>
        </div>
      )}

      {/* API Integration Snippet */}
      <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6 space-y-3">
        <h2 className="font-mono font-bold text-xs text-[#666] uppercase tracking-wider">API Integration</h2>
        <p className="text-xs text-[#555]">Use your API key to import inventory and mint tickets from your platform.</p>
        <pre className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 text-xs font-mono text-[#f0f0f0] overflow-x-auto whitespace-pre">{`// Get ticket inventory
GET ${API_BASE}/v1/events/${eventId}/inventory
Authorization: Bearer YOUR_API_KEY

// Mint a ticket to a buyer
POST ${API_BASE}/v1/events/${eventId}/mint
Authorization: Bearer YOUR_API_KEY
{
  "seatNumber": "A-101",
  "toWallet": "0xBUYER_WALLET"
}`}</pre>
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

export default function EventPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <nav className="border-b border-[#1f1f1f] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="font-mono text-[#f97316] font-bold">boleto.eth</Link>
        <span className="text-[#666]">/</span>
        <span className="text-[#f0f0f0]">Event Dashboard</span>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading…</div>}>
          <EventDashboard />
        </Suspense>
      </div>
    </main>
  )
}

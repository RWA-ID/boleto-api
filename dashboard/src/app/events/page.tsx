'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAccount, useWriteContract, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import { API_BASE, confirmEvent } from '@/lib/api'
import { AppShell } from '@/components/AppShell'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Row({ label, value, orange, mono, small }: {
  label: string; value: string; orange?: boolean; mono?: boolean; small?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[#8B95AB] text-sm flex-shrink-0">{label}</span>
      <span className={`text-right break-all ${orange ? 'text-[#E25822]' : 'text-[#E8ECF3]'} ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : 'text-sm'}`}>
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
              filter === f ? 'bg-[#E25822] text-white' : 'bg-[#1F2A44] text-[#8B95AB] hover:text-[#E8ECF3]'
            }`}>
            {f} ({f === 'all' ? tickets.length : f === 'available' ? tickets.filter(t => !t.minted).length : tickets.filter(t => t.minted).length})
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#1F2A44]">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1F2A44] bg-[#0F1626]">
              <th className="text-left px-3 py-2 text-[#5E6A85] font-normal">Seat</th>
              <th className="text-left px-3 py-2 text-[#5E6A85] font-normal">Price</th>
              <th className="text-left px-3 py-2 text-[#5E6A85] font-normal">Status</th>
              <th className="text-left px-3 py-2 text-[#5E6A85] font-normal">Token ID</th>
              <th className="text-left px-3 py-2 text-[#5E6A85] font-normal">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((t: any) => (
              <tr key={t.id} className="border-b border-[#131C30] hover:bg-[#131C30]">
                <td className="px-3 py-2 text-[#E8ECF3]">{t.seatNumber}</td>
                <td className="px-3 py-2 text-[#E8ECF3]">${t.priceUsdc}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    t.minted ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#E25822]/10 text-[#E25822]'
                  }`}>{t.minted ? 'minted' : 'available'}</span>
                </td>
                <td className="px-3 py-2 text-[#8B95AB]">{t.tokenId || '—'}</td>
                <td className="px-3 py-2 text-[#5E6A85]">{t.ownerWallet ? `${t.ownerWallet.slice(0,6)}…${t.ownerWallet.slice(-4)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 && (
          <p className="text-center text-[#5E6A85] text-xs py-2 font-mono">Showing first 200 of {filtered.length}</p>
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
    <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-4">
      <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Branding</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[#8B95AB] mb-1">Company / Promoter Name</label>
          <input
            value={promoterName}
            onChange={(e) => setPromoterName(e.target.value)}
            placeholder="e.g. Live Nation Latin America"
            className="w-full bg-[#0A0F1A] border border-[#1F2A44] rounded-lg px-3 py-2 text-sm text-[#E8ECF3] placeholder-[#5E6A85] focus:outline-none focus:border-[#E25822]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8B95AB] mb-1">Banner Image URL</label>
          <input
            value={bannerUri}
            onChange={(e) => setBannerUri(e.target.value)}
            placeholder="https://... or ipfs://..."
            className="w-full bg-[#0A0F1A] border border-[#1F2A44] rounded-lg px-3 py-2 text-sm text-[#E8ECF3] placeholder-[#5E6A85] focus:outline-none focus:border-[#E25822]"
          />
        </div>
        {bannerUri && (
          <img src={bannerUri.startsWith('ipfs://') ? bannerUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : bannerUri}
            alt="Banner preview" className="w-full h-24 object-cover rounded-lg border border-[#1F2A44]" />
        )}
        <button onClick={save} disabled={saving}
          className="px-4 py-2 bg-[#E25822] text-white rounded-lg text-sm font-mono font-bold disabled:opacity-50 hover:bg-[#C24A1E] transition-colors">
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}

// ── Pending payment panel ─────────────────────────────────────────────────────

const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const USDC_ABI = [{
  name: 'transfer', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const

function PendingPaymentPanel({ event, onActivated }: { event: any; onActivated: (confirmed: any) => void }) {
  const { writeContractAsync, data: payTxHash, isPending: isPaying } = useWriteContract()
  const currentChainId = useChainId()
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [manualHash, setManualHash] = useState('')
  const [showManual, setShowManual] = useState(false)

  const handlePay = async () => {
    if (currentChainId !== 1) { setPayError('Please switch to Ethereum Mainnet in your wallet, then try again.'); return }
    setPayError(null)
    setPaying(true)
    try {
      await writeContractAsync({
        address: USDC_MAINNET,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [event.paymentAddress as `0x${string}`, parseUnits(String(event.feePaidUsdc), 6)],
      })
    } catch (err: any) {
      setPayError(err?.shortMessage ?? err?.message ?? 'Transaction failed')
    } finally {
      setPaying(false)
    }
  }

  const handleConfirm = async (txHash: string) => {
    setConfirming(true)
    setConfirmError(null)
    try {
      const confirmed = await confirmEvent(event.invoiceId, txHash) as any
      if (confirmed.apiKey) localStorage.setItem('boleto_api_key', confirmed.apiKey)
      onActivated(confirmed)
    } catch (err: any) {
      setConfirmError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-[#1a0a00] border-2 border-[#E25822]/50 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#E25822] animate-pulse" />
        <h2 className="font-mono font-bold text-[#E25822]">Payment Required to Activate</h2>
      </div>

      <div className="bg-[#0F1626] rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#8B95AB]">Amount Due</span>
          <span className="font-mono font-bold text-[#E25822] text-lg">${event.feePaidUsdc} USDC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8B95AB]">Invoice ID</span>
          <span className="font-mono text-xs text-[#5E6A85]">{event.invoiceId}</span>
        </div>
        <div className="pt-1">
          <p className="text-xs text-[#5E6A85]">Send USDC on Ethereum to</p>
          <p className="font-mono text-xs text-[#E8ECF3] break-all">{event.paymentAddress}</p>
        </div>
      </div>

      {!payTxHash ? (
        <button
          onClick={handlePay}
          disabled={paying || isPaying}
          className="w-full bg-[#E25822] text-white font-mono font-bold py-3 rounded-lg hover:bg-[#ED7144] transition-colors disabled:opacity-50"
        >
          {(paying || isPaying) ? 'Approve in Wallet…' : `Pay $${event.feePaidUsdc} USDC`}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-[#0F1626] border border-[#22c55e]/30 rounded-lg p-3">
            <p className="text-xs text-[#22c55e] mb-1">Payment submitted</p>
            <p className="font-mono text-xs text-[#8B95AB] break-all">{payTxHash}</p>
          </div>
          <button
            onClick={() => handleConfirm(payTxHash)}
            disabled={confirming}
            className="w-full bg-[#22c55e] text-black font-mono font-bold py-3 rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50"
          >
            {confirming ? 'Activating event…' : 'Activate Event'}
          </button>
        </div>
      )}

      {payError && <p className="text-red-400 text-xs font-mono">{payError}</p>}
      {confirmError && <p className="text-red-400 text-xs font-mono">{confirmError}</p>}

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="text-xs text-[#5E6A85] hover:text-[#8B95AB] underline w-full text-center"
      >
        {showManual ? 'Hide manual entry' : 'Already sent manually? Enter tx hash'}
      </button>
      {showManual && (
        <div className="space-y-2">
          <input
            type="text" placeholder="0x... transaction hash"
            value={manualHash}
            onChange={(e) => setManualHash(e.target.value)}
            className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
          />
          <button
            onClick={() => handleConfirm(manualHash)}
            disabled={confirming || !manualHash || manualHash.length !== 66}
            className="w-full bg-[#2B395C] text-white font-mono font-bold py-2 rounded-lg hover:bg-[#5E6A85] transition-colors disabled:opacity-50 text-sm"
          >
            {confirming ? 'Confirming…' : 'Confirm Manual Payment'}
          </button>
        </div>
      )}
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
  const [activated, setActivated] = useState<any>(null)

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

  if (loading) return <div className="text-center py-20 text-[#8B95AB] font-mono animate-pulse">Loading event…</div>
  if (error || !event || event.error) return (
    <div className="text-center py-20 text-red-400 font-mono">{error || event?.message || 'Event not found'}</div>
  )

  const bannerUri = profile?.bannerUri || event.imageUri
  const promoterName = profile?.promoterName || profile?.name

  return (
    <div className="space-y-6">
      {/* Banner */}
      {bannerUri && (
        <div className="rounded-xl overflow-hidden border border-[#1F2A44] h-36">
          <img src={bannerUri.startsWith('ipfs://') ? bannerUri.replace('ipfs://', 'https://ipfs.io/ipfs/') : bannerUri}
            alt="Event banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          {promoterName && <p className="text-xs text-[#E25822] font-mono mb-1">{promoterName}</p>}
          <h1 className="font-mono text-2xl font-bold">{event.eventName}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex-shrink-0 ${
          (activated?.status ?? event.status) === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#E25822]/20 text-[#E25822]'
        }`}>{activated?.status ?? event.status}</span>
      </div>

      {/* Pending payment panel */}
      {event.status === 'pending_payment' && !activated && (
        <PendingPaymentPanel event={event} onActivated={(confirmed) => setActivated(confirmed)} />
      )}

      {/* Post-activation success */}
      {activated && (
        <div className="bg-[#0d1f0d] border border-[#22c55e]/40 rounded-xl p-5 space-y-3">
          <p className="font-mono font-bold text-[#22c55e]">Event activated!</p>
          {activated.apiKey && (
            <div className="space-y-1">
              <p className="text-xs text-[#9CA3AF]">Your API Key — save this now, it won&apos;t be shown again.</p>
              <code className="block bg-[#0F1626] border border-[#22c55e]/30 rounded px-3 py-2 font-mono text-sm text-[#22c55e] break-all">
                {activated.apiKey}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Event Info */}
      <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-3">
        <Row label="ENS Name"        value={event.ensName}            orange />
        <Row label="Event Date"      value={event.eventDate ? new Date(event.eventDate).toLocaleDateString() : '—'} />
        <Row label="Total Tickets"   value={event.totalTickets?.toLocaleString()} />
        <Row label="Promoter Wallet" value={event.promoterWallet} mono small />
      </div>

      {/* Contract Info */}
      <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-3">
        <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Contract</h2>
        <Row label="BoletoTickets (Ethereum)" value={inventory?.contractAddress || '—'} mono small />
        <Row label="On-Chain Event ID"        value={event.onChainEventId || '—'} mono small />
      </div>

      {/* Stats */}
      {inventory && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',     value: inventory.totalTickets, color: 'text-[#E8ECF3]', border: 'border-[#1F2A44]' },
            { label: 'Available', value: inventory.available,    color: 'text-[#E25822]', border: 'border-[#E25822]/20' },
            { label: 'Minted',    value: inventory.minted,       color: 'text-[#22c55e]', border: 'border-[#22c55e]/20' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`bg-[#131C30] border ${border} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-mono font-bold ${color}`}>{value?.toLocaleString()}</p>
              <p className="text-xs text-[#8B95AB] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Branding (only if authenticated) */}
      {apiKey && (
        <BrandingEditor apiKey={apiKey} initial={{ promoterName: profile?.promoterName, bannerUri: profile?.bannerUri }} />
      )}

      {/* API Integration */}
      <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-3">
        <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">API Integration</h2>
        <p className="text-xs text-[#5E6A85]">Use your API key to generate vouchers for buyers or mint directly.</p>
        <pre className="bg-[#0A0F1A] border border-[#131C30] rounded-lg p-4 text-xs font-mono text-[#E8ECF3] overflow-x-auto whitespace-pre">{`// Generate signed voucher for buyer self-mint
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
        <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-4">
          <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Ticket Inventory</h2>
          <InventoryTable tickets={inventory.tickets} />
        </div>
      )}
    </div>
  )
}

// ── My Events list ────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active:           { cls: 'chip-success', label: 'On sale' },
    pending_payment:  { cls: 'chip-warn',    label: 'Pending payment' },
    sold_out:         { cls: 'chip-info',    label: 'Sold out' },
    completed:        { cls: 'chip',         label: 'Completed' },
  }
  const { cls, label } = map[status] ?? { cls: 'chip', label: status }
  return <span className={`chip ${cls}`}><span className="chip-dot" /> {label}</span>
}

function MyEvents({ apiKey }: { apiKey: string }) {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [filter,  setFilter]  = useState<string>('all')

  useEffect(() => {
    fetch(`${API_BASE}/v1/events`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [apiKey])

  if (loading) return <div className="text-center py-20 text-[#8B95AB] font-mono animate-pulse">Loading your events…</div>
  if (error || data?.error) return (
    <div className="text-center py-20 text-red-400 font-mono">{error || data?.message}</div>
  )

  const { promoterName, bannerUri, events = [] } = data
  const filters = ['all', 'active', 'pending_payment', 'sold_out', 'completed']
  const filtered = events.filter((e: any) => filter === 'all' || e.status === filter)
  const totalTickets   = events.reduce((s: number, e: any) => s + (e.totalTickets ?? 0), 0)
  const activeCount    = events.filter((e: any) => e.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-2">
        <div>
          {promoterName && <div className="eyebrow" style={{ color: 'var(--accent-400)', marginBottom: 6 }}>{promoterName}</div>}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'white' }}>Events</div>
          <div className="text-[13.5px] mt-1" style={{ color: 'var(--console-text-dim)' }}>
            {events.length} event{events.length === 1 ? '' : 's'} · {activeCount} active · {totalTickets.toLocaleString()} tickets issued
          </div>
        </div>
        <Link href="/create-event" className="btn btn-primary btn-sm">+ New event</Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Inventory issued',  totalTickets.toLocaleString(), 'tickets'],
          ['Active events',     String(activeCount),           'on sale'],
          ['Total events',      String(events.length),         'lifetime'],
          ['API key',           '••••' + apiKey.slice(-4),     'in use'],
        ].map(([k, v, u]) => (
          <div key={k as string} style={{
            padding: 16,
            background: 'var(--console-card)',
            border: '1px solid var(--console-line)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, color: 'var(--console-text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{k}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'white', letterSpacing: '-0.02em' }}>{v}</span>
              <span style={{ fontSize: 12, color: 'var(--console-text-mute)' }}>{u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        background: 'var(--console-card)',
        border: '1px solid var(--console-line)',
        borderTopLeftRadius: 8, borderTopRightRadius: 8,
      }}>
        <div className="flex gap-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 12px',
              borderRadius: 5,
              fontSize: 12.5, fontWeight: 500,
              background: filter === f ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: filter === f ? 'var(--console-text)' : 'var(--console-text-dim)',
              border: 'none', cursor: 'pointer',
              textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>{f === 'all' ? 'All' : f.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {/* Events table */}
      {events.length === 0 ? (
        <div style={{
          padding: 64, textAlign: 'center',
          background: 'var(--console-card)',
          border: '1px solid var(--console-line)',
          borderTopLeftRadius: 0, borderTopRightRadius: 0,
          borderRadius: 8,
        }}>
          <div style={{ color: 'var(--console-text-dim)', fontSize: 14, marginBottom: 14 }}>No events yet.</div>
          <Link href="/create-event" className="btn btn-primary btn-sm">Create your first event</Link>
        </div>
      ) : (
        <div style={{
          background: 'var(--console-card)',
          border: '1px solid var(--console-line)',
          borderTopLeftRadius: 0, borderTopRightRadius: 0,
          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.4fr 1.6fr 1fr 1.3fr 80px',
            padding: '10px 16px',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            color: 'var(--console-text-mute)', textTransform: 'uppercase',
            borderBottom: '1px solid var(--console-line)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div>Event</div>
            <div>Date · ENS</div>
            <div>Status</div>
            <div>Inventory</div>
            <div></div>
          </div>
          {filtered.map((e: any, i: number) => (
            <Link
              key={e.id}
              href={`/events?id=${e.id}&key=${apiKey}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.4fr 1.6fr 1fr 1.3fr 80px',
                padding: '14px 16px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--console-line)' : 'none',
                cursor: 'pointer',
                transition: 'background 120ms',
                color: 'inherit',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--console-text)' }}>{e.eventName}</div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{e.ensName}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--console-text-dim)', fontFamily: 'var(--font-mono)' }}>
                {e.eventDate ? new Date(e.eventDate).toLocaleDateString() : '—'}
              </div>
              <div><StatusChip status={e.status} /></div>
              <div style={{ fontSize: 13, color: 'var(--console-text)', fontFamily: 'var(--font-mono)' }}>
                {(e.totalTickets ?? 0).toLocaleString()} <span style={{ color: 'var(--console-text-mute)' }}>tickets</span>
              </div>
              <div style={{ textAlign: 'right', color: 'var(--console-text-mute)' }}>
                <span style={{ fontSize: 13 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BrandingEditor apiKey={apiKey} initial={{ promoterName, bannerUri }} />
    </div>
  )
}

// ── Connect prompt ────────────────────────────────────────────────────────────

function ConnectPrompt() {
  return (
    <div className="text-center py-20 space-y-4">
      <p className="text-[#8B95AB] font-mono">Connect your wallet to view your events</p>
      <ConnectButton />
    </div>
  )
}

// ── API key input ─────────────────────────────────────────────────────────────

function ApiKeyGate({ onKey }: { onKey: (k: string) => void }) {
  const [key, setKey] = useState('')
  return (
    <div className="max-w-2xl mx-auto py-16">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#ED7144] mb-3">
        Welcome to your console
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 400,
        letterSpacing: '-0.02em', color: 'white', lineHeight: 1.05, marginBottom: 16,
      }}>
        Paste your API key to load your events.
      </h1>
      <p className="text-[15px] leading-relaxed mb-10" style={{ color: 'var(--console-text-dim)' }}>
        Server-side keys give your team read access to event inventory, mint logs, and royalty payouts.
        Treat them like a database password — rotate on suspicion.
      </p>

      <div style={{
        background: 'var(--console-card)',
        border: '1px solid var(--console-line)',
        borderRadius: 12,
        padding: 24,
      }}>
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--console-text-mute)' }}>
          API key
        </label>
        <div className="flex gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="blt_live_..."
            className="input mono flex-1"
            style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && key) onKey(key.trim()) }}
          />
          <button
            onClick={() => key && onKey(key.trim())}
            className="btn btn-primary"
            disabled={!key.trim()}
          >
            Load events
          </button>
        </div>
        <p className="mt-3 text-[12.5px]" style={{ color: 'var(--console-text-mute)' }}>
          Your key is stored in this browser&apos;s session only — never sent anywhere except the boleto.eth API.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/api-keys" style={{
          padding: '16px 18px',
          background: 'var(--console-card)',
          border: '1px solid var(--console-line)',
          borderRadius: 10,
          display: 'block',
        }}>
          <div className="text-[14px] font-medium text-white mb-1">Need a key?</div>
          <div className="text-[12.5px]" style={{ color: 'var(--console-text-dim)' }}>
            Generate one in API keys →
          </div>
        </Link>
        <Link href="/docs" style={{
          padding: '16px 18px',
          background: 'var(--console-card)',
          border: '1px solid var(--console-line)',
          borderRadius: 10,
          display: 'block',
        }}>
          <div className="text-[14px] font-medium text-white mb-1">First time here?</div>
          <div className="text-[12.5px]" style={{ color: 'var(--console-text-dim)' }}>
            Read the quickstart →
          </div>
        </Link>
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
    <AppShell active="events">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <Suspense fallback={<div className="text-center py-20 text-[#8B95AB] font-mono animate-pulse">Loading…</div>}>
          <EventsRoot />
        </Suspense>
      </div>
    </AppShell>
  )
}

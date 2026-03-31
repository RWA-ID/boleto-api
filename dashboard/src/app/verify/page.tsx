'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE } from '@/lib/api'

function VerifyContent() {
  const params     = useSearchParams()
  const eventParam = params.get('event')
  const seatParam  = params.get('seat')

  const [status,  setStatus]  = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading')
  const [ticket,  setTicket]  = useState<any>(null)
  const [event,   setEvent]   = useState<any>(null)

  useEffect(() => {
    if (!eventParam || !seatParam) { setStatus('invalid'); return }

    Promise.all([
      fetch(`${API_BASE}/v1/events/${encodeURIComponent(eventParam)}`).then(r => r.json()),
      fetch(`${API_BASE}/v1/events/${encodeURIComponent(eventParam)}/inventory`).then(r => r.json()),
    ]).then(([ev, inv]) => {
      if (ev.error) { setStatus('error'); return }
      setEvent(ev)
      const found = inv.tickets?.find((t: any) => t.seatNumber === seatParam)
      if (!found) { setStatus('invalid'); return }
      setTicket(found)
      setStatus(found.minted ? 'valid' : 'invalid')
    }).catch(() => setStatus('error'))
  }, [eventParam, seatParam])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#f97316] border-t-transparent animate-spin" />
        <p className="text-[#666] font-mono">Verifying ticket…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-6xl">⚠️</div>
        <p className="text-red-400 font-mono">Could not reach verification server</p>
        <p className="text-[#555] text-sm">Try again in a moment</p>
      </div>
    )
  }

  if (status === 'invalid' || !ticket?.minted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
          <span className="text-4xl">✗</span>
        </div>
        <div>
          <h2 className="text-2xl font-mono font-bold text-red-400">Invalid Ticket</h2>
          <p className="text-[#666] mt-2 text-sm">This ticket has not been minted or does not exist</p>
        </div>
        {eventParam && <p className="font-mono text-xs text-[#444]">{eventParam}</p>}
        {seatParam  && <p className="font-mono text-xs text-[#444]">Seat: {seatParam}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-sm mx-auto">
      {/* Valid badge */}
      <div className="w-24 h-24 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center">
        <span className="text-4xl text-[#22c55e]">✓</span>
      </div>

      <div>
        <h2 className="text-2xl font-mono font-bold text-[#22c55e]">Valid Ticket</h2>
        <p className="text-[#666] mt-1 text-sm">This ticket NFT has been verified on Ethereum</p>
      </div>

      {/* Event info */}
      <div className="w-full bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 space-y-3 text-left">
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Event</span>
          <span className="text-[#f0f0f0] text-sm font-medium">{event?.eventName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">ENS</span>
          <span className="text-[#f97316] text-sm font-mono">{eventParam}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Seat</span>
          <span className="text-[#f0f0f0] text-sm font-mono font-bold">{seatParam}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Token ID</span>
          <span className="text-[#f0f0f0] text-sm font-mono">#{ticket.tokenId}</span>
        </div>
        <div className="flex justify-between items-start gap-4">
          <span className="text-[#666] text-sm flex-shrink-0">Owner</span>
          <span className="text-[#f0f0f0] text-xs font-mono break-all">{ticket.ownerWallet}</span>
        </div>
      </div>

      {/* OpenSea link */}
      {ticket.tokenId && (
        <a
          href={`https://opensea.io/assets/ethereum/0x9650d442779368e0A039351eD7c75c3E93de372D/${ticket.tokenId}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#f97316] font-mono hover:underline"
        >
          View on OpenSea →
        </a>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <nav className="border-b border-[#1f1f1f] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="font-mono text-[#f97316] font-bold">boleto.eth</Link>
        <span className="text-[#666]">/</span>
        <span className="text-[#f0f0f0]">Verify Ticket</span>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-12">
        <Suspense fallback={<div className="text-center py-20 text-[#666] font-mono animate-pulse">Loading…</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { API_BASE } from '@/lib/api'
import { AppShell } from '@/components/AppShell'

function VerifyContent() {
  const [ensName,   setEnsName]   = useState<string | null>(null)
  const [seatNum,   setSeatNum]   = useState<string | null>(null)
  const [status,    setStatus]    = useState<'loading' | 'valid' | 'redeemed' | 'invalid' | 'error'>('loading')
  const [ticket,    setTicket]    = useState<any>(null)
  const [event,     setEvent]     = useState<any>(null)
  const [apiKey,    setApiKey]    = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemErr, setRedeemErr] = useState<string | null>(null)

  // Parse hash: #ensName/seatNumber
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1)
      if (!hash) { setStatus('invalid'); return }
      const slash = hash.indexOf('/')
      if (slash === -1) { setStatus('invalid'); return }
      setEnsName(decodeURIComponent(hash.slice(0, slash)))
      setSeatNum(decodeURIComponent(hash.slice(slash + 1)))
    }
    parseHash()
    window.addEventListener('hashchange', parseHash)
    return () => window.removeEventListener('hashchange', parseHash)
  }, [])

  const [keyInput,    setKeyInput]    = useState('')
  const [keyPanelOpen, setKeyPanelOpen] = useState(false)

  // Load API key from localStorage (set by the events dashboard or entered here)
  useEffect(() => {
    const key = localStorage.getItem('boleto_api_key')
    if (key) setApiKey(key)
  }, [])

  const handleSaveKey = () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    localStorage.setItem('boleto_api_key', trimmed)
    setApiKey(trimmed)
    setKeyInput('')
    setKeyPanelOpen(false)
  }

  const handleClearKey = () => {
    localStorage.removeItem('boleto_api_key')
    setApiKey(null)
  }

  // Fetch ticket info once we have the params
  useEffect(() => {
    if (!ensName || !seatNum) return

    Promise.all([
      fetch(`${API_BASE}/v1/events/${encodeURIComponent(ensName)}`).then(r => r.json()),
      fetch(`${API_BASE}/v1/events/${encodeURIComponent(ensName)}/inventory`).then(r => r.json()),
    ]).then(([ev, inv]) => {
      if (ev.error) { setStatus('error'); return }
      setEvent(ev)
      const found = inv.tickets?.find((t: any) => t.seatNumber === seatNum)
      if (!found || !found.minted) { setStatus('invalid'); return }
      setTicket(found)
      setStatus(found.redeemed ? 'redeemed' : 'valid')
    }).catch(() => setStatus('error'))
  }, [ensName, seatNum])

  const handleRedeem = async () => {
    if (!apiKey || !ensName || !seatNum) return
    setRedeeming(true)
    setRedeemErr(null)
    try {
      const res = await fetch(`${API_BASE}/v1/events/${encodeURIComponent(ensName)}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ seatNumber: seatNum }),
      })
      const json = await res.json()
      if (!res.ok) { setRedeemErr(json.message || 'Redeem failed'); return }
      setTicket((t: any) => ({ ...t, redeemed: true, redeemedAt: json.redeemedAt }))
      setStatus('redeemed')
    } catch {
      setRedeemErr('Network error — try again')
    } finally {
      setRedeeming(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-[#E25822] border-t-transparent animate-spin" />
        <p className="text-[#8B95AB] font-mono">Verifying ticket…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-6xl">⚠️</div>
        <p className="text-red-400 font-mono">Could not reach verification server</p>
        <p className="text-[#5E6A85] text-sm">Try again in a moment</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
          <span className="text-4xl">✗</span>
        </div>
        <div>
          <h2 className="text-2xl font-mono font-bold text-red-400">Invalid Ticket</h2>
          <p className="text-[#8B95AB] mt-2 text-sm">This ticket has not been minted or does not exist</p>
        </div>
        {ensName && <p className="font-mono text-xs text-[#5E6A85]">{ensName}</p>}
        {seatNum  && <p className="font-mono text-xs text-[#5E6A85]">Seat: {seatNum}</p>}
      </div>
    )
  }

  if (status === 'redeemed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-sm mx-auto">
        <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center">
          <span className="text-4xl">↩</span>
        </div>
        <div>
          <h2 className="text-2xl font-mono font-bold text-yellow-400">Already Redeemed</h2>
          <p className="text-[#8B95AB] mt-1 text-sm">This ticket was already scanned at the door</p>
        </div>
        <div className="w-full bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-[#8B95AB] text-sm">Event</span>
            <span className="text-[#E8ECF3] text-sm font-medium">{event?.eventName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8B95AB] text-sm">Seat</span>
            <span className="text-[#E8ECF3] text-sm font-mono font-bold">{seatNum}</span>
          </div>
          {ticket?.redeemedAt && (
            <div className="flex justify-between">
              <span className="text-[#8B95AB] text-sm">Redeemed at</span>
              <span className="text-yellow-400 text-sm font-mono">{new Date(ticket.redeemedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Valid
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center max-w-sm mx-auto">
      <div className="w-24 h-24 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center">
        <span className="text-4xl text-[#22c55e]">✓</span>
      </div>

      <div>
        <h2 className="text-2xl font-mono font-bold text-[#22c55e]">Valid Ticket</h2>
        <p className="text-[#8B95AB] mt-1 text-sm">Verified on Ethereum</p>
      </div>

      <div className="w-full bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-3 text-left">
        <div className="flex justify-between">
          <span className="text-[#8B95AB] text-sm">Event</span>
          <span className="text-[#E8ECF3] text-sm font-medium">{event?.eventName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B95AB] text-sm">ENS</span>
          <span className="text-[#E25822] text-sm font-mono">{ensName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B95AB] text-sm">Seat</span>
          <span className="text-[#E8ECF3] text-sm font-mono font-bold">{seatNum}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B95AB] text-sm">Token ID</span>
          <span className="text-[#E8ECF3] text-sm font-mono">#{ticket?.tokenId}</span>
        </div>
        <div className="flex justify-between items-start gap-4">
          <span className="text-[#8B95AB] text-sm flex-shrink-0">Owner</span>
          <span className="text-[#E8ECF3] text-xs font-mono break-all">{ticket?.ownerWallet}</span>
        </div>
      </div>

      {/* API key entry / redeem panel */}
      <div className="w-full space-y-2">
        {apiKey ? (
          <>
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="w-full bg-[#22c55e] text-black font-mono font-bold py-4 rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50 text-lg"
            >
              {redeeming ? 'Redeeming…' : 'Mark as Redeemed'}
            </button>
            {redeemErr && <p className="text-red-400 text-xs font-mono text-center">{redeemErr}</p>}
            <button
              onClick={handleClearKey}
              className="w-full text-xs text-[#5E6A85] hover:text-[#8B95AB] font-mono py-1 transition-colors"
            >
              Clear API key
            </button>
          </>
        ) : keyPanelOpen ? (
          <div className="space-y-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              placeholder="Enter promoter API key…"
              autoFocus
              className="w-full bg-[#131C30] border border-[#1F2A44] rounded-lg px-4 py-3 text-[#E8ECF3] font-mono text-sm placeholder-[#5E6A85] focus:outline-none focus:border-[#E25822]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="flex-1 bg-[#E25822] text-black font-mono font-bold py-3 rounded-lg hover:bg-[#C24A1E] transition-colors disabled:opacity-40"
              >
                Save & Redeem
              </button>
              <button
                onClick={() => { setKeyPanelOpen(false); setKeyInput('') }}
                className="px-4 py-3 bg-[#131C30] border border-[#1F2A44] rounded-lg font-mono text-sm text-[#8B95AB] hover:text-[#E8ECF3] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setKeyPanelOpen(true)}
            className="w-full border border-[#1F2A44] text-[#8B95AB] font-mono py-3 rounded-lg hover:border-[#E25822] hover:text-[#E25822] transition-colors text-sm"
          >
            Promoter? Enter API key to redeem →
          </button>
        )}
      </div>

      {ticket?.tokenId && (
        <a
          href={`https://opensea.io/assets/ethereum/0x9650d442779368e0A039351eD7c75c3E93de372D/${ticket.tokenId}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#E25822] font-mono hover:underline"
        >
          View on OpenSea →
        </a>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <AppShell active="verify">
      <div className="max-w-lg mx-auto px-8 py-10">
        <Suspense fallback={<div className="text-center py-20 text-[#8B95AB] font-mono animate-pulse">Loading…</div>}>
          <VerifyContent />
        </Suspense>
      </div>
    </AppShell>
  )
}

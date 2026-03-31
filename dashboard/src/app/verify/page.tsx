'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { API_BASE } from '@/lib/api'

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

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
          <span className="text-4xl">✗</span>
        </div>
        <div>
          <h2 className="text-2xl font-mono font-bold text-red-400">Invalid Ticket</h2>
          <p className="text-[#666] mt-2 text-sm">This ticket has not been minted or does not exist</p>
        </div>
        {ensName && <p className="font-mono text-xs text-[#444]">{ensName}</p>}
        {seatNum  && <p className="font-mono text-xs text-[#444]">Seat: {seatNum}</p>}
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
          <p className="text-[#666] mt-1 text-sm">This ticket was already scanned at the door</p>
        </div>
        <div className="w-full bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-[#666] text-sm">Event</span>
            <span className="text-[#f0f0f0] text-sm font-medium">{event?.eventName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#666] text-sm">Seat</span>
            <span className="text-[#f0f0f0] text-sm font-mono font-bold">{seatNum}</span>
          </div>
          {ticket?.redeemedAt && (
            <div className="flex justify-between">
              <span className="text-[#666] text-sm">Redeemed at</span>
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
        <p className="text-[#666] mt-1 text-sm">Verified on Ethereum</p>
      </div>

      <div className="w-full bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 space-y-3 text-left">
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Event</span>
          <span className="text-[#f0f0f0] text-sm font-medium">{event?.eventName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">ENS</span>
          <span className="text-[#f97316] text-sm font-mono">{ensName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Seat</span>
          <span className="text-[#f0f0f0] text-sm font-mono font-bold">{seatNum}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666] text-sm">Token ID</span>
          <span className="text-[#f0f0f0] text-sm font-mono">#{ticket?.tokenId}</span>
        </div>
        <div className="flex justify-between items-start gap-4">
          <span className="text-[#666] text-sm flex-shrink-0">Owner</span>
          <span className="text-[#f0f0f0] text-xs font-mono break-all">{ticket?.ownerWallet}</span>
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
              className="w-full text-xs text-[#444] hover:text-[#666] font-mono py-1 transition-colors"
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
              className="w-full bg-[#161616] border border-[#2f2f2f] rounded-lg px-4 py-3 text-[#f0f0f0] font-mono text-sm placeholder-[#444] focus:outline-none focus:border-[#f97316]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="flex-1 bg-[#f97316] text-black font-mono font-bold py-3 rounded-lg hover:bg-[#ea6c0a] transition-colors disabled:opacity-40"
              >
                Save & Redeem
              </button>
              <button
                onClick={() => { setKeyPanelOpen(false); setKeyInput('') }}
                className="px-4 py-3 bg-[#1a1a1a] border border-[#2f2f2f] rounded-lg font-mono text-sm text-[#666] hover:text-[#f0f0f0] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setKeyPanelOpen(true)}
            className="w-full border border-[#2f2f2f] text-[#666] font-mono py-3 rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors text-sm"
          >
            Promoter? Enter API key to redeem →
          </button>
        )}
      </div>

      {ticket?.tokenId && (
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

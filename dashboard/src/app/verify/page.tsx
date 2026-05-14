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
    // No scan params yet — show idle state, not an error.
    if (!ensName && !seatNum) {
      return (
        <div className="py-12 space-y-8">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--accent-400)' }}>
              Gate scanner
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400,
              letterSpacing: '-0.02em', color: 'white', lineHeight: 1.05, marginBottom: 12,
            }}>
              Awaiting a ticket scan.
            </h1>
            <p style={{ color: 'var(--console-text-dim)', fontSize: 15, lineHeight: 1.6, maxWidth: '52ch' }}>
              This page verifies tickets when opened from a QR code at the gate. To start scanning,
              open the handheld scanner — or paste the seat ENS to verify manually.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 560 }}>
            <Link href="/scan" style={{
              padding: 18,
              background: 'var(--console-card)',
              border: '1px solid var(--console-line)',
              borderRadius: 10,
              display: 'block',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'white', marginBottom: 4 }}>Open the scanner</div>
              <div style={{ fontSize: 12.5, color: 'var(--console-text-dim)' }}>Camera-based, phone-friendly →</div>
            </Link>
            <Link href="/api-keys" style={{
              padding: 18,
              background: 'var(--console-card)',
              border: '1px solid var(--console-line)',
              borderRadius: 10,
              display: 'block',
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'white', marginBottom: 4 }}>Set API key</div>
              <div style={{ fontSize: 12.5, color: 'var(--console-text-dim)' }}>Required to redeem at the gate →</div>
            </Link>
          </div>

          <div style={{
            padding: 20,
            background: 'var(--console-card)',
            border: '1px solid var(--console-line)',
            borderRadius: 12,
            maxWidth: 560,
          }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: 'var(--console-text-mute)' }}>
              How it works
            </div>
            <ol style={{ paddingLeft: 18, margin: 0, color: 'var(--console-text-dim)', fontSize: 13.5, lineHeight: 1.7 }}>
              <li>Scan a ticket QR with the handheld at the gate.</li>
              <li>The QR opens this URL with <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--console-text)' }}>#ens/seat</span>.</li>
              <li>Tap <span style={{ color: 'white' }}>Redeem</span> to admit the guest.</li>
            </ol>
          </div>
        </div>
      )
    }
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

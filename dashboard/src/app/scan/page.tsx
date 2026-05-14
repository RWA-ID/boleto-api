'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type ScanState = 'idle' | 'scanning' | 'denied' | 'unsupported'

// Lightweight venue-side scanner. Uses native BarcodeDetector where
// available; falls back to manual entry. Decoded URLs that match the
// /verify hash format are forwarded to /verify so the operator can
// redeem the ticket in one tap.
export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [state, setState] = useState<ScanState>('idle')
  const [lastCode, setLastCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setState('idle')
  }

  const handleDecoded = (raw: string) => {
    setLastCode(raw)
    // Accept either a full URL like https://boleto.eth.limo/verify#ens/seat
    // or just a raw "ens/seat" payload.
    try {
      const u = new URL(raw)
      if (u.hash) {
        window.location.href = `/verify${u.hash}`
        return
      }
    } catch {}
    if (raw.includes('/')) {
      window.location.href = `/verify#${raw}`
    }
  }

  const start = async () => {
    if (!supported) {
      setState('unsupported')
      return
    }
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setState('scanning')

      // @ts-expect-error — BarcodeDetector is not yet in TS lib
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const tick = async () => {
        if (!videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            handleDecoded(codes[0].rawValue)
            stop()
            return
          }
        } catch {}
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (e: any) {
      setError(e?.message ?? 'Camera unavailable')
      setState('denied')
    }
  }

  useEffect(() => () => stop(), [])

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = manual.trim()
    if (!v) return
    if (v.startsWith('http')) {
      handleDecoded(v)
    } else {
      window.location.href = `/verify#${v}`
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0F1A] text-[#E8ECF3]" style={{ fontFamily: 'var(--font-sans)' }}>
      <header className="border-b border-[#1F2A44] px-5 py-4 flex items-center justify-between sticky top-0 bg-[#0A0F1A]/95 backdrop-blur z-10">
        <Link href="/events" className="text-sm text-[#8B95AB] hover:text-[#E25822]">← Back</Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>
          boleto<span style={{ color: '#E25822' }}>.eth</span>
          <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-[#5E6A85]">Gate scanner</span>
        </div>
        <Link href="/api-keys" className="text-sm text-[#8B95AB] hover:text-[#E25822]">Keys</Link>
      </header>

      <div className="max-w-[440px] mx-auto px-5 py-6">
        <div className="rounded-2xl overflow-hidden border border-[#1F2A44] bg-[#0F1626] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
          <div className="relative aspect-[3/4] bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: state === 'scanning' ? 'block' : 'none' }}
            />
            {state !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl border border-[#1F2A44] bg-[#131C30] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E25822' }}>
                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M16 20h3a1 1 0 0 0 1-1v-3" />
                    <path d="M4 12h16" />
                  </svg>
                </div>
                <div className="text-sm text-[#9CA3AF] max-w-[28ch]">
                  {state === 'idle' && 'Point your camera at a ticket QR to redeem.'}
                  {state === 'denied' && (error ?? 'Camera access denied. Use manual entry below.')}
                  {state === 'unsupported' && 'This browser does not support QR scanning. Use manual entry below or open this page in Chrome / Safari on a phone.'}
                </div>
              </div>
            )}
            {/* Reticle */}
            {state === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[72%] aspect-square border-2 border-[#E25822]/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            )}
          </div>

          <div className="p-5 flex flex-col gap-3">
            {state === 'scanning' ? (
              <button onClick={stop} className="btn btn-secondary" style={{ height: 48, width: '100%' }}>Stop</button>
            ) : (
              <button onClick={start} className="btn btn-primary" style={{ height: 48, width: '100%' }} disabled={!supported && state !== 'denied'}>
                Start scanning
              </button>
            )}
            {lastCode && (
              <div className="text-[11px] font-mono text-[#5E6A85] break-all">Last: {lastCode}</div>
            )}
          </div>
        </div>

        <form onSubmit={onManualSubmit} className="mt-6">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5E6A85] mb-2">Manual entry</label>
          <div className="flex gap-2">
            <input
              className="input mono flex-1"
              style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
              placeholder="ens-name/seat-id"
              value={manual}
              onChange={e => setManual(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost" style={{ borderColor: '#1F2A44', color: '#E8ECF3' }}>Verify</button>
          </div>
          <div className="mt-2 text-[12px] text-[#5E6A85]">
            Example: <span className="font-mono">badbunny-cdmx26.boleto.eth/a-101</span>
          </div>
        </form>

        <div className="mt-8 rounded-xl border border-[#1F2A44] bg-[#0F1626] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5E6A85] mb-2">Operator tips</div>
          <ul className="text-[13px] text-[#8B95AB] space-y-1.5 leading-relaxed">
            <li>· Keep the QR ~10cm from the lens in good light.</li>
            <li>· If a ticket reads <span className="text-[#E25822]">Already redeemed</span>, do not let the guest in.</li>
            <li>· Lose signal? Manual entry above works offline once the page is loaded.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

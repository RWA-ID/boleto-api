'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'

type Step = 'review' | 'pay' | 'done'

// Buyer-facing checkout demo. White-label-ready: minimal branding, clean
// surface, no wallet vocabulary on the happy path. Wired as a preview —
// the real checkout will accept event/seat params from a host platform
// via query string and call /v1/events/.../mint behind the scenes.
function BuyContent() {
  const [step, setStep] = useState<Step>('review')
  const [event, setEvent] = useState<string>('Bad Bunny — Most Wanted Tour')
  const [seat, setSeat] = useState<string>('A12')
  const [section, setSection] = useState<string>('VIP')
  const [row, setRow] = useState<string>('A')
  const [price, setPrice] = useState<string>('180.00')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    if (q.get('event'))   setEvent(q.get('event')!)
    if (q.get('seat'))    setSeat(q.get('seat')!)
    if (q.get('section')) setSection(q.get('section')!)
    if (q.get('row'))     setRow(q.get('row')!)
    if (q.get('price'))   setPrice(q.get('price')!)
  }, [])

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // Demo: no real network call — sandboxed preview.
    await new Promise(r => setTimeout(r, 900))
    setOrderId('ord_' + Math.random().toString(36).slice(2, 10).toUpperCase())
    setStep('done')
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink-900)' }}>
      <header style={{
        borderBottom: '1px solid var(--ink-100)',
        background: 'var(--paper-card)',
      }}>
        <div className="container-default" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ink-900)' }}>
            boleto<span style={{ color: 'var(--accent-600)' }}>.eth</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-400)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Secure checkout
          </div>
        </div>
      </header>

      <div className="container-default" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'flex-start' }}>
          {/* Left: form */}
          <div className="card" style={{ padding: 36 }}>
            <div className="eyebrow" style={{ color: 'var(--accent-600)', marginBottom: 10 }}>Checkout · Step {step === 'review' ? '1' : step === 'pay' ? '2' : '3'} of 3</div>
            {step === 'review' && (
              <>
                <h1 className="h2" style={{ marginBottom: 24 }}>Review your seat</h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  {[
                    ['Section', section],
                    ['Row', row],
                    ['Seat', seat],
                    ['Price', `$${price} USDC`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ padding: '14px 16px', background: 'var(--ink-75)', borderRadius: 10, border: '1px solid var(--ink-100)' }}>
                      <div className="eyebrow" style={{ marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('pay')}>
                  Continue to payment →
                </button>
              </>
            )}

            {step === 'pay' && (
              <form onSubmit={placeOrder}>
                <h1 className="h2" style={{ marginBottom: 24 }}>Payment</h1>
                <label className="field-label" style={{ display: 'block' }}>Email for ticket delivery</label>
                <input type="email" className="input" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                <div style={{ marginTop: 24, padding: 16, background: 'var(--ink-75)', borderRadius: 10, border: '1px solid var(--ink-100)' }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Payment method</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Card', 'USDC', 'Apple Pay'].map((m, i) => (
                      <div key={m} style={{
                        flex: 1, padding: '12px 10px', textAlign: 'center',
                        border: `1px solid ${i === 0 ? 'var(--accent-500)' : 'var(--ink-150)'}`,
                        borderRadius: 8, background: 'var(--paper-card)',
                        fontSize: 13, fontWeight: 500,
                        color: i === 0 ? 'var(--accent-700)' : 'var(--ink-600)',
                      }}>{m}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-400)' }}>Demo surface · no charge is made.</div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep('review')}>Back</button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? 'Issuing ticket…' : `Pay $${price} & receive ticket`}
                  </button>
                </div>
              </form>
            )}

            {step === 'done' && (
              <>
                <h1 className="h2" style={{ marginBottom: 16 }}>Your ticket is on the way.</h1>
                <p className="lede" style={{ fontSize: 16, marginBottom: 24 }}>
                  We sent a confirmation to <strong style={{ color: 'var(--ink-900)' }}>{email || 'your email'}</strong> with the QR code. The ticket is also available as an on-chain credential.
                </p>
                <div style={{ padding: 16, background: 'var(--success-50)', border: '1px solid rgba(5,150,105,0.18)', borderRadius: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--success-600)', fontWeight: 600 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 6" /></svg>
                    Order {orderId} confirmed
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                  ENS: <span style={{ color: 'var(--accent-600)' }}>seat-{seat.toLowerCase()}.demo.boleto.eth</span>
                </div>
              </>
            )}
          </div>

          {/* Right: order summary */}
          <aside style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Your order</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 8 }}>{event}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 18 }}>Foro Sol · Mexico City · SAT 14 MAR 2026</div>
              <div className="hairline" style={{ margin: '6px 0 14px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: 'var(--ink-500)' }}>Seat {section} / {row} / {seat}</span>
                <span className="font-mono">${price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-400)', marginBottom: 6 }}>
                <span>Service fee</span><span className="font-mono">$0.00</span>
              </div>
              <div className="hairline" style={{ margin: '14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em' }}>${price}<span style={{ fontSize: 13, color: 'var(--ink-400)', marginLeft: 6 }}>USDC</span></span>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: 14, fontSize: 12, color: 'var(--ink-400)', lineHeight: 1.55, textAlign: 'center' }}>
              Your ticket is issued as an on-chain credential under EIP-712 · ERC-2981.<br />
              You don&apos;t need a wallet to receive it.
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function BuyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-400)' }}>Loading…</div>}>
      <BuyContent />
    </Suspense>
  )
}

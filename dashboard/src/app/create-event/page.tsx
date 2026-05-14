'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { CsvUploader, type CsvRow } from '@/components/CsvUploader'
import NftTicketCard from '@/components/NftTicketCard'
import { ImageUploader } from '@/components/ImageUploader'
import { Icon } from '@/components/Icon'
import { createEvent, confirmEvent } from '@/lib/api'
import { calculateFee, formatUsdc } from '@/lib/pricing'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="btn btn-primary btn-sm"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

interface FormState {
  artistSlug:     string
  eventSlug:      string
  promoterWallet: string
  eventName:      string
  eventDate:      string
  imageUri:       string
}
const defaultForm: FormState = {
  artistSlug: '', eventSlug: '', promoterWallet: '',
  eventName: '', eventDate: '', imageUri: '',
}

type WizardStep = 1 | 2 | 3 | 4
const STEPS: { id: WizardStep; title: string; desc: string }[] = [
  { id: 1, title: 'Basics',    desc: 'Name, date, image' },
  { id: 2, title: 'Inventory', desc: 'Upload seat CSV' },
  { id: 3, title: 'Treasury',  desc: 'Royalty payout wallet' },
  { id: 4, title: 'Review',    desc: 'Sign & deploy' },
]

const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
const USDC_ABI = [{
  name: 'transfer', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const

export default function CreateEventPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) router.push('/')
  }, [isConnected, router])

  const [form,        setForm]        = useState<FormState>({ ...defaultForm, promoterWallet: (address as string) || '' })
  const [tickets,     setTickets]     = useState<CsvRow[]>([])
  const [previewIdx,  setPreviewIdx]  = useState(0)
  const [wizardStep,  setWizardStep]  = useState<WizardStep>(1)
  const [phase,       setPhase]       = useState<'wizard' | 'invoice' | 'done'>('wizard')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [result,      setResult]      = useState<any>(null)
  const [confirmTxHash,    setConfirmTxHash]    = useState('')
  const [showManualHash,   setShowManualHash]   = useState(false)
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null)

  const { writeContractAsync, data: payTxHash, isPending: isPaying, reset: resetPay } = useWriteContract()
  const currentChainId = useChainId()
  const [payError, setPayError] = useState<string | null>(null)
  const [paying,   setPaying]   = useState(false)
  const [walletHint, setWalletHint] = useState(false)
  const isAwaitingWallet = paying || isPaying

  useEffect(() => {
    if (!isAwaitingWallet) { setWalletHint(false); return }
    const hint  = setTimeout(() => setWalletHint(true), 5000)
    const reset = setTimeout(() => {
      resetPay(); setPaying(false); setPayError('Request timed out. Please try again.')
    }, 45000)
    return () => { clearTimeout(hint); clearTimeout(reset) }
  }, [isAwaitingWallet, resetPay])

  const update = (key: keyof FormState, value: string) => setForm(p => ({ ...p, [key]: value }))

  const ensPreview = form.artistSlug && form.eventSlug
    ? `${form.artistSlug}-${form.eventSlug}.boleto.eth` : null

  const previewTicket = tickets[previewIdx] || null

  // Per-step validation gating "Continue"
  const canAdvance: Record<WizardStep, boolean> = {
    1: Boolean(form.artistSlug && form.eventSlug && form.eventName),
    2: tickets.length > 0,
    3: /^0x[a-fA-F0-9]{40}$/.test(form.promoterWallet.trim()),
    4: true,
  }

  // Pricing
  const { fee, tier, pricePerTicket } = tickets.length > 0
    ? calculateFee(tickets.length)
    : { fee: 0, tier: '—', pricePerTicket: 0 }

  // Submit (create invoice)
  const handleSubmit = async () => {
    if (tickets.length === 0) { setError('Please upload a CSV with at least one ticket'); return }
    setLoading(true); setError(null)
    try {
      const res = await createEvent({
        artistSlug:     form.artistSlug,
        eventSlug:      form.eventSlug,
        promoterWallet: form.promoterWallet,
        eventName:      form.eventName,
        eventDate:      form.eventDate || undefined,
        imageUri:       form.imageUri || undefined,
        tickets,
      })
      resetPay(); setPayError(null); setPaying(false)
      setResult(res); setPhase('invoice')
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  const handlePay = async () => {
    if (!result?.paymentAddress) { setPayError('Payment address not configured — contact support.'); return }
    if (currentChainId !== 1) { setPayError('Please switch to Ethereum Mainnet in your wallet, then try again.'); return }
    setPayError(null); setWalletHint(false); setPaying(true)
    try {
      await writeContractAsync({
        address: USDC_MAINNET, abi: USDC_ABI, functionName: 'transfer',
        args: [result.paymentAddress as `0x${string}`, parseUnits(String(result.feeDue), 6)],
      })
    } catch (err: any) {
      setPayError(err?.shortMessage ?? err?.message ?? 'Transaction failed')
    } finally { setPaying(false) }
  }

  const handleConfirm = async (txHash: string) => {
    setLoading(true); setError(null)
    try {
      const confirmed = await confirmEvent(result.invoiceId, txHash) as any
      if (confirmed.apiKey) localStorage.setItem('boleto_api_key', confirmed.apiKey)
      setResult(confirmed); setPhase('done')
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  if (!isConnected) return null

  // ────────────────────────────────────────────────
  // PHASE: WIZARD (4-step form)
  // ────────────────────────────────────────────────
  if (phase === 'wizard') {
    return (
      <AppShell active="create-event">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 340px', minHeight: 'calc(100vh - 56px)' }}>
          {/* Stepper */}
          <aside style={{
            padding: '32px 24px',
            borderRight: '1px solid var(--console-line)',
            background: 'var(--console-surface)',
            position: 'sticky', top: 56, alignSelf: 'start',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'white', marginBottom: 4 }}>Create event</div>
            <div style={{ fontSize: 12.5, color: 'var(--console-text-mute)', marginBottom: 28 }}>Step {wizardStep} of 4</div>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STEPS.map(s => {
                const isActive = s.id === wizardStep
                const isDone   = s.id < wizardStep
                return (
                  <li key={s.id} onClick={() => { if (s.id < wizardStep) setWizardStep(s.id) }} style={{
                    display: 'flex', gap: 12, padding: '10px 12px',
                    borderRadius: 8, cursor: s.id <= wizardStep ? 'pointer' : 'default',
                    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? 'var(--success-500)' : isActive ? 'var(--accent-500)' : 'rgba(255,255,255,0.06)',
                      color: s.id <= wizardStep ? 'white' : 'var(--console-text-mute)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600,
                    }}>{isDone ? <Icon name="check" size={11} /> : s.id}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: s.id <= wizardStep ? 'var(--console-text)' : 'var(--console-text-dim)' }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--console-text-mute)', marginTop: 1 }}>{s.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </aside>

          {/* Form */}
          <section style={{ padding: '40px 56px', maxWidth: 720, minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--accent-400)', marginBottom: 10 }}>
              Step 0{wizardStep} · {STEPS[wizardStep - 1].title}
            </div>

            {/* ── STEP 1: BASICS ── */}
            {wizardStep === 1 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em', color: 'white', marginBottom: 10 }}>
                  Choose your event name
                </h2>
                <p style={{ color: 'var(--console-text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                  Your artist + event slug become the ENS subdomain that&apos;s permanently associated with this event.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Field label="Artist slug" required>
                    <input
                      type="text" required placeholder="badbunny"
                      value={form.artistSlug}
                      onChange={e => update('artistSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="input mono"
                      style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
                    />
                  </Field>
                  <Field label="Event slug" required>
                    <input
                      type="text" required placeholder="cdmx26"
                      value={form.eventSlug}
                      onChange={e => update('eventSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="input mono"
                      style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
                    />
                  </Field>
                </div>

                <Field label="Event name" required>
                  <input
                    type="text" required placeholder="Bad Bunny — Most Wanted Tour"
                    value={form.eventName}
                    onChange={e => update('eventName', e.target.value)}
                    className="input"
                    style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
                  />
                </Field>

                <Field label="Event date" hint="When the doors open.">
                  <input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={e => update('eventDate', e.target.value)}
                    className="input mono"
                    style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
                  />
                </Field>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'white', margin: '36px 0 12px' }}>
                  Upload event image
                </h3>
                <p style={{ color: 'var(--console-text-dim)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 14 }}>
                  Appears on every ticket NFT and on OpenSea. <span style={{ color: 'var(--accent-400)' }}>Best dimensions:</span> 3000 × 3000 px square.
                </p>
                <div style={{ background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 12, padding: 20 }}>
                  <ImageUploader
                    value={form.imageUri || ''}
                    onChange={uri => update('imageUri', uri)}
                    onLocalPreview={setLocalImagePreview}
                  />
                </div>
              </>
            )}

            {/* ── STEP 2: INVENTORY (CSV) ── */}
            {wizardStep === 2 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em', color: 'white', marginBottom: 10 }}>
                  Upload your seat CSV
                </h2>
                <p style={{ color: 'var(--console-text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  One row per seat. Required columns: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>seat_number, section, row, price_usdc</code>.
                </p>
                <div style={{ background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 12, padding: 20 }}>
                  <CsvUploader onParsed={rows => { setTickets(rows); setPreviewIdx(0) }} />
                </div>

                {tickets.length > 0 && (
                  <div style={{
                    marginTop: 20, padding: 16,
                    background: 'rgba(5,150,105,0.10)',
                    border: '1px solid rgba(5,150,105,0.25)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--success-500)' }}>
                        ✓ {tickets.length.toLocaleString()} tickets ready
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--console-text-mute)', marginTop: 2 }}>
                        Tier: {tier} · ${pricePerTicket.toFixed(2)} per ticket · ${formatUsdc(fee)} USDC fee
                      </div>
                    </div>
                    {tickets.length > 1 && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--console-text-dim)' }}>
                        <button type="button" onClick={() => setPreviewIdx(i => Math.max(0, i - 1))} disabled={previewIdx === 0} className="btn btn-ghost btn-sm">←</button>
                        <span className="font-mono">{previewIdx + 1} / {tickets.length}</span>
                        <button type="button" onClick={() => setPreviewIdx(i => Math.min(tickets.length - 1, i + 1))} disabled={previewIdx === tickets.length - 1} className="btn btn-ghost btn-sm">→</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── STEP 3: TREASURY ── */}
            {wizardStep === 3 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em', color: 'white', marginBottom: 10 }}>
                  Treasury address
                </h2>
                <p style={{ color: 'var(--console-text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  Where royalties from secondary sales land. We default to your connected wallet — change it to a multisig if you prefer.
                </p>

                <Field label="Promoter wallet" required hint="Royalty payouts land here. Defaults to your connected wallet.">
                  <div className="flex gap-2">
                    <input
                      type="text" required placeholder="0x…"
                      value={form.promoterWallet}
                      onChange={e => update('promoterWallet', e.target.value)}
                      className="input mono"
                      style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3', flex: 1 }}
                    />
                    {address && form.promoterWallet !== address && (
                      <button type="button" onClick={() => update('promoterWallet', address as string)} className="btn btn-ghost btn-sm">
                        Use connected
                      </button>
                    )}
                  </div>
                </Field>

                <div style={{
                  padding: 16,
                  background: 'var(--console-card)',
                  border: '1px solid var(--console-line)',
                  borderRadius: 10,
                  marginTop: 24,
                }}>
                  <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--console-text-mute)' }}>Royalty terms</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--console-text-dim)' }}>
                    <li>· <strong style={{ color: 'var(--console-text)' }}>1% royalty</strong> to the treasury address on every secondary sale (EIP-2981).</li>
                    <li>· Enforced by OpenSea, Magic Eden, Blur and major LATAM exchanges.</li>
                    <li>· Hardcoded at deploy — cannot be re-routed after activation.</li>
                  </ul>
                </div>
              </>
            )}

            {/* ── STEP 4: REVIEW ── */}
            {wizardStep === 4 && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em', color: 'white', marginBottom: 10 }}>
                  Review &amp; deploy
                </h2>
                <p style={{ color: 'var(--console-text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  One USDC settlement on Ethereum mainnet creates the ENS subdomain and provisions your event. Then mint tickets lazily as buyers complete checkout.
                </p>

                <ReviewRow k="Event name"      v={form.eventName} />
                <ReviewRow k="ENS subdomain"   v={ensPreview || '—'} mono accent />
                <ReviewRow k="Event date"      v={form.eventDate ? new Date(form.eventDate).toLocaleString() : '—'} mono />
                <ReviewRow k="Tickets"         v={`${tickets.length.toLocaleString()} seats`} mono />
                <ReviewRow k="Treasury"        v={`${form.promoterWallet.slice(0, 10)}…${form.promoterWallet.slice(-4)}`} mono />
                <ReviewRow k="Fee tier"        v={tier} mono />
                <ReviewRow k="Rate"            v={`$${pricePerTicket.toFixed(2)} / ticket`} mono />
                <ReviewRow k="Total due"       v={`$${formatUsdc(fee)} USDC`} mono accent large />

                {error && (
                  <div style={{ marginTop: 18, padding: 12, background: 'rgba(185,28,28,0.10)', border: '1px solid rgba(185,28,28,0.3)', borderRadius: 8, color: '#FCA5A5', fontSize: 13 }}>{error}</div>
                )}
              </>
            )}

            {/* Wizard footer nav */}
            <div className="flex gap-3 mt-12">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setWizardStep(s => (Math.max(1, s - 1) as WizardStep))}
                disabled={wizardStep === 1}
              >Back</button>
              {wizardStep < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setWizardStep(s => (Math.min(4, s + 1) as WizardStep))}
                  disabled={!canAdvance[wizardStep]}
                >
                  Continue → {STEPS[wizardStep].title}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || !canAdvance[3]}
                >
                  {loading ? 'Creating invoice…' : 'Create invoice & continue to payment'}
                </button>
              )}
            </div>
          </section>

          {/* Sticky summary */}
          <aside style={{
            padding: 24,
            borderLeft: '1px solid var(--console-line)',
            background: 'var(--console-surface)',
            position: 'sticky', top: 56, alignSelf: 'start', maxHeight: 'calc(100vh - 56px)', overflow: 'auto',
          }}>
            <div className="eyebrow" style={{ color: 'var(--console-text-mute)', marginBottom: 14 }}>Event preview</div>
            <div style={{ padding: 16, background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--console-text-mute)', marginBottom: 4 }}>ENS subdomain</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--accent-400)', wordBreak: 'break-all' }}>
                {ensPreview || 'artist-event.boleto.eth'}
              </div>
            </div>

            {/* NFT preview */}
            <div style={{ marginBottom: 16, transform: 'scale(0.62)', transformOrigin: 'top left', height: 360, overflow: 'visible' }}>
              {previewTicket ? (
                <NftTicketCard
                  seatNumber={previewTicket['seat_number'] || '—'}
                  eventName={form.eventName || 'Event name'}
                  ensName={ensPreview || 'artist-event.boleto.eth'}
                  imageUri={localImagePreview || form.imageUri || undefined}
                  csvAttributes={previewTicket}
                />
              ) : (
                <NftTicketCard
                  seatNumber="A12"
                  eventName={form.eventName || 'Event name'}
                  ensName={ensPreview || 'artist-event.boleto.eth'}
                  imageUri={localImagePreview || form.imageUri || undefined}
                  csvAttributes={{ section: 'VIP', row: 'A', price_usdc: '180.00' }}
                />
              )}
            </div>

            <div className="eyebrow" style={{ color: 'var(--console-text-mute)', marginBottom: 8 }}>Cost breakdown</div>
            <div style={{ padding: 16, background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SummaryRow k="Tickets"          v={tickets.length > 0 ? tickets.length.toLocaleString() : '—'} />
              <SummaryRow k="Tier"             v={tickets.length > 0 ? tier : '—'} />
              <SummaryRow k="Rate"             v={tickets.length > 0 ? `$${pricePerTicket.toFixed(2)} / ticket` : '—'} />
              <SummaryRow k="ENS registration" v="1× included" />
              <div style={{ borderTop: '1px solid var(--console-line)', paddingTop: 10, marginTop: 4 }}>
                <div style={{ fontSize: 11.5, color: 'var(--console-text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total due</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'white', letterSpacing: '-0.02em', marginTop: 4 }}>
                  ${tickets.length > 0 ? formatUsdc(fee) : '—'}<span style={{ fontSize: 13, color: 'var(--console-text-mute)', marginLeft: 4 }}>USDC</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--console-text-mute)', marginTop: 4 }}>Settled on Ethereum mainnet</div>
              </div>
            </div>
          </aside>
        </div>
      </AppShell>
    )
  }

  // ────────────────────────────────────────────────
  // PHASE: INVOICE (payment)
  // ────────────────────────────────────────────────
  if (phase === 'invoice' && result) {
    return (
      <AppShell active="create-event">
        <div className="max-w-lg mx-auto px-8 py-12 space-y-6">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-400)' }}>Step 2 of 2 · Payment</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', color: 'white', marginTop: 8 }}>Invoice created.</h1>
            <p style={{ color: 'var(--console-text-dim)', fontSize: 14, marginTop: 6 }}>
              Send USDC on Ethereum mainnet to activate the event. We&apos;ll watch the chain and confirm automatically.
            </p>
          </div>

          <div style={{ padding: 24, background: 'var(--console-card)', border: '1px solid rgba(226,88,34,0.30)', borderRadius: 12 }} className="space-y-3">
            <SummaryRow k="Invoice ID" v={result.invoiceId} />
            <SummaryRow k="ENS name"   v={result.ensName} />
            <SummaryRow k="Tickets"    v={result.ticketCount?.toLocaleString()} />
            <div style={{ borderTop: '1px solid var(--console-line)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, color: 'var(--console-text)' }}>Amount due</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--accent-400)', letterSpacing: '-0.02em' }}>${result.feeDue} USDC</span>
            </div>
            <div style={{ padding: 12, background: 'var(--console-bg)', border: '1px solid var(--console-line)', borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--console-text-mute)', marginBottom: 4 }}>Send USDC to</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--console-text)', wordBreak: 'break-all' }}>{result.paymentAddress}</div>
            </div>
          </div>

          <div style={{ padding: 20, background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 12 }} className="space-y-4">
            {!payTxHash ? (
              <>
                <button onClick={handlePay} disabled={isAwaitingWallet} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {isAwaitingWallet ? 'Approve in wallet…' : `Pay $${result.feeDue} USDC`}
                </button>
                {walletHint && (
                  <p style={{ fontSize: 12.5, color: 'var(--accent-400)', textAlign: 'center' }}>
                    Open your wallet on your phone — the transaction is waiting for approval.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div style={{ padding: 12, background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.30)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--success-500)', marginBottom: 4 }}>Payment submitted</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--console-text-dim)', wordBreak: 'break-all' }}>{payTxHash}</div>
                </div>
                <button onClick={() => handleConfirm(payTxHash)} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {loading ? 'Activating event…' : 'Activate event'}
                </button>
              </div>
            )}
            {payError && <p style={{ color: '#FCA5A5', fontSize: 13 }}>{payError}</p>}

            <button type="button" onClick={() => setShowManualHash(v => !v)} style={{ background: 'transparent', border: 'none', color: 'var(--console-text-mute)', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', width: '100%' }}>
              {showManualHash ? 'Hide manual entry' : 'Already sent payment? Enter tx hash'}
            </button>
            {showManualHash && (
              <div className="space-y-3">
                <input
                  type="text" placeholder="0x… transaction hash"
                  value={confirmTxHash} onChange={e => setConfirmTxHash(e.target.value)}
                  className="input mono" style={{ background: '#0F1626', borderColor: '#1F2A44', color: '#E8ECF3' }}
                />
                <button onClick={() => handleConfirm(confirmTxHash)} disabled={loading || confirmTxHash.length !== 66} className="btn btn-secondary" style={{ width: '100%' }}>
                  {loading ? 'Confirming…' : 'Confirm manual payment'}
                </button>
              </div>
            )}
            {error && <p style={{ color: '#FCA5A5', fontSize: 13 }}>{error}</p>}
          </div>
        </div>
      </AppShell>
    )
  }

  // ────────────────────────────────────────────────
  // PHASE: DONE
  // ────────────────────────────────────────────────
  return (
    <AppShell active="create-event">
      <div className="max-w-lg mx-auto px-8 py-12 space-y-6">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
            background: 'rgba(5,150,105,0.16)', border: '2px solid var(--success-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={36} style={{ color: 'var(--success-500)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'white' }}>Event live.</h1>
        </div>

        {result?.apiKey && (
          <div style={{ padding: 20, background: 'rgba(5,150,105,0.08)', border: '2px solid rgba(5,150,105,0.45)', borderRadius: 12 }} className="space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-500)', fontWeight: 600 }}>
              <Icon name="key" size={16} /> Your API key — save this now
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--console-text-dim)' }}>{result.apiKeyNote}</p>
            <div className="flex items-center gap-2">
              <code style={{ flex: 1, background: 'var(--console-bg)', border: '1px solid rgba(5,150,105,0.30)', borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--success-500)', wordBreak: 'break-all' }}>
                {result.apiKey}
              </code>
              <CopyButton text={result.apiKey} />
            </div>
            <p style={{ fontSize: 12, color: '#FCA5A5' }}>This key won&apos;t be shown again. Copy it before leaving this page.</p>
          </div>
        )}

        <div style={{ padding: 20, background: 'var(--console-card)', border: '1px solid var(--console-line)', borderRadius: 12 }} className="space-y-3">
          <SummaryRow k="ENS name"   v={result?.ensName} mono accent />
          <SummaryRow k="Contract"   v={result?.contractAddress} mono />
          <SummaryRow k="Event ID"   v={result?.onChainEventId} mono />
        </div>

        <Link href={`/events?id=${result?.eventId}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          View event &amp; inventory
        </Link>
      </div>
    </AppShell>
  )
}

// ────────────────────────────────────────────────
// Small helpers
// ────────────────────────────────────────────────
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--console-text-dim)' }}>
        {label}{required && <span style={{ color: 'var(--accent-400)' }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--console-text-mute)', marginTop: 6 }}>{hint}</div>}
    </div>
  )
}

function SummaryRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span style={{ color: 'var(--console-text-dim)' }}>{k}</span>
      <span style={{ color: 'var(--console-text)', fontFamily: 'var(--font-mono)', maxWidth: '60%', wordBreak: 'break-all', textAlign: 'right' }}>{v ?? '—'}</span>
    </div>
  )
}

function ReviewRow({ k, v, mono, accent, large }: { k: string; v: string; mono?: boolean; accent?: boolean; large?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderBottom: '1px solid var(--console-line)',
      fontSize: 14,
    }}>
      <span style={{ color: 'var(--console-text-dim)' }}>{k}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: accent ? 'var(--accent-400)' : 'var(--console-text)',
        fontSize: large ? 20 : 14,
        fontWeight: large ? 600 : 500,
        maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all',
      }}>{v}</span>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useChainId } from 'wagmi'
import { parseUnits } from 'viem'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { CsvUploader, type CsvRow } from '@/components/CsvUploader'
import { PricingCalculator } from '@/components/PricingCalculator'
import NftTicketCard from '@/components/NftTicketCard'
import { ImageUploader } from '@/components/ImageUploader'
import { createEvent, confirmEvent } from '@/lib/api'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex-shrink-0 bg-[#22c55e] text-black font-mono font-bold px-4 py-3 rounded hover:bg-[#16a34a] transition-colors text-sm"
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
  artistSlug:     '',
  eventSlug:      '',
  promoterWallet: '',
  eventName:      '',
  eventDate:      '',
  imageUri:       '',
}

export default function CreateEventPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) router.push('/')
  }, [isConnected, router])

  const [form, setForm]         = useState<FormState>({ ...defaultForm, promoterWallet: (address as string) || '' })
  const [tickets, setTickets]   = useState<CsvRow[]>([])
  const [previewIdx, setPreviewIdx] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<any>(null)
  const [error, setError]       = useState<string | null>(null)
  const [step, setStep]         = useState<'form' | 'invoice' | 'done'>('form')
  const [confirmTxHash, setConfirmTxHash] = useState('')
  const [showManualHash, setShowManualHash] = useState(false)
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null)

  const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
  const USDC_ABI = [{
    name: 'transfer', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  }] as const

  const { writeContractAsync, data: payTxHash, isPending: isPaying, reset: resetPay } = useWriteContract()
  const currentChainId = useChainId()
  const [payError, setPayError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [walletHint, setWalletHint] = useState(false)

  const isAwaitingWallet = paying || isPaying

  useEffect(() => {
    if (!isAwaitingWallet) { setWalletHint(false); return }
    const hint = setTimeout(() => setWalletHint(true), 5000)
    const reset = setTimeout(() => {
      resetPay()
      setPaying(false)
      setPayError('Request timed out. Please try again.')
    }, 45000)
    return () => { clearTimeout(hint); clearTimeout(reset) }
  }, [isAwaitingWallet])

  const handlePay = async () => {
    if (!result?.paymentAddress) { setPayError('Payment address not configured — contact support.'); return }
    if (currentChainId !== 1) { setPayError('Please switch to Ethereum Mainnet in your wallet, then try again.'); return }
    setPayError(null)
    setWalletHint(false)
    setPaying(true)
    try {
      await writeContractAsync({
        address: USDC_MAINNET,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [result.paymentAddress as `0x${string}`, parseUnits(String(result.feeDue), 6)],
      })
    } catch (err: any) {
      setPayError(err?.shortMessage ?? err?.message ?? 'Transaction failed')
    } finally {
      setPaying(false)
    }
  }

  const update = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const ensPreview =
    form.artistSlug && form.eventSlug
      ? `${form.artistSlug}-${form.eventSlug}.boleto.eth`
      : null

  const previewTicket = tickets[previewIdx] || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tickets.length === 0) { setError('Please upload a CSV with at least one ticket'); return }
    setLoading(true)
    setError(null)
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
      resetPay()
      setPayError(null)
      setPaying(false)
      setResult(res)
      setStep('invoice')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (txHash: string) => {
    setLoading(true)
    setError(null)
    try {
      const confirmed = await confirmEvent(result.invoiceId, txHash) as any
      if (confirmed.apiKey) localStorage.setItem('boleto_api_key', confirmed.apiKey)
      setResult(confirmed)
      setStep('done')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) return null

  return (
    <AppShell active="create-event">
      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* ── STEP 1: FORM ── */}
        {step === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Left: form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <h1 className="font-mono text-2xl font-bold">Create Event</h1>

              {ensPreview && (
                <div className="bg-[#E25822]/10 border border-[#E25822]/30 rounded-lg p-4">
                  <p className="text-xs text-[#8B95AB] mb-1">ENS Subdomain</p>
                  <p className="font-mono text-[#E25822]">{ensPreview}</p>
                </div>
              )}

              {/* Slugs + name */}
              <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-4">
                <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Event Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#8B95AB] mb-1">Artist Slug</label>
                    <input
                      type="text" placeholder="badbunny" required
                      value={form.artistSlug}
                      onChange={(e) => update('artistSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8B95AB] mb-1">Event Slug</label>
                    <input
                      type="text" placeholder="miami25" required
                      value={form.eventSlug}
                      onChange={(e) => update('eventSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#8B95AB] mb-1">Event Name</label>
                  <input
                    type="text" placeholder="Bad Bunny — Miami 2025" required
                    value={form.eventName}
                    onChange={(e) => update('eventName', e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8B95AB] mb-1">Event Date</label>
                  <input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={(e) => update('eventDate', e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8B95AB] mb-1">Promoter Wallet</label>
                  <input
                    type="text" placeholder="0x..." required
                    value={form.promoterWallet}
                    onChange={(e) => update('promoterWallet', e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                  />
                </div>
              </div>

              {/* Event image */}
              <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-3">
                <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Event Image</h2>
                <ImageUploader
                  value={form.imageUri || ''}
                  onChange={(uri) => update('imageUri', uri)}
                  onLocalPreview={setLocalImagePreview}
                />
                <p className="text-xs text-[#5E6A85]">Appears on every ticket NFT. Leave blank to use the concert graphic.</p>
                <p className="text-xs text-[#5E6A85] leading-relaxed">
                  <span className="text-[#E25822] font-mono">Best dimensions:</span> 3000 × 3000 px (1:1 square) — displays perfectly on OpenSea and all marketplaces. Minimum 1000 × 1000 px.
                </p>
              </div>

              {/* CSV uploader */}
              <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-5 space-y-3">
                <h2 className="font-mono font-bold text-xs text-[#8B95AB] uppercase tracking-wider">Tickets CSV</h2>
                <CsvUploader onParsed={(rows) => { setTickets(rows); setPreviewIdx(0) }} />
                {tickets.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#22c55e] font-mono">{tickets.length} tickets loaded</span>
                    {tickets.length > 1 && (
                      <div className="ml-auto flex gap-1">
                        <button type="button" onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                          disabled={previewIdx === 0}
                          className="px-2 py-0.5 text-xs bg-[#1F2A44] rounded disabled:opacity-30 hover:bg-[#2B395C]">
                          ←
                        </button>
                        <span className="text-xs text-[#5E6A85] font-mono px-1">
                          {previewIdx + 1} / {tickets.length}
                        </span>
                        <button type="button" onClick={() => setPreviewIdx((i) => Math.min(tickets.length - 1, i + 1))}
                          disabled={previewIdx === tickets.length - 1}
                          className="px-2 py-0.5 text-xs bg-[#1F2A44] rounded disabled:opacity-30 hover:bg-[#2B395C]">
                          →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              {tickets.length > 0 && (
                <PricingCalculator ticketCount={tickets.length} onChange={() => {}} />
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm font-mono">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || tickets.length === 0}
                className="w-full bg-[#E25822] text-white font-mono font-bold py-4 rounded-lg hover:bg-[#ED7144] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Event & Get API Key'}
              </button>
            </form>

            {/* Right: NFT preview */}
            <div className="lg:sticky lg:top-6">
              <p className="text-xs text-[#5E6A85] font-mono mb-4 uppercase tracking-wider">NFT Preview</p>
              {previewTicket ? (
                <NftTicketCard
                  seatNumber={previewTicket['seat_number'] || '—'}
                  eventName={form.eventName || 'Event Name'}
                  ensName={ensPreview || 'artist-event.boleto.eth'}
                  imageUri={localImagePreview || form.imageUri || undefined}
                  csvAttributes={previewTicket}
                />
              ) : (
                <NftTicketCard
                  seatNumber="A-101"
                  eventName={form.eventName || 'Event Name'}
                  ensName={ensPreview || 'artist-event.boleto.eth'}
                  imageUri={localImagePreview || form.imageUri || undefined}
                  csvAttributes={{ section: 'Floor VIP', row: 'A', gate: '1', price_usdc: '150.00' }}
                />
              )}
              <p className="text-xs text-[#5E6A85] font-mono mt-3 text-center">
                {previewTicket ? 'Preview shows your actual ticket data' : 'Upload CSV to see your ticket data'}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: INVOICE + PAYMENT ── */}
        {step === 'invoice' && result && (
          <div className="max-w-lg mx-auto space-y-6">
            <h1 className="font-mono text-2xl font-bold">Invoice Created</h1>

            <div className="bg-[#131C30] border border-[#E25822]/30 rounded-xl p-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">Invoice ID</span>
                <span className="font-mono text-[#E8ECF3]">{result.invoiceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">ENS Name</span>
                <span className="font-mono text-[#E25822]">{result.ensName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">Tickets</span>
                <span className="font-mono text-[#E8ECF3]">{result.ticketCount?.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#1F2A44] pt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Amount Due</span>
                <span className="font-mono text-3xl font-bold text-[#E25822]">${result.feeDue} USDC</span>
              </div>
              <div className="bg-[#0F1626] rounded-lg p-4">
                <p className="text-xs text-[#8B95AB] mb-1">Send USDC on Ethereum to</p>
                <p className="font-mono text-sm text-[#E8ECF3] break-all">{result.paymentAddress}</p>
              </div>
            </div>

            <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-4">
              <h2 className="font-mono font-bold">Pay & Activate</h2>

              {!payTxHash ? (
                <>
                  <button
                    onClick={handlePay}
                    disabled={isAwaitingWallet}
                    className="w-full bg-[#E25822] text-white font-mono font-bold py-4 rounded-lg hover:bg-[#ED7144] transition-colors disabled:opacity-50 text-lg"
                  >
                    {isAwaitingWallet ? 'Approve in Wallet…' : `Pay $${result.feeDue} USDC`}
                  </button>
                  {walletHint && (
                    <p className="text-xs text-[#E25822] font-mono text-center">
                      Open Trust Wallet on your phone — the transaction is waiting for your approval.
                    </p>
                  )}
                </>

              ) : (
                <div className="space-y-3">
                  <div className="bg-[#0F1626] border border-[#22c55e]/30 rounded-lg p-3">
                    <p className="text-xs text-[#22c55e] mb-1">Payment submitted</p>
                    <p className="font-mono text-xs text-[#8B95AB] break-all">{payTxHash}</p>
                  </div>
                  <button
                    onClick={() => handleConfirm(payTxHash)}
                    disabled={loading}
                    className="w-full bg-[#22c55e] text-black font-mono font-bold py-4 rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50 text-lg"
                  >
                    {loading ? 'Activating event…' : 'Activate Event'}
                  </button>
                </div>
              )}

              {payError && <p className="text-red-400 text-xs font-mono">{payError}</p>}

              <button
                type="button"
                onClick={() => setShowManualHash((v) => !v)}
                className="text-xs text-[#5E6A85] hover:text-[#8B95AB] underline w-full text-center"
              >
                {showManualHash ? 'Hide manual entry' : 'Already sent payment manually? Enter tx hash'}
              </button>
              {showManualHash && (
                <div className="space-y-3">
                  <input
                    type="text" placeholder="0x... transaction hash"
                    value={confirmTxHash}
                    onChange={(e) => setConfirmTxHash(e.target.value)}
                    className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822] text-sm"
                  />
                  <button
                    onClick={() => handleConfirm(confirmTxHash)}
                    disabled={loading || !confirmTxHash || confirmTxHash.length !== 66}
                    className="w-full bg-[#2B395C] text-white font-mono font-bold py-3 rounded-lg hover:bg-[#5E6A85] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Confirming…' : 'Confirm Manual Payment'}
                  </button>
                </div>
              )}
              {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === 'done' && result && (
          <div className="max-w-lg mx-auto space-y-6 text-center">
            <div className="text-6xl">🎟️</div>
            <h1 className="font-mono text-2xl font-bold text-[#E25822]">Event Active!</h1>

            {result.apiKey ? (
              <div className="bg-[#0d1f0d] border-2 border-[#22c55e]/60 rounded-xl p-6 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  <span className="font-mono font-bold text-[#22c55e]">Your API Key — Save This Now</span>
                </div>
                <p className="text-xs text-[#9CA3AF]">{result.apiKeyNote}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#0F1626] border border-[#22c55e]/30 rounded px-3 py-3 font-mono text-sm text-[#22c55e] break-all">
                    {result.apiKey}
                  </code>
                  <CopyButton text={result.apiKey} />
                </div>
                <p className="text-xs text-[#ef4444] font-mono">
                  This key will not be shown again. Copy it before leaving this page.
                </p>
              </div>
            ) : (
              <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-4 text-left">
                <p className="text-sm text-[#8B95AB]">🔑 {result.apiKeyNote}</p>
              </div>
            )}

            <div className="bg-[#131C30] border border-[#22c55e]/30 rounded-xl p-8 space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">ENS Name</span>
                <span className="font-mono text-[#E25822]">{result.ensName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">Contract</span>
                <span className="font-mono text-xs text-[#E8ECF3] break-all">{result.contractAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B95AB]">On-Chain Event ID</span>
                <span className="font-mono text-xs text-[#E8ECF3] break-all">{result.onChainEventId}</span>
              </div>
            </div>

            <Link
              href={`/events?id=${result.eventId}`}
              className="inline-block bg-[#E25822] text-white font-mono font-bold px-8 py-3 rounded-lg hover:bg-[#ED7144] transition-colors"
            >
              View Event & Inventory
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}

'use client'

import { calculateFee, formatUsdc, PRICING_TIERS } from '@/lib/pricing'

interface Props {
  ticketCount: number
  onChange?: (count: number) => void
}

export function PricingCalculator({ ticketCount }: Props) {
  const { fee, tier, pricePerTicket } = calculateFee(ticketCount)

  return (
    <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6">
      <h3 className="font-mono font-bold text-[#f97316] mb-4">Protocol Fee</h3>

      <div className="mb-4 bg-[#111] border border-[#1f1f1f] rounded px-3 py-2 flex justify-between items-center">
        <span className="text-xs text-[#666]">Tickets from CSV</span>
        <span className="font-mono text-[#f0f0f0] font-bold">{ticketCount.toLocaleString()}</span>
      </div>

      {/* Tier breakdown */}
      <div className="space-y-1 mb-4">
        {PRICING_TIERS.map((t, i) => (
          <div
            key={i}
            className={`flex justify-between text-xs px-2 py-1 rounded ${
              t.label === tier ? 'bg-[#f97316]/10 text-[#f97316]' : 'text-[#666]'
            }`}
          >
            <span>{t.range}</span>
            <span className="font-mono">${t.pricePerTicket.toFixed(2)}/ticket</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1f1f1f] pt-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-[#666]">Upfront protocol fee</p>
          <p className="text-xs text-[#666]">${pricePerTicket.toFixed(2)} × {ticketCount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[#f97316]">${formatUsdc(fee)}</p>
          <p className="text-xs text-[#666]">USDC</p>
        </div>
      </div>
    </div>
  )
}

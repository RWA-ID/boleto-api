'use client'

import { calculateFee, formatUsdc, PRICING_TIERS } from '@/lib/pricing'

interface Props {
  ticketCount: number
  onChange?: (count: number) => void
}

export function PricingCalculator({ ticketCount }: Props) {
  const { fee, tier, pricePerTicket } = calculateFee(ticketCount)

  return (
    <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6">
      <h3 className="font-mono font-bold text-[#E25822] mb-4">Protocol Fee</h3>

      <div className="mb-4 bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 flex justify-between items-center">
        <span className="text-xs text-[#8B95AB]">Tickets from CSV</span>
        <span className="font-mono text-[#E8ECF3] font-bold">{ticketCount.toLocaleString()}</span>
      </div>

      {/* Tier breakdown */}
      <div className="space-y-1 mb-4">
        {PRICING_TIERS.map((t, i) => (
          <div
            key={i}
            className={`flex justify-between text-xs px-2 py-1 rounded ${
              t.label === tier ? 'bg-[#E25822]/10 text-[#E25822]' : 'text-[#8B95AB]'
            }`}
          >
            <span>{t.range}</span>
            <span className="font-mono">${t.pricePerTicket.toFixed(2)}/ticket</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1F2A44] pt-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-[#8B95AB]">Upfront protocol fee</p>
          <p className="text-xs text-[#8B95AB]">${pricePerTicket.toFixed(2)} × {ticketCount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-[#E25822]">${formatUsdc(fee)}</p>
          <p className="text-xs text-[#8B95AB]">USDC</p>
        </div>
      </div>
    </div>
  )
}

export const PRICING_TIERS = [
  { max: 999,      pricePerTicket: 0.35, label: 'Standard',   range: '1 – 999 tickets'          },
  { max: 9_999,    pricePerTicket: 0.25, label: 'Pro',        range: '1,000 – 9,999 tickets'    },
  { max: Infinity, pricePerTicket: 0.15, label: 'Enterprise', range: '10,000+ tickets'           },
]

export function calculateFee(ticketCount: number): { fee: number; tier: string; pricePerTicket: number } {
  if (ticketCount <= 0) return { fee: 0, tier: '', pricePerTicket: 0 }
  const tier = PRICING_TIERS.find((t) => ticketCount <= t.max) ?? PRICING_TIERS[PRICING_TIERS.length - 1]
  return {
    fee:            ticketCount * tier.pricePerTicket,
    tier:           tier.label,
    pricePerTicket: tier.pricePerTicket,
  }
}

export function formatUsdc(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

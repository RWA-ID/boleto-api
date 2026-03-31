/**
 * Volume-based pricing tiers for the boleto.eth platform fee.
 * More volume = lower per-ticket cost.
 *
 * Tier 1 — up to 999 tickets:      $0.35 / ticket
 * Tier 2 — 1,000 – 9,999 tickets:  $0.25 / ticket
 * Tier 3 — 10,000+ tickets:        $0.15 / ticket
 */

export type PricingTier = {
  label:      string
  perTicket:  number        // USD
  maxTickets: number | null
}

export const PRICING_TIERS: PricingTier[] = [
  { label: 'Standard',     perTicket: 0.35, maxTickets: 999   },
  { label: 'Pro',          perTicket: 0.25, maxTickets: 9999  },
  { label: 'Enterprise',   perTicket: 0.15, maxTickets: null  },
]

export function getTier(ticketCount: number): PricingTier {
  for (const tier of PRICING_TIERS) {
    if (tier.maxTickets === null || ticketCount <= tier.maxTickets) return tier
  }
  return PRICING_TIERS[PRICING_TIERS.length - 1]
}

export function calculateFeeHuman(ticketCount: number): string {
  if (ticketCount <= 0) throw new Error('ticketCount must be > 0')
  const tier = getTier(ticketCount)
  return (ticketCount * tier.perTicket).toFixed(2)
}

export function calculateFeeRaw(ticketCount: number): bigint {
  const human = calculateFeeHuman(ticketCount)
  return BigInt(Math.round(parseFloat(human) * 1_000_000))
}

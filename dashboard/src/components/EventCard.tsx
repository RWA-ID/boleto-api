'use client'

import Link from 'next/link'

interface EventCardProps {
  id: string
  eventName: string
  ensName: string
  status: 'pending_payment' | 'active' | 'cancelled'
  ticketCount: number
  minted?: number
  eventDate?: string
  venueName?: string
}

const STATUS_COLORS = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  active: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}

const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  active: 'Active',
  cancelled: 'Cancelled',
}

export function EventCard({
  id,
  eventName,
  ensName,
  status,
  ticketCount,
  minted = 0,
  eventDate,
  venueName,
}: EventCardProps) {
  const mintedPct = ticketCount > 0 ? (minted / ticketCount) * 100 : 0

  return (
    <Link href={`/events/${id}`}>
      <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 hover:border-[#E25822]/40 hover:shadow-[0_0_20px_rgba(226, 88, 34,0.1)] transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-[#E8ECF3] text-lg leading-tight">{eventName}</h3>
          <span className={`text-xs px-2 py-1 rounded font-mono ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        <p className="font-mono text-sm text-[#E25822] mb-3">{ensName}</p>

        {venueName && (
          <p className="text-sm text-[#8B95AB] mb-1">{venueName}</p>
        )}
        {eventDate && (
          <p className="text-sm text-[#8B95AB] mb-4">
            {new Date(eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}

        {status === 'active' && (
          <div>
            <div className="flex justify-between text-xs text-[#8B95AB] mb-1">
              <span>{minted.toLocaleString()} sold</span>
              <span>{(ticketCount - minted).toLocaleString()} available</span>
            </div>
            <div className="w-full bg-[#0F1626] rounded-full h-1.5">
              <div
                className="bg-[#E25822] h-1.5 rounded-full transition-all"
                style={{ width: `${mintedPct}%` }}
              />
            </div>
            <p className="text-xs text-[#8B95AB] mt-1">{mintedPct.toFixed(1)}% sold</p>
          </div>
        )}
      </div>
    </Link>
  )
}

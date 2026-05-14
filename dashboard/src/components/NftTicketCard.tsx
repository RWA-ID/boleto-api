// Preserved API. Now renders the redesigned CredentialTicket.
import { CredentialTicket } from './CredentialTicket'

interface NftTicketCardProps {
  seatNumber?: string
  eventName?: string
  ensName?: string
  imageUri?: string
  csvAttributes?: Record<string, string | undefined>
}

export default function NftTicketCard({
  seatNumber,
  eventName,
  ensName,
  csvAttributes,
}: NftTicketCardProps) {
  return (
    <CredentialTicket
      seatNumber={seatNumber}
      eventName={eventName}
      ensName={ensName}
      section={csvAttributes?.section}
      row={csvAttributes?.row}
      priceUsdc={csvAttributes?.price_usdc}
    />
  )
}

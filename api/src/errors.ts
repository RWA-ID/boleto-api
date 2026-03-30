export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message?: string
  ) {
    super(message || code)
    this.name = 'ApiError'
  }
}

export const Errors = {
  ARTIST_SLUG_RESERVED:  () => new ApiError('artist_slug_reserved',  400, 'Artist slug is reserved'),
  SLUG_INVALID_FORMAT:   () => new ApiError('slug_invalid_format',    400, 'Slug must be lowercase alphanumeric + hyphens only'),
  EVENT_ALREADY_EXISTS:  () => new ApiError('event_already_exists',   409, 'Event with this ENS name already exists'),
  TICKET_COUNT_ZERO:     () => new ApiError('ticket_count_zero',      400, 'ticketCount must be > 0'),
  EVENT_NOT_FOUND:       () => new ApiError('event_not_found',        404, 'Event not found'),
  EVENT_NOT_ACTIVE:      () => new ApiError('event_not_active',       400, 'Event is not active'),
  TICKET_NOT_FOUND:      () => new ApiError('ticket_not_found',       404, 'Ticket not found'),
  TICKET_ALREADY_MINTED: () => new ApiError('ticket_already_minted',  409, 'Ticket is already minted'),
  PAYMENT_NOT_VERIFIED:  () => new ApiError('payment_not_verified',   400, 'Could not verify USDC payment on-chain'),
  INVOICE_NOT_FOUND:     () => new ApiError('invoice_not_found',      404, 'Invoice not found'),
  UNAUTHORIZED:          () => new ApiError('unauthorized',           401, 'Invalid or missing API key'),
  CSV_PARSE_ERROR:       () => new ApiError('csv_parse_error',        400, 'Could not parse CSV — check format'),
  SEAT_NUMBER_MISSING:   () => new ApiError('seat_number_missing',    400, 'CSV must have a seat_number column'),
}

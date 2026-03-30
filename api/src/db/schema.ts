import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const platforms = pgTable('platforms', {
  id:            uuid('id').primaryKey().defaultRandom(),
  name:          text('name').notNull(),
  walletAddress: text('wallet_address'),
  apiKey:        text('api_key').unique().notNull(),
  createdAt:     timestamp('created_at').defaultNow(),
})

export const events = pgTable('events', {
  id:             uuid('id').primaryKey().defaultRandom(),
  platformId:     uuid('platform_id').references(() => platforms.id),
  invoiceId:      text('invoice_id').unique().notNull(),
  artistSlug:     text('artist_slug').notNull(),
  eventSlug:      text('event_slug').notNull(),
  ensName:        text('ens_name').unique().notNull(),        // badbunny-miami25.boleto.eth
  onChainEventId: text('on_chain_event_id'),                 // bytes32 keccak256 of ensName
  promoterWallet: text('promoter_wallet').notNull(),
  totalTickets:   integer('total_tickets').notNull(),
  feePaidUsdc:    text('fee_paid_usdc').notNull(),
  paymentTxHash:  text('payment_tx_hash'),
  l1TxHash:       text('l1_tx_hash'),                        // ENS registration tx
  registerTxHash: text('register_tx_hash'),                  // BoletoTickets.registerEvent tx
  status:         text('status').notNull().default('pending_payment'),
  // pending_payment | active | cancelled
  eventName:      text('event_name').notNull(),
  eventDate:      timestamp('event_date'),
  imageUri:       text('image_uri'),                         // IPFS URI for event image
  createdAt:      timestamp('created_at').defaultNow(),
})

export const tickets = pgTable('tickets', {
  id:          uuid('id').primaryKey().defaultRandom(),
  eventId:     uuid('event_id').references(() => events.id).notNull(),
  seatNumber:  text('seat_number').notNull(),                // from CSV — the ticket identifier
  priceUsdc:   text('price_usdc').notNull(),
  metadata:    text('metadata').notNull(),                   // JSON string of all CSV columns
  metadataUri: text('metadata_uri'),                         // IPFS URI (set after upload)
  qrCodeUri:   text('qr_code_uri'),                          // IPFS URI of QR code image
  tokenId:     text('token_id'),                             // null until minted
  ownerWallet: text('owner_wallet'),                         // null until minted
  mintTxHash:  text('mint_tx_hash'),
  minted:      boolean('minted').default(false),
  createdAt:   timestamp('created_at').defaultNow(),
})

export const reservedArtists = pgTable('reserved_artists', {
  slug:           text('slug').primaryKey(),
  normalizedSlug: text('normalized_slug').unique().notNull(),
  addedAt:        timestamp('added_at').defaultNow(),
})

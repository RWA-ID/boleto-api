import { Router, Request, Response, NextFunction } from 'express'
import type { Address } from 'viem'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from 'crypto'
import { db, schema } from '../db'
import { normalizeSlug, isValidSlug } from '../services/slugNormalize'
import { calculateFeeHuman, calculateFeeRaw } from '../services/pricing'
import { verifyUsdcPayment } from '../services/payment'
import { uploadTicketMetadata } from '../services/ipfs'
import {
  registerEventOnChain,
  registerEnsSubdomain,
  registerSeatSubdomain,
  normalizeSeatLabel,
  signTicketVoucher,
  mintTicket,
} from '../services/contracts'
import { requireApiKey } from '../middleware/auth'
import { Errors } from '../errors'

const router = Router()

// ── GET /v1/events  (list all events for authenticated promoter) ──────────────

router.get('/', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await db.query.events.findMany({
      where: eq(schema.events.promoterWallet, req.platform!.walletAddress!),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
    })
    res.json({
      promoterName: req.platform!.promoterName || req.platform!.name,
      bannerUri:    req.platform!.bannerUri,
      events: events.map((e) => ({
        id:           e.id,
        invoiceId:    e.invoiceId,
        eventName:    e.eventName,
        ensName:      e.ensName,
        status:       e.status,
        totalTickets: e.totalTickets,
        feeDue:       e.status === 'pending_payment' ? e.feePaidUsdc : undefined,
        eventDate:    e.eventDate,
        imageUri:     e.imageUri,
        createdAt:    e.createdAt,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events ───────────────────────────────────────────────────────────

const CreateEventSchema = z.object({
  artistSlug:     z.string().min(1).max(50),
  eventSlug:      z.string().min(1).max(50),
  promoterWallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
  eventName:      z.string().min(1).max(200),
  eventDate:      z.string().optional(),
  imageUri:       z.string().optional(),
  tickets:        z.array(z.record(z.string())).min(1),
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateEventSchema.parse(req.body)

    if (!isValidSlug(body.artistSlug)) throw Errors.SLUG_INVALID_FORMAT()
    if (!isValidSlug(body.eventSlug))  throw Errors.SLUG_INVALID_FORMAT()

    const normalizedArtist = normalizeSlug(body.artistSlug)
    const reserved = await db.query.reservedArtists.findFirst({
      where: eq(schema.reservedArtists.normalizedSlug, normalizedArtist),
    })
    if (reserved) throw Errors.ARTIST_SLUG_RESERVED()

    const ensName = `${body.artistSlug}-${body.eventSlug}.boleto.eth`
    const existing = await db.query.events.findFirst({
      where: eq(schema.events.ensName, ensName),
    })
    if (existing) throw Errors.EVENT_ALREADY_EXISTS()

    for (const row of body.tickets) {
      if (!row['seat_number']) throw Errors.SEAT_NUMBER_MISSING()
    }

    const ticketCount = body.tickets.length
    const feePaidUsdc = calculateFeeHuman(ticketCount)
    const invoiceId   = `inv_${uuidv4().replace(/-/g, '').slice(0, 8)}`

    const [event] = await db
      .insert(schema.events)
      .values({
        platformId:     req.platform?.id,
        invoiceId,
        artistSlug:     body.artistSlug,
        eventSlug:      body.eventSlug,
        ensName,
        promoterWallet: body.promoterWallet,
        totalTickets:   ticketCount,
        feePaidUsdc,
        status:         'pending_payment',
        eventDate:      body.eventDate ? new Date(body.eventDate) : null,
        eventName:      body.eventName,
        imageUri:       body.imageUri,
      })
      .returning()

    const ticketRows: (typeof schema.tickets.$inferInsert)[] = body.tickets.map((row) => ({
      eventId:    event.id,
      seatNumber: row['seat_number']!,
      priceUsdc:  row['price_usdc'] || '0',
      metadata:   JSON.stringify(row),
    }))

    for (let i = 0; i < ticketRows.length; i += 500) {
      await db.insert(schema.tickets).values(ticketRows.slice(i, i + 500))
    }

    res.status(201).json({
      invoiceId,
      ensName,
      ticketCount,
      feeDue:         feePaidUsdc,
      paymentAddress: process.env.PLATFORM_TREASURY_ADDRESS,
      status:         'pending_payment',
      expiresAt:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/events/:id ────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const isUuid = UUID_RE.test(id)
    const event =
      (isUuid ? await db.query.events.findFirst({ where: eq(schema.events.id, id) }) : null) ||
      (await db.query.events.findFirst({ where: eq(schema.events.invoiceId, id) })) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, id) }))

    if (!event) throw Errors.EVENT_NOT_FOUND()
    res.json({
      ...event,
      ...(event.status === 'pending_payment' ? { paymentAddress: process.env.PLATFORM_TREASURY_ADDRESS } : {}),
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events/:invoiceId/confirm ────────────────────────────────────────
// Verifies USDC payment, registers event on-chain + ENS subdomain, issues API key.
// No minting happens here — tickets are minted on-demand via /voucher or /mint.

router.post('/:invoiceId/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params
    const { txHash }    = req.body

    if (!txHash) return res.status(400).json({ error: 'txHash required' })

    const event = await db.query.events.findFirst({
      where: eq(schema.events.invoiceId, invoiceId),
    })
    if (!event) throw Errors.INVOICE_NOT_FOUND()

    if (event.status === 'active') {
      return res.json({
        eventId:         event.id,
        ensName:         event.ensName,
        contractAddress: process.env.BOLETO_CONTRACT_ADDRESS,
        onChainEventId:  event.onChainEventId,
        status:          'active',
      })
    }

    // Verify USDC payment on L1 to treasury
    const expectedAmount = calculateFeeRaw(event.totalTickets)
    const treasury       = process.env.PLATFORM_TREASURY_ADDRESS!
    const verified       = await verifyUsdcPayment(txHash as `0x${string}`, expectedAmount, treasury)
    if (!verified) throw Errors.PAYMENT_NOT_VERIFIED()

    // Register event on BoletoTickets — O(1) gas, no minting
    const { txHash: registerTxHash, eventId: onChainEventId } = await registerEventOnChain({
      ensName:        event.ensName,
      totalSeats:     event.totalTickets,
      promoterWallet: event.promoterWallet,
    })

    // Register ENS subdomain (backend wallet owns boleto.eth directly)
    const ensLabel = event.ensName.replace('.boleto.eth', '')
    let ensTxHash: string | null = null
    try {
      ensTxHash = await registerEnsSubdomain({
        label:          ensLabel,
        promoterWallet: event.promoterWallet as `0x${string}`,
      })
    } catch (ensErr: any) {
      console.error('[ENS] subdomain registration failed:', ensErr?.message ?? ensErr)
    }

    // Auto-provision API key for this promoter wallet (once per wallet)
    let apiKey: string | null = null
    let platformId: string | undefined = event.platformId ?? undefined

    const existingPlatform = await db.query.platforms.findFirst({
      where: eq(schema.platforms.walletAddress, event.promoterWallet),
    })

    if (existingPlatform) {
      platformId = existingPlatform.id
    } else {
      apiKey = 'blt_' + randomBytes(32).toString('hex')
      const [newPlatform] = await db
        .insert(schema.platforms)
        .values({ name: event.eventName, walletAddress: event.promoterWallet, apiKey })
        .returning()
      platformId = newPlatform.id
    }

    await db.update(schema.events).set({
      status:         'active',
      paymentTxHash:  txHash,
      registerTxHash,
      onChainEventId,
      l1TxHash:       ensTxHash,
      platformId,
    }).where(eq(schema.events.id, event.id))

    res.json({
      eventId:         event.id,
      ensName:         event.ensName,
      contractAddress: process.env.BOLETO_CONTRACT_ADDRESS,
      onChainEventId,
      ensTxHash,
      status:          'active',
      apiKey,
      apiKeyNote: apiKey
        ? 'Save this API key — it will not be shown again.'
        : 'Your wallet already has an API key. Use the one from your first event.',
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/events/:eventId/inventory ─────────────────────────────────────────

router.get('/:eventId/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params
    const isUuid = UUID_RE.test(eventId)
    const event =
      (isUuid ? await db.query.events.findFirst({ where: eq(schema.events.id, eventId) }) : null) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, eventId) }))

    if (!event) throw Errors.EVENT_NOT_FOUND()

    const tickets = await db.query.tickets.findMany({
      where: eq(schema.tickets.eventId, event.id),
    })

    const minted    = tickets.filter((t) => t.minted).length
    const available = tickets.filter((t) => !t.minted).length

    res.json({
      eventId:         event.id,
      ensName:         event.ensName,
      contractAddress: process.env.BOLETO_CONTRACT_ADDRESS,
      onChainEventId:  event.onChainEventId,
      totalTickets:    event.totalTickets,
      minted,
      available,
      tickets: tickets.map((t) => ({
        id:           t.id,
        seatNumber:   t.seatNumber,
        priceUsdc:    t.priceUsdc,
        minted:       t.minted,
        redeemed:     t.redeemed,
        redeemedAt:   t.redeemedAt,
        tokenId:      t.tokenId,
        ownerWallet:  t.ownerWallet,
        metadataUri:  t.metadataUri,
        qrCodeUri:    t.qrCodeUri,
        mintTxHash:   t.mintTxHash,
      })),
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events/:eventId/voucher ──────────────────────────────────────────
// Platform calls this after a buyer purchases a ticket.
// Returns an EIP-712 signed voucher the buyer submits to mintWithVoucher() on-chain.

const VoucherSchema = z.object({
  seatNumber: z.string().min(1),
  buyerWallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
})

router.post('/:eventId/voucher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params
    const body = VoucherSchema.parse(req.body)

    const event =
      (await db.query.events.findFirst({ where: eq(schema.events.id, eventId) })) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, eventId) }))

    if (!event)                    throw Errors.EVENT_NOT_FOUND()
    if (event.status !== 'active') throw Errors.EVENT_NOT_ACTIVE()
    if (!event.onChainEventId)     throw Errors.EVENT_NOT_ACTIVE()

    const allTickets = await db.query.tickets.findMany({
      where: eq(schema.tickets.eventId, event.id),
    })
    const ticket = allTickets.find(t => t.seatNumber === body.seatNumber)

    if (!ticket)       throw Errors.TICKET_NOT_FOUND()
    if (ticket.minted) throw Errors.TICKET_ALREADY_MINTED()

    // Upload metadata + QR code to IPFS (if not already done)
    let { metadataUri, qrCodeUri } = ticket
    if (!metadataUri) {
      const csvAttributes = JSON.parse(ticket.metadata || '{}') as Record<string, string>
      const uploaded = await uploadTicketMetadata({
        seatNumber:   ticket.seatNumber,
        ensName:      event.ensName,
        eventName:    event.eventName,
        imageUri:     event.imageUri || '',
        csvAttributes,
      })
      metadataUri = uploaded.metadataUri
      qrCodeUri   = uploaded.qrCodeUri

      // Cache the URIs so repeat voucher requests are instant
      await db.update(schema.tickets).set({ metadataUri, qrCodeUri })
        .where(eq(schema.tickets.id, ticket.id))
    }

    // Sign the EIP-712 voucher — buyer submits this directly to the contract
    const signature = await signTicketVoucher({
      eventId:    event.onChainEventId as `0x${string}`,
      to:         body.buyerWallet as `0x${string}`,
      seatNumber: ticket.seatNumber,
      tokenUri:   metadataUri!,
    })

    res.json({
      // Everything the buyer needs to call mintWithVoucher() themselves
      contractAddress: process.env.BOLETO_CONTRACT_ADDRESS,
      eventId:         event.onChainEventId,
      to:              body.buyerWallet,
      seatNumber:      ticket.seatNumber,
      tokenUri:        metadataUri,
      signature,
      // For display / QR scanning
      ensName:         event.ensName,
      eventName:       event.eventName,
      qrCodeUri,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events/:eventId/mint ─────────────────────────────────────────────
// Backend mints directly on behalf of buyer (gasless / no-wallet flow).

const MintSchema = z.object({
  seatNumber: z.string().min(1),
  toWallet:   z.string().regex(/^0x[0-9a-fA-F]{40}$/),
})

router.post('/:eventId/mint', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params
    const body = MintSchema.parse(req.body)

    const event =
      (await db.query.events.findFirst({ where: eq(schema.events.id, eventId) })) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, eventId) }))

    if (!event)                    throw Errors.EVENT_NOT_FOUND()
    if (event.status !== 'active') throw Errors.EVENT_NOT_ACTIVE()
    if (!event.onChainEventId)     throw Errors.EVENT_NOT_ACTIVE()

    const allTickets = await db.query.tickets.findMany({
      where: eq(schema.tickets.eventId, event.id),
    })
    const ticket = allTickets.find(t => t.seatNumber === body.seatNumber)

    if (!ticket)       throw Errors.TICKET_NOT_FOUND()
    if (ticket.minted) throw Errors.TICKET_ALREADY_MINTED()

    let { metadataUri, qrCodeUri } = ticket
    if (!metadataUri) {
      const csvAttributes = JSON.parse(ticket.metadata || '{}') as Record<string, string>
      const uploaded = await uploadTicketMetadata({
        seatNumber:   ticket.seatNumber,
        ensName:      event.ensName,
        eventName:    event.eventName,
        imageUri:     event.imageUri || '',
        csvAttributes,
      })
      metadataUri = uploaded.metadataUri
      qrCodeUri   = uploaded.qrCodeUri
    }

    const { tokenId, txHash: mintTxHash } = await mintTicket({
      eventId:    event.onChainEventId as `0x${string}`,
      to:         body.toWallet as `0x${string}`,
      seatNumber: ticket.seatNumber,
      tokenUri:   metadataUri!,
    })

    // Register seat ENS subdomain: e.g. 7-c-301.test1000-miami100.boleto.eth
    const seatLabel  = normalizeSeatLabel(ticket.seatNumber)
    const seatEnsName = `${seatLabel}.${event.ensName}`
    try {
      await registerSeatSubdomain({
        eventEnsName: event.ensName,
        seatLabel,
        ownerWallet:  body.toWallet as Address,
      })
    } catch (ensErr: any) {
      console.error('[ENS seat] registration failed:', ensErr?.message ?? ensErr)
    }

    await db.update(schema.tickets).set({
      minted:      true,
      tokenId,
      ownerWallet: body.toWallet,
      mintTxHash,
      metadataUri,
      qrCodeUri,
    }).where(eq(schema.tickets.id, ticket.id))

    res.status(201).json({
      tokenId,
      txHash:      mintTxHash,
      seatNumber:  ticket.seatNumber,
      seatEnsName,
      ensName:     event.ensName,
      metadataUri,
      qrCodeUri,
      ownerWallet: body.toWallet,
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events/:eventId/redeem ───────────────────────────────────────────
// Requires API key. Marks a ticket as redeemed (door scanner use).

router.post('/:eventId/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.platform) return res.status(401).json({ error: 'unauthorized', message: 'API key required' })

    const { eventId } = req.params
    const { seatNumber } = z.object({ seatNumber: z.string().min(1) }).parse(req.body)

    const isUuid = UUID_RE.test(eventId)
    const event =
      (isUuid ? await db.query.events.findFirst({ where: eq(schema.events.id, eventId) }) : null) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, eventId) }))

    if (!event) throw Errors.EVENT_NOT_FOUND()

    const ticket = await db.query.tickets.findFirst({
      where: (t, { and }) => and(eq(t.eventId, event.id), eq(t.seatNumber, seatNumber)),
    })

    if (!ticket)        return res.status(404).json({ error: 'ticket_not_found',   message: 'Ticket not found' })
    if (!ticket.minted) return res.status(400).json({ error: 'ticket_not_minted',  message: 'Ticket has not been minted yet' })
    if (ticket.redeemed) return res.status(409).json({ error: 'already_redeemed',  message: 'Ticket already redeemed', redeemedAt: ticket.redeemedAt })

    await db.update(schema.tickets)
      .set({ redeemed: true, redeemedAt: new Date() })
      .where(eq(schema.tickets.id, ticket.id))

    res.json({ success: true, seatNumber, ensName: event.ensName, redeemedAt: new Date() })
  } catch (err) {
    next(err)
  }
})

export default router

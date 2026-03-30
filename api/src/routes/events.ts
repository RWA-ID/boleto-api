import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from 'crypto'
import { db, schema } from '../db'
import { normalizeSlug, isValidSlug } from '../services/slugNormalize'
import { calculateFeeHuman, calculateFeeRaw } from '../services/pricing'
import { verifyUsdcPayment } from '../services/payment'
import { uploadTicketMetadata } from '../services/ipfs'
import { registerEventOnChain, registerEnsSubdomain, mintTicket, computeEventId } from '../services/contracts'
import { Errors } from '../errors'

const router = Router()

// ── POST /v1/events ───────────────────────────────────────────────────────────
// Creates an event record and expands CSV into the tickets table.
// Body is multipart: fields + csvFile (base64 or JSON array of rows).

const CreateEventSchema = z.object({
  artistSlug:     z.string().min(1).max(50),
  eventSlug:      z.string().min(1).max(50),
  promoterWallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid wallet address'),
  eventName:      z.string().min(1).max(200),
  eventDate:      z.string().optional(),
  imageUri:       z.string().optional(),
  // CSV rows as a JSON array: each row is { seat_number, price_usdc, ...rest }
  tickets: z.array(
    z.record(z.string())
  ).min(1),
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

    // Validate tickets CSV rows — each must have seat_number
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

    // Expand CSV rows into tickets table
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

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const event =
      (await db.query.events.findFirst({ where: eq(schema.events.id, id) })) ||
      (await db.query.events.findFirst({ where: eq(schema.events.invoiceId, id) })) ||
      (await db.query.events.findFirst({ where: eq(schema.events.ensName, id) }))

    if (!event) throw Errors.EVENT_NOT_FOUND()
    res.json(event)
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/events/:invoiceId/confirm ────────────────────────────────────────
// Verifies USDC payment, registers event on-chain, issues API key.

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
        eventId:        event.id,
        ensName:        event.ensName,
        contractAddress: process.env.BOLETO_CONTRACT_ADDRESS,
        onChainEventId: event.onChainEventId,
        status:         'active',
      })
    }

    // Verify USDC payment on L1 to treasury
    const expectedAmount = calculateFeeRaw(event.totalTickets)
    const treasury       = process.env.PLATFORM_TREASURY_ADDRESS!
    const verified       = await verifyUsdcPayment(txHash as `0x${string}`, expectedAmount, treasury)
    if (!verified) throw Errors.PAYMENT_NOT_VERIFIED()

    // Register event on the shared BoletoTickets contract
    const { txHash: registerTxHash, eventId: onChainEventId } = await registerEventOnChain({
      ensName:        event.ensName,
      promoterWallet: event.promoterWallet,
    })

    // Register ENS subdomain: label = "artistSlug-eventSlug" (strip .boleto.eth)
    const ensLabel = event.ensName.replace('.boleto.eth', '')
    let ensTxHash: string | null = null
    try {
      ensTxHash = await registerEnsSubdomain({
        label:          ensLabel,
        promoterWallet: event.promoterWallet as `0x${string}`,
      })
    } catch (ensErr: any) {
      console.error('[ENS] subdomain registration failed:', ensErr?.message ?? ensErr)
      // Non-fatal — event is still activated; ENS can be retried
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
      ensSubdomain:    event.ensName,
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
// Platform uses this to import ticket inventory into their own system.

router.get('/:eventId/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params
    const event =
      (await db.query.events.findFirst({ where: eq(schema.events.id, eventId) })) ||
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

// ── POST /v1/events/:eventId/mint ─────────────────────────────────────────────
// Mint a single ticket. toWallet = buyer wallet (buyer mint) or platform wallet (platform mint).

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

    if (!ticket)        throw Errors.TICKET_NOT_FOUND()
    if (ticket.minted)  throw Errors.TICKET_ALREADY_MINTED()

    // Generate metadata + QR code and pin to IPFS
    const csvAttributes = JSON.parse(ticket.metadata || '{}') as Record<string, string>
    const { metadataUri, qrCodeUri } = await uploadTicketMetadata({
      seatNumber:    ticket.seatNumber,
      ensName:       event.ensName,
      eventName:     event.eventName,
      imageUri:      event.imageUri || '',
      csvAttributes,
    })

    // Mint on-chain
    const { tokenId, txHash: mintTxHash } = await mintTicket({
      eventId:    event.onChainEventId as `0x${string}`,
      to:         body.toWallet as `0x${string}`,
      seatNumber: ticket.seatNumber,
      tokenUri:   metadataUri,
    })

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
      ensName:     event.ensName,
      metadataUri,
      qrCodeUri,
      ownerWallet: body.toWallet,
    })
  } catch (err) {
    next(err)
  }
})

export default router

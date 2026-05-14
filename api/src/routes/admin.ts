import { Router, Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'
import { db, schema } from '../db'
import { eq, sql } from 'drizzle-orm'

const router = Router()

// ── Admin secret guard ────────────────────────────────────────────────────────

function requireAdminSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return res.status(500).json({ error: 'ADMIN_SECRET not configured' })
  const provided = req.headers['x-admin-secret'] as string
  if (!provided || provided !== secret) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid admin secret' })
  }
  next()
}

// ── POST /v1/admin/keys — create a new platform + API key ────────────────────

router.post('/keys', requireAdminSecret, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, walletAddress } = req.body
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' })
    }
    const apiKey = 'blt_' + randomBytes(32).toString('hex')
    const [platform] = await db
      .insert(schema.platforms)
      .values({ name, walletAddress: walletAddress || null, apiKey })
      .returning()
    res.status(201).json({ id: platform.id, name: platform.name, apiKey })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/admin/keys — list platforms ───────────────────────────────────────

router.get('/keys', requireAdminSecret, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const platforms = await db.query.platforms.findMany()
    res.json(platforms.map((p) => ({
      id:            p.id,
      name:          p.name,
      walletAddress: p.walletAddress,
      createdAt:     p.createdAt,
    })))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /v1/admin/keys/:id — revoke an API key ─────────────────────────────

router.delete('/keys/:id', requireAdminSecret, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await db.delete(schema.platforms).where(eq(schema.platforms.id, req.params.id))
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
})

// ── POST /v1/admin/migrate — apply new schema columns ────────────────────────
// Run once after deploying the new architecture. Safe to run multiple times.

router.post('/migrate', requireAdminSecret, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ddls = [
      // events table — new columns, remove old ones that conflict
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS total_tickets INTEGER`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS image_uri TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS on_chain_event_id TEXT`,
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS register_tx_hash TEXT`,
      // tickets table — create if not exists
      `CREATE TABLE IF NOT EXISTS tickets (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id     UUID NOT NULL REFERENCES events(id),
        seat_number  TEXT NOT NULL,
        price_usdc   TEXT NOT NULL,
        metadata     TEXT NOT NULL,
        metadata_uri TEXT,
        qr_code_uri  TEXT,
        token_id     TEXT,
        owner_wallet TEXT,
        mint_tx_hash TEXT,
        minted       BOOLEAN DEFAULT FALSE,
        created_at   TIMESTAMP DEFAULT NOW()
      )`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS redeemed BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP`,
    ]

    const results: string[] = []
    for (const ddl of ddls) {
      await db.execute(sql.raw(ddl))
      results.push(ddl.slice(0, 60) + '...')
    }

    res.json({ applied: results.length, statements: results })
  } catch (err) {
    next(err)
  }
})

// ── GET /v1/admin/events — list all events ────────────────────────────────────

router.get('/events', requireAdminSecret, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await db.query.events.findMany()
    res.json(events)
  } catch (err) {
    next(err)
  }
})


export default router

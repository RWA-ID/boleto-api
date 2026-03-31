import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db'
import { requireApiKey } from '../middleware/auth'

const router = Router()

// ── GET /v1/profile ───────────────────────────────────────────────────────────

router.get('/', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = req.platform!
    res.json({
      id:           p.id,
      promoterName: p.promoterName || p.name,
      bannerUri:    p.bannerUri,
      walletAddress: p.walletAddress,
      createdAt:    p.createdAt,
    })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /v1/profile ─────────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  promoterName: z.string().min(1).max(100).optional(),
  bannerUri:    z.string().url().optional().or(z.literal('')),
})

router.patch('/', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateProfileSchema.parse(req.body)

    const updates: Record<string, any> = {}
    if (body.promoterName !== undefined) updates.promoterName = body.promoterName
    if (body.bannerUri    !== undefined) updates.bannerUri    = body.bannerUri || null

    if (Object.keys(updates).length === 0) {
      return res.json({ message: 'No changes' })
    }

    await db.update(schema.platforms)
      .set(updates)
      .where(eq(schema.platforms.id, req.platform!.id))

    res.json({ success: true, ...updates })
  } catch (err) {
    next(err)
  }
})

export default router

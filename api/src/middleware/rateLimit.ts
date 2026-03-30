import { Request, Response, NextFunction } from 'express'

// Simple in-memory rate limiter — no trust proxy dependency.
// 100 requests per 15 minutes per IP (uses X-Forwarded-For if present).
const hits = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX = 100

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown'

  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }

  entry.count++
  if (entry.count > MAX) {
    return res.status(429).json({ error: 'rate_limit_exceeded', message: 'Too many requests, please try again later.' })
  }

  next()
}

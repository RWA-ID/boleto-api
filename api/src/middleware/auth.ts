import { Request, Response, NextFunction } from 'express'
import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import { Errors } from '../errors'

declare global {
  namespace Express {
    interface Request {
      platform?: typeof schema.platforms.$inferSelect
    }
  }
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing API key' })
  }

  const apiKey = authHeader.slice(7).trim()
  if (!apiKey) {
    return res.status(401).json({ error: 'unauthorized', message: 'Empty API key' })
  }

  try {
    const platform = await db.query.platforms.findFirst({
      where: eq(schema.platforms.apiKey, apiKey),
    })

    if (!platform) {
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid API key' })
    }

    req.platform = platform
    next()
  } catch (err) {
    next(err)
  }
}

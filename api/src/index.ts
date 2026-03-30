import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { rateLimiter } from './middleware/rateLimit'
import eventsRouter from './routes/events'
import adminRouter from './routes/admin'
import uploadRouter from './routes/upload'
import { ApiError } from './errors'

const app  = express()
const PORT = parseInt(process.env.PORT || '3000')

// Railway (and most PaaS) sit behind a load balancer that sets X-Forwarded-For.
app.set('trust proxy', 1)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['*']

app.use(cors({
  origin: (origin, cb) => {
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
      cb(null, true)
    } else {
      cb(null, true) // permissive — auth guards the sensitive routes
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'boleto-eth-api', ts: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/v1/admin',  adminRouter)
app.use('/v1/events', eventsRouter)
app.use('/v1/upload', uploadRouter)

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message })
  }
  if (err instanceof Error) {
    console.error('[API Error]', err.message, err.stack)
    return res.status(500).json({ error: 'internal_error', message: err.message })
  }
  res.status(500).json({ error: 'internal_error', message: 'Unknown error' })
})

app.listen(PORT, () => {
  console.log(`boleto.eth API listening on port ${PORT}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message, err.stack)
  process.exit(1)
})

export default app

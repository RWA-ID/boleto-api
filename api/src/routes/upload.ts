import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { Readable } from 'stream'
import { getPinata } from '../services/ipfs'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, GIF and WebP images are allowed'))
  },
})

// ── POST /v1/upload/image ─────────────────────────────────────────────────────
router.post('/image', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' })

    const pinata   = getPinata()
    const stream   = Readable.from(req.file.buffer)
    const filename = req.file.originalname || `event-image-${Date.now()}`

    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: filename },
      pinataOptions:  { cidVersion: 1 },
    })

    res.json({ uri: `ipfs://${result.IpfsHash}`, cid: result.IpfsHash })
  } catch (err) {
    next(err)
  }
})

export default router

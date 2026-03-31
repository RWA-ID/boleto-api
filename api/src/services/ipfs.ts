import PinataSDK from '@pinata/sdk'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { Readable } from 'stream'

let _pinata: PinataSDK | null = null

export function getPinata(): PinataSDK {
  if (!_pinata) {
    const jwt = process.env.PINATA_JWT
    if (!jwt) throw new Error('PINATA_JWT not set')
    _pinata = new PinataSDK({ pinataJWTKey: jwt })
  }
  return _pinata
}

/**
 * Upload a JSON object to IPFS via Pinata.
 * @returns ipfs:// URI
 */
export async function uploadJson(data: object, name: string): Promise<string> {
  const pinata = getPinata()
  const result = await pinata.pinJSONToIPFS(data, {
    pinataMetadata: { name },
    pinataOptions:  { cidVersion: 1 },
  })
  return `ipfs://${result.IpfsHash}`
}

/**
 * Fetch a remote image and return it as a Buffer.
 * Handles both http(s):// and ipfs:// URIs (via Pinata gateway).
 */
async function fetchImageBuffer(uri: string): Promise<Buffer> {
  let url = uri
  if (uri.startsWith('ipfs://')) {
    const cid = uri.slice(7)
    url = `https://gateway.pinata.cloud/ipfs/${cid}`
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Build a composite image: event image with QR code overlaid in the bottom-left corner.
 * QR is sized to 22% of the base image width, with a small white padding behind it.
 * @returns PNG Buffer of the composited image
 */
async function buildCompositeImage(imageUri: string, qrBuf: Buffer): Promise<Buffer> {
  const base     = sharp(await fetchImageBuffer(imageUri))
  const meta     = await base.metadata()
  const baseW    = meta.width  ?? 1024
  const baseH    = meta.height ?? 1024

  const qrSize   = Math.round(baseW * 0.22)
  const padding  = Math.round(qrSize * 0.08)
  const offset   = Math.round(baseW * 0.03)  // distance from edges

  // White background tile behind the QR
  const bgSize   = qrSize + padding * 2
  const whiteBg  = await sharp({
    create: { width: bgSize, height: bgSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.92 } },
  }).png().toBuffer()

  const qrResized = await sharp(qrBuf).resize(qrSize, qrSize).png().toBuffer()

  return base
    .composite([
      // White rounded-ish background
      { input: whiteBg, left: offset, top: baseH - bgSize - offset, blend: 'over' },
      // QR code on top of the white bg
      { input: qrResized, left: offset + padding, top: baseH - bgSize - offset + padding, blend: 'over' },
    ])
    .png()
    .toBuffer()
}

/**
 * Generate QR code PNG buffer for a ticket.
 * The QR encodes the verification URL: https://boleto.eth.limo/verify?event={ensName}&seat={seatNumber}
 */
async function generateQrBuffer(ensName: string, seatNumber: string): Promise<Buffer> {
  const url = `https://boleto.eth.limo/verify#${encodeURIComponent(ensName)}/${encodeURIComponent(seatNumber)}`
  return QRCode.toBuffer(url, { type: 'png', width: 512, margin: 2 })
}

/**
 * Upload a PNG buffer to IPFS via Pinata.
 * @returns ipfs:// URI of the PNG
 */
async function uploadPng(buf: Buffer, name: string): Promise<string> {
  const pinata = getPinata()
  const stream = Readable.from(buf)
  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name },
    pinataOptions:  { cidVersion: 1 },
  })
  return `ipfs://${result.IpfsHash}`
}

/**
 * Build and upload ticket NFT metadata to IPFS.
 * Generates + uploads the QR code PNG, then pins the metadata JSON.
 *
 * @returns { metadataUri, qrCodeUri } — both are ipfs:// URIs
 */
export async function uploadTicketMetadata(params: {
  seatNumber:     string
  ensName:        string
  eventName:      string
  imageUri:       string
  csvAttributes:  Record<string, string>   // all CSV columns as NFT attributes
}): Promise<{ metadataUri: string; qrCodeUri: string }> {
  const qrBuf = await generateQrBuffer(params.ensName, params.seatNumber)

  // Upload standalone QR (used for door scanning / verify flow)
  const qrCodeUri = await uploadPng(qrBuf, `qr-${params.ensName}-${params.seatNumber}.png`)

  // Build NFT image: event image with QR overlaid bottom-left
  let nftImageUri: string
  if (params.imageUri) {
    const compositeBuf = await buildCompositeImage(params.imageUri, qrBuf)
    nftImageUri = await uploadPng(compositeBuf, `ticket-img-${params.ensName}-${params.seatNumber}.png`)
  } else {
    // No event image — fall back to QR only
    nftImageUri = qrCodeUri
  }

  const csvAttrs = Object.entries(params.csvAttributes).map(([key, value]) => ({
    trait_type: key,
    value,
  }))

  const metadata = {
    name:        `${params.eventName} — Seat ${params.seatNumber}`,
    description: `Official boleto.eth ticket for ${params.eventName}`,
    image:       nftImageUri,
    attributes: [
      { trait_type: 'ENS Name',   value: params.ensName    },
      { trait_type: 'Event',      value: params.eventName  },
      { trait_type: 'Seat',       value: params.seatNumber },
      { trait_type: 'QR Code',    value: qrCodeUri         },
      ...csvAttrs,
    ],
  }

  const metadataUri = await uploadJson(metadata, `ticket-${params.ensName}-${params.seatNumber}`)
  return { metadataUri, qrCodeUri }
}

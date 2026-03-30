import PinataSDK from '@pinata/sdk'
import QRCode from 'qrcode'
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
 * Generate a QR code PNG for a ticket and upload it to IPFS.
 * The QR encodes a verification URL: https://boleto.eth.limo/verify?event={ensName}&seat={seatNumber}
 * @returns ipfs:// URI of the PNG
 */
export async function uploadQrCode(ensName: string, seatNumber: string): Promise<string> {
  const pinata  = getPinata()
  const url     = `https://boleto.eth.limo/verify?event=${encodeURIComponent(ensName)}&seat=${encodeURIComponent(seatNumber)}`
  const pngBuf  = await QRCode.toBuffer(url, { type: 'png', width: 512, margin: 2 })
  const stream  = Readable.from(pngBuf)

  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: `qr-${ensName}-${seatNumber}.png` },
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
  const qrCodeUri = await uploadQrCode(params.ensName, params.seatNumber)

  const csvAttrs = Object.entries(params.csvAttributes).map(([key, value]) => ({
    trait_type: key,
    value,
  }))

  const metadata = {
    name:        `${params.eventName} — Seat ${params.seatNumber}`,
    description: `Official boleto.eth ticket for ${params.eventName}`,
    image:       params.imageUri || qrCodeUri,
    animation_url: qrCodeUri,
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

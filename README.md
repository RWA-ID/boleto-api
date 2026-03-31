# boleto.eth

**[English](#english) | [Español](#español)**

---

<a name="english"></a>

# boleto.eth — Web3 Ticketing Infrastructure for Latin American Events

> Turn event tickets into permanent, verifiable NFTs on Ethereum. Each event gets a real ENS subdomain. Each seat becomes an ERC-721 token with on-chain royalties. Platforms integrate via REST API — no smart contract knowledge required.

**Live:** [boleto.eth.limo](https://boleto.eth.limo) · **API Docs:** [boleto.eth.limo/docs](https://boleto.eth.limo/docs) · **API:** `https://boleto-api-production.up.railway.app`

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [ENS Structure](#ens-structure)
- [Pricing](#pricing)
- [REST API Reference](#rest-api-reference)
  - [Authentication](#authentication)
  - [Create Event](#post-v1events)
  - [Activate Event](#post-v1eventsinvoiceidconfirm)
  - [Get Event](#get-v1eventsid)
  - [List My Events](#get-v1events)
  - [Get Inventory](#get-v1eventseventidInventory)
  - [Generate Voucher](#post-v1eventseventidvoucher)
  - [Mint Ticket (Backend)](#post-v1eventseventidmint)
  - [Get / Update Profile](#get--patch-v1profile)
- [NFT Metadata Standard](#nft-metadata-standard)
- [Platform Integration Guide](#platform-integration-guide)
- [Verify Tickets at Venue](#verify-tickets-at-venue)
- [Development](#development)
- [Deployed Addresses](#deployed-addresses)

---

## How It Works

```
Promoter creates event via API
        │
        ▼
Pay USDC fee to treasury (once, covers all seats)
        │
        ▼
API registers event on-chain       ← O(1) gas regardless of seat count
API registers ENS subdomain        ← artist-event.boleto.eth
        │
        ▼
Buyer purchases ticket on platform
        │
        ▼
Platform calls POST /voucher  →  gets EIP-712 signed voucher
        │
        ├─► Option A: Buyer self-mints
        │       calls mintWithVoucher() from their own wallet
        │       buyer pays gas (~$0.50–$2.00)
        │
        └─► Option B: Backend gasless mint
                platform calls POST /mint
                platform pays gas, buyer gets NFT directly
                │
                ▼
        NFT lands in buyer wallet
        Seat ENS subdomain registered: seat-id.artist-event.boleto.eth
        QR code embedded in NFT → scannable at venue entrance
```

---

## Architecture

```
boleto-eth/
├── contracts/
│   ├── BoletoTickets.sol          # Shared ERC-721 on Ethereum L1
│   └── l1/
│       └── BoletoRegistrar.sol    # Legacy ENS registrar (v1)
├── api/                           # Express + TypeScript REST API (Railway)
│   └── src/
│       ├── routes/
│       │   ├── events.ts          # Core event + mint endpoints
│       │   ├── profile.ts         # Promoter branding
│       │   ├── admin.ts           # Admin tools
│       │   └── upload.ts          # IPFS upload helper
│       ├── services/
│       │   ├── contracts.ts       # Viem interactions (mint, ENS, EIP-712)
│       │   ├── ipfs.ts            # Pinata metadata + QR uploads
│       │   ├── payment.ts         # USDC payment verification
│       │   └── pricing.ts         # Fee tier calculation
│       └── db/
│           └── schema.ts          # Drizzle ORM schema (PostgreSQL)
└── dashboard/                     # Next.js 14 static export → IPFS
    └── src/app/
        ├── page.tsx               # Landing page
        ├── docs/                  # Interactive API docs
        ├── create-event/          # Event creation flow
        ├── events/                # Event dashboard + My Events
        └── verify/                # QR code ticket verification
```

**Stack:**
- **Contracts:** Solidity 0.8.24, Foundry, OpenZeppelin v5
- **API:** Express + TypeScript, Drizzle ORM, PostgreSQL, Viem, Pinata (IPFS)
- **Dashboard:** Next.js 14, RainbowKit + wagmi v2, Tailwind CSS
- **Infrastructure:** Railway (API + DB), IPFS via ENS contenthash (`boleto.eth`)

---

## Smart Contracts

### BoletoTickets — Ethereum Mainnet (Current)

**Address:** `0x9650d442779368e0A039351eD7c75c3E93de372D`
[View on Etherscan ↗](https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D)

Shared ERC-721 contract that handles all boleto.eth events. Supports EIP-712 signed voucher minting and ERC-2981 on-chain royalties.

| Function | Access | Description |
|---|---|---|
| `registerEvent(bytes32 eventId, uint256 totalSeats, string ensName, address promoter)` | Owner | Register event on-chain. O(1) gas regardless of seat count. |
| `mintWithVoucher(bytes32 eventId, address to, string seatNumber, string tokenUri, bytes signature)` | Public | Buyer self-mints using EIP-712 signed voucher from API. |
| `mint(bytes32 eventId, address to, string seatNumber, string tokenUri)` | Minter | Backend mints directly on behalf of buyer (gasless flow). |
| `royaltyInfo(uint256 tokenId, uint256 salePrice)` | View | ERC-2981: returns promoter wallet + 1% of sale price. |
| `registeredEvents(bytes32 eventId)` | View | Returns `true` if event is registered on-chain. |
| `eventEnsName(bytes32 eventId)` | View | Returns the ENS name for an event. |

#### EIP-712 Voucher Type

The API backend wallet signs the following struct. The buyer submits it to `mintWithVoucher()` — no Merkle proof needed, no pre-registration.

```solidity
TicketVoucher(
  bytes32 eventId,    // on-chain event identifier
  address to,         // buyer wallet
  string  seatNumber, // e.g. "A-101"
  string  tokenUri    // IPFS metadata URI
)
```

**Domain:**
```json
{
  "name":              "BoletoTickets",
  "version":           "1",
  "chainId":           1,
  "verifyingContract": "0x9650d442779368e0A039351eD7c75c3E93de372D"
}
```

#### Royalties

Every ticket NFT carries a **1% on-chain royalty** (ERC-2981) to the promoter's wallet. This royalty is automatically honored by OpenSea, Blur, and any EIP-2981-compliant marketplace — no additional setup needed.

### BoletoRegistrar — Ethereum Mainnet (Legacy)

**Address:** `0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20`
[View on Etherscan ↗](https://etherscan.io/address/0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20)

---

## ENS Structure

Each event and each ticket gets a permanent ENS subdomain on Ethereum:

```
boleto.eth
└── artist-event.boleto.eth             ← registered at event activation
    ├── a-101.artist-event.boleto.eth   ← registered when ticket is minted
    ├── b-202.artist-event.boleto.eth
    └── ...
```

| Subdomain | Owner | When Created |
|---|---|---|
| `boleto.eth` | boleto.eth backend wallet | Protocol deployment |
| `artist-event.boleto.eth` | boleto.eth backend wallet | Event activation |
| `seat.artist-event.boleto.eth` | Buyer wallet | Ticket mint |

The buyer's wallet owns their seat subdomain — it follows them across wallets, serves as an on-chain proof of ticket ownership, and can be set as their ENS primary name while at the event.

---

## Pricing

Fee is paid **once at event activation** via USDC. It covers ENS subdomain registration + on-chain event setup for the entire ticket run — no per-mint fees.

| Tier | Tickets | Price per Ticket |
|---|---|---|
| Standard | 1 – 999 | $0.35 USDC |
| Pro | 1,000 – 9,999 | $0.25 USDC |
| Enterprise | 10,000+ | $0.15 USDC |

**Example:** 10,000-seat arena = 10,000 × $0.15 = **$1,500 USDC** activation fee (covers the full run).

---

## REST API Reference

**Base URL:** `https://boleto-api-production.up.railway.app`

### Authentication

All endpoints that modify data or return private information require an API key:

```
Authorization: Bearer YOUR_API_KEY
```

API keys are issued automatically when you activate your first event (see [`POST /v1/events/:invoiceId/confirm`](#post-v1eventsinvoiceidconfirm)). One key per promoter wallet.

---

### `POST /v1/events`

Create a new event. This returns an invoice with the USDC fee to pay before the event is activated on-chain.

**No authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `artistSlug` | string | ✓ | URL-safe artist identifier, e.g. `badbunny` |
| `eventSlug` | string | ✓ | URL-safe event identifier, e.g. `miami25` |
| `promoterWallet` | string | ✓ | Ethereum address of the promoter |
| `eventName` | string | ✓ | Full display name, e.g. `Bad Bunny — Miami 2025` |
| `eventDate` | string | ✓ | ISO date, e.g. `2025-12-01` |
| `imageUri` | string | ✓ | IPFS or HTTPS URI for event banner image |
| `tickets` | array | ✓ | Array of ticket objects (see below) |

**Ticket Object:**

| Field | Type | Required | Description |
|---|---|---|---|
| `seat_number` | string | ✓ | Unique seat identifier, e.g. `A-101` |
| `price_usdc` | string | ✓ | Face value in USDC, e.g. `"150.00"` |
| `section` | string | | Section name, e.g. `Floor VIP` |
| `row` | string | | Row identifier, e.g. `A` |

**Example Request:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "artistSlug":     "badbunny",
    "eventSlug":      "miami25",
    "promoterWallet": "0xYOUR_WALLET",
    "eventName":      "Bad Bunny — Miami 2025",
    "eventDate":      "2025-12-01",
    "imageUri":       "ipfs://QmYourEventBanner",
    "tickets": [
      { "seat_number": "A-101", "price_usdc": "150.00", "section": "Floor VIP", "row": "A" },
      { "seat_number": "B-201", "price_usdc": "95.00",  "section": "Lower Bowl", "row": "B" }
    ]
  }'
```

**Response `200 OK`:**

```json
{
  "invoiceId":      "inv_a1b2c3d4",
  "ensName":        "badbunny-miami25.boleto.eth",
  "ticketCount":    2,
  "feeDue":         "0.30",
  "paymentAddress": "0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b",
  "status":         "pending_payment",
  "expiresAt":      "2025-01-02T00:00:00.000Z"
}
```

> Send exactly `feeDue` USDC to `paymentAddress` from your `promoterWallet`, then call `/confirm`.

---

### `POST /v1/events/:invoiceId/confirm`

Activate an event after USDC payment. This triggers:
1. On-chain event registration (O(1) gas)
2. ENS subdomain registration (`artist-event.boleto.eth`)
3. API key issuance

**No authentication required.** (Payment is the authentication.)

**URL Parameters:**

| Param | Description |
|---|---|
| `invoiceId` | The `invoiceId` returned from `POST /v1/events` |

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `txHash` | string | ✓ | Transaction hash of your USDC payment |

**Example Request:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/inv_a1b2c3d4/confirm \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0xYOUR_USDC_PAYMENT_TX_HASH" }'
```

**Response `200 OK`:**

```json
{
  "eventId":         "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ensName":         "badbunny-miami25.boleto.eth",
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "onChainEventId":  "0xabc123...",
  "ensTxHash":       "0xdef456...",
  "status":          "active",
  "apiKey":          "blt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiKeyNote":      "Save this API key — it will not be shown again."
}
```

> **Important:** Save your `apiKey` immediately. It is shown only once.

---

### `GET /v1/events/:id`

Get event details. Accepts multiple identifier formats.

**No authentication required.**

**URL Parameters:**

| Param | Description |
|---|---|
| `id` | Event UUID, `invoiceId`, or ENS name (e.g. `badbunny-miami25.boleto.eth`) |

**Example Request:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth
```

**Response `200 OK`:**

```json
{
  "id":              "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "invoiceId":       "inv_a1b2c3d4",
  "ensName":         "badbunny-miami25.boleto.eth",
  "eventName":       "Bad Bunny — Miami 2025",
  "eventDate":       "2025-12-01",
  "promoterWallet":  "0xYOUR_WALLET",
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "onChainEventId":  "0xabc123...",
  "status":          "active",
  "ticketCount":     50000
}
```

---

### `GET /v1/events`

List all events for the authenticated promoter wallet.

**Requires `Authorization: Bearer YOUR_API_KEY`.**

**Example Request:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events \
  -H "Authorization: Bearer blt_xxxx"
```

**Response `200 OK`:**

```json
{
  "events": [
    {
      "id":        "3fa85f64-...",
      "ensName":   "badbunny-miami25.boleto.eth",
      "eventName": "Bad Bunny — Miami 2025",
      "eventDate": "2025-12-01",
      "status":    "active",
      "ticketCount": 50000
    }
  ]
}
```

---

### `GET /v1/events/:eventId/inventory`

Get the full ticket inventory for an event, including mint status, token IDs, and owner wallets.

**Requires `Authorization: Bearer YOUR_API_KEY`.**

**URL Parameters:**

| Param | Description |
|---|---|
| `eventId` | Event UUID or ENS name |

**Example Request:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/inventory \
  -H "Authorization: Bearer blt_xxxx"
```

**Response `200 OK`:**

```json
{
  "eventId":         "3fa85f64-...",
  "ensName":         "badbunny-miami25.boleto.eth",
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "totalTickets":    50000,
  "minted":          1240,
  "available":       48760,
  "tickets": [
    {
      "id":          "uuid",
      "seatNumber":  "A-101",
      "section":     "Floor VIP",
      "row":         "A",
      "priceUsdc":   "150.00",
      "minted":      true,
      "tokenId":     "42",
      "ownerWallet": "0xBUYER_WALLET",
      "metadataUri": "ipfs://Qm...",
      "qrCodeUri":   "ipfs://Qm...",
      "mintTxHash":  "0x..."
    },
    {
      "id":        "uuid",
      "seatNumber": "B-201",
      "priceUsdc":  "95.00",
      "minted":     false
    }
  ]
}
```

---

### `POST /v1/events/:eventId/voucher`

Generate an EIP-712 signed voucher for a specific seat. The buyer submits this voucher to `mintWithVoucher()` on the contract — they mint directly from their own wallet, paying their own gas.

This approach:
- Requires no on-chain interaction from your backend at purchase time
- Uploads metadata and QR code to IPFS automatically
- Returns a signature valid only for the specified buyer wallet and seat

**Requires `Authorization: Bearer YOUR_API_KEY`.**

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `seatNumber` | string | ✓ | Seat to mint, e.g. `A-101` |
| `buyerWallet` | string | ✓ | Ethereum address of the buyer |

**Example Request:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/voucher \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{ "seatNumber": "A-101", "buyerWallet": "0xBUYER_WALLET" }'
```

**Response `200 OK`:**

```json
{
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "eventId":         "0xabc123...",
  "to":              "0xBUYER_WALLET",
  "seatNumber":      "A-101",
  "tokenUri":        "ipfs://Qm...",
  "signature":       "0x...",
  "ensName":         "badbunny-miami25.boleto.eth",
  "eventName":       "Bad Bunny — Miami 2025",
  "qrCodeUri":       "ipfs://Qm..."
}
```

**Frontend Mint (wagmi / ethers.js):**

```ts
// Pass voucher fields directly to mintWithVoucher()
const { eventId, to, seatNumber, tokenUri, signature, contractAddress } = voucher

await walletClient.writeContract({
  address: contractAddress,
  abi: BOLETO_ABI,
  functionName: 'mintWithVoucher',
  args: [eventId, to, seatNumber, tokenUri, signature],
})
```

---

### `POST /v1/events/:eventId/mint`

Backend-initiated gasless mint. The API wallet mints directly to the buyer. Your platform pays the gas (~$0.50–$2.00). The buyer receives the NFT without needing a wallet at purchase time.

This also registers the per-seat ENS subdomain (`seat.artist-event.boleto.eth`) owned by the buyer.

**Requires `Authorization: Bearer YOUR_API_KEY`.**

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `seatNumber` | string | ✓ | Seat to mint, e.g. `A-101` |
| `toWallet` | string | ✓ | Ethereum address to receive the NFT |

**Example Request:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/mint \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{ "seatNumber": "A-101", "toWallet": "0xBUYER_WALLET" }'
```

**Response `200 OK`:**

```json
{
  "tokenId":     "42",
  "txHash":      "0x...",
  "seatNumber":  "A-101",
  "seatEnsName": "a-101.badbunny-miami25.boleto.eth",
  "ensName":     "badbunny-miami25.boleto.eth",
  "metadataUri": "ipfs://Qm...",
  "qrCodeUri":   "ipfs://Qm...",
  "ownerWallet": "0xBUYER_WALLET"
}
```

---

### `GET / PATCH /v1/profile`

Get or update the promoter profile (display name and banner image). These values are shown on the event dashboard at `boleto.eth.limo/events?id=YOUR_EVENT`.

**Requires `Authorization: Bearer YOUR_API_KEY`.**

**GET — Example Request:**

```bash
curl https://boleto-api-production.up.railway.app/v1/profile \
  -H "Authorization: Bearer blt_xxxx"
```

**GET — Response:**

```json
{
  "walletAddress": "0xYOUR_WALLET",
  "promoterName":  "Live Nation Latin America",
  "bannerUri":     "https://yourdomain.com/banner.jpg"
}
```

**PATCH — Update Profile:**

```bash
curl -X PATCH https://boleto-api-production.up.railway.app/v1/profile \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "promoterName": "Live Nation Latin America",
    "bannerUri":    "https://yourdomain.com/banner.jpg"
  }'
```

**PATCH — Request Body:**

| Field | Type | Description |
|---|---|---|
| `promoterName` | string | Display name for the promoter (max 100 chars) |
| `bannerUri` | string | HTTPS or IPFS URI for the banner image |

---

## NFT Metadata Standard

Each ticket NFT follows the OpenSea metadata standard. All columns from your ticket CSV are automatically included as NFT traits. The `animation_url` is the scannable QR code displayed at the venue entrance.

```json
{
  "name":          "Bad Bunny — Miami 2025 — Seat A-101",
  "description":   "Official boleto.eth ticket. Verified on Ethereum.",
  "image":         "ipfs://<event_banner>",
  "animation_url": "ipfs://<qr_code_png>",
  "attributes": [
    { "trait_type": "ENS Name",   "value": "badbunny-miami25.boleto.eth" },
    { "trait_type": "Event",      "value": "Bad Bunny — Miami 2025" },
    { "trait_type": "Seat",       "value": "A-101" },
    { "trait_type": "Section",    "value": "Floor VIP" },
    { "trait_type": "Row",        "value": "A" },
    { "trait_type": "Price USDC", "value": "150.00" }
  ]
}
```

**QR Code behavior:** When a buyer clicks their NFT on OpenSea, it animates to show the QR code (via `animation_url`). The QR encodes a URL pointing to `boleto.eth.limo/verify?event=...&seat=...` — the venue scanner loads this page to confirm the ticket is valid on-chain.

---

## Platform Integration Guide

Any ticketing platform can use boleto.eth as a backend rail while keeping their own UX.

### Step 1 — Create Event and Get API Key

```bash
# Create event
INVOICE=$(curl -s -X POST https://boleto-api-production.up.railway.app/v1/events \
  -H "Content-Type: application/json" \
  -d '{ "artistSlug": "badbunny", "eventSlug": "miami25", ... }')

INVOICE_ID=$(echo $INVOICE | jq -r '.invoiceId')
FEE=$(echo $INVOICE | jq -r '.feeDue')
TREASURY=$(echo $INVOICE | jq -r '.paymentAddress')

# Send $FEE USDC to $TREASURY from your promoter wallet
# Then confirm with the tx hash:
API_KEY=$(curl -s -X POST \
  https://boleto-api-production.up.railway.app/v1/events/$INVOICE_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0xYOUR_TX" }' | jq -r '.apiKey')
```

### Step 2 — Pull Inventory

```js
const res = await fetch(`${API}/v1/events/${eventId}/inventory`, {
  headers: { Authorization: `Bearer ${API_KEY}` }
})
const { tickets, minted, available } = await res.json()
// Render tickets in your seat map UI
```

### Step 3 — On Purchase

**Option A — Buyer self-mints (recommended for crypto-native buyers):**

```js
// 1. Get signed voucher from API
const voucher = await fetch(`${API}/v1/events/${eventId}/voucher`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ seatNumber: 'A-101', buyerWallet: buyerAddress })
}).then(r => r.json())

// 2. Buyer signs and calls mintWithVoucher() — you provide the UI
await walletClient.writeContract({
  address: voucher.contractAddress,
  abi: BOLETO_ABI,
  functionName: 'mintWithVoucher',
  args: [voucher.eventId, voucher.to, voucher.seatNumber, voucher.tokenUri, voucher.signature]
})
// NFT minted directly to buyer. No backend transaction needed.
```

**Option B — Backend gasless mint (recommended for fiat buyers):**

```js
// After payment is confirmed, call /mint from your backend
const ticket = await fetch(`${API}/v1/events/${eventId}/mint`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ seatNumber: 'A-101', toWallet: buyerAddress })
}).then(r => r.json())

// ticket.txHash — send to buyer as confirmation
// ticket.qrCodeUri — show as their ticket QR
// ticket.seatEnsName — e.g. "a-101.badbunny-miami25.boleto.eth"
```

### Step 4 — Venue Scanning

Point your scanner at the QR code embedded in the NFT. The QR encodes:

```
https://boleto.eth.limo/verify?event=badbunny-miami25.boleto.eth&seat=A-101
```

This page loads in the browser and shows a green ✓ or red ✗ by checking the on-chain mint status via the API. No app required — works on any smartphone browser.

Or verify programmatically:

```js
const inv = await fetch(`${API}/v1/events/${eventId}/inventory`, {
  headers: { Authorization: `Bearer ${API_KEY}` }
}).then(r => r.json())

const ticket = inv.tickets.find(t => t.seatNumber === scannedSeat)
const isValid = ticket?.minted === true && ticket?.ownerWallet === expectedWallet
```

---

## Development

### Prerequisites

- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- PostgreSQL (local or Railway)

### Setup

```bash
git clone https://github.com/RWA-ID/boleto-api.git
cd boleto-api

npm install          # installs root + workspaces
cp .env.example .env
```

Fill in `.env`:

```env
# Ethereum
L1_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
L1_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BOLETO_CONTRACT_ADDRESS=0x9650d442779368e0A039351eD7c75c3E93de372D

# IPFS
PINATA_JWT=eyJ...
PINATA_GATEWAY=https://gateway.pinata.cloud

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/boleto

# Payment
PLATFORM_TREASURY_ADDRESS=0x...
```

### Run API Locally

```bash
cd api
npx tsx src/index.ts
# Listening on :3001
```

### Run Dashboard Locally

```bash
cd dashboard
npm run dev
# Open http://localhost:3000
```

### Compile and Test Contracts

```bash
forge build
forge test --gas-report
```

### Deploy Contracts

```bash
forge script script/DeployBoletoTickets.s.sol:DeployBoletoTickets \
  --rpc-url $L1_RPC_URL \
  --private-key $L1_PRIVATE_KEY \
  --broadcast --verify
```

---

## Deployed Addresses

| Contract | Network | Address |
|---|---|---|
| BoletoTickets v2 | Ethereum Mainnet | [`0x9650d442779368e0A039351eD7c75c3E93de372D`](https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D) |
| BoletoRegistrar (legacy) | Ethereum Mainnet | [`0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20`](https://etherscan.io/address/0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20) |
| Platform Treasury | Ethereum Mainnet | `0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b` |

| Service | URL |
|---|---|
| API | `https://boleto-api-production.up.railway.app` |
| Dashboard | `https://boleto.eth.limo` |
| API Docs | `https://boleto.eth.limo/docs` |

---

---

<a name="español"></a>

# boleto.eth — Infraestructura Web3 de Ticketing para Eventos Latinoamericanos

> Convierte las entradas de eventos en NFTs permanentes y verificables en Ethereum. Cada evento recibe un subdominio ENS real. Cada asiento se convierte en un token ERC-721 con regalías on-chain. Las plataformas se integran vía API REST — no se requiere conocimiento de contratos inteligentes.

**En vivo:** [boleto.eth.limo](https://boleto.eth.limo) · **Docs API:** [boleto.eth.limo/docs](https://boleto.eth.limo/docs) · **API:** `https://boleto-api-production.up.railway.app`

---

## Tabla de Contenidos

- [Cómo Funciona](#cómo-funciona)
- [Arquitectura](#arquitectura)
- [Contratos Inteligentes](#contratos-inteligentes)
- [Estructura ENS](#estructura-ens)
- [Precios](#precios)
- [Referencia de API REST](#referencia-de-api-rest)
  - [Autenticación](#autenticación)
  - [Crear Evento](#post-v1events-1)
  - [Activar Evento](#post-v1eventsinvoiceidconfirm-1)
  - [Obtener Evento](#get-v1eventsid-1)
  - [Mis Eventos](#get-v1events-1)
  - [Inventario](#get-v1eventseventidInventory-1)
  - [Generar Voucher](#post-v1eventseventidvoucher-1)
  - [Mintear Entrada (Backend)](#post-v1eventseventidmint-1)
  - [Perfil del Promotor](#get--patch-v1profile-1)
- [Estándar de Metadata NFT](#estándar-de-metadata-nft)
- [Guía de Integración para Plataformas](#guía-de-integración-para-plataformas)
- [Verificar Entradas en el Recinto](#verificar-entradas-en-el-recinto)
- [Desarrollo](#desarrollo)
- [Direcciones Desplegadas](#direcciones-desplegadas)

---

## Cómo Funciona

```
El promotor crea el evento vía API
        │
        ▼
Paga la tarifa en USDC al tesoro (una sola vez, cubre todos los asientos)
        │
        ▼
La API registra el evento on-chain       ← Gas O(1) sin importar la cantidad de asientos
La API registra el subdominio ENS        ← artista-evento.boleto.eth
        │
        ▼
El comprador adquiere su entrada en la plataforma
        │
        ▼
La plataforma llama a POST /voucher  →  obtiene un voucher firmado EIP-712
        │
        ├─► Opción A: El comprador mintea por sí mismo
        │       llama a mintWithVoucher() desde su propia billetera
        │       el comprador paga el gas (~$0.50–$2.00)
        │
        └─► Opción B: Minteo gasless por backend
                la plataforma llama a POST /mint
                la plataforma paga el gas, el comprador recibe el NFT directamente
                │
                ▼
        El NFT llega a la billetera del comprador
        Se registra el subdominio ENS del asiento: asiento.artista-evento.boleto.eth
        El código QR está embebido en el NFT → escaneable en la entrada del recinto
```

---

## Arquitectura

```
boleto-eth/
├── contracts/
│   ├── BoletoTickets.sol          # ERC-721 compartido en Ethereum L1
│   └── l1/
│       └── BoletoRegistrar.sol    # Registrador ENS legado (v1)
├── api/                           # API REST Express + TypeScript (Railway)
│   └── src/
│       ├── routes/
│       │   ├── events.ts          # Endpoints de eventos y minteo
│       │   ├── profile.ts         # Branding del promotor
│       │   ├── admin.ts           # Herramientas de administración
│       │   └── upload.ts          # Helper de subida a IPFS
│       ├── services/
│       │   ├── contracts.ts       # Interacciones Viem (mint, ENS, EIP-712)
│       │   ├── ipfs.ts            # Metadata y QR en Pinata (IPFS)
│       │   ├── payment.ts         # Verificación de pago USDC
│       │   └── pricing.ts         # Cálculo de tarifas por nivel
│       └── db/
│           └── schema.ts          # Esquema Drizzle ORM (PostgreSQL)
└── dashboard/                     # Next.js 14 export estático → IPFS
    └── src/app/
        ├── page.tsx               # Landing page
        ├── docs/                  # Docs interactivos de API
        ├── create-event/          # Flujo de creación de eventos
        ├── events/                # Dashboard + Mis Eventos
        └── verify/                # Verificación de entradas por QR
```

**Stack:**
- **Contratos:** Solidity 0.8.24, Foundry, OpenZeppelin v5
- **API:** Express + TypeScript, Drizzle ORM, PostgreSQL, Viem, Pinata (IPFS)
- **Dashboard:** Next.js 14, RainbowKit + wagmi v2, Tailwind CSS
- **Infraestructura:** Railway (API + DB), IPFS vía ENS contenthash (`boleto.eth`)

---

## Contratos Inteligentes

### BoletoTickets — Ethereum Mainnet (Actual)

**Dirección:** `0x9650d442779368e0A039351eD7c75c3E93de372D`
[Ver en Etherscan ↗](https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D)

Contrato ERC-721 compartido que gestiona todos los eventos de boleto.eth. Soporta minteo con vouchers firmados EIP-712 y regalías on-chain ERC-2981.

| Función | Acceso | Descripción |
|---|---|---|
| `registerEvent(bytes32 eventId, uint256 totalSeats, string ensName, address promoter)` | Owner | Registra el evento on-chain. Gas O(1) sin importar la cantidad de asientos. |
| `mintWithVoucher(bytes32 eventId, address to, string seatNumber, string tokenUri, bytes signature)` | Público | El comprador mintea usando el voucher EIP-712 firmado por la API. |
| `mint(bytes32 eventId, address to, string seatNumber, string tokenUri)` | Minter | El backend mintea directamente en nombre del comprador (flujo gasless). |
| `royaltyInfo(uint256 tokenId, uint256 salePrice)` | Vista | ERC-2981: devuelve la billetera del promotor + 1% del precio de venta. |

#### Tipo de Voucher EIP-712

El backend de la API firma la siguiente estructura. El comprador la envía a `mintWithVoucher()` — sin Merkle proof, sin pre-registro.

```solidity
TicketVoucher(
  bytes32 eventId,    // identificador del evento on-chain
  address to,         // billetera del comprador
  string  seatNumber, // ej. "A-101"
  string  tokenUri    // URI de metadata en IPFS
)
```

#### Regalías

Cada NFT de entrada lleva una **regalía on-chain del 1%** (ERC-2981) a la billetera del promotor. OpenSea, Blur y cualquier marketplace compatible con EIP-2981 la honran automáticamente.

---

## Estructura ENS

Cada evento y cada entrada reciben un subdominio ENS permanente en Ethereum:

```
boleto.eth
└── artista-evento.boleto.eth             ← se registra al activar el evento
    ├── a-101.artista-evento.boleto.eth   ← se registra al mintear la entrada
    ├── b-202.artista-evento.boleto.eth
    └── ...
```

| Subdominio | Propietario | Cuándo se crea |
|---|---|---|
| `boleto.eth` | Billetera backend de boleto.eth | Despliegue del protocolo |
| `artista-evento.boleto.eth` | Billetera backend de boleto.eth | Activación del evento |
| `asiento.artista-evento.boleto.eth` | Billetera del comprador | Minteo de la entrada |

La billetera del comprador es dueña de su subdominio de asiento — lo acompaña entre billeteras, sirve como prueba on-chain de propiedad de la entrada y puede usarse como nombre ENS primario durante el evento.

---

## Precios

La tarifa se paga **una sola vez al activar el evento** en USDC. Cubre el registro del subdominio ENS + configuración on-chain del evento para toda la corrida — sin tarifas por minteo individual.

| Nivel | Entradas | Precio por Entrada |
|---|---|---|
| Standard | 1 – 999 | $0.35 USDC |
| Pro | 1,000 – 9,999 | $0.25 USDC |
| Enterprise | 10,000+ | $0.15 USDC |

**Ejemplo:** Arena de 10,000 asientos = 10,000 × $0.15 = **$1,500 USDC** de tarifa de activación (cubre toda la corrida).

---

## Referencia de API REST

**URL Base:** `https://boleto-api-production.up.railway.app`

### Autenticación

Todos los endpoints que modifican datos o devuelven información privada requieren una clave API:

```
Authorization: Bearer TU_API_KEY
```

Las claves API se emiten automáticamente al activar tu primer evento. Una clave por billetera de promotor.

---

### `POST /v1/events`

Crea un nuevo evento. Devuelve una factura con la tarifa USDC a pagar antes de activar el evento on-chain.

**No requiere autenticación.**

**Cuerpo de la Solicitud:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `artistSlug` | string | ✓ | Identificador del artista válido para URL, ej. `badbunny` |
| `eventSlug` | string | ✓ | Identificador del evento válido para URL, ej. `miami25` |
| `promoterWallet` | string | ✓ | Dirección Ethereum del promotor |
| `eventName` | string | ✓ | Nombre completo, ej. `Bad Bunny — Miami 2025` |
| `eventDate` | string | ✓ | Fecha ISO, ej. `2025-12-01` |
| `imageUri` | string | ✓ | URI IPFS o HTTPS del banner del evento |
| `tickets` | array | ✓ | Array de objetos de entrada (ver abajo) |

**Objeto de Entrada:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `seat_number` | string | ✓ | Identificador único del asiento, ej. `A-101` |
| `price_usdc` | string | ✓ | Precio de cara en USDC, ej. `"150.00"` |
| `section` | string | | Nombre de la sección, ej. `Piso VIP` |
| `row` | string | | Identificador de fila, ej. `A` |

**Ejemplo de Solicitud:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "artistSlug":     "badbunny",
    "eventSlug":      "miami25",
    "promoterWallet": "0xTU_BILLETERA",
    "eventName":      "Bad Bunny — Miami 2025",
    "eventDate":      "2025-12-01",
    "imageUri":       "ipfs://QmTuBannerDeEvento",
    "tickets": [
      { "seat_number": "A-101", "price_usdc": "150.00", "section": "Piso VIP", "row": "A" },
      { "seat_number": "B-201", "price_usdc": "95.00",  "section": "Tribuna Baja", "row": "B" }
    ]
  }'
```

**Respuesta `200 OK`:**

```json
{
  "invoiceId":      "inv_a1b2c3d4",
  "ensName":        "badbunny-miami25.boleto.eth",
  "ticketCount":    2,
  "feeDue":         "0.30",
  "paymentAddress": "0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b",
  "status":         "pending_payment",
  "expiresAt":      "2025-01-02T00:00:00.000Z"
}
```

> Envía exactamente `feeDue` USDC a `paymentAddress` desde tu `promoterWallet`, luego llama a `/confirm`.

---

### `POST /v1/events/:invoiceId/confirm`

Activa un evento después del pago en USDC. Esto desencadena:
1. Registro del evento on-chain (gas O(1))
2. Registro del subdominio ENS (`artista-evento.boleto.eth`)
3. Emisión de la clave API

**No requiere autenticación.** (El pago es la autenticación.)

**Ejemplo de Solicitud:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/inv_a1b2c3d4/confirm \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0xHASH_DE_TU_TX_USDC" }'
```

**Respuesta `200 OK`:**

```json
{
  "eventId":         "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ensName":         "badbunny-miami25.boleto.eth",
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "onChainEventId":  "0xabc123...",
  "ensTxHash":       "0xdef456...",
  "status":          "active",
  "apiKey":          "blt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "apiKeyNote":      "Guarda esta clave API — no se volverá a mostrar."
}
```

> **Importante:** Guarda tu `apiKey` de inmediato. Solo se muestra una vez.

---

### `GET /v1/events/:id`

Obtiene los detalles de un evento. Acepta múltiples formatos de identificador.

**No requiere autenticación.**

**Ejemplo de Solicitud:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth
```

---

### `GET /v1/events`

Lista todos los eventos del promotor autenticado.

**Requiere `Authorization: Bearer TU_API_KEY`.**

**Ejemplo de Solicitud:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events \
  -H "Authorization: Bearer blt_xxxx"
```

---

### `GET /v1/events/:eventId/inventory`

Obtiene el inventario completo de entradas, incluyendo estado de minteo, token IDs y billeteras propietarias.

**Requiere `Authorization: Bearer TU_API_KEY`.**

**Ejemplo de Solicitud:**

```bash
curl https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/inventory \
  -H "Authorization: Bearer blt_xxxx"
```

**Respuesta `200 OK`:**

```json
{
  "eventId":      "3fa85f64-...",
  "ensName":      "badbunny-miami25.boleto.eth",
  "totalTickets": 50000,
  "minted":       1240,
  "available":    48760,
  "tickets": [
    {
      "seatNumber":  "A-101",
      "section":     "Piso VIP",
      "priceUsdc":   "150.00",
      "minted":      true,
      "tokenId":     "42",
      "ownerWallet": "0xBILLETERA_COMPRADOR",
      "metadataUri": "ipfs://Qm...",
      "qrCodeUri":   "ipfs://Qm..."
    }
  ]
}
```

---

### `POST /v1/events/:eventId/voucher`

Genera un voucher firmado EIP-712 para un asiento específico. El comprador envía este voucher a `mintWithVoucher()` en el contrato — mintea directamente desde su propia billetera, pagando su propio gas.

**Requiere `Authorization: Bearer TU_API_KEY`.**

**Cuerpo de la Solicitud:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `seatNumber` | string | ✓ | Asiento a mintear, ej. `A-101` |
| `buyerWallet` | string | ✓ | Dirección Ethereum del comprador |

**Ejemplo de Solicitud:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/voucher \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{ "seatNumber": "A-101", "buyerWallet": "0xBILLETERA_COMPRADOR" }'
```

**Respuesta `200 OK`:**

```json
{
  "contractAddress": "0x9650d442779368e0A039351eD7c75c3E93de372D",
  "eventId":         "0xabc123...",
  "to":              "0xBILLETERA_COMPRADOR",
  "seatNumber":      "A-101",
  "tokenUri":        "ipfs://Qm...",
  "signature":       "0x...",
  "ensName":         "badbunny-miami25.boleto.eth",
  "eventName":       "Bad Bunny — Miami 2025",
  "qrCodeUri":       "ipfs://Qm..."
}
```

**Minteo desde el frontend (wagmi):**

```ts
await walletClient.writeContract({
  address: voucher.contractAddress,
  abi: BOLETO_ABI,
  functionName: 'mintWithVoucher',
  args: [voucher.eventId, voucher.to, voucher.seatNumber, voucher.tokenUri, voucher.signature],
})
```

---

### `POST /v1/events/:eventId/mint`

Minteo gasless iniciado por el backend. La billetera de la API mintea directamente al comprador. Tu plataforma paga el gas (~$0.50–$2.00). El comprador recibe el NFT sin necesitar una billetera al momento de la compra.

También registra el subdominio ENS del asiento (`asiento.artista-evento.boleto.eth`) en propiedad del comprador.

**Requiere `Authorization: Bearer TU_API_KEY`.**

**Cuerpo de la Solicitud:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `seatNumber` | string | ✓ | Asiento a mintear, ej. `A-101` |
| `toWallet` | string | ✓ | Dirección Ethereum que recibirá el NFT |

**Ejemplo de Solicitud:**

```bash
curl -X POST https://boleto-api-production.up.railway.app/v1/events/badbunny-miami25.boleto.eth/mint \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{ "seatNumber": "A-101", "toWallet": "0xBILLETERA_COMPRADOR" }'
```

**Respuesta `200 OK`:**

```json
{
  "tokenId":     "42",
  "txHash":      "0x...",
  "seatNumber":  "A-101",
  "seatEnsName": "a-101.badbunny-miami25.boleto.eth",
  "ensName":     "badbunny-miami25.boleto.eth",
  "metadataUri": "ipfs://Qm...",
  "qrCodeUri":   "ipfs://Qm...",
  "ownerWallet": "0xBILLETERA_COMPRADOR"
}
```

---

### `GET / PATCH /v1/profile`

Obtiene o actualiza el perfil del promotor (nombre y banner). Estos valores se muestran en el dashboard del evento en `boleto.eth.limo/events?id=TU_EVENTO`.

**Requiere `Authorization: Bearer TU_API_KEY`.**

**PATCH — Actualizar Perfil:**

```bash
curl -X PATCH https://boleto-api-production.up.railway.app/v1/profile \
  -H "Authorization: Bearer blt_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "promoterName": "Live Nation Latin America",
    "bannerUri":    "https://tudominio.com/banner.jpg"
  }'
```

---

## Estándar de Metadata NFT

Cada NFT de entrada sigue el estándar de metadata de OpenSea. Todas las columnas de tu CSV de entradas se incluyen automáticamente como traits del NFT. El `animation_url` es el código QR escaneable que se muestra en la entrada del recinto.

```json
{
  "name":          "Bad Bunny — Miami 2025 — Asiento A-101",
  "description":   "Entrada oficial boleto.eth. Verificada en Ethereum.",
  "image":         "ipfs://<banner_del_evento>",
  "animation_url": "ipfs://<qr_code_png>",
  "attributes": [
    { "trait_type": "ENS Name",   "value": "badbunny-miami25.boleto.eth" },
    { "trait_type": "Event",      "value": "Bad Bunny — Miami 2025" },
    { "trait_type": "Seat",       "value": "A-101" },
    { "trait_type": "Section",    "value": "Piso VIP" },
    { "trait_type": "Row",        "value": "A" },
    { "trait_type": "Price USDC", "value": "150.00" }
  ]
}
```

**Comportamiento del QR:** Cuando el comprador hace clic en su NFT en OpenSea, se anima para mostrar el código QR (vía `animation_url`). El QR codifica una URL que apunta a `boleto.eth.limo/verify?event=...&seat=...` — el escáner del recinto carga esta página para confirmar que la entrada es válida on-chain.

---

## Guía de Integración para Plataformas

Cualquier plataforma de ticketing puede usar boleto.eth como infraestructura backend manteniendo su propio UX.

### Paso 1 — Crear Evento y Obtener Clave API

```bash
# Crear evento
FACTURA=$(curl -s -X POST https://boleto-api-production.up.railway.app/v1/events \
  -H "Content-Type: application/json" \
  -d '{ "artistSlug": "badbunny", "eventSlug": "miami25", ... }')

INVOICE_ID=$(echo $FACTURA | jq -r '.invoiceId')
TARIFA=$(echo $FACTURA | jq -r '.feeDue')
TESORO=$(echo $FACTURA | jq -r '.paymentAddress')

# Enviar $TARIFA USDC a $TESORO desde tu billetera de promotor
# Luego confirmar con el hash de la tx:
API_KEY=$(curl -s -X POST \
  https://boleto-api-production.up.railway.app/v1/events/$INVOICE_ID/confirm \
  -H "Content-Type: application/json" \
  -d '{ "txHash": "0xTU_TX" }' | jq -r '.apiKey')
```

### Paso 2 — Obtener Inventario

```js
const res = await fetch(`${API}/v1/events/${eventId}/inventory`, {
  headers: { Authorization: `Bearer ${API_KEY}` }
})
const { tickets, minted, available } = await res.json()
// Renderizar entradas en tu UI de mapa de asientos
```

### Paso 3 — En la Compra

**Opción A — El comprador mintea por sí mismo (recomendado para compradores cripto-nativos):**

```js
// 1. Obtener voucher firmado de la API
const voucher = await fetch(`${API}/v1/events/${eventId}/voucher`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ seatNumber: 'A-101', buyerWallet: direccionComprador })
}).then(r => r.json())

// 2. El comprador llama a mintWithVoucher() — tú provees la UI
await walletClient.writeContract({
  address: voucher.contractAddress,
  abi: BOLETO_ABI,
  functionName: 'mintWithVoucher',
  args: [voucher.eventId, voucher.to, voucher.seatNumber, voucher.tokenUri, voucher.signature]
})
// NFT minteado directamente al comprador. Sin transacción de backend necesaria.
```

**Opción B — Minteo gasless por backend (recomendado para compradores con fiat):**

```js
// Después de confirmar el pago, llamar a /mint desde tu backend
const entrada = await fetch(`${API}/v1/events/${eventId}/mint`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ seatNumber: 'A-101', toWallet: direccionComprador })
}).then(r => r.json())

// entrada.txHash — enviar al comprador como confirmación
// entrada.qrCodeUri — mostrar como su QR de entrada
// entrada.seatEnsName — ej. "a-101.badbunny-miami25.boleto.eth"
```

### Paso 4 — Escaneo en el Recinto

Apunta el escáner al QR embebido en el NFT. El QR codifica:

```
https://boleto.eth.limo/verify?event=badbunny-miami25.boleto.eth&seat=A-101
```

Esta página carga en el navegador y muestra un ✓ verde o ✗ rojo verificando el estado de minteo on-chain vía la API. Sin app requerida — funciona en cualquier navegador de smartphone.

---

## Verificar Entradas en el Recinto

```js
// Verificar programáticamente escaneando el QR
const inv = await fetch(`${API}/v1/events/${eventId}/inventory`, {
  headers: { Authorization: `Bearer ${API_KEY}` }
}).then(r => r.json())

const entrada = inv.tickets.find(t => t.seatNumber === asientoEscaneado)
const esValida = entrada?.minted === true && entrada?.ownerWallet === billeteraEsperada
```

---

## Desarrollo

### Requisitos Previos

- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- PostgreSQL (local o Railway)

### Configuración

```bash
git clone https://github.com/RWA-ID/boleto-api.git
cd boleto-api

npm install          # instala root + workspaces
cp .env.example .env
```

### Ejecutar API Localmente

```bash
cd api
npx tsx src/index.ts
# Escucha en :3001
```

### Ejecutar Dashboard Localmente

```bash
cd dashboard
npm run dev
# Abrir http://localhost:3000
```

### Compilar y Probar Contratos

```bash
forge build
forge test --gas-report
```

### Desplegar Contratos

```bash
forge script script/DeployBoletoTickets.s.sol:DeployBoletoTickets \
  --rpc-url $L1_RPC_URL \
  --private-key $L1_PRIVATE_KEY \
  --broadcast --verify
```

---

## Direcciones Desplegadas

| Contrato | Red | Dirección |
|---|---|---|
| BoletoTickets v2 | Ethereum Mainnet | [`0x9650d442779368e0A039351eD7c75c3E93de372D`](https://etherscan.io/address/0x9650d442779368e0A039351eD7c75c3E93de372D) |
| BoletoRegistrar (legado) | Ethereum Mainnet | [`0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20`](https://etherscan.io/address/0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20) |
| Tesoro de la Plataforma | Ethereum Mainnet | `0x0104c88ea4f55c26df89f5cd3ec62f3c8288d69b` |

| Servicio | URL |
|---|---|
| API | `https://boleto-api-production.up.railway.app` |
| Dashboard | `https://boleto.eth.limo` |
| Docs API | `https://boleto.eth.limo/docs` |

---

## Licencia / License

MIT

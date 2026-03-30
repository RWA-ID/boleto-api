# Deploying boleto.eth Dashboard to IPFS

The dashboard is a Next.js static export hosted on IPFS, served via `boleto.eth` ENS contenthash.

## Build

```bash
cd dashboard
npm install
npm run build
# Static output is in: dashboard/out/
```

## Upload to IPFS

### Option A — Pinata
```bash
# Install Pinata CLI
npm install -g @pinata/cli
pinata-cli -k <YOUR_PINATA_JWT> upload ./out
# Copy the returned CID
```

### Option B — web3.storage / Storacha
```bash
npx w3 put ./out --name boleto-eth-dashboard
# Copy the returned CID
```

### Option C — ipfs CLI (local node)
```bash
ipfs add -r ./out
# Copy the root CID from the last line
```

## Set ENS Contenthash

1. Go to https://app.ens.domains/boleto.eth
2. Edit Records → Content Hash
3. Set to `ipfs://<YOUR_CID>`
4. Sign and submit the transaction

The site will be accessible at:
- `https://boleto.eth.limo` (via eth.limo gateway)
- `https://boleto.eth.link` (via eth.link gateway)
- `https://ipfs.io/ipfs/<CID>` (direct IPFS)

## Environment Variables

Create `dashboard/.env.local` before building:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_API_URL=https://api.boleto.eth
NEXT_PUBLIC_ALCHEMY_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

> All `NEXT_PUBLIC_*` vars are baked into the static build at compile time.
> Never include secrets — these values are public in the output JS bundle.

## Notes

- The `output: 'export'` in `next.config.js` produces a fully static site (no server).
- `trailingSlash: true` ensures IPFS gateways can resolve routes correctly.
- Dynamic routes (`/events/[eventId]`) are handled client-side via `useParams` —
  navigation from internal links works; direct URL access depends on the gateway
  supporting SPA fallback (eth.limo does via `_redirects`).
- Images must use `<img>` tags or set `images: { unoptimized: true }` (already configured).

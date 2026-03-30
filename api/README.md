# boleto.eth — REST API

> Web3 ticketing infrastructure for Latin American events.
> ENS subdomain-based NFT tickets on Ethereum L1 + Base L2.

---

## English

### Overview

`boleto.eth` is a permissionless Web3 ticketing protocol. Promoters register events as ENS subdomains (e.g. `badbunny-miami25.boleto.eth`), pay a one-time protocol fee in USDC, and receive a deployed ERC-721 ticket contract on Base L2 with an immutable royalty splitter. This repository is the REST API that orchestrates everything: on-chain ENS registration, contract deployment, IPFS metadata, and ticket lifecycle (mint → verify → redeem).

### Architecture

```
Client / Dashboard
        │
        ▼
  boleto.eth API  (this repo — Express on Railway)
       ├── L1: BoletoRegistrar @ 0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20
       │        └── Registers artistSlug-eventSlug.boleto.eth on Ethereum mainnet
       ├── L2: BoletoFactory   @ 0xF48B5602399A187eEDF5953404d71b57Db0496B8
       │        └── Deploys RoyaltySplitter + BoletoTicket on Base mainnet
       ├── IPFS (Pinata) — ticket metadata + seat map manifests
       └── PostgreSQL (Railway) — events, seats, platforms, reserved artists
```

### ENS Subdomain Structure

Every event and ticket issued through boleto.eth gets a permanent, human-readable ENS subdomain identity. The naming follows a two-level hierarchy:

```
seat-a12  .  badbunny-miami25  .  boleto.eth
    │               │                  │
 Seat / Token   Artist + Event      Protocol
  Identifier      Subdomain            TLD
```

#### Level 1 — Event subdomain (Ethereum L1)

```
badbunny-miami25.boleto.eth
```

- Registered on the **Ethereum mainnet** ENS NameWrapper when the promoter pays the protocol fee
- Format: `{artistSlug}-{eventSlug}.boleto.eth`
- Artist slugs are normalized and protected (e.g. `badbunny`, `shakira`, `jbalvin` are reserved — cannot be registered by others)
- The subdomain's `text("l2contract")` record is set to the BoletoTicket contract address on Base
- Permanent — even if boleto.eth changes ownership, the NameWrapper lock preserves it

#### Level 2 — Ticket subdomain (optional, per NFT)

```
seat-a12.badbunny-miami25.boleto.eth
```

- Optionally assigned per NFT during the minting call (`seatId` param)
- Resolves to the **current ticket holder's wallet address** via ENS wildcard resolution
- Transfers automatically when the NFT is traded (if not soulbound)
- Makes individual seats searchable and identifiable on-chain forever — proof of attendance that outlives any database

---

### What the Ticket NFT Looks Like

Each BoletoTicket is an **ERC-721 NFT on Base L2** with rich on-chain metadata:

```
┌─────────────────────────────────────────────┐
│  [Concert Scene SVG artwork]                 │
│  ● ENS VERIFIED                    #1042    │
│                                              │
│  SEAT A-12              FLOOR VIP           │
│  Floor Level · Row A                         │
├─────────────────────────────────────────────┤  ← perforated ticket divider
│  On-Chain Identity                           │
│  seat-a12.badbunny-miami25.boleto.eth        │
│                                              │
│  Event: Bad Bunny    Date: Aug 15, 2025      │
│  Miami 2025          8:00 PM EST             │
│  Venue: Kaseya       Token: #1042            │
│  Center, Miami FL    Base L2                 │
│                                              │
│  [QR Code]  boleto.eth  [✓ On-Chain]        │
└─────────────────────────────────────────────┘
```

**Metadata stored on IPFS:**
- `name` — `badbunny-miami25 #1042`
- `description` — event details + venue
- `image` — IPFS URI to the ticket artwork
- `attributes` — seatId, section, row, eventDate, venueName, isRedeemed, isSoulbound

---

### Protocol Fee Tiers

| Ticket Count     | Rate / ticket | Example (10 000 tickets) |
|------------------|--------------|--------------------------|
| 1 – 9,999        | $0.65 USDC   | $6,500                   |
| 10,000 – 49,999  | $0.50 USDC   | $5,000                   |
| 50,000+          | $0.25 USDC   | $12,500                  |

The fee is paid once upfront. 100% of ticket sale revenue goes to the promoter.
Secondary market royalties: **1.5% platform (hardcoded, immutable) + promoter royalty (0–20%, set at event creation)**.

---

### Royalties & Collectible Value

#### How royalties work

Every BoletoTicket contract is deployed with a companion **RoyaltySplitter** that implements [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981) — the NFT Royalty Standard recognized by OpenSea, Blur, Rarible, and all major marketplaces.

When a ticket is resold on any EIP-2981-compliant marketplace:

| Recipient | Amount | Notes |
|-----------|--------|-------|
| boleto.eth platform | **1.5%** | Hardcoded in the immutable RoyaltySplitter contract. Cannot be changed after deployment. |
| Promoter wallet | **0 – 20%** (you choose) | Set at event creation via `promoterRoyaltyBps`. Goes directly to the promoter's wallet. |
| Ticket seller | Remainder | The current NFT holder receives the sale proceeds minus royalties. |

**Example:** A Floor VIP ticket for a sold-out show resells for $500.
- boleto.eth: $7.50 (1.5%)
- Promoter (at 5% = 500 bps): $25.00
- Seller: $467.50

The platform earns from every resale of every ticket, across every event, forever — without any additional infrastructure.

#### Why tickets become collectibles

Traditional tickets are worthless after the event. NFT tickets are different:

1. **Scarcity + provenance** — A Floor VIP seat from a sold-out Bad Bunny show is provably rare. Unlike paper stubs or PDFs, the NFT has immutable, on-chain proof of its seat assignment and original owner.

2. **Proof of attendance** — The ENS subdomain `seat-a12.badbunny-miami25.boleto.eth` lives on-chain forever. Collectors and fans can display verifiable proof of attendance in their ENS profiles, wallets, and NFT galleries.

3. **Soulbound unlock flow** — Promoters can issue tickets as soulbound (non-transferable) to prevent scalping during the sale period, then toggle transferability post-event, instantly creating a secondary market for memorabilia.

4. **Loyalty & future airdrops** — Promoters can snapshot ticket holders and airdrop perks: early access codes, VIP upgrades, or token-gated content for the next show. Owning `badbunny-miami25.boleto.eth` could grant priority access to `badbunny-miami26.boleto.eth`.

5. **Royalty compounding** — As the event's cultural significance grows (anniversary, first-ever show, record-breaking attendance), so does the resale value — and every resale generates royalties for both the platform and the promoter.

#### Revenue projection example

```
Event:        10,000 ticket concert
Primary sale: $100 avg ticket → promoter keeps 100% = $100,000
Protocol fee: 5,000 tickets × $0.50 = $2,500 (one-time)

Secondary market (assume 20% of tickets resell at 1.5× avg price):
  2,000 tickets × $150 resale × 1.5% platform = $4,500 platform royalties
  2,000 tickets × $150 resale × 5% promoter  = $15,000 promoter royalties

Platform total: $2,500 + $4,500 = $7,000 from one event
Promoter total: $100,000 + $15,000 = $115,000 (vs $100k with no secondary)
```

---

### API Reference

All routes (except `/health`) require `Authorization: Bearer <api_key>`.

#### Events

```
POST   /v1/events
POST   /v1/events/:invoiceId/confirm
GET    /v1/events/:id
GET    /v1/events/:eventId/manifest
```

#### Tickets

```
POST   /v1/tickets/mint
GET    /v1/tickets/:tokenId/verify
POST   /v1/tickets/:tokenId/redeem
```

#### Admin

```
POST   /v1/admin/keys      (x-admin-secret header)
GET    /v1/admin/keys      (x-admin-secret header)
DELETE /v1/admin/keys/:id  (x-admin-secret header)
```

#### Health

```
GET    /health
```

---

### Event Lifecycle

```
1. POST /v1/events
   └── Validates slugs, checks artist reservation, calculates fee
   └── Returns: invoiceId, ensName, feeDue (USDC), paymentAddress

2. Promoter sends USDC to platform treasury on Ethereum L1

3. POST /v1/events/:invoiceId/confirm  { txHash }
   └── Verifies USDC Transfer event on-chain
   └── Calls BoletoRegistrar.registerEvent() → mints ENS subdomain on L1
   └── Calls BoletoFactory.deployEvent() → deploys RoyaltySplitter + BoletoTicket on Base
   └── Calls BoletoRegistrar.setL2Contract() → links L2 address to ENS record
   └── Uploads seat map manifest to IPFS
   └── Returns: ensName, l2ContractAddress, splitterAddress, ipfsManifest

4. POST /v1/tickets/mint
   └── Uploads ticket NFT metadata to IPFS
   └── Calls BoletoTicket.mint() on Base
   └── Returns: tokenId, txHash, metadataUri, ensTicketName

5. GET /v1/tickets/:tokenId/verify
   └── Returns: valid, owner, seatId, section, used

6. POST /v1/tickets/:tokenId/redeem  { signature }
   └── Calls BoletoTicket.redeem() on Base (signature verified on-chain)
   └── Marks ticket as used in DB
```

---

### Environment Variables

Create a `.env` file at the root of this repo (see `.env.example`):

```bash
# Ethereum L1
L1_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
L1_PRIVATE_KEY=0x...                         # deployer / API operator wallet
BOLETO_REGISTRAR_ADDRESS=0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20
PLATFORM_TREASURY_ADDRESS=0x...              # receives USDC protocol fees

# Base L2
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_PRIVATE_KEY=0x...
BOLETO_FACTORY_ADDRESS=0xF48B5602399A187eEDF5953404d71b57Db0496B8

# USDC
USDC_L1_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDC_BASE_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Database
DATABASE_URL=postgresql://...

# IPFS (Pinata)
PINATA_JWT=...

# API
ADMIN_SECRET=...                             # protects /v1/admin/* endpoints
CORS_ORIGIN=https://boleto.eth.limo
PORT=3000
```

On Railway, set these in the **Variables** panel — no `.env` file needed.

---

### Running Locally

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build
npm start
```

### Database Setup

```bash
# Generate migration SQL from schema
npm run db:generate

# Apply migrations to your database
npm run db:push

# Seed reserved artist slugs (Bad Bunny, Shakira, J Balvin, etc.)
npm run seed
```

### Creating Your First API Key

```bash
curl -X POST http://localhost:3000/v1/admin/keys \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-platform", "walletAddress": "0x..."}'
```

The response includes the `apiKey` — store it securely. It is shown **only once**.

---

### Deploying to Railway

1. Push this repo to GitHub
2. Create a new Railway project → **Deploy from GitHub repo** → select this repo
3. Add a **PostgreSQL** service to the project (Railway will inject `DATABASE_URL` automatically)
4. Set all environment variables in the **Variables** panel
5. Railway auto-deploys on every push to `main`
6. After first deploy, run migrations:
   ```bash
   railway run npm run db:push
   railway run npm run seed
   ```

---

### Contracts

| Contract | Network | Address |
|---|---|---|
| BoletoRegistrar | Ethereum Mainnet | [`0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20`](https://etherscan.io/address/0x346f1f1ac06b8325317aea17a7f8884bebe62c20) |
| BoletoFactory | Base Mainnet | [`0xF48B5602399A187eEDF5953404d71b57Db0496B8`](https://basescan.org/address/0xf48b5602399a187eedf5953404d71b57db0496b8) |

---

### Tech Stack

- **Runtime**: Node.js 20, TypeScript
- **Framework**: Express 4
- **Blockchain**: viem v2 (Ethereum L1 + Base L2)
- **ORM**: Drizzle ORM + PostgreSQL
- **IPFS**: Pinata SDK
- **Auth**: API key (Bearer token) + admin secret
- **Hosting**: Railway

---

---

## Español

### Descripción General

`boleto.eth` es un protocolo de boletería Web3 sin permisos centrales. Los promotores registran eventos como subdominios ENS (ej. `badbunny-miami25.boleto.eth`), pagan una tarifa única de protocolo en USDC y reciben un contrato de tickets ERC-721 desplegado en Base L2 con un divisor de regalías inmutable. Este repositorio es la API REST que coordina todo: registro ENS en cadena, despliegue de contratos, metadatos en IPFS y el ciclo de vida del ticket (mintear → verificar → canjear).

### Arquitectura

```
Cliente / Dashboard
        │
        ▼
  API boleto.eth  (este repo — Express en Railway)
       ├── L1: BoletoRegistrar @ 0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20
       │        └── Registra artistSlug-eventSlug.boleto.eth en Ethereum mainnet
       ├── L2: BoletoFactory   @ 0xF48B5602399A187eEDF5953404d71b57Db0496B8
       │        └── Despliega RoyaltySplitter + BoletoTicket en Base mainnet
       ├── IPFS (Pinata) — metadatos de tickets + manifiestos de asientos
       └── PostgreSQL (Railway) — eventos, asientos, plataformas, artistas reservados
```

### Estructura de Subdominios ENS

Cada evento y ticket emitido a través de boleto.eth recibe una identidad ENS permanente y legible. La nomenclatura sigue una jerarquía de dos niveles:

```
seat-a12  .  badbunny-miami25  .  boleto.eth
    │               │                  │
 Asiento /      Artista + Evento    Protocolo
  Token ID        Subdominio           TLD
```

#### Nivel 1 — Subdominio del evento (Ethereum L1)

```
badbunny-miami25.boleto.eth
```

- Registrado en el **ENS NameWrapper de Ethereum mainnet** cuando el promotor paga la tarifa
- Formato: `{artistSlug}-{eventSlug}.boleto.eth`
- Los slugs de artistas están normalizados y protegidos (ej. `badbunny`, `shakira`, `jbalvin` están reservados)
- El registro `text("l2contract")` apunta al contrato BoletoTicket en Base
- Permanente — aunque boleto.eth cambie de propietario, el bloqueo del NameWrapper lo preserva

#### Nivel 2 — Subdominio del ticket (opcional, por NFT)

```
seat-a12.badbunny-miami25.boleto.eth
```

- Se asigna opcionalmente por NFT durante el minteo (parámetro `seatId`)
- Resuelve a la **billetera del portador actual del ticket** mediante resolución wildcard ENS
- Se transfiere automáticamente cuando el NFT se negocia (si no es soulbound)
- Hace que los asientos individuales sean identificables y buscables en cadena para siempre

---

### Cómo Luce el NFT del Ticket

Cada BoletoTicket es un **NFT ERC-721 en Base L2** con metadatos ricos en cadena:

```
┌─────────────────────────────────────────────┐
│  [Arte SVG de escena de concierto]           │
│  ● ENS VERIFICADO                  #1042    │
│                                              │
│  ASIENTO A-12           FLOOR VIP           │
│  Nivel Piso · Fila A                         │
├─────────────────────────────────────────────┤  ← perforación de boleto
│  Identidad en Cadena                         │
│  seat-a12.badbunny-miami25.boleto.eth        │
│                                              │
│  Evento: Bad Bunny   Fecha: 15 Ago, 2025     │
│  Miami 2025          8:00 PM EST             │
│  Venue: Kaseya       Token: #1042            │
│  Center, Miami FL    Base L2                 │
│                                              │
│  [QR Code]  boleto.eth  [✓ En Cadena]       │
└─────────────────────────────────────────────┘
```

---

### Tarifas de Protocolo

| Cantidad de Tickets  | Tarifa / ticket | Ejemplo (10 000 tickets) |
|----------------------|----------------|--------------------------|
| 1 – 9,999            | $0.65 USDC     | $6,500                   |
| 10,000 – 49,999      | $0.50 USDC     | $5,000                   |
| 50,000+              | $0.25 USDC     | $12,500                  |

La tarifa se paga una única vez por adelantado. El 100% de los ingresos de venta de tickets va al promotor.
Regalías en mercado secundario: **1.5% plataforma (fijo e inmutable) + regalía del promotor (0–20%, se define al crear el evento)**.

---

### Regalías y Valor Coleccionable

#### Cómo funcionan las regalías

Cada contrato BoletoTicket se despliega con un **RoyaltySplitter** que implementa [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981) — el estándar de regalías NFT reconocido por OpenSea, Blur, Rarible y todos los mercados principales.

Cuando un ticket se revende en cualquier mercado compatible con EIP-2981:

| Destinatario | Monto | Notas |
|---|---|---|
| Plataforma boleto.eth | **1.5%** | Codificado en el contrato RoyaltySplitter inmutable. No puede modificarse tras el despliegue. |
| Billetera del promotor | **0 – 20%** (tú decides) | Se configura al crear el evento vía `promoterRoyaltyBps`. Va directamente a la billetera del promotor. |
| Vendedor del ticket | El resto | El portador actual del NFT recibe los fondos de la venta menos las regalías. |

**Ejemplo:** Un ticket Floor VIP de un show agotado se revende por $500.
- boleto.eth: $7.50 (1.5%)
- Promotor (5% = 500 bps): $25.00
- Vendedor: $467.50

La plataforma gana con cada reventa de cada ticket, en cada evento, para siempre — sin infraestructura adicional.

#### Por qué los tickets se vuelven coleccionables

1. **Escasez + procedencia verificable** — Un asiento Floor VIP de un show agotado de Bad Bunny es provablemente escaso. A diferencia de talonarios de papel o PDFs, el NFT tiene prueba inmutable en cadena de su asignación de asiento y propietario original.

2. **Prueba de asistencia** — El subdominio ENS `seat-a12.badbunny-miami25.boleto.eth` vive en cadena para siempre. Los coleccionistas pueden exhibir prueba verificable de asistencia en sus perfiles ENS y galerías de NFT.

3. **Flujo de desbloqueo soulbound** — Los promotores pueden emitir tickets soulbound (no transferibles) para evitar la reventa durante la venta, y luego habilitar la transferibilidad post-evento, creando instantáneamente un mercado secundario de memorabilia.

4. **Lealtad y airdrops futuros** — Los promotores pueden tomar un snapshot de los portadores de tickets y hacer airdrops: códigos de acceso anticipado, mejoras VIP o contenido token-gated para el próximo show. Tener `badbunny-miami25.boleto.eth` podría otorgar prioridad para `badbunny-miami26.boleto.eth`.

#### Proyección de ingresos de ejemplo

```
Evento:          Concierto de 10,000 tickets
Venta primaria:  $100 precio promedio → promotor queda con 100% = $100,000
Tarifa protocolo: 5,000 tickets × $0.50 = $2,500 (única vez)

Mercado secundario (suponiendo que el 20% se revende a 1.5× precio promedio):
  2,000 tickets × $150 reventa × 1.5% plataforma = $4,500 en regalías
  2,000 tickets × $150 reventa × 5% promotor     = $15,000 en regalías

Total plataforma: $2,500 + $4,500 = $7,000 por evento
Total promotor: $100,000 + $15,000 = $115,000
```

---

### Referencia de la API

Todas las rutas (excepto `/health`) requieren `Authorization: Bearer <api_key>`.

#### Eventos

```
POST   /v1/events
POST   /v1/events/:invoiceId/confirm
GET    /v1/events/:id
GET    /v1/events/:eventId/manifest
```

#### Tickets

```
POST   /v1/tickets/mint
GET    /v1/tickets/:tokenId/verify
POST   /v1/tickets/:tokenId/redeem
```

#### Admin

```
POST   /v1/admin/keys      (header: x-admin-secret)
GET    /v1/admin/keys      (header: x-admin-secret)
DELETE /v1/admin/keys/:id  (header: x-admin-secret)
```

#### Health

```
GET    /health
```

---

### Ciclo de Vida de un Evento

```
1. POST /v1/events
   └── Valida slugs, verifica reserva de artista, calcula tarifa
   └── Devuelve: invoiceId, ensName, feeDue (USDC), paymentAddress

2. El promotor envía USDC al treasury de la plataforma en Ethereum L1

3. POST /v1/events/:invoiceId/confirm  { txHash }
   └── Verifica el evento Transfer de USDC en cadena
   └── Llama a BoletoRegistrar.registerEvent() → acuña subdominio ENS en L1
   └── Llama a BoletoFactory.deployEvent() → despliega RoyaltySplitter + BoletoTicket en Base
   └── Llama a BoletoRegistrar.setL2Contract() → enlaza la dirección L2 al registro ENS
   └── Sube el manifiesto del mapa de asientos a IPFS
   └── Devuelve: ensName, l2ContractAddress, splitterAddress, ipfsManifest

4. POST /v1/tickets/mint
   └── Sube los metadatos del NFT ticket a IPFS
   └── Llama a BoletoTicket.mint() en Base
   └── Devuelve: tokenId, txHash, metadataUri, ensTicketName

5. GET /v1/tickets/:tokenId/verify
   └── Devuelve: valid, owner, seatId, section, used

6. POST /v1/tickets/:tokenId/redeem  { signature }
   └── Llama a BoletoTicket.redeem() en Base (firma verificada en cadena)
   └── Marca el ticket como usado en la BD
```

---

### Variables de Entorno

Crea un archivo `.env` en la raíz de este repo (ver `.env.example`):

```bash
# Ethereum L1
L1_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/TU_CLAVE
L1_PRIVATE_KEY=0x...                         # billetera operador de la API
BOLETO_REGISTRAR_ADDRESS=0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20
PLATFORM_TREASURY_ADDRESS=0x...              # recibe tarifas USDC del protocolo

# Base L2
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/TU_CLAVE
BASE_PRIVATE_KEY=0x...
BOLETO_FACTORY_ADDRESS=0xF48B5602399A187eEDF5953404d71b57Db0496B8

# USDC
USDC_L1_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDC_BASE_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Base de datos
DATABASE_URL=postgresql://...

# IPFS (Pinata)
PINATA_JWT=...

# API
ADMIN_SECRET=...                             # protege los endpoints /v1/admin/*
CORS_ORIGIN=https://boleto.eth.limo
PORT=3000
```

En Railway, configura estas variables en el panel de **Variables** — no se necesita archivo `.env`.

---

### Ejecutar en Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (hot reload)
npm run dev

# Compilar para producción
npm run build
npm start
```

### Configuración de la Base de Datos

```bash
# Generar SQL de migración desde el esquema
npm run db:generate

# Aplicar migraciones a tu base de datos
npm run db:push

# Poblar artistas reservados (Bad Bunny, Shakira, J Balvin, etc.)
npm run seed
```

### Crear tu Primera Clave de API

```bash
curl -X POST http://localhost:3000/v1/admin/keys \
  -H "x-admin-secret: TU_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "mi-plataforma", "walletAddress": "0x..."}'
```

La respuesta incluye el `apiKey` — guárdala de forma segura. Se muestra **una sola vez**.

---

### Despliegue en Railway

1. Sube este repo a GitHub
2. Crea un nuevo proyecto en Railway → **Deploy from GitHub repo** → selecciona este repo
3. Agrega un servicio **PostgreSQL** al proyecto (Railway inyectará `DATABASE_URL` automáticamente)
4. Configura todas las variables de entorno en el panel de **Variables**
5. Railway hace deploy automático en cada push a `main`
6. Después del primer deploy, ejecuta las migraciones:
   ```bash
   railway run npm run db:push
   railway run npm run seed
   ```

---

### Contratos Desplegados

| Contrato | Red | Dirección |
|---|---|---|
| BoletoRegistrar | Ethereum Mainnet | [`0x346f1F1aC06B8325317AEA17A7F8884BEbE62C20`](https://etherscan.io/address/0x346f1f1ac06b8325317aea17a7f8884bebe62c20) |
| BoletoFactory | Base Mainnet | [`0xF48B5602399A187eEDF5953404d71b57Db0496B8`](https://basescan.org/address/0xf48b5602399a187eedf5953404d71b57db0496b8) |

---

### Stack Tecnológico

- **Runtime**: Node.js 20, TypeScript
- **Framework**: Express 4
- **Blockchain**: viem v2 (Ethereum L1 + Base L2)
- **ORM**: Drizzle ORM + PostgreSQL
- **IPFS**: Pinata SDK
- **Autenticación**: API key (Bearer token) + admin secret
- **Hosting**: Railway

---

## License / Licencia

MIT

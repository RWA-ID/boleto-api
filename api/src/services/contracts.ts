import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  decodeEventLog,
  keccak256,
  toBytes,
  type Hash,
  type Address,
} from 'viem'
import { namehash } from 'viem/ens'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, sepolia } from 'viem/chains'

// ── Chain helpers ─────────────────────────────────────────────────────────────

function isTestnet() {
  return process.env.NETWORK === 'sepolia' || process.env.NODE_ENV === 'test'
}

export function getL1PublicClient() {
  return createPublicClient({
    chain:     isTestnet() ? sepolia : mainnet,
    transport: http(process.env.L1_RPC_URL),
  })
}

export function getL1WalletClient() {
  const key = process.env.L1_PRIVATE_KEY as `0x${string}`
  if (!key) throw new Error('L1_PRIVATE_KEY not set')
  return createWalletClient({
    account:   privateKeyToAccount(key),
    chain:     isTestnet() ? sepolia : mainnet,
    transport: http(process.env.L1_RPC_URL),
  })
}

// ── BoletoTickets ABI ─────────────────────────────────────────────────────────

export const BOLETO_TICKETS_ABI = parseAbi([
  // registration — O(1) gas, called at activation
  'function registerEvent(bytes32 eventId, uint256 totalSeats, string ensName, address promoter)',
  // buyer self-mint with EIP-712 voucher
  'function mintWithVoucher(bytes32 eventId, address to, string seatNumber, string tokenUri, bytes signature)',
  // backend direct-mint fallback
  'function mint(bytes32 eventId, address to, string seatNumber, string tokenUri) returns (uint256)',
  // views
  'function events(bytes32) view returns (bool registered, uint256 totalSeats, uint256 mintedCount, string ensName, address promoter)',
  'function registeredEvents(bytes32) view returns (bool)',
  'function eventEnsName(bytes32) view returns (string)',
  'function tokenEvent(uint256) view returns (bytes32)',
  'function seatMinted(bytes32) view returns (bool)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address, uint256)',
  // events
  'event EventRegistered(bytes32 indexed eventId, string ensName, address promoter, uint256 totalSeats)',
  'event TicketMinted(uint256 indexed tokenId, address indexed to, bytes32 indexed eventId, string seatNumber)',
])

export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

// ── ENS NameWrapper ───────────────────────────────────────────────────────────

const NAME_WRAPPER_ADDRESS = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401' as Address
const ENS_PUBLIC_RESOLVER  = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as Address
// namehash("boleto.eth")
const BOLETO_ETH_NODE      = '0x1fd7c395426f74dff675c2c0667966b8da878aa6c5c4c7b17e624f0f2865ab62' as `0x${string}`

const NAME_WRAPPER_ABI = parseAbi([
  'function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) returns (bytes32)',
])

/**
 * Register `label.boleto.eth` via the ENS NameWrapper.
 * Backend wallet owns boleto.eth directly so no approval needed.
 * Owner is set to the backend wallet so it can create seat sub-subdomains at mint time.
 */
export async function registerEnsSubdomain(params: {
  label:          string
  promoterWallet: Address  // kept for reference
}): Promise<Hash> {
  const wallet = getL1WalletClient()
  const pub    = getL1PublicClient()

  const hash = await wallet.writeContract({
    address:      NAME_WRAPPER_ADDRESS,
    abi:          NAME_WRAPPER_ABI,
    functionName: 'setSubnodeRecord',
    args: [
      BOLETO_ETH_NODE,
      params.label,
      wallet.account.address, // backend wallet owns event subdomain → can create seat subdomains
      ENS_PUBLIC_RESOLVER,
      0n,
      0,
      BigInt('18446744073709551615'),
    ],
  })

  await pub.waitForTransactionReceipt({ hash, timeout: 300_000, pollingInterval: 4_000 })
  return hash
}

/** Normalize a seat number to a valid ENS label e.g. "7 C-301" → "7-c-301" */
export function normalizeSeatLabel(seatNumber: string): string {
  return seatNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Register `seatLabel.eventLabel.boleto.eth` at mint time.
 * Backend wallet owns the event subdomain so no extra approval needed.
 */
export async function registerSeatSubdomain(params: {
  eventEnsName: string   // e.g. "test1000-miami100.boleto.eth"
  seatLabel:    string   // normalized e.g. "7-c-301"
  ownerWallet:  Address  // buyer wallet — owns the seat ENS name
}): Promise<Hash> {
  const wallet = getL1WalletClient()
  const pub    = getL1PublicClient()

  const eventNode = namehash(params.eventEnsName) as `0x${string}`

  const hash = await wallet.writeContract({
    address:      NAME_WRAPPER_ADDRESS,
    abi:          NAME_WRAPPER_ABI,
    functionName: 'setSubnodeRecord',
    args: [
      eventNode,
      params.seatLabel,
      params.ownerWallet,
      ENS_PUBLIC_RESOLVER,
      0n,
      0,
      BigInt('18446744073709551615'),
    ],
  })

  await pub.waitForTransactionReceipt({ hash, timeout: 300_000, pollingInterval: 4_000 })
  return hash
}

// ── Event ID ──────────────────────────────────────────────────────────────────

/** Compute the on-chain eventId (bytes32 keccak256 of the ENS name) */
export function computeEventId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName))
}

// ── Register event on shared BoletoTickets contract ───────────────────────────

export async function registerEventOnChain(params: {
  ensName:        string
  totalSeats:     number
  promoterWallet: string
}): Promise<{ txHash: Hash; eventId: `0x${string}` }> {
  const wallet   = getL1WalletClient()
  const pub      = getL1PublicClient()
  const address  = (process.env.BOLETO_CONTRACT_ADDRESS || process.env.BOLETO_REGISTRAR_ADDRESS) as Address
  if (!address) throw new Error('BOLETO_CONTRACT_ADDRESS not set')

  const eventId = computeEventId(params.ensName)

  const hash = await wallet.writeContract({
    address,
    abi:          BOLETO_TICKETS_ABI,
    functionName: 'registerEvent',
    args:         [eventId, BigInt(params.totalSeats), params.ensName, params.promoterWallet as Address],
  })

  await pub.waitForTransactionReceipt({ hash, timeout: 300_000 })
  return { txHash: hash, eventId }
}

// ── Sign ticket voucher (EIP-712) ─────────────────────────────────────────────

/** EIP-712 domain matches the deployed BoletoTickets contract */
function getVoucherDomain() {
  const address = (process.env.BOLETO_CONTRACT_ADDRESS || process.env.BOLETO_REGISTRAR_ADDRESS) as Address
  if (!address) throw new Error('BOLETO_CONTRACT_ADDRESS not set')
  return {
    name: 'BoletoTickets',
    version:           '1',
    chainId:           isTestnet() ? 11155111 : 1,
    verifyingContract: address,
  } as const
}

const VOUCHER_TYPES = {
  TicketVoucher: [
    { name: 'eventId',    type: 'bytes32' },
    { name: 'to',         type: 'address' },
    { name: 'seatNumber', type: 'string'  },
    { name: 'tokenUri',   type: 'string'  },
  ],
} as const

/**
 * Sign a ticket voucher using the backend minter wallet.
 * Returns the EIP-712 signature the buyer will submit to mintWithVoucher().
 */
export async function signTicketVoucher(params: {
  eventId:    `0x${string}`
  to:         Address
  seatNumber: string
  tokenUri:   string
}): Promise<`0x${string}`> {
  const wallet = getL1WalletClient()

  const signature = await wallet.signTypedData({
    domain:      getVoucherDomain(),
    types:       VOUCHER_TYPES,
    primaryType: 'TicketVoucher',
    message: {
      eventId:    params.eventId,
      to:         params.to,
      seatNumber: params.seatNumber,
      tokenUri:   params.tokenUri,
    },
  })

  return signature
}

// ── Mint single ticket (backend direct mint) ──────────────────────────────────

export async function mintTicket(params: {
  eventId:    `0x${string}`
  to:         Address
  seatNumber: string
  tokenUri:   string
}): Promise<{ tokenId: string; txHash: Hash }> {
  const wallet  = getL1WalletClient()
  const pub     = getL1PublicClient()
  const address = (process.env.BOLETO_CONTRACT_ADDRESS || process.env.BOLETO_REGISTRAR_ADDRESS) as Address
  if (!address) throw new Error('BOLETO_CONTRACT_ADDRESS not set')

  const hash = await wallet.writeContract({
    address,
    abi:          BOLETO_TICKETS_ABI,
    functionName: 'mint',
    args:         [params.eventId, params.to, params.seatNumber, params.tokenUri],
  })

  const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 300_000, pollingInterval: 4_000 })

  let tokenId = '0'
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi:    BOLETO_TICKETS_ABI,
        data:   log.data,
        topics: log.topics,
      } as any)
      if ((decoded as any).eventName === 'TicketMinted') {
        tokenId = String((decoded as any).args.tokenId)
        break
      }
    } catch {}
  }

  return { tokenId, txHash: hash }
}

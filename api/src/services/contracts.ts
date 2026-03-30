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
  'function registerEvent(bytes32 eventId, string ensName, address promoter)',
  'function mint(bytes32 eventId, address to, string seatNumber, string tokenUri) returns (uint256)',
  'function batchMint(bytes32 eventId, address[] recipients, string[] seatNumbers, string[] tokenUris) returns (uint256[])',
  'function registeredEvents(bytes32) view returns (bool)',
  'function eventEnsName(bytes32) view returns (string)',
  'function tokenEvent(uint256) view returns (bytes32)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address, uint256)',
  'event EventRegistered(bytes32 indexed eventId, string ensName, address promoter)',
  'event TicketMinted(uint256 indexed tokenId, address indexed to, bytes32 indexed eventId, string seatNumber)',
])

export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

// ── Event ID ──────────────────────────────────────────────────────────────────

/** Compute the on-chain eventId (bytes32 keccak256 of the ENS name) */
export function computeEventId(ensName: string): `0x${string}` {
  return keccak256(toBytes(ensName))
}

// ── ENS NameWrapper ───────────────────────────────────────────────────────────

const NAME_WRAPPER_ADDRESS  = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401' as Address
const ENS_PUBLIC_RESOLVER   = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63' as Address
// namehash("boleto.eth")
const BOLETO_ETH_NODE       = '0x1fd7c395426f74dff675c2c0667966b8da878aa6c5c4c7b17e624f0f2865ab62' as `0x${string}`

const NAME_WRAPPER_ABI = parseAbi([
  'function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) returns (bytes32)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
])

/**
 * Register `label.boleto.eth` via the ENS NameWrapper.
 * Requires the backend wallet to have setApprovalForAll on NameWrapper from the
 * boleto.eth owner (multisig). Label is just the subdomain part, e.g. "artist-event".
 */
export async function registerEnsSubdomain(params: {
  label:          string   // e.g. "test00-miami00" (no .boleto.eth suffix)
  promoterWallet: Address
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
      params.promoterWallet,
      ENS_PUBLIC_RESOLVER,
      0n,                               // ttl
      0,                                // fuses (none)
      BigInt('18446744073709551615'),    // expiry = type(uint64).max = permanent
    ],
  })

  await pub.waitForTransactionReceipt({ hash })
  return hash
}

// ── Register event on shared BoletoTickets contract ───────────────────────────

export async function registerEventOnChain(params: {
  ensName:        string
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
    args:         [eventId, params.ensName, params.promoterWallet as Address],
  })

  await pub.waitForTransactionReceipt({ hash })
  return { txHash: hash, eventId }
}

// ── Mint single ticket ────────────────────────────────────────────────────────

export async function mintTicket(params: {
  eventId:    `0x${string}`
  to:         Address
  seatNumber: string
  tokenUri:   string
}): Promise<{ tokenId: string; txHash: Hash }> {
  const wallet  = getL1WalletClient()
  const pub     = getL1PublicClient()
  const address = process.env.BOLETO_CONTRACT_ADDRESS as Address
  if (!address) throw new Error('BOLETO_CONTRACT_ADDRESS not set')

  const hash = await wallet.writeContract({
    address,
    abi:          BOLETO_TICKETS_ABI,
    functionName: 'mint',
    args:         [params.eventId, params.to, params.seatNumber, params.tokenUri],
  })

  const receipt = await pub.waitForTransactionReceipt({ hash })

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

// ── Batch mint tickets ────────────────────────────────────────────────────────

export async function batchMintTickets(params: {
  eventId:     `0x${string}`
  recipients:  Address[]
  seatNumbers: string[]
  tokenUris:   string[]
}): Promise<{ tokenIds: string[]; txHash: Hash }> {
  const wallet  = getL1WalletClient()
  const pub     = getL1PublicClient()
  const address = process.env.BOLETO_CONTRACT_ADDRESS as Address
  if (!address) throw new Error('BOLETO_CONTRACT_ADDRESS not set')

  const hash = await wallet.writeContract({
    address,
    abi:          BOLETO_TICKETS_ABI,
    functionName: 'batchMint',
    args:         [params.eventId, params.recipients, params.seatNumbers, params.tokenUris],
  })

  const receipt = await pub.waitForTransactionReceipt({ hash })

  const tokenIds: string[] = []
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi:    BOLETO_TICKETS_ABI,
        data:   log.data,
        topics: log.topics,
      } as any)
      if ((decoded as any).eventName === 'TicketMinted') {
        tokenIds.push(String((decoded as any).args.tokenId))
      }
    } catch {}
  }

  return { tokenIds, txHash: hash }
}

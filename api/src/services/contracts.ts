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

// ── Register event on shared BoletoTickets contract ───────────────────────────

export async function registerEventOnChain(params: {
  ensName:        string
  promoterWallet: string
}): Promise<{ txHash: Hash; eventId: `0x${string}` }> {
  const wallet   = getL1WalletClient()
  const pub      = getL1PublicClient()
  const address  = process.env.BOLETO_CONTRACT_ADDRESS as Address
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

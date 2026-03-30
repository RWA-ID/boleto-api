import { createPublicClient, http, parseAbi, type Hash } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

const USDC_TRANSFER_ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
])

function getL1Client() {
  const isTestnet = process.env.NODE_ENV === 'test' || process.env.NETWORK === 'sepolia'
  return createPublicClient({
    chain:     isTestnet ? sepolia : mainnet,
    transport: http(process.env.L1_RPC_URL),
  })
}

function getUsdcAddress(): `0x${string}` {
  const isTestnet = process.env.NODE_ENV === 'test' || process.env.NETWORK === 'sepolia'
  return (
    isTestnet
      ? (process.env.USDC_SEPOLIA_ADDRESS || '0x')
      : (process.env.USDC_L1_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  ) as `0x${string}`
}

/**
 * Verify that a transaction hash transferred at least the expected USDC amount to the treasury.
 * Retries up to 5 times with 3s gaps to handle L1 propagation delays.
 */
export async function verifyUsdcPayment(
  txHash:         Hash,
  expectedAmount: bigint,
  toAddress:      string
): Promise<boolean> {
  const client  = getL1Client()
  const usdc    = getUsdcAddress()
  const lowerTo = toAddress.toLowerCase()

  let receipt = null
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      receipt = await client.getTransactionReceipt({ hash: txHash })
      if (receipt) break
    } catch {
      // not mined yet or transient RPC error
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  if (!receipt) throw new Error('Transaction not confirmed yet — please wait a few seconds and try again.')
  if (receipt.status !== 'success') return false

  const logs = await client.getLogs({
    address:   usdc,
    event:     USDC_TRANSFER_ABI[0],
    blockHash: receipt.blockHash,
  })

  for (const log of logs) {
    const to    = ((log.args.to as string) || '').toLowerCase()
    const value = log.args.value as bigint
    if (to === lowerTo && value >= expectedAmount) return true
  }

  return false
}

import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'
dotenv.config()

/**
 * Deploy RoyaltySplitter + BoletoTicket for a single event.
 * Usage: npx hardhat run deploy/l2/deployEvent.ts --network baseSepolia
 * Set EVENT_* env vars before running.
 */
async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying event contracts with:', deployer.address)

  const platform       = process.env.PLATFORM_TREASURY_ADDRESS!
  const promoter       = process.env.EVENT_PROMOTER_WALLET!
  const promoterBps    = parseInt(process.env.EVENT_PROMOTER_BPS  || '250')
  const eventName      = process.env.EVENT_NAME                   || 'boleto.eth Event'
  const symbol         = process.env.EVENT_SYMBOL                 || 'BLTO'
  const merkleRoot     = process.env.EVENT_MERKLE_ROOT            || ethers.ZeroHash
  const ensName        = process.env.EVENT_ENS_NAME               || 'event.boleto.eth'
  const totalBps       = 150 + promoterBps
  const soulbound      = process.env.EVENT_SOULBOUND === 'true'

  if (!platform || !promoter) throw new Error('Set PLATFORM_TREASURY_ADDRESS and EVENT_PROMOTER_WALLET')

  // 1. Deploy splitter
  const SplitterFactory = await ethers.getContractFactory('RoyaltySplitter')
  const splitter        = await SplitterFactory.deploy(promoter, promoterBps, platform)
  await splitter.waitForDeployment()
  const splitterAddr = await splitter.getAddress()
  console.log('RoyaltySplitter deployed to:', splitterAddr)

  // 2. Deploy ticket
  const TicketFactory = await ethers.getContractFactory('BoletoTicket')
  const ticket        = await TicketFactory.deploy(
    eventName,
    symbol,
    merkleRoot,
    splitterAddr,
    ensName,
    totalBps,
    soulbound,
    deployer.address  // owner = API backend wallet
  )
  await ticket.waitForDeployment()
  const ticketAddr = await ticket.getAddress()
  console.log('BoletoTicket deployed to:    ', ticketAddr)

  console.log('\nDeployment complete.')
  console.log('  Set as API env:')
  console.log('  BOLETO_TICKET_ADDRESS=' + ticketAddr)
  console.log('  BOLETO_SPLITTER_ADDRESS=' + splitterAddr)
}

main().catch(console.error)

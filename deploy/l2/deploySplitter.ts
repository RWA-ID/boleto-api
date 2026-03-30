import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying RoyaltySplitter with:', deployer.address)

  const promoter    = process.argv[2]
  const promoterBps = parseInt(process.argv[3] || '250')
  const platform    = process.env.PLATFORM_TREASURY_ADDRESS

  if (!promoter) throw new Error('Usage: npx hardhat run deploy/l2/deploySplitter.ts --network baseSepolia <promoterAddress> <promoterBps>')
  if (!platform) throw new Error('PLATFORM_TREASURY_ADDRESS not set')

  const Factory  = await ethers.getContractFactory('RoyaltySplitter')
  const splitter = await Factory.deploy(promoter, promoterBps, platform)
  await splitter.waitForDeployment()

  const address = await splitter.getAddress()
  console.log('RoyaltySplitter deployed to:', address)
  console.log('  platform:    ', platform, '(150 bps)')
  console.log('  promoter:    ', promoter, `(${promoterBps} bps)`)
  console.log('  total royalty:', (150 + promoterBps) / 100 + '%')
}

main().catch(console.error)

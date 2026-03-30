import { ethers } from 'hardhat'
import * as dotenv from 'dotenv'
dotenv.config()

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying BoletoFactory with:', deployer.address)

  const platform = process.env.PLATFORM_TREASURY_ADDRESS
  if (!platform) throw new Error('PLATFORM_TREASURY_ADDRESS not set')

  const Factory = await ethers.getContractFactory('BoletoFactory')
  const factory = await Factory.deploy(platform)
  await factory.waitForDeployment()

  const address = await factory.getAddress()
  console.log('BoletoFactory deployed to:', address)
  console.log('  platform treasury:', platform)
  console.log('\nNext step:')
  console.log('  Set BOLETO_FACTORY_ADDRESS=' + address + ' in .env')
}

main().catch(console.error)

import { ethers } from 'hardhat'
import { namehash } from 'ethers'
import * as dotenv from 'dotenv'
dotenv.config()

const ENS_REGISTRY    = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const NAME_WRAPPER    = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401'
const PUBLIC_RESOLVER = '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63'
const USDC            = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const BOLETO_ETH_NODE = namehash('boleto.eth')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying BoletoRegistrar with:', deployer.address)

  const treasury = process.env.PLATFORM_TREASURY_ADDRESS
  if (!treasury) throw new Error('PLATFORM_TREASURY_ADDRESS not set')

  const Factory   = await ethers.getContractFactory('BoletoRegistrar')
  const registrar = await Factory.deploy(
    USDC,
    treasury,
    ENS_REGISTRY,
    NAME_WRAPPER,
    PUBLIC_RESOLVER,
    BOLETO_ETH_NODE
  )
  await registrar.waitForDeployment()

  const address = await registrar.getAddress()
  console.log('BoletoRegistrar deployed to:', address)
  console.log('boleto.eth node:', BOLETO_ETH_NODE)
  console.log('\nNext steps:')
  console.log('  1. Set BOLETO_REGISTRAR_ADDRESS=' + address + ' in .env')
  console.log('  2. Approve BoletoRegistrar as NameWrapper operator on boleto.eth')
  console.log('  3. Run seeds/reservedArtists.ts to populate reserved slugs')
}

main().catch(console.error)

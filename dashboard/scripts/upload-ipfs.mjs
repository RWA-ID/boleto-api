import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'

const JWT = process.env.PINATA_JWT
const OUT_DIR = new URL('../out', import.meta.url).pathname

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

const files = walk(OUT_DIR)
const form = new FormData()

for (const file of files) {
  const rel = relative(OUT_DIR, file)
  form.append('file', readFileSync(file), { filepath: `boleto-dashboard/${rel}`, contentType: 'application/octet-stream' })
}

form.append('pinataMetadata', JSON.stringify({ name: 'boleto-eth-dashboard' }))
form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

console.log(`Uploading ${files.length} files…`)

const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST',
  headers: { Authorization: `Bearer ${JWT}`, ...form.getHeaders() },
  body: form,
})

const json = await res.json()
if (!res.ok) { console.error(json); process.exit(1) }
console.log(`CID: ${json.IpfsHash}`)
console.log(`https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`)

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
// FormData and Blob are global in Node 22
// fetch is global in Node 18+

const JWT = process.env.PINATA_JWT
const OUT_DIR = new URL('./out', import.meta.url).pathname

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

const allFiles = walk(OUT_DIR)
console.log(`Uploading ${allFiles.length} files…`)

const form = new FormData()
for (const filePath of allFiles) {
  const rel = relative(OUT_DIR, filePath)
  const content = readFileSync(filePath)
  const blob = new Blob([content])
  form.append('file', blob, `boleto-eth-dashboard/${rel}`)
}
form.append('pinataMetadata', JSON.stringify({ name: 'boleto-eth-dashboard' }))
form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST',
  headers: { Authorization: `Bearer ${JWT}` },
  body: form,
})

const data = await res.json()
console.log(JSON.stringify(data, null, 2))

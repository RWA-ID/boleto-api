'use client'

import { useRef, useState } from 'react'

export type CsvRow = Record<string, string>

interface Props {
  onParsed: (rows: CsvRow[]) => void
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: CsvRow = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export function CsvUploader({ onParsed }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const process = (file: File) => {
    setError(null)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCsv(text)
      if (rows.length === 0) { setError('CSV is empty or has no data rows'); return }
      if (!rows[0]['seat_number']) { setError('CSV must have a "seat_number" column'); return }
      setInfo(`${rows.length} ticket${rows.length !== 1 ? 's' : ''} — columns: ${Object.keys(rows[0]).join(', ')}`)
      onParsed(rows)
    }
    reader.readAsText(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) process(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) process(file)
  }

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[#f97316] bg-[#f97316]/5'
            : 'border-[#333] hover:border-[#f97316]/50 bg-[#111]'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        <p className="text-[#666] text-sm font-mono">
          Drop your CSV here or <span className="text-[#f97316] underline">click to upload</span>
        </p>
        <p className="text-[#444] text-xs mt-2">
          Required column: <code className="text-[#f97316]">seat_number</code>
          {"  "}Optional: <code className="text-[#555]">price_usdc</code>, any other columns become NFT attributes
        </p>
      </div>

      {info && (
        <p className="text-[#22c55e] text-xs font-mono mt-2">{info}</p>
      )}
      {error && (
        <p className="text-red-400 text-xs font-mono mt-2">{error}</p>
      )}

      {/* CSV format example */}
      <div className="mt-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
        <p className="text-[#444] text-xs mb-1 font-mono">Example CSV format:</p>
        <pre className="text-[#555] text-xs font-mono overflow-x-auto">{`seat_number,price_usdc,section,row,gate
A101,150.00,Floor,A,1
A102,150.00,Floor,A,1
B201,95.00,Lower Bowl,B,2`}</pre>
      </div>
    </div>
  )
}

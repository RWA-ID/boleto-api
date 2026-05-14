'use client'

import { useState, useRef } from 'react'
import { API_BASE } from '@/lib/api'

interface Props {
  value: string
  onChange: (ipfsUri: string) => void
  onLocalPreview?: (blobUrl: string | null) => void
}

export function ImageUploader({ value, onChange, onLocalPreview }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)
    onLocalPreview?.(blobUrl)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)

      const res = await fetch(`${API_BASE}/v1/upload/image`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      onChange(data.uri)
    } catch (err: any) {
      setError(err.message)
      onLocalPreview?.(null)
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // Gateway URL for preview of already-set IPFS values
  const displayPreview = preview || (value?.startsWith('ipfs://')
    ? `https://cloudflare-ipfs.com/ipfs/${value.replace('ipfs://', '')}`
    : null)

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative w-full h-36 bg-[#0F1626] border-2 border-dashed border-[#1F2A44] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#E25822]/50 transition-colors overflow-hidden"
      >
        {displayPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayPreview} alt="Event" className="w-full h-full object-cover" />
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5E6A85" strokeWidth="1.5" className="mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-xs text-[#5E6A85]">Click or drag & drop event image</p>
            <p className="text-xs text-[#2B395C] mt-1">JPEG or PNG · max 10 MB</p>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-[#0A0F1A]/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#E25822] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} className="hidden" />
      </div>

      {value && !uploading && (
        <p className="text-xs text-[#22c55e] font-mono truncate">✓ {value}</p>
      )}
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}

      {displayPreview && (
        <button
          type="button"
          onClick={() => { onChange(''); setPreview(null); setError(null); onLocalPreview?.(null) }}
          className="text-xs text-[#8B95AB] hover:text-[#ef4444] transition-colors"
        >
          Remove image
        </button>
      )}
    </div>
  )
}

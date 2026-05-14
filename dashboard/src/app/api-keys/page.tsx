'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConnectButton } from '@/components/ConnectButton'

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('boleto_api_key')
    if (stored) setApiKey(stored)
  }, [])

  const save = () => {
    localStorage.setItem('boleto_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const clear = () => {
    localStorage.removeItem('boleto_api_key')
    setApiKey('')
  }

  return (
    <main className="min-h-screen bg-[#0A0F1A] text-[#E8ECF3]">
      <nav className="border-b border-[#1F2A44] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="font-mono text-[#E25822] font-bold">boleto.eth</Link>
        <span className="text-[#8B95AB]">/</span>
        <span className="text-[#E8ECF3]">API Keys</span>
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <h1 className="font-mono text-2xl font-bold">API Keys</h1>

        <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6 space-y-4">
          <h2 className="font-mono font-bold text-sm text-[#8B95AB] uppercase">Platform API Key</h2>
          <p className="text-sm text-[#8B95AB]">
            Your API key is stored locally in your browser and sent as{' '}
            <code className="font-mono bg-[#0F1626] px-1 rounded">Authorization: Bearer</code> on all API calls.
          </p>
          <div>
            <label className="block text-xs text-[#8B95AB] mb-1">API Key</label>
            <input
              type="password"
              placeholder="Enter your API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#0F1626] border border-[#1F2A44] rounded px-3 py-2 font-mono text-[#E8ECF3] focus:outline-none focus:border-[#E25822]"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!apiKey}
              className="flex-1 bg-[#E25822] text-white font-mono font-bold py-2 rounded hover:bg-[#ED7144] transition-colors disabled:opacity-50"
            >
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
            <button
              onClick={clear}
              className="px-4 border border-[#1F2A44] text-[#8B95AB] font-mono py-2 rounded hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-[#131C30] border border-[#1F2A44] rounded-xl p-6">
          <h2 className="font-mono font-bold text-sm text-[#8B95AB] uppercase mb-4">API Reference</h2>
          <div className="space-y-3 font-mono text-sm">
            {[
              { method: 'POST', path: '/v1/events',                        desc: 'Create event & get invoice' },
              { method: 'POST', path: '/v1/events/:invoiceId/confirm',     desc: 'Confirm USDC payment' },
              { method: 'GET',  path: '/v1/events/:id',                    desc: 'Get event details' },
              { method: 'GET',  path: '/v1/events/:id/manifest',           desc: 'Seat map status' },
              { method: 'POST', path: '/v1/tickets/mint',                  desc: 'Mint ticket NFT' },
              { method: 'GET',  path: '/v1/tickets/:tokenId/verify',       desc: 'Verify ticket' },
              { method: 'POST', path: '/v1/tickets/:tokenId/redeem',       desc: 'Redeem ticket at venue' },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-3">
                <span className={`w-12 text-center text-xs px-1.5 py-0.5 rounded font-bold ${
                  ep.method === 'POST' ? 'bg-[#E25822]/20 text-[#E25822]' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {ep.method}
                </span>
                <span className="text-[#E8ECF3] w-64">{ep.path}</span>
                <span className="text-[#8B95AB] text-xs">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { ConnectButton } from '@/components/ConnectButton'
import { ContactForm } from '@/components/ContactForm'
import NftTicketCard from '@/components/NftTicketCard'
import { useAccount } from 'wagmi'
import { calculateFee, formatUsdc } from '@/lib/pricing'
import { useState } from 'react'
import { useI18n, LanguageSwitcher } from '@/lib/i18n'

export default function HomePage() {
  const { isConnected } = useAccount()
  const { t } = useI18n()
  const [ticketCountStr, setTicketCountStr] = useState('5000')
  const ticketCount = Math.max(1, parseInt(ticketCountStr) || 1)
  const { fee, tier, pricePerTicket } = calculateFee(ticketCount)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">

      {/* ── NAV ── */}
      <nav className="border-b border-[#1f1f1f] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-bold text-[#f97316]">boleto.eth</span>
          <span className="text-xs text-[#666] bg-[#161616] border border-[#1f1f1f] px-2 py-0.5 rounded hidden sm:inline">
            {t.home.tagline}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <Link href="/create-event" className="text-sm text-[#f0f0f0] hover:text-[#f97316] transition-colors hidden md:block">
                {t.nav.createEvent}
              </Link>
              <Link href="/api-keys" className="text-sm text-[#f0f0f0] hover:text-[#f97316] transition-colors hidden md:block">
                {t.nav.apiKeys}
              </Link>
              <Link href="/events" className="text-sm text-[#f0f0f0] hover:text-[#f97316] transition-colors hidden md:block">
                {t.nav.scanner}
              </Link>
            </>
          )}
          <LanguageSwitcher />
          <ConnectButton />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f97316]/5 blur-[120px] rounded-full"/>
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px] bg-[#ff3c3c]/3 blur-[100px] rounded-full"/>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#161616] border border-[#f97316]/20 text-[#f97316] text-xs font-mono px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full animate-pulse"/>
                Live on Ethereum + Base
              </div>
              <h1 className="text-5xl md:text-6xl font-bold font-mono leading-tight mb-6">
                <span className="text-[#f97316]">Event ticketing</span>
                <br/>on the blockchain.
              </h1>
              <p className="text-lg text-[#aaa] leading-relaxed mb-8 max-w-lg">
                {t.home.description}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/create-event"
                  className="bg-[#f97316] text-white font-mono font-bold px-7 py-3 rounded hover:bg-[#fb923c] transition-colors"
                >
                  {t.home.createEvent} →
                </Link>
                <a
                  href="#how-it-works"
                  className="border border-[#333] text-[#aaa] font-mono px-7 py-3 rounded hover:border-[#f97316] hover:text-[#f97316] transition-colors"
                >
                  {t.home.howItWorks}
                </a>
              </div>
              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#1f1f1f]">
                {[
                  { value: '50+', label: t.home.statsReservedArtists },
                  { value: '1%', label: t.home.statsPlatformRoyalty },
                  { value: 'Ethereum', label: t.home.statsCheapMinting },
                ].map(s => (
                  <div key={s.label}>
                    <div className="font-mono text-2xl font-bold text-[#f97316]">{s.value}</div>
                    <div className="text-xs text-[#666] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: NFT card */}
            <div className="flex justify-center lg:justify-end">
              <div style={{ filter: 'drop-shadow(0 0 60px rgba(249,115,22,0.15))' }}>
                <NftTicketCard
                  seatNumber="A12"
                  eventName="Bad Bunny World Tour"
                  ensName="badbunny-worldtour2025.boleto.eth"
                  csvAttributes={{ section: 'VIP', row: 'A', price_usdc: '150' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBDOMAIN STRUCTURE ── */}
      <section className="border-t border-[#1f1f1f] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-mono text-3xl font-bold mb-3">
              Every Ticket is an <span className="text-[#f97316]">NFT On The Blockchain</span>
            </h2>
            <p className="text-[#aaa] max-w-2xl mx-auto">
              Each ticket gets a permanent, human-readable ENS subdomain — verifiable on-chain forever, even long after the event.
            </p>
          </div>

          {/* ENS name breakdown */}
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-8 mb-8 overflow-x-auto">
            <div className="font-mono text-center whitespace-nowrap mb-8">
              <span className="text-[#f0f0f0]/40 text-3xl md:text-4xl">seat-a12</span>
              <span className="text-[#f0f0f0]/30 text-3xl md:text-4xl">.</span>
              <span className="text-[#f0f0f0]/70 text-3xl md:text-4xl">badbunny-miami25</span>
              <span className="text-[#f0f0f0]/30 text-3xl md:text-4xl">.</span>
              <span className="text-[#f97316] text-3xl md:text-4xl">boleto.eth</span>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                {
                  part: 'seat-a12',
                  color: 'rgba(255,255,255,0.4)',
                  title: 'Seat / Token ID',
                  desc: 'Unique identifier for the specific seat or ticket tier. Set by the promoter during minting.',
                  icon: '🎫',
                },
                {
                  part: 'badbunny-miami25',
                  color: 'rgba(255,255,255,0.7)',
                  title: 'Artist + Event Slug',
                  desc: 'The event subdomain registered on Ethereum L1. Format: artistslug-eventslug.',
                  icon: '🎤',
                },
                {
                  part: 'boleto.eth',
                  color: '#f97316',
                  title: 'Protocol TLD',
                  desc: 'The boleto.eth root domain on ENS. Immutably owned by the protocol treasury.',
                  icon: '⛓️',
                },
              ].map(item => (
                <div key={item.part} className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f97316]/30 transition-colors">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="font-mono text-xs mb-2" style={{ color: item.color }}>{item.part}</div>
                  <div className="font-bold text-sm text-[#f0f0f0] mb-2">{item.title}</div>
                  <div className="text-xs text-[#666] leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full name structure table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6">
              <h3 className="font-mono font-bold text-[#f97316] mb-4 text-sm">Event-level subdomain</h3>
              <p className="font-mono text-sm text-[#aaa] mb-3">badbunny-miami25<span className="text-[#f97316]">.boleto.eth</span></p>
              <ul className="text-xs text-[#666] space-y-1.5">
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Registered on Ethereum L1 NameWrapper</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Created when promoter pays the protocol fee</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Tickets minted on the BoletoTickets contract on Ethereum</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Permanent — survives even if boleto.eth changes</li>
              </ul>
            </div>
            <div className="bg-[#161616] border border-[#1f1f1f] rounded-xl p-6">
              <h3 className="font-mono font-bold text-[#f97316] mb-4 text-sm">Ticket-level subdomain</h3>
              <p className="font-mono text-sm text-[#aaa] mb-3">seat-a12.badbunny-miami25<span className="text-[#f97316]">.boleto.eth</span></p>
              <ul className="text-xs text-[#666] space-y-1.5">
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Optional — assigned per NFT during minting</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Resolves to the ticket holder&apos;s wallet address</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Transferable with the NFT (if not soulbound)</li>
                <li className="flex gap-2"><span className="text-[#f97316]">→</span> Makes tickets collectible &amp; searchable on-chain</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="border-t border-[#1f1f1f] py-20 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-mono text-3xl font-bold mb-3">{t.home.howItWorks}</h2>
            <p className="text-[#aaa]">{t.home.howItWorksSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: t.home.step01Title, desc: t.home.step01Desc, detail: t.home.howItWorksDetail1 },
              { step: '02', title: t.home.step02Title, desc: t.home.step02Desc, detail: t.home.howItWorksDetail2 },
              { step: '03', title: t.home.step03Title, desc: t.home.step03Desc, detail: t.home.howItWorksDetail3 },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-7 hover:border-[#f97316]/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.08)] transition-all"
              >
                <div className="font-mono text-5xl font-bold text-[#f97316]/20 mb-4">{item.step}</div>
                <h3 className="font-mono font-bold text-[#f0f0f0] text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed mb-4">{item.desc}</p>
                <div className="text-xs font-mono text-[#f97316]/60 bg-[#f97316]/5 border border-[#f97316]/10 rounded px-3 py-1.5 inline-block">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CALCULATOR ── */}
      <section className="border-t border-[#1f1f1f] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-mono text-3xl font-bold mb-3">{t.home.pricingTitle}</h2>
            <p className="text-[#aaa]">{t.home.pricingSubtitle}</p>
          </div>
          <div className="bg-[#161616] border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#f97316]/30 transition-colors max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <label className="block text-xs font-bold text-[#666] uppercase tracking-widest mb-3">{t.home.ticketCount}</label>
                <input
                  type="number"
                  value={ticketCountStr}
                  onChange={(e) => setTicketCountStr(e.target.value)}
                  onBlur={() => setTicketCountStr(String(Math.max(1, parseInt(ticketCountStr) || 1)))}
                  min={1}
                  className="w-full bg-[#111] border border-[#1f1f1f] rounded-lg px-5 py-4 font-mono text-[#f0f0f0] text-xl focus:outline-none focus:border-[#f97316] transition-colors"
                />
                <div className="mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f97316]"/>
                  <p className="text-xs text-[#666]">
                    {t.home.tier}: <span className="text-[#f0f0f0] font-mono">{tier}</span>
                  </p>
                </div>
                {/* Tier breakdown */}
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: '1 – 999 tickets', price: '$0.15/ticket', active: ticketCount < 1000 },
                    { label: '1,000 – 4,999', price: '$0.25/ticket', active: ticketCount >= 1000 && ticketCount < 5000 },
                    { label: '5,000+', price: '$0.35/ticket', active: ticketCount >= 5000 },
                  ].map(tier => (
                    <div key={tier.label} className={`flex justify-between text-xs px-3 py-2 rounded transition-colors ${tier.active ? 'bg-[#f97316]/10 border border-[#f97316]/20 text-[#f0f0f0]' : 'text-[#444]'}`}>
                      <span>{tier.label}</span>
                      <span className="font-mono">{tier.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#1f1f1f]">
                  <span className="text-[#666] text-sm">{t.home.rate}</span>
                  <span className="font-mono text-[#f0f0f0]">${pricePerTicket.toFixed(2)} / ticket</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1f1f1f]">
                  <span className="text-[#666] text-sm">{t.home.tickets}</span>
                  <span className="font-mono text-[#f0f0f0]">{ticketCount.toLocaleString()}</span>
                </div>
                <div className="bg-[#111] rounded-xl p-5 border border-[#f97316]/15">
                  <div className="text-xs text-[#666] uppercase tracking-widest mb-2">{t.home.protocolFee}</div>
                  <div className="font-mono text-4xl font-bold text-[#f97316]">${formatUsdc(fee)}</div>
                  <div className="text-xs text-[#666] mt-1">USDC · one-time upfront</div>
                </div>
                <p className="text-xs text-[#555] leading-relaxed">{t.home.pricingNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROYALTIES & COLLECTIBLES ── */}
      <section className="border-t border-[#1f1f1f] py-20 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-mono text-3xl font-bold mb-3">
              NFT Resale &amp; <span className="text-[#f97316]">Royalties</span>
            </h2>
            <p className="text-[#aaa] max-w-2xl mx-auto">
              Your ticket is more than an entry pass — it&apos;s a collectible asset that generates ongoing revenue every time it changes hands.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: royalty flow */}
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-[#f0f0f0] mb-5">When a ticket is resold on OpenSea, Blur, etc.</h3>
              {[
                {
                  pct: '1%',
                  label: 'boleto.eth Protocol',
                  color: '#f97316',
                  desc: 'Hardcoded in the BoletoTickets contract on Ethereum. Immutable — cannot be changed or bypassed.',
                  example: '$2.00',
                },
                {
                  pct: 'You set',
                  label: 'Promoter Royalty',
                  color: '#22c55e',
                  desc: 'Set at event creation (e.g. 5%). Goes directly to the promoter wallet. Fully configurable 0–10%.',
                  example: '$10.00',
                },
                {
                  pct: 'Rest',
                  label: 'Ticket Seller',
                  color: '#666',
                  desc: 'The ticket holder receives the remaining proceeds from the secondary sale.',
                  example: '$188.00',
                },
              ].map(r => (
                <div key={r.label} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f97316]/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold" style={{ color: r.color }}>{r.pct}</span>
                      <span className="font-bold text-sm text-[#f0f0f0]">{r.label}</span>
                    </div>
                    <span className="font-mono text-sm text-[#555]">on $200 sale: {r.example}</span>
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed">{r.desc}</p>
                </div>
              ))}
              <div className="bg-[#f97316]/5 border border-[#f97316]/15 rounded-xl p-4 text-xs text-[#aaa] leading-relaxed">
                <strong className="text-[#f97316]">EIP-2981 compliant.</strong> Royalties are enforced on all major NFT marketplaces that respect the on-chain royalty standard.
              </div>
            </div>
            {/* Right: collectible value */}
            <div className="space-y-4">
              <h3 className="font-mono font-bold text-[#f0f0f0] mb-5">Why tickets become collectibles</h3>
              {[
                {
                  icon: '🏆',
                  title: 'Scarcity drives value',
                  desc: 'Sold-out show? Floor VIP seat? That NFT is rare. The same forces that make concert posters collectible apply here — but with verifiable provenance.',
                },
                {
                  icon: '📜',
                  title: 'Permanent proof of attendance',
                  desc: 'The ENS subdomain lives on-chain forever. "I was at Bad Bunny\'s first Miami show" is now a verifiable on-chain identity — not just a memory.',
                },
                {
                  icon: '🔄',
                  title: 'Soulbound toggle',
                  desc: 'Promoters can make tickets soulbound (non-transferable) for the event, then unlock resale afterward — turning attendees into collectors without a black market.',
                },
                {
                  icon: '💎',
                  title: 'VIP upgrades & perks',
                  desc: 'Future events can airdrop perks to holders of past tickets. Own a badbunny-miami25 ticket? You might get early access to badbunny-miami26.',
                },
              ].map(item => (
                <div key={item.title} className="flex gap-4 bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f97316]/20 transition-colors">
                  <div className="text-2xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="font-bold text-sm text-[#f0f0f0] mb-1">{item.title}</div>
                    <div className="text-xs text-[#666] leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROTOCOL GUARANTEES ── */}
      <section className="border-t border-[#1f1f1f] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-mono text-3xl font-bold mb-3">{t.home.guaranteesTitle}</h2>
            <p className="text-[#aaa]">{t.home.guaranteesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.home.guarantees.map((feature) => (
              <div key={feature} className="flex gap-3 items-start bg-[#161616] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#f97316]/30 transition-colors">
                <span className="text-[#f97316] mt-0.5 flex-shrink-0">→</span>
                <span className="text-sm text-[#aaa] leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="border-t border-[#1f1f1f] py-20 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-mono text-3xl font-bold mb-3">{t.contact.title}</h2>
            <p className="text-[#aaa]">{t.contact.subtitle}</p>
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1f1f1f] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-[#f97316]">boleto.eth</span>
            <span className="text-xs text-[#444]">Web3 Ticketing Protocol · Ethereum</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#444]">
            <a href="https://github.com/RWA-ID/boleto-api" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316] transition-colors">GitHub</a>
            <Link href="/create-event" className="hover:text-[#f97316] transition-colors">{t.nav.createEvent}</Link>
            <Link href="/api-keys" className="hover:text-[#f97316] transition-colors">{t.nav.apiKeys}</Link>
            <a href="#contact" className="hover:text-[#f97316] transition-colors">{t.contact.title}</a>
          </div>
          <div className="text-xs text-[#333] font-mono">
            Contracts verified on Etherscan &amp; Basescan
          </div>
        </div>
      </footer>

    </main>
  )
}

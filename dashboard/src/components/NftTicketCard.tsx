'use client'

const CSS = `
@keyframes btkShimmer {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes btkPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.btk-card {
  width: 480px;
  max-width: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: #111;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 40px 80px rgba(0,0,0,0.8),
    0 0 120px rgba(255,60,60,0.08);
  position: relative;
  font-family: 'Inter', sans-serif;
}
.btk-event-image {
  width: 100%; height: 240px;
  position: relative; overflow: hidden; background: #000;
}
.btk-event-image img { width: 100%; height: 100%; object-fit: cover; }
.btk-event-image svg { width: 100%; height: 100%; }
.btk-holo {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, transparent 0%, rgba(255,60,60,0.08) 25%, transparent 50%, rgba(100,60,255,0.06) 75%, transparent 100%);
  background-size: 400% 400%;
  animation: btkShimmer 6s ease infinite;
}
.btk-ens-badge {
  position: absolute; top: 14px; left: 14px;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 100px;
  padding: 5px 12px; display: flex; align-items: center; gap: 7px;
}
.btk-ens-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4ade80; box-shadow: 0 0 8px #4ade80;
  animation: btkPulse 2s ease-in-out infinite;
}
.btk-ens-badge > span {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: rgba(255,255,255,0.85); letter-spacing: 0.02em;
}
.btk-seat-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 28px 18px 18px;
  background: linear-gradient(transparent, rgba(0,0,0,0.92));
  display: flex; align-items: flex-end; justify-content: space-between;
}
.btk-seat-info h2 {
  font-family: 'Bebas Neue', sans-serif; font-size: 34px;
  color: #fff; letter-spacing: 0.04em; line-height: 1; margin: 0;
}
.btk-seat-info p {
  font-size: 10px; color: rgba(255,255,255,0.5); font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px;
}
.btk-section-badge {
  background: linear-gradient(135deg, #ff3c3c, #ff6b6b);
  border-radius: 8px; padding: 7px 14px; text-align: center;
}
.btk-section-label {
  font-size: 8px; color: rgba(255,255,255,0.7); text-transform: uppercase;
  letter-spacing: 0.1em; font-weight: 600; display: block;
}
.btk-section-name {
  font-family: 'Bebas Neue', sans-serif; font-size: 17px;
  color: #fff; letter-spacing: 0.05em; line-height: 1.2;
}
.btk-divider {
  position: relative; height: 1px;
  background: rgba(255,255,255,0.06); margin: 0 18px;
}
.btk-divider::before, .btk-divider::after {
  content: ''; position: absolute; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; border-radius: 50%;
  background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08);
}
.btk-divider::before { left: -26px; }
.btk-divider::after  { right: -26px; }
.btk-body { padding: 18px 22px 22px; }
.btk-ens-block {
  background: linear-gradient(135deg, rgba(255,60,60,0.06), rgba(100,60,255,0.04));
  border: 1px solid rgba(255,60,60,0.15);
  border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;
}
.btk-ens-label {
  font-size: 8px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 5px;
}
.btk-ens-full {
  font-family: 'Space Mono', monospace; font-size: 12px;
  color: #fff; letter-spacing: -0.01em; line-height: 1.4; word-break: break-all;
}
.btk-ens-dim  { color: rgba(255,255,255,0.4); }
.btk-ens-evt  { color: rgba(255,255,255,0.7); }
.btk-ens-tld  { color: rgba(255,60,60,0.9); }
.btk-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;
}
.btk-cell {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 10px 12px;
}
.btk-cell-label {
  font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  color: rgba(255,255,255,0.3); margin-bottom: 4px;
}
.btk-cell-value {
  font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); line-height: 1.25;
}
.btk-cell-value.mono { font-family: 'Space Mono', monospace; font-size: 11px; }
.btk-attrs {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
}
.btk-attr {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 6px; padding: 4px 8px;
}
.btk-attr-key  { font-size: 8px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; }
.btk-attr-val  { font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 500; }
.btk-footer {
  display: flex; align-items: center; gap: 14px;
  padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06);
}
.btk-qr {
  flex-shrink: 0; width: 56px; height: 56px; background: #fff;
  border-radius: 7px; padding: 5px; display: flex; align-items: center; justify-content: center;
}
.btk-brand { flex: 1; }
.btk-brand-name {
  font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 0.08em;
  background: linear-gradient(135deg, #ff3c3c, #ff8c8c);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; line-height: 1; margin-bottom: 3px;
}
.btk-brand-sub {
  font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 0.05em; font-weight: 500;
}
.btk-verified {
  margin-left: auto; display: flex; align-items: center; gap: 5px;
  background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
  border-radius: 100px; padding: 4px 9px;
}
.btk-verified span {
  font-size: 8px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #4ade80;
}
`

// Minimal static QR pattern
function QrPlaceholder() {
  return (
    <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" fill="#000" style={{ width: 44, height: 44 }}>
      <rect x="1" y="1" width="13" height="13" rx="1.5" fill="#000"/><rect x="2.5" y="2.5" width="10" height="10" rx="0.5" fill="#fff"/><rect x="4" y="4" width="7" height="7" rx="0.5" fill="#000"/>
      <rect x="30" y="1" width="13" height="13" rx="1.5" fill="#000"/><rect x="31.5" y="2.5" width="10" height="10" rx="0.5" fill="#fff"/><rect x="33" y="4" width="7" height="7" rx="0.5" fill="#000"/>
      <rect x="1" y="30" width="13" height="13" rx="1.5" fill="#000"/><rect x="2.5" y="31.5" width="10" height="10" rx="0.5" fill="#fff"/><rect x="4" y="33" width="7" height="7" rx="0.5" fill="#000"/>
      <rect x="16" y="1" width="2.5" height="2.5" fill="#000"/><rect x="19.5" y="1" width="2.5" height="2.5" fill="#000"/>
      <rect x="16" y="4.5" width="2.5" height="2.5" fill="#000"/><rect x="22" y="4.5" width="2.5" height="2.5" fill="#000"/>
      <rect x="19.5" y="8" width="2.5" height="2.5" fill="#000"/><rect x="16" y="11.5" width="2.5" height="2.5" fill="#000"/>
      <rect x="1" y="16" width="2.5" height="2.5" fill="#000"/><rect x="4.5" y="16" width="2.5" height="2.5" fill="#000"/>
      <rect x="8" y="16" width="2.5" height="2.5" fill="#000"/><rect x="16" y="16" width="2.5" height="2.5" fill="#000"/>
      <rect x="19.5" y="16" width="2.5" height="2.5" fill="#000"/><rect x="26" y="16" width="2.5" height="2.5" fill="#000"/>
      <rect x="33" y="16" width="2.5" height="2.5" fill="#000"/><rect x="40" y="16" width="2.5" height="2.5" fill="#000"/>
      <rect x="1" y="19.5" width="2.5" height="2.5" fill="#000"/><rect x="8" y="19.5" width="2.5" height="2.5" fill="#000"/>
      <rect x="19.5" y="19.5" width="2.5" height="2.5" fill="#000"/><rect x="30" y="19.5" width="2.5" height="2.5" fill="#000"/>
      <rect x="16" y="22" width="2.5" height="2.5" fill="#000"/><rect x="22" y="22" width="2.5" height="2.5" fill="#000"/>
      <rect x="26" y="22" width="2.5" height="2.5" fill="#000"/><rect x="33" y="22" width="2.5" height="2.5" fill="#000"/>
      <rect x="16" y="26" width="2.5" height="2.5" fill="#000"/><rect x="19.5" y="26" width="2.5" height="2.5" fill="#000"/>
      <rect x="22" y="30" width="2.5" height="2.5" fill="#000"/><rect x="30" y="30" width="2.5" height="2.5" fill="#000"/>
      <rect x="40" y="30" width="2.5" height="2.5" fill="#000"/><rect x="16" y="33" width="2.5" height="2.5" fill="#000"/>
      <rect x="26" y="33" width="2.5" height="2.5" fill="#000"/><rect x="40" y="33" width="2.5" height="2.5" fill="#000"/>
      <rect x="19.5" y="36.5" width="2.5" height="2.5" fill="#000"/><rect x="30" y="36.5" width="2.5" height="2.5" fill="#000"/>
      <rect x="36.5" y="36.5" width="2.5" height="2.5" fill="#000"/><rect x="16" y="40" width="2.5" height="2.5" fill="#000"/>
      <rect x="22" y="40" width="2.5" height="2.5" fill="#000"/><rect x="33" y="40" width="2.5" height="2.5" fill="#000"/>
    </svg>
  )
}

// Concert scene placeholder SVG (used when no imageUri provided)
function ConcertBg() {
  return (
    <svg viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="cSp1" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#ff2200" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#000" stopOpacity="1"/>
        </radialGradient>
        <radialGradient id="cSp2" cx="25%" cy="90%" r="50%">
          <stop offset="0%" stopColor="#ff6600" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
        <filter id="cBlur"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="480" height="240" fill="#050000"/>
      <rect width="480" height="240" fill="url(#cSp1)"/>
      <rect width="480" height="240" fill="url(#cSp2)"/>
      <rect x="80" y="25" width="320" height="7" fill="#1a1a1a" rx="2"/>
      <rect x="100" y="32" width="5" height="85" fill="#151515"/>
      <rect x="375" y="32" width="5" height="85" fill="#151515"/>
      <circle cx="103" cy="36" r="5" fill="#ff6600" opacity="0.9"/>
      <circle cx="240" cy="32" r="6" fill="#ffffff" opacity="0.7"/>
      <circle cx="377" cy="36" r="5" fill="#ff4400" opacity="0.9"/>
      <polygon points="103,38 88,155 118,155" fill="#ff4400" opacity="0.15" filter="url(#cBlur)"/>
      <polygon points="377,38 362,155 392,155" fill="#ff0066" opacity="0.15" filter="url(#cBlur)"/>
      <rect x="60" y="150" width="360" height="15" fill="#1a0500" rx="2"/>
      <ellipse cx="240" cy="153" rx="140" ry="10" fill="#ff3300" opacity="0.2" filter="url(#cBlur)"/>
    </svg>
  )
}

interface NftTicketCardProps {
  seatNumber:    string
  eventName:     string
  ensName:       string
  imageUri?:     string
  csvAttributes: Record<string, string>
}

export default function NftTicketCard({ seatNumber, eventName, ensName, imageUri, csvAttributes }: NftTicketCardProps) {
  const ensParts = ensName.split('.')
  const subdomain = ensParts[0] || ''
  const [artist, event] = subdomain.includes('-')
    ? [subdomain.substring(0, subdomain.indexOf('-')) + '-', subdomain.substring(subdomain.indexOf('-') + 1) + '.']
    : [subdomain + '.', '']
  const tld = ensParts.slice(1).join('.')

  // Extract useful CSV attributes for the grid, skip seat_number and price_usdc
  const skipKeys = new Set(['seat_number', 'price_usdc', 'seat'])
  const extraAttrs = Object.entries(csvAttributes).filter(([k]) => !skipKeys.has(k)).slice(0, 6)

  const section  = csvAttributes['section'] || csvAttributes['Section'] || ''
  const row      = csvAttributes['row']     || csvAttributes['Row']     || ''
  const priceUsd = csvAttributes['price_usdc'] ? `$${csvAttributes['price_usdc']} USDC` : '—'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="btk-card">

        {/* ── IMAGE ── */}
        <div className="btk-event-image">
          {imageUri
            ? <img src={imageUri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${imageUri.slice(7)}` : imageUri} alt={eventName} />
            : <ConcertBg />
          }
          <div className="btk-holo"/>
          <div className="btk-ens-badge">
            <div className="btk-ens-dot"/>
            <span>ENS VERIFIED</span>
          </div>
          <div className="btk-seat-overlay">
            <div className="btk-seat-info">
              <h2>SEAT {seatNumber.toUpperCase()}</h2>
              {(row || section) && <p>{section && `${section} · `}Row {row || '—'}</p>}
            </div>
            {section && (
              <div className="btk-section-badge">
                <span className="btk-section-label">Section</span>
                <span className="btk-section-name">{section.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="btk-divider"/>

        {/* ── BODY ── */}
        <div className="btk-body">
          <div className="btk-ens-block">
            <div className="btk-ens-label">On-Chain Identity</div>
            <div className="btk-ens-full">
              <span className="btk-ens-dim">{artist}</span>
              <span className="btk-ens-evt">{event}</span>
              <span className="btk-ens-tld">{tld}</span>
            </div>
          </div>

          <div className="btk-grid">
            <div className="btk-cell">
              <div className="btk-cell-label">Event</div>
              <div className="btk-cell-value">{eventName || '—'}</div>
            </div>
            <div className="btk-cell">
              <div className="btk-cell-label">Seat</div>
              <div className="btk-cell-value mono">{seatNumber || '—'}</div>
            </div>
            <div className="btk-cell">
              <div className="btk-cell-label">Price</div>
              <div className="btk-cell-value">{priceUsd}</div>
            </div>
            <div className="btk-cell">
              <div className="btk-cell-label">Contract</div>
              <div className="btk-cell-value mono" style={{ fontSize: 10 }}>Ethereum L1</div>
            </div>
          </div>

          {extraAttrs.length > 0 && (
            <div className="btk-attrs">
              {extraAttrs.map(([key, val]) => (
                <div key={key} className="btk-attr">
                  <div className="btk-attr-key">{key}</div>
                  <div className="btk-attr-val">{val || '—'}</div>
                </div>
              ))}
            </div>
          )}

          <div className="btk-footer">
            <div className="btk-qr"><QrPlaceholder /></div>
            <div className="btk-brand">
              <div className="btk-brand-name">boleto.eth</div>
              <div className="btk-brand-sub">Web3 Ticketing Protocol · Ethereum</div>
            </div>
            <div className="btk-verified">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 8 6.5 11.5 13 5"/>
              </svg>
              <span>On-Chain</span>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

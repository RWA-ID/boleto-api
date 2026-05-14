// Redesigned NftTicketCard — printed festival pass with on-chain proof.
// Same prop surface as the old NftTicketCard.

function CredentialQR({ size = 84, dark = '#0B1220' }: { size?: number; dark?: string }) {
  const cells = [
    '1110101110111', '1000100010001', '1011101010101',
    '1011111010011', '1000001110101', '0011011001110',
    '1110100010101', '0010110110011', '1011000101101',
    '0001110010001', '1110111101011', '0001000100001',
    '1010111011101',
  ]
  const n = cells.length
  const cell = size / n
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <rect width={size} height={size} fill="#fff" rx="2" />
      {cells.map((row, y) =>
        row.split('').map((c, x) =>
          c === '1' ? (
            <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.4} height={cell + 0.4} fill={dark} />
          ) : null
        )
      )}
    </svg>
  )
}

export interface CredentialTicketProps {
  seatNumber?: string
  section?: string
  row?: string
  eventName?: string
  venue?: string
  date?: string
  ensName?: string
  priceUsdc?: string
  tokenId?: string
  contract?: string
  tier?: string
  serif?: boolean
  emboss?: boolean
}

export function CredentialTicket({
  seatNumber = 'A12',
  section = 'VIP',
  row = 'A',
  eventName = 'Bad Bunny — Most Wanted Tour',
  venue = 'Foro Sol · Mexico City',
  date = 'SAT · 14 MAR 2026 · 21:00 CST',
  ensName = 'seat-a12.badbunny-cdmx26.boleto.eth',
  priceUsdc = '180.00',
  tokenId = '#01438',
  contract = '0x71C7…39e2',
  tier = 'A',
  serif = true,
  emboss = true,
}: CredentialTicketProps) {
  const [prefix, ...rest] = ensName.split('.')
  const restJoined = rest.join('.')
  const tld = '.boleto.eth'
  const middle = restJoined.replace(/\.boleto\.eth$/, '')
  return (
    <div
      style={{
        width: 460,
        background: '#FBFBF8',
        border: '1px solid #E4E2D9',
        borderRadius: 14,
        boxShadow:
          '0 0 0 1px rgba(11,18,32,0.04), 0 1px 2px rgba(11,18,32,0.04), 0 24px 60px -20px rgba(11,18,32,0.18)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink-900)',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'var(--accent-500)' }} />

      <div style={{ padding: '22px 24px 18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 6 }}>Admit One · General Pass</div>
          <div style={{
            fontFamily: serif ? 'var(--font-display)' : 'var(--font-sans)',
            fontSize: 26, lineHeight: 1.1, fontWeight: serif ? 400 : 600,
            letterSpacing: serif ? '-0.015em' : '-0.025em',
            color: 'var(--ink-900)',
            maxWidth: 280,
          }}>{eventName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Tier</div>
          <div style={{
            width: 42, height: 42, marginLeft: 'auto',
            border: '1.5px solid var(--ink-900)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
          }}>{tier}</div>
        </div>
      </div>

      <div style={{ padding: '0 28px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Venue</div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{venue}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>Date · Doors</div>
          <div style={{ fontSize: 13.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{date}</div>
        </div>
      </div>

      <div style={{
        margin: '4px 24px 4px',
        padding: '16px 20px',
        background: '#FFFFFF',
        border: '1px solid #ECEAE0',
        borderRadius: 10,
        display: 'flex', alignItems: 'center',
      }}>
        {([
          ['Section', section],
          ['Row', row],
          ['Seat', seatNumber],
          ['Price', `$${priceUsdc} USDC`],
        ] as const).map(([label, value], i) => (
          <div key={label} style={{
            flex: 1, padding: '0 4px',
            borderLeft: i > 0 ? '1px dashed var(--ink-150)' : 'none',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{
              fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
              fontFamily: i === 2 ? 'var(--font-mono)' : 'inherit',
              color: 'var(--ink-900)',
            }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', height: 22, margin: '14px 0 6px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'var(--paper)', border: '1px solid #E4E2D9' }} />
        <div style={{ position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'var(--paper)', border: '1px solid #E4E2D9' }} />
        <div style={{ flex: 1, height: 0, margin: '0 18px', borderTop: '1.5px dashed #D8D5C8' }} />
      </div>

      <div style={{ padding: '8px 24px 22px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 6 }}>
            On-chain Identity · ENS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.45, wordBreak: 'break-all' }}>
            <span style={{ color: 'var(--ink-400)' }}>{prefix}.</span>
            <span style={{ color: 'var(--ink-700)' }}>{middle}</span>
            <span style={{ color: 'var(--accent-600)', fontWeight: 600 }}>{tld}</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--ink-500)' }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 2 }}>Token</div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{tokenId}</span>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 2 }}>Contract</div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{contract}</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <CredentialQR size={84} />
          {emboss && (
            <div style={{
              position: 'absolute', top: -8, right: -8,
              padding: '2px 6px',
              background: 'var(--accent-500)', color: '#fff',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              borderRadius: 3, textTransform: 'uppercase',
            }}>Verified</div>
          )}
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #ECEAE0',
        padding: '12px 24px 12px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#FAF8EE',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink-900)' }}>
          boleto<span style={{ color: 'var(--accent-600)' }}>.eth</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-400)', letterSpacing: '0.04em' }}>
          Issued under EIP-712 · ERC-2981 · Ethereum L1
        </div>
      </div>
    </div>
  )
}

export default CredentialTicket

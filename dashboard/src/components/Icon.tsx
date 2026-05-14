import { CSSProperties, ReactNode } from 'react'

type IconName =
  | 'contract' | 'api' | 'dashboard' | 'shield' | 'lock' | 'receipt'
  | 'ticket' | 'qr' | 'key' | 'graph' | 'layers' | 'globe' | 'search'
  | 'plus' | 'check' | 'arrow' | 'arrowDown' | 'external' | 'copy'
  | 'chevron' | 'chevronDown' | 'menu' | 'close' | 'building' | 'code'
  | 'webhook' | 'upload' | 'scan' | 'bolt' | 'cog' | 'bookOpen'

const ICON_PATHS: Record<IconName, ReactNode> = {
  contract: (<><path d="M5 3.5h9l4.5 4.5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5V8h4.5" /><path d="M7.5 12.5h9M7.5 16h6" /></>),
  api: (<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10v4M11 10v4M15 10l2 2-2 2M19.5 9.5l1 2.5-1 2.5" /></>),
  dashboard: (<><rect x="3" y="3.5" width="18" height="17" rx="2" /><path d="M3 8.5h18" /><path d="M8 13h3v4H8zM13 11h4v6h-4z" /></>),
  shield: (<><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  receipt: (<><path d="M6 3v18l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V3l-2 1.5L14 3l-2 1.5L10 3 8 4.5Z" /><path d="M9 9h6M9 12.5h6M9 16h4" /></>),
  ticket: (<><path d="M3 8.5a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 8.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17v-2a2.5 2.5 0 0 0 0-5Z" /><path d="M14 7v10" strokeDasharray="2 2" /></>),
  qr: (<><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><path d="M13.5 13.5h3v3h-3zM18 18v3M21 16.5h-3" /></>),
  key: (<><circle cx="8" cy="14" r="4" /><path d="m11 11 9-9M16 6l3 3M14 8l3 3" /></>),
  graph: (<><path d="M4 19h16" /><path d="m5 15 4-5 4 3 6-7" /><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="6"  r="1.5" fill="currentColor" stroke="none"/></>),
  layers: (<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  check: (<><path d="m4 12 5 5L20 6" /></>),
  arrow: (<><path d="M5 12h14M13 6l6 6-6 6" /></>),
  arrowDown: (<><path d="M12 5v14M6 13l6 6 6-6" /></>),
  external: (<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>),
  copy: (<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>),
  chevron: (<><path d="m9 6 6 6-6 6" /></>),
  chevronDown: (<><path d="m6 9 6 6 6-6" /></>),
  menu: (<><path d="M4 6h16M4 12h16M4 18h16" /></>),
  close: (<><path d="M6 6l12 12M18 6 6 18" /></>),
  building: (<><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M8 8h3M8 12h3M8 16h3" /></>),
  code: (<><path d="m9 8-5 4 5 4M15 8l5 4-5 4M13 6l-2 12" /></>),
  webhook: (<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="19" r="2.5" /><path d="M7.5 8 12 16.5M16.5 8 12 16.5" /></>),
  upload: (<><path d="M4 16v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /><path d="M12 4v12M7 9l5-5 5 5" /></>),
  scan: (<><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M16 20h3a1 1 0 0 0 1-1v-3" /><path d="M4 12h16" /></>),
  bolt: (<><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /></>),
  cog: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
  bookOpen: (<><path d="M3 5a2 2 0 0 1 2-2h5v17H5a2 2 0 0 1-2-2V5Z" /><path d="M21 5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2V5Z" /></>),
}

export function Icon({
  name, size = 18, stroke = 1.5, style,
}: { name: IconName; size?: number; stroke?: number; style?: CSSProperties }) {
  const path = ICON_PATHS[name]
  if (!path) return null
  return (
    <svg
      style={{ flexShrink: 0, ...style }}
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

export function PartnerSlot({ children = 'PARTNER' }: { children?: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '12px 18px',
      border: '1px dashed var(--ink-150)',
      borderRadius: 8,
      color: 'var(--ink-300)',
      fontSize: 12, fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: 'transparent',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ink-150)', flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  )
}

/**
 * NexusBridge design tokens — single source of truth.
 * Mirrored into tailwind.config.js (Tailwind can't import TS at build time here,
 * so keep the two in sync).
 */
export const tokens = {
  colors: {
    canvas: '#090D16',
    panel: '#0F172A',
    elevated: '#1E293B',
    subtle: 'rgba(30,41,59,0.5)',
    borderSubtle: '#1E293B',
    borderStrong: '#334155',
    borderAccent: 'rgba(6,182,212,0.4)',
    primary: '#06B6D4', // cyan — active gateway
    primaryBright: '#22D3EE',
    secondary: '#8B5CF6', // violet — middleware / policy
    secondaryBright: '#C4B5FD',
    tertiary: '#10B981', // emerald — healthy / 200 OK
    tertiaryBright: '#34D399',
    warning: '#F59E0B', // amber — 4xx / rate-limit
    warningBright: '#FBBF24',
    critical: '#EF4444', // rose — 5xx / fault
    criticalBright: '#F87171',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDim: '#64748B',
  },
  radius: {
    control: '4px',
    card: '8px',
    modal: '12px',
    pill: '9999px',
  },
  glow: {
    cyan: '0 0 16px -2px rgba(6,182,212,0.25)',
    emerald: '0 0 16px -2px rgba(16,185,129,0.25)',
    rose: '0 0 16px -2px rgba(239,68,68,0.3)',
    amber: '0 0 16px -2px rgba(245,158,11,0.3)',
    violet: '0 0 16px -2px rgba(139,92,246,0.3)',
  },
  fonts: {
    sans: "'Geist', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const

export type Tone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

export const toneHex: Record<Tone, string> = {
  cyan: tokens.colors.primary,
  violet: tokens.colors.secondary,
  emerald: tokens.colors.tertiary,
  amber: tokens.colors.warning,
  rose: tokens.colors.critical,
  slate: '#94A3B8',
}

/** Health classification shared across screens */
export function healthTone(pct: number): Tone {
  if (pct >= 99.5) return 'emerald'
  if (pct >= 97) return 'amber'
  return 'rose'
}

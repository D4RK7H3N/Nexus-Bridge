import type { Tone } from '../../theme/tokens'

/** Static class maps per tone — full strings so Tailwind's JIT picks them up. */
export const toneText: Record<Tone, string> = {
  cyan: 'text-primary-bright',
  violet: 'text-secondary-bright',
  emerald: 'text-tertiary-bright',
  amber: 'text-warn-bright',
  rose: 'text-crit-bright',
  slate: 'text-muted',
}

export const toneBgSoft: Record<Tone, string> = {
  cyan: 'bg-primary/10',
  violet: 'bg-secondary/10',
  emerald: 'bg-tertiary/10',
  amber: 'bg-warn/10',
  rose: 'bg-crit/10',
  slate: 'bg-subtle',
}

export const toneBorderSoft: Record<Tone, string> = {
  cyan: 'border-primary/25',
  violet: 'border-secondary/25',
  emerald: 'border-tertiary/25',
  amber: 'border-warn/25',
  rose: 'border-crit/25',
  slate: 'border-border-subtle',
}

export const toneDot: Record<Tone, string> = {
  cyan: 'bg-primary-bright',
  violet: 'bg-secondary-bright',
  emerald: 'bg-tertiary-bright',
  amber: 'bg-warn-bright',
  rose: 'bg-crit-bright',
  slate: 'bg-muted',
}

export const toneBar: Record<Tone, string> = {
  cyan: 'bg-primary',
  violet: 'bg-secondary',
  emerald: 'bg-tertiary',
  amber: 'bg-warn',
  rose: 'bg-crit',
  slate: 'bg-muted',
}

export const toneGlow: Record<Tone, string> = {
  cyan: 'shadow-glow-cyan',
  violet: 'shadow-glow-violet',
  emerald: 'shadow-glow-emerald',
  amber: 'shadow-glow-amber',
  rose: 'shadow-glow-rose',
  slate: '',
}

export const toneStroke: Record<Tone, string> = {
  cyan: '#06B6D4',
  violet: '#8B5CF6',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#EF4444',
  slate: '#94A3B8',
}

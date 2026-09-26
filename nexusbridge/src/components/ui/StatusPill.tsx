import type { Tone } from '../../theme/tokens'
import { toneBgSoft, toneBorderSoft, toneDot, toneText } from './tone'
import { cn } from '../../lib/cn'

interface StatusPillProps {
  label: string
  tone?: Tone
  pulse?: boolean
  className?: string
}

/** Pill with pulsating 6px status dot. */
export function StatusPill({ label, tone = 'emerald', pulse = true, className }: StatusPillProps) {
  return (
    <span className={cn('pill border', toneBgSoft[tone], toneBorderSoft[tone], toneText[tone], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', toneDot[tone], pulse && 'animate-pulse-dot')} />
      {label}
    </span>
  )
}

import type { Tone } from '../../theme/tokens'
import { toneBar } from './tone'
import { cn } from '../../lib/cn'

/** Thin animated bar — width transitions as the store ticks. */
export function ProgressBar({
  value,
  max = 100,
  tone = 'cyan',
  className,
  height = 'h-1.5',
}: {
  value: number
  max?: number
  tone?: Tone
  className?: string
  height?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-elevated', height, className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', toneBar[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

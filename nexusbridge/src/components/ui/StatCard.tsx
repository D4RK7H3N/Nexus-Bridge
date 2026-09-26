import type { ReactNode } from 'react'
import { Card } from './Card'
import { Sparkline } from './Sparkline'
import type { Tone } from '../../theme/tokens'
import { toneBar, toneBgSoft, toneText } from './tone'
import { cn } from '../../lib/cn'

/** Metric micro-card: uppercase label, large Geist readout, optional sparkline / bar / icon. */
export function StatCard({
  label,
  value,
  unit,
  sub,
  subTone = 'emerald',
  icon,
  spark,
  sparkTone = 'cyan',
  className,
  onClick,
}: {
  label: string
  value: string
  unit?: string
  sub?: ReactNode
  subTone?: Tone
  icon?: ReactNode
  spark?: number[]
  sparkTone?: Tone
  className?: string
  onClick?: () => void
}) {
  return (
    <Card className={cn(onClick && 'cursor-pointer', className)} onClick={onClick}>
      <div className="flex items-start justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className={cn('rounded-control p-1', toneBgSoft[sparkTone], toneText[sparkTone])}>{icon}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-8 tracking-tight-heading text-ink tnum">{value}</span>
        {unit && <span className="font-mono text-xs text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1 flex items-center gap-1.5 text-xs">{sub}</div>}
      {spark && (
        <div className="mt-2">
          <Sparkline data={spark} tone={sparkTone} width={240} height={34} />
        </div>
      )}
    </Card>
  )
}

/** Compact stat with mini progress bar (Endpoints stat row). */
export function MiniStat({
  label,
  value,
  delta,
  deltaTone = 'emerald',
  barValue,
  barTone = 'cyan',
}: {
  label: string
  value: string
  delta?: string
  deltaTone?: Tone
  barValue: number
  barTone?: Tone
}) {
  return (
    <Card padded className="min-w-0">
      <span className="stat-label">{label}</span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold text-ink tnum">{value}</span>
        {delta && <span className={cn('font-mono text-[10px]', toneText[deltaTone])}>{delta}</span>}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', toneBar[barTone])}
          style={{ width: `${Math.min(100, barValue)}%` }}
        />
      </div>
    </Card>
  )
}

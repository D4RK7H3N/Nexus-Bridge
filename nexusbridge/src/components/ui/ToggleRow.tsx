import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Switch({ on, onChange, disabled }: { on: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      data-on={on}
      onClick={onChange}
      className={cn('switch', disabled && 'cursor-not-allowed opacity-60')}
    >
      <span className="switch-thumb" />
    </button>
  )
}

/** Switchboard row: icon tile + label/description + switch or status badge. */
export function ToggleRow({
  icon,
  iconTone = 'cyan',
  title,
  subtitle,
  on,
  onToggle,
  locked,
  badge,
  badgeTone = 'emerald',
}: {
  icon: ReactNode
  iconTone?: 'cyan' | 'emerald' | 'violet'
  title: string
  subtitle: string
  on?: boolean
  onToggle?: () => void
  locked?: boolean
  badge?: string
  badgeTone?: 'emerald' | 'amber' | 'rose'
}) {
  const tile =
    iconTone === 'cyan'
      ? 'bg-primary/15 text-primary-bright'
      : iconTone === 'emerald'
        ? 'bg-tertiary/15 text-tertiary-bright'
        : 'bg-secondary/15 text-secondary-bright'
  const badgeCls =
    badgeTone === 'emerald'
      ? 'bg-tertiary/15 text-tertiary-bright'
      : badgeTone === 'amber'
        ? 'bg-warn/15 text-warn-bright'
        : 'bg-crit/15 text-crit-bright'
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-control', tile)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-5 text-ink">{title}</p>
        <p className="truncate text-xs text-dim">{subtitle}</p>
      </div>
      {locked && badge ? (
        <span className={cn('pill', badgeCls)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {badge}
        </span>
      ) : (
        <Switch on={!!on} onChange={onToggle} disabled={locked} />
      )}
    </div>
  )
}

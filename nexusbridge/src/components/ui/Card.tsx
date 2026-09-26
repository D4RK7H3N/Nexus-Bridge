import type { HTMLAttributes, ReactNode } from 'react'
import { toneBar } from './tone'
import type { Tone } from '../../theme/tokens'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** 2px colored top cap (DAG node anatomy) */
  capTone?: Tone
  glowTone?: Tone
  padded?: boolean
}

export function Card({ children, className, capTone, glowTone, padded = true, ...rest }: CardProps) {
  const glow =
    glowTone === 'cyan'
      ? 'shadow-glow-cyan'
      : glowTone === 'emerald'
        ? 'shadow-glow-emerald'
        : glowTone === 'amber'
          ? 'shadow-glow-amber'
          : glowTone === 'rose'
            ? 'shadow-glow-rose'
            : glowTone === 'violet'
              ? 'shadow-glow-violet'
              : ''
  return (
    <div className={cn('card card-hover relative overflow-hidden', glow, className)} {...rest}>
      {capTone && <span className={cn('absolute inset-x-0 top-0 h-0.5', toneBar[capTone])} />}
      <div className={cn(padded && 'p-4')}>{children}</div>
    </div>
  )
}

/** Small uppercase mono section heading used across all screens. */
export function SectionHeader({
  icon,
  title,
  right,
  className,
}: {
  icon?: ReactNode
  title: string
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h2 className="section-label">
        {icon}
        {title}
      </h2>
      {right}
    </div>
  )
}

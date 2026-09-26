import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Breakpoint } from '../../hooks/useBreakpoint'
import { cn } from '../../lib/cn'

interface InspectorDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  bp: Breakpoint
}

/**
 * Desktop (≥1280px): persistent 420px slide-over inspector on the right.
 * Tablet / mobile: centered modal sheet overlay.
 */
export function InspectorDrawer({ open, onClose, title, subtitle, children, bp }: InspectorDrawerProps) {
  if (!open) return null

  const isSlideOver = bp === 'desktop'

  return (
    <>
      <div
        className={cn('fixed inset-0 z-50 bg-canvas/70 backdrop-blur-sm', isSlideOver ? 'bg-canvas/40' : '')}
        onClick={onClose}
      />
      <aside
        className={cn(
          'card-elevated fixed z-50 flex flex-col overflow-y-auto border-border-strong',
          isSlideOver
            ? 'bottom-0 right-0 top-0 w-[420px] animate-slide-in-right border-l'
            : 'inset-x-3 bottom-3 top-16 animate-slide-up rounded-modal border md:inset-x-0 md:mx-auto md:w-[420px]',
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border-subtle bg-elevated/95 p-4 backdrop-blur-md">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 font-mono text-[11px] text-dim">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-control border border-border-subtle text-muted transition-colors hover:bg-subtle hover:text-ink"
            aria-label="Close inspector"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 space-y-4 p-4">{children}</div>
      </aside>
    </>
  )
}

/** Key/value row used inside the inspector. */
export function InspectRow({ k, v, tone }: { k: string; v: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/60 py-2 last:border-0">
      <span className="font-mono text-[11px] uppercase tracking-wider text-dim">{k}</span>
      <span className={cn('font-mono text-xs tnum', tone ?? 'text-ink')}>{v}</span>
    </div>
  )
}

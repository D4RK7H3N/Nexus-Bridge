import { useState } from 'react'
import { ChevronDown, Hexagon } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import type { Breakpoint } from '../../hooks/useBreakpoint'
import { BackendConfigModal } from './BackendConfigModal'
import { useConfig } from '../../store/configStore'
import { cn } from '../../lib/cn'

const SUBTITLES: Record<string, string> = {
  '/traffic': 'Traffic Bridge',
  '/endpoints': 'Endpoints',
  '/mesh': 'Scaler & Mesh',
  '/gov': 'Governance',
}

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  connected: { dot: 'bg-tertiary-bright shadow-glow-emerald', label: 'Connected' },
  checking: { dot: 'bg-warn-bright animate-pulse-dot', label: 'Probing' },
  unreachable: { dot: 'bg-crit-bright shadow-glow-rose', label: 'Offline' },
}

export function TopBar({ bp }: { bp: Breakpoint }) {
  const { pathname } = useLocation()
  const [configOpen, setConfigOpen] = useState(false)
  const host = useConfig((s) => s.host())
  const status = useConfig((s) => s.status)
  const isGateway = useConfig((s) => s.isGateway)
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.checking
  const statusLabel = status === 'connected' && isGateway ? 'Gateway' : statusStyle.label
  const sub =
    Object.entries(SUBTITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Traffic Bridge'

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border-subtle bg-panel/75 px-4 backdrop-blur-md">
      {/* logo */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-control bg-secondary/20 text-secondary-bright">
          <Hexagon size={18} strokeWidth={2.2} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-1 w-1 rounded-full bg-primary-bright shadow-glow-cyan" />
          </span>
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight-heading text-ink">
            NexusBridge
            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-tertiary-bright align-middle shadow-glow-emerald" />
          </p>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-primary-bright">
            {sub}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* backend / env selector */}
      <button
        onClick={() => setConfigOpen(true)}
        title="Configure backend connection"
        className="flex h-8 items-center gap-2 rounded-full border border-border-subtle bg-elevated/60 px-3 transition-colors hover:border-border-strong"
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
        <span className="max-w-[140px] truncate font-mono text-[11px] text-muted sm:max-w-none">
          {host}&nbsp;·&nbsp;<span className={cn('font-semibold', isGateway && status === 'connected' ? 'text-primary-bright' : 'text-ink')}>{statusLabel}</span>
        </span>
        <ChevronDown size={12} className="text-dim" />
      </button>
      <BackendConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />

      {/* avatar */}
      <span className="relative">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border border-border-accent',
            'bg-gradient-to-br from-secondary/60 via-elevated to-primary/40 font-mono text-[10px] font-semibold text-ink',
          )}
        >
          NØ
        </span>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-panel bg-tertiary-bright" />
      </span>
    </header>
  )
}

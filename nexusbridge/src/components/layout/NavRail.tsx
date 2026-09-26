import { NavLink } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { TABS } from './tabs'
import { useTelemetry } from '../../store/telemetry'
import { cn } from '../../lib/cn'

/** Desktop (≥1280px) persistent 240px left navigation rail. */
export function NavRail() {
  const throughput = useTelemetry((s) => s.throughputReq)
  const meshUptime = useTelemetry((s) => s.meshUptime)

  return (
    <aside className="fixed bottom-0 left-0 top-14 z-30 flex w-60 flex-col border-r border-border-subtle bg-panel/75 backdrop-blur-md">
      <p className="px-4 pb-2 pt-5 font-mono text-[10px] font-semibold uppercase tracking-widest text-dim">
        Control Plane
      </p>
      <nav className="flex flex-col gap-1 px-3">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-3 rounded-control border px-3 text-[13px] font-medium transition-all',
                isActive
                  ? 'border-border-accent bg-primary/10 text-primary-bright shadow-glow-cyan'
                  : 'border-transparent text-muted hover:bg-subtle hover:text-ink',
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 p-4">
        <div className="card p-3">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-tertiary-bright" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
              Gateway Live
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between font-mono text-xs">
            <span className="text-dim">req/s</span>
            <span className="text-primary-bright tnum">{throughput}k</span>
          </div>
          <div className="mt-1 flex items-end justify-between font-mono text-xs">
            <span className="text-dim">uptime</span>
            <span className="text-tertiary-bright tnum">{meshUptime}%</span>
          </div>
        </div>
        <p className="px-1 font-mono text-[9px] uppercase tracking-widest text-dim">
          NexusBridge v2.4 · mesh-v2.4
        </p>
      </div>
    </aside>
  )
}

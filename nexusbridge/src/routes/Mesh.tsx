import { NavLink, Outlet } from 'react-router-dom'
import { Cable, Scaling } from 'lucide-react'
import { cn } from '../lib/cn'

/** Mesh section shell — sub-navigation between Backends and Scaler. */
export function Mesh() {
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          { to: '/mesh/backends', label: 'Backend Connectors', icon: Cable },
          { to: '/mesh/scaler', label: 'Scaler & Fleet', icon: Scaling },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-8 items-center gap-2 rounded-control border px-3 text-[12px] font-semibold transition-all',
                isActive
                  ? 'border-border-accent bg-primary/10 text-primary-bright shadow-glow-cyan'
                  : 'border-border-subtle text-muted hover:border-border-strong hover:text-ink',
              )
            }
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}

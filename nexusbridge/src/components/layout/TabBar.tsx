import { NavLink } from 'react-router-dom'
import { TABS } from './tabs'
import { cn } from '../../lib/cn'

/** Mobile/tablet bottom tab bar — icon + label, cyan active state. */
export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-panel/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary-bright' : 'text-dim hover:text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
                {isActive && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-primary shadow-glow-cyan" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

import { GitBranch, Shield, Waypoints, TerminalSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TabDef {
  to: string
  label: string
  icon: LucideIcon
}

export const TABS: TabDef[] = [
  { to: '/traffic', label: 'Traffic', icon: Waypoints },
  { to: '/endpoints', label: 'Endpoints', icon: TerminalSquare },
  { to: '/mesh', label: 'Mesh', icon: GitBranch },
  { to: '/gov', label: 'Gov', icon: Shield },
]

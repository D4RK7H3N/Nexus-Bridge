import type { Verb } from '../../store/telemetry'
import { cn } from '../../lib/cn'

const VERB_CLASSES: Record<string, string> = {
  GET: 'bg-primary/10 text-primary-bright border-primary/25',
  POST: 'bg-tertiary/10 text-tertiary-bright border-tertiary/25',
  PUT: 'bg-warn/10 text-warn-bright border-warn/25',
  PATCH: 'bg-warn/10 text-warn-bright border-warn/25',
  DELETE: 'bg-crit/10 text-crit-bright border-crit/25',
  WS: 'bg-secondary/10 text-secondary-bright border-secondary/25',
  gRPC: 'bg-secondary/10 text-secondary-bright border-secondary/25',
}

/** Fixed-width uppercase mono HTTP verb pill. */
export function VerbBadge({ verb, className }: { verb: Verb; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-[52px] shrink-0 items-center justify-center rounded-control border font-mono text-[10px] font-semibold uppercase tracking-wide tnum',
        VERB_CLASSES[verb] ?? VERB_CLASSES.GET,
        className,
      )}
    >
      {verb}
    </span>
  )
}

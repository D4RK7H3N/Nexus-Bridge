import { useState, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Cpu,
  Gauge,
  ListFilter,
  MonitorSmartphone,
  Pause,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  GitFork,
  Server,
} from 'lucide-react'
import { Card, SectionHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { VerbBadge } from '../components/ui/VerbBadge'
import { ToggleRow } from '../components/ui/ToggleRow'
import { MicroBars, Sparkline } from '../components/ui/Sparkline'
import { InspectorDrawer, InspectRow } from '../components/layout/InspectorDrawer'
import { useTelemetry, type Trace } from '../store/telemetry'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { toneText } from '../components/ui/tone'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------- DAG node */

interface DagNodeSpec {
  step: string
  title: string
  subtitle: string
  cap: 'cyan' | 'violet' | 'emerald'
  icon: ReactNode
  rows: Array<{ label: string; value: string; tone?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate' }>
  footerLabel: string
  footerValue: string
  footerTone: 'emerald' | 'amber' | 'rose' | 'cyan'
}

function DagNode({ node, onClick }: { node: DagNodeSpec; onClick?: () => void }) {
  return (
    <Card capTone={node.cap} glowTone={node.cap === 'cyan' ? 'cyan' : undefined} className="flex-1 cursor-pointer" padded onClick={onClick}>
      <div className="flex items-start justify-between">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-dim">
          {node.step}
        </p>
        <span className="text-dim">{node.icon}</span>
      </div>
      <h3 className={cn('mt-0.5 text-[17px] font-semibold tracking-tight-heading', node.cap === 'cyan' ? 'text-primary-bright' : 'text-ink')}>
        {node.title}
      </h3>
      <p className={cn('font-mono text-[10px] uppercase tracking-wide', node.cap === 'cyan' ? 'text-primary/70' : 'text-muted')}>
        {node.subtitle}
      </p>
      <div className="mt-3 space-y-1.5">
        {node.rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-control bg-elevated/60 px-2 py-1.5"
          >
            <span className="flex-1 truncate font-mono text-[11px] text-muted">{r.label}</span>
            <span className={cn('font-mono text-[11px] font-semibold tnum', toneText[r.tone ?? 'slate'])}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-border-subtle pt-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-dim">{node.footerLabel}</span>
        <span className={cn('font-mono text-xs font-semibold tnum', toneText[node.footerTone])}>{node.footerValue}</span>
      </div>
    </Card>
  )
}

/** Animated connector with per-hop latency label. */
function HopLink({ label, ms, vertical }: { label: string; ms: number; vertical?: boolean }) {
  const tone = ms > 30 ? 'amber' : 'cyan'
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-1',
        vertical ? 'flex-col pl-6' : 'w-24 flex-col justify-center lg:w-28',
      )}
    >
      {vertical ? (
        <span className="flex items-center gap-2">
          <ArrowDown size={14} className="text-dim" />
          <span className="font-mono text-[10px] text-dim">{label}</span>
          <span className={cn('font-mono text-[10px] font-semibold tnum', toneText[tone])}>({ms}ms)</span>
        </span>
      ) : (
        <>
          <span className="whitespace-nowrap font-mono text-[9px] text-dim">
            {label} <span className={cn('font-semibold tnum', toneText[tone])}>({ms}ms)</span>
          </span>
          <svg width="100%" height="8" className="text-primary">
            <line
              x1="0"
              y1="4"
              x2="100%"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className="animate-flow-dash"
              opacity="0.7"
            />
          </svg>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ trace row */

function statusPill(t: Trace) {
  if (t.status >= 500) return { label: t.statusLabel, tone: 'rose' as const }
  if (t.status >= 400) return { label: t.statusLabel, tone: 'amber' as const }
  return { label: t.statusLabel, tone: 'emerald' as const }
}

function TraceRow({ trace, onClick }: { trace: Trace; onClick: () => void }) {
  const pill = statusPill(trace)
  const latTone = trace.latencyMs > 400 ? 'rose' : trace.latencyMs > 100 ? 'amber' : 'emerald'
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-card px-3 py-2.5 text-left transition-colors hover:bg-subtle"
    >
      <div className="flex items-center gap-2.5">
        <VerbBadge verb={trace.verb} />
        <span className="flex-1 truncate font-mono text-[13px] font-medium text-ink">{trace.path}</span>
        <StatusPill label={pill.label} tone={pill.tone} pulse={false} />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 pl-[62px] font-mono text-[10px] text-dim">
        <span className="truncate">{trace.source}</span>
        <ArrowRight size={10} className="shrink-0" />
        <span className="truncate text-muted">{trace.destination}</span>
        <span className={cn('ml-auto shrink-0 font-semibold tnum', toneText[latTone])}>
          {trace.latencyMs}ms
        </span>
      </div>
    </button>
  )
}

/* --------------------------------------------------------------- screen */

type Selection =
  | { kind: 'node'; node: DagNodeSpec }
  | { kind: 'trace'; trace: Trace }
  | null

export function Traffic() {
  const bp = useBreakpoint()
  const t = useTelemetry()
  const [sel, setSel] = useState<Selection>(null)
  const vertical = bp === 'mobile'

  const latencyTone = t.p95 > 50 ? 'amber' : 'emerald'

  const nodes: DagNodeSpec[] = [
    {
      step: '1. Source',
      title: 'Backend Mesh',
      subtitle: '4 Clusters',
      cap: 'emerald',
      icon: <Server size={14} />,
      rows: [
        { label: 'Postgres', value: `${t.deps.postgres}ms`, tone: t.deps.postgres > 12 ? 'amber' : 'emerald' },
        { label: 'Auth/IAM', value: `${t.deps.authIam}ms`, tone: 'emerald' },
        { label: 'AI Tensor', value: `${t.deps.aiTensor}ms`, tone: t.deps.aiTensor > 20 ? 'rose' : t.deps.aiTensor > 14 ? 'amber' : 'cyan' },
      ],
      footerLabel: 'Aggregate Uptime',
      footerValue: `${t.meshUptime}%`,
      footerTone: 'emerald',
    },
    {
      step: '2. Gateway',
      title: 'NexusBridge',
      subtitle: 'Ingress Engine',
      cap: 'cyan',
      icon: <ShieldCheck size={14} />,
      rows: [
        { label: 'Rate Limiter', value: 'Armed', tone: 'emerald' },
        { label: 'L7 Cache Hit', value: `${t.cacheHit}%`, tone: 'cyan' },
        { label: 'WAF Intercept', value: 'Active', tone: 'emerald' },
      ],
      footerLabel: 'Throughput',
      footerValue: `${t.throughputReq}k req/s`,
      footerTone: 'cyan',
    },
    {
      step: '3. Consumer',
      title: 'Client SDKs',
      subtitle: 'Global Edge',
      cap: 'violet',
      icon: <MonitorSmartphone size={14} />,
      rows: [
        { label: 'iOS / Swift', value: '99.9%', tone: 'emerald' },
        { label: 'Next.js Web', value: '99.9%', tone: 'emerald' },
        { label: 'IoT Mesh', value: '100%', tone: 'emerald' },
      ],
      footerLabel: 'Avg Client Latency',
      footerValue: `${t.hopClient + 10}ms p95`,
      footerTone: t.hopClient + 10 > 50 ? 'amber' : 'emerald',
    },
  ]

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-card bg-panel">
            <HexLogo />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight-heading text-ink lg:text-2xl">
              Global Pipeline Orchestrator
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Sync State: <span className="text-tertiary-bright">Optimal</span> (99.994% Mesh)
            </p>
          </div>
        </div>
        <button className="btn-ghost">
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Tuning</span>
        </button>
      </div>

      {/* topology DAG */}
      <section>
        <SectionHeader
          icon={<WaypointsIcon />}
          title="Topology Visualizer (E2E Stream)"
          right={<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-tertiary-bright">Real-time DAG</span>}
          className="mb-3"
        />
        <Card padded>
          <div className={cn('flex gap-2', vertical ? 'flex-col' : 'flex-row items-stretch')}>
            {nodes.map((n, i) => (
              <div key={n.title} className={cn('flex', vertical ? 'flex-col' : 'flex-1 items-stretch')}>
                <DagNode node={n} onClick={() => setSel({ kind: 'node', node: n })} />
                {i < nodes.length - 1 && (
                  <HopLink
                    label={i === 0 ? `Backends (${t.hopBackend}ms)` : `GW (${t.hopGw}ms)`}
                    ms={i === 0 ? t.hopBackend : t.hopGw}
                    vertical={vertical}
                  />
                )}
              </div>
            ))}
          </div>
          {/* flow-rate bar */}
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-dim">
              <span>E2E Flow Rate · {t.throughputReq}k req/s</span>
              <span className="text-primary-bright tnum">
                Backends ({t.hopBackend}ms) → GW ({t.hopGw}ms) → Clients ({t.hopClient}ms)
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tertiary via-primary to-secondary transition-all duration-700"
                style={{ width: `${Math.min(100, 40 + t.throughputReq)}%` }}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* telemetry stats */}
      <section>
        <SectionHeader
          icon={<WaypointsIcon />}
          title="Gateway Stream Telemetry"
          right={<span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-crit-bright">● Live Updating</span>}
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <div className="flex items-start justify-between">
              <span className="stat-label">Global Traffic</span>
              <ArrowUpRight size={14} className="text-primary-bright" />
            </div>
            <p className="mt-1 text-[32px] font-semibold leading-9 tracking-tight-heading text-ink tnum">
              {t.trafficTotal.toLocaleString()}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-tertiary-bright tnum">
              ↑ +{t.trafficTrend.toFixed(1)}% vs 1h
            </p>
            <div className="mt-2">
              <MicroBars data={t.sparkTraffic} tone="cyan" />
            </div>
          </Card>
          <Card>
            <div className="flex items-start justify-between">
              <span className="stat-label">E2E P95 Latency</span>
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', latencyTone === 'amber' ? 'border-warn text-warn' : 'border-tertiary text-tertiary')}>
                <CheckCircle2 size={10} />
              </span>
            </div>
            <p className="mt-1 text-[32px] font-semibold leading-9 tracking-tight-heading text-ink tnum">
              {t.p95.toFixed(1)} <span className="font-mono text-sm text-muted">ms</span>
            </p>
            <p className={cn('mt-0.5 flex items-center gap-1 text-[11px] font-semibold', latencyTone === 'amber' ? 'text-warn-bright' : 'text-tertiary-bright')}>
              <CheckCircle2 size={12} /> {latencyTone === 'amber' ? 'SLA Warning (≥50ms)' : 'SLA Compliant (<50ms)'}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary via-primary to-tertiary transition-[width] duration-700"
                style={{ width: `${Math.min(100, (t.p95 / 80) * 100)}%` }}
              />
            </div>
          </Card>
          <Card className="sm:col-span-2 xl:col-span-2">
            <div className="flex items-start justify-between">
              <span className="stat-label">P95 Distribution · 24 ticks</span>
              <Gauge size={14} className="text-primary-bright" />
            </div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <p className="text-[32px] font-semibold leading-9 tracking-tight-heading text-ink tnum">
                  {t.throughputReq}<span className="font-mono text-sm text-muted">k req/s</span>
                </p>
                <p className="font-mono text-[11px] text-muted">Gateway throughput</p>
              </div>
              <Sparkline data={t.sparkLatency} tone={latencyTone === 'amber' ? 'amber' : 'cyan'} width={260} height={56} />
            </div>
          </Card>
        </div>
      </section>

      {/* bandwidth split */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-ink">Bandwidth Split</h3>
          <span className="font-mono text-[11px] text-muted tnum">Total: {t.bandwidthTotal} MB/s</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-card bg-elevated/50 p-3" style={{ width: 'auto' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Backend In</span>
              <ArrowDownLeft size={12} className="text-dim" />
            </div>
            <p className="mt-1 font-mono text-lg font-semibold text-primary-bright tnum">
              {t.bandwidthIn} <span className="text-[10px] text-dim">MB/s</span>
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-canvas">
              <div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${(t.bandwidthIn / (t.bandwidthTotal || 1)) * 100}%` }} />
            </div>
          </div>
          <div className="rounded-card bg-elevated/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Client Out</span>
              <ArrowUpRight size={12} className="text-dim" />
            </div>
            <p className="mt-1 font-mono text-lg font-semibold text-tertiary-bright tnum">
              {t.bandwidthOut} <span className="text-[10px] text-dim">MB/s</span>
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-canvas">
              <div className="h-full bg-tertiary transition-[width] duration-700" style={{ width: `${(t.bandwidthOut / (t.bandwidthTotal || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* switchboard */}
      <section>
        <SectionHeader
          icon={<WaypointsIcon />}
          title="Gateway Switchboard"
          right={<span className="font-mono text-[10px] uppercase tracking-wider text-dim">US-East Node</span>}
          className="mb-3"
        />
        <Card padded={false} className="divide-y divide-border-subtle">
          {t.switches.map((sw) => (
            <ToggleRow
              key={sw.id}
              icon={sw.icon === 'shaping' ? <GitFork size={17} /> : sw.icon === 'cache' ? <Cpu size={17} /> : <Zap size={17} />}
              iconTone={sw.icon === 'shaping' ? 'cyan' : sw.icon === 'cache' ? 'emerald' : 'violet'}
              title={sw.title}
              subtitle={
                sw.id === 'cache'
                  ? `Bypass / Armed (${t.cacheHit}% Hit)`
                  : sw.subtitle
              }
              on={sw.on}
              onToggle={() => t.toggleSwitch(sw.id)}
              locked={sw.locked}
              badge={sw.badge}
              badgeTone={sw.badgeTone === 'amber' ? 'amber' : sw.badgeTone === 'rose' ? 'rose' : 'emerald'}
            />
          ))}
        </Card>
      </section>

      {/* packet traces */}
      <section>
        <SectionHeader
          icon={<WaypointsIcon />}
          title="In-Flight Packet Traces"
          right={
            <button
              onClick={() => t.setTracePaused(!t.traceStreamPaused)}
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-bright transition-opacity hover:opacity-80"
            >
              {t.traceStreamPaused ? <Play size={11} /> : <Pause size={11} />}
              {t.traceStreamPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
          }
          className="mb-3"
        />
        <Card padded={false} className="divide-y divide-border-subtle">
          {t.traces.map((tr) => (
            <div key={tr.id} className="animate-fade-in">
              <TraceRow trace={tr} onClick={() => setSel({ kind: 'trace', trace: tr })} />
            </div>
          ))}
          {t.traceStreamPaused && (
            <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-warn-bright">
              Stream paused — buffer retained
            </p>
          )}
        </Card>
      </section>

      {/* inspector */}
      <InspectorDrawer
        open={sel !== null}
        onClose={() => setSel(null)}
        bp={bp}
        title={sel?.kind === 'trace' ? 'Packet Trace Inspector' : sel?.kind === 'node' ? `${sel.node.title} Inspector` : ''}
        subtitle={sel?.kind === 'trace' ? `${sel.trace.verb} ${sel.trace.path}` : sel?.kind === 'node' ? sel.node.subtitle : undefined}
      >
        {sel?.kind === 'node' && (
          <>
            <div className="space-y-1">
              {sel.node.rows.map((r, i) => (
                <InspectRow key={i} k={r.label} v={r.value} tone={toneText[r.tone ?? 'slate']} />
              ))}
              <InspectRow k={sel.node.footerLabel} v={sel.node.footerValue} tone={toneText[sel.node.footerTone]} />
            </div>
            <div className="card p-3">
              <p className="stat-label">Live Window</p>
              <div className="mt-2">
                <Sparkline data={t.sparkLatency} tone="cyan" width={340} height={60} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary"><ListFilter size={13} /> Filter Routes</button>
              <button className="btn-ghost"><Gauge size={13} /> SLO Policy</button>
            </div>
          </>
        )}
        {sel?.kind === 'trace' && (
          <div className="space-y-1">
            <InspectRow k="Verb" v={sel.trace.verb} />
            <InspectRow k="Path" v={sel.trace.path} tone="text-primary-bright" />
            <InspectRow k="Status" v={sel.trace.statusLabel} tone={toneText[statusPill(sel.trace).tone]} />
            <InspectRow k="Source" v={sel.trace.source} />
            <InspectRow k="Destination" v={sel.trace.destination} />
            <InspectRow k="Latency" v={`${sel.trace.latencyMs}ms`} tone={toneText[sel.trace.latencyMs > 100 ? 'amber' : 'emerald']} />
            <InspectRow k="Trace ID" v={`nbx_${sel.trace.id.toString(16)}f${(sel.trace.id * 7).toString(16)}`} tone="text-dim" />
            <InspectRow k="Hop 1 → Edge" v="2.1ms" tone="text-tertiary-bright" />
            <InspectRow k="Hop 2 → Gateway" v={`${t.hopGw}ms`} tone="text-tertiary-bright" />
            <InspectRow k="Hop 3 → Upstream" v={`${t.hopBackend}ms`} tone="text-tertiary-bright" />
          </div>
        )}
      </InspectorDrawer>
    </div>
  )
}

function HexLogo() {
  return (
    <span className="relative flex h-full w-full items-center justify-center rounded-card border border-border-subtle bg-elevated/60">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-cyan" />
    </span>
  )
}

function WaypointsIcon() {
  return <ListFilter size={13} className="text-primary-bright" />
}

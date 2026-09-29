import { useMemo, useRef, useState } from 'react'
import {
  Cable,
  ChevronDown,
  Copy,
  Fingerprint,
  IdCard,
  Loader2,
  MonitorSmartphone,
  Network,
  Play,
  Radio,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  TerminalSquare,
  Workflow,
  Hexagon,
} from 'lucide-react'
import { Card, SectionHeader } from '../components/ui/Card'
import { VerbBadge } from '../components/ui/VerbBadge'
import { StatusPill } from '../components/ui/StatusPill'
import { MiniStat } from '../components/ui/StatCard'
import { JsonViewer } from '../components/ui/JsonViewer'
import { useTelemetry, type Verb } from '../store/telemetry'
import { useConfig, DEFAULT_BACKEND } from '../store/configStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { InspectorDrawer, InspectRow } from '../components/layout/InspectorDrawer'
import { toneText } from '../components/ui/tone'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ data */

type Proto = 'REST' | 'GraphQL' | 'gRPC'

interface RouteSpec {
  verb: Verb
  path: string
  proto: Proto | 'WS'
  pill: { label: string; tone: 'emerald' | 'cyan' }
  pipeline: [string, string, string]
  pipelineIcons: [typeof MonitorSmartphone, typeof ShieldCheck, typeof Server]
  stats: Array<{ label: string; value: string; tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' }>
  actions: [string, string]
}

const ROUTES: RouteSpec[] = [
  {
    verb: 'GET',
    path: '/api/v2/users/me',
    proto: 'REST',
    pill: { label: 'Synced', tone: 'emerald' },
    pipeline: ['Client App', 'Auth + JWT Verify', 'srv-identity:5081'],
    pipelineIcons: [MonitorSmartphone, ShieldCheck, Server],
    stats: [
      { label: 'Throughput', value: '14.2k req/m', tone: 'slate' },
      { label: 'Avg Latency', value: '18ms', tone: 'emerald' },
      { label: 'Rate Limit', value: '100/min IP', tone: 'slate' },
    ],
    actions: ['Inspect Mapping', 'Test Endpoint'],
  },
  {
    verb: 'POST',
    path: '/api/v2/payments/charge',
    proto: 'REST',
    pill: { label: '99.99%', tone: 'emerald' },
    pipeline: ['Web Checkout', 'Idempotency+Sanitizer', 'srv-billing:443'],
    pipelineIcons: [IdCard, Fingerprint, Server],
    stats: [
      { label: 'Throughput', value: '820 req/m', tone: 'slate' },
      { label: 'Latency', value: '142ms', tone: 'amber' },
      { label: 'Circuit Breaker', value: '● Armed', tone: 'emerald' },
    ],
    actions: ['Inspect Mapping', 'Test Endpoint'],
  },
  {
    verb: 'WS',
    path: '/socket/v1/feed',
    proto: 'WS',
    pill: { label: '12.4k Active', tone: 'cyan' },
    pipeline: ['Mobile SDK', 'Pooler (12k conns)', 'kafka:9092'],
    pipelineIcons: [Smartphone, Network, Workflow],
    stats: [
      { label: 'Active Sockets', value: '12,418', tone: 'cyan' },
      { label: 'Drop Rate', value: '0.001%', tone: 'emerald' },
      { label: 'Heartbeat', value: '15s ping', tone: 'slate' },
    ],
    actions: ['Buffer Params', 'Sniff Handshake'],
  },
  {
    verb: 'POST',
    path: '/graphql/v2/federated',
    proto: 'GraphQL',
    pill: { label: 'Synced', tone: 'emerald' },
    pipeline: ['Portal Web', 'Query Planner', 'subgraph-mesh:4001'],
    pipelineIcons: [MonitorSmartphone, Hexagon, Server],
    stats: [
      { label: 'Throughput', value: '6.1k req/m', tone: 'slate' },
      { label: 'Avg Latency', value: '31ms', tone: 'emerald' },
      { label: 'Depth Guard', value: '8 max', tone: 'slate' },
    ],
    actions: ['Inspect Mapping', 'Test Endpoint'],
  },
  {
    verb: 'gRPC',
    path: '/telemetry.v3.NodeStream/Push',
    proto: 'gRPC',
    pill: { label: 'Synced', tone: 'emerald' },
    pipeline: ['Edge Agent', 'mTLS Terminator', 'stream-core:50051'],
    pipelineIcons: [Radio, ShieldCheck, Server],
    stats: [
      { label: 'Throughput', value: '22.8k msg/s', tone: 'cyan' },
      { label: 'Latency', value: '4ms', tone: 'emerald' },
      { label: 'Rate Limit', value: 'Unlimited', tone: 'slate' },
    ],
    actions: ['Inspect Mapping', 'Test Endpoint'],
  },
]

const VERBS: Verb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

type ProbeResult =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done'; status: number; ms: number; body: unknown }

/* ------------------------------------------------------------ components */

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-8 items-center rounded-full border px-3.5 font-mono text-[11px] font-semibold uppercase tracking-wide transition-all',
        active
          ? 'border-primary bg-primary/15 text-primary-bright shadow-glow-cyan'
          : 'border-border-subtle bg-elevated/40 text-muted hover:border-border-strong hover:text-ink',
      )}
    >
      {label}
      {count !== undefined && <span className={cn('ml-1.5 tnum', active ? 'text-primary-bright' : 'text-dim')}>({count})</span>}
    </button>
  )
}

function RouteCard({
  route,
  onInspect,
  onTest,
}: {
  route: RouteSpec
  onInspect: (r: RouteSpec) => void
  onTest: (r: RouteSpec) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <Card padded={false} className="overflow-hidden">
      {/* header row — collapsible on mobile */}
      <button
        className="flex w-full items-center gap-2.5 px-4 pt-3.5 pb-3 text-left md:cursor-default"
        onClick={() => setOpen((v) => !v)}
      >
        <VerbBadge verb={route.verb} />
        <span className="flex-1 truncate font-mono text-[14px] font-semibold text-ink">{route.path}</span>
        <StatusPill label={route.pill.label} tone={route.pill.tone} />
        <ChevronDown
          size={14}
          className={cn('text-dim transition-transform md:hidden', open && 'rotate-180')}
        />
      </button>

      <div className={cn('space-y-3 px-4 pb-4', !open && 'hidden md:block')}>
        {/* 3-step mini pipeline */}
        <div className="rounded-card border border-border-subtle bg-canvas/60 p-2.5">
          <p className="stat-label mb-2">Proxy Pipeline Topology</p>
          <div className="grid grid-cols-3 gap-2">
            {route.pipeline.map((step, i) => {
              const Icon = route.pipelineIcons[i]
              return (
                <div key={i} className="relative">
                  <div
                    className={cn(
                      'flex h-12 flex-col items-center justify-center gap-1 rounded-control border px-1',
                      i === 1
                        ? 'border-secondary/30 bg-secondary/15 text-secondary-bright shadow-glow-violet'
                        : i === 0
                          ? 'border-primary/25 bg-primary/10 text-primary-bright'
                          : 'border-tertiary/25 bg-tertiary/10 text-tertiary-bright',
                    )}
                  >
                    <Icon size={13} />
                    <span className="max-w-full truncate text-center font-mono text-[8.5px] font-semibold leading-tight">
                      {step}
                    </span>
                  </div>
                  {i < 2 && (
                    <span className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 text-dim">↔</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* stat row */}
        <div className="grid grid-cols-3 gap-2 rounded-card border border-border-subtle bg-elevated/40 px-3 py-2.5">
          {route.stats.map((s) => (
            <div key={s.label}>
              <p className="stat-label">{s.label}</p>
              <p className={cn('mt-0.5 font-mono text-xs font-semibold tnum', toneText[s.tone ?? 'slate'])}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => onInspect(route)}>
            <Workflow size={13} /> {route.actions[0]}
          </button>
          <button
            className="btn-secondary flex-1 border-primary/30 bg-primary/10 text-primary-bright hover:border-primary"
            onClick={() => onTest(route)}
          >
            <Play size={13} /> {route.actions[1]}
          </button>
        </div>
      </div>
    </Card>
  )
}

function ProbePanel({
  verb,
  path,
  setVerb,
  setPath,
}: {
  verb: Verb
  path: string
  setVerb: (v: Verb) => void
  setPath: (p: string) => void
}) {
  const backendUrl = useConfig((s) => s.backendUrl)
  const backendStatus = useConfig((s) => s.status)
  const [token, setToken] = useState('')
  const [result, setResult] = useState<ProbeResult>({ phase: 'idle' })

  const send = async () => {
    setResult({ phase: 'loading' })
    const t0 = performance.now()
    const url = `${backendUrl}${path.startsWith('/') ? path : `/${path}`}`
    try {
      const res = await fetch(url, {
        method: verb,
        headers: {
          Accept: 'application/json',
          ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}),
          ...(verb !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(verb !== 'GET' ? { body: '{}' } : {}),
      })
      const ms = Math.round(performance.now() - t0)
      const text = await res.text()
      let body: unknown
      try {
        body = JSON.parse(text)
      } catch {
        body = text.slice(0, 2000) || `Empty response body (HTTP ${res.status})`
      }
      setResult({ phase: 'done', status: res.status, ms, body })
    } catch (e) {
      setResult({
        phase: 'done',
        status: 0,
        ms: Math.round(performance.now() - t0),
        body: { error: 'NETWORK_ERROR', message: e instanceof Error ? e.message : 'Fetch failed', url },
      })
    }
  }

  const resultTone =
    result.phase === 'done'
      ? result.status === 0 || result.status >= 500
        ? 'rose'
        : result.status >= 400
          ? 'amber'
          : 'emerald'
      : 'slate'

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-control bg-primary/15 text-primary-bright">
            <TerminalSquare size={13} />
          </span>
          Quick Route Probe
        </h3>
        <StatusPill
          label={backendStatus === 'connected' ? 'Backend Online' : backendStatus === 'checking' ? 'Probing' : 'Backend Offline'}
          tone={backendStatus === 'connected' ? 'emerald' : backendStatus === 'checking' ? 'amber' : 'rose'}
        />
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="stat-label mb-1.5">Target Request Endpoint</p>
          <div className="flex overflow-hidden rounded-control border border-border-subtle bg-canvas focus-within:border-primary focus-within:shadow-[0_0_0_1px_#06B6D4]">
            <div className="relative border-r border-border-subtle">
              <select
                value={verb}
                onChange={(e) => setVerb(e.target.value as Verb)}
                className="h-8 appearance-none bg-transparent pl-3 pr-7 font-mono text-xs font-semibold uppercase text-primary-bright"
              >
                {VERBS.map((v) => (
                  <option key={v} value={v} className="bg-elevated">
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-dim" />
            </div>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="h-8 min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-ink placeholder:text-dim"
              placeholder="/api/health"
            />
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-dim">
            → {backendUrl || DEFAULT_BACKEND}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 rounded-control border border-border-subtle bg-canvas px-2.5 h-8 focus-within:border-primary focus-within:shadow-[0_0_0_1px_#06B6D4]">
          <ShieldCheck size={12} className="shrink-0 text-tertiary-bright" />
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token (optional)"
            spellCheck={false}
            autoCapitalize="off"
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-[11px] text-muted placeholder:text-dim"
          />
        </div>

        <button className="btn-primary h-9 w-full" onClick={send} disabled={result.phase === 'loading'}>
          {result.phase === 'loading' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Probing…
            </>
          ) : (
            <>
              <Send size={14} /> Send Probe Request
            </>
          )}
        </button>

        {result.phase === 'done' && (
          <div className="animate-fade-in">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="stat-label">Live Response Output</p>
              <span className="flex items-center gap-2">
                <StatusPill
                  label={result.status === 0 ? 'ERR' : String(result.status)}
                  tone={resultTone}
                  pulse={false}
                />
                <span className="font-mono text-[10px] text-muted tnum">{result.ms}ms</span>
              </span>
            </div>
            <div className="relative">
              <JsonViewer value={result.body} />
              <button
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-control text-muted hover:bg-subtle hover:text-ink"
                aria-label="Copy response"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2),
                  )
                }
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        )}
        {result.phase === 'idle' && (
          <p className="rounded-control border border-dashed border-border-strong/60 px-3 py-3 text-center font-mono text-[10px] text-dim">
            No probe sent — response from the DarkZ backend will render here.
          </p>
        )}
      </div>
    </Card>
  )
}

/* --------------------------------------------------------------- screen */

export function Endpoints() {
  const t = useTelemetry()
  const bp = useBreakpoint()
  const [query, setQuery] = useState('')
  const [proto, setProto] = useState<'All' | Proto>('All')

  // lifted probe state — shared with route-card "Test Endpoint" actions
  const [probeVerb, setProbeVerb] = useState<Verb>('GET')
  const [probePath, setProbePath] = useState('/api/health')
  const probeRef = useRef<HTMLDivElement>(null)

  // mapping inspector
  const [inspected, setInspected] = useState<RouteSpec | null>(null)

  const handleTest = (r: RouteSpec) => {
    setProbeVerb(VERBS.includes(r.verb as (typeof VERBS)[number]) ? r.verb : 'GET')
    setProbePath(r.path)
    probeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const filtered = useMemo(
    () =>
      ROUTES.filter(
        (r) =>
          (proto === 'All' || r.proto === proto) &&
          r.path.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, proto],
  )

  const successTone = t.successRate >= 99.9 ? 'emerald' : t.successRate >= 99 ? 'amber' : 'rose'
  const p99Tone = t.p99 > 30 ? 'amber' : 'emerald'

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<Cable size={13} className="text-primary-bright" />}
        title="Active Gateway Cluster"
        right={<StatusPill label={`${t.liveRoutes} Live Routes`} tone="emerald" />}
      />

      {/* stat row */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <MiniStat label="Ingress QPS" value={`${t.qps}k`} delta="+4%" barValue={(t.qps / 50) * 100} barTone="cyan" />
        <MiniStat label="P99 Latency" value={`${t.p99}ms`} delta={p99Tone === 'amber' ? 'High' : 'Normal'} deltaTone={p99Tone} barValue={(t.p99 / 50) * 100} barTone={p99Tone === 'amber' ? 'amber' : 'emerald'} />
        <MiniStat label="Success Rate" value={`${t.successRate.toFixed(2)}%`} barValue={t.successRate} barTone={successTone} />
      </div>

      {/* main split: route list | probe (desktop) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input h-10 pl-9 font-mono text-xs"
              placeholder="/api/v2/…"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-control border border-border-subtle bg-elevated px-1.5 py-0.5 font-mono text-[9px] text-dim">
              ⌘K
            </kbd>
          </div>

          {/* protocol chips */}
          <div className="flex flex-wrap gap-2">
            <Chip active={proto === 'All'} label="All" count={ROUTES.length + 179} onClick={() => setProto('All')} />
            <Chip active={proto === 'REST'} label="REST" count={142} onClick={() => setProto('REST')} />
            <Chip active={proto === 'GraphQL'} label="GraphQL" count={21} onClick={() => setProto('GraphQL')} />
            <Chip active={proto === 'gRPC'} label="gRPC" count={14} onClick={() => setProto('gRPC')} />
          </div>

          <SectionHeader
            title="Configured Route Proxies"
            right={<span className="font-mono text-[10px] uppercase tracking-wider text-dim">Real-time DAG Stream</span>}
          />

          <div className="space-y-3">
            {filtered.map((r) => (
              <RouteCard key={r.path} route={r} onInspect={setInspected} onTest={handleTest} />
            ))}
            {filtered.length === 0 && (
              <Card className="text-center">
                <p className="font-mono text-xs text-dim">No routes match "{query}" in {proto}.</p>
              </Card>
            )}
          </div>
        </div>

        {/* probe panel — persistent right column on desktop, stacked below on mobile */}
        <div ref={probeRef} className="xl:sticky xl:top-20 xl:self-start">
          <ProbePanel verb={probeVerb} path={probePath} setVerb={setProbeVerb} setPath={setProbePath} />
        </div>
      </div>

      {/* mapping inspector drawer */}
      <InspectorDrawer
        open={inspected !== null}
        onClose={() => setInspected(null)}
        bp={bp}
        title="Route Mapping Inspector"
        subtitle={inspected ? `${inspected.verb} ${inspected.path}` : undefined}
      >
        {inspected && (
          <>
            <div className="space-y-1">
              <InspectRow k="Protocol" v={inspected.proto} />
              <InspectRow k="Client Ingress" v={inspected.pipeline[0]} tone="text-primary-bright" />
              <InspectRow k="Middleware" v={inspected.pipeline[1]} tone="text-secondary-bright" />
              <InspectRow k="Upstream Service" v={inspected.pipeline[2]} tone="text-tertiary-bright" />
              <InspectRow k="Sync State" v={inspected.pill.label} />
            </div>
            <div>
              <p className="stat-label mb-1.5">Compiled Mapping Config</p>
              <JsonViewer
                value={{
                  route: inspected.path,
                  method: inspected.verb,
                  protocol: inspected.proto,
                  pipeline: {
                    ingress: inspected.pipeline[0],
                    middleware: inspected.pipeline[1],
                    upstream: inspected.pipeline[2],
                  },
                  policies: {
                    sync: inspected.pill.label,
                    rateLimit: inspected.stats[2]?.value ?? 'unlimited',
                    circuitBreaker: 'auto',
                  },
                  stats: Object.fromEntries(inspected.stats.map((s) => [s.label, s.value])),
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  handleTest(inspected)
                  setInspected(null)
                }}
              >
                <Play size={13} /> Test Endpoint
              </button>
              <button className="btn-ghost" onClick={() => setInspected(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </InspectorDrawer>

      <p className="flex items-center justify-center gap-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
        Route Mesh Proxy Engine
        <span className="text-primary-bright">◈ Live Sync: 3.2s ago</span>
      </p>
    </div>
  )
}

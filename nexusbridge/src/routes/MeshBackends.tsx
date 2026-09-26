import { useMemo, useState } from 'react'
import {
  Braces,
  CheckCircle2,
  Code2,
  Database,
  Fingerprint,
  GitBranch,
  Landmark,
  Leaf,
  PlusCircle,
  Radio,
  Server,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from 'lucide-react'
import { Card, SectionHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { useTelemetry } from '../store/telemetry'
import { useConfig } from '../store/configStore'
import type { Tone } from '../theme/tokens'
import { toneText, toneBgSoft } from '../components/ui/tone'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ data */

type Lang = 'Python' | 'Laravel' | 'Java' | 'Go' | 'Node'

interface BackendSpec {
  lang: Lang
  langMeta: string
  name: string
  desc: string
  health: string
  healthTone: Tone
  bindingLabel: string
  binding: string
  target: string
  latency: string
  latencyTone: Tone
  prefixes: string[]
  tags: string[]
  cap: Tone
  icon: typeof Code2
}

const BACKENDS: BackendSpec[] = [
  {
    lang: 'Python',
    langMeta: 'Python 3.11',
    name: 'FastAPI AI Worker',
    desc: 'PyTorch Inference Cluster',
    health: 'Healthy',
    healthTone: 'emerald',
    bindingLabel: 'gRPC + HTTP/2',
    binding: 'api-ai.internal.corp',
    target: '10.0.42.18:8000',
    latency: '11ms p99',
    latencyTone: 'emerald',
    prefixes: ['/v1/ai/*', '/v1/predict/*'],
    tags: ['Uvicorn 4-workers', 'GPU-passthrough'],
    cap: 'cyan',
    icon: TerminalSquare,
  },
  {
    lang: 'Laravel',
    langMeta: 'PHP 8.3 · L11',
    name: 'Laravel Billing Engine',
    desc: 'Orders & Subscription Pipeline',
    health: '99.95%',
    healthTone: 'emerald',
    bindingLabel: 'PHP-FPM Unix / Reverse Proxy',
    binding: 'orders-srv.aws.internal',
    target: '192.168.10.45:9000',
    latency: '24ms p95',
    latencyTone: 'emerald',
    prefixes: ['/v2/checkout/*', '/v2/invoices/*'],
    tags: ['Sanctum Auth', '32 FPM Workers'],
    cap: 'rose',
    icon: Braces,
  },
  {
    lang: 'Java',
    langMeta: 'JDK 21 · Spring 3',
    name: 'Spring Boot FinCore',
    desc: 'Ledger Settlement & Audit Mesh',
    health: '100% SLA',
    healthTone: 'emerald',
    bindingLabel: 'mTLS 1.3 / HTTPS',
    binding: 'accounts-mesh.fintech.vpc',
    target: '172.16.8.102:8443',
    latency: '8ms avg',
    latencyTone: 'emerald',
    prefixes: ['/v1/ledger/*', '/v1/settlements/*'],
    tags: ['Eureka Mesh', 'Pool: 120/150'],
    cap: 'amber',
    icon: Landmark,
  },
  {
    lang: 'Go',
    langMeta: 'Go 1.22 · Fiber',
    name: 'Go Telemetry Collector',
    desc: 'High-Throughput WebSocket Ingest',
    health: 'Active',
    healthTone: 'emerald',
    bindingLabel: 'Pure gRPC Stream',
    binding: 'stream-core.internal',
    target: '10.240.12.9:50051',
    latency: '4ms latency',
    latencyTone: 'emerald',
    prefixes: ['/v1/telemetry/*', '/v1/metrics/push'],
    tags: ['Zero-alloc I/O', 'Goroutines: 4.8k'],
    cap: 'cyan',
    icon: Zap,
  },
]

const LANG_FILTERS: Array<{ lang: Lang | 'All'; count: number }> = [
  { lang: 'All', count: 5 },
  { lang: 'Python', count: 2 },
  { lang: 'Laravel', count: 1 },
  { lang: 'Java', count: 1 },
  { lang: 'Go', count: 1 },
]

const LANG_PICKER: Array<{ lang: Lang; icon: typeof Code2 }> = [
  { lang: 'Python', icon: TerminalSquare },
  { lang: 'Laravel', icon: Braces },
  { lang: 'Java', icon: Landmark },
  { lang: 'Go', icon: Zap },
  { lang: 'Node', icon: Leaf },
]

/* ------------------------------------------------------------ components */

function BackendCard({ b }: { b: BackendSpec }) {
  const Icon = b.icon
  return (
    <Card capTone={b.cap} padded={false} className="overflow-hidden">
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-card', toneBgSoft[b.cap], toneText[b.cap])}>
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[15px] font-semibold text-ink">{b.name}</h3>
              <StatusPill label={b.health} tone={b.healthTone} />
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-bright">
              {b.langMeta}
            </p>
            <p className="truncate text-xs text-muted">{b.desc}</p>
          </div>
        </div>
      </div>

      {/* upstream binding */}
      <div className="mx-4 mt-3 rounded-card border border-border-subtle bg-canvas/70 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="stat-label">Upstream Binding</span>
          <span className="font-mono text-[10px] font-semibold text-tertiary-bright">{b.bindingLabel}</span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-muted">
          <Server size={11} className="shrink-0 text-dim" />
          <span className="truncate">{b.binding}</span>
          <span className="text-dim">→</span>
          <span className="shrink-0 text-ink tnum">{b.target}</span>
        </p>
      </div>

      {/* route prefixes + latency */}
      <div className="mx-4 mt-2.5 flex items-center gap-2 rounded-card bg-elevated/40 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {b.prefixes.map((p) => (
            <span key={p} className="rounded-control border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono text-[10px] text-primary-bright">
              {p}
            </span>
          ))}
        </div>
        <span className={cn('flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold tnum', toneText[b.latencyTone])}>
          <Radio size={11} /> {b.latency}
        </span>
      </div>

      {/* footer tags + probe */}
      <div className="flex items-center gap-2 px-4 py-3">
        {b.tags.map((t) => (
          <span key={t} className="rounded-control bg-elevated/70 px-1.5 py-1 font-mono text-[9px] text-muted">
            {t}
          </span>
        ))}
        <button className="btn-ghost ml-auto h-7 text-[11px]">
          <Radio size={11} /> Probe
        </button>
      </div>
    </Card>
  )
}

function IntegrateForm() {
  const [lang, setLang] = useState<Lang>('Python')
  const [host, setHost] = useState('')
  const [verified, setVerified] = useState(false)

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-border-subtle p-4 pb-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <PlusCircle size={16} className="text-primary-bright" />
          Integrate Backend Service
          <span className="ml-1 rounded-full border border-border-subtle px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">
            Custom Host/IP
          </span>
        </h3>
        <p className="mt-1.5 text-xs leading-5 text-muted">
          Connect your Python, Laravel, Java, or Go backend service directly using its dedicated IP address or
          internal VPC domain.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="stat-label mb-2">Backend Language Runtime</p>
          <div className="grid grid-cols-5 gap-2">
            {LANG_PICKER.map(({ lang: l, icon: Icon }) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded-card border text-[10px] font-semibold transition-all',
                  lang === l
                    ? 'border-border-accent bg-primary/15 text-primary-bright shadow-glow-cyan'
                    : 'border-border-subtle bg-elevated/40 text-muted hover:border-border-strong',
                )}
              >
                <Icon size={16} />
                {l === 'Go' ? 'Go/Node' : l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="stat-label mb-1.5">Target Domain / Upstream IP:Port</p>
          <div className="flex items-center gap-2 rounded-control border border-border-subtle bg-canvas px-3 focus-within:border-primary focus-within:shadow-[0_0_0_1px_#06B6D4]">
            <GitBranch size={13} className="shrink-0 text-dim" />
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. 10.12.4.90:8080"
              className="h-9 min-w-0 flex-1 bg-transparent font-mono text-xs text-ink placeholder:text-dim"
            />
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-dim">
            Supports raw IPv4, IPv6, AWS Route53 private domains, or Kubernetes cluster.local
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="stat-label mb-1.5">Protocol</p>
            <select className="input font-mono text-xs">
              <option className="bg-elevated">HTTP/2</option>
              <option className="bg-elevated">gRPC</option>
              <option className="bg-elevated">HTTPS</option>
              <option className="bg-elevated">WebSocket</option>
            </select>
          </div>
          <div>
            <p className="stat-label mb-1.5">Health Endpoint</p>
            <input className="input font-mono text-xs" defaultValue="/healthz" />
          </div>
        </div>

        <button
          className={cn('btn-primary h-11 w-full text-sm', verified && 'bg-tertiary hover:bg-tertiary-bright')}
          onClick={() => setVerified((v) => !v)}
        >
          {verified ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
          {verified ? `Handshake Verified · ${lang} Attached` : 'Verify Handshake & Attach to Gateway'}
        </button>
      </div>
    </Card>
  )
}

/* --------------------------------------------------------------- screen */

export function MeshBackends() {
  const meshUptime = useTelemetry((s) => s.meshUptime)
  const openConfig = useConfig((s) => s.openConfig)
  const [filter, setFilter] = useState<Lang | 'All'>('All')

  const shown = useMemo(() => BACKENDS.filter((b) => filter === 'All' || b.lang === filter), [filter])

  return (
    <div className="space-y-5">
      {/* ingress summary */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-7 tracking-tight-heading text-ink">
            Upstream <span className="text-muted">Connectors</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            5 active runtime bridges · dedicated IP & custom domain bindings
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="pill border border-border-subtle bg-elevated/60 text-muted">mesh-v2.4</span>
          <button className="btn-primary" onClick={openConfig}>
            <Radio size={13} /> Connect
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-3 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary/15 text-primary-bright">
          <Database size={14} />
        </span>
        <div className="flex-1">
          <p className="stat-label">Cluster Ingress</p>
          <p className="font-mono text-xs text-ink tnum">10.0.0.0/16 VPC Mesh</p>
        </div>
        <div className="text-right">
          <p className="stat-label">Aggregate Health</p>
          <p className="font-mono text-sm font-semibold text-tertiary-bright shadow-glow-emerald tnum">
            {meshUptime}%<span className="ml-1 text-[10px] text-dim">~11ms</span>
          </p>
        </div>
      </div>

      {/* connector filter chips */}
      <div className="flex flex-wrap gap-2">
        {LANG_FILTERS.map(({ lang, count }) => (
          <button
            key={lang}
            onClick={() => setFilter(lang)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px] font-semibold transition-all',
              filter === lang
                ? 'border-primary bg-primary/15 text-primary-bright shadow-glow-cyan'
                : 'border-border-subtle bg-elevated/40 text-muted hover:border-border-strong hover:text-ink',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', filter === lang ? 'bg-primary-bright' : 'bg-dim')} />
            {lang} <span className="tnum">{count}</span>
          </button>
        ))}
      </div>

      {/* cards + form — 12-col grid on desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-2">
        {shown.map((b) => (
          <BackendCard key={b.name} b={b} />
        ))}
      </div>

      <IntegrateForm />

      <p className="flex items-center justify-center gap-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-widest text-dim">
        Route Mesh Proxy Engine
        <span className="text-primary-bright">◈ Live Sync: 3.2s ago</span>
      </p>
    </div>
  )
}

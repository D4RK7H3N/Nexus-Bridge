import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeftRight,
  Database,
  ListFilter,
  RefreshCcw,
  Rocket,
  Server,
  Trash2,
  Zap,
} from 'lucide-react'
import { Card, SectionHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { RadialGauge } from '../components/ui/RadialGauge'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useTelemetry } from '../store/telemetry'
import type { Tone } from '../theme/tokens'
import { toneBar, toneText } from '../components/ui/tone'
import { cn } from '../lib/cn'

function PoolCard({
  name,
  cpu,
  mem,
  pods,
  podsTone,
}: {
  name: string
  cpu: number
  mem: number
  pods: string
  podsTone: Tone
}) {
  return (
    <Card className="relative border-l-2 border-l-tertiary/60">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">{name}</h3>
        <StatusPill label={pods} tone={podsTone} />
      </div>
      <div className="mt-3 space-y-2.5">
        {[
          { label: 'CPU', value: cpu, tone: cpu > 80 ? 'rose' : cpu > 65 ? 'amber' : 'cyan' },
          { label: 'MEM', value: mem, tone: mem > 80 ? 'rose' : mem > 65 ? 'violet' : 'violet' },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="w-8 font-mono text-[10px] font-semibold text-dim">{m.label}</span>
            <ProgressBar value={m.value} tone={m.tone as Tone} className="flex-1" height="h-1.5" />
            <span className="w-9 text-right font-mono text-[11px] font-semibold text-ink tnum">{m.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function MeshScaler() {
  const t = useTelemetry()
  const [confirming, setConfirming] = useState<'scale' | 'flush' | null>(null)

  const loadTone: Tone = t.clusterLoad > 80 ? 'rose' : t.clusterLoad > 65 ? 'amber' : 'cyan'
  const surgeActive = t.clusterLoad > 55

  const flash = (kind: 'scale' | 'flush') => {
    setConfirming(kind)
    setTimeout(() => setConfirming(null), 2600)
    if (kind === 'scale') t.emergencyScaleOut()
    else t.emergencyFlushCache()
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <Card className="shadow-glow-cyan">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary-bright">
            Mesh Topology
          </p>
          <StatusPill label="Synchronized" tone="emerald" />
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight-heading text-ink">
          Auto-Scaler & Fleet Mesh
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Balancing real-time ingress telemetry with dynamic pod provisioning.
        </p>
      </Card>

      {/* cluster load */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Global Cluster Load</p>
              <p className="mt-1 text-[36px] font-semibold leading-10 tracking-tight-heading text-ink tnum">
                {t.clusterLoad}%
                <span className={cn('ml-2 align-middle font-mono text-xs', toneText[loadTone])}>
                  · {loadTone === 'rose' ? 'Critical' : loadTone === 'amber' ? 'Elevated' : 'Optimal'}
                </span>
              </p>
            </div>
            <RadialGauge value={t.clusterLoad} tone={loadTone} label={`${t.pods}\nPODS`} />
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-card bg-elevated/50 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-primary/15 text-primary-bright">
              <Zap size={14} />
            </span>
            <div className="flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">Surge Protection</p>
              <p className="font-mono text-xs text-ink tnum">Spike Cap: 80k RPS</p>
            </div>
            <StatusPill label={surgeActive ? 'Active' : 'Standby'} tone={surgeActive ? 'cyan' : 'slate'} />
          </div>
        </Card>

        {/* replica floor */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
              <ListFilter size={12} /> Target Replica Floor
            </p>
            <span className="font-mono text-sm font-semibold text-ink tnum">{t.replicaFloor} instances</span>
          </div>
          <input
            type="range"
            min={6}
            max={60}
            value={t.replicaFloor}
            onChange={(e) => t.setReplicaFloor(Number(e.target.value))}
            className="mt-5 w-full accent-primary"
          />
          <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
            <span className="text-dim">Min: 6 pods</span>
            <span className="font-semibold text-tertiary-bright">Live Provisioned</span>
            <span className="text-dim">Max: 60 pods</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border-subtle pt-3 text-center">
            {[
              { l: 'Desired', v: `${t.replicaFloor}` },
              { l: 'Running', v: `${t.pods}` },
              { l: 'Pending', v: `${Math.max(0, t.replicaFloor - t.pods)}` },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-mono text-sm font-semibold text-ink tnum">{s.v}</p>
                <p className="stat-label mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* node fleet */}
      <section>
        <SectionHeader
          icon={<Server size={13} className="text-primary-bright" />}
          title="Node Fleet"
          right={
            <span className="pill border border-secondary/30 bg-secondary/10 text-secondary-bright">
              <ArrowLeftRight size={10} /> Least Conns (Latency Wt.)
            </span>
          }
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {t.pools.map((p) => (
            <PoolCard key={p.name} name={p.name} cpu={p.cpu} mem={p.mem} pods={p.pods} podsTone={p.podsTone} />
          ))}
        </div>
      </section>

      {/* memory & pipeline bridges */}
      <section>
        <SectionHeader
          icon={<RefreshCcw size={13} className="text-primary-bright" />}
          title="Memory & Pipeline Bridges"
          className="mb-3"
        />
        <div className="space-y-3">
          <Card>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-tertiary-bright" /> Redis Mesh Layer
              </p>
              <span className="font-mono text-xs font-semibold text-tertiary-bright tnum">
                {t.redisHit}% Hit Rate
              </span>
            </div>
            <ProgressBar value={t.redisHit} tone="emerald" className="mt-2.5" />
            <p className="mt-2 text-[11px] leading-4 text-muted">
              Prevented <span className="font-mono font-semibold text-secondary-bright">2.1M</span> roundtrip
              queries to primary database replicas in the last 15 min.
            </p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Database size={13} className="text-primary-bright" /> DB Connection Pool
              </p>
              <span className="font-mono text-xs font-semibold text-primary-bright tnum">
                {t.dbLeased} / 200 Leased
              </span>
            </div>
            <ProgressBar value={t.dbLeased} max={200} tone={t.dbLeased > 170 ? 'amber' : 'cyan'} className="mt-2.5" />
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
              <span>
                Queue Wait: <span className={cn('font-mono font-semibold tnum', t.dbQueueMs > 3 ? 'text-warn-bright' : 'text-tertiary-bright')}>{t.dbQueueMs}ms</span>
              </span>
              <span className="font-mono tnum">{200 - t.dbLeased} Free Slots</span>
            </div>
          </Card>
        </div>
      </section>

      {/* live mesh trace strip */}
      <div className="relative h-36 overflow-hidden rounded-card border border-border-subtle bg-canvas">
        <svg className="absolute inset-0 h-full w-full opacity-50" preserveAspectRatio="none" viewBox="0 0 400 140">
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={i}
              d={`M -10 ${20 + i * 14} C 120 ${10 + i * 16}, 260 ${30 + i * 12}, 410 ${16 + i * 14}`}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="0.7"
              strokeDasharray="5 7"
              opacity={0.25 + (i % 3) * 0.2}
              className="animate-flow-dash"
            />
          ))}
        </svg>
        <div className="absolute bottom-3 left-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary-bright">
            Live Mesh Trace
          </p>
          <p className="mt-0.5 max-w-[240px] text-xs text-muted">
            Zero dropped packets across 14 edge zones
          </p>
        </div>
        <span className="absolute bottom-3 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-border-accent bg-panel/80 text-primary-bright shadow-glow-cyan">
          <RefreshCcw size={13} className="animate-spin [animation-duration:3s]" />
        </span>
      </div>

      {/* emergency overrides */}
      <Card className="border-warn/25">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-warn-bright">
          <AlertTriangle size={15} /> Emergency Gateway Overrides
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            className={cn('btn-primary h-11', confirming === 'scale' && 'bg-tertiary hover:bg-tertiary-bright')}
            onClick={() => flash('scale')}
          >
            <Rocket size={14} /> {confirming === 'scale' ? 'Fleet +5 Provisioned' : 'Scale Out (+5)'}
          </button>
          <button
            className={cn('btn-danger h-11', confirming === 'flush' && 'border-tertiary/40 bg-tertiary/10 text-tertiary-bright')}
            onClick={() => flash('flush')}
          >
            <Trash2 size={14} /> {confirming === 'flush' ? 'Cache Purged' : 'Flush Cache'}
          </button>
        </div>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-dim">
          Overrides bypass surge policy · audit-logged to Sentinel
        </p>
      </Card>
    </div>
  )
}

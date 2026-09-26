import { useState } from 'react'
import {
  Braces,
  CheckCircle2,
  Copy,
  Fingerprint,
  Globe,
  KeyRound,
  Pause,
  Play,
  PlusCircle,
  RefreshCcw,
  Shield,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { Card, SectionHeader } from '../components/ui/Card'
import { StatusPill } from '../components/ui/StatusPill'
import { Switch } from '../components/ui/ToggleRow'
import { useTelemetry, type ThreatEvent } from '../store/telemetry'
import type { Tone } from '../theme/tokens'
import { toneBgSoft, toneText } from '../components/ui/tone'
import { cn } from '../lib/cn'

/* ------------------------------------------------------------------ data */

interface Credential {
  icon: typeof KeyRound
  iconTone: Tone
  name: string
  scope: string
  status: string
  statusTone: Tone
  keyLabel: string
  keyValue: string
  tags: string[]
  note: string
}

const CREDENTIALS: Credential[] = [
  {
    icon: Smartphone,
    iconTone: 'cyan',
    name: 'Production iOS Client Key',
    scope: 'Client SDK v4.8 · Mobile Native Target',
    status: 'Active',
    statusTone: 'emerald',
    keyLabel: 'KEY',
    keyValue: 'nx_live_99f24a87b3e100c6d9a24ec081b',
    tags: ['read:user', 'write:orders'],
    note: '28.4k calls today · 84d remain',
  },
  {
    icon: Globe,
    iconTone: 'violet',
    name: 'Web Portal Public API Key',
    scope: 'Restricted to *.cloudcorp.internal',
    status: 'Origin Lock',
    statusTone: 'violet',
    keyLabel: 'PUB',
    keyValue: 'pk_live_41180bba3de499812ccf',
    tags: ['read:catalog'],
    note: 'Strict Host Header Validated',
  },
  {
    icon: ShieldCheck,
    iconTone: 'emerald',
    name: 'Microservice mTLS Cert',
    scope: 'Upstream Backend Mesh · Zero-Trust',
    status: 'mTLS Dual-Handshake',
    statusTone: 'emerald',
    keyLabel: 'SHA256',
    keyValue: 'E4:7B:91:A3:8C:F2:1D:60:88:94:8C:FA',
    tags: [],
    note: 'Upstream Backend Mesh · Zero-Trust',
  },
]

const POLICIES: Array<{
  id: string
  icon: typeof Shield
  title: string
  desc: string
  on: boolean
}> = [
  { id: 'cors', icon: RefreshCcw, title: 'Strict CORS Allowlist', desc: 'Explicit preflight wildcard suppression', on: true },
  { id: 'schema', icon: Braces, title: 'JSON Schema Enforcement', desc: 'Strict model validation on all POST/PUT', on: true },
  { id: 'jwt', icon: Fingerprint, title: 'RS256 JWT Verification', desc: 'Auto-rotating JWKS upstream verification', on: true },
  { id: 'ipwl', icon: Globe, title: 'Upstream IP Allowlist', desc: 'Drop non-VPC ingress at edge', on: false },
]

/* ------------------------------------------------------------ threat row */

function ThreatRow({ ev }: { ev: ThreatEvent }) {
  const tone: Tone = ev.code >= 429 ? 'amber' : 'rose'
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <span
        className={cn(
          'mt-0.5 flex h-8 w-10 shrink-0 items-center justify-center rounded-control font-mono text-[13px] font-semibold tnum',
          toneBgSoft[tone],
          toneText[tone],
        )}
      >
        {ev.code}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">
          <span className={toneText[tone]}>{ev.label}</span>
          <span className="text-dim"> · {ev.ip}</span>
        </p>
        <p className="truncate font-mono text-[11px] font-semibold text-muted">
          {ev.verb} <span className="font-normal text-dim">{ev.path}</span>
        </p>
      </div>
      <span className="mt-1 shrink-0 font-mono text-[10px] text-dim tnum">{ev.secondsAgo}s ago</span>
    </div>
  )
}

/* --------------------------------------------------------------- screen */

export function Gov() {
  const t = useTelemetry()
  const [policies, setPolicies] = useState(POLICIES)
  const [copied, setCopied] = useState<string | null>(null)
  const [issued, setIssued] = useState(false)

  const healthTone: Tone = t.healthIndex >= 99 ? 'emerald' : t.healthIndex >= 98 ? 'amber' : 'rose'
  const enforcing = policies.filter((p) => p.on).length

  const copy = (v: string) => {
    navigator.clipboard?.writeText(v)
    setCopied(v)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="space-y-5">
      {/* hero health card */}
      <Card className="shadow-glow-emerald">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-tertiary/15 text-tertiary-bright">
            <ShieldCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold tracking-tight-heading text-ink">Nexus Sentinel Shield</h1>
                <p className="mt-0.5 max-w-[220px] text-xs leading-4 text-muted sm:max-w-none">
                  Zero breaches detected across ingress nodes
                </p>
              </div>
              <div className="text-right">
                <span className="pill border border-tertiary/25 bg-tertiary/10 text-tertiary-bright">PROD-L9</span>
                <p className={cn('mt-1 text-2xl font-semibold leading-7 tnum', toneText[healthTone])}>
                  {t.healthIndex.toFixed(1)}%
                </p>
                <p className="stat-label">Health Index</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-border-subtle bg-elevated/50 p-3">
            <p className="flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-wider text-dim">
              WAF & DDoS Mitigation
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary-bright shadow-glow-emerald" />
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink">Active Protection</p>
            <p className="mt-0.5 font-mono text-[11px] text-tertiary-bright tnum">
              {t.wafNeutralized} payloads neutralized
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-elevated/50 p-3">
            <p className="flex items-center justify-between font-mono text-[9px] font-semibold uppercase tracking-wider text-dim">
              Rate Limit Gate
              <Shield size={10} className="text-primary-bright" />
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink tnum">
              {t.throttles.toLocaleString()} <span className="text-sm">Throttles</span>
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-primary-bright tnum">p99: 14ms response</p>
          </div>
        </div>
      </Card>

      {/* actions */}
      <div className="grid grid-cols-[1fr_auto] gap-2.5">
        <button
          className={cn('btn-primary h-11', issued && 'bg-tertiary hover:bg-tertiary-bright')}
          onClick={() => setIssued((v) => !v)}
        >
          <PlusCircle size={15} /> {issued ? 'Key Issued · Copied' : 'Issue API Key'}
        </button>
        <button className="btn-ghost h-11 px-4" onClick={() => copy('nx_live_99f24a87b3e100c6d9a24ec081b')}>
          <Fingerprint size={15} /> Rotate Keys
        </button>
      </div>

      {/* credentials */}
      <section>
        <SectionHeader
          icon={<KeyRound size={13} className="text-primary-bright" />}
          title="Active Credentials & Pools"
          right={<span className="font-mono text-[10px] uppercase tracking-wider text-dim">3 Managed Pools</span>}
          className="mb-3"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {CREDENTIALS.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.name}>
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-card', toneBgSoft[c.iconTone], toneText[c.iconTone])}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-[14px] font-semibold text-ink">{c.name}</h3>
                      <StatusPill label={c.status} tone={c.statusTone} pulse={c.statusTone === 'emerald'} />
                    </div>
                    <p className="truncate text-[11px] text-muted">{c.scope}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-control border border-border-subtle bg-canvas px-2.5 py-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary-bright">
                    {c.keyLabel}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted tnum">{c.keyValue}</span>
                  <button
                    onClick={() => copy(c.keyValue)}
                    className="shrink-0 text-dim transition-colors hover:text-ink"
                    aria-label="Copy key"
                  >
                    {copied === c.keyValue ? (
                      <CheckCircle2 size={13} className="text-tertiary-bright" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {c.tags.map((tag) => (
                    <span key={tag} className="rounded-control border border-border-subtle bg-elevated/60 px-1.5 py-0.5 font-mono text-[9px] text-muted">
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[9px] text-dim tnum">{c.note}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* policies */}
      <section>
        <SectionHeader
          icon={<Shield size={13} className="text-primary-bright" />}
          title="Gateway Rule Policies"
          right={<span className="font-mono text-[10px] uppercase tracking-wider text-tertiary-bright">{enforcing} Enforcing</span>}
          className="mb-3"
        />
        <Card padded={false} className="divide-y divide-border-subtle">
          {policies.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-control', p.on ? 'bg-secondary/15 text-secondary-bright' : 'bg-elevated text-dim')}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-dim">{p.desc}</p>
                </div>
                <Switch
                  on={p.on}
                  onChange={() =>
                    setPolicies((prev) => prev.map((x) => (x.id === p.id ? { ...x, on: !x.on } : x)))
                  }
                />
              </div>
            )
          })}
        </Card>
      </section>

      {/* threat feed */}
      <section>
        <SectionHeader
          icon={<span className="h-2 w-2 rounded-full bg-crit shadow-glow-rose" />}
          title="Live Ingress Threat Feed"
          right={
            <button
              onClick={() => t.setThreatPaused(!t.threatStreamPaused)}
              className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-bright hover:opacity-80"
            >
              {t.threatStreamPaused ? <Play size={11} /> : <Pause size={11} />}
              {t.threatStreamPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
          }
          className="mb-3"
        />
        <Card padded={false} className="divide-y divide-border-subtle">
          {t.threats.map((ev) => (
            <ThreatRow key={ev.id} ev={ev} />
          ))}
        </Card>
      </section>

      <p className="pb-2 pt-1 text-center font-mono text-[10px] uppercase tracking-widest text-dim">
        Sentinel Audit Log · WORM retention 400d
      </p>
    </div>
  )
}

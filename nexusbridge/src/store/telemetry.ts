import { create } from 'zustand'
import type { Tone } from '../theme/tokens'

/* ------------------------------------------------------------------ types */

export type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS' | 'gRPC'

export interface Trace {
  id: number
  verb: Verb
  path: string
  status: number
  statusLabel: string
  source: string
  destination: string
  latencyMs: number
}

export interface ThreatEvent {
  id: number
  code: number
  label: string
  ip: string
  verb: Verb
  path: string
  secondsAgo: number
  tone: Tone
}

export interface SwitchItem {
  id: string
  icon: 'shaping' | 'cache' | 'breaker'
  title: string
  subtitle: string
  on: boolean
  locked?: boolean
  badge?: string
  badgeTone?: Tone
}

interface Pool {
  name: string
  region: string
  cpu: number
  mem: number
  pods: string
  podsTone: Tone
}

/* ------------------------------------------------------------ randomizers */

let idSeq = 1000
const rnd = (min: number, max: number) => min + Math.random() * (max - min)
const nudge = (v: number, amt: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v + rnd(-amt, amt)))
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const ip = () =>
  `${Math.floor(rnd(11, 223))}.${Math.floor(rnd(0, 255))}.${Math.floor(rnd(0, 255))}.${Math.floor(rnd(1, 254))}`

const TRACE_POOL: Array<Omit<Trace, 'id' | 'latencyMs'>> = [
  { verb: 'GET', path: '/v2/pricing/catalog', status: 200, statusLabel: '200 OK', source: 'Next.js Web (US-East)', destination: 'srv-billing-prod-02' },
  { verb: 'POST', path: '/v1/auth/session/token', status: 201, statusLabel: '201 OK', source: 'iOS Native App (EU-West)', destination: 'auth-vault-replica-3' },
  { verb: 'GET', path: '/v3/telemetry/nodes', status: 304, statusLabel: '304 HIT', source: 'Partner SDK / Edge Client', destination: 'Nexus Edge Cache' },
  { verb: 'PUT', path: '/v1/ai/stream/prompt', status: 200, statusLabel: '200 OK', source: 'Next.js Web / Portal', destination: 'ai-inference-cluster' },
  { verb: 'GET', path: '/api/v2/users/me', status: 200, statusLabel: '200 OK', source: 'Android SDK (AP-South)', destination: 'srv-identity:5081' },
  { verb: 'POST', path: '/api/v2/payments/charge', status: 200, statusLabel: '200 OK', source: 'Web Checkout', destination: 'srv-billing:443' },
  { verb: 'DELETE', path: '/v1/sessions/stale', status: 204, statusLabel: '204 OK', source: 'Cron Janitor', destination: 'auth-vault-replica-1' },
  { verb: 'PATCH', path: '/v2/orders/flags', status: 429, statusLabel: '429 LIM', source: 'Partner SDK', destination: 'rate-limiter-edge' },
  { verb: 'GET', path: '/v1/ledger/daily', status: 502, statusLabel: '502 FLT', source: 'FinCore Sync', destination: 'ledger-mesh-internal' },
]

const THREAT_POOL: Array<Omit<ThreatEvent, 'id' | 'secondsAgo' | 'ip'>> = [
  { code: 403, label: 'SQLi Ingress Vector', verb: 'POST', path: '/v2/auth/oauth/token', tone: 'rose' },
  { code: 429, label: 'Bucket Exhausted', verb: 'GET', path: '/v1/telemetry/stream', tone: 'amber' },
  { code: 403, label: 'Geo-fence Violation', verb: 'GET', path: '/v1/ledger/export', tone: 'rose' },
  { code: 401, label: 'Expired JWT Replay', verb: 'POST', path: '/v1/ai/stream/prompt', tone: 'amber' },
  { code: 403, label: 'Botnet Signature Match', verb: 'GET', path: '/api/v2/users/enum', tone: 'rose' },
  { code: 429, label: 'Rate Gate Trip', verb: 'PUT', path: '/v2/orders/bulk', tone: 'amber' },
]

const STATUS_TONE = (code: number): Tone =>
  code >= 500 ? 'rose' : code >= 400 ? 'amber' : 'emerald'

function makeTrace(): Trace {
  const base = pick(TRACE_POOL)
  const latency =
    base.status >= 500
      ? rnd(400, 1200)
      : base.status === 304
        ? rnd(1, 4)
        : rnd(6, 90)
  return { ...base, id: idSeq++, latencyMs: Math.round(latency * 10) / 10 }
}

function makeThreat(): ThreatEvent {
  const base = pick(THREAT_POOL)
  return { ...base, id: idSeq++, ip: ip(), secondsAgo: 1 }
}

/** Payloads returned by the NexusBridge Cloudflare gateway worker. */
export interface GatewayMetrics {
  total: number
  errors: number
  throttles: number
  clientErrors: number
  p50: number
  p95: number
  p99: number
  rps: number
  successRate: number
}

export interface GatewayTrace {
  ts: number
  method: string
  path: string
  status: number
  ms: number
  ip: string
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 201: 'OK', 204: 'OK', 304: 'HIT', 400: 'BAD', 401: 'AUTH',
  403: 'DENY', 404: 'MISS', 429: 'LIM', 500: 'ERR', 502: 'FLT', 503: 'DOWN',
}

function statusLabel(code: number): string {
  return `${code} ${STATUS_TEXT[code] ?? ''}`.trim()
}

/* ------------------------------------------------------------------ store */

interface TelemetryState {
  // global traffic
  trafficTotal: number
  trafficTrend: number
  p95: number
  throughputReq: number
  bandwidthIn: number
  bandwidthOut: number
  bandwidthTotal: number
  sparkTraffic: number[]
  sparkLatency: number[]
  cacheHit: number

  // DAG node deps
  deps: { postgres: number; authIam: number; aiTensor: number }
  hopBackend: number
  hopGw: number
  hopClient: number
  meshUptime: number

  // gov
  healthIndex: number
  wafNeutralized: number
  throttles: number

  // endpoints
  qps: number
  p99: number
  successRate: number
  liveRoutes: number

  // mesh scaler
  clusterLoad: number
  pods: number
  replicaFloor: number
  redisHit: number
  dbLeased: number
  dbQueueMs: number
  pools: Pool[]

  // streams
  traces: Trace[]
  traceStreamPaused: boolean
  threats: ThreatEvent[]
  threatStreamPaused: boolean

  // switchboard
  switches: SwitchItem[]

  tick: () => void
  toggleSwitch: (id: string) => void
  setTracePaused: (v: boolean) => void
  setThreatPaused: (v: boolean) => void
  setReplicaFloor: (v: number) => void
  emergencyScaleOut: () => void
  emergencyFlushCache: () => void
  /** Replace mock state with real gateway worker telemetry. */
  ingestLive: (m: GatewayMetrics, traces: GatewayTrace[]) => void
}

const initialTraces = [makeTrace(), makeTrace(), makeTrace(), makeTrace(), makeTrace()]
const initialThreats = [makeThreat(), makeThreat(), makeThreat()].map((t, i) => ({
  ...t,
  secondsAgo: 3 + i * 8,
}))

export const useTelemetry = create<TelemetryState>((set, get) => ({
  trafficTotal: 42850,
  trafficTrend: 12.4,
  p95: 38.2,
  throughputReq: 42.8,
  bandwidthIn: 340,
  bandwidthOut: 512,
  bandwidthTotal: 852,
  sparkTraffic: Array.from({ length: 7 }, () => rnd(20, 90)),
  sparkLatency: Array.from({ length: 24 }, () => rnd(24, 48)),
  cacheHit: 88.4,

  deps: { postgres: 8.4, authIam: 2.8, aiTensor: 10.8 },
  hopBackend: 14,
  hopGw: 4,
  hopClient: 28,
  meshUptime: 99.98,

  healthIndex: 99.4,
  wafNeutralized: 312,
  throttles: 4120,

  qps: 38.4,
  p99: 24,
  successRate: 99.98,
  liveRoutes: 184,

  clusterLoad: 64,
  pods: 42,
  replicaFloor: 18,
  redisHit: 91.2,
  dbLeased: 142,
  dbQueueMs: 1.2,
  pools: [
    { name: 'Pool Alpha · EU-Central', region: 'eu', cpu: 48, mem: 62, pods: '8 Pods Healthy', podsTone: 'emerald' },
    { name: 'Pool Beta · US-East', region: 'us', cpu: 72, mem: 78, pods: '+2 Pods Queued', podsTone: 'amber' },
    { name: 'Pool Gamma · AP-South', region: 'ap', cpu: 34, mem: 41, pods: '6 Pods Healthy', podsTone: 'emerald' },
  ],

  traces: initialTraces,
  traceStreamPaused: false,
  threats: initialThreats,
  threatStreamPaused: false,

  switches: [
    { id: 'shaping', icon: 'shaping', title: 'Traffic Shaping', subtitle: 'Weighted round-robin & QoS', on: true },
    { id: 'cache', icon: 'cache', title: 'L7 Edge Cache', subtitle: 'Bypass / Armed (88.4% Hit)', on: true },
    { id: 'breaker', icon: 'breaker', title: 'Circuit Breakers', subtitle: '12 of 12 Closed (All Targets Resilient)', on: false, locked: true, badge: 'HEALTHY', badgeTone: 'emerald' },
  ],

  tick: () => {
    const s = get()
    const threats = s.threatStreamPaused
      ? s.threats
      : [makeThreat(), ...s.threats.map((t) => ({ ...t, secondsAgo: t.secondsAgo + Math.round(rnd(1, 3)) }))].slice(0, 8)
    const traces = s.traceStreamPaused
      ? s.traces
      : [makeTrace(), ...s.traces].slice(0, 8)

    set({
      trafficTotal: Math.round(s.trafficTotal + rnd(-220, 480)),
      trafficTrend: nudge(s.trafficTrend, 0.6, 4, 18),
      p95: Math.round(nudge(s.p95, 2.2, 26, 61) * 10) / 10,
      throughputReq: Math.round(nudge(s.throughputReq, 1.4, 34, 52) * 10) / 10,
      bandwidthIn: Math.round(nudge(s.bandwidthIn, 12, 280, 420)),
      bandwidthOut: Math.round(nudge(s.bandwidthOut, 16, 430, 620)),
      sparkTraffic: [...s.sparkTraffic.slice(1), rnd(20, 95)],
      sparkLatency: [...s.sparkLatency.slice(1), nudge(s.sparkLatency.at(-1) ?? 36, 6, 20, 60)],
      cacheHit: Math.round(nudge(s.cacheHit, 0.8, 82, 94) * 10) / 10,

      deps: {
        postgres: Math.round(nudge(s.deps.postgres, 0.8, 5, 14) * 10) / 10,
        authIam: Math.round(nudge(s.deps.authIam, 0.5, 1.5, 6) * 10) / 10,
        aiTensor: Math.round(nudge(s.deps.aiTensor, 1.6, 6, 26) * 10) / 10,
      },
      hopBackend: Math.round(nudge(s.hopBackend, 1.5, 9, 22)),
      hopGw: Math.round(nudge(s.hopGw, 0.6, 2, 8)),
      hopClient: Math.round(nudge(s.hopClient, 2.5, 18, 45)),

      healthIndex: Math.round(nudge(s.healthIndex, 0.15, 98.1, 99.9) * 10) / 10,
      wafNeutralized: s.wafNeutralized + Math.round(rnd(0, 3)),
      throttles: s.throttles + Math.round(rnd(0, 9)),

      qps: Math.round(nudge(s.qps, 0.9, 32, 44) * 10) / 10,
      p99: Math.round(nudge(s.p99, 2, 18, 38)),
      successRate: Math.round(nudge(s.successRate, 0.04, 99.5, 99.99) * 100) / 100,
      liveRoutes: s.liveRoutes + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0),

      clusterLoad: Math.round(nudge(s.clusterLoad, 2.5, 42, 88)),
      replicaFloor: s.replicaFloor,
      redisHit: Math.round(nudge(s.redisHit, 0.5, 86, 95.5) * 10) / 10,
      dbLeased: Math.min(200, Math.max(96, Math.round(nudge(s.dbLeased, 6, 96, 190)))),
      dbQueueMs: Math.round(nudge(s.dbQueueMs, 0.3, 0.6, 4.2) * 10) / 10,
      pools: s.pools.map((p) => ({
        ...p,
        cpu: Math.round(nudge(p.cpu, 4, 18, 92)),
        mem: Math.round(nudge(p.mem, 3, 24, 90)),
      })),

      threats,
      traces,
    })

    // derived: keep bandwidth total consistent
    set((st) => ({ bandwidthTotal: st.bandwidthIn + st.bandwidthOut }))
  },

  toggleSwitch: (id) =>
    set((s) => ({
      switches: s.switches.map((sw) => (sw.id === id && !sw.locked ? { ...sw, on: !sw.on } : sw)),
    })),
  setTracePaused: (v) => set({ traceStreamPaused: v }),
  setThreatPaused: (v) => set({ threatStreamPaused: v }),
  setReplicaFloor: (v) => set({ replicaFloor: v }),
  emergencyScaleOut: () => set((s) => ({ pods: s.pods + 5, replicaFloor: Math.min(60, s.replicaFloor + 2) })),
  emergencyFlushCache: () => set({ cacheHit: 4.2, redisHit: 3.1 }),

  ingestLive: (m, traces) =>
    set((s) => {
      const mapped: Trace[] = traces.slice(0, 8).map((t) => ({
        id: idSeq++,
        verb: (t.method as Verb) || 'GET',
        path: t.path.split('?')[0] || '/',
        status: t.status,
        statusLabel: statusLabel(t.status),
        source: t.ip,
        destination: 'sms2-api (origin)',
        latencyMs: Math.round(t.ms * 10) / 10,
      }))
      // live 4xx/5xx real events feed the threat stream
      const events: ThreatEvent[] = traces
        .filter((t) => t.status >= 400)
        .slice(0, 4)
        .map((t) => ({
          id: idSeq++,
          code: t.status,
          label: t.status === 429 ? 'Bucket Exhausted' : t.status >= 500 ? 'Upstream Fault' : 'Rejected Ingress',
          ip: t.ip,
          verb: (t.method as Verb) || 'GET',
          path: t.path.split('?')[0] || '/',
          secondsAgo: Math.max(0, Math.round((Date.now() - t.ts) / 1000)),
          tone: (t.status === 429 ? 'amber' : t.status >= 500 ? 'rose' : 'amber') as Tone,
        }))
      return {
        trafficTotal: m.total,
        p95: m.p95,
        p99: m.p99,
        successRate: m.successRate,
        throttles: m.throttles,
        throughputReq: m.rps,
        qps: m.rps,
        sparkLatency: [...s.sparkLatency.slice(1), m.p95 || 0],
        sparkTraffic: [...s.sparkTraffic.slice(1), Math.min(95, m.rps * 2)],
        traces: s.traceStreamPaused ? s.traces : mapped.length ? mapped : s.traces,
        threats: s.threatStreamPaused
          ? s.threats
          : events.length
            ? [...events, ...s.threats].slice(0, 8)
            : s.threats,
      }
    }),
}))

export { STATUS_TONE }

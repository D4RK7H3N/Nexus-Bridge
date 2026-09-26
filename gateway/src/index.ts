/**
 * NexusBridge Gateway — Cloudflare Worker
 *
 * A transparent reverse proxy in front of the DarkZ school-management API
 * (sms2-api.darkzhub.asia). It forwards every request to the origin,
 * records per-request telemetry, and exposes a small admin surface the
 * NexusBridge console consumes:
 *
 *   GET /__gateway/health   → gateway marker + liveness (JSON)
 *   GET /__gateway/metrics  → aggregate counters + latency percentiles
 *   GET /__gateway/traces   → ring buffer of the most recent requests
 *   everything else         → proxied through to ORIGIN
 *
 * NOTE: telemetry lives in per-isolate memory (resets on cold start and is
 * not globally consistent). Good enough for live observability; upgrade to
 * a Durable Object if you need exact global counters.
 */

export interface Env {
  ORIGIN: string
}

interface TraceRec {
  ts: number
  method: string
  path: string
  status: number
  ms: number
  ip: string
}

const MAX_TRACES = 200
const MAX_LATENCIES = 500
const MARKER = 'nexusbridge-gateway'

// NOTE: top-level Date.now() is unreliable in Workers (V8 snapshot time can
// be 0), so startedAt is lazily initialized on the first request.
const state = {
  startedAt: 0,
  total: 0,
  errors: 0, // 5xx
  throttles: 0, // 429
  clientErrors: 0, // other 4xx
  latencies: [] as number[],
  traces: [] as TraceRec[],
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return Math.round(sorted[idx] * 10) / 10
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Authorization, Content-Type, X-Requested-With, X-CSRFToken',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, init: ResponseInit, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
      ...(init.headers ?? {}),
    },
  })
}

function metricsPayload() {
  const sorted = [...state.latencies].sort((a, b) => a - b)
  const now = Date.now()
  const windowMs = 60_000
  const recent = state.traces.filter((t) => now - t.ts <= windowMs)
  const uptimeSec = Math.round((now - state.startedAt) / 1000)
  return {
    gateway: MARKER,
    total: state.total,
    errors: state.errors,
    throttles: state.throttles,
    clientErrors: state.clientErrors,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    rps: Math.round((recent.length / (windowMs / 1000)) * 10) / 10,
    successRate:
      state.total === 0
        ? 100
        : Math.round(((state.total - state.errors - state.throttles) / state.total) * 10_000) / 100,
    uptimeSec,
  }
}

async function handleAdmin(url: URL, origin: string | null): Promise<Response> {
  switch (url.pathname) {
    case '/__gateway/health':
      return json({ gateway: MARKER, status: 'ok', uptimeSec: Math.round((Date.now() - state.startedAt) / 1000) }, { status: 200 }, origin)
    case '/__gateway/metrics':
      return json(metricsPayload(), { status: 200 }, origin)
    case '/__gateway/traces':
      return json({ traces: state.traces.slice(0, 50) }, { status: 200 }, origin)
    default:
      return json({ error: 'unknown gateway endpoint' }, { status: 404 }, origin)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!state.startedAt) state.startedAt = Date.now()
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (url.pathname.startsWith('/__gateway/')) {
      return handleAdmin(url, origin)
    }

    // ---- proxy through to origin --------------------------------------
    const upstreamUrl = env.ORIGIN.replace(/\/+$/, '') + url.pathname + url.search
    const upstreamReq = new Request(upstreamUrl, request)
    upstreamReq.headers.set('X-Forwarded-Host', url.host)
    upstreamReq.headers.set('X-Gateway', MARKER)

    const t0 = Date.now()
    let upstreamResp: Response
    let status = 502
    try {
      upstreamResp = await fetch(upstreamReq)
      status = upstreamResp.status
    } catch {
      upstreamResp = new Response(JSON.stringify({ error: 'upstream unreachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const ms = Date.now() - t0

    // ---- record telemetry ----------------------------------------------
    state.total += 1
    if (status === 429) state.throttles += 1
    else if (status >= 500) state.errors += 1
    else if (status >= 400) state.clientErrors += 1
    state.latencies.push(ms)
    if (state.latencies.length > MAX_LATENCIES) state.latencies.splice(0, state.latencies.length - MAX_LATENCIES)
    state.traces.unshift({
      ts: Date.now(),
      method: request.method,
      path: url.pathname + url.search,
      status,
      ms,
      ip: request.headers.get('CF-Connecting-IP') ?? '0.0.0.0',
    })
    if (state.traces.length > MAX_TRACES) state.traces.length = MAX_TRACES

    // ---- return upstream response with CORS -----------------------------
    const resp = new Response(upstreamResp.body, upstreamResp)
    const cors = corsHeaders(origin)
    for (const [k, v] of Object.entries(cors)) resp.headers.set(k, v)
    resp.headers.set('X-Gateway-Latency-Ms', String(ms))
    return resp
  },
} satisfies ExportedHandler<Env>

# NexusBridge

**API Gateway & Observability Console for the DarkZ School Management System**

NexusBridge is a dark, developer-first control plane for managing the traffic between the
DarkZ SMS frontend (`sms.darkzhub.asia`) and its API backend (`sms2-api.darkzhub.asia`).
It consists of two deployable units in this monorepo:

```
┌────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────┐
│  School Frontend   │ ───▶ │  Cloudflare Gateway      │ ───▶ │  DarkZ API Backend   │
│  sms.darkzhub.asia │      │  (Worker, this repo)     │      │  sms2-api.darkzhub…  │
└────────────────────┘      └────────────┬─────────────┘      └──────────────────────┘
                                         │  /__gateway/metrics · /__gateway/traces
                                         ▼
                            ┌──────────────────────────┐
                            │  NexusBridge Console     │
                            │  (React app, this repo)  │
                            └──────────────────────────┘
```

---

## Repo contents

| Path | Description |
| --- | --- |
| `nexusbridge/` | The observability console — React 18 + TypeScript + Vite + Tailwind + Zustand |
| `gateway/` | The Cloudflare Worker reverse proxy with built-in telemetry |

## 1. Console (`nexusbridge/`)

A mobile-first, fully responsive gateway console with four sections:

- **Traffic** — topology DAG (Backend Mesh → NexusBridge Gateway → Client SDKs) with per-hop
  latency, live telemetry stat cards, bandwidth split, feature switchboard, and a live
  in-flight packet trace stream. Clicking any node/trace opens an inspector drawer
  (420px slide-over on desktop, modal sheet on smaller screens).
- **Endpoints** — ingress QPS / P99 / success-rate stat row, route search + protocol filters,
  route cards with 3-step pipeline anatomy, and a **Quick Route Probe** panel that sends real
  requests to the configured backend and renders the real JSON response (syntax-colored).
- **Mesh** — backend connector cards (language badges, upstream bindings, health %) with an
  integration form, plus an Auto-Scaler & Fleet view (cluster-load radial gauge, replica-floor
  slider, node-pool CPU/MEM bars, Redis/DB dependency bridges, emergency overrides).
- **Gov** — Nexus Sentinel Shield health card, credential pools with copyable masked keys,
  gateway rule policy toggles, and a live ingress threat feed (real 4xx/5xx when bound to
  the gateway).

### Layout behavior (single component tree, breakpoint-switched)

| Breakpoint | Behavior |
| --- | --- |
| ≥ 1280px | fixed 240px left nav rail, inspector = slide-over drawer |
| 768–1279px | top bar + bottom tab bar, inspector = modal sheet, 2-col grids |
| < 768px | bottom tab bar, DAG stacked vertically, route cards collapse to accordions |

### Design system

- Canvas `#090D16` / panel `#0F172A` / elevated `#1E293B`; borders `#1E293B` / `#334155`
- Cyan `#06B6D4` (gateway), violet `#8B5CF6` (middleware), emerald `#10B981` (healthy),
  amber `#F59E0B` (rate-limit), rose `#EF4444` (fault)
- Geist (UI) + JetBrains Mono (machine data, tabular figures); 4/8/12px radii;
  soft colored glows instead of drop shadows — per `nexus_gateway_console/DESIGN.md`

### Run it

```bash
cd nexusbridge
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build → dist/
```

### Backend binding

The console binds to **one live backend**: `https://sms2-api.darkzhub.asia` (default, set via
`VITE_API_BASE_URL` in `nexusbridge/.env`). Click the top-bar endpoint pill to retarget it at
runtime (accepts a full URL or a bare domain; persisted to localStorage). On boot the console
probes `/__gateway/health` → `/api/health` and reports `Gateway` / `Connected` / `Offline`.

## 2. Gateway (`gateway/`)

A transparent Cloudflare Worker reverse proxy that sits in the traffic path:

- Forwards every request to `ORIGIN` (method, headers, body preserved), reflects CORS origins,
  answers preflights.
- Records per-request telemetry (method, path, status, latency, client IP) in a ring buffer
  plus aggregate counters and p50/p95/p99 latency percentiles.
- Admin surface (consumed by the console):
  - `GET /__gateway/health` — liveness + gateway marker (JSON)
  - `GET /__gateway/metrics` — totals, error/throttle counts, percentiles, RPS, success rate
  - `GET /__gateway/traces` — last 50 requests
- Everything else is proxied through.

> Telemetry state is per-isolate memory (resets on cold start). For exact global counters,
> migrate the ring buffer to a Durable Object.

### Deploy it

```bash
cd gateway
npm install
npx wrangler login     # one-time Cloudflare auth
npm run deploy
```

Then attach a custom domain in the Cloudflare dashboard:
**Workers → nexusbridge-gateway → Settings → Triggers → Custom Domains → `gw.darkzhub.asia`**
(zone is already on Cloudflare, so DNS is automatic).

After deploy: point the console's endpoint pill at `gw.darkzhub.asia` and every screen
switches from simulated to **live** telemetry. To put the school frontend behind the
gateway, set its API base URL to `https://gw.darkzhub.asia` (keep
`sms2-api.darkzhub.asia` as the documented bypass/fallback).

## 3. Repository mirrors

This repository is mirrored to two remotes:

```bash
git push github main   # https://github.com/D4RK7H3N/Nexus-Bridge
git push gitlab main   # https://gitlab.com/DarkZhen/nexus-brigde-api
```

`.env` files, `node_modules`, build output, and the design-reference folders are gitignored.

## Security notes

- No credentials are committed. The only configured value is the public backend hostname.
- The gateway does not log request bodies — only metadata (method/path/status/latency/IP).
- Bearer tokens used in the Quick Route Probe stay in browser memory and are sent only to
  the configured backend over HTTPS.

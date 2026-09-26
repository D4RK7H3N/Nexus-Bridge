import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Backend endpoint configuration.
 *
 * Resolution order (first wins):
 *   1. In-app override (persisted to localStorage)
 *   2. VITE_API_BASE_URL build-time env var
 *   3. Default DarkZ school management backend (sms2-api.darkzhub.asia)
 *
 * The input accepts a full URL or a bare backend-owned domain — a scheme is
 * auto-prefixed (https, or http for localhost/loopback). The console talks
 * to exactly one backend: the configured DarkZ domain.
 */

export type ConnectionMode = 'mock' | 'live'
export type ConnectionStatus = 'mock' | 'connected' | 'unreachable' | 'checking'

/** DarkZ school management system — production gateway backend. */
export const DEFAULT_BACKEND = 'https://gw.darkzhub.asia'

/** Direct origin, kept as documented bypass/fallback. */
export const ORIGIN_BACKEND = 'https://sms2-api.darkzhub.asia'

/** Marker returned by the NexusBridge Cloudflare gateway worker. */
export const GATEWAY_MARKER = 'nexusbridge-gateway'

/**
 * Health probe paths, tried in order. The gateway marker endpoint is first:
 * a NexusBridge gateway answers it with a JSON marker, while a plain origin
 * either 404s or returns non-JSON, falling through to /api/health.
 */
const PROBE_PATHS = ['/__gateway/health', '/api/health', '/healthz', '/']

const ENV_DEFAULT =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_BACKEND

export function normalizeBackendUrl(raw: string): { url: string; host: string } | null {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^(localhost|127\.|0\.0\.0\.0|\[?::1)/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`
  try {
    const u = new URL(withScheme)
    if (!u.hostname) return null
    return { url: u.toString().replace(/\/+$/, ''), host: u.host }
  } catch {
    return null
  }
}

interface ConfigState {
  mode: ConnectionMode
  backendUrl: string // normalized
  status: ConnectionStatus
  /** true when the configured endpoint is a NexusBridge gateway worker */
  isGateway: boolean
  lastCheckedAt: number | null
  /** Backend-config modal visibility (shared: TopBar pill + Mesh Connect button) */
  configModalOpen: boolean
  openConfig: () => void
  closeConfig: () => void
  saveLive: (raw: string) => boolean
  testConnection: () => Promise<boolean>
  host: () => string
}

export const useConfig = create<ConfigState>()(
  persist(
    (set, get) => ({
      mode: 'live',
      backendUrl: normalizeBackendUrl(ENV_DEFAULT)?.url ?? DEFAULT_BACKEND,
      status: 'checking',
      isGateway: false,
      lastCheckedAt: null,
      configModalOpen: false,
      openConfig: () => set({ configModalOpen: true }),
      closeConfig: () => set({ configModalOpen: false }),

      saveLive: (raw) => {
        const parsed = normalizeBackendUrl(raw)
        if (!parsed) return false
        set({ mode: 'live', backendUrl: parsed.url, status: 'checking', isGateway: false })
        void get().testConnection()
        return true
      },

      testConnection: async () => {
        const { backendUrl } = get()
        if (!backendUrl) {
          set({ status: 'unreachable', lastCheckedAt: Date.now() })
          return false
        }
        set({ status: 'checking' })
        let detectedGateway = false
        for (const path of PROBE_PATHS) {
          const ctrl = new AbortController()
          const timeout = window.setTimeout(() => ctrl.abort(), 3000)
          try {
            // try CORS first (lets us read the body), fall back to no-cors
            // which still proves reachability via an opaque response
            try {
              const res = await fetch(`${backendUrl}${path}`, { signal: ctrl.signal })
              window.clearTimeout(timeout)
              if (res.ok) {
                let hasMarker = false
                try {
                  const body = (await res.clone().json()) as { gateway?: string }
                  hasMarker = body?.gateway === GATEWAY_MARKER
                } catch {
                  /* non-JSON (SPA fallback etc.) */
                }
                // the __gateway probe answered without a marker → the endpoint
                // is a plain origin, not a gateway; keep probing
                if (path === '/__gateway/health' && !hasMarker) continue
                detectedGateway = hasMarker
                set({ status: 'connected', isGateway: detectedGateway, lastCheckedAt: Date.now() })
                return true
              }
            } catch {
              const res = await fetch(`${backendUrl}${path}`, { signal: ctrl.signal, mode: 'no-cors' })
              window.clearTimeout(timeout)
              if (res && path !== '/__gateway/health') {
                set({ status: 'connected', isGateway: detectedGateway, lastCheckedAt: Date.now() })
                return true
              }
            }
          } catch {
            window.clearTimeout(timeout)
          }
        }
        set({ status: 'unreachable', isGateway: false, lastCheckedAt: Date.now() })
        return false
      },

      host: () => {
        const { backendUrl } = get()
        return (backendUrl && normalizeBackendUrl(backendUrl)?.host) || DEFAULT_BACKEND.replace('https://', '')
      },
    }),
    {
      name: 'nexusbridge-backend',
      partialize: (s) => ({ mode: s.mode, backendUrl: s.backendUrl }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // legacy mock sessions are upgraded to the live DarkZ backend
        if (state.mode === 'mock' || !state.backendUrl) {
          const parsed = normalizeBackendUrl(ENV_DEFAULT)
          if (parsed) {
            useConfig.setState({ mode: 'live', backendUrl: parsed.url })
          }
        }
        void state.testConnection()
      },
    },
  ),
)

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useTelemetry, type GatewayMetrics, type GatewayTrace } from '../../store/telemetry'
import { useConfig } from '../../store/configStore'
import { TopBar } from './TopBar'
import { NavRail } from './NavRail'
import { TabBar } from './TabBar'

/**
 * One responsive shell:
 *  - desktop ≥1280px → fixed 240px left NavRail, no bottom bar
 *  - tablet/mobile     → TopBar on top, bottom TabBar (<1280px)
 *
 * Telemetry loop: when the configured endpoint is a NexusBridge gateway
 * worker, poll /__gateway/metrics + /__gateway/traces every ~2s and feed
 * the store; otherwise run the built-in mock tick.
 */
export function Shell() {
  const bp = useBreakpoint()
  const tick = useTelemetry((s) => s.tick)

  useEffect(() => {
    let cancelled = false
    const id = window.setInterval(async () => {
      const cfg = useConfig.getState()
      if (cfg.isGateway && cfg.status === 'connected') {
        try {
          const [mRes, tRes] = await Promise.all([
            fetch(`${cfg.backendUrl}/__gateway/metrics`),
            fetch(`${cfg.backendUrl}/__gateway/traces`),
          ])
          if (!mRes.ok || !tRes.ok) throw new Error('gateway telemetry fetch failed')
          const metrics = (await mRes.json()) as GatewayMetrics
          const traceBody = (await tRes.json()) as { traces: GatewayTrace[] }
          if (!cancelled) {
            useTelemetry.getState().ingestLive(metrics, traceBody.traces ?? [])
          }
          return
        } catch {
          /* fall through to mock tick on any failure */
        }
      }
      if (!cancelled) tick()
    }, 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [tick])

  return (
    <div className="min-h-screen">
      <TopBar bp={bp} />
      {bp === 'desktop' && <NavRail />}
      <main
        className={
          bp === 'desktop'
            ? 'ml-60 px-6 pb-10 pt-20'
            : bp === 'tablet'
              ? 'px-5 pb-24 pt-20'
              : 'px-4 pb-24 pt-[72px]'
        }
      >
        <div className="mx-auto w-full max-w-app">
          <Outlet />
        </div>
      </main>
      {bp !== 'desktop' && <TabBar />}
    </div>
  )
}

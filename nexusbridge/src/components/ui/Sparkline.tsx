import { useId } from 'react'
import type { Tone } from '../../theme/tokens'
import { toneStroke } from './tone'

/** Hand-rolled SVG area sparkline — smooth path, gradient fill. */
export function Sparkline({
  data,
  tone = 'cyan',
  width = 120,
  height = 36,
  fill = true,
}: {
  data: number[]
  tone?: Tone
  width?: number
  height?: number
  fill?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const stroke = toneStroke[tone]
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 6)] as const)

  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  const areaD = `${d} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaD} fill={`url(#sg-${id})`} className="transition-all duration-700" />}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  )
}

/** Column micro-bars used in the mobile telemetry card. */
export function MicroBars({ data, tone = 'cyan', height = 28 }: { data: number[]; tone?: Tone; height?: number }) {
  const stroke = toneStroke[tone]
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <span
          key={i}
          className="w-3 rounded-[2px] transition-all duration-700"
          style={{
            height: `${Math.max(18, (v / max) * 100)}%`,
            background: stroke,
            opacity: 0.25 + (0.75 * (i + 1)) / data.length,
          }}
        />
      ))}
    </div>
  )
}

import type { Tone } from '../../theme/tokens'
import { toneStroke } from './tone'

/** SVG radial gauge ring with animated stroke-dashoffset. */
export function RadialGauge({
  value,
  size = 84,
  strokeWidth = 7,
  tone = 'cyan',
  label,
}: {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  tone?: Tone
  label?: string
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1E293B" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={toneStroke[tone]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s' }}
        />
      </svg>
      {label && (
        <span className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className="text-sm font-semibold text-ink tnum">{label}</span>
        </span>
      )}
    </div>
  )
}

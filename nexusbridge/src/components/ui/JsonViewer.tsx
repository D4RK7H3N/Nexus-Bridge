import type { ReactNode } from 'react'

/**
 * Syntax-colored JSON viewer.
 * keys slate-gray · strings emerald · numbers/booleans amber · null rose
 */
export function colorizeJson(value: unknown, indent = 0, keyPrefix = 'r'): ReactNode[] {
  const pad = '  '.repeat(indent)
  const padIn = '  '.repeat(indent + 1)
  const nodes: ReactNode[] = []
  let k = 0

  if (value === null) {
    nodes.push(<span key={`${keyPrefix}-n${k++}`} className="text-crit-bright">null</span>)
    return nodes
  }
  if (typeof value === 'string') {
    nodes.push(
      <span key={`${keyPrefix}-s${k++}`} className="text-tertiary-bright">
        "{value}"
      </span>,
    )
    return nodes
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    nodes.push(
      <span key={`${keyPrefix}-b${k++}`} className="text-warn-bright">
        {String(value)}
      </span>,
    )
    return nodes
  }
  if (Array.isArray(value)) {
    nodes.push(<span key={`${keyPrefix}-o${k++}`}>[</span>)
    value.forEach((item, i) => {
      nodes.push(<br key={`${keyPrefix}-br${k++}`} />)
      nodes.push(<span key={`${keyPrefix}-p${k++}`}>{padIn}</span>)
      nodes.push(...colorizeJson(item, indent + 1, `${keyPrefix}-${i}`))
      if (i < value.length - 1) nodes.push(<span key={`${keyPrefix}-c${k++}`}>,</span>)
    })
    nodes.push(<br key={`${keyPrefix}-br${k++}`} />)
    nodes.push(<span key={`${keyPrefix}-p${k++}`}>{pad}</span>)
    nodes.push(<span key={`${keyPrefix}-x${k++}`}>]</span>)
    return nodes
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    nodes.push(<span key={`${keyPrefix}-o${k++}`}>{'{'}</span>)
    entries.forEach(([key, val], i) => {
      nodes.push(<br key={`${keyPrefix}-br${k++}`} />)
      nodes.push(<span key={`${keyPrefix}-p${k++}`}>{padIn}</span>)
      nodes.push(
        <span key={`${keyPrefix}-k${k++}`} className="text-muted">
          "{key}"
        </span>,
      )
      nodes.push(<span key={`${keyPrefix}-cl${k++}`}>: </span>)
      nodes.push(...colorizeJson(val, indent + 1, `${keyPrefix}-${key}`))
      if (i < entries.length - 1) nodes.push(<span key={`${keyPrefix}-c${k++}`}>,</span>)
    })
    nodes.push(<br key={`${keyPrefix}-br${k++}`} />)
    nodes.push(<span key={`${keyPrefix}-p${k++}`}>{pad}</span>)
    nodes.push(<span key={`${keyPrefix}-x${k++}`}>{'}'}</span>)
    return nodes
  }
  return nodes
}

export function JsonViewer({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-control bg-canvas p-3 font-mono text-xs leading-5 text-ink">
      {colorizeJson(value)}
    </pre>
  )
}

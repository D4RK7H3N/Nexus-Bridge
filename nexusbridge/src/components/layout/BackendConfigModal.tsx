import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Globe, Link2, Loader2, X, XCircle } from 'lucide-react'
import { useConfig, normalizeBackendUrl, DEFAULT_BACKEND } from '../../store/configStore'

/**
 * Backend connection settings — reachable from the TopBar endpoint pill.
 * The console binds to exactly one live backend: the DarkZ school
 * management domain (default sms2-api.darkzhub.asia).
 */
export function BackendConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cfg = useConfig()
  const [input, setInput] = useState(cfg.backendUrl)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setInput(cfg.backendUrl)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const preview = normalizeBackendUrl(input)
  const checking = cfg.status === 'checking'

  const save = () => {
    if (!preview) {
      setError(`Enter a valid backend URL or domain, e.g. ${DEFAULT_BACKEND}`)
      return
    }
    cfg.saveLive(input)
    onClose()
  }

  // The modal is portaled to <body>: the TopBar's backdrop-filter would
  // otherwise trap this fixed-position dialog inside the header.
  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-canvas/70 backdrop-blur-sm" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3">
        <div
          role="dialog"
          aria-label="Backend connection settings"
          className="card-elevated pointer-events-auto w-full max-w-[420px] animate-slide-up border-border-strong p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/15 text-primary-bright">
                <Link2 size={16} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Backend Connection</h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-dim">
                  DarkZ Management · Live Gateway
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-control border border-border-subtle text-muted hover:bg-subtle hover:text-ink"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-4">
            <p className="stat-label mb-1.5">Backend URL or Owned Domain</p>
            <div className="flex items-center gap-2 rounded-control border border-border-subtle bg-canvas px-3 focus-within:border-primary focus-within:shadow-[0_0_0_1px_#06B6D4]">
              <Globe size={13} className="shrink-0 text-dim" />
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setError('')
                }}
                placeholder={DEFAULT_BACKEND}
                className="h-9 min-w-0 flex-1 bg-transparent font-mono text-xs text-ink placeholder:text-dim"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
            {preview ? (
              <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-tertiary-bright">
                <CheckCircle2 size={11} /> Resolves to {preview.url}
              </p>
            ) : (
              <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-crit-bright">
                <XCircle size={11} /> {error || 'Not a valid URL or domain'}
              </p>
            )}
            <p className="mt-2 text-[11px] leading-4 text-dim">
              Bare domains default to <span className="font-mono text-muted">https://</span>. Health probe:{' '}
              <span className="font-mono text-muted">GET /api/health</span> (falls back to /healthz, /) with a
              3s timeout.
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <button className="btn-primary h-10 flex-1" onClick={save} disabled={checking}>
              {checking ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Save & Verify Handshake
            </button>
            <button className="btn-ghost h-10" onClick={onClose}>
              Cancel
            </button>
          </div>

          <p className="mt-3 border-t border-border-subtle pt-3 font-mono text-[9px] uppercase tracking-wider text-dim">
            Default: {DEFAULT_BACKEND.replace('https://', '')} · build-time via VITE_API_BASE_URL
          </p>
        </div>
      </div>
    </>,
    document.body,
  )
}

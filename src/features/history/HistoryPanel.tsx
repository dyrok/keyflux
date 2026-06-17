import { Trash2, Download } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Sparkline } from '../../components/Sparkline'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { LAYOUT_IDS } from '../../data/layouts'
import { exportSessionJson } from '../../lib/export'
import { formatDate, formatDuration } from '../../lib/format'

export function HistoryPanel() {
  const open = useKeyFluxStore((s) => s.historyOpen)
  const close = useKeyFluxStore((s) => s.setHistoryOpen)
  const history = useKeyFluxStore((s) => s.history)
  const bests = useKeyFluxStore((s) => s.bests)
  const clearHistory = useKeyFluxStore((s) => s.clearHistory)

  return (
    <Modal open={open} onClose={() => close(false)} ariaLabel="Session history" className="max-w-2xl">
      <div className="max-h-[86vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">History</h2>
          {history.length > 0 && (
            <Button variant="danger" size="sm" onClick={clearHistory}>
              <Trash2 size={13} /> Clear
            </Button>
          )}
        </div>

        {/* per-layout bests */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {LAYOUT_IDS.map((id) => (
            <div key={id} className="rounded-xl border border-border bg-surface-2 p-3">
              <div className="label mb-1">{id}</div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-semibold tabular text-text-primary">
                  {bests[id] ? Math.round(bests[id]!.wpm) : '—'}
                </span>
                <span className="font-mono text-[11px] text-text-muted">best wpm</span>
              </div>
            </div>
          ))}
        </div>

        <div className="label mb-2">Recent sessions</div>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-[13px] text-text-faint">
            No sessions yet — complete a run to build your history.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface-1 p-3 hover:border-border-strong"
              >
                <div className="w-28 shrink-0">
                  <div className="font-mono text-[11px] text-text-muted">{formatDate(s.date)}</div>
                  <div className="mt-0.5 text-[12px] font-medium text-text-secondary">
                    {s.layout.toUpperCase()}
                    {s.simulate ? ' · sim' : ''}
                  </div>
                </div>
                <div className="flex flex-1 items-center gap-5">
                  <Stat label="wpm" value={Math.round(s.wpm)} tone="text-cyan" />
                  <Stat label="acc" value={`${s.accuracy.toFixed(0)}%`} tone="text-emerald" />
                  <Stat label="cons" value={`${Math.round(s.consistency)}%`} tone="text-amber" />
                  <Stat label="time" value={formatDuration(s.durationMs)} />
                </div>
                <Sparkline values={s.wpmSeries.map((p) => p.wpm)} width={90} height={30} />
                <button
                  onClick={() => exportSessionJson(s)}
                  className="focus-ring grid h-7 w-7 place-items-center rounded-lg text-text-muted hover:bg-surface-2 hover:text-text-primary"
                  aria-label="Export session"
                >
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">{label}</span>
      <span className={`font-mono text-sm font-semibold tabular ${tone ?? 'text-text-secondary'}`}>{value}</span>
    </div>
  )
}

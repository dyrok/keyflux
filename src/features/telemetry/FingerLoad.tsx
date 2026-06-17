import { FINGERS } from '../../data/fingers'
import type { FingerLoad as FingerLoadData } from '../../types'
import { cn } from '../../lib/cn'

export function FingerLoad({ loads, className }: { loads: FingerLoadData[]; className?: string }) {
  const byId = new Map(loads.map((l) => [l.finger, l]))
  const max = Math.max(1, ...loads.map((l) => l.presses))
  const left = loads.filter((l) => l.hand === 'left').reduce((a, l) => a + l.presses, 0)
  const right = loads.filter((l) => l.hand === 'right').reduce((a, l) => a + l.presses, 0)
  const total = Math.max(1, left + right)
  const leftPct = (left / total) * 100

  return (
    <div className={cn('rounded-xl border border-border bg-surface-1 p-3', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Finger load</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">
          {Math.round(leftPct)}/{Math.round(100 - leftPct)} L·R
        </span>
      </div>

      {/* per-finger bars */}
      <div className="flex items-end justify-between gap-1.5" style={{ height: 64 }}>
        {FINGERS.map((f) => {
          const l = byId.get(f.id)
          const presses = l?.presses ?? 0
          const errs = l?.errors ?? 0
          const h = (presses / max) * 100
          const errShare = presses > 0 ? errs / presses : 0
          return (
            <div key={f.id} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${f.label}: ${presses} presses, ${errs} errors`}>
              <div className="relative w-full flex-1 overflow-hidden rounded-[3px] bg-surface-inset" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div
                  className="w-full rounded-[3px] bg-cyan/60 transition-all"
                  style={{ height: `${Math.max(2, h)}%` }}
                >
                  {errShare > 0 && (
                    <div className="w-full rounded-t-[3px] bg-crimson" style={{ height: `${errShare * 100}%` }} />
                  )}
                </div>
              </div>
              <span className="font-mono text-[9px] text-text-faint">{f.short}</span>
            </div>
          )
        })}
      </div>

      {/* hand balance */}
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-surface-inset">
        <div className="h-full bg-cyan/50" style={{ width: `${leftPct}%` }} />
        <div className="h-full bg-emerald/50" style={{ width: `${100 - leftPct}%` }} />
      </div>
    </div>
  )
}

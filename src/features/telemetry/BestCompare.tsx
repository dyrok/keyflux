import { Trophy } from 'lucide-react'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { cn } from '../../lib/cn'

export function BestCompare() {
  const layout = useKeyFluxStore((s) => s.prefs.layout)
  const best = useKeyFluxStore((s) => s.bests[layout])
  const status = useKeyFluxStore((s) => s.status)
  const liveWpm = useKeyFluxStore((s) => s.live.wpm)
  const lastWpm = useKeyFluxStore((s) => s.lastSummary?.wpm ?? 0)

  const current = status === 'finished' ? lastWpm : liveWpm
  const bestWpm = best?.wpm ?? 0
  const scaleMax = Math.max(bestWpm, current, 1)
  const delta = current - bestWpm

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Current vs best</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-text-faint">
          <Trophy size={11} /> {layout}
        </span>
      </div>

      {best ? (
        <div className="flex flex-col gap-2">
          <Bar label="now" value={current} max={scaleMax} tone="cyan" />
          <Bar label="best" value={bestWpm} max={scaleMax} tone="amber" />
          <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
            <span className="text-text-faint">delta</span>
            <span className={cn('tabular', delta >= 0 ? 'text-emerald' : 'text-crimson')}>
              {delta >= 0 ? '+' : ''}
              {delta.toFixed(1)} wpm
            </span>
          </div>
        </div>
      ) : (
        <div className="py-3 text-center text-[12px] text-text-faint">
          Finish a run to set your first {layout.toUpperCase()} record
        </div>
      )}
    </div>
  )
}

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'cyan' | 'amber' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-[10px] uppercase tracking-wide text-text-faint">{label}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-[4px] bg-surface-inset">
        <div
          className={cn('h-full rounded-[4px] transition-[width] duration-300', tone === 'cyan' ? 'bg-cyan/55' : 'bg-amber/55')}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="w-9 text-right font-mono text-[12px] tabular text-text-secondary">{Math.round(value)}</span>
    </div>
  )
}

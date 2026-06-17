import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import type { WpmSample } from '../../types'

function ghostCharsAt(series: WpmSample[], t: number): number {
  if (series.length === 0) return 0
  if (t <= series[0].t) return series[0].chars
  const last = series[series.length - 1]
  if (t >= last.t) return last.chars
  // linear interpolation between bracketing samples
  for (let i = 1; i < series.length; i++) {
    if (series[i].t >= t) {
      const a = series[i - 1]
      const b = series[i]
      const f = (t - a.t) / Math.max(1, b.t - a.t)
      return a.chars + (b.chars - a.chars) * f
    }
  }
  return last.chars
}

/** A faint "ghost" rail showing where your best run was at this elapsed time. */
export function GhostRail() {
  const ghost = useKeyFluxStore((s) => s.prefs.ghost)
  const layout = useKeyFluxStore((s) => s.prefs.layout)
  const best = useKeyFluxStore((s) => s.bests[layout])
  const status = useKeyFluxStore((s) => s.status)
  const elapsed = useKeyFluxStore((s) => s.live.elapsedMs)
  const length = useKeyFluxStore((s) => s.targetText.length)
  const myProgress = useKeyFluxStore((s) => s.live.progress)

  if (!ghost || !best || status !== 'running' || length === 0) return null

  const ghostChars = ghostCharsAt(best.wpmSeries, elapsed)
  const ghostProgress = Math.min(1, ghostChars / length)
  const ahead = myProgress >= ghostProgress

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">ghost</span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <div
          className="absolute top-0 h-full w-[2px] rounded-full bg-text-faint transition-[left] duration-200"
          style={{ left: `${(ghostProgress * 100).toFixed(1)}%` }}
        />
      </div>
      <span
        className={`font-mono text-[10px] tabular ${ahead ? 'text-emerald' : 'text-amber'}`}
      >
        {ahead ? '+' : '−'}
        {Math.abs(Math.round((myProgress - ghostProgress) * length))}
      </span>
    </div>
  )
}

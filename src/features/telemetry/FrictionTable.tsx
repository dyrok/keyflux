import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import type { KeyStat } from '../../types'
import { cn } from '../../lib/cn'

function Row({ stat }: { stat: KeyStat }) {
  const miss = (1 - stat.successRate) * 100
  return (
    <tr className="border-b border-border-subtle last:border-0 hover:bg-surface-2/60">
      <td className="tnr-12 px-3 py-1.5 text-text-primary">{stat.label}</td>
      <td className="tnr-12 tabular px-3 py-1.5 text-right text-text-secondary">{stat.presses}</td>
      <td className="px-3 py-1.5">
        <div className="flex items-center justify-end gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-[3px]"
            style={{ backgroundColor: `hsl(var(--accent-crimson) / ${Math.max(0.12, stat.friction).toFixed(2)})` }}
            aria-hidden
          />
          <span className="tnr-12 tabular text-right text-text-secondary">{miss.toFixed(0)}%</span>
        </div>
      </td>
      <td className="tnr-12 tabular px-3 py-1.5 text-right text-text-muted">
        {stat.avgDwell > 0 ? Math.round(stat.avgDwell) : '—'}
      </td>
    </tr>
  )
}

export function FrictionTable({ stats, className }: { stats?: KeyStat[]; className?: string }) {
  const liveStats = useKeyFluxStore((s) => s.liveKeyStats)
  const data = (stats ?? liveStats).filter((s) => s.presses > 0).slice(0, 10)

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-surface-1', className)}>
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-2 px-3 py-2">
        <span className="label">Per-key friction</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">top {data.length}</span>
      </div>
      {data.length === 0 ? (
        <div className="px-3 py-6 text-center text-[12px] text-text-faint">Type to surface friction hotspots</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="tnr-12 px-3 py-1.5 text-left text-text-muted">Key</th>
              <th className="tnr-12 px-3 py-1.5 text-right text-text-muted">Hits</th>
              <th className="tnr-12 px-3 py-1.5 text-right text-text-muted">Miss</th>
              <th className="tnr-12 px-3 py-1.5 text-right text-text-muted">ms</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <Row key={s.code} stat={s} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

import { useMemo } from 'react'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { Chip } from '../../components/Chip'
import { Sparkline } from '../../components/Sparkline'
import { MetricCard } from './MetricCard'
import { BestCompare } from './BestCompare'
import { FrictionTable } from './FrictionTable'
import { EventLedgerStream } from './EventLedgerStream'
import { formatDuration } from '../../lib/format'

function StatusChip() {
  const status = useKeyFluxStore((s) => s.status)
  if (status === 'running') return <Chip tone="cyan" dot pulse>Live</Chip>
  if (status === 'finished') return <Chip tone="emerald" dot>Done</Chip>
  return <Chip tone="neutral" dot>Idle</Chip>
}

export function TelemetryHUD() {
  const live = useKeyFluxStore((s) => s.live)
  const series = useKeyFluxStore((s) => s.wpmSeries)
  const layout = useKeyFluxStore((s) => s.prefs.layout)

  const sparkValues = useMemo(() => series.map((s) => s.wpm), [series])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label">Telemetry</span>
        <StatusChip />
      </div>

      {/* hero WPM */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between">
          <span className="label">Words / min</span>
          <span className="font-mono text-[11px] text-text-muted">
            raw <span className="tabular text-text-secondary">{Math.round(live.rawWpm)}</span>
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <AnimatedNumber value={live.wpm} className="font-mono text-[2.6rem] font-semibold leading-none tabular text-text-primary" />
            <span className="font-mono text-[13px] text-text-muted">wpm</span>
          </div>
          <Sparkline values={sparkValues.length ? sparkValues : [0]} width={130} height={40} />
        </div>
      </div>

      {/* metric grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Accuracy" value={live.accuracy} dp={1} unit="%" tone="emerald" />
        <MetricCard label="Consistency" value={live.consistency} dp={0} unit="%" tone="amber" />
        <MetricCard label="Time" value={formatDuration(live.elapsedMs)} animate={false} tone="cyan" />
        <MetricCard label="Keystrokes" value={live.totalKeystrokes} tone="neutral" />
        <MetricCard label="Errors" value={live.incorrectKeystrokes} tone="crimson" sub={`${live.backspaces} backspaces`} />
        <MetricCard label="Layout" value={layout.toUpperCase()} animate={false} tone="neutral" sub="active" />
      </div>

      <BestCompare />
      <FrictionTable />
      <EventLedgerStream />
    </div>
  )
}

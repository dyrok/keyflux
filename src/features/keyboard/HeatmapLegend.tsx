import { SegmentedControl } from '../../components/SegmentedControl'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import type { HeatmapMode } from '../../types'

const MODE_OPTIONS: { value: HeatmapMode; label: string; title: string }[] = [
  { value: 'error', label: 'Error', title: 'Friction-weighted error rate' },
  { value: 'usage', label: 'Usage', title: 'How often each key is pressed' },
  { value: 'latency', label: 'Latency', title: 'Average dwell + transition time' },
]

const LABELS: Record<HeatmapMode, string> = {
  error: 'low miss → high miss',
  usage: 'rare → frequent',
  latency: 'fast → slow',
}

export function HeatmapLegend() {
  const mode = useKeyFluxStore((s) => s.prefs.heatmapMode)
  const setMode = useKeyFluxStore((s) => s.setHeatmapMode)
  const enabled = useKeyFluxStore((s) => s.prefs.heatmapEnabled)
  const toggleHeatmap = useKeyFluxStore((s) => s.toggleHeatmap)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="label">Heatmap</span>
        <SegmentedControl
          size="sm"
          ariaLabel="Heatmap mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={(m) => {
            setMode(m)
            if (!enabled) toggleHeatmap()
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">{LABELS[mode]}</span>
        <span
          className="h-2.5 w-24 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--surface-3)) 0%, hsl(var(--accent-crimson)/0.28) 55%, hsl(var(--accent-crimson)/0.7) 100%)',
          }}
          aria-hidden
        />
        <button
          onClick={toggleHeatmap}
          className="focus-ring font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text-secondary"
        >
          {enabled ? 'on' : 'off'}
        </button>
      </div>
    </div>
  )
}

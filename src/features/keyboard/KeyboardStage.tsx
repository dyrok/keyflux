import { LAYOUTS } from '../../data/layouts'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { KeyboardRow } from './KeyboardRow'
import { HeatmapLegend } from './HeatmapLegend'

/**
 * The keyboard centerpiece. Subscribes only to cold-ish config (layout, keycode
 * mode, heatmap toggle); individual keycaps subscribe to their own hot state, so
 * pressing keys never re-renders the stage.
 */
export function KeyboardStage() {
  const layoutId = useKeyFluxStore((s) => s.prefs.layout)
  const showKeycodes = useKeyFluxStore((s) => s.prefs.showKeycodes)
  const heatmapEnabled = useKeyFluxStore((s) => s.prefs.heatmapEnabled)
  const layout = LAYOUTS[layoutId]

  return (
    <section
      aria-label="Virtual keyboard"
      className="w-full rounded-2xl border border-border bg-surface-1 p-4 shadow-card sm:p-5"
    >
      <div className="-mx-2 overflow-x-auto px-2 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <div
          className="mx-auto flex w-full min-w-[540px] max-w-[920px] flex-col gap-[var(--kg)]"
          style={
            {
              '--ku': 'clamp(32px, 5.4vw, 46px)',
              '--kg': '6px',
            } as React.CSSProperties
          }
        >
          {layout.rows.map((row) => (
            <KeyboardRow
              key={row.label}
              row={row}
              showKeycodes={showKeycodes}
              heatmapEnabled={heatmapEnabled}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-[920px] border-t border-border-subtle pt-4">
        <HeatmapLegend />
      </div>
    </section>
  )
}

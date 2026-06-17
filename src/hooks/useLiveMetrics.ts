import { useEffect } from 'react'
import { useEngine } from '../features/typing/engineContext'
import { useHeatmapStore } from '../store/heatmapStore'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

const METRIC_INTERVAL = 80 // ~12 Hz
const HEAT_INTERVAL = 500 // ~2 Hz

/**
 * The single rAF pump. While a session is running it derives live metrics (~12 Hz)
 * and the heatmap (~2 Hz) and is the ONLY thing that writes reactive metric state.
 * No metric math runs in key handlers. Renders nothing.
 */
export function useLiveMetrics() {
  const engine = useEngine()
  const status = useKeyFluxStore((s) => s.status)

  useEffect(() => {
    if (status !== 'running') return
    let raf = 0
    let lastMetric = 0
    let lastHeat = 0

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!engine.isRunning()) return

      if (now - lastMetric >= METRIC_INTERVAL) {
        lastMetric = now
        const live = engine.tick(now)
        if (live) {
          const store = useKeyFluxStore.getState()
          store.commitLive(live, engine.getSeries())
          store.commitEvents(engine.getRecentEvents())
        }
      }

      if (now - lastHeat >= HEAT_INTERVAL) {
        lastHeat = now
        const store = useKeyFluxStore.getState()
        if (store.prefs.heatmapEnabled) {
          useHeatmapStore.getState().commit(engine.computeHeat())
        }
        store.commitKeyStats(engine.computeKeyStats().slice(0, 14))
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [engine, status])
}

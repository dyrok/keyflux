import { useCallback, useSyncExternalStore } from 'react'
import { cursorStore } from '../store/cursorStore'
import { useHeatmapStore } from '../store/heatmapStore'
import { pressStore } from '../store/pressStore'

/**
 * Fine-grained per-keycap state. Each subscription is scalar and targeted, so a
 * keypress (or cursor move, or heat update) re-renders only the affected keycap.
 */
export function useKeycapState(code: string) {
  const subPress = useCallback((cb: () => void) => pressStore.subscribe(code, cb), [code])
  const getPress = useCallback(() => pressStore.getSnapshot(code), [code])
  const pressed = useSyncExternalStore(subPress, getPress)

  const subNext = useCallback((cb: () => void) => cursorStore.subscribeNext(code, cb), [code])
  const getNext = useCallback(() => cursorStore.isNext(code), [code])
  const isNext = useSyncExternalStore(subNext, getNext)

  const heat = useHeatmapStore((s) => s.intensity[code] ?? 0)

  return { pressed, isNext, heat }
}

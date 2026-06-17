import { useCallback, useSyncExternalStore } from 'react'
import { cursorStore, type CharStatus } from '../store/cursorStore'

/** Subscribe a single character to its own status — targeted, O(1) per keystroke. */
export function useCharStatus(index: number): CharStatus {
  const sub = useCallback((cb: () => void) => cursorStore.subscribeIndex(index, cb), [index])
  const get = useCallback(() => cursorStore.statusOf(index), [index])
  return useSyncExternalStore(sub, get)
}

/** Subscribe to the live cursor index (caret, progress, autoscroll). */
export function useCursorIndex(): number {
  return useSyncExternalStore(cursorStore.subscribeCursor, cursorStore.getCursor)
}

import { useEffect } from 'react'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

/**
 * Global shortcuts that can't collide with typing. We deliberately avoid bare
 * letters (they'd be ambiguous with the test input). Tab restarts when idle,
 * Enter restarts when finished, ⌘/Ctrl+K opens the palette, Esc closes overlays.
 */
export function useHotkeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = useKeyFluxStore.getState()
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        s.setPaletteOpen(!s.paletteOpen)
        return
      }

      if (e.key === 'Escape') {
        if (s.paletteOpen) return s.setPaletteOpen(false)
        if (s.summaryOpen) return s.closeSummary()
        if (s.drawerOpen) return s.setDrawerOpen(false)
        if (s.historyOpen) return s.setHistoryOpen(false)
        return
      }

      // Tab restarts when not mid-run; Enter restarts a finished run.
      if (e.key === 'Tab' && s.status !== 'running') {
        e.preventDefault()
        s.reset()
        s.requestFocus()
        return
      }
      if (e.key === 'Enter' && s.status === 'finished') {
        e.preventDefault()
        s.reset()
        s.requestFocus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

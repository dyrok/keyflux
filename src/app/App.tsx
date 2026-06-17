import { useEffect } from 'react'
import { EngineProvider } from '../features/typing/engineContext'
import { KeyCaptureHost, MetricsPump } from './hosts'
import { AppShell } from './AppShell'
import { CommandPalette } from './CommandPalette'
import { SessionSummaryModal } from '../features/history/SessionSummaryModal'
import { HistoryPanel } from '../features/history/HistoryPanel'
import { CustomChallengeDrawer } from '../features/history/CustomChallengeDrawer'
import { Toaster } from '../components/Toaster'
import { useTheme } from '../hooks/useTheme'
import { useSound } from '../hooks/useSound'
import { useHotkeys } from '../hooks/useHotkeys'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

export function App() {
  useTheme()
  useSound()
  useHotkeys()

  const focusNonce = useKeyFluxStore((s) => s.focusNonce)

  // ensure a target exists on first paint (covers the no-persisted-state case)
  useEffect(() => {
    if (!useKeyFluxStore.getState().targetText) useKeyFluxStore.getState().regenerateTarget()
  }, [])

  // after closing an overlay, drop focus from any text field so typing resumes
  useEffect(() => {
    if (focusNonce > 0) {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) el.blur()
    }
  }, [focusNonce])

  return (
    <EngineProvider>
      <KeyCaptureHost />
      <MetricsPump />
      <AppShell />
      <CommandPalette />
      <CustomChallengeDrawer />
      <HistoryPanel />
      <SessionSummaryModal />
      <Toaster />
    </EngineProvider>
  )
}

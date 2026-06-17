import { TopCommandBar } from './TopCommandBar'
import { ChallengeDisplayCard } from '../features/typing/ChallengeDisplayCard'
import { KeyboardStage } from '../features/keyboard/KeyboardStage'
import { TelemetryHUD } from '../features/telemetry/TelemetryHUD'
import { useKeyFluxStore } from '../store/useKeyFluxStore'
import { cn } from '../lib/cn'

export function AppShell() {
  const focusMode = useKeyFluxStore((s) => s.prefs.focusMode)
  const dim = focusMode ? 'opacity-35 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100' : ''

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col gap-4 p-3 sm:p-4 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_368px] lg:grid-rows-[56px_1fr] lg:overflow-hidden">

      {/* command bar — spans both columns */}
      <div className={cn('h-14 shrink-0 lg:col-span-2 lg:h-auto', dim)}>
        <TopCommandBar />
      </div>

      {/* left column: text box directly above keyboard */}
      <div className="flex flex-col gap-4 lg:overflow-y-auto lg:pb-4">
        <ChallengeDisplayCard />
        <KeyboardStage />
      </div>

      {/* right column: telemetry rail */}
      <aside className={cn('lg:overflow-y-auto lg:pr-1', dim)}>
        <TelemetryHUD />
      </aside>

    </div>
  )
}

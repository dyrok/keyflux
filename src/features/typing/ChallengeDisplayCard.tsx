import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CornerDownLeft, Command } from 'lucide-react'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { Char } from './Char'
import { ProgressRail } from './ProgressRail'
import { GhostRail } from './GhostRail'
import { Chip } from '../../components/Chip'
import { Kbd } from '../../components/Kbd'
import { dur, ease } from '../../lib/motion'

export function ChallengeDisplayCard() {
  const targetText = useKeyFluxStore((s) => s.targetText)
  const title = useKeyFluxStore((s) => s.challengeTitle)
  const status = useKeyFluxStore((s) => s.status)
  const caret = useKeyFluxStore((s) => s.prefs.caret)
  const simulate = useKeyFluxStore((s) => s.prefs.simulate)
  const requestFocus = useKeyFluxStore((s) => s.requestFocus)

  const chars = useMemo(() => targetText.split(''), [targetText])
  const idle = status === 'idle'

  return (
    <section
      aria-label="Typing challenge"
      onClick={requestFocus}
      className="relative flex flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-5 shadow-card sm:p-6"
    >
      {/* meta row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-text-primary">{title || 'Challenge'}</span>
          {simulate && <Chip tone="cyan" dot>Simulated layout</Chip>}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
          {status === 'running' ? 'recording' : status === 'finished' ? 'complete' : 'start typing to begin'}
        </span>
      </div>

      {/* the prompt text */}
      <div className="relative">
        <div
          className="max-h-[8.5rem] overflow-y-auto break-words font-mono text-[18px] leading-[2rem] tracking-normal sm:text-[19px]"
          style={undefined}
          aria-hidden
        >
          {chars.map((c, i) => (
            <Char key={i} char={c} index={i} caret={caret} />
          ))}
        </div>

      </div>

      {/* progress */}
      <div className="flex flex-col gap-1.5">
        <ProgressRail />
        <GhostRail />
      </div>

      {/* helper row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-text-faint">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Tab</Kbd> restart
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>
              <Command size={11} />
            </Kbd>
            <Kbd>K</Kbd> commands
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Kbd>
              <CornerDownLeft size={11} />
            </Kbd>{' '}
            again
          </span>
        </div>
        <span className="font-mono uppercase tracking-wide">{targetText.length} chars</span>
      </div>
    </section>
  )
}

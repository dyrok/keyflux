import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { cn } from '../../lib/cn'

function glyphFor(char: string, kind: number): string {
  if (kind === 1) return '⌫'
  if (char === ' ') return '␣'
  return char
}

export function EventLedgerStream() {
  const events = useKeyFluxStore((s) => s.liveEvents)

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Event stream</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-faint">live</span>
      </div>
      <div className="flex flex-wrap gap-1" aria-live="off">
        {events.length === 0 && <span className="text-[12px] text-text-faint">Awaiting keystrokes…</span>}
        {events.map((e, i) => (
          <span
            key={`${e.t}-${i}`}
            className={cn(
              'grid h-6 min-w-[1.5rem] place-items-center rounded-[5px] border px-1 font-mono text-[12px]',
              i === 0 && 'ring-1 ring-cyan/40',
              e.kind === 1
                ? 'border-border bg-surface-2 text-text-muted'
                : e.correct
                  ? 'border-emerald/30 bg-emerald/10 text-emerald'
                  : 'border-crimson/30 bg-crimson/10 text-crimson',
            )}
            style={{ opacity: Math.max(0.35, 1 - i * 0.04) }}
          >
            {glyphFor(e.char, e.kind)}
          </span>
        ))}
      </div>
    </div>
  )
}

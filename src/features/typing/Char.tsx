import { memo, useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { CHAR } from '../../store/cursorStore'
import { useCharStatus } from '../../hooks/useCharStatus'
import type { CaretStyle } from '../../types'

interface CharProps {
  char: string
  index: number
  caret: CaretStyle
}

function CharImpl({ char, index, caret }: CharProps) {
  const status = useCharStatus(index)
  const ref = useRef<HTMLSpanElement>(null)
  const isCurrent = status === CHAR.CURRENT
  const isSpace = char === ' '

  // keep the active character in view without re-rendering siblings
  useEffect(() => {
    if (isCurrent) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [isCurrent])

  return (
    <span
      ref={ref}
      className={cn(
        'relative whitespace-pre',
        status === CHAR.UPCOMING && 'text-text-faint',
        status === CHAR.CORRECT && 'text-text-secondary',
        status === CHAR.INCORRECT && 'rounded-[2px] bg-crimson/12 text-crimson',
        status === CHAR.INCORRECT && isSpace && 'underline decoration-crimson/70',
        isCurrent && 'text-text-primary',
      )}
    >
      {isCurrent && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute z-0 animate-caret-blink bg-cyan',
            caret === 'bar' && 'left-[-1px] top-0 h-full w-[2px] rounded-full',
            caret === 'underline' && 'bottom-[-1px] left-0 h-[2px] w-full rounded-full',
            caret === 'block' && 'inset-0 rounded-[2px] opacity-20',
          )}
        />
      )}
      <span className="relative z-[1]">{char}</span>
    </span>
  )
}

export const Char = memo(CharImpl)

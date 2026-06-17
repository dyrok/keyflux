import { memo } from 'react'
import { cn } from '../../lib/cn'
import { useKeycapState } from '../../hooks/useKeycapState'
import type { KeyDef } from '../../types'

const WORD_LABELS = new Set(['shift', 'ctrl', 'alt', 'caps', 'tab', 'space'])

function shortCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  const map: Record<string, string> = {
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    Space: '␣',
    Enter: '⏎',
    Backspace: '⌫',
  }
  if (map[code]) return map[code]
  return code.replace(/Left|Right/, '').slice(0, 4)
}

function HeatDot({ intensity }: { intensity: number }) {
  const i = intensity
  const size = (3 + i * 4).toFixed(1)
  return (
    <span
      aria-hidden
      className="absolute right-1 top-1 rounded-full bg-crimson"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow:
          i > 0.66
            ? '0 0 0 2px hsl(var(--accent-crimson)/0.5)'
            : i > 0.33
              ? '0 0 0 1.5px hsl(var(--accent-crimson)/0.35)'
              : undefined,
      }}
    />
  )
}

interface KeycapProps {
  def: KeyDef
  showKeycodes: boolean
  heatmapEnabled: boolean
}

function KeycapImpl({ def, showKeycodes, heatmapEnabled }: KeycapProps) {
  const { pressed, isNext, heat } = useKeycapState(def.code)

  const isWord = !!def.label && WORD_LABELS.has(def.label)
  const glyph = def.base.length === 1 ? def.base.toUpperCase() : def.base
  const legend = showKeycodes ? shortCode(def.code) : (def.label ?? glyph)
  const showHeat = heatmapEnabled && heat > 0.05

  return (
    <div
      className="keycap relative grid place-items-center"
      data-pressed={pressed}
      data-next={isNext && !pressed}
      role="img"
      aria-label={`${def.code}${heat > 0.05 ? `, friction ${Math.round(heat * 100)}%` : ''}`}
      style={{
        width: `calc(var(--ku) * ${def.w ?? 1} + ${((def.w ?? 1) - 1).toFixed(2)} * var(--kg))`,
        height: 'var(--ku)',
      }}
    >
      {showHeat && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[7px] transition-[background-color] duration-300"
            style={{ backgroundColor: `hsl(var(--accent-crimson) / ${(heat * 0.55).toFixed(3)})` }}
          />
          <HeatDot intensity={heat} />
        </>
      )}
      <span
        className={cn(
          'relative z-[1] leading-none',
          showKeycodes
            ? 'font-mono text-[10px] font-medium'
            : isWord
              ? 'text-[9.5px] font-medium uppercase tracking-[0.04em] text-text-muted'
              : 'tnr-12 tnr-12--cap',
        )}
      >
        {legend}
      </span>
    </div>
  )
}

/** Memoized so only the keycap whose scalar state changed re-renders. */
export const Keycap = memo(KeycapImpl)

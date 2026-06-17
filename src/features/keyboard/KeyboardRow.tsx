import { memo } from 'react'
import { Keycap } from './Keycap'
import type { KeyRow } from '../../types'

interface KeyboardRowProps {
  row: KeyRow
  showKeycodes: boolean
  heatmapEnabled: boolean
}

function KeyboardRowImpl({ row, showKeycodes, heatmapEnabled }: KeyboardRowProps) {
  return (
    <div className="flex items-stretch justify-center gap-[var(--kg)]">
      {/* academic row label (Times New Roman) */}
      <span className="tnr-12 hidden w-7 shrink-0 select-none items-center justify-end pr-1 text-text-faint sm:inline-flex">
        {row.label}
      </span>
      {row.keys.map((def) => (
        <Keycap key={def.code} def={def} showKeycodes={showKeycodes} heatmapEnabled={heatmapEnabled} />
      ))}
    </div>
  )
}

export const KeyboardRow = memo(KeyboardRowImpl)

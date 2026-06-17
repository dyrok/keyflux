import { LAYOUTS } from '../data/layouts'
import { FINGER_META, KEY_PITCH_MM } from '../data/fingers'
import type { Finger, FingerLoad, KeyAccum } from '../types'

// Key geometry is layout-independent, so derive it once from the QWERTY model.
// Approximate ANSI row stagger so travel estimates feel physical.
const ROW_OFFSET = [0, 0, 0.25, 0.75, 0]

interface Pos {
  x: number
  y: number
}

const KEY_POS: Map<string, Pos> = (() => {
  const m = new Map<string, Pos>()
  for (const row of LAYOUTS.qwerty.rows) {
    let cursor = ROW_OFFSET[row.keys[0]?.row ?? 0] ?? 0
    for (const k of row.keys) {
      const w = k.w ?? 1
      m.set(k.code, { x: cursor + w / 2, y: k.row })
      cursor += w
    }
  }
  return m
})()

function dist(a: Pos, b: Pos): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/** Travel from a finger's home key to a target key, in millimetres (round trip). */
export function travelMm(finger: Finger, code: string): number {
  const home = FINGER_META[finger]?.home
  const hp = home ? KEY_POS.get(home) : undefined
  const kp = KEY_POS.get(code)
  if (!hp || !kp) return 0
  // round trip: reach + return to home rest position
  return dist(hp, kp) * 2 * KEY_PITCH_MM
}

/** Aggregate total travel given per-key press counts and their finger assignment. */
export function totalTravelMm(
  accums: Map<string, KeyAccum>,
  fingerOf: (code: string) => Finger | undefined,
): number {
  let total = 0
  for (const [code, a] of accums) {
    const f = fingerOf(code)
    if (!f) continue
    total += travelMm(f, code) * a.presses
  }
  return total
}

/** Per-finger load aggregate for the load + hand-balance panels. */
export function fingerLoads(
  accums: Map<string, KeyAccum>,
  fingerOf: (code: string) => Finger | undefined,
): FingerLoad[] {
  const map = new Map<Finger, FingerLoad>()
  for (const f of Object.keys(FINGER_META) as Finger[]) {
    map.set(f, { finger: f, hand: FINGER_META[f].hand, presses: 0, errors: 0 })
  }
  for (const [code, a] of accums) {
    const f = fingerOf(code)
    if (!f) continue
    const entry = map.get(f)!
    entry.presses += a.presses
    entry.errors += a.errors
  }
  return [...map.values()]
}

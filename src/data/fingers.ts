import type { Finger, Hand } from '../types'

export interface FingerMeta {
  id: Finger
  label: string
  short: string
  hand: Hand
  /** home-row resting key (event.code) — anchor for travel-distance estimation */
  home: string
}

export const FINGERS: FingerMeta[] = [
  { id: 'l-pinky', label: 'Left pinky', short: 'L5', hand: 'left', home: 'KeyA' },
  { id: 'l-ring', label: 'Left ring', short: 'L4', hand: 'left', home: 'KeyS' },
  { id: 'l-middle', label: 'Left middle', short: 'L3', hand: 'left', home: 'KeyD' },
  { id: 'l-index', label: 'Left index', short: 'L2', hand: 'left', home: 'KeyF' },
  { id: 'thumb', label: 'Thumbs', short: 'T', hand: 'left', home: 'Space' },
  { id: 'r-index', label: 'Right index', short: 'R2', hand: 'right', home: 'KeyJ' },
  { id: 'r-middle', label: 'Right middle', short: 'R3', hand: 'right', home: 'KeyK' },
  { id: 'r-ring', label: 'Right ring', short: 'R4', hand: 'right', home: 'KeyL' },
  { id: 'r-pinky', label: 'Right pinky', short: 'R5', hand: 'right', home: 'Semicolon' },
]

export const FINGER_META: Record<Finger, FingerMeta> = Object.fromEntries(
  FINGERS.map((f) => [f.id, f]),
) as Record<Finger, FingerMeta>

/** Standard 19.05mm key pitch — used to convert key-unit travel into millimetres. */
export const KEY_PITCH_MM = 19.05

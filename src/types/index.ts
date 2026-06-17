// ============================================================================
// KeyFlux — shared domain types
// ============================================================================

export type LayoutId = 'qwerty' | 'dvorak' | 'colemak'

export type ThemeMode = 'dark' | 'midnight' | 'light'

export type HeatmapMode = 'error' | 'usage' | 'latency'

export type CaretStyle = 'block' | 'underline' | 'bar'

export type SessionStatus = 'idle' | 'running' | 'finished'

export type Hand = 'left' | 'right'

/** Finger identifiers for per-finger load + travel analytics. */
export type Finger =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'thumb'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'

/** Test mode — fixed text, time-bound, or word-count bound. */
export type TestMode =
  | { kind: 'fixed' }
  | { kind: 'timed'; seconds: number }
  | { kind: 'words'; count: number }

/**
 * Static definition of one physical key, addressed by `event.code`.
 * `base`/`shifted` are the produced glyphs for a layout; layout files override
 * these per code. Geometry (`row`, `x`, `w`) drives both rendering and the
 * finger-travel estimate.
 */
export interface KeyDef {
  code: string
  /** unshifted glyph (display + simulate) */
  base: string
  /** shifted glyph (display + simulate) */
  shifted: string
  /** explicit cap label override (modifiers, space, etc.) */
  label?: string
  /** relative cap width in "units" (1 = standard) */
  w?: number
  isModifier?: boolean
  /** non-typing keys (modifiers, function keys) do not advance the cursor */
  noType?: boolean
  finger: Finger
  hand: Hand
  /** logical keyboard row index, 0 = number row … 4 = spacebar row */
  row: number
}

/** A single visual keyboard row. */
export interface KeyRow {
  /** academic row label (rendered in Times New Roman) */
  label: string
  keys: KeyDef[]
}

export interface KeyboardLayout {
  id: LayoutId
  name: string
  rows: KeyRow[]
}

/** Per-key running accumulator (Tier 1 — lives in refs, never React state). */
export interface KeyAccum {
  presses: number
  errors: number
  dwellSum: number
  dwellCount: number
  releaseSum: number
  releaseCount: number
}

/** Derived per-key stats surfaced in the friction table. */
export interface KeyStat {
  code: string
  label: string
  presses: number
  errors: number
  successRate: number // 0..1
  avgDwell: number // ms
  avgRelease: number // ms
  friction: number // 0..1
}

/** Tier-2 live metrics, written by the rAF pump and read by telemetry cards. */
export interface LiveMetrics {
  wpm: number
  rawWpm: number
  accuracy: number // 0..100
  elapsedMs: number
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  backspaces: number
  errorRate: number // 0..100
  consistency: number // 0..100
  progress: number // 0..1 (chars completed / target length)
}

export const EMPTY_METRICS: LiveMetrics = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  elapsedMs: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  incorrectKeystrokes: 0,
  backspaces: 0,
  errorRate: 0,
  consistency: 100,
  progress: 0,
}

/** One sample of the live WPM curve (for sparkline + summary chart + ghost). */
export interface WpmSample {
  t: number // elapsed ms
  wpm: number
  raw: number
  errors: number // cumulative incorrect at this point
  chars: number // cumulative correct chars (drives ghost replay)
}

/** Finger-level aggregate for the load + balance panels. */
export interface FingerLoad {
  finger: Finger
  hand: Hand
  presses: number
  errors: number
}

/** A completed session, persisted to history. */
export interface SessionSummary {
  id: string
  date: number
  layout: LayoutId
  simulate: boolean
  mode: TestMode
  textPreview: string
  textLength: number
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  durationMs: number
  totalKeystrokes: number
  correctKeystrokes: number
  incorrectKeystrokes: number
  backspaces: number
  keyStats: KeyStat[]
  wpmSeries: WpmSample[]
  fingerLoad: FingerLoad[]
  travelMm: number
}

/** Personal-best record keyed by configuration bucket. */
export interface BestScore {
  wpm: number
  accuracy: number
  consistency: number
  date: number
  wpmSeries: WpmSample[]
}

/** User preferences persisted to localStorage. */
export interface Prefs {
  theme: ThemeMode
  layout: LayoutId
  simulate: boolean
  sound: boolean
  soundVolume: number
  confetti: boolean
  caret: CaretStyle
  focusMode: boolean
  showKeycodes: boolean
  heatmapEnabled: boolean
  heatmapMode: HeatmapMode
  ghost: boolean
  mode: TestMode
}

export const DEFAULT_PREFS: Prefs = {
  theme: 'dark',
  layout: 'qwerty',
  simulate: false,
  sound: false,
  soundVolume: 0.4,
  confetti: true,
  caret: 'bar',
  focusMode: false,
  showKeycodes: false,
  heatmapEnabled: true,
  heatmapMode: 'error',
  ghost: false,
  mode: { kind: 'fixed' },
}

import { LAYOUTS, glyphFor, indexLayout } from '../../data/layouts'
import { audio } from '../../lib/audio'
import { deriveKeyStats, heatIntensities, toKeyStats } from '../../lib/friction'
import { fingerLoads, totalTravelMm } from '../../lib/finger'
import { makeId } from '../../lib/format'
import { Ledger } from '../../lib/ledger'
import {
  accuracy,
  consistency as consistencyOf,
  errorRate as errorRateOf,
  rawWpm,
  wpm,
} from '../../lib/metrics'
import { cursorStore } from '../../store/cursorStore'
import { useHeatmapStore } from '../../store/heatmapStore'
import { pressStore } from '../../store/pressStore'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import type {
  Finger,
  KeyAccum,
  KeyStat,
  KeyboardLayout,
  LayoutId,
  LiveMetrics,
  SessionSummary,
  WpmSample,
} from '../../types'

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || !el.tagName) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

const newAccum = (): KeyAccum => ({
  presses: 0,
  errors: 0,
  dwellSum: 0,
  dwellCount: 0,
  releaseSum: 0,
  releaseCount: 0,
})

/**
 * The typing engine. Created once; all hot state lives in instance fields (the
 * "refs" tier). Event handlers do cheap writes + one targeted store notify; no
 * metric math runs here — that's the pump's job (tick()).
 */
export class TypingEngine {
  private target = ''
  private length = 0
  private cursor = 0
  private status: 'idle' | 'running' | 'finished' = 'idle'

  // timing
  private startPerf: number | null = null
  private pausedMs = 0
  private blurStart: number | null = null
  private finalElapsed = 0

  // counters (monotonic for accuracy)
  private total = 0
  private correct = 0
  private incorrect = 0
  private backspaces = 0
  private correctChars = 0
  private typedCorrect: boolean[] = []

  // per-key + timing maps
  private keyAccum = new Map<string, KeyAccum>()
  private downAt = new Map<string, number>()
  private lastKeyupAt: number | null = null
  private lastKeyupCode: string | null = null
  private lastKeystrokeAt: number | null = null
  private intervals: number[] = []

  private series: WpmSample[] = []
  private ledger = new Ledger()
  private shiftCount = 0

  // active layout cache
  private layoutId: LayoutId = 'qwerty'
  private layout: KeyboardLayout = LAYOUTS.qwerty
  private layoutIndex = indexLayout(LAYOUTS.qwerty)
  private reverse = new Map<string, string>() // glyph -> code

  constructor() {
    this.rebuildLayout('qwerty')
  }

  private rebuildLayout(id: LayoutId) {
    this.layoutId = id
    this.layout = LAYOUTS[id]
    this.layoutIndex = indexLayout(this.layout)
    this.reverse = new Map()
    for (const row of this.layout.rows) {
      for (const k of row.keys) {
        if (k.base && !this.reverse.has(k.base)) this.reverse.set(k.base, k.code)
        if (k.shifted && !this.reverse.has(k.shifted)) this.reverse.set(k.shifted, k.code)
      }
    }
  }

  private syncLayout() {
    const id = useKeyFluxStore.getState().prefs.layout
    if (id !== this.layoutId) {
      this.rebuildLayout(id)
      this.updateNext()
    }
  }

  /** Called when the layout/simulate preference changes from the UI (no keystroke). */
  refreshLayout() {
    this.syncLayout()
    this.updateNext()
  }

  /** Map the current expected char -> physical code for the next-key highlight. */
  private updateNext() {
    if (this.cursor >= this.length) {
      cursorStore.setNext(null)
      return
    }
    const expected = this.target[this.cursor]
    if (expected === ' ') {
      cursorStore.setNext('Space')
      return
    }
    const code = this.reverse.get(expected) ?? null
    cursorStore.setNext(code)
  }

  // --------------------------------------------------------------------------
  // lifecycle
  // --------------------------------------------------------------------------
  prepare(target: string) {
    this.target = target
    this.length = target.length
    this.cursor = 0
    this.status = 'idle'
    this.startPerf = null
    this.pausedMs = 0
    this.blurStart = null
    this.finalElapsed = 0
    this.total = 0
    this.correct = 0
    this.incorrect = 0
    this.backspaces = 0
    this.correctChars = 0
    this.typedCorrect = []
    this.keyAccum.clear()
    this.downAt.clear()
    this.lastKeyupAt = null
    this.lastKeyupCode = null
    this.lastKeystrokeAt = null
    this.intervals = []
    this.series = []
    this.ledger.reset()
    this.shiftCount = 0
    this.syncLayout()
    pressStore.clearAll()
    useHeatmapStore.getState().clear()
    cursorStore.init(this.length)
    this.updateNext()
  }

  private start(t: number) {
    this.startPerf = t
    this.status = 'running'
    useKeyFluxStore.getState().setStatus('running')
  }

  private elapsed(now: number): number {
    if (this.startPerf == null) return 0
    let e = now - this.startPerf - this.pausedMs
    if (this.blurStart != null) e -= now - this.blurStart
    return e < 0 ? 0 : e
  }

  isRunning() {
    return this.status === 'running'
  }

  // --------------------------------------------------------------------------
  // accumulators
  // --------------------------------------------------------------------------
  private accum(code: string): KeyAccum {
    let a = this.keyAccum.get(code)
    if (!a) this.keyAccum.set(code, (a = newAccum()))
    return a
  }

  // --------------------------------------------------------------------------
  // events
  // --------------------------------------------------------------------------
  keyDown(e: KeyboardEvent) {
    // never capture typing aimed at an editable field (palette search, custom text)
    if (isEditableTarget(e.target)) return
    const code = e.code
    const t = performance.now()
    pressStore.set(code, true)

    if (code === 'ShiftLeft' || code === 'ShiftRight') this.shiftCount = Math.min(2, this.shiftCount + (e.repeat ? 0 : 1))

    if (this.status === 'finished') return
    this.syncLayout()

    // usage accumulator (count first press only, including modifiers/space/backspace)
    if (!e.repeat) {
      this.accum(code).presses++
      if (!this.downAt.has(code)) this.downAt.set(code, t)
    }

    if (code === 'Backspace') {
      e.preventDefault()
      this.doBackspace()
      audio.click('key')
      return
    }

    const def = this.layoutIndex.get(code)
    if (def?.noType && code !== 'Space') {
      if (code === 'Tab') e.preventDefault() // keep focus inside the lab
      return
    }

    // skip OS-shortcut chords (don't type when Ctrl/Meta/Alt held)
    if (e.ctrlKey || e.metaKey || e.altKey) return

    const shift = this.shiftCount > 0 || e.shiftKey
    const simulate = useKeyFluxStore.getState().prefs.simulate
    let ch: string | null
    if (simulate) {
      ch = glyphFor(code, this.layout, shift)
    } else {
      ch = e.key.length === 1 ? e.key : code === 'Space' ? ' ' : null
    }
    if (ch == null) return
    if (code === 'Space') e.preventDefault()

    // inter-key transition latency attributed to the key we just left
    if (this.lastKeyupAt != null && this.lastKeyupCode) {
      const gap = t - this.lastKeyupAt
      if (gap > 0 && gap < 2000) {
        const a = this.accum(this.lastKeyupCode)
        a.releaseSum += gap
        a.releaseCount++
      }
    }

    this.processChar(ch, code, t)
  }

  private processChar(ch: string, code: string, t: number) {
    if (this.status === 'idle') this.start(t)
    if (this.cursor >= this.length) return

    const expected = this.target[this.cursor]
    const correct = ch === expected

    if (this.lastKeystrokeAt != null) this.intervals.push(t - this.lastKeystrokeAt)
    this.lastKeystrokeAt = t

    this.total++
    if (correct) {
      this.correct++
      this.correctChars++
      this.typedCorrect.push(true)
    } else {
      this.incorrect++
      this.typedCorrect.push(false)
      this.accum(code).errors++
    }

    this.ledger.push(this.elapsed(t), code, ch, correct, 0)
    this.cursor = cursorStore.advance(correct)
    this.updateNext()

    audio.click(correct ? (code === 'Space' ? 'space' : 'key') : 'error')

    if (this.cursor >= this.length) this.finish(t)
  }

  private doBackspace() {
    if (this.cursor <= 0) return
    this.backspaces++
    const v = this.typedCorrect.pop()
    if (v) this.correctChars = Math.max(0, this.correctChars - 1)
    this.cursor = cursorStore.back()
    this.ledger.push(this.elapsed(performance.now()), 'Backspace', '⌫', true, 1)
    this.updateNext()
  }

  keyUp(e: KeyboardEvent) {
    if (isEditableTarget(e.target)) return
    const code = e.code
    const t = performance.now()
    pressStore.set(code, false)

    if (code === 'ShiftLeft' || code === 'ShiftRight') this.shiftCount = Math.max(0, this.shiftCount - 1)

    const down = this.downAt.get(code)
    if (down != null) {
      const dwell = t - down
      if (dwell > 0 && dwell < 4000) {
        const a = this.accum(code)
        a.dwellSum += dwell
        a.dwellCount++
      }
      this.downAt.delete(code)
    }
    this.lastKeyupAt = t
    this.lastKeyupCode = code
  }

  blur() {
    pressStore.clearAll()
    this.shiftCount = 0
    this.downAt.clear()
    this.lastKeyupAt = null
    this.lastKeyupCode = null
    this.lastKeystrokeAt = null
    if (this.status === 'running' && this.blurStart == null) this.blurStart = performance.now()
  }

  resume() {
    if (this.blurStart != null) {
      this.pausedMs += performance.now() - this.blurStart
      this.blurStart = null
    }
    this.lastKeystrokeAt = null
  }

  // --------------------------------------------------------------------------
  // pump-driven derivation
  // --------------------------------------------------------------------------
  tick(now: number): LiveMetrics | null {
    if (this.status !== 'running') return null
    const el = this.elapsed(now)

    // timed-mode completion
    const mode = useKeyFluxStore.getState().prefs.mode
    if (mode.kind === 'timed' && el >= mode.seconds * 1000) {
      this.finish(now)
      return null
    }

    const live = this.snapshot(el)
    this.series.push({
      t: el,
      wpm: live.wpm,
      raw: live.rawWpm,
      errors: this.incorrect,
      chars: this.correctChars,
    })
    return live
  }

  private snapshot(el: number): LiveMetrics {
    return {
      wpm: wpm(this.correctChars, el),
      rawWpm: rawWpm(this.total, el),
      accuracy: accuracy(this.correct, this.total),
      elapsedMs: el,
      totalKeystrokes: this.total,
      correctKeystrokes: this.correct,
      incorrectKeystrokes: this.incorrect,
      backspaces: this.backspaces,
      errorRate: errorRateOf(this.incorrect, this.total),
      consistency: consistencyOf(this.intervals),
      progress: this.length > 0 ? this.cursor / this.length : 0,
    }
  }

  /** Series snapshot for the live sparkline (copy so React sees a new ref). */
  getSeries(): WpmSample[] {
    return this.series.slice()
  }

  /** Derive heat intensities for the active heatmap mode. */
  computeHeat(): Record<string, number> {
    const mode = useKeyFluxStore.getState().prefs.heatmapMode
    const derived = deriveKeyStats(this.keyAccum)
    return heatIntensities(derived, mode)
  }

  /** Per-key stats for the friction table, highest-friction first. */
  computeKeyStats(): KeyStat[] {
    const derived = deriveKeyStats(this.keyAccum)
    return toKeyStats(derived, this.labelOf)
      .filter((k) => {
        const d = this.layoutIndex.get(k.code)
        return d && !d.noType
      })
      .sort((a, b) => b.friction - a.friction)
  }

  private labelOf = (code: string): string => {
    const k = this.layoutIndex.get(code)
    if (!k) return code
    if (k.label) return k.label
    if (k.base === ' ') return 'Space'
    return k.base.length === 1 ? k.base.toUpperCase() : k.base
  }

  private fingerOf = (code: string): Finger | undefined => this.layoutIndex.get(code)?.finger

  private finish(now: number) {
    if (this.status === 'finished') return
    this.status = 'finished'
    this.finalElapsed = Math.max(this.elapsed(now), 1)
    pressStore.clearAll()
    cursorStore.setNext(null)

    const derived = deriveKeyStats(this.keyAccum)
    const keyStats = toKeyStats(derived, this.labelOf)
      .filter((k) => this.layoutIndex.get(k.code) && !this.layoutIndex.get(k.code)!.noType)
      .sort((a, b) => b.friction - a.friction)

    const summary: SessionSummary = {
      id: makeId('s'),
      date: Date.now(),
      layout: this.layoutId,
      simulate: useKeyFluxStore.getState().prefs.simulate,
      mode: useKeyFluxStore.getState().prefs.mode,
      textPreview: this.target.slice(0, 64),
      textLength: this.length,
      wpm: wpm(this.correctChars, this.finalElapsed),
      rawWpm: rawWpm(this.total, this.finalElapsed),
      accuracy: accuracy(this.correct, this.total),
      consistency: consistencyOf(this.intervals),
      durationMs: this.finalElapsed,
      totalKeystrokes: this.total,
      correctKeystrokes: this.correct,
      incorrectKeystrokes: this.incorrect,
      backspaces: this.backspaces,
      keyStats,
      wpmSeries: this.series.slice(),
      fingerLoad: fingerLoads(this.keyAccum, this.fingerOf),
      travelMm: totalTravelMm(this.keyAccum, this.fingerOf),
    }

    // final heat reveal + final key stats
    useHeatmapStore.getState().commit(heatIntensities(derived, useKeyFluxStore.getState().prefs.heatmapMode))
    useHeatmapStore.getState().setRevealed(true)
    useKeyFluxStore.getState().commitKeyStats(keyStats)
    useKeyFluxStore.getState().completeSession(summary)
  }

  getRecentEvents() {
    return this.ledger.recent()
  }

  /** Expose a label resolver for UI (event stream, friction table headers). */
  glyphLabel(code: string) {
    return this.labelOf(code)
  }
}

import type { HeatmapMode, KeyAccum, KeyStat } from '../types'
import { clamp01 } from './format'
import { percentile } from './metrics'

// Confidence prior — a key pressed only a couple times shouldn't scream red.
const CONFIDENCE_K = 8

export interface DerivedKey {
  code: string
  presses: number
  errors: number
  errorRate: number // 0..1
  avgDwell: number // ms
  avgRelease: number // ms
  successRate: number // 0..1
  friction: number // 0..1
}

/** Derive per-key stats + a session-normalized friction score (0..1). */
export function deriveKeyStats(accums: Map<string, KeyAccum>): Map<string, DerivedKey> {
  const out = new Map<string, DerivedKey>()
  if (accums.size === 0) return out

  // First pass: raw per-key values.
  const dwellVals: number[] = []
  const releaseVals: number[] = []
  const raw: { code: string; a: KeyAccum; errorRate: number; avgDwell: number; avgRelease: number }[] = []

  for (const [code, a] of accums) {
    const errorRate = a.presses > 0 ? a.errors / a.presses : 0
    const avgDwell = a.dwellCount > 0 ? a.dwellSum / a.dwellCount : 0
    const avgRelease = a.releaseCount > 0 ? a.releaseSum / a.releaseCount : 0
    if (avgDwell > 0) dwellVals.push(avgDwell)
    if (avgRelease > 0) releaseVals.push(avgRelease)
    raw.push({ code, a, errorRate, avgDwell, avgRelease })
  }

  // Session percentile range (p5..p95) for self-calibrating latency normalization.
  dwellVals.sort((x, y) => x - y)
  releaseVals.sort((x, y) => x - y)
  const dwellFloor = percentile(dwellVals, 0.05)
  const dwellRange = Math.max(percentile(dwellVals, 0.95) - dwellFloor, 1)
  const relFloor = percentile(releaseVals, 0.05)
  const relRange = Math.max(percentile(releaseVals, 0.95) - relFloor, 1)

  for (const r of raw) {
    const dwellN = clamp01((r.avgDwell - dwellFloor) / dwellRange)
    const releaseN = clamp01((r.avgRelease - relFloor) / relRange)
    const latencyN = 0.5 * dwellN + 0.5 * releaseN
    const rawFriction = 0.65 * r.errorRate + 0.35 * latencyN
    const confidence = r.a.presses / (r.a.presses + CONFIDENCE_K)
    const friction = clamp01(rawFriction * confidence)
    out.set(r.code, {
      code: r.code,
      presses: r.a.presses,
      errors: r.a.errors,
      errorRate: r.errorRate,
      avgDwell: r.avgDwell,
      avgRelease: r.avgRelease,
      successRate: 1 - r.errorRate,
      friction,
    })
  }
  return out
}

/**
 * Map derived keys -> 0..1 intensity for the requested heatmap mode.
 * error: friction-weighted error. usage: normalized press count. latency: dwell+release.
 */
export function heatIntensities(
  derived: Map<string, DerivedKey>,
  mode: HeatmapMode,
): Record<string, number> {
  const result: Record<string, number> = {}
  if (derived.size === 0) return result

  if (mode === 'usage') {
    let max = 0
    for (const d of derived.values()) max = Math.max(max, d.presses)
    if (max <= 0) return result
    for (const d of derived.values()) result[d.code] = clamp01(d.presses / max)
    return result
  }

  if (mode === 'latency') {
    const lat: number[] = []
    for (const d of derived.values()) lat.push(d.avgDwell + d.avgRelease)
    lat.sort((a, b) => a - b)
    const floor = percentile(lat, 0.05)
    const range = Math.max(percentile(lat, 0.95) - floor, 1)
    for (const d of derived.values()) {
      const v = d.avgDwell + d.avgRelease
      // weight by confidence so a single slow tap doesn't dominate
      const conf = d.presses / (d.presses + CONFIDENCE_K)
      result[d.code] = clamp01(((v - floor) / range) * conf)
    }
    return result
  }

  // error mode = friction score
  for (const d of derived.values()) result[d.code] = d.friction
  return result
}

export function toKeyStats(
  derived: Map<string, DerivedKey>,
  labelOf: (code: string) => string,
): KeyStat[] {
  const stats: KeyStat[] = []
  for (const d of derived.values()) {
    stats.push({
      code: d.code,
      label: labelOf(d.code),
      presses: d.presses,
      errors: d.errors,
      successRate: d.successRate,
      avgDwell: d.avgDwell,
      avgRelease: d.avgRelease,
      friction: d.friction,
    })
  }
  return stats
}

import { clamp } from './format'

// ============================================================================
// Typing metrics. Standardized word = 5 characters (monkeytype convention).
// All functions are pure; the engine feeds them ref-held counters.
// ============================================================================

const MIN_MINUTES = 1 / 60000 // guard against divide-by-zero on the first ms

export function standardizedWords(chars: number): number {
  return chars / 5
}

export function wpm(correctChars: number, elapsedMs: number): number {
  const minutes = Math.max(elapsedMs / 60000, MIN_MINUTES)
  return standardizedWords(correctChars) / minutes
}

export function rawWpm(allTypedChars: number, elapsedMs: number): number {
  const minutes = Math.max(elapsedMs / 60000, MIN_MINUTES)
  return standardizedWords(allTypedChars) / minutes
}

export function accuracy(correct: number, total: number): number {
  if (total <= 0) return 100
  return clamp((correct / total) * 100, 0, 100)
}

export function errorRate(incorrect: number, total: number): number {
  if (total <= 0) return 0
  return clamp((incorrect / total) * 100, 0, 100)
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  let acc = 0
  for (const x of xs) acc += (x - m) ** 2
  return Math.sqrt(acc / (xs.length - 1))
}

/**
 * Consistency (0..100) from inter-keystroke intervals via coefficient of
 * variation: lower variability => higher consistency. Mirrors monkeytype's
 * "consistency" reading closely enough for a trainer.
 */
export function consistency(intervals: number[]): number {
  if (intervals.length < 3) return 100
  const m = mean(intervals)
  if (m <= 0) return 100
  const cv = stdev(intervals) / m
  return clamp((1 - cv) * 100, 0, 100)
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = clamp(p, 0, 1) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const frac = idx - lo
  return sorted[lo] * (1 - frac) + sorted[hi] * frac
}

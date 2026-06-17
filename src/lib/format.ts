/** Formatting helpers for telemetry values. */

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

export function round(x: number, dp = 0): number {
  const f = 10 ** dp
  return Math.round(x * f) / f
}

/** ms -> "M:SS" or "SS.s" depending on magnitude. */
export function formatDuration(ms: number): string {
  const totalSec = ms / 1000
  if (totalSec < 60) return `${totalSec.toFixed(1)}s`
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatMs(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '—'
  return `${Math.round(ms)}`
}

export function formatPct(x: number, dp = 1): string {
  if (!isFinite(x)) return '—'
  return `${x.toFixed(dp)}`
}

export function formatInt(x: number): string {
  return Math.round(x).toLocaleString('en-US')
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Stable id without Math.random/Date — counter + perf time fold. */
let _idc = 0
export function makeId(prefix = 'id'): string {
  _idc = (_idc + 1) % 1_000_000
  const t = Math.floor(performance.now() * 1000) % 1_000_000_000
  return `${prefix}_${t.toString(36)}_${_idc.toString(36)}`
}

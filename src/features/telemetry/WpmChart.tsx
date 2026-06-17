import { useMemo } from 'react'
import type { WpmSample } from '../../types'

interface WpmChartProps {
  series: WpmSample[]
  ghost?: WpmSample[]
  height?: number
}

const ROLLING_WINDOW_MS = 3000
const MIN_WINDOW_MS = 1000

function rollingValues(samples: WpmSample[], getChars: (s: WpmSample) => number): (number | null)[] {
  return samples.map((s, i) => {
    let j = i
    while (j > 0 && s.t - samples[j - 1].t < ROLLING_WINDOW_MS) j--
    const windowMs = s.t - samples[j].t
    if (windowMs < MIN_WINDOW_MS) return null
    const windowChars = getChars(s) - getChars(samples[j])
    return (windowChars / 5) / (windowMs / 60000)
  })
}

function catmullRom(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  const parts = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    parts.push(`C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`)
  }
  return parts.join(' ')
}

function buildPath(
  samples: WpmSample[],
  vals: (number | null)[],
  x: (t: number) => number,
  y: (v: number) => number,
): string {
  const segments: { x: number; y: number }[][] = []
  let seg: { x: number; y: number }[] = []
  for (let i = 0; i < samples.length; i++) {
    const v = vals[i]
    if (v == null) { if (seg.length) { segments.push(seg); seg = [] } continue }
    seg.push({ x: x(samples[i].t), y: y(v) })
  }
  if (seg.length) segments.push(seg)
  return segments.map(catmullRom).join(' ')
}

function xTickInterval(maxMs: number): number {
  const s = maxMs / 1000
  if (s <= 20) return 5000
  if (s <= 60) return 10000
  if (s <= 120) return 30000
  return 60000
}

export function WpmChart({ series, ghost, height = 180 }: WpmChartProps) {
  const W = 600
  const H = height
  const padL = 32
  const padB = 24
  const padT = 12
  const padR = 12

  const model = useMemo(() => {
    if (series.length === 0) return null

    const netVals = rollingValues(series, (s) => s.chars)
    const rawVals = rollingValues(series, (s) => s.chars + s.errors)
    const ghostNetVals = ghost && ghost.length ? rollingValues(ghost, (s) => s.chars) : []

    const visibleNet = netVals.filter((v): v is number => v != null)
    const visibleRaw = rawVals.filter((v): v is number => v != null)
    const visibleGhost = ghostNetVals.filter((v): v is number => v != null)

    if (visibleNet.length === 0) return null

    const maxWpm = Math.max(10, ...visibleNet, ...visibleRaw, ...visibleGhost) * 1.12
    const maxT = Math.max(1, ...series.map((s) => s.t))
    const x = (t: number) => padL + (t / maxT) * (W - padL - padR)
    const y = (v: number) => padT + (1 - v / maxWpm) * (H - padT - padB)

    const net = buildPath(series, netVals, x, y)
    const raw = buildPath(series, rawVals, x, y)
    const ghostLine = ghost && ghost.length ? buildPath(ghost, ghostNetVals, x, y) : ''

    // area under net line
    const firstVisible = series.findIndex((_, i) => netVals[i] != null)
    const lastIdxArr = [...netVals].reverse().findIndex((v) => v != null)
    const lastIdx = netVals.length - 1 - lastIdxArr
    const area = net && firstVisible >= 0
      ? `${net} L ${x(series[lastIdx].t).toFixed(1)} ${y(0).toFixed(1)} L ${x(series[firstVisible].t).toFixed(1)} ${y(0).toFixed(1)} Z`
      : ''

    // error markers
    const errs: { cx: number; cy: number }[] = []
    for (let i = 1; i < series.length; i++) {
      if (series[i].errors > series[i - 1].errors) {
        const v = netVals[i]
        if (v != null) errs.push({ cx: x(series[i].t), cy: y(v) })
      }
    }

    // y-axis ticks
    const yTicks = [0, Math.round(maxWpm * 0.5), Math.round(maxWpm * 0.9)]

    // x-axis ticks (time in seconds)
    const interval = xTickInterval(maxT)
    const xTicks: number[] = []
    for (let t = 0; t <= maxT; t += interval) xTicks.push(t)
    if (xTicks[xTicks.length - 1] < maxT * 0.85) xTicks.push(maxT)

    // peak point on net line
    let peakIdx = -1
    let peakVal = -Infinity
    for (let i = 0; i < netVals.length; i++) {
      const v = netVals[i]
      if (v != null && v > peakVal) { peakVal = v; peakIdx = i }
    }
    const peak = peakIdx >= 0 ? { cx: x(series[peakIdx].t), cy: y(peakVal), wpm: Math.round(peakVal) } : null

    return { net, raw, area, ghostLine, errs, yTicks, xTicks, peak, x, y, maxT }
  }, [series, ghost, H])

  if (!model) {
    return (
      <div className="grid h-40 place-items-center rounded-xl border border-border bg-surface-inset text-[12px] text-text-faint">
        No data
      </div>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="WPM over time">
      <defs>
        <linearGradient id="wpm-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0" />
        </linearGradient>
        <filter id="net-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* y gridlines */}
      {model.yTicks.map((v) => (
        <g key={v}>
          <line
            x1={padL} x2={W - padR}
            y1={model.y(v)} y2={model.y(v)}
            stroke="hsl(var(--border-subtle))" strokeWidth={1}
          />
          <text
            x={padL - 6} y={model.y(v) + 3.5}
            textAnchor="end"
            className="fill-text-faint"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}
          >
            {v}
          </text>
        </g>
      ))}

      {/* x axis ticks */}
      {model.xTicks.map((t) => (
        <g key={t}>
          <line
            x1={model.x(t)} x2={model.x(t)}
            y1={H - padB + 3} y2={H - padB + 7}
            stroke="hsl(var(--border-subtle))" strokeWidth={1}
          />
          <text
            x={model.x(t)} y={H - 4}
            textAnchor="middle"
            className="fill-text-faint"
            style={{ fontSize: 8.5, fontFamily: 'var(--font-mono)' }}
          >
            {Math.round(t / 1000)}s
          </text>
        </g>
      ))}

      {/* x axis baseline */}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="hsl(var(--border-subtle))" strokeWidth={1} />

      {/* area fill */}
      {model.area && <path d={model.area} fill="url(#wpm-area-grad)" />}

      {/* ghost best line */}
      {model.ghostLine && (
        <path d={model.ghostLine} fill="none" stroke="hsl(var(--text-faint))" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} strokeLinecap="round" />
      )}

      {/* raw line */}
      {model.raw && (
        <path d={model.raw} fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth={1.5} opacity={0.3} strokeLinecap="round" />
      )}

      {/* net line glow */}
      {model.net && (
        <path d={model.net} fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth={2.5} opacity={0.25} filter="url(#net-glow)" strokeLinecap="round" />
      )}

      {/* net line */}
      {model.net && (
        <path d={model.net} fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth={2} strokeLinecap="round" />
      )}

      {/* error dots */}
      {model.errs.map((e, i) => (
        <circle key={i} cx={e.cx} cy={e.cy} r={3} fill="hsl(var(--accent-crimson))" opacity={0.9} />
      ))}

      {/* peak label */}
      {model.peak && (
        <g>
          <circle cx={model.peak.cx} cy={model.peak.cy} r={3.5} fill="hsl(var(--accent-cyan))" />
          <circle cx={model.peak.cx} cy={model.peak.cy} r={6} fill="hsl(var(--accent-cyan))" opacity={0.15} />
          <text
            x={model.peak.cx}
            y={model.peak.cy - 9}
            textAnchor="middle"
            className="fill-cyan font-mono"
            style={{ fontSize: 8.5, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
          >
            {model.peak.wpm}
          </text>
        </g>
      )}
    </svg>
  )
}

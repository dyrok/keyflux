import { useMemo } from 'react'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  className?: string
  /** optional baseline series drawn faintly behind (e.g. best-run ghost) */
  baseline?: number[]
}

/** Lightweight SVG sparkline — 1px stroke, optional soft area fill. */
export function Sparkline({
  values,
  width = 120,
  height = 36,
  color = 'hsl(var(--accent-cyan))',
  fill = true,
  baseline,
  className,
}: SparklineProps) {
  const { path, area, basePath, max } = useMemo(() => {
    const all = baseline ? [...values, ...baseline] : values
    const max = Math.max(1, ...all)
    const pad = 2
    const toPath = (vals: number[]) => {
      if (vals.length === 0) return ''
      if (vals.length === 1) {
        const y = height - pad - (vals[0] / max) * (height - pad * 2)
        return `M ${pad} ${y} L ${width - pad} ${y}`
      }
      const stepX = (width - pad * 2) / (vals.length - 1)
      return vals
        .map((v, i) => {
          const x = pad + i * stepX
          const y = height - pad - (v / max) * (height - pad * 2)
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ')
    }
    const path = toPath(values)
    const area = path ? `${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z` : ''
    const basePath = baseline ? toPath(baseline) : ''
    return { path, area, basePath, max }
  }, [values, baseline, width, height])

  void max
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill && area && <path d={area} fill={color} opacity={0.1} />}
      {basePath && (
        <path d={basePath} fill="none" stroke="hsl(var(--text-faint))" strokeWidth={1.25} strokeDasharray="3 3" opacity={0.6} />
      )}
      {path && <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  )
}

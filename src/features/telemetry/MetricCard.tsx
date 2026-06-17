import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AnimatedNumber } from '../../components/AnimatedNumber'

type Tone = 'cyan' | 'emerald' | 'crimson' | 'amber' | 'neutral'

const dotTone: Record<Tone, string> = {
  cyan: 'bg-cyan',
  emerald: 'bg-emerald',
  crimson: 'bg-crimson',
  amber: 'bg-amber',
  neutral: 'bg-text-faint',
}

interface MetricCardProps {
  label: string
  value: number | string
  unit?: string
  tone?: Tone
  dp?: number
  hero?: boolean
  animate?: boolean
  sub?: ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  tone = 'neutral',
  dp = 0,
  hero,
  animate = true,
  sub,
  className,
}: MetricCardProps) {
  const numeric = typeof value === 'number'
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-1 rounded-xl border border-border bg-surface-1 p-3.5 transition-colors hover:border-border-strong',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', dotTone[tone])} />
        <span className="label">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'font-mono font-semibold tabular text-text-primary',
            hero ? 'text-[2rem] leading-none' : 'text-lg leading-none',
          )}
        >
          {numeric ? (animate ? <AnimatedNumber value={value} dp={dp} /> : (value as number).toFixed(dp)) : value}
        </span>
        {unit && <span className="font-mono text-[12px] text-text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-text-muted">{sub}</div>}
    </div>
  )
}

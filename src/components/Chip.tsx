import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type Tone = 'neutral' | 'cyan' | 'emerald' | 'crimson' | 'amber'

const tones: Record<Tone, string> = {
  neutral: 'border-border bg-surface-2 text-text-secondary',
  cyan: 'border-cyan/40 bg-cyan/10 text-cyan',
  emerald: 'border-emerald/40 bg-emerald/10 text-emerald',
  crimson: 'border-crimson/40 bg-crimson/10 text-crimson',
  amber: 'border-amber/40 bg-amber/10 text-amber',
}

interface ChipProps {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  pulse?: boolean
  className?: string
}

export function Chip({ children, tone = 'neutral', dot, pulse, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  )
}

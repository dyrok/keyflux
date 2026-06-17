import { cn } from '../lib/cn'

export interface SegOption<T extends string> {
  value: T
  label: string
  title?: string
}

interface SegmentedControlProps<T extends string> {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  /** apply the Times New Roman compliance profile to option labels */
  compliant?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}

/** Premium segmented control. The track/active pill stay modern; option labels
 *  can opt into the .tnr-12 profile (used by the layout switch). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compliant,
  size = 'md',
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'focus-ring rounded-[6px] transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3',
              compliant ? 'tnr-12' : 'text-[13px] font-medium',
              selected
                ? 'bg-surface-3 text-text-primary shadow-[0_0_0_1px_hsl(var(--accent-cyan)/0.4)]'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

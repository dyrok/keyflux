import { cn } from '../lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  id?: string
}

/** Accessible switch with a sliding thumb. */
export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200',
        checked ? 'border-cyan/50 bg-cyan/30' : 'border-border bg-surface-inset',
      )}
    >
      <span
        className={cn(
          'absolute h-3.5 w-3.5 rounded-full bg-text-primary shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}

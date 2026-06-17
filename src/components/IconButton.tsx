import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  size?: 'sm' | 'md'
}

/** Square chrome button for the command bar (modern font, not a compliance area). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { active, size = 'md', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'focus-ring inline-grid place-items-center rounded-lg border transition-colors duration-150',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        active
          ? 'border-cyan/50 bg-cyan/10 text-cyan'
          : 'border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text-primary',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})

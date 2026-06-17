import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Variant = 'default' | 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  default: 'bg-surface-2 border-border hover:border-border-strong text-text-secondary hover:text-text-primary',
  primary: 'bg-cyan/10 border-cyan/50 text-cyan hover:bg-cyan/15',
  ghost: 'bg-transparent border-transparent hover:bg-surface-2 text-text-secondary hover:text-text-primary',
  danger: 'bg-transparent border-border hover:border-crimson/60 text-text-secondary hover:text-crimson',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
}

/**
 * Action button. Per the academic constraint, the LABEL text renders in the
 * Times New Roman 12pt profile (.tnr-12); the premium chrome stays intact.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center gap-2 rounded-lg border',
        'transition-colors duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      <span className="tnr-12 inline-flex items-center gap-2 leading-none">{children}</span>
    </button>
  )
})

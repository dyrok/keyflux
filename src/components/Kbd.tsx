import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Small keyboard-hint badge for shortcut affordances. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-[5px] border border-border bg-surface-2 px-1.5',
        'font-mono text-[11px] font-medium text-text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

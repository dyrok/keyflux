import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import { modalBackdrop, modalPanel } from '../lib/motion'
import { IconButton } from './IconButton'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  ariaLabel?: string
  showClose?: boolean
}

export function Modal({ open, onClose, children, className, ariaLabel, showClose = true }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          variants={modalBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-[hsl(var(--shadow-color)/0.55)] backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            variants={modalPanel}
            className={cn(
              'relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-raised',
              className,
            )}
          >
            {showClose && (
              <IconButton
                aria-label="Close"
                onClick={onClose}
                size="sm"
                className="absolute right-3 top-3 z-20"
              >
                <X size={15} />
              </IconButton>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

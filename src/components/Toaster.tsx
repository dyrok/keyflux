import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Check, Info } from 'lucide-react'
import { toastIn } from '../lib/motion'
import { useKeyFluxStore, type Toast } from '../store/useKeyFluxStore'
import { cn } from '../lib/cn'

const icons = {
  pb: Award,
  success: Check,
  info: Info,
}

const tone = {
  pb: 'text-amber',
  success: 'text-emerald',
  info: 'text-cyan',
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useKeyFluxStore((s) => s.dismissToast)
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), 4200)
    return () => clearTimeout(id)
  }, [toast.id, dismiss])

  const Icon = icons[toast.kind]
  return (
    <motion.div
      layout
      variants={toastIn}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={() => dismiss(toast.id)}
      className="pointer-events-auto flex w-72 cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-2 p-3 shadow-raised"
    >
      <div className={cn('mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-surface-3', tone[toast.kind])}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary">{toast.title}</div>
        {toast.message && <div className="mt-0.5 font-mono text-[12px] text-text-muted">{toast.message}</div>}
      </div>
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useKeyFluxStore((s) => s.toasts)
  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

import { motion } from 'framer-motion'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { dur, ease } from '../../lib/motion'

/** Emerald correct-progress rail. Tracks input 1:1 (no spring). */
export function ProgressRail() {
  const progress = useKeyFluxStore((s) => s.live.progress)
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-inset" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="h-full rounded-full bg-emerald"
        style={{ transformOrigin: 'left' }}
        animate={{ scaleX: Math.max(0.001, progress) }}
        initial={false}
        transition={{ duration: dur.fast, ease: ease.out }}
      />
    </div>
  )
}

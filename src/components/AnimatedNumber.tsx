import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { numberSpring } from '../lib/motion'

interface AnimatedNumberProps {
  value: number
  dp?: number
  className?: string
}

/** Near-critically-damped count-up. Renders tabular mono digits. */
export function AnimatedNumber({ value, dp = 0, className }: AnimatedNumberProps) {
  const safe = isFinite(value) ? value : 0
  const mv = useSpring(safe, numberSpring)
  useEffect(() => {
    mv.set(safe)
  }, [mv, safe])
  const text = useTransform(mv, (v) => (dp ? v.toFixed(dp) : Math.round(v).toString()))
  return <motion.span className={className}>{text}</motion.span>
}

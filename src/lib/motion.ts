import type { Transition, Variants } from 'framer-motion'

// Restrained motion language — two easings, four durations. No spring carnival.
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
}

export const dur = {
  flash: 0.09,
  fast: 0.14,
  base: 0.22,
  slow: 0.34,
}

/** Near-critical spring for metric number count-ups — eases, never wobbles. */
export const numberSpring: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 22,
  mass: 0.6,
}

export const panelIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.base } },
  exit: { opacity: 0, transition: { duration: dur.fast } },
}

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: { duration: dur.fast, ease: ease.out } },
}

export const toastIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: dur.fast } },
}

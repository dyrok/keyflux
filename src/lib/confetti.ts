import confetti from 'canvas-confetti'

// Restrained success effect — two quick side bursts, muted palette. Not a carnival.
export function celebrate(isPb = false) {
  const colors = isPb
    ? ['#1FC8DB', '#2BC48A', '#F2A52A']
    : ['#2BC48A', '#1FC8DB', '#B0B7C2']

  const base: confetti.Options = {
    spread: 62,
    startVelocity: 38,
    gravity: 1.05,
    ticks: 160,
    scalar: 0.9,
    colors,
    disableForReducedMotion: true,
  }

  confetti({ ...base, particleCount: isPb ? 70 : 45, angle: 60, origin: { x: 0, y: 0.7 } })
  confetti({ ...base, particleCount: isPb ? 70 : 45, angle: 120, origin: { x: 1, y: 0.7 } })

  if (isPb) {
    setTimeout(() => {
      confetti({ ...base, particleCount: 36, spread: 100, startVelocity: 30, origin: { x: 0.5, y: 0.4 } })
    }, 140)
  }
}

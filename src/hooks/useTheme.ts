import { useEffect } from 'react'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

/** Apply the active theme to <html> and mirror it for the no-flash boot script. */
export function useTheme() {
  const theme = useKeyFluxStore((s) => s.prefs.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('keyflux:theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])
}

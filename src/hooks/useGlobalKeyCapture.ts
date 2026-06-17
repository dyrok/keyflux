import { useEffect } from 'react'
import { useEngine } from '../features/typing/engineContext'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

/**
 * Global key capture host. Attaches window listeners in the capture phase (so
 * timestamps are taken as early as possible and we can preventDefault inside the
 * lab), routes to the engine, and re-prepares the engine whenever the target
 * text or attempt changes. Renders nothing.
 */
export function useGlobalKeyCapture() {
  const engine = useEngine()
  const targetText = useKeyFluxStore((s) => s.targetText)
  const attempt = useKeyFluxStore((s) => s.attempt)
  const layout = useKeyFluxStore((s) => s.prefs.layout)

  // (re)prepare on new text or reset
  useEffect(() => {
    engine.prepare(targetText)
  }, [engine, targetText, attempt])

  // when the layout changes from the UI (no keystroke), relabel + re-point the
  // next-key highlight immediately
  useEffect(() => {
    engine.refreshLayout()
  }, [engine, layout])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => engine.keyDown(e)
    const onKeyUp = (e: KeyboardEvent) => engine.keyUp(e)
    const onBlur = () => engine.blur()
    const onFocus = () => engine.resume()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') engine.blur()
      else engine.resume()
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [engine])
}

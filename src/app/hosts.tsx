import { useGlobalKeyCapture } from '../hooks/useGlobalKeyCapture'
import { useLiveMetrics } from '../hooks/useLiveMetrics'

/** Side-effect host: attaches global key capture. Renders nothing. */
export function KeyCaptureHost() {
  useGlobalKeyCapture()
  return null
}

/** Side-effect host: drives the rAF metrics pump. Renders nothing. */
export function MetricsPump() {
  useLiveMetrics()
  return null
}

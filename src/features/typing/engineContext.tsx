import { createContext, useContext, useRef, type ReactNode } from 'react'
import { TypingEngine } from './engine'

// The engine is a stable singleton-per-app instance. Context only ever carries
// this unchanging reference, so it never triggers consumer re-renders.
const EngineContext = createContext<TypingEngine | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const ref = useRef<TypingEngine | null>(null)
  if (ref.current === null) ref.current = new TypingEngine()
  return <EngineContext.Provider value={ref.current}>{children}</EngineContext.Provider>
}

export function useEngine(): TypingEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('useEngine must be used within <EngineProvider>')
  return engine
}

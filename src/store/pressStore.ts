// ============================================================================
// pressStore — a bespoke per-key external store consumed via useSyncExternalStore.
// pressStore.set('KeyJ', true) notifies ONLY KeyJ's listeners => O(1) targeted
// update, so pressing a key re-renders exactly one of ~60 keycaps. Idempotent
// (early-return on unchanged) which absorbs keydown auto-repeat. This is
// deliberately NOT Zustand: Zustand notifies every subscriber and lets selectors
// decide, which is the wrong model for 60 independent high-frequency signals.
// ============================================================================

type Listener = () => void

class PressStore {
  private state = new Map<string, boolean>()
  private listeners = new Map<string, Set<Listener>>()

  getSnapshot = (code: string): boolean => this.state.get(code) ?? false

  subscribe = (code: string, cb: Listener): (() => void) => {
    let set = this.listeners.get(code)
    if (!set) this.listeners.set(code, (set = new Set()))
    set.add(cb)
    return () => {
      set!.delete(cb)
    }
  }

  set(code: string, down: boolean): void {
    if ((this.state.get(code) ?? false) === down) return // dedupe (kills auto-repeat churn)
    this.state.set(code, down)
    const subs = this.listeners.get(code)
    if (subs) for (const cb of subs) cb()
  }

  /** Release every currently-pressed key (window blur / focus loss). */
  clearAll(): void {
    for (const [code, down] of this.state) {
      if (down) {
        this.state.set(code, false)
        const subs = this.listeners.get(code)
        if (subs) for (const cb of subs) cb()
      }
    }
  }
}

export const pressStore = new PressStore()

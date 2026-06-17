// ============================================================================
// cursorStore — per-character status as an external store. Each <Char> subscribes
// to its own index, so advancing the cursor notifies only the 2-3 chars that
// actually change (previous -> correct/incorrect, new -> current). The whole text
// (potentially hundreds of chars) never re-renders on a keystroke.
// ============================================================================

export const CHAR = {
  UPCOMING: 0,
  CORRECT: 1,
  INCORRECT: 2,
  CURRENT: 3,
} as const

export type CharStatus = (typeof CHAR)[keyof typeof CHAR]

type Listener = () => void

class CursorStore {
  private statuses = new Uint8Array(0)
  private indexListeners = new Map<number, Set<Listener>>()
  private cursorListeners = new Set<Listener>()
  private cursor = 0
  private length = 0

  // "next key to press" highlight — targeted like pressStore so only the two
  // affected keycaps (old next, new next) re-render when the cursor moves.
  private nextCode: string | null = null
  private nextListeners = new Map<string, Set<Listener>>()

  isNext = (code: string): boolean => this.nextCode === code

  subscribeNext = (code: string, cb: Listener): (() => void) => {
    let set = this.nextListeners.get(code)
    if (!set) this.nextListeners.set(code, (set = new Set()))
    set.add(cb)
    return () => {
      set!.delete(cb)
    }
  }

  setNext(code: string | null) {
    if (this.nextCode === code) return
    const prev = this.nextCode
    this.nextCode = code
    if (prev) {
      const subs = this.nextListeners.get(prev)
      if (subs) for (const cb of subs) cb()
    }
    if (code) {
      const subs = this.nextListeners.get(code)
      if (subs) for (const cb of subs) cb()
    }
  }

  init(length: number) {
    this.statuses = new Uint8Array(length)
    this.length = length
    this.cursor = 0
    if (length > 0) this.statuses[0] = CHAR.CURRENT
    this.setNext(null)
    // notify everyone listening (text changed wholesale) + cursor reset
    for (const subs of this.indexListeners.values()) for (const cb of subs) cb()
    for (const cb of this.cursorListeners) cb()
  }

  // ---- per-index status (subscribed by <Char>) ----
  statusOf = (i: number): CharStatus => (this.statuses[i] ?? CHAR.UPCOMING) as CharStatus

  subscribeIndex = (i: number, cb: Listener): (() => void) => {
    let set = this.indexListeners.get(i)
    if (!set) this.indexListeners.set(i, (set = new Set()))
    set.add(cb)
    return () => {
      set!.delete(cb)
    }
  }

  private setStatus(i: number, s: CharStatus) {
    if (i < 0 || i >= this.length) return
    if (this.statuses[i] === s) return
    this.statuses[i] = s
    const subs = this.indexListeners.get(i)
    if (subs) for (const cb of subs) cb()
  }

  // ---- cursor index (subscribed by caret / progress / autoscroll) ----
  getCursor = (): number => this.cursor
  getLength = (): number => this.length

  subscribeCursor = (cb: Listener): (() => void) => {
    this.cursorListeners.add(cb)
    return () => {
      this.cursorListeners.delete(cb)
    }
  }

  private notifyCursor() {
    for (const cb of this.cursorListeners) cb()
  }

  /** Record correctness at the cursor and advance. Returns the new cursor index. */
  advance(correct: boolean): number {
    if (this.cursor >= this.length) return this.cursor
    this.setStatus(this.cursor, correct ? CHAR.CORRECT : CHAR.INCORRECT)
    this.cursor++
    if (this.cursor < this.length) this.setStatus(this.cursor, CHAR.CURRENT)
    this.notifyCursor()
    return this.cursor
  }

  /** Backspace one position. Returns the new cursor index. */
  back(): number {
    if (this.cursor <= 0) return 0
    // clear current marker at the position we're leaving (if within bounds)
    if (this.cursor < this.length) this.setStatus(this.cursor, CHAR.UPCOMING)
    this.cursor--
    this.setStatus(this.cursor, CHAR.CURRENT)
    this.notifyCursor()
    return this.cursor
  }

  reset() {
    this.init(this.length)
  }
}

export const cursorStore = new CursorStore()

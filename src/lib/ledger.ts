// ============================================================================
// Columnar keystroke ledger. Hot columns are typed arrays (no per-keystroke
// object allocation -> no GC sawtooth). A small object ring backs the live
// event-stream display so it never reconstructs from the typed columns.
// ============================================================================

export type LedgerKind = 0 | 1 | 2 // 0 = typed, 1 = backspace, 2 = noop/blocked

export interface LedgerEvent {
  t: number
  code: string
  char: string
  correct: boolean
  kind: LedgerKind
}

const CAP = 8192
const RECENT = 28

export class Ledger {
  private t = new Float64Array(CAP)
  private codeId = new Uint16Array(CAP)
  private charCode = new Uint16Array(CAP)
  private correct = new Uint8Array(CAP)
  private kind = new Uint8Array(CAP)
  private head = 0 // ring write position
  private _len = 0 // total events ever written (monotonic)

  private codeDict: string[] = []
  private codeIndex = new Map<string, number>()

  // live display ring (objects, last RECENT events)
  private recentRing: LedgerEvent[] = []
  private recentHead = 0

  private intern(code: string): number {
    let id = this.codeIndex.get(code)
    if (id === undefined) {
      id = this.codeDict.length
      this.codeDict.push(code)
      this.codeIndex.set(code, id)
    }
    return id
  }

  push(t: number, code: string, char: string, correct: boolean, kind: LedgerKind): void {
    const i = this.head
    this.t[i] = t
    this.codeId[i] = this.intern(code)
    this.charCode[i] = char ? char.charCodeAt(0) : 0
    this.correct[i] = correct ? 1 : 0
    this.kind[i] = kind
    this.head = (this.head + 1) % CAP
    this._len++

    const ev: LedgerEvent = { t, code, char, correct, kind }
    if (this.recentRing.length < RECENT) {
      this.recentRing.push(ev)
    } else {
      this.recentRing[this.recentHead] = ev
      this.recentHead = (this.recentHead + 1) % RECENT
    }
  }

  get length(): number {
    return this._len
  }

  /** Most-recent-first list for the event stream. */
  recent(n = RECENT): LedgerEvent[] {
    const out: LedgerEvent[] = []
    const count = Math.min(this.recentRing.length, n)
    for (let i = 0; i < count; i++) {
      const idx = (this.recentHead - 1 - i + this.recentRing.length * 2) % this.recentRing.length
      out.push(this.recentRing[idx])
    }
    return out
  }

  reset(): void {
    this.head = 0
    this._len = 0
    this.recentRing = []
    this.recentHead = 0
    // typed columns are overwritten on next push; no need to zero them
  }
}

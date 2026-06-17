// ============================================================================
// Web-Audio synthesized key clicks — no audio assets. A short filtered "thock"
// for normal keys and a duller tone for errors. Lazily inits the AudioContext
// on first real use (user gesture), respecting an enable flag + volume.
// ============================================================================

type ClickKind = 'key' | 'error' | 'space'

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = false
  private volume = 0.4

  setEnabled(on: boolean) {
    this.enabled = on
    if (on) this.ensure()
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master) this.master.gain.value = this.volume
  }

  private ensure() {
    if (this.ctx) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    } catch {
      this.ctx = null
    }
  }

  click(kind: ClickKind = 'key') {
    if (!this.enabled) return
    this.ensure()
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    const dur = kind === 'error' ? 0.09 : 0.045

    // tonal body — a short pitched click
    const osc = ctx.createOscillator()
    osc.type = kind === 'error' ? 'sawtooth' : 'triangle'
    const baseFreq = kind === 'error' ? 150 : kind === 'space' ? 320 : 520
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + dur)

    const g = ctx.createGain()
    const peak = (kind === 'error' ? 0.5 : 0.35) * this.volume
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

    // high-pass to keep it crisp, not boomy
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = kind === 'error' ? 120 : 300

    osc.connect(g)
    g.connect(hp)
    hp.connect(master)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }
}

export const audio = new AudioEngine()

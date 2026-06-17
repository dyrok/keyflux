import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_PREFS,
  EMPTY_METRICS,
  type BestScore,
  type CaretStyle,
  type HeatmapMode,
  type LayoutId,
  type KeyStat,
  type LiveMetrics,
  type Prefs,
  type SessionStatus,
  type SessionSummary,
  type TestMode,
  type ThemeMode,
  type WpmSample,
} from '../types'
import {
  CHALLENGES,
  DEFAULT_CHALLENGE_ID,
  buildWordChallenge,
  type Challenge,
} from '../data/challenges'
import { LAYOUT_IDS } from '../data/layouts'
import { makeId } from '../lib/format'
import type { LedgerEvent } from '../lib/ledger'

export interface Toast {
  id: string
  kind: 'pb' | 'info' | 'success'
  title: string
  message?: string
}

const HISTORY_CAP = 30
const SERIES_CAP = 160

function trimSeries(series: WpmSample[]): WpmSample[] {
  if (series.length <= SERIES_CAP) return series
  const step = series.length / SERIES_CAP
  const out: WpmSample[] = []
  for (let i = 0; i < SERIES_CAP; i++) out.push(series[Math.floor(i * step)])
  out.push(series[series.length - 1])
  return out
}

interface KeyFluxState {
  // ---- persisted ----
  prefs: Prefs
  customChallenges: Challenge[]
  history: SessionSummary[]
  bests: Partial<Record<LayoutId, BestScore>>

  // ---- transient ----
  status: SessionStatus
  baseChallengeId: string
  challengeTitle: string
  targetText: string
  seed: number
  attempt: number // bumps on every reset so the engine re-prepares even on identical text
  live: LiveMetrics
  wpmSeries: WpmSample[]
  liveEvents: LedgerEvent[]
  liveKeyStats: KeyStat[]
  lastSummary: SessionSummary | null
  summaryOpen: boolean
  isNewPb: boolean
  paletteOpen: boolean
  drawerOpen: boolean
  historyOpen: boolean
  toasts: Toast[]
  focusNonce: number // bump to imperatively focus the test surface

  // ---- pref actions ----
  setLayout: (l: LayoutId) => void
  cycleLayout: () => void
  toggleSimulate: () => void
  setTheme: (t: ThemeMode) => void
  cycleTheme: () => void
  toggleSound: () => void
  setVolume: (v: number) => void
  toggleConfetti: () => void
  setCaret: (c: CaretStyle) => void
  toggleFocusMode: () => void
  toggleKeycodes: () => void
  toggleHeatmap: () => void
  setHeatmapMode: (m: HeatmapMode) => void
  toggleGhost: () => void
  setMode: (m: TestMode) => void

  // ---- session actions ----
  loadChallenge: (id: string) => void
  loadChallengeText: (text: string, title: string) => void
  shuffleChallenge: () => void
  regenerateTarget: () => void
  setStatus: (s: SessionStatus) => void
  requestFocus: () => void
  commitLive: (live: LiveMetrics, series?: WpmSample[]) => void
  commitEvents: (events: LedgerEvent[]) => void
  commitKeyStats: (stats: KeyStat[]) => void
  completeSession: (summary: SessionSummary) => void
  reset: () => void

  // ---- ui ----
  openSummary: () => void
  closeSummary: () => void
  setPaletteOpen: (v: boolean) => void
  setDrawerOpen: (v: boolean) => void
  setHistoryOpen: (v: boolean) => void
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  // ---- custom challenges / history ----
  addCustomChallenge: (text: string, title: string) => void
  removeCustomChallenge: (id: string) => void
  clearHistory: () => void
}

function resolveText(state: Pick<KeyFluxState, 'prefs' | 'baseChallengeId' | 'seed' | 'customChallenges'>): {
  text: string
  title: string
} {
  const mode = state.prefs.mode
  if (mode.kind === 'words') {
    return { text: buildWordChallenge(mode.count, state.seed), title: `${mode.count} words` }
  }
  if (mode.kind === 'timed') {
    // generous stream so a fast typist won't run out before the clock
    return { text: buildWordChallenge(120, state.seed), title: `${mode.seconds}s timed` }
  }
  const all = [...CHALLENGES, ...state.customChallenges]
  const ch = all.find((c) => c.id === state.baseChallengeId) ?? all[0]
  return { text: ch.text, title: ch.title }
}

export const useKeyFluxStore = create<KeyFluxState>()(
  persist(
    (set, get) => ({
      prefs: DEFAULT_PREFS,
      customChallenges: [],
      history: [],
      bests: {},

      status: 'idle',
      baseChallengeId: DEFAULT_CHALLENGE_ID,
      challengeTitle: '',
      targetText: '',
      seed: 1,
      attempt: 0,
      live: EMPTY_METRICS,
      wpmSeries: [],
      liveEvents: [],
      liveKeyStats: [],
      lastSummary: null,
      summaryOpen: false,
      isNewPb: false,
      paletteOpen: false,
      drawerOpen: false,
      historyOpen: false,
      toasts: [],
      focusNonce: 0,

      setLayout: (l) => set((s) => ({ prefs: { ...s.prefs, layout: l } })),
      cycleLayout: () => {
        const cur = get().prefs.layout
        const idx = LAYOUT_IDS.indexOf(cur)
        const next = LAYOUT_IDS[(idx + 1) % LAYOUT_IDS.length]
        set((s) => ({ prefs: { ...s.prefs, layout: next } }))
      },
      toggleSimulate: () => set((s) => ({ prefs: { ...s.prefs, simulate: !s.prefs.simulate } })),
      setTheme: (t) => set((s) => ({ prefs: { ...s.prefs, theme: t } })),
      cycleTheme: () => {
        const order: ThemeMode[] = ['dark', 'midnight', 'light']
        const cur = get().prefs.theme
        const next = order[(order.indexOf(cur) + 1) % order.length]
        set((s) => ({ prefs: { ...s.prefs, theme: next } }))
      },
      toggleSound: () => set((s) => ({ prefs: { ...s.prefs, sound: !s.prefs.sound } })),
      setVolume: (v) => set((s) => ({ prefs: { ...s.prefs, soundVolume: v } })),
      toggleConfetti: () => set((s) => ({ prefs: { ...s.prefs, confetti: !s.prefs.confetti } })),
      setCaret: (c) => set((s) => ({ prefs: { ...s.prefs, caret: c } })),
      toggleFocusMode: () => set((s) => ({ prefs: { ...s.prefs, focusMode: !s.prefs.focusMode } })),
      toggleKeycodes: () => set((s) => ({ prefs: { ...s.prefs, showKeycodes: !s.prefs.showKeycodes } })),
      toggleHeatmap: () => set((s) => ({ prefs: { ...s.prefs, heatmapEnabled: !s.prefs.heatmapEnabled } })),
      setHeatmapMode: (m) => set((s) => ({ prefs: { ...s.prefs, heatmapMode: m } })),
      toggleGhost: () => set((s) => ({ prefs: { ...s.prefs, ghost: !s.prefs.ghost } })),
      setMode: (m) => {
        set((s) => ({ prefs: { ...s.prefs, mode: m } }))
        get().reset()
      },

      loadChallenge: (id) => {
        set((s) => ({ baseChallengeId: id, prefs: { ...s.prefs, mode: { kind: 'fixed' } } }))
        get().reset()
      },
      loadChallengeText: (text, title) => {
        get().addCustomChallenge(text, title)
      },
      shuffleChallenge: () => {
        const all = [...CHALLENGES, ...get().customChallenges]
        const next = all[Math.floor(Math.random() * all.length)]
        set((s) => ({
          baseChallengeId: next.id,
          seed: (s.seed * 1664525 + 1013904223) & 0x7fffffff,
        }))
        get().reset()
      },
      regenerateTarget: () => {
        const s = get()
        const { text, title } = resolveText(s)
        set({ targetText: text, challengeTitle: title })
      },

      setStatus: (status) => set({ status }),
      requestFocus: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),

      commitLive: (live, series) =>
        set(series ? { live, wpmSeries: series } : { live }),
      commitEvents: (events) => set({ liveEvents: events }),
      commitKeyStats: (stats) => set({ liveKeyStats: stats }),

      completeSession: (summary) => {
        const trimmed: SessionSummary = { ...summary, wpmSeries: trimSeries(summary.wpmSeries) }
        const prevBest = get().bests[summary.layout]
        const isNewPb = !prevBest || summary.wpm > prevBest.wpm
        const nextBests = { ...get().bests }
        if (isNewPb) {
          nextBests[summary.layout] = {
            wpm: summary.wpm,
            accuracy: summary.accuracy,
            consistency: summary.consistency,
            date: summary.date,
            wpmSeries: trimmed.wpmSeries,
          }
        }
        set((s) => ({
          status: 'finished',
          lastSummary: trimmed,
          summaryOpen: true,
          isNewPb,
          bests: nextBests,
          history: [trimmed, ...s.history].slice(0, HISTORY_CAP),
        }))
        if (isNewPb) {
          get().pushToast({
            kind: 'pb',
            title: 'New personal best',
            message: `${Math.round(summary.wpm)} wpm · ${summary.layout.toUpperCase()}`,
          })
        }
      },

      reset: () => {
        const s = get()
        const { text, title } = resolveText(s)
        set((st) => ({
          status: 'idle',
          targetText: text,
          challengeTitle: title,
          live: EMPTY_METRICS,
          wpmSeries: [],
          liveEvents: [],
          liveKeyStats: [],
          isNewPb: false,
          attempt: st.attempt + 1,
        }))
      },

      openSummary: () => set({ summaryOpen: true }),
      closeSummary: () => set({ summaryOpen: false }),
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      setDrawerOpen: (v) => set({ drawerOpen: v }),
      setHistoryOpen: (v) => set({ historyOpen: v }),

      pushToast: (t) => {
        const id = makeId('toast')
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addCustomChallenge: (text, title) => {
        const ch: Challenge = {
          id: makeId('custom'),
          title: title.trim() || 'Custom',
          category: 'prose',
          text: text.trim(),
        }
        set((s) => ({ customChallenges: [ch, ...s.customChallenges].slice(0, 24) }))
        set((s) => ({ baseChallengeId: ch.id, prefs: { ...s.prefs, mode: { kind: 'fixed' } } }))
        get().reset()
      },
      removeCustomChallenge: (id) =>
        set((s) => ({ customChallenges: s.customChallenges.filter((c) => c.id !== id) })),
      clearHistory: () => set({ history: [], bests: {} }),
    }),
    {
      name: 'keyflux:store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        prefs: s.prefs,
        customChallenges: s.customChallenges,
        history: s.history,
        bests: s.bests,
      }),
      onRehydrateStorage: () => (state) => {
        // build the first target after prefs are restored
        state?.regenerateTarget()
      },
    },
  ),
)

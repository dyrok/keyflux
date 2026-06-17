import { create } from 'zustand'

// Kept in its own store so a heatmap recompute (touching up to 60 keys at ~2 Hz)
// can't force the telemetry cards subscribed to the main store to re-evaluate
// selectors, and vice versa. Keycaps subscribe to a scalar: s.intensity[code].

interface HeatmapState {
  intensity: Record<string, number>
  revealed: boolean
  commit: (next: Record<string, number>) => void
  setRevealed: (v: boolean) => void
  clear: () => void
}

export const useHeatmapStore = create<HeatmapState>((set) => ({
  intensity: {},
  revealed: false,
  commit: (next) => set({ intensity: next }),
  setRevealed: (v) => set({ revealed: v }),
  clear: () => set({ intensity: {}, revealed: false }),
}))

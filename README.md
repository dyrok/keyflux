# KeyFlux — Virtual Keyboard & Typing Analytics Lab

A premium, frontend-only typing speed meter and keyboard analytics lab. It blends
Monkeytype-grade typing flow with a hardware-diagnostics dashboard: a virtual
keyboard reacts instantly to real physical key presses, live telemetry tracks WPM,
accuracy, consistency and per-key friction, and a heatmap surfaces your problem keys.

Everything runs **fully client-side** — no backend, no database, no accounts.
`localStorage` is used only for preferences, best scores, and session history.

![dark](https://img.shields.io/badge/theme-dark--first-1FC8DB) ![stack](https://img.shields.io/badge/React-TS-2BC48A) ![offline](https://img.shields.io/badge/backend-none-7B838F)

---

## Features

- **Live virtual keyboard** that highlights physical key presses instantly (keyed by
  `event.code`, so it's layout-independent).
- **Three layouts** — QWERTY, Dvorak, Colemak — with two behaviors:
  - **Relabel** (default): keycaps + heatmap relabel; the test uses the characters
    your OS keyboard produces (like monkeytype/keybr).
  - **Simulate** (toggle): physical keys are remapped through the chosen layout, so
    you can practice Dvorak/Colemak on a QWERTY OS.
- **Real-time telemetry** — WPM, raw WPM, accuracy, consistency, elapsed time,
  keystrokes, errors, backspaces — updated smoothly via a throttled rAF pump.
- **Friction heatmap** with three modes: **error**, **usage**, **latency**. Crimson
  intensity is session-normalized; a redundant corner-dot encodes intensity for
  colour-blind accessibility.
- **Per-key friction table**, **per-finger & hand-balance load**, and an estimated
  **finger-travel distance** (mm).
- **Session summary** with a WPM-over-time chart (net + raw + error markers), an
  optional dashed **best-run ghost** line, finger analysis, and a friction matrix.
- **Test modes** — fixed text, timed (15/30/60s), or word-count (10/25/50).
- **Extras** — synthesized key-click sound, completion confetti, live WPM sparkline,
  current-vs-best comparison, physical keycode ↔ layout-label toggle, **ghost replay**
  rail (race your best run), caret styles (bar/underline/block), focus mode, and
  multiple themes (dark / midnight / light).
- **Command palette** (`⌘/Ctrl + K`) for every action.
- **Export** a session as **JSON** or a **PNG share card**.
- **Persistence** — layout, theme, preferences, custom challenges, best scores, and
  recent session history are saved locally and restored on reload.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Just start typing | Begins the test on the first valid keystroke |
| `Tab` | Restart the current challenge (when not mid-run) |
| `Enter` | Start a new run after one finishes |
| `⌘ / Ctrl + K` | Open the command palette |
| `Esc` | Close any open overlay |

> Bare-letter shortcuts are intentionally avoided so they never collide with typing —
> layout cycling, theme, sound, etc. all live in the command palette and command bar.

---

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Requires Node 18+ (developed on Node 25). No environment variables, no services.

---

## Architecture

The central challenge is that physical key events fire 50+/second and would re-render
60+ keycaps and a wall of telemetry on every keystroke. KeyFlux solves this by
classifying state into **three tiers by mutation frequency**:

| Tier | Data | Storage | Re-renders |
| --- | --- | --- | --- |
| **Hot transient** | pressed keys, cursor/char status, next-key highlight | bespoke per-key external stores (`useSyncExternalStore`) | only the one affected keycap / character |
| **Accumulated raw** | input ledger, per-key accumulators, timing | refs (never React state) | none |
| **Derived display** | WPM, accuracy, heatmap, friction | Zustand (2 stores) | telemetry cards, at the pump cadence |

Load-bearing decisions:

1. **`pressStore`** — a tiny external store with per-key `subscribe(code)` /
   `getSnapshot(code)`. `pressStore.set('KeyJ', true)` notifies only `KeyJ`'s
   listeners → pressing a key re-renders exactly one keycap. Idempotent, so keydown
   auto-repeat is absorbed.
2. **No metric math in event handlers.** Handlers do a few cheap ref writes plus one
   targeted notify. A single **rAF pump** (`useLiveMetrics`) is the only writer to
   reactive metric state — ~12 Hz for metrics, ~2 Hz for the heatmap.
3. **Columnar typed-array ledger** (`lib/ledger.ts`) — zero per-keystroke object
   allocation, ring-buffered, with a small object ring backing the live event stream.
4. **Two Zustand stores** (main + heatmap) keep their notification fan-outs
   independent; the keyboard subtree and telemetry never share a render boundary.
5. **Friction score** (`lib/friction.ts`): `clamp01((0.65·errorRate + 0.35·latencyN)
   · confidence)`, where latency is normalized against the session's own p5–p95 and a
   confidence prior keeps a key pressed twice from screaming red.
6. **Window-blur cleanup** releases stuck keys and freezes elapsed time so AFK gaps
   don't tank your WPM.

### Folder structure

```
src/
  app/         AppShell, command bar, command palette, effect hosts, root App
  components/  primitives — Button, IconButton, Toggle, SegmentedControl, Modal,
               Sparkline, AnimatedNumber, Chip, Toaster, Kbd
  features/
    keyboard/  KeyboardStage, KeyboardRow, Keycap, HeatmapLegend
    typing/    TypingEngine, ChallengeDisplayCard, Char, ProgressRail, GhostRail
    telemetry/ TelemetryHUD, MetricCard, FrictionTable, FingerLoad, WpmChart,
               BestCompare, EventLedgerStream
    layouts/   LayoutSwitcher
    history/   SessionSummaryModal, HistoryPanel, CustomChallengeDrawer
  store/       useKeyFluxStore (config/prefs/metrics + persist), heatmapStore,
               pressStore, cursorStore
  hooks/       useGlobalKeyCapture, useLiveMetrics, useKeycapState, useCharStatus,
               useTheme, useSound, useHotkeys
  lib/         metrics, friction, ledger, finger geometry/travel, audio, confetti,
               export (JSON + PNG), motion presets, formatting, cn
  data/        layouts (code→glyph maps), fingers, sample challenges
  types/       shared domain types
```

### Adding a layout

Add a glyph override map in `src/data/layouts.ts` (only the keys that differ from
QWERTY) and register it in `LAYOUTS` / `LAYOUT_IDS`. Finger assignments and geometry
are inherited from the shared physical model — no other changes required.

---

## Design & the Times New Roman constraint

The interface is a dark-first graphite "instrument console": layered surfaces, a
desaturated cyan/emerald/crimson/amber accent system, Inter for the shell and
JetBrains Mono for telemetry values. Motion (Framer Motion) is restrained — count-up
metric springs, keycap press flashes, a 1:1 progress rail.

An academic requirement mandates that **row labels, layout-switch labels, the accuracy
matrix, keycap legends, and action-button text** render in a **12pt Times New Roman**
profile. This is contained to a single utility (`.tnr-12` in `src/index.css`) applied
to exactly those five element categories — colour always comes from the token system,
so theming and contrast stay intact and the serif reads as a deliberate "spec-sheet"
data layer rather than a regression. Everything else stays premium and modern.

---

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · Framer Motion ·
lucide-react · canvas-confetti · @fontsource (Inter, JetBrains Mono).

## Notes & tradeoffs

- Live metrics lag reality by ≤80 ms — imperceptible, and the cost of staying at 60fps.
- Dvorak/Colemak relabel is cosmetic by default; **Simulate** opt-in remaps input.
- Very long sessions ring-buffer the raw ledger while permanent per-key aggregates
  retain full stats.
- All analytics are computed from your real keystrokes — nothing is faked.

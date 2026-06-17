# ⌨️ KeyFlux — Typing Analytics Lab

A frontend-only typing speed meter and keyboard diagnostics lab. It combines
Monkeytype-style typing flow with a hardware analytics dashboard: a virtual keyboard
that reacts to real key presses, live telemetry for WPM / accuracy / consistency /
per-key friction, and a heatmap that surfaces your problem keys.

Everything runs **fully in the browser** — no backend, no database, no accounts.
`localStorage` handles preferences, best scores, and session history.

![dark](https://img.shields.io/badge/theme-dark--first-1FC8DB) ![stack](https://img.shields.io/badge/React-TS-2BC48A) ![offline](https://img.shields.io/badge/backend-none-7B838F)

---

## 📄 Cover Page

| Field | Value |
| --- | --- |
| **Project Title** | KeyFlux — Virtual Keyboard & Typing Analytics Lab |
| **Tagline** | A fully client-side typing speed meter and keyboard friction analytics dashboard |
| **Domain** | Frontend Web Application · Human-Computer Interaction · Real-time Input Analytics |
| **Type** | Individual Case Study / Lab Project |
| **Submission Format** | LISA Documentation (PDF export of this README) |

![Cover](./docs/screenshots/cover.png)

---

## 👤 Student Details

| Field | Details |
| --- | --- |
| **Name** | _[Your Full Name]_ |
| **Roll / Register No.** | _[____]_ |
| **Course / Branch** | _[B.Tech / ____]_ |
| **Semester** | _[____]_ |
| **College / Institution** | _[____]_ |
| **Academic Year** | _[2025–2026]_ |
| **Guide / Faculty** | _[____]_ |

> Fill these in before exporting to PDF.

---

## 🎯 Problem Statement

Most typing apps just show a WPM number and stop there — no insight into _why_ you're
slow or which keys are costing you time. Keyboard-layout learners (Dvorak, Colemak)
have to fight their OS settings just to practice, and there's no good way to see
per-key friction.

**KeyFlux solves three problems:**

1. **Blind typing feedback** — A per-key friction heatmap (error / usage / latency),
   per-finger & hand-balance load, and estimated finger-travel distance in mm, so you
   can actually see your weak spots.
2. **Layout practice without OS changes** — Relabel keycaps (cosmetic) or simulate a
   layout by remapping physical keys through it. Practice Dvorak/Colemak on a QWERTY
   OS with no settings changes.
3. **Real-time analytics at 60fps** — Physical key events fire 50+ times per second.
   KeyFlux classifies state by mutation frequency and re-renders only the single
   keycap that changed, keeping the UI smooth while crunching live metrics.

**Goal:** a fast, offline-first typing lab that turns raw keystrokes into actionable
insight — no servers, no signups.

---

## 🛠️ Tech Stack

| Layer | Tech | Why |
| --- | --- | --- |
| **UI Framework** | React 19 + TypeScript | Component model + type safety |
| **Build Tool** | Vite 8 | Fast HMR + lean production builds |
| **Styling** | Tailwind CSS 3 | Utility-first tokens, dark-first theming |
| **State** | Zustand 5 (+ `persist`) | Lightweight, independent store fan-outs |
| **Animation** | Framer Motion 12 | Restrained motion — count-up springs, keycap flashes |
| **Icons** | lucide-react | Clean line icons |
| **Confetti** | canvas-confetti | Completion celebration |
| **Fonts** | @fontsource Inter + JetBrains Mono | Shell vs. telemetry typography |

**Runtime:** Node 18+ (developed on Node 25). Zero environment variables, zero services.

---

## 🧩 Component Architecture

The app is organized by **feature domain**, not by component type. Each folder owns
its UI and the logic that feeds it.

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

### ⚡ The Three-Tier State Model

This is the core of the architecture. Physical key events fire 50+ times per second —
re-rendering 60+ keycaps and a stats wall on every keystroke would cause frame drops.
KeyFlux classifies state into **three tiers by mutation frequency**:

| Tier | Data | Storage | Re-renders |
| --- | --- | --- | --- |
| **Hot transient** | pressed keys, cursor/char status, next-key highlight | per-key external stores (`useSyncExternalStore`) | only the affected keycap / character |
| **Accumulated raw** | input ledger, per-key accumulators, timing | refs (never React state) | none |
| **Derived display** | WPM, accuracy, heatmap, friction | Zustand (2 stores) | telemetry cards, at pump cadence |

**Key decisions:**

1. **`pressStore`** — a per-key external store. `pressStore.set('KeyJ', true)` notifies
   only `KeyJ`'s listeners, so pressing a key re-renders exactly one keycap. Idempotent,
   so keydown auto-repeat is absorbed.
2. **No metric math in event handlers.** Handlers do cheap ref writes + one targeted
   notify. A single **rAF pump** (`useLiveMetrics`) is the only writer to reactive
   metric state — ~12 Hz for metrics, ~2 Hz for the heatmap.
3. **Columnar typed-array ledger** (`lib/ledger.ts`) — zero per-keystroke object
   allocation, ring-buffered.
4. **Two Zustand stores** (main + heatmap) keep notification fan-outs independent; the
   keyboard and telemetry subtrees never share a render boundary.
5. **Friction score** (`lib/friction.ts`): `clamp01((0.65·errorRate + 0.35·latencyN) · confidence)`,
   where latency is normalized against the session's p5–p95 range.
6. **Window-blur cleanup** releases stuck keys and freezes elapsed time so AFK gaps
   don't affect your WPM.

### ➕ Adding a Layout

Add a glyph override map in `src/data/layouts.ts` (only the keys that differ from
QWERTY) and register it in `LAYOUTS` / `LAYOUT_IDS`. Finger assignments and geometry
are inherited from the shared physical model — no other changes required.

---

## ✨ Features

- **Live virtual keyboard** — highlights physical key presses instantly, keyed by
  `event.code` (layout-independent).
- **Three layouts** — QWERTY, Dvorak, Colemak — with two behaviors:
  - **Relabel** (default): keycaps + heatmap relabel; the test uses OS-produced characters.
  - **Simulate** (toggle): physical keys are remapped through the chosen layout.
- **Real-time telemetry** — WPM, raw WPM, accuracy, consistency, elapsed time,
  keystrokes, errors, backspaces — updated via a throttled rAF pump.
- **Friction heatmap** — three modes: error, usage, latency. Session-normalized
  intensity with a colour-blind-accessible corner-dot encoding.
- **Per-key friction table**, **per-finger & hand-balance load**, and estimated
  **finger-travel distance** (mm).
- **Session summary** — WPM-over-time chart (net + raw + error markers), optional
  best-run ghost line, finger analysis, and friction matrix.
- **Test modes** — fixed text, timed (15/30/60s), or word-count (10/25/50).
- **Extras** — key-click sound, completion confetti, live WPM sparkline, current-vs-best
  comparison, ghost replay rail, caret styles (bar/underline/block), focus mode, and
  multiple themes (dark / midnight / light).
- **Command palette** (`⌘/Ctrl + K`) for every action.
- **Export** — session as JSON or a PNG share card.
- **Persistence** — layout, theme, preferences, custom challenges, best scores, and
  session history saved locally and restored on reload.

### ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| Start typing | Begins the test on the first valid keystroke |
| `Tab` | Restart the current challenge |
| `Enter` | Start a new run after one finishes |
| `⌘ / Ctrl + K` | Open the command palette |
| `Esc` | Close any open overlay |

> Bare-letter shortcuts are intentionally avoided so they never collide with typing.

---

## 📸 Screenshots

> Capture these from `npm run dev` and save them to `docs/screenshots/`.

### 1. Main typing view
The dark console: challenge card with prompt text + caret, live telemetry HUD, and the
virtual keyboard reacting to real key presses.

![Main view](./docs/screenshots/01-main.png)

### 2. Live telemetry + friction heatmap
Mid-run metrics and the keyboard heatmap in **error** mode — crimson intensity on
problem keys with the colour-blind corner-dot encoding.

![Telemetry + heatmap](./docs/screenshots/02-heatmap.png)

### 3. Heatmap modes (usage / latency)
The keyboard in **usage** and **latency** modes, showing how the intensity source switches.

![Heatmap modes](./docs/screenshots/03-heatmap-modes.png)

### 4. Session summary
Post-run summary: WPM-over-time chart, best-run ghost line, finger-load breakdown, and
friction matrix.

![Session summary](./docs/screenshots/04-summary.png)

### 5. Layout switcher
The layout switcher open with keycaps relabelled to Dvorak and the "Simulated layout"
chip active.

![Layout switcher](./docs/screenshots/05-layouts.png)

### 6. Command palette (`⌘K`)
The command palette overlay listing every action.

![Command palette](./docs/screenshots/06-command-palette.png)

### 7. PNG share card export
The exported 1200×630 graphite spec sheet with hero WPM, sub-metrics, and WPM sparkline.

![Share card](./docs/screenshots/07-share-card.png)

---

## 🏁 Conclusion

KeyFlux demonstrates that a fast, analytics-rich typing lab can run **entirely in the
browser** — no backend, no accounts, no data collection. The core challenge wasn't the
typing itself; it was maintaining 60fps while 50+ key events per second flow through a
live dashboard. The three-tier state model (per-key external stores for hot transient
state, refs for raw accumulation, Zustand for derived display) lets a single keystroke
re-render exactly one keycap instead of the entire tree.

The friction heatmap, per-finger load, and finger-travel distance turn "I type slow"
into actionable, specific feedback. Layout learners get Dvorak/Colemak practice without
fighting their OS. Everything persists locally, so best scores and history survive a
reload.

**Future work:** a typing-tutor mode that generates drills from your worst keys, and a
`navigator.clipboard` one-tap "copy stats" button for quick sharing.

---

## 🔗 Links

| | |
| --- | --- |
| **GitHub Repository** | https://github.com/dyrok/keyflux |
| **Live Demo** | _[https://your-live-url.vercel.app]_ |

> Deploy on Vercel/Netlify — a frontend-only static build deploys in one click.

---

## 🚀 Getting Started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

---

## 📚 Technical Q&A

### 1. How can React components be structured to manage virtual keyboards, typing challenges, performance dashboards, and analytics panels?

Structure by **feature domain**, not by component type. Each feature folder owns its
UI and the logic that feeds it, making features self-contained and removable.

In KeyFlux, `src/features/` holds four domains:

- **`keyboard/`** — `KeyboardStage` → `KeyboardRow` → `Keycap`. Each `Keycap`
  subscribes to only its own press state via `useKeycapState(code)`, so a keypress
  re-renders one keycap, not the board.
- **`typing/`** — `TypingEngine` (the input brain) + `ChallengeDisplayCard` (the
  prompt), `Char`, `ProgressRail`, `GhostRail`. The engine owns keystroke
  classification; the card renders derived state.
- **`telemetry/`** — `TelemetryHUD`, `MetricCard`, `FrictionTable`, `FingerLoad`,
  `WpmChart`, `BestCompare`. These read from Zustand at the rAF pump cadence,
  decoupled from the keyboard's render boundary.
- **`history/`** — `SessionSummaryModal`, `HistoryPanel`, `CustomChallengeDrawer`.

Shared primitives live in `src/components/`. Cross-cutting hosts (global key capture,
live metrics, sound, theme) live in `src/app/hosts.tsx` and render nothing — they're
effect-only.

The key principle: **keep render boundaries aligned with data boundaries.** The
keyboard and telemetry subtrees never share a store subscription, so a keystroke can't
accidentally trigger a stats re-render.

### 2. How can Zustand or React hooks be used to manage keyboard layouts, keystroke history, typing metrics, and accuracy calculations?

**Zustand** carries the _derived display_ state — what the UI reads at a controlled
cadence. KeyFlux uses two stores with independent fan-outs:

- `useKeyFluxStore` — config, prefs (layout, theme, caret, simulate), live metrics, and
  the persisted slice (best scores, history, custom challenges). Wrapped in the
  `persist` middleware backed by `localStorage`.
- `heatmapStore` — friction/heatmap data, kept separate so heatmap updates (≈2 Hz)
  don't wake the metric cards (≈12 Hz).

Selectors are granular (`useKeyFluxStore((s) => s.targetText)`) so components only
re-render when their slice changes.

**React hooks + refs** carry the _hot_ and _raw_ tiers, which are too fast for React
state:

- **Layouts** — the active layout is a pref in Zustand; the glyph remap happens in the
  engine via `engine.refreshLayout()`. The keyboard reads labels through
  `useKeycapState`, pulling from the per-key external `pressStore` + the layout map.
- **Keystroke history** — never stored in React state. It goes into a **columnar
  typed-array ledger** (`lib/ledger.ts`): ring-buffered, zero per-keystroke object
  allocation. Refs hold the live accumulators.
- **Metrics** — `useLiveMetrics` is a single rAF pump and the only writer to reactive
  metric state. It reads the ledger/refs, computes WPM/accuracy/consistency, and pushes
  to Zustand ~12×/sec.
- **Accuracy** — computed in `lib/metrics.ts` from the ledger:
  `correctKeystrokes / totalKeystrokes`. Derived at pump time, not in the keydown
  handler, so it's both accurate and cheap.

The split is deliberate: **Zustand for what the UI reads, refs for what the engine
writes, hooks to bridge them on a clock.**

### 3. Why is performance optimization important when processing rapid keyboard events and updating live statistics?

A fast typist fires 50–100+ key events per second. A naive React app would turn every
one into a full-tree re-render — 60+ keycaps, a stats wall, and a chart all re-rendering
80×/sec. That causes frame drops, and a jittery typing test is a failed typing test:
input lag directly corrupts the latency measurements the app is trying to collect.

KeyFlux optimizes at three levels:

1. **Per-key subscriptions.** `pressStore` is an external store with
   `subscribe(code)`/`getSnapshot(code)`. Pressing `KeyJ` notifies only `KeyJ`'s
   listeners via `useSyncExternalStore` — one keycap re-renders, not the board.
2. **No work in event handlers.** Handlers do cheap ref writes + one targeted notify.
   All metric math is deferred to a single rAF pump (`useLiveMetrics`), which batches a
   frame's worth of keystrokes into one Zustand write.
3. **Zero-allocation hot path.** The ledger uses typed arrays + a ring buffer, so the
   50–100 events/sec never trigger GC pressure.

The payoff: live metrics lag reality by ≤80 ms (imperceptible) while the UI holds 60fps.

### 4. Why should typing-analysis and keyboard-layout logic be separated from UI rendering components?

Separation of concerns, with a concrete performance reason: **the analysis logic runs
at input speed (50–100 Hz), the UI renders at display speed (≤60 Hz).** Coupling them
means every keystroke forces a render — back to the frame-drop problem.

In KeyFlux the split is physical:

- **`lib/`** holds the pure, framework-agnostic brain: `metrics.ts`, `friction.ts`,
  `ledger.ts`, `finger.ts`, `data/layouts.ts`. None import React. They're testable in
  isolation and reusable.
- **`features/typing/TypingEngine`** is the stateful orchestrator that owns
  keydown/keyup classification and writes to refs + the per-key store. It doesn't render.
- **`features/keyboard/*` and `features/telemetry/*`** are the renderers. They
  subscribe to slices of state; they never compute metrics themselves.

Benefits: (a) the hot path stays allocation-free and React-free; (b) you can unit-test
the friction formula or accuracy calc without mounting a component; (c) UI components
stay simple and fast — they just read and paint; (d) swapping the renderer doesn't
touch the analytics. The layout logic lives in `data/layouts.ts` as pure data, so adding
Dvorak is a glyph map, not a component edit.

### 5. How can browser Keyboard Events, LocalStorage, and Clipboard APIs be utilized in a frontend-only typing analytics application?

**Keyboard Events (`KeyboardEvent`)** are the entire input source. KeyFlux attaches
`keydown`/`keyup` listeners on `window` in the **capture phase** (so timestamps are
taken early and `preventDefault` works inside the lab) via `useGlobalKeyCapture`. It
keys everything on **`event.code`** (the physical key, e.g. `KeyJ`), not `event.key`
(the produced character) — this makes the keyboard layout-independent and lets Simulate
mode remap physical keys through Dvorak/Colemak. It also listens for
`blur`/`visibilitychange` to release stuck keys and freeze elapsed time when you tab away.

**LocalStorage** is the persistence layer. KeyFlux uses Zustand's `persist` middleware
with `createJSONStorage(() => localStorage)` to auto-save and restore prefs (layout,
theme, caret, simulate, sound), best scores, custom challenges, and session history.
`useTheme` writes `keyflux:theme` directly to apply the theme before React hydrates,
avoiding a flash. Everything is key-scoped (`keyflux:*`).

**Blob + Object URL + download anchor (export).** For sharing without a server,
`lib/export.ts` builds a `Blob` (JSON session dump, or a PNG share card rendered to
`<canvas>` via `canvas.toBlob`), creates an object URL with `URL.createObjectURL`, and
triggers a download through a synthetic `<a download>` click — then revokes the URL.
This gives one-click JSON/PNG export fully client-side. A natural extension is the
**Clipboard API** (`navigator.clipboard.writeText`) for a one-tap "copy stats" button.

The unifying idea: the browser ships every primitive a typing lab needs — input
capture, local persistence, and export/sharing. Wire them together with a disciplined
state model and you need zero infrastructure.

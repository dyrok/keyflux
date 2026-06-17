# KeyFlux — Typing Analytics Lab

> _"touch grass? nah bro, touch keyboard."_

A frontend-only typing speed meter + keyboard diagnostics lab. Monkeytype-grade
typing flow bolted onto a hardware analytics dashboard — a virtual keyboard that
lights up on every real key press, live telemetry for WPM / accuracy / consistency /
per-key friction, and a heatmap that snitches on your problem keys.

No backend. No database. No accounts. No cloud. No bullshit. Everything runs in your
browser; `localStorage` just remembers your prefs, best scores, and session history.

![dark](https://img.shields.io/badge/theme-dark--first-1FC8DB) ![stack](https://img.shields.io/badge/React-TS-2BC48A) ![offline](https://img.shields.io/badge/backend-none-7B838F)

---

## Cover Page

**Project Title:** KeyFlux — Virtual Keyboard & Typing Analytics Lab

**Tagline:** A premium, fully client-side typing speed meter and keyboard friction
analytics dashboard.

**Domain:** Frontend Web Application · Human-Computer Interaction · Real-time Input Analytics

**Type:** Individual Case Study / Lab Project

**Submission Format:** LISA Documentation (PDF export of this README)

> _Drop your screenshots into `docs/screenshots/` and the image blocks below will pick
> them up. Cover art = a dark graphite console with the KeyFlux wordmark + a live WPM
> readout._

![Cover](./docs/screenshots/cover.png)

---

## Student Details

| Field | Details |
| --- | --- |
| **Name** | _[Your Full Name]_ |
| **Roll / Register No.** | _[____]_ |
| **Course / Branch** | _[B.Tech / ____]_ |
| **Semester** | _[____]_ |
| **College / Institution** | _[____]_ |
| **Academic Year** | _[2025–2026]_ |
| **Guide / Faculty** | _[____]_ |

> _Fill these in before you export to PDF, bro. Don't be the guy who submits a doc
> with placeholder brackets — that's an instant L._

---

## Problem Statement

Typing-speed apps are a dime a dozen. Most of 'em just slap a WPM number on screen
and call it a day — zero insight into _why_ you're slow or where your fingers are
fumbling. Meanwhile, keyboard-layout learners (Dvorak, Colemak) have to fight their
OS just to practice, and there's no decent way to see which keys are genuinely
costing you time.

**KeyFlux solves three problems at once:**

1. **Blind typing feedback.** You type fast but you don't know _where_ the friction
   is. KeyFlux gives you a per-key friction heatmap (error / usage / latency), a
   per-finger & hand-balance load breakdown, and an estimated finger-travel distance
   in millimetres — so you actually see your weak spots instead of guessing.
2. **Layout practice without OS gymnastics.** Want to learn Dvorak on a QWERTY
   keyboard? KeyFlux can either _relabel_ the keycaps (cosmetic, like monkeytype) or
   _simulate_ the layout by remapping your physical keys through it — no OS settings,
   no admin rights, no rage.
3. **Real-time analytics at 60fps.** Physical key events fire 50+ times a second. A
   naive app would re-render the whole keyboard + a wall of stats on every keystroke
   and choke. KeyFlux classifies state by mutation frequency and only re-renders the
   single keycap that changed — so the UI stays buttery even while it's crunching
   live metrics.

**Goal:** a fast, beautiful, offline-first typing lab that turns raw keystrokes into
actionable insight — no servers, no signups, no cap.

---

## Tech Stack

| Layer | Tech | Why |
| --- | --- | --- |
| **UI Framework** | React 19 + TypeScript | Component model + type safety so the analytics logic doesn't quietly break |
| **Build Tool** | Vite 8 | Stupid-fast HMR + lean prod builds |
| **Styling** | Tailwind CSS 3 | Utility-first tokens, dark-first theming |
| **State** | Zustand 5 (+ `persist`) | Tiny, no boilerplate, independent store fan-outs |
| **Animation** | Framer Motion 12 | Restrained motion — count-up springs, keycap flashes |
| **Icons** | lucide-react | Clean line icons |
| **Confetti** | canvas-confetti | Because finishing a run deserves a little rizz |
| **Fonts** | @fontsource Inter + JetBrains Mono | Shell vs. telemetry typography split |

**Runtime:** Node 18+ (developed on Node 25). Zero env vars, zero services. Just
`npm install` and vibe.

---

## Component Architecture

The whole app is split by **feature domain**, not by "kind of component." Each folder
owns its slice of the UI + the logic that feeds it. Here's the map:

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

### The three-tier state model (this is the load-bearing part)

Physical key events fire 50+/second. Re-rendering 60+ keycaps and a stats wall on
every keystroke would be a guaranteed frame-drop. KeyFlux classifies state into
**three tiers by mutation frequency**:

| Tier | Data | Storage | Re-renders |
| --- | --- | --- | --- |
| **Hot transient** | pressed keys, cursor/char status, next-key highlight | bespoke per-key external stores (`useSyncExternalStore`) | only the one affected keycap / character |
| **Accumulated raw** | input ledger, per-key accumulators, timing | refs (never React state) | none |
| **Derived display** | WPM, accuracy, heatmap, friction | Zustand (2 stores) | telemetry cards, at the pump cadence |

**Load-bearing decisions:**

1. **`pressStore`** — a tiny external store with per-key `subscribe(code)` /
   `getSnapshot(code)`. `pressStore.set('KeyJ', true)` notifies only `KeyJ`'s
   listeners → pressing a key re-renders exactly one keycap. Idempotent, so keydown
   auto-repeat is absorbed silently.
2. **No metric math in event handlers.** Handlers do a few cheap ref writes plus one
   targeted notify. A single **rAF pump** (`useLiveMetrics`) is the only writer to
   reactive metric state — ~12 Hz for metrics, ~2 Hz for the heatmap.
3. **Columnar typed-array ledger** (`lib/ledger.ts`) — zero per-keystroke object
   allocation, ring-buffered, with a small object ring backing the live event stream.
4. **Two Zustand stores** (main + heatmap) keep their notification fan-outs
   independent; the keyboard subtree and telemetry never share a render boundary.
5. **Friction score** (`lib/friction.ts`): `clamp01((0.65·errorRate + 0.35·latencyN) · confidence)`,
   where latency is normalized against the session's own p5–p95 and a confidence
   prior keeps a key pressed twice from screaming red.
6. **Window-blur cleanup** releases stuck keys and freezes elapsed time so AFK gaps
   don't tank your WPM.

### Adding a layout

Add a glyph override map in `src/data/layouts.ts` (only the keys that differ from
QWERTY) and register it in `LAYOUTS` / `LAYOUT_IDS`. Finger assignments and geometry
are inherited from the shared physical model — no other changes required. Easy W.

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

### Keyboard shortcuts

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

## Screenshots

> _Capture these from `npm run dev` and drop them in `docs/screenshots/`. Each block
> below is wired to its filename._

### 1. Main typing view (dark console)
The graphite instrument console: challenge card with the prompt text + caret, live
telemetry HUD across the top, and the virtual keyboard reacting to real key presses.

![Main view](./docs/screenshots/01-main.png)

### 2. Live telemetry + friction heatmap
Mid-run metrics (WPM, raw, accuracy, consistency, elapsed) and the keyboard heatmap
in **error** mode — crimson intensity on problem keys, with the colour-blind
corner-dot encoding.

![Telemetry + heatmap](./docs/screenshots/02-heatmap.png)

### 3. Heatmap modes (usage / latency)
The same keyboard in **usage** and **latency** modes, showing how the intensity
source switches.

![Heatmap modes](./docs/screenshots/03-heatmap-modes.png)

### 4. Session summary modal
Post-run summary: WPM-over-time chart (net + raw + error markers), best-run ghost
line, finger-load breakdown, and the friction matrix.

![Session summary](./docs/screenshots/04-summary.png)

### 5. Layout switcher (Dvorak / Colemak relabel + simulate)
The layout switcher open, keycaps relabelled to Dvorak, with the "Simulated layout"
chip active.

![Layout switcher](./docs/screenshots/05-layouts.png)

### 6. Command palette (`⌘K`)
The command palette overlay listing every action.

![Command palette](./docs/screenshots/06-command-palette.png)

### 7. PNG share card export
The exported 1200×630 graphite "spec sheet" with hero WPM, sub-metrics, and the WPM
sparkline.

![Share card](./docs/screenshots/07-share-card.png)

---

## Conclusion

KeyFlux proves you can build a genuinely fast, analytics-rich typing lab that runs
**entirely in the browser** — no backend, no accounts, no telemetry phone-home. The
hard part wasn't the typing; it was keeping 60fps while 50+ key events per second
flow through a live dashboard. The three-tier state model (per-key external stores
for hot transient state, refs for raw accumulation, Zustand for derived display) is
what lets a single keystroke re-render exactly one keycap instead of nuking the whole
tree.

The friction heatmap + per-finger load + finger-travel distance turn "I type slow"
into "your left ring finger is the problem, here's the data" — which is the actual
point of the project. Layout learners get Dvorak/Colemak practice without fighting
their OS. And everything persists locally, so your best scores and history survive a
reload.

**What I'd ship next:** a proper typing-tutor mode that generates drills from your
worst keys, and maybe a `navigator.clipboard` one-tap "copy stats" button for sharing
without downloading a file. The foundation's there — the rest is just cooking.

---

## Links

| | |
| --- | --- |
| **GitHub Repository** | https://github.com/dyrok/keyflux |
| **Live Demo** | _[https://your-live-url.vercel.app]_ |

> _Deploy on Vercel/Netlify and drop the URL above. A frontend-only static build
> deploys in one click — no server config needed._

---

## Getting Started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

---

## Technical Q&A

> _Chad mode engaged. Straight, useful, no fluff._

### 1. How can React components be structured to manage virtual keyboards, typing challenges, performance dashboards, and analytics panels?

Structure by **feature domain**, not by component type. Each feature folder owns its
UI _and_ the logic that feeds it, so a feature is self-contained and removable.

In KeyFlux, `src/features/` holds four domains that map directly to the question:

- **`keyboard/`** — `KeyboardStage` → `KeyboardRow` → `Keycap`. The stage builds rows
  from a physical-key model; each `Keycap` subscribes to _only its own_ press state
  via `useKeycapState(code)`, so a keypress re-renders one keycap, not the board.
- **`typing/`** — `TypingEngine` (the input brain) + `ChallengeDisplayCard` (the
  prompt), `Char` (per-character status), `ProgressRail`, `GhostRail` (race your best
  run). The engine owns keystroke classification; the card just renders derived state.
- **`telemetry/`** — `TelemetryHUD` aggregates `MetricCard`s, `FrictionTable`,
  `FingerLoad`, `WpmChart`, `BestCompare`. These read from Zustand at the rAF pump
  cadence, decoupled from the keyboard's render boundary.
- **`history/`** — `SessionSummaryModal`, `HistoryPanel`, `CustomChallengeDrawer`.

Shared primitives (`Button`, `Modal`, `Sparkline`, `AnimatedNumber`, `Kbd`) live in
`src/components/`. Cross-cutting hosts (global key capture, live metrics, sound,
theme) live in `src/app/hosts.tsx` and render nothing — they're effect-only.

The key principle: **keep the render boundaries aligned with the data boundaries.**
The keyboard subtree and the telemetry subtree never share a store subscription, so a
keystroke can't accidentally trigger a stats re-render (or vice versa).

### 2. How can Zustand or React hooks be used to manage keyboard layouts, keystroke history, typing metrics, and accuracy calculations?

**Zustand** carries the _derived display_ state — the stuff the UI reads at a
controlled cadence. KeyFlux uses two stores with independent fan-outs:

- `useKeyFluxStore` — config, prefs (layout, theme, caret, simulate), live metrics,
  and the persisted slice (best scores, history, custom challenges). It's wrapped in
  the `persist` middleware backed by `localStorage`, so prefs + history survive
  reloads automatically.
- `heatmapStore` — friction/heatmap data, kept separate so heatmap updates (≈2 Hz)
  don't wake the metric cards (≈12 Hz).

Selectors are granular (`useKeyFluxStore((s) => s.targetText)`) so components only
re-render when their slice changes.

**React hooks + refs** carry the _hot_ and _raw_ tiers, which are too fast for React
state:

- **Layouts** — the active layout is a pref in Zustand, but the glyph remap happens in
  the engine via `engine.refreshLayout()`; the keyboard reads labels through
  `useKeycapState`, which pulls from the per-key external `pressStore` + the layout
  map. No layout change re-renders the whole board.
- **Keystroke history** — never stored in React state. It goes into a **columnar
  typed-array ledger** (`lib/ledger.ts`): ring-buffered, zero per-keystroke object
  allocation. Refs hold the live accumulators (per-key error counts, timing).
- **Metrics** — `useLiveMetrics` is a single rAF pump. It's the _only_ writer to
  reactive metric state. It reads the ledger/refs, computes WPM/accuracy/consistency,
  and pushes to Zustand ~12×/sec. Event handlers never touch metric math.
- **Accuracy** — computed in `lib/metrics.ts` from the ledger:
  `correctKeystrokes / totalKeystrokes`. Because it's derived from the raw ledger at
  pump time (not in the keydown handler), it's both accurate and cheap.

The split is deliberate: **Zustand for what the UI reads, refs for what the engine
writes, hooks to bridge them on a clock.**

### 3. Why is performance optimization important when processing rapid keyboard events and updating live statistics?

Because a fast typist fires 50–100+ key events per second, and a naive React app
would turn every single one into a full-tree re-render — 60+ keycaps, a stats wall,
and a chart all re-rendering 80×/sec. That's a guaranteed frame-drop, and a jittery
typing test is a failed typing test: input lag directly corrupts the latency
measurements the app is trying to collect.

KeyFlux optimizes at three levels:

1. **Per-key subscriptions.** `pressStore` is an external store with
   `subscribe(code)`/`getSnapshot(code)`. Pressing `KeyJ` notifies only `KeyJ`'s
   listeners via `useSyncExternalStore` — one keycap re-renders, not the board.
   Keydown auto-repeat is absorbed because the set is idempotent.
2. **No work in event handlers.** Handlers do a few cheap ref writes + one targeted
   notify. All metric math is deferred to a single rAF pump (`useLiveMetrics`), which
   batches a frame's worth of keystrokes into one Zustand write. Metrics update ~12
   Hz, heatmap ~2 Hz — smooth, not spammy.
3. **Zero-allocation hot path.** The ledger uses typed arrays + a ring buffer, so the
   50–100 events/sec never trigger GC pressure.

The payoff: live metrics lag reality by ≤80 ms (imperceptible) while the UI holds
60fps. Without this, you'd either drop frames or lie about the stats — both are Ls.

### 4. Why should typing-analysis and keyboard-layout logic be separated from UI rendering components?

Separation of concerns, but with a concrete performance reason: **the analysis logic
runs at input speed (50–100 Hz), the UI renders at display speed (≤60 Hz).** If you
couple them, every keystroke forces a render, and you're back to the frame-drop
problem from Q3.

In KeyFlux the split is physical:

- **`lib/`** holds the pure, framework-agnostic brain: `metrics.ts` (WPM, accuracy,
  consistency), `friction.ts` (the friction score formula), `ledger.ts` (the typed
  array store), `finger.ts` (geometry + travel distance), `data/layouts.ts`
  (code→glyph maps). None of these import React. They're testable in isolation and
  reusable.
- **`features/typing/TypingEngine`** is the stateful orchestrator that owns the
  keydown/keyup classification and writes to refs + the per-key store. It doesn't
  render.
- **`features/keyboard/*` and `features/telemetry/*`** are the renderers. They
  _subscribe_ to slices of state; they never compute metrics themselves.

Benefits: (a) the hot path stays allocation-free and React-free; (b) you can unit-test
the friction formula or the accuracy calc without mounting a component; (c) the UI
components stay dumb and fast — they just read and paint; (d) swapping the renderer
(e.g. a canvas keyboard) doesn't touch the analytics. The layout logic lives in
`data/layouts.ts` as pure data, so adding Dvorak is a glyph map, not a component edit.

### 5. How can browser Keyboard Events, LocalStorage, and Clipboard APIs be utilized in a frontend-only typing analytics application?

**Keyboard Events (`KeyboardEvent`)** are the entire input source. KeyFlux attaches
`keydown`/`keyup` listeners on `window` in the **capture phase** (so timestamps are
taken as early as possible and `preventDefault` works inside the lab) via
`useGlobalKeyCapture`. Critically, it keys everything on **`event.code`** (the
physical key, e.g. `KeyJ`), not `event.key` (the produced character) — this makes the
keyboard layout-independent and lets the Simulate mode remap physical keys through
Dvorak/Colemak. It also listens for `blur`/`visibilitychange` to release stuck keys
and freeze elapsed time when you tab away, so AFK gaps don't tank your WPM.

**LocalStorage** is the persistence layer — no backend needed. KeyFlux uses Zustand's
`persist` middleware with `createJSONStorage(() => localStorage)` to auto-save and
restore prefs (layout, theme, caret, simulate, sound), best scores, custom
challenges, and recent session history. `useTheme` also writes `keyflux:theme`
directly to apply the theme before React hydrates, avoiding a flash. Everything is
key-scoped (`keyflux:*`) so it plays nice with other apps on the same origin.

**Blob + Object URL + download anchor (export).** For "clipboard-like" sharing
without a server, `lib/export.ts` builds a `Blob` (JSON session dump, or a PNG share
card rendered to `<canvas>` via `canvas.toBlob`), creates an object URL with
`URL.createObjectURL`, and triggers a download through a synthetic `<a download>`
click — then revokes the URL. This gives one-click JSON/PNG export fully client-side.
A natural extension is the **Clipboard API** (`navigator.clipboard.writeText`) for a
one-tap "copy stats summary to clipboard" button — same frontend-only philosophy, no
download step.

The unifying idea: the browser already ships every primitive a typing lab needs —
input capture, local persistence, and export/sharing. Wire them together with a
disciplined state model and you need zero infrastructure.

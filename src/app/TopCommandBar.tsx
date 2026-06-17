import {
  Command,
  Eye,
  Flame,
  History,
  Library,
  Moon,
  MoonStar,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react'
import { IconButton } from '../components/IconButton'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { LayoutSwitcher } from '../features/layouts/LayoutSwitcher'
import { useKeyFluxStore } from '../store/useKeyFluxStore'

const themeIcon = { dark: Moon, midnight: MoonStar, light: Sun }

export function TopCommandBar() {
  const prefs = useKeyFluxStore((s) => s.prefs)
  const reset = useKeyFluxStore((s) => s.reset)
  const requestFocus = useKeyFluxStore((s) => s.requestFocus)

  const cycleTheme = useKeyFluxStore((s) => s.cycleTheme)
  const toggleSound = useKeyFluxStore((s) => s.toggleSound)
  const toggleSimulate = useKeyFluxStore((s) => s.toggleSimulate)
  const toggleHeatmap = useKeyFluxStore((s) => s.toggleHeatmap)
  const toggleFocusMode = useKeyFluxStore((s) => s.toggleFocusMode)
  const setDrawerOpen = useKeyFluxStore((s) => s.setDrawerOpen)
  const setHistoryOpen = useKeyFluxStore((s) => s.setHistoryOpen)
  const setPaletteOpen = useKeyFluxStore((s) => s.setPaletteOpen)

  const ThemeIcon = themeIcon[prefs.theme]

  return (
    <header className="flex h-full items-center gap-3 rounded-2xl border border-border bg-surface-1 px-3 shadow-card sm:px-4">
      {/* brand */}
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface-2">
          <BrandMark />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-[15px] font-semibold tracking-tight text-text-primary">KeyFlux</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-text-faint">typing analytics lab</div>
        </div>
      </div>

      <div className="hidden md:block">
        <Chip tone="cyan">{prefs.layout.toUpperCase()}</Chip>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:block">
          <LayoutSwitcher size="sm" />
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton size="sm" active={prefs.simulate} onClick={toggleSimulate} aria-label="Toggle simulated layout" title="Simulate layout">
            <Wand2 size={15} />
          </IconButton>
          <IconButton size="sm" active={prefs.heatmapEnabled} onClick={toggleHeatmap} aria-label="Toggle heatmap" title="Heatmap">
            <Flame size={15} />
          </IconButton>
          <IconButton size="sm" active={prefs.sound} onClick={toggleSound} aria-label="Toggle sound" title="Sound">
            {prefs.sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </IconButton>
          <IconButton size="sm" active={prefs.focusMode} onClick={toggleFocusMode} aria-label="Toggle focus mode" title="Focus mode">
            <Eye size={15} />
          </IconButton>
          <IconButton size="sm" onClick={cycleTheme} aria-label="Cycle theme" title="Theme">
            <ThemeIcon size={15} />
          </IconButton>
        </div>

        <div className="hidden h-5 w-px bg-border lg:block" />

        <IconButton size="sm" onClick={() => setDrawerOpen(true)} aria-label="Challenge library" title="Library">
          <Library size={15} />
        </IconButton>
        <IconButton size="sm" onClick={() => setHistoryOpen(true)} aria-label="History" title="History">
          <History size={15} />
        </IconButton>
        <IconButton size="sm" onClick={() => setPaletteOpen(true)} aria-label="Command palette" title="Commands (⌘K)">
          <Command size={15} />
        </IconButton>

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            reset()
            requestFocus()
          }}
        >
          <RotateCcw size={14} /> Reset
        </Button>
      </div>
    </header>
  )
}

function BrandMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="10" y="18" width="12" height="12" rx="3" fill="hsl(var(--accent-cyan))" />
      <rect x="26" y="18" width="12" height="12" rx="3" fill="hsl(var(--surface-3))" />
      <rect x="10" y="34" width="28" height="9" rx="3" fill="hsl(var(--surface-3))" />
      <rect x="44" y="18" width="5" height="25" rx="2.5" fill="hsl(var(--accent-emerald))" />
    </svg>
  )
}

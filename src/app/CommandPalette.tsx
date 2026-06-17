import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Download,
  Eye,
  Flame,
  Ghost,
  Hash,
  History,
  ImageDown,
  Keyboard,
  Library,
  Moon,
  RotateCcw,
  Shuffle,
  TextCursor,
  Volume2,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import { useKeyFluxStore } from '../store/useKeyFluxStore'
import { exportSessionJson, exportSessionPng } from '../lib/export'
import { cn } from '../lib/cn'
import { dur, ease } from '../lib/motion'
import type { CaretStyle } from '../types'

interface Command {
  id: string
  label: string
  icon: LucideIcon
  keywords?: string
  run: () => void
  hint?: string
}

export function CommandPalette() {
  const open = useKeyFluxStore((s) => s.paletteOpen)
  const setOpen = useKeyFluxStore((s) => s.setPaletteOpen)
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const s = useKeyFluxStore.getState()
    const after = (fn: () => void, focus = false) => () => {
      fn()
      setOpen(false)
      if (focus) s.requestFocus()
    }
    const carets: CaretStyle[] = ['bar', 'underline', 'block']
    return [
      { id: 'reset', label: 'Restart session', icon: RotateCcw, keywords: 'reset retry again', run: after(() => useKeyFluxStore.getState().reset(), true) },
      { id: 'next', label: 'Next challenge', icon: Shuffle, keywords: 'shuffle random', run: after(() => useKeyFluxStore.getState().shuffleChallenge(), true) },
      { id: 'library', label: 'Open challenge library', icon: Library, keywords: 'text custom mode timed words', run: after(() => useKeyFluxStore.getState().setDrawerOpen(true)) },
      { id: 'layout', label: 'Cycle keyboard layout', icon: Keyboard, keywords: 'qwerty dvorak colemak', run: after(() => useKeyFluxStore.getState().cycleLayout()) },
      { id: 'simulate', label: 'Toggle simulated layout', icon: Wand2, keywords: 'remap practice', run: after(() => useKeyFluxStore.getState().toggleSimulate()) },
      { id: 'theme', label: 'Cycle theme', icon: Moon, keywords: 'dark light midnight', run: after(() => useKeyFluxStore.getState().cycleTheme()) },
      { id: 'sound', label: 'Toggle key sound', icon: Volume2, keywords: 'audio click', run: after(() => useKeyFluxStore.getState().toggleSound()) },
      { id: 'heatmap', label: 'Toggle heatmap', icon: Flame, keywords: 'friction heat', run: after(() => useKeyFluxStore.getState().toggleHeatmap()) },
      { id: 'focus', label: 'Toggle focus mode', icon: Eye, keywords: 'zen minimal', run: after(() => useKeyFluxStore.getState().toggleFocusMode()) },
      { id: 'keycodes', label: 'Toggle keycode labels', icon: Hash, keywords: 'physical code', run: after(() => useKeyFluxStore.getState().toggleKeycodes()) },
      { id: 'ghost', label: 'Toggle ghost replay', icon: Ghost, keywords: 'race best', run: after(() => useKeyFluxStore.getState().toggleGhost()) },
      {
        id: 'caret',
        label: 'Cycle caret style',
        icon: TextCursor,
        keywords: 'cursor bar block underline',
        run: after(() => {
          const cur = useKeyFluxStore.getState().prefs.caret
          useKeyFluxStore.getState().setCaret(carets[(carets.indexOf(cur) + 1) % carets.length])
        }),
      },
      { id: 'history', label: 'Open history', icon: History, keywords: 'sessions past', run: after(() => useKeyFluxStore.getState().setHistoryOpen(true)) },
      {
        id: 'export-json',
        label: 'Export last session (JSON)',
        icon: Download,
        keywords: 'download save',
        run: after(() => {
          const last = useKeyFluxStore.getState().lastSummary
          if (last) exportSessionJson(last)
        }),
      },
      {
        id: 'export-png',
        label: 'Export last session (card)',
        icon: ImageDown,
        keywords: 'image share png',
        run: after(() => {
          const last = useKeyFluxStore.getState().lastSummary
          if (last) exportSessionPng(last)
        }),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(q))
  }, [query, commands])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
      const id = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(id)
    }
  }, [open])

  useEffect(() => {
    setSel(0)
  }, [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => Math.min(filtered.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[sel]?.run()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh]"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }}
        >
          <div className="absolute inset-0 bg-[hsl(var(--shadow-color)/0.5)] backdrop-blur-[3px]" onClick={() => setOpen(false)} />
          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-raised"
            variants={{
              hidden: { opacity: 0, scale: 0.98, y: -6 },
              show: { opacity: 1, scale: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
              exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: dur.fast } },
            }}
            role="dialog"
            aria-label="Command palette"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a command…"
              className="w-full border-b border-border bg-transparent px-4 py-3.5 text-[15px] text-text-primary outline-none placeholder:text-text-faint"
            />
            <div className="max-h-[50vh] overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-[13px] text-text-faint">No matching commands</div>
              )}
              {filtered.map((c, i) => {
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => c.run()}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      i === sel ? 'bg-surface-3 text-text-primary' : 'text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    <Icon size={15} className={i === sel ? 'text-cyan' : 'text-text-muted'} />
                    <span className="flex-1 text-[13px]">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

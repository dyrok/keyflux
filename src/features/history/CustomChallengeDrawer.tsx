import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../components/Button'
import { IconButton } from '../../components/IconButton'
import { SegmentedControl } from '../../components/SegmentedControl'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { CHALLENGES } from '../../data/challenges'
import { cn } from '../../lib/cn'
import { dur, ease } from '../../lib/motion'
import type { TestMode } from '../../types'

const TIMED = [15, 30, 60]
const WORDS = [10, 25, 50]

export function CustomChallengeDrawer() {
  const open = useKeyFluxStore((s) => s.drawerOpen)
  const setOpen = useKeyFluxStore((s) => s.setDrawerOpen)
  const mode = useKeyFluxStore((s) => s.prefs.mode)
  const setMode = useKeyFluxStore((s) => s.setMode)
  const baseId = useKeyFluxStore((s) => s.baseChallengeId)
  const loadChallenge = useKeyFluxStore((s) => s.loadChallenge)
  const customChallenges = useKeyFluxStore((s) => s.customChallenges)
  const addCustom = useKeyFluxStore((s) => s.addCustomChallenge)
  const removeCustom = useKeyFluxStore((s) => s.removeCustomChallenge)
  const requestFocus = useKeyFluxStore((s) => s.requestFocus)

  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  const modeKind = mode.kind
  const setKind = (kind: TestMode['kind']) => {
    if (kind === 'fixed') setMode({ kind: 'fixed' })
    else if (kind === 'timed') setMode({ kind: 'timed', seconds: 30 })
    else setMode({ kind: 'words', count: 25 })
  }

  const submit = () => {
    if (!text.trim()) return
    addCustom(text, title)
    setText('')
    setTitle('')
    setOpen(false)
    requestFocus()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex justify-end" initial="hidden" animate="show" exit="exit">
          <motion.div
            className="absolute inset-0 bg-[hsl(var(--shadow-color)/0.5)] backdrop-blur-[2px]"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-1 shadow-raised"
            variants={{
              hidden: { x: '100%' },
              show: { x: 0, transition: { duration: dur.base, ease: ease.out } },
              exit: { x: '100%', transition: { duration: dur.fast, ease: ease.out } },
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-text-primary">Challenge library</h2>
              <IconButton size="sm" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={15} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* test mode */}
              <div className="mb-5">
                <div className="label mb-2">Test mode</div>
                <SegmentedControl
                  ariaLabel="Test mode"
                  options={[
                    { value: 'fixed', label: 'Fixed text' },
                    { value: 'timed', label: 'Timed' },
                    { value: 'words', label: 'Words' },
                  ]}
                  value={modeKind}
                  onChange={(v) => setKind(v as TestMode['kind'])}
                />
                {modeKind === 'timed' && (
                  <div className="mt-3 flex gap-2">
                    {TIMED.map((s) => (
                      <Pill key={s} active={mode.kind === 'timed' && mode.seconds === s} onClick={() => setMode({ kind: 'timed', seconds: s })}>
                        {s}s
                      </Pill>
                    ))}
                  </div>
                )}
                {modeKind === 'words' && (
                  <div className="mt-3 flex gap-2">
                    {WORDS.map((c) => (
                      <Pill key={c} active={mode.kind === 'words' && mode.count === c} onClick={() => setMode({ kind: 'words', count: c })}>
                        {c}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>

              {/* sample challenges */}
              {modeKind === 'fixed' && (
                <div className="mb-5">
                  <div className="label mb-2">Sample texts</div>
                  <div className="flex flex-col gap-1.5">
                    {CHALLENGES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          loadChallenge(c.id)
                          setOpen(false)
                          requestFocus()
                        }}
                        className={cn(
                          'focus-ring flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                          baseId === c.id ? 'border-cyan/50 bg-cyan/5' : 'border-border bg-surface-2 hover:border-border-strong',
                        )}
                      >
                        <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wide text-text-faint">{c.category}</span>
                        <span className="flex-1">
                          <span className="block text-[13px] font-medium text-text-primary">{c.title}</span>
                          <span className="block truncate text-[12px] text-text-muted">{c.text.slice(0, 48)}…</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* custom challenges */}
              {customChallenges.length > 0 && (
                <div className="mb-5">
                  <div className="label mb-2">Your texts</div>
                  <div className="flex flex-col gap-1.5">
                    {customChallenges.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                        <button
                          onClick={() => {
                            loadChallenge(c.id)
                            setOpen(false)
                            requestFocus()
                          }}
                          className="focus-ring flex-1 text-left"
                        >
                          <span className="block text-[13px] font-medium text-text-primary">{c.title}</span>
                          <span className="block truncate text-[12px] text-text-muted">{c.text.slice(0, 48)}…</span>
                        </button>
                        <button
                          onClick={() => removeCustom(c.id)}
                          className="focus-ring grid h-7 w-7 place-items-center rounded-lg text-text-muted hover:text-crimson"
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* add custom */}
            <div className="border-t border-border px-5 py-4">
              <div className="label mb-2">Add custom text</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="focus-ring mb-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-text-primary placeholder:text-text-faint"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type a custom challenge…"
                rows={3}
                className="focus-ring mb-2 w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-faint"
              />
              <Button variant="primary" onClick={submit} className="w-full" disabled={!text.trim()}>
                <Plus size={14} /> Add &amp; load
              </Button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'focus-ring h-8 rounded-lg border px-3 font-mono text-[13px] tabular transition-colors',
        active ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-border bg-surface-2 text-text-muted hover:text-text-secondary',
      )}
    >
      {children}
    </button>
  )
}

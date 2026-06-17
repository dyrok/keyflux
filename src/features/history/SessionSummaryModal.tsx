import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Award, Download, ImageDown, RotateCcw, Shuffle } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { WpmChart } from '../telemetry/WpmChart'
import { FingerLoad } from '../telemetry/FingerLoad'
import { FrictionTable } from '../telemetry/FrictionTable'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import { celebrate } from '../../lib/confetti'
import { exportSessionJson, exportSessionPng } from '../../lib/export'
import { formatDuration } from '../../lib/format'
import { dur } from '../../lib/motion'

function StatTile({ label, value, unit, tone }: { label: string; value: ReactNode; unit?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="label mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-semibold tabular ${tone ?? 'text-text-primary'}`}>{value}</span>
        {unit && <span className="font-mono text-[12px] text-text-muted">{unit}</span>}
      </div>
    </div>
  )
}

export function SessionSummaryModal() {
  const open = useKeyFluxStore((s) => s.summaryOpen)
  const summary = useKeyFluxStore((s) => s.lastSummary)
  const isNewPb = useKeyFluxStore((s) => s.isNewPb)
  const confettiOn = useKeyFluxStore((s) => s.prefs.confetti)
  const best = useKeyFluxStore((s) => (summary ? s.bests[summary.layout] : undefined))
  const close = useKeyFluxStore((s) => s.closeSummary)
  const reset = useKeyFluxStore((s) => s.reset)
  const shuffle = useKeyFluxStore((s) => s.shuffleChallenge)
  const requestFocus = useKeyFluxStore((s) => s.requestFocus)

  useEffect(() => {
    if (open && confettiOn) celebrate(isNewPb)
  }, [open, confettiOn, isNewPb])

  if (!summary) return null
  const ghost = !isNewPb && best ? best.wpmSeries : undefined

  return (
    <Modal open={open} onClose={close} ariaLabel="Session summary" className="max-w-3xl">
      <div className="max-h-[88vh] overflow-y-auto p-6">
        {/* header */}
        <div className="mb-5 flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Session complete</h2>
            <p className="mt-0.5 text-[13px] text-text-muted">
              {summary.layout.toUpperCase()}
              {summary.simulate ? ' · simulated' : ''} · {summary.textPreview.slice(0, 40)}
              {summary.textLength > 40 ? '…' : ''}
            </p>
          </div>
          {isNewPb && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: dur.base, delay: 0.1 }}
              className="ml-auto mr-8 inline-flex items-center gap-1.5 rounded-full border border-amber/50 bg-amber/10 px-3 py-1 text-[12px] font-semibold text-amber"
            >
              <Award size={14} /> Personal best
            </motion.span>
          )}
        </div>

        {/* hero stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="WPM" value={Math.round(summary.wpm)} tone="text-cyan" />
          <StatTile label="Accuracy" value={summary.accuracy.toFixed(1)} unit="%" tone="text-emerald" />
          <StatTile label="Consistency" value={Math.round(summary.consistency)} unit="%" tone="text-amber" />
          <StatTile label="Raw" value={Math.round(summary.rawWpm)} />
        </div>

        {/* chart */}
        <div className="mb-4 rounded-xl border border-border bg-surface-inset p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="label">WPM over time</span>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-text-faint">
              <span className="inline-flex items-center gap-1"><i className="inline-block h-0.5 w-3 bg-cyan" /> net</span>
              <span className="inline-flex items-center gap-1"><i className="inline-block h-0.5 w-3 bg-cyan/40" /> raw</span>
              {ghost && <span className="inline-flex items-center gap-1"><i className="inline-block h-0.5 w-3 border-t border-dashed border-text-faint" /> best</span>}
              <span className="inline-flex items-center gap-1"><i className="inline-block h-1.5 w-1.5 rounded-full bg-crimson" /> error</span>
            </div>
          </div>
          <WpmChart series={summary.wpmSeries} ghost={ghost} />
        </div>

        {/* secondary analytics */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FingerLoad loads={summary.fingerLoad} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Time" value={formatDuration(summary.durationMs)} />
              <StatTile label="Keys" value={summary.totalKeystrokes} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Travel" value={(summary.travelMm / 1000).toFixed(2)} unit="m" />
              <StatTile label="Errors" value={summary.incorrectKeystrokes} tone="text-crimson" />
            </div>
          </div>
        </div>

        <FrictionTable stats={summary.keyStats} className="mb-5" />

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              reset()
              close()
              requestFocus()
            }}
          >
            <RotateCcw size={14} /> Retry
          </Button>
          <Button
            onClick={() => {
              shuffle()
              close()
              requestFocus()
            }}
          >
            <Shuffle size={14} /> Next
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => exportSessionJson(summary)}>
              <Download size={14} /> JSON
            </Button>
            <Button variant="ghost" onClick={() => exportSessionPng(summary)}>
              <ImageDown size={14} /> Card
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

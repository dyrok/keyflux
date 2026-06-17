import type { SessionSummary } from '../types'
import { formatDate } from './format'

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function exportSessionJson(summary: SessionSummary) {
  const payload = {
    app: 'KeyFlux',
    version: 1,
    exportedAt: new Date().toISOString(),
    session: summary,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `keyflux-session-${summary.id}.json`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ----------------------------------------------------------------------------
// PNG share card — a graphite "spec sheet" rendered to canvas.
// ----------------------------------------------------------------------------
export function exportSessionPng(summary: SessionSummary) {
  const W = 1200
  const H = 630
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  // palette (dark graphite)
  const C = {
    bg: '#0E1014',
    surface: '#14171C',
    border: '#2B313A',
    text: '#E8EBF0',
    muted: '#7B838F',
    cyan: '#1FC8DB',
    emerald: '#2BC48A',
    crimson: '#E14060',
    amber: '#F2A52A',
  }

  // background
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // card
  roundRect(ctx, 40, 40, W - 80, H - 80, 24)
  ctx.fillStyle = C.surface
  ctx.fill()
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.stroke()

  const padX = 80

  // brand
  ctx.fillStyle = C.cyan
  ctx.font = '700 26px Inter, system-ui, sans-serif'
  ctx.fillText('KeyFlux', padX, 104)
  ctx.fillStyle = C.muted
  ctx.font = '500 16px Inter, system-ui, sans-serif'
  ctx.fillText('typing analytics lab', padX + 118, 104)

  ctx.textAlign = 'right'
  ctx.fillStyle = C.muted
  ctx.fillText(formatDate(summary.date), W - padX, 104)
  ctx.textAlign = 'left'

  // hero WPM
  ctx.fillStyle = C.text
  ctx.font = '700 120px "JetBrains Mono", monospace'
  ctx.fillText(String(Math.round(summary.wpm)), padX, 250)
  ctx.fillStyle = C.muted
  ctx.font = '500 28px "JetBrains Mono", monospace'
  ctx.fillText('wpm', padX + measure(ctx, String(Math.round(summary.wpm)), '700 120px "JetBrains Mono", monospace') + 16, 250)

  // sub metrics row
  const metrics: [string, string, string][] = [
    ['ACCURACY', `${summary.accuracy.toFixed(1)}%`, C.emerald],
    ['RAW', `${Math.round(summary.rawWpm)}`, C.cyan],
    ['CONSISTENCY', `${Math.round(summary.consistency)}%`, C.amber],
    ['LAYOUT', summary.layout.toUpperCase(), C.text],
  ]
  let mx = padX
  for (const [label, value, color] of metrics) {
    ctx.fillStyle = C.muted
    ctx.font = '600 14px Inter, system-ui, sans-serif'
    ctx.fillText(label, mx, 300)
    ctx.fillStyle = color
    ctx.font = '600 34px "JetBrains Mono", monospace'
    ctx.fillText(value, mx, 340)
    mx += 230
  }

  // sparkline of wpm series
  const series = summary.wpmSeries
  const chartX = padX
  const chartY = 400
  const chartW = W - padX * 2
  const chartH = 130
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(chartX, chartY + chartH)
  ctx.lineTo(chartX + chartW, chartY + chartH)
  ctx.stroke()

  if (series.length > 1) {
    const maxWpm = Math.max(...series.map((s) => s.wpm), summary.wpm, 1) * 1.1
    const maxT = series[series.length - 1].t || 1
    ctx.strokeStyle = C.cyan
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.beginPath()
    series.forEach((s, i) => {
      const x = chartX + (s.t / maxT) * chartW
      const y = chartY + chartH - (s.wpm / maxWpm) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // area fill
    ctx.lineTo(chartX + chartW, chartY + chartH)
    ctx.lineTo(chartX, chartY + chartH)
    ctx.closePath()
    ctx.fillStyle = 'rgba(31,200,219,0.10)'
    ctx.fill()
  }

  // footer
  ctx.fillStyle = C.muted
  ctx.font = '500 16px Inter, system-ui, sans-serif'
  ctx.fillText(
    `${summary.totalKeystrokes} keystrokes · ${(summary.durationMs / 1000).toFixed(1)}s · ${(summary.travelMm / 1000).toFixed(2)}m finger travel`,
    padX,
    H - 70,
  )

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `keyflux-card-${summary.id}.png`)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function measure(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  const prev = ctx.font
  ctx.font = font
  const w = ctx.measureText(text).width
  ctx.font = prev
  return w
}

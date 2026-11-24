import type { ScoreEvent } from '../types'
import { TARGET_SCORE } from '../types'
import { buildProgressionSeries, buildTimeTicks } from './scoreProgression'
import { formatDuration } from './formatDuration'
import { formatDate } from './formatDate'
import { joinNames } from './joinNames'

// Solo lo que hace falta para dibujar la imagen: así sirve tanto para el
// partido activo (resumen al terminar) como para uno ya guardado en el
// Historial, sin acoplarse a ActiveMatch ni a FinishedMatch.
export interface ShareableMatch {
  teamAName: string
  teamBName: string
  teamAPlayerNames: string[]
  teamBPlayerNames: string[]
  scoreA: number
  scoreB: number
  playedAt: string
  scoreEvents: ScoreEvent[]
  durationSeconds: number | null
}

export type ShareVariant = 'directo' | 'linea-tiempo' | 'afiche'

const VARIANT_ORDER: ShareVariant[] = ['directo', 'linea-tiempo', 'afiche']

export const SHARE_VARIANT_INFO: Record<ShareVariant, { title: string; caption: string }> = {
  directo: { title: 'Directo', caption: 'Solo lo esencial: equipos y marcador.' },
  'linea-tiempo': { title: 'Con línea de tiempo', caption: 'El resultado y cómo fue avanzando el partido.' },
  afiche: { title: 'Afiche', caption: 'Más decorado, como para enmarcar.' },
}

// "Con línea de tiempo" necesita datos que los partidos guardados antes de
// este campo no tienen (ver ScoreEvent en types.ts): ahí no se ofrece.
export function availableShareVariants(match: Pick<ShareableMatch, 'scoreEvents' | 'durationSeconds'>): ShareVariant[] {
  const hasTimeline =
    match.scoreEvents.length > 0 && typeof match.durationSeconds === 'number' && match.durationSeconds > 0
  return VARIANT_ORDER.filter((v) => v !== 'linea-tiempo' || hasTimeline)
}

// Dibujado a mano en canvas (en vez de renderizar el DOM a imagen) para no
// sumar una librería aparte: son pocos elementos y las fuentes (Georgia,
// system sans) ya son del sistema, así que no hace falta esperar a que
// carguen antes de dibujar texto.
const WOOD_900 = '#241708'
const WOOD_950 = '#1a1108'
const PAPER_50 = '#fdf6e6'
const PAPER_100 = '#f5e8cc'
const EMBER_500 = '#c9a227'
const SKY_500 = '#3987e5'

const SIZE = 1080

export function generateShareImageBlob(match: ShareableMatch, variant: ShareVariant): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  if (variant === 'linea-tiempo') drawLineaTiempo(ctx, match)
  else if (variant === 'afiche') drawAfiche(ctx, match)
  else drawDirecto(ctx, match)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

function drawWoodBackground(ctx: CanvasRenderingContext2D) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, SIZE)
  bgGrad.addColorStop(0, WOOD_900)
  bgGrad.addColorStop(1, WOOD_950)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, SIZE, SIZE)

  const glow = ctx.createRadialGradient(SIZE / 2, 0, 0, SIZE / 2, 0, SIZE * 0.7)
  glow.addColorStop(0, 'rgba(201,162,39,0.14)')
  glow.addColorStop(1, 'rgba(201,162,39,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SIZE, SIZE)
}

// Achica la fuente hasta que el texto entre en maxWidth (nombres de equipo o
// de jugadores largos no se salen de la imagen), en vez de truncar con "...".
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  minPx: number,
  fontSpec: (px: number) => string,
): number {
  let px = startPx
  ctx.font = fontSpec(px)
  while (ctx.measureText(text).width > maxWidth && px > minPx) {
    px -= 1
    ctx.font = fontSpec(px)
  }
  return px
}

function winnerOf(match: ShareableMatch): { aWins: boolean; winnerName: string } {
  const aWins = match.scoreA >= match.scoreB
  return { aWins, winnerName: aWins ? match.teamAName : match.teamBName }
}

// ---------- Variante 1: Directo ----------

function drawDirecto(ctx: CanvasRenderingContext2D, match: ShareableMatch) {
  drawWoodBackground(ctx)
  const { aWins, winnerName } = winnerOf(match)
  const leftX = SIZE * 0.28
  const rightX = SIZE * 0.72

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = EMBER_500
  ctx.font = '700 32px -apple-system, sans-serif'
  ctx.fillText('OSOBUCO', SIZE / 2, 120)

  ctx.fillStyle = EMBER_500
  const titleText = `¡Ganó ${winnerName}!`
  fitFont(ctx, titleText, SIZE - 140, 64, 36, (px) => `700 ${px}px Georgia, serif`)
  ctx.fillText(titleText, SIZE / 2, 290)

  ctx.strokeStyle = 'rgba(203, 170, 106, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(SIZE / 2, 350)
  ctx.lineTo(SIZE / 2, 660)
  ctx.stroke()

  ctx.fillStyle = PAPER_100
  fitFont(ctx, match.teamAName, 320, 34, 20, (px) => `${px}px Georgia, serif`)
  ctx.fillText(match.teamAName, leftX, 400)
  fitFont(ctx, match.teamBName, 320, 34, 20, (px) => `${px}px Georgia, serif`)
  ctx.fillText(match.teamBName, rightX, 400)

  ctx.font = `700 ${aWins ? 150 : 110}px -apple-system, sans-serif`
  ctx.fillStyle = PAPER_50
  ctx.globalAlpha = aWins ? 1 : 0.55
  ctx.fillText(String(match.scoreA), leftX, 580)

  ctx.font = `700 ${aWins ? 110 : 150}px -apple-system, sans-serif`
  ctx.globalAlpha = aWins ? 0.55 : 1
  ctx.fillText(String(match.scoreB), rightX, 580)
  ctx.globalAlpha = 1

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.55
  const namesA = joinNames(match.teamAPlayerNames)
  const namesB = joinNames(match.teamBPlayerNames)
  fitFont(ctx, namesA, 320, 24, 14, (px) => `${px}px -apple-system, sans-serif`)
  ctx.fillText(namesA, leftX, 630)
  fitFont(ctx, namesB, 320, 24, 14, (px) => `${px}px -apple-system, sans-serif`)
  ctx.fillText(namesB, rightX, 630)
  ctx.globalAlpha = 1

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.4
  ctx.font = '22px -apple-system, sans-serif'
  ctx.fillText(`${formatDate(match.playedAt)} · Partido a ${TARGET_SCORE}`, SIZE / 2, SIZE - 70)
  ctx.globalAlpha = 1
}

// ---------- Variante 2: Con línea de tiempo ----------

function drawLineaTiempo(ctx: CanvasRenderingContext2D, match: ShareableMatch) {
  drawWoodBackground(ctx)
  const { winnerName } = winnerOf(match)
  const duration = match.durationSeconds ?? 0

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = EMBER_500
  ctx.font = '700 26px -apple-system, sans-serif'
  ctx.fillText('OSOBUCO', SIZE / 2, 85)

  ctx.fillStyle = EMBER_500
  const resultText = `¡Ganó ${winnerName}! ${match.scoreA} - ${match.scoreB}`
  fitFont(ctx, resultText, SIZE - 120, 46, 26, (px) => `700 ${px}px Georgia, serif`)
  ctx.fillText(resultText, SIZE / 2, 145)

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.65
  const playersText = `${joinNames(match.teamAPlayerNames)} vs ${joinNames(match.teamBPlayerNames)}`
  fitFont(ctx, playersText, SIZE - 160, 26, 16, (px) => `${px}px -apple-system, sans-serif`)
  ctx.fillText(playersText, SIZE / 2, 185)
  ctx.globalAlpha = 0.7
  ctx.font = '24px -apple-system, sans-serif'
  ctx.fillText(`${formatDuration(duration)} de partido`, SIZE / 2, 222)
  ctx.globalAlpha = 1

  drawTimelineChart(ctx, match, duration, 90, 270, SIZE - 90, 910)

  const legendY = 970
  ctx.textAlign = 'left'
  ctx.font = '600 26px -apple-system, sans-serif'
  const namesA = joinNames(match.teamAPlayerNames)
  const namesB = joinNames(match.teamBPlayerNames)
  const gap = 50
  ctx.font = '600 24px -apple-system, sans-serif'
  const wA = ctx.measureText(namesA).width + 34
  const wB = ctx.measureText(namesB).width + 34
  const totalW = wA + gap + wB
  let x = SIZE / 2 - totalW / 2

  ctx.fillStyle = EMBER_500
  ctx.fillRect(x, legendY - 18, 20, 20)
  ctx.fillStyle = PAPER_100
  ctx.fillText(namesA, x + 30, legendY)
  x += wA + gap

  ctx.fillStyle = SKY_500
  ctx.fillRect(x, legendY - 18, 20, 20)
  ctx.fillStyle = PAPER_100
  ctx.fillText(namesB, x + 30, legendY)
}

function drawTimelineChart(
  ctx: CanvasRenderingContext2D,
  match: ShareableMatch,
  duration: number,
  padLeft: number,
  top: number,
  right: number,
  bottom: number,
) {
  const plotW = right - padLeft
  const plotH = bottom - top
  const mapX = (t: number) => padLeft + (t / duration) * plotW
  const mapY = (v: number) => top + plotH - (v / TARGET_SCORE) * plotH

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.font = '20px -apple-system, sans-serif'
  ;[0, 5, 10, 15, 20, 25, 30].forEach((v) => {
    const y = mapY(v)
    ctx.strokeStyle = 'rgba(203, 170, 106, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padLeft, y)
    ctx.lineTo(right, y)
    ctx.stroke()
    ctx.fillStyle = PAPER_100
    ctx.globalAlpha = 0.5
    ctx.fillText(String(v), padLeft - 16, y)
    ctx.globalAlpha = 1
  })

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const xTicks = buildTimeTicks(duration)
  xTicks.forEach((t) => {
    const x = mapX(t)
    ctx.strokeStyle = 'rgba(203, 170, 106, 0.15)'
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
    ctx.fillStyle = PAPER_100
    ctx.globalAlpha = 0.5
    ctx.textAlign = t === 0 ? 'left' : 'center'
    ctx.fillText(`${Math.round(t / 60)}m`, x, bottom + 36)
    ctx.globalAlpha = 1
  })
  ctx.strokeStyle = 'rgba(245, 232, 204, 0.3)'
  ctx.beginPath()
  ctx.moveTo(mapX(duration), top)
  ctx.lineTo(mapX(duration), bottom)
  ctx.stroke()
  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.75
  ctx.textAlign = 'right'
  ctx.font = '700 20px -apple-system, sans-serif'
  ctx.fillText(formatDuration(duration), right, bottom + 36)
  ctx.globalAlpha = 1

  const pointsA = buildProgressionSeries(match.scoreEvents, 'A', duration)
  const pointsB = buildProgressionSeries(match.scoreEvents, 'B', duration)
  function drawLine(points: { t: number; v: number }[], color: string) {
    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = mapX(p.t)
      const y = mapY(p.v)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }
  drawLine(pointsA, EMBER_500)
  drawLine(pointsB, SKY_500)
}

// ---------- Variante 3: Afiche ----------

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

function drawSuitIcon(
  ctx: CanvasRenderingContext2D,
  type: 'espada' | 'oro' | 'basto' | 'copa',
  cx: number,
  cy: number,
  size: number,
  alpha: number,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = EMBER_500
  ctx.strokeStyle = EMBER_500
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(size / 24, size / 24)

  if (type === 'espada') {
    ctx.beginPath()
    ctx.moveTo(12, 1.5)
    ctx.lineTo(13.5, 12)
    ctx.lineTo(10.5, 12)
    ctx.closePath()
    ctx.fill()
    roundRectPath(ctx, 7.5, 12, 9, 1.6, 0.6)
    ctx.fill()
    roundRectPath(ctx, 11.2, 13.6, 1.6, 6.4, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(12, 21, 1.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (type === 'oro') {
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(12, 12, 8.5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(12, 12, 4, 0, Math.PI * 2)
    ctx.stroke()
  } else if (type === 'basto') {
    roundRectPath(ctx, 10.2, 7, 3.6, 15, 1.8)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(12, 5, 3.4, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(6, 3)
    ctx.lineTo(18, 3)
    ctx.lineTo(16.9, 9.2)
    ctx.arc(12, 9.2, 4.9, 0, Math.PI, false)
    ctx.lineTo(7.1, 9.2)
    ctx.closePath()
    ctx.fill()
    roundRectPath(ctx, 11.1, 13.8, 1.8, 4.4, 0)
    ctx.fill()
    roundRectPath(ctx, 7.8, 19, 8.4, 1.8, 0.9)
    ctx.fill()
  }
  ctx.restore()
}

function drawAfiche(ctx: CanvasRenderingContext2D, match: ShareableMatch) {
  drawWoodBackground(ctx)
  const { aWins, winnerName } = winnerOf(match)
  const leftX = SIZE * 0.3
  const rightX = SIZE * 0.7

  // Marco doble, como un cuadro para colgar.
  ctx.strokeStyle = 'rgba(203, 170, 106, 0.55)'
  ctx.lineWidth = 3
  roundRectPath(ctx, 54, 54, SIZE - 108, SIZE - 108, 10)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(203, 170, 106, 0.25)'
  ctx.lineWidth = 1
  roundRectPath(ctx, 68, 68, SIZE - 136, SIZE - 136, 6)
  ctx.stroke()

  drawSuitIcon(ctx, 'espada', 150, 150, 64, 0.55)
  drawSuitIcon(ctx, 'oro', SIZE - 150, 150, 64, 0.55)
  drawSuitIcon(ctx, 'basto', 150, SIZE - 150, 64, 0.55)
  drawSuitIcon(ctx, 'copa', SIZE - 150, SIZE - 150, 64, 0.55)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // Sello "Partido finalizado"
  ctx.font = '700 24px -apple-system, sans-serif'
  const sealText = 'PARTIDO FINALIZADO'
  const sealW = ctx.measureText(sealText).width + 70
  ctx.fillStyle = EMBER_500
  roundRectPath(ctx, SIZE / 2 - sealW / 2, 230, sealW, 56, 28)
  ctx.fill()
  ctx.fillStyle = WOOD_950
  ctx.fillText(sealText, SIZE / 2, 266)

  ctx.fillStyle = EMBER_500
  ctx.font = 'italic 700 78px Georgia, serif'
  ctx.fillText('¡Ganó', SIZE / 2, 410)
  const winnerLine = `${winnerName}!`
  fitFont(ctx, winnerLine, SIZE - 220, 78, 40, (px) => `italic 700 ${px}px Georgia, serif`)
  ctx.fillText(winnerLine, SIZE / 2, 500)

  ctx.strokeStyle = 'rgba(203, 170, 106, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(SIZE / 2, 545)
  ctx.lineTo(SIZE / 2, 760)
  ctx.stroke()

  ctx.fillStyle = PAPER_100
  fitFont(ctx, match.teamAName, 280, 32, 18, (px) => `italic ${px}px Georgia, serif`)
  ctx.fillText(match.teamAName, leftX, 590)
  fitFont(ctx, match.teamBName, 280, 32, 18, (px) => `italic ${px}px Georgia, serif`)
  ctx.fillText(match.teamBName, rightX, 590)

  ctx.font = `700 ${aWins ? 110 : 82}px Georgia, serif`
  ctx.fillStyle = PAPER_50
  ctx.globalAlpha = aWins ? 1 : 0.5
  ctx.fillText(String(match.scoreA), leftX, 700)
  ctx.font = `700 ${aWins ? 82 : 110}px Georgia, serif`
  ctx.globalAlpha = aWins ? 0.5 : 1
  ctx.fillText(String(match.scoreB), rightX, 700)
  ctx.globalAlpha = 1

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.5
  const namesA = joinNames(match.teamAPlayerNames)
  const namesB = joinNames(match.teamBPlayerNames)
  fitFont(ctx, namesA, 280, 22, 13, (px) => `${px}px -apple-system, sans-serif`)
  ctx.fillText(namesA, leftX, 745)
  fitFont(ctx, namesB, 280, 22, 13, (px) => `${px}px -apple-system, sans-serif`)
  ctx.fillText(namesB, rightX, 745)
  ctx.globalAlpha = 1

  ctx.strokeStyle = 'rgba(203, 170, 106, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(SIZE / 2 - 150, 820)
  ctx.lineTo(SIZE / 2 + 150, 820)
  ctx.stroke()

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.5
  ctx.font = '700 22px -apple-system, sans-serif'
  ctx.fillText(`OSOBUCO · ${formatDate(match.playedAt).toUpperCase()}`, SIZE / 2, 870)
  ctx.globalAlpha = 1
}

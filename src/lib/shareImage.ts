import type { ActiveMatch } from '../types'
import { aggregatePicaPicaRounds } from './picaPica'

// Dibujado a mano en canvas (en vez de renderizar el DOM a imagen) para no
// sumar una librería aparte: son pocos elementos y las fuentes (Georgia,
// system sans) ya son del sistema, así que no hace falta esperar a que
// carguen antes de dibujar texto.
const WOOD_900 = '#241708'
const WOOD_950 = '#1a1108'
const PAPER_50 = '#fdf6e6'
const PAPER_100 = '#f5e8cc'
const EMBER_500 = '#c9a227'

const SIZE = 1080

export function generateShareImageBlob(match: ActiveMatch): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

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

  const winnerName = match.scoreA >= match.scoreB ? match.teamAName : match.teamBName

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = EMBER_500
  ctx.font = '700 52px Georgia, serif'
  ctx.fillText('OSOBUCO', SIZE / 2, 120)

  ctx.font = '110px sans-serif'
  ctx.fillText('🏆', SIZE / 2, 280)

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.7
  ctx.font = '26px -apple-system, sans-serif'
  ctx.fillText('FIN DEL PARTIDO', SIZE / 2, 330)
  ctx.globalAlpha = 1

  ctx.fillStyle = EMBER_500
  ctx.font = '700 62px Georgia, serif'
  ctx.fillText(`¡Ganó ${winnerName}!`, SIZE / 2, 420)

  const leftX = SIZE * 0.28
  const rightX = SIZE * 0.72

  ctx.strokeStyle = 'rgba(203, 170, 106, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(SIZE / 2, 470)
  ctx.lineTo(SIZE / 2, 650)
  ctx.stroke()

  ctx.fillStyle = PAPER_100
  ctx.font = '34px Georgia, serif'
  ctx.fillText(match.teamAName, leftX, 510)
  ctx.fillText(match.teamBName, rightX, 510)

  ctx.fillStyle = PAPER_50
  ctx.font = '700 130px -apple-system, sans-serif'
  ctx.fillText(String(match.scoreA), leftX, 640)
  ctx.fillText(String(match.scoreB), rightX, 640)

  let y = 730
  const picaPicaTotals = aggregatePicaPicaRounds(match.picaPicaRoundsHistory)
  if (picaPicaTotals.length > 0) {
    ctx.fillStyle = EMBER_500
    ctx.font = '700 30px Georgia, serif'
    ctx.fillText('Mano a mano', SIZE / 2, y)
    y += 46
    ctx.font = '26px -apple-system, sans-serif'
    for (const d of picaPicaTotals) {
      ctx.fillStyle = d.scoreA > d.scoreB ? EMBER_500 : PAPER_100
      ctx.textAlign = 'right'
      ctx.fillText(d.aName, SIZE / 2 - 90, y)

      ctx.fillStyle = PAPER_100
      ctx.globalAlpha = 0.75
      ctx.textAlign = 'center'
      ctx.fillText(`${d.scoreA} - ${d.scoreB}`, SIZE / 2, y)
      ctx.globalAlpha = 1

      ctx.fillStyle = d.scoreB > d.scoreA ? EMBER_500 : PAPER_100
      ctx.textAlign = 'left'
      ctx.fillText(d.bName, SIZE / 2 + 90, y)
      y += 42
    }
    ctx.textAlign = 'center'
  }

  ctx.fillStyle = PAPER_100
  ctx.globalAlpha = 0.4
  ctx.font = '22px -apple-system, sans-serif'
  ctx.fillText('Marcador hecho con Osobuco', SIZE / 2, SIZE - 60)
  ctx.globalAlpha = 1

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

import type { ScoreEvent } from '../types'
import { formatDuration } from './formatDuration'

export interface ProgressionPoint {
  t: number
  v: number
}

// Arma la línea de un equipo: arranca en 0-0 y suma el delta de cada evento
// de ese equipo en el momento (en segundos) en que pasó, estirada en plano
// hasta el final del partido para que la línea llegue al borde del gráfico.
export function buildProgressionSeries(
  events: ScoreEvent[],
  team: 'A' | 'B',
  durationSeconds: number,
): ProgressionPoint[] {
  const points: ProgressionPoint[] = [{ t: 0, v: 0 }]
  let v = 0
  for (const e of events) {
    if (e.team !== team) continue
    v += e.delta
    points.push({ t: e.atSeconds, v })
  }
  points.push({ t: durationSeconds, v })
  return points
}

// Interpola en línea recta entre los dos puntos que rodean a `t` (igual que
// el trazo que dibuja el gráfico), para saber cuánto iba el equipo en
// cualquier momento, no solo en los momentos exactos en que sumó.
export function evalProgressionAt(points: ProgressionPoint[], t: number): number {
  for (let i = 1; i < points.length; i++) {
    if (points[i].t >= t) {
      const a = points[i - 1]
      const b = points[i]
      if (b.t === a.t) return b.v
      const frac = (t - a.t) / (b.t - a.t)
      return a.v + (b.v - a.v) * frac
    }
  }
  return points[points.length - 1].v
}

// Marcas del eje de tiempo cada 10 minutos, salteando la que quedaría
// pisada por la marca final (más ancha si pasó la hora, formato h:mm:ss).
// Compartido por el gráfico en vivo y por la imagen para compartir, para que
// las dos dibujen el mismo eje.
export function buildTimeTicks(durationSeconds: number): number[] {
  const finalLabelLength = formatDuration(durationSeconds).length
  const skipThreshold = finalLabelLength > 5 ? 900 : 300
  const ticks: number[] = []
  for (let t = 0; t <= durationSeconds; t += 600) {
    if (t !== 0 && durationSeconds - t < skipThreshold) continue
    ticks.push(t)
  }
  return ticks
}

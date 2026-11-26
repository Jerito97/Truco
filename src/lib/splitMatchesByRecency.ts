import type { FinishedMatch } from '../types'

export interface RecencySplit {
  recent: FinishedMatch[]
  older: FinishedMatch[]
}

// Separa el historial en "mes actual + el anterior" (lo que se ve por
// default) y "el resto" (detrás del botón de "ver todo"), para que el
// historial no arranque como una lista interminable apenas se juega un
// tiempo. No asume que `matches` venga ordenado: filtra por fecha nomás.
export function splitMatchesByRecency(matches: FinishedMatch[], now: Date = new Date()): RecencySplit {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const recent: FinishedMatch[] = []
  const older: FinishedMatch[] = []
  for (const m of matches) {
    if (new Date(m.played_at).getTime() >= cutoff) recent.push(m)
    else older.push(m)
  }
  return { recent, older }
}

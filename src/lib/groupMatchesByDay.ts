import type { FinishedMatch } from '../types'
import { formatDate } from './formatDate'

export interface MatchDayGroup {
  label: string
  matches: FinishedMatch[]
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// Separa el historial en tandas por día (en vez de una lista larga sin
// cortes) para que se note cuándo se jugó cada partido, sobre todo cuando se
// juegan varios seguidos en la misma juntada. Asume que `matches` ya viene
// ordenado cronológicamente (los partidos del mismo día quedan contiguos,
// sea el orden ascendente o descendente).
export function groupMatchesByDay(matches: FinishedMatch[], now: Date = new Date()): MatchDayGroup[] {
  const todayStart = startOfDay(now)
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

  const groups: { dayStart: number; label: string; matches: FinishedMatch[] }[] = []
  for (const m of matches) {
    const dayStart = startOfDay(new Date(m.played_at))
    const last = groups[groups.length - 1]
    if (last && last.dayStart === dayStart) {
      last.matches.push(m)
      continue
    }
    const label = dayStart === todayStart ? 'Hoy' : dayStart === yesterdayStart ? 'Ayer' : formatDate(m.played_at)
    groups.push({ dayStart, label, matches: [m] })
  }
  return groups.map(({ label, matches }) => ({ label, matches }))
}

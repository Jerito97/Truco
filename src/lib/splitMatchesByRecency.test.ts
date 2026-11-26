import { describe, expect, it } from 'vitest'
import { splitMatchesByRecency } from './splitMatchesByRecency'
import type { FinishedMatch } from '../types'

function match(playedAt: string): FinishedMatch {
  return {
    id: playedAt,
    played_at: playedAt,
    team_a_name: 'A',
    team_b_name: 'B',
    team_a_player_ids: ['a'],
    team_b_player_ids: ['b'],
    team_a_player_names: ['A'],
    team_b_player_names: ['B'],
    score_a: 30,
    score_b: 10,
    winner: 'A',
    pica_pica_played: false,
    pica_pica_total_a: 0,
    pica_pica_total_b: 0,
    pica_pica_rounds: [],
    duration_seconds: null,
    score_events: [],
  }
}

// "Ahora" cae el 25 de noviembre de 2026: el corte de "reciente" queda en el
// 1 de octubre de 2026 (mes actual + el anterior).
const NOW = new Date('2026-11-25T12:00:00')

describe('splitMatchesByRecency', () => {
  it('sin partidos, ambas listas vacías', () => {
    expect(splitMatchesByRecency([], NOW)).toEqual({ recent: [], older: [] })
  })

  it('partidos del mes actual y el anterior van a "recent"', () => {
    const thisMonth = match('2026-11-25T10:00:00')
    const lastMonth = match('2026-10-01T10:00:00')
    const { recent, older } = splitMatchesByRecency([thisMonth, lastMonth], NOW)
    expect(recent).toEqual([thisMonth, lastMonth])
    expect(older).toEqual([])
  })

  it('partidos de hace 2+ meses van a "older"', () => {
    const old = match('2026-09-30T23:59:59')
    const { recent, older } = splitMatchesByRecency([old], NOW)
    expect(recent).toEqual([])
    expect(older).toEqual([old])
  })

  it('separa una mezcla de recientes y viejos preservando el orden', () => {
    const a = match('2026-11-25T10:00:00')
    const b = match('2026-09-01T10:00:00')
    const c = match('2026-10-15T10:00:00')
    const { recent, older } = splitMatchesByRecency([a, b, c], NOW)
    expect(recent).toEqual([a, c])
    expect(older).toEqual([b])
  })
})

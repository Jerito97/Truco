import { describe, expect, it } from 'vitest'
import { groupMatchesByDay } from './groupMatchesByDay'
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

const NOW = new Date('2026-11-25T12:00:00')

describe('groupMatchesByDay', () => {
  it('sin partidos, sin grupos', () => {
    expect(groupMatchesByDay([], NOW)).toEqual([])
  })

  it('varios partidos del mismo día quedan en un solo grupo', () => {
    const matches = [match('2026-11-25T20:00:00'), match('2026-11-25T18:00:00'), match('2026-11-25T10:00:00')]
    const groups = groupMatchesByDay(matches, NOW)
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('Hoy')
    expect(groups[0].matches).toHaveLength(3)
  })

  it('etiqueta "Hoy" y "Ayer" para los últimos dos días, y la fecha para el resto', () => {
    const matches = [match('2026-11-25T09:00:00'), match('2026-11-24T09:00:00'), match('2026-11-20T09:00:00')]
    const groups = groupMatchesByDay(matches, NOW)
    expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Ayer', '20/11/2026'])
    expect(groups.every((g) => g.matches.length === 1)).toBe(true)
  })

  it('separa en grupos distintos aunque no sean contiguos en el array (días intercalados)', () => {
    const matches = [match('2026-11-25T09:00:00'), match('2026-11-24T09:00:00'), match('2026-11-25T08:00:00')]
    const groups = groupMatchesByDay(matches, NOW)
    expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Ayer', 'Hoy'])
  })
})

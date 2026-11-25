import { describe, expect, it } from 'vitest'
import { computeRivalStats, listPicaPicaDuels } from './PlayerStats'
import type { FinishedMatch } from '../types'

const U = 'user-1'

function match(overrides: Partial<FinishedMatch>): FinishedMatch {
  return {
    id: 'm',
    played_at: '2026-01-01T00:00:00.000Z',
    team_a_name: 'A',
    team_b_name: 'B',
    team_a_player_ids: [U],
    team_b_player_ids: ['rival-1'],
    team_a_player_names: ['Yo'],
    team_b_player_names: ['Rival'],
    score_a: 30,
    score_b: 10,
    winner: 'A',
    pica_pica_played: false,
    pica_pica_total_a: 0,
    pica_pica_total_b: 0,
    pica_pica_rounds: [],
    duration_seconds: null,
    score_events: [],
    ...overrides,
  }
}

describe('computeRivalStats', () => {
  it('sin partidos, no hay rival destacado', () => {
    expect(computeRivalStats([], U)).toEqual({ best: null, worst: null })
  })

  it('identifica al rival más ganado y al más perdido', () => {
    const matches = [
      match({ team_b_player_ids: ['r1'], team_b_player_names: ['Mulo'], winner: 'A' }),
      match({ team_b_player_ids: ['r1'], team_b_player_names: ['Mulo'], winner: 'A' }),
      match({ team_a_player_ids: ['r2'], team_a_player_names: ['Patroclo'], team_b_player_ids: [U], team_b_player_names: ['Yo'], winner: 'A' }),
    ]
    const { best, worst } = computeRivalStats(matches, U)
    expect(best).toEqual({ name: 'Mulo', wins: 2 })
    expect(worst).toEqual({ name: 'Patroclo', losses: 1 })
  })

  it('identifica al rival por id, no por nombre (sobrevive a un renombre)', () => {
    const matches = [
      match({ team_b_player_ids: ['r1'], team_b_player_names: ['Nombre Nuevo'], winner: 'A' }),
      match({ team_b_player_ids: ['r1'], team_b_player_names: ['Nombre Viejo'], winner: 'A' }),
    ]
    const { best } = computeRivalStats(matches, U)
    // El primero en la lista es el más reciente (useMatches trae desc): su
    // nombre es el que debería quedar.
    expect(best).toEqual({ name: 'Nombre Nuevo', wins: 2 })
  })

  it('en un equipo de varios, cuenta a cada rival del otro equipo', () => {
    const matches = [
      match({
        team_a_player_ids: [U, 'mate'],
        team_a_player_names: ['Yo', 'Compañero'],
        team_b_player_ids: ['r1', 'r2'],
        team_b_player_names: ['Rival1', 'Rival2'],
        winner: 'A',
      }),
    ]
    const { best } = computeRivalStats(matches, U)
    expect(best?.wins).toBe(1)
    // Cualquiera de los dos rivales del otro equipo es un candidato válido a
    // "más ganado" con 1 victoria cada uno; alcanza con que no cuente a mate.
    expect(['Rival1', 'Rival2']).toContain(best?.name)
  })
})

describe('listPicaPicaDuels', () => {
  it('sin pica-pica jugado, lista vacía', () => {
    expect(listPicaPicaDuels([match({})], U)).toEqual([])
  })

  it('arma una entrada por duelo real, con el rival y el resultado', () => {
    const matches = [
      match({
        id: 'm1',
        played_at: '2026-02-01T00:00:00.000Z',
        pica_pica_rounds: [
          { duels: [{ aId: U, bId: 'rival-1', aName: 'Yo', bName: 'Rival', scoreA: 2, scoreB: 1 }] },
        ],
      }),
    ]
    expect(listPicaPicaDuels(matches, U)).toEqual([
      { matchId: 'm1', playedAt: '2026-02-01T00:00:00.000Z', rivalName: 'Rival', myScore: 2, rivalScore: 1 },
    ])
  })

  it('un duelo en 0 a 0 no aparece en la lista (mismo criterio que el agregado)', () => {
    const matches = [
      match({
        pica_pica_rounds: [{ duels: [{ aId: U, bId: 'rival-1', aName: 'Yo', bName: 'Rival', scoreA: 0, scoreB: 0 }] }],
      }),
    ]
    expect(listPicaPicaDuels(matches, U)).toEqual([])
  })

  it('ignora duelos de otros jugadores del mismo partido', () => {
    const matches = [
      match({
        team_a_player_ids: [U, 'mate'],
        team_a_player_names: ['Yo', 'Compañero'],
        pica_pica_rounds: [
          { duels: [{ aId: 'mate', bId: 'rival-1', aName: 'Compañero', bName: 'Rival', scoreA: 3, scoreB: 0 }] },
        ],
      }),
    ]
    expect(listPicaPicaDuels(matches, U)).toEqual([])
  })
})

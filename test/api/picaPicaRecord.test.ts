import { describe, expect, it } from 'vitest'
import { computePicaPicaRecord } from '../../api/picaPicaRecord.js'

const U = 'user-1'

describe('computePicaPicaRecord', () => {
  it('sin partidos con pica-pica, 0 y 0', () => {
    expect(computePicaPicaRecord([], U)).toEqual({ played: 0, won: 0 })
  })

  it('cuenta duelos ganados y jugados usando aId/bId (partidos nuevos)', () => {
    const matches = [
      {
        team_a_player_ids: [U, 'p2', 'p3'],
        team_a_player_names: ['Yo', 'B', 'C'],
        team_b_player_ids: ['p4', 'p5', 'p6'],
        team_b_player_names: ['D', 'E', 'F'],
        pica_pica_rounds: [
          {
            duels: [
              { aId: U, bId: 'p4', aName: 'Yo', bName: 'D', scoreA: 2, scoreB: 1 }, // gana
              { aId: 'p2', bId: 'p5', aName: 'B', bName: 'E', scoreA: 0, scoreB: 2 }, // no es el jugador
              { aId: 'p3', bId: 'p6', aName: 'C', bName: 'F', scoreA: 1, scoreB: 1 }, // no es el jugador
            ],
          },
        ],
      },
    ]
    expect(computePicaPicaRecord(matches, U)).toEqual({ played: 1, won: 1 })
  })

  it('un empate cuenta como jugado pero no como ganado', () => {
    const matches = [
      {
        team_a_player_ids: [U],
        team_a_player_names: ['Yo'],
        team_b_player_ids: ['p2'],
        team_b_player_names: ['Rival'],
        pica_pica_rounds: [{ duels: [{ aId: U, bId: 'p2', aName: 'Yo', bName: 'Rival', scoreA: 1, scoreB: 1 }] }],
      },
    ]
    expect(computePicaPicaRecord(matches, U)).toEqual({ played: 1, won: 0 })
  })

  it('sin aId/bId (partido viejo) cae al nombre que tenía en ESE partido, no al actual', () => {
    const matches = [
      {
        team_a_player_ids: [U],
        team_a_player_names: ['Nombre Viejo'], // como se llamaba en ese momento
        team_b_player_ids: ['p2'],
        team_b_player_names: ['Rival'],
        pica_pica_rounds: [{ duels: [{ aName: 'Nombre Viejo', bName: 'Rival', scoreA: 3, scoreB: 0 }] }],
      },
    ]
    expect(computePicaPicaRecord(matches, U)).toEqual({ played: 1, won: 1 })
  })

  it('suma a través de varios partidos y varias rondas de pica-pica dentro de un mismo partido', () => {
    const matches = [
      {
        team_a_player_ids: [U],
        team_a_player_names: ['Yo'],
        team_b_player_ids: ['p2'],
        team_b_player_names: ['Rival'],
        pica_pica_rounds: [
          { duels: [{ aId: U, bId: 'p2', aName: 'Yo', bName: 'Rival', scoreA: 2, scoreB: 0 }] },
          { duels: [{ aId: U, bId: 'p2', aName: 'Yo', bName: 'Rival', scoreA: 0, scoreB: 2 }] },
        ],
      },
      {
        team_a_player_ids: ['p3'],
        team_a_player_names: ['Otro'],
        team_b_player_ids: [U],
        team_b_player_names: ['Yo'],
        pica_pica_rounds: [{ duels: [{ aId: 'p3', bId: U, aName: 'Otro', bName: 'Yo', scoreA: 0, scoreB: 3 }] }],
      },
    ]
    expect(computePicaPicaRecord(matches, U)).toEqual({ played: 3, won: 2 })
  })
})

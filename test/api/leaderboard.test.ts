import { describe, expect, it } from 'vitest'
import { computeBestStreaks } from '../../api/leaderboard.js'

function row(winner: 'A' | 'B', a: string[], b: string[]) {
  return { winner, team_a_player_ids: a, team_b_player_ids: b }
}

describe('computeBestStreaks', () => {
  it('sin partidos, racha 0 para todos', () => {
    expect(computeBestStreaks([], ['p1', 'p2'])).toEqual(
      new Map([
        ['p1', 0],
        ['p2', 0],
      ]),
    )
  })

  it('devuelve la mejor racha histórica, no la vigente', () => {
    // p1 gana 2 seguidos y después pierde el último: la racha vigente es 0,
    // pero la mejor (la que interesa para el ranking) sigue siendo 2.
    const rows = [
      row('A', ['p1'], ['p2']), // p1 gana
      row('A', ['p1'], ['p3']), // p1 gana (racha 2)
      row('B', ['p1'], ['p2']), // p1 pierde
    ]
    const streaks = computeBestStreaks(rows, ['p1'])
    expect(streaks.get('p1')).toBe(2)
  })

  it('calcula la mejor racha de cada jugador de forma independiente', () => {
    const rows = [
      row('A', ['p1'], ['p2']), // p1 gana, p2 pierde
      row('A', ['p1'], ['p3']), // p1 gana, p3 pierde
      row('B', ['p2'], ['p3']), // p3 gana (viene de perder antes), p2 pierde
    ]
    const streaks = computeBestStreaks(rows, ['p1', 'p2', 'p3'])
    expect(streaks.get('p1')).toBe(2)
    expect(streaks.get('p2')).toBe(0)
    expect(streaks.get('p3')).toBe(1)
  })

  it('un jugador sin partidos en la lista (nunca jugó) da 0', () => {
    const rows = [row('A', ['p1'], ['p2'])]
    expect(computeBestStreaks(rows, ['p1', 'p3']).get('p3')).toBe(0)
  })

  it('no mezcla partidos de otros jugadores al calcular la racha de uno', () => {
    // p3 nunca jugó estos partidos: su racha no debería verse afectada por
    // quién ganó o perdió entre p1 y p2.
    const rows = [row('A', ['p1'], ['p2']), row('B', ['p1'], ['p2'])]
    const streaks = computeBestStreaks(rows, ['p1', 'p2', 'p3'])
    expect(streaks.get('p3')).toBe(0)
  })
})

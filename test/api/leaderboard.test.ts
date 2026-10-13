import { describe, expect, it } from 'vitest'
import { computeCurrentStreaks } from '../../api/leaderboard.js'

function row(winner: 'A' | 'B', a: string[], b: string[]) {
  return { winner, team_a_player_ids: a, team_b_player_ids: b }
}

describe('computeCurrentStreaks', () => {
  it('sin partidos, racha 0 para todos', () => {
    expect(computeCurrentStreaks([], ['p1', 'p2'])).toEqual(
      new Map([
        ['p1', 0],
        ['p2', 0],
      ]),
    )
  })

  it('calcula la racha actual de cada jugador de forma independiente', () => {
    const rows = [
      row('A', ['p1'], ['p2']), // p1 gana, p2 pierde
      row('A', ['p1'], ['p3']), // p1 gana, p3 pierde
      row('B', ['p2'], ['p3']), // p3 gana (viene de perder antes), p2 pierde
    ]
    const streaks = computeCurrentStreaks(rows, ['p1', 'p2', 'p3'])
    expect(streaks.get('p1')).toBe(2)
    expect(streaks.get('p2')).toBe(0)
    expect(streaks.get('p3')).toBe(1)
  })

  it('un jugador sin partidos en la lista (nunca jugó) da 0', () => {
    const rows = [row('A', ['p1'], ['p2'])]
    expect(computeCurrentStreaks(rows, ['p1', 'p3']).get('p3')).toBe(0)
  })

  it('no mezcla partidos de otros jugadores al calcular la racha de uno', () => {
    // p3 nunca jugó estos partidos: su racha no debería verse afectada por
    // quién ganó o perdió entre p1 y p2.
    const rows = [row('A', ['p1'], ['p2']), row('B', ['p1'], ['p2'])]
    const streaks = computeCurrentStreaks(rows, ['p1', 'p2', 'p3'])
    expect(streaks.get('p3')).toBe(0)
  })
})

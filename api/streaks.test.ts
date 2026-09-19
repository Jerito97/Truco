import { describe, expect, it } from 'vitest'
import { computeStreaks } from './streaks.js'

const U = 'user-1'

function row(anaSide: 'A' | 'B', win: boolean) {
  const winner = win ? anaSide : anaSide === 'A' ? 'B' : 'A'
  return {
    winner: winner as 'A' | 'B',
    team_a_player_ids: anaSide === 'A' ? [U] : ['other'],
  }
}

describe('computeStreaks', () => {
  it('sin partidos, todo en 0', () => {
    expect(computeStreaks([], U)).toEqual({ current: 0, best: 0 })
  })

  it('todo victorias: la racha actual y la mejor son el total', () => {
    const rows = [row('A', true), row('B', true), row('A', true)]
    expect(computeStreaks(rows, U)).toEqual({ current: 3, best: 3 })
  })

  it('si el último partido lo perdió, la racha actual es 0 aunque haya tenido una racha antes', () => {
    const rows = [row('A', true), row('B', true), row('A', false)]
    expect(computeStreaks(rows, U)).toEqual({ current: 0, best: 2 })
  })

  it('G G P G G G P G: mejor racha 3, racha actual 1 (independiente del lado en que jugó)', () => {
    const rows = [
      row('A', true),
      row('B', true),
      row('A', false),
      row('B', true),
      row('A', true),
      row('B', true),
      row('A', false),
      row('B', true),
    ]
    expect(computeStreaks(rows, U)).toEqual({ current: 1, best: 3 })
  })
})

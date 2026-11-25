import { describe, expect, it } from 'vitest'
import { computeStreaks, computeTier } from '../../api/streaks.js'

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

describe('computeTier', () => {
  it('con menos de 5 partidos jugados, no asigna tier', () => {
    const rows = [row('A', true), row('A', true), row('A', true), row('A', false)]
    expect(computeTier(rows, U)).toBeNull()
  })

  it('con exactamente 5 partidos y 60% o más de victorias, tier 1', () => {
    const rows = [row('A', true), row('A', true), row('A', true), row('A', false), row('A', false)]
    expect(computeTier(rows, U)).toBe(1)
  })

  it('con 40% a 59% de victorias, tier 2', () => {
    const rows = [row('A', true), row('A', true), row('A', false), row('A', false), row('A', false)]
    expect(computeTier(rows, U)).toBe(2)
  })

  it('con menos de 40% de victorias, tier 3', () => {
    const rows = [row('A', true), row('A', false), row('A', false), row('A', false), row('A', false)]
    expect(computeTier(rows, U)).toBe(3)
  })

  it('solo mira los últimos 10 partidos: lo viejo no pesa aunque haya sido un desastre', () => {
    const viejosPerdidos = Array.from({ length: 8 }, () => row('A', false))
    const ultimos10GanaTodos = Array.from({ length: 10 }, () => row('A', true))
    const rows = [...viejosPerdidos, ...ultimos10GanaTodos]
    expect(computeTier(rows, U)).toBe(1)
  })

  it('si viene en bajón ahora, el tier lo refleja aunque haya sido tier 1 toda la vida', () => {
    const viejosGanados = Array.from({ length: 20 }, () => row('A', true))
    const ultimos10Perdidos = Array.from({ length: 10 }, () => row('A', false))
    const rows = [...viejosGanados, ...ultimos10Perdidos]
    expect(computeTier(rows, U)).toBe(3)
  })
})

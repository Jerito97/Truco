import { describe, expect, it } from 'vitest'
import { computeTier, tierFromWinCount } from '../../api/_lib/tier.js'

const U = 'user-1'

function row(anaSide: 'A' | 'B', win: boolean) {
  const winner = win ? anaSide : anaSide === 'A' ? 'B' : 'A'
  return {
    winner: winner as 'A' | 'B',
    team_a_player_ids: anaSide === 'A' ? [U] : ['other'],
  }
}

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

describe('tierFromWinCount', () => {
  it('con menos de 5 partidos, null', () => {
    expect(tierFromWinCount(3, 4)).toBeNull()
  })

  it('reproduce los mismos cortes que computeTier, a partir de conteos ya agregados', () => {
    expect(tierFromWinCount(6, 10)).toBe(1)
    expect(tierFromWinCount(4, 10)).toBe(2)
    expect(tierFromWinCount(3, 10)).toBe(3)
  })
})

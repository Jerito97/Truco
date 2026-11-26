import { describe, expect, it } from 'vitest'
import { computeBracketLayout } from './bracketLayout'

describe('computeBracketLayout', () => {
  it('sin rondas, todo en cero', () => {
    expect(computeBracketLayout([], 60)).toEqual({ totalHeight: 0, positions: [] })
  })

  it('un solo cruce (2 equipos): un único centro', () => {
    const layout = computeBracketLayout([1], 60)
    expect(layout.totalHeight).toBe(60)
    expect(layout.positions).toEqual([[30]])
  })

  it('4 equipos (2 rondas): la final queda centrada entre los dos cruces de la primera ronda', () => {
    const layout = computeBracketLayout([2, 1], 60)
    expect(layout.totalHeight).toBe(120)
    expect(layout.positions[0]).toEqual([30, 90])
    expect(layout.positions[1]).toEqual([60])
  })

  it('8 equipos (3 rondas): cada ronda centrada entre los pares de la anterior', () => {
    const layout = computeBracketLayout([4, 2, 1], 60)
    expect(layout.totalHeight).toBe(240)
    expect(layout.positions[0]).toEqual([30, 90, 150, 210])
    expect(layout.positions[1]).toEqual([60, 180])
    expect(layout.positions[2]).toEqual([120])
  })
})

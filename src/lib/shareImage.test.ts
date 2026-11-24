import { describe, expect, it } from 'vitest'
import { availableShareVariants } from './shareImage'

describe('availableShareVariants', () => {
  it('ofrece las 3 cuando hay eventos y duración', () => {
    expect(
      availableShareVariants({ scoreEvents: [{ team: 'A', atSeconds: 5, delta: 1 }], durationSeconds: 120 }),
    ).toEqual(['directo', 'linea-tiempo', 'afiche'])
  })

  it('sin eventos (partido viejo) no ofrece la de línea de tiempo', () => {
    expect(availableShareVariants({ scoreEvents: [], durationSeconds: null })).toEqual(['directo', 'afiche'])
  })

  it('con eventos pero sin duración tampoco la ofrece', () => {
    expect(
      availableShareVariants({ scoreEvents: [{ team: 'A', atSeconds: 5, delta: 1 }], durationSeconds: null }),
    ).toEqual(['directo', 'afiche'])
  })
})

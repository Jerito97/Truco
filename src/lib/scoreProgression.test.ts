import { describe, expect, it } from 'vitest'
import { buildProgressionSeries, evalProgressionAt } from './scoreProgression'
import type { ScoreEvent } from '../types'

describe('buildProgressionSeries', () => {
  it('arranca en 0-0 y estira en plano hasta el final aunque ese equipo no haya sumado', () => {
    const events: ScoreEvent[] = []
    expect(buildProgressionSeries(events, 'A', 120)).toEqual([
      { t: 0, v: 0 },
      { t: 120, v: 0 },
    ])
  })

  it('suma los deltas solo del equipo pedido, en el orden en que pasaron', () => {
    const events: ScoreEvent[] = [
      { team: 'A', atSeconds: 10, delta: 1 },
      { team: 'B', atSeconds: 15, delta: 1 },
      { team: 'A', atSeconds: 40, delta: 1 },
      { team: 'B', atSeconds: 55, delta: 2 }, // diferencia del pica-pica, de una sola vez
    ]

    expect(buildProgressionSeries(events, 'A', 60)).toEqual([
      { t: 0, v: 0 },
      { t: 10, v: 1 },
      { t: 40, v: 2 },
      { t: 60, v: 2 },
    ])
    expect(buildProgressionSeries(events, 'B', 60)).toEqual([
      { t: 0, v: 0 },
      { t: 15, v: 1 },
      { t: 55, v: 3 },
      { t: 60, v: 3 },
    ])
  })
})

describe('evalProgressionAt', () => {
  const points = [
    { t: 0, v: 0 },
    { t: 10, v: 2 },
    { t: 30, v: 2 },
    { t: 40, v: 6 },
  ]

  it('devuelve el valor exacto en un punto marcado', () => {
    expect(evalProgressionAt(points, 10)).toBe(2)
  })

  it('interpola en línea recta entre dos puntos', () => {
    expect(evalProgressionAt(points, 35)).toBe(4) // mitad de camino entre 2 y 6
  })

  it('se mantiene en el último valor después del último punto', () => {
    expect(evalProgressionAt(points, 100)).toBe(6)
  })
})

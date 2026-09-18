import { describe, expect, it } from 'vitest'
import { aggregatePicaPicaRounds } from './picaPica'

describe('aggregatePicaPicaRounds', () => {
  it('devuelve vacío si no hubo rondas', () => {
    expect(aggregatePicaPicaRounds([])).toEqual([])
  })

  it('suma los puntos de cada duelo por índice a través de varias rondas', () => {
    const rounds = [
      {
        duels: [
          { aName: 'Ana', bName: 'Beto', scoreA: 2, scoreB: 1 },
          { aName: 'Cami', bName: 'Dani', scoreA: 0, scoreB: 3 },
        ],
      },
      {
        duels: [
          { aName: 'Ana', bName: 'Beto', scoreA: 1, scoreB: 1 },
          { aName: 'Cami', bName: 'Dani', scoreA: 2, scoreB: 0 },
        ],
      },
    ]

    expect(aggregatePicaPicaRounds(rounds)).toEqual([
      { aName: 'Ana', bName: 'Beto', scoreA: 3, scoreB: 2 },
      { aName: 'Cami', bName: 'Dani', scoreA: 2, scoreB: 3 },
    ])
  })

  it('respeta el índice del duelo aunque una ronda tenga menos duelos que otra', () => {
    const rounds = [
      { duels: [{ aName: 'Ana', bName: 'Beto', scoreA: 1, scoreB: 0 }] },
      {
        duels: [
          { aName: 'Ana', bName: 'Beto', scoreA: 1, scoreB: 0 },
          { aName: 'Cami', bName: 'Dani', scoreA: 3, scoreB: 3 },
        ],
      },
    ]

    expect(aggregatePicaPicaRounds(rounds)).toEqual([
      { aName: 'Ana', bName: 'Beto', scoreA: 2, scoreB: 0 },
      { aName: 'Cami', bName: 'Dani', scoreA: 3, scoreB: 3 },
    ])
  })
})

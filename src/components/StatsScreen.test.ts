import { describe, expect, it } from 'vitest'
import { sortPairStats } from './StatsScreen'
import type { PairStat } from './StatsScreen'

const stats: PairStat[] = [
  { name: 'Ana', played: 10, won: 5 }, // 50%
  { name: 'Bruno', played: 3, won: 3 }, // 100%, pero jugó poco
  { name: 'Cami', played: 6, won: 4 }, // 66%
]

describe('sortPairStats', () => {
  it('"jugados": por cantidad de partidos, de más a menos', () => {
    expect(sortPairStats(stats, 'jugados').map((s) => s.name)).toEqual(['Ana', 'Cami', 'Bruno'])
  })

  it('"victorias": por cantidad de victorias, de más a menos', () => {
    expect(sortPairStats(stats, 'victorias').map((s) => s.name)).toEqual(['Ana', 'Cami', 'Bruno'])
  })

  it('"rendimiento": por porcentaje de victorias, no por cantidad jugada', () => {
    expect(sortPairStats(stats, 'rendimiento').map((s) => s.name)).toEqual(['Bruno', 'Cami', 'Ana'])
  })

  it('no muta el array original', () => {
    const copy = [...stats]
    sortPairStats(stats, 'rendimiento')
    expect(stats).toEqual(copy)
  })

  it('empate: desempata por más partidos jugados y después por nombre', () => {
    const tied: PairStat[] = [
      { name: 'Zulema', played: 4, won: 2 },
      { name: 'Ana', played: 4, won: 2 },
      { name: 'Bruno', played: 6, won: 3 },
    ]
    // Los tres tienen 50%: gana el que jugó más (Bruno), y entre Zulema/Ana
    // (mismos partidos) desempata el nombre.
    expect(sortPairStats(tied, 'rendimiento').map((s) => s.name)).toEqual(['Bruno', 'Ana', 'Zulema'])
  })
})

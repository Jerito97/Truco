import { describe, expect, it } from 'vitest'
import {
  applyEliminationResult,
  applyRoundRobinResult,
  buildBracket,
  buildRoundRobin,
  computeStandings,
  getEliminationChampion,
  getRoundRobinChampion,
  isEliminationComplete,
  isRoundRobinComplete,
  suggestFormat,
} from './tournament'

describe('suggestFormat', () => {
  it('3 equipos: todos contra todos', () => {
    expect(suggestFormat(3)).toBe('todos_contra_todos')
  })

  it('cualquier otra cantidad: eliminación directa', () => {
    expect(suggestFormat(2)).toBe('eliminacion')
    expect(suggestFormat(4)).toBe('eliminacion')
    expect(suggestFormat(5)).toBe('eliminacion')
    expect(suggestFormat(8)).toBe('eliminacion')
  })
})

describe('buildBracket', () => {
  it('2 equipos: una sola ronda, un solo cruce, sin bye', () => {
    const b = buildBracket(2)
    expect(b.rounds).toHaveLength(1)
    expect(b.rounds[0]).toEqual([{ teamA: 0, teamB: 1, bye: false, matchId: null, winner: null }])
  })

  it('4 equipos: 2 rondas (semis + final), sin bye', () => {
    const b = buildBracket(4)
    expect(b.rounds).toHaveLength(2)
    expect(b.rounds[0]).toEqual([
      { teamA: 0, teamB: 1, bye: false, matchId: null, winner: null },
      { teamA: 2, teamB: 3, bye: false, matchId: null, winner: null },
    ])
    expect(b.rounds[1]).toEqual([{ teamA: null, teamB: null, bye: false, matchId: null, winner: null }])
  })

  it('3 equipos: redondea a 4, un bye para el primer equipo', () => {
    const b = buildBracket(3)
    expect(b.rounds).toHaveLength(2)
    // El equipo 0 tiene bye y ya avanza resuelto a la ronda 1.
    expect(b.rounds[0][0]).toEqual({ teamA: 0, teamB: null, bye: true, matchId: null, winner: 0 })
    expect(b.rounds[0][1]).toEqual({ teamA: 1, teamB: 2, bye: false, matchId: null, winner: null })
    expect(b.rounds[1][0]).toEqual({ teamA: 0, teamB: null, bye: false, matchId: null, winner: null })
  })

  it('5 equipos: redondea a 8, 3 bye, y usa todos los equipos exactamente una vez', () => {
    const b = buildBracket(5)
    expect(b.rounds).toHaveLength(3)
    expect(b.rounds[0]).toHaveLength(4)
    const used: number[] = []
    for (const f of b.rounds[0]) {
      used.push(f.teamA as number)
      if (f.teamB != null) used.push(f.teamB)
    }
    expect(used.sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4])
    expect(b.rounds[0].filter((f) => f.bye)).toHaveLength(3)
  })

  it('6 equipos: 2 bye, y dos equipos que avanzaron por bye se cruzan en la ronda 1', () => {
    const b = buildBracket(6)
    // Ronda 0: bye(0), bye(1), 2 vs 3, 4 vs 5
    expect(b.rounds[0]).toEqual([
      { teamA: 0, teamB: null, bye: true, matchId: null, winner: 0 },
      { teamA: 1, teamB: null, bye: true, matchId: null, winner: 1 },
      { teamA: 2, teamB: 3, bye: false, matchId: null, winner: null },
      { teamA: 4, teamB: 5, bye: false, matchId: null, winner: null },
    ])
    // Ronda 1: los dos bye (equipo 0 y 1) ya quedan enfrentados entre sí,
    // como un cruce real (no es otro bye).
    expect(b.rounds[1][0]).toEqual({ teamA: 0, teamB: 1, bye: false, matchId: null, winner: null })
  })
})

describe('applyEliminationResult + propagación', () => {
  it('el ganador de un cruce pasa resuelto al cruce que le toca en la ronda siguiente', () => {
    let b = buildBracket(4)
    b = applyEliminationResult(b, 0, 0, 'm1', 1) // gana el equipo 1 (teamB del cruce 0)
    expect(b.rounds[0][0]).toMatchObject({ matchId: 'm1', winner: 1 })
    expect(b.rounds[1][0].teamA).toBe(1)
    expect(b.rounds[1][0].teamB).toBeNull()

    b = applyEliminationResult(b, 0, 1, 'm2', 2) // gana el equipo 2 (teamA del cruce 1)
    expect(b.rounds[1][0].teamB).toBe(2)
    expect(isEliminationComplete(b)).toBe(false)

    b = applyEliminationResult(b, 1, 0, 'm3', 2) // la final la gana el equipo 2
    expect(isEliminationComplete(b)).toBe(true)
    expect(getEliminationChampion(b)).toBe(2)
  })

  it('no muta el bracket original (devuelve uno nuevo)', () => {
    const b = buildBracket(4)
    const copy = JSON.parse(JSON.stringify(b))
    applyEliminationResult(b, 0, 0, 'm1', 0)
    expect(b).toEqual(copy)
  })

  it('getEliminationChampion da null hasta que se resuelve la final', () => {
    const b = buildBracket(4)
    expect(getEliminationChampion(b)).toBeNull()
  })
})

describe('buildRoundRobin + standings', () => {
  it('3 equipos: 3 cruces (todos contra todos)', () => {
    const b = buildRoundRobin(3)
    expect(b.fixtures).toEqual([
      { teamA: 0, teamB: 1, matchId: null, winner: null },
      { teamA: 0, teamB: 2, matchId: null, winner: null },
      { teamA: 1, teamB: 2, matchId: null, winner: null },
    ])
  })

  it('computeStandings ordena por victorias, no por orden de carga', () => {
    let b = buildRoundRobin(3)
    b = applyRoundRobinResult(b, 0, 'm1', 1) // 1 le gana a 0
    b = applyRoundRobinResult(b, 1, 'm2', 2) // 2 le gana a 0
    b = applyRoundRobinResult(b, 2, 'm3', 1) // 1 le gana a 2
    const standings = computeStandings(b, 3)
    expect(standings.map((s) => s.teamIndex)).toEqual([1, 2, 0])
    expect(standings[0]).toMatchObject({ teamIndex: 1, played: 2, won: 2, lost: 0 })
  })

  it('getRoundRobinChampion da null hasta que se jugaron todos los cruces', () => {
    let b = buildRoundRobin(3)
    b = applyRoundRobinResult(b, 0, 'm1', 1)
    expect(isRoundRobinComplete(b)).toBe(false)
    expect(getRoundRobinChampion(b, 3)).toBeNull()
  })

  it('getRoundRobinChampion da null si el primer puesto queda empatado', () => {
    let b = buildRoundRobin(3)
    b = applyRoundRobinResult(b, 0, 'm1', 0) // 0 le gana a 1
    b = applyRoundRobinResult(b, 1, 'm2', 2) // 2 le gana a 0
    b = applyRoundRobinResult(b, 2, 'm3', 1) // 1 le gana a 2
    // Los 3 quedan 1-1: empate triple, sin campeón automático.
    expect(isRoundRobinComplete(b)).toBe(true)
    expect(getRoundRobinChampion(b, 3)).toBeNull()
  })

  it('getRoundRobinChampion da el equipo con más victorias cuando no hay empate', () => {
    let b = buildRoundRobin(3)
    b = applyRoundRobinResult(b, 0, 'm1', 0)
    b = applyRoundRobinResult(b, 1, 'm2', 0)
    b = applyRoundRobinResult(b, 2, 'm3', 1)
    expect(getRoundRobinChampion(b, 3)).toBe(0)
  })
})

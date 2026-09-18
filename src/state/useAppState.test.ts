import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useAppState } from './useAppState'
import { TARGET_SCORE } from '../types'

const setup = {
  teamAName: 'Nosotros',
  teamBName: 'Ellos',
  teamAPlayerIds: ['a1', 'a2', 'a3'],
  teamBPlayerIds: ['b1', 'b2', 'b3'],
  teamAPlayerNames: ['Ana', 'Bruno', 'Cami'],
  teamBPlayerNames: ['Dani', 'Emi', 'Fer'],
  pairings: [
    { teamAPlayerId: 'a1', teamAPlayerName: 'Ana', teamBPlayerId: 'b1', teamBPlayerName: 'Dani' },
    { teamAPlayerId: 'a2', teamAPlayerName: 'Bruno', teamBPlayerId: 'b2', teamBPlayerName: 'Emi' },
    { teamAPlayerId: 'a3', teamAPlayerName: 'Cami', teamBPlayerId: 'b3', teamBPlayerName: 'Fer' },
  ],
}

beforeEach(() => {
  localStorage.clear()
  // Nunca deja el fetch colgado sin mock: por default resuelve como si el
  // guardado hubiera funcionado, así los tests que no les importa la
  // sincronización no quedan esperando una promesa que nadie resuelve.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(null, { status: 201 })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useAppState', () => {
  it('startMatch arranca un partido en juego, 0 a 0, mano del equipo A', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))

    expect(result.current.activeMatch).toMatchObject({
      status: 'playing',
      scoreA: 0,
      scoreB: 0,
      manoTeam: 'A',
      teamAName: 'Nosotros',
      teamBName: 'Ellos',
    })
  })

  it('addPoint suma al equipo correcto y no toca al otro', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))
    act(() => result.current.addPoint('A'))
    act(() => result.current.addPoint('A'))
    act(() => result.current.addPoint('B'))

    expect(result.current.activeMatch).toMatchObject({ scoreA: 2, scoreB: 1, status: 'playing' })
  })

  it('el partido termina apenas un equipo llega a TARGET_SCORE', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))
    for (let i = 0; i < TARGET_SCORE; i++) act(() => result.current.addPoint('A'))

    expect(result.current.activeMatch).toMatchObject({ scoreA: TARGET_SCORE, status: 'finished' })
    expect(result.current.activeMatch?.finishedAt).toBeTruthy()
  })

  it('subtractPoint no baja de 0 y no hace nada si el partido no está en juego', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))
    act(() => result.current.subtractPoint('A'))
    expect(result.current.activeMatch?.scoreA).toBe(0)

    for (let i = 0; i < TARGET_SCORE; i++) act(() => result.current.addPoint('A'))
    expect(result.current.activeMatch?.status).toBe('finished')
    act(() => result.current.subtractPoint('A'))
    expect(result.current.activeMatch?.scoreA).toBe(TARGET_SCORE) // no cambia: ya terminó
  })

  it('rematch arma un partido nuevo (id distinto, 0 a 0) e intercambia la mano', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))
    const firstId = result.current.activeMatch?.id
    for (let i = 0; i < TARGET_SCORE; i++) act(() => result.current.addPoint('A'))

    act(() => result.current.rematch())

    expect(result.current.activeMatch?.id).not.toBe(firstId)
    expect(result.current.activeMatch).toMatchObject({
      status: 'playing',
      scoreA: 0,
      scoreB: 0,
      manoTeam: 'B', // era 'A' en el partido anterior
      teamAName: 'Nosotros',
      teamBName: 'Ellos',
    })
  })

  it('clearMatch borra el partido activo', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current.startMatch(setup))
    act(() => result.current.clearMatch())
    expect(result.current.activeMatch).toBeNull()
  })

  describe('pica-pica', () => {
    it('enterPicaPica arma un duelo en 0 a 0 por cada pareja', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      act(() => result.current.enterPicaPica())

      expect(result.current.activeMatch?.inPicaPica).toBe(true)
      expect(result.current.activeMatch?.picaPicaDuels).toEqual([
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 },
      ])
    })

    it('closePicaPica solo le suma al equipo que ganó la diferencia, no al que perdió', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      act(() => result.current.addPoint('A')) // scoreA=1, para no confundir con lo que suma pica-pica
      act(() => result.current.enterPicaPica())

      // Duelo 0: A gana 2-0. Duelo 1: B gana 0-1. Duelo 2: empatan 1-1.
      // sumA=3, sumB=2, diff=+1 para A.
      act(() => result.current.addPicaPicaPoint(0, 'A'))
      act(() => result.current.addPicaPicaPoint(0, 'A'))
      act(() => result.current.addPicaPicaPoint(1, 'B'))
      act(() => result.current.addPicaPicaPoint(2, 'A'))
      act(() => result.current.addPicaPicaPoint(2, 'B'))
      act(() => result.current.closePicaPica())

      expect(result.current.activeMatch).toMatchObject({
        scoreA: 2, // 1 (de antes) + 1 (la diferencia del pica-pica)
        scoreB: 0, // no le suma nada al que perdió la diferencia
        inPicaPica: false,
        picaPicaTotalA: 3,
        picaPicaTotalB: 2,
        picaPicaRounds: 1,
      })
    })

    it('si la diferencia del pica-pica llega a TARGET_SCORE, el partido termina', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      for (let i = 0; i < TARGET_SCORE - 1; i++) act(() => result.current.addPoint('A'))
      act(() => result.current.enterPicaPica())
      act(() => result.current.addPicaPicaPoint(0, 'A'))
      act(() => result.current.closePicaPica())

      expect(result.current.activeMatch).toMatchObject({ scoreA: TARGET_SCORE, status: 'finished' })
    })

    it('subtractPicaPicaPoint no baja de 0', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      act(() => result.current.enterPicaPica())
      act(() => result.current.subtractPicaPicaPoint(0, 'A'))
      expect(result.current.activeMatch?.picaPicaDuels[0]).toEqual({ scoreA: 0, scoreB: 0 })
    })

    it('cancelPicaPica vuelve a la pantalla del marcador sin tocar el resultado', () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      act(() => result.current.enterPicaPica())
      act(() => result.current.addPicaPicaPoint(0, 'A'))
      act(() => result.current.cancelPicaPica())

      expect(result.current.activeMatch).toMatchObject({ inPicaPica: false, picaPicaDuels: [], scoreA: 0, scoreB: 0 })
    })
  })

  describe('isSyncPending', () => {
    it('es true apenas termina el partido (sin parpadeo) y pasa a false cuando el servidor confirma', async () => {
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      for (let i = 0; i < TARGET_SCORE; i++) act(() => result.current.addPoint('A'))

      // El fix es justamente que esto ya sea true en el mismo render en el
      // que el partido pasa a "finished", sin esperar un ciclo extra.
      expect(result.current.isSyncPending).toBe(true)

      await waitFor(() => expect(result.current.isSyncPending).toBe(false))
    })

    it('sigue en true si el guardado falla (offline) hasta que se pueda reintentar', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
      const { result } = renderHook(() => useAppState())
      act(() => result.current.startMatch(setup))
      for (let i = 0; i < TARGET_SCORE; i++) act(() => result.current.addPoint('A'))

      await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
      expect(result.current.isSyncPending).toBe(true)
    })
  })
})

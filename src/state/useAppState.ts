import { useCallback, useEffect, useState } from 'react'
import { makeId } from '../lib/id'
import type { ActiveMatch, AppState, Pairing } from '../types'
import { TARGET_SCORE } from '../types'
import { useSyncQueue } from './useSyncQueue'

const STORAGE_KEY = 'la-mesa-truco-state-v2'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { activeMatch: null }
    const parsed = JSON.parse(raw) as AppState
    return { activeMatch: parsed.activeMatch ?? null }
  } catch {
    return { activeMatch: null }
  }
}

function finishIfNeeded(match: ActiveMatch): ActiveMatch {
  const shouldFinish = match.status === 'playing' && (match.scoreA >= TARGET_SCORE || match.scoreB >= TARGET_SCORE)
  if (!shouldFinish) return match
  return {
    ...match,
    status: 'finished',
    finishedAt: new Date().toISOString(),
    inPicaPica: false,
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())
  const { enqueue, pendingIds } = useSyncQueue()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // En cuanto un partido queda "finished" se manda a la cola de sincronización
  // (funciona con o sin señal: si falla, useSyncQueue lo reintenta solo). El
  // enqueue de acá adentro es idempotente por id, así que no importa si este
  // efecto se dispara de nuevo para el mismo partido ya terminado.
  useEffect(() => {
    const m = state.activeMatch
    if (!m || m.status !== 'finished') return
    const winner = m.scoreA >= TARGET_SCORE ? 'A' : 'B'
    enqueue(m.id, {
      teamAName: m.teamAName,
      teamBName: m.teamBName,
      teamAPlayerIds: m.teamAPlayerIds,
      teamBPlayerIds: m.teamBPlayerIds,
      teamAPlayerNames: m.teamAPlayerNames,
      teamBPlayerNames: m.teamBPlayerNames,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      winner,
      picaPicaPlayed: m.picaPicaRounds > 0,
      picaPicaTotalA: m.picaPicaTotalA,
      picaPicaTotalB: m.picaPicaTotalB,
      picaPicaRounds: m.picaPicaRoundsHistory,
    })
  }, [state.activeMatch, enqueue])

  const isSyncPending = Boolean(
    state.activeMatch && state.activeMatch.status === 'finished' && pendingIds.includes(state.activeMatch.id),
  )

  const startMatch = useCallback(
    (setup: {
      teamAName: string
      teamBName: string
      teamAPlayerIds: string[]
      teamBPlayerIds: string[]
      teamAPlayerNames: string[]
      teamBPlayerNames: string[]
      pairings: Pairing[]
    }) => {
      setState((s) => {
        const match: ActiveMatch = {
          id: makeId(),
          teamAName: setup.teamAName.trim() || 'Equipo A',
          teamBName: setup.teamBName.trim() || 'Equipo B',
          teamAPlayerIds: setup.teamAPlayerIds,
          teamBPlayerIds: setup.teamBPlayerIds,
          teamAPlayerNames: setup.teamAPlayerNames,
          teamBPlayerNames: setup.teamBPlayerNames,
          pairings: setup.pairings,
          scoreA: 0,
          scoreB: 0,
          manoTeam: 'A',
          status: 'playing',
          inPicaPica: false,
          picaPicaDuels: [],
          picaPicaTotalA: 0,
          picaPicaTotalB: 0,
          picaPicaRounds: 0,
          picaPicaRoundsHistory: [],
          startedAt: new Date().toISOString(),
        }
        return { ...s, activeMatch: match }
      })
    },
    [],
  )

  const clearMatch = useCallback(() => {
    setState((s) => ({ ...s, activeMatch: null }))
  }, [])

  const rematch = useCallback(() => {
    setState((s) => {
      const prev = s.activeMatch
      if (!prev) return s
      const match: ActiveMatch = {
        id: makeId(),
        teamAName: prev.teamAName,
        teamBName: prev.teamBName,
        teamAPlayerIds: prev.teamAPlayerIds,
        teamBPlayerIds: prev.teamBPlayerIds,
        teamAPlayerNames: prev.teamAPlayerNames,
        teamBPlayerNames: prev.teamBPlayerNames,
        pairings: prev.pairings,
        scoreA: 0,
        scoreB: 0,
        manoTeam: prev.manoTeam === 'A' ? 'B' : 'A',
        status: 'playing',
        inPicaPica: false,
        picaPicaDuels: [],
        picaPicaTotalA: 0,
        picaPicaTotalB: 0,
        picaPicaRounds: 0,
        picaPicaRoundsHistory: [],
        startedAt: new Date().toISOString(),
      }
      return { ...s, activeMatch: match }
    })
  }, [])

  const addPoint = useCallback((team: 'A' | 'B') => {
    setState((s) => {
      if (!s.activeMatch || s.activeMatch.status !== 'playing') return s
      const m = s.activeMatch
      const updated: ActiveMatch = {
        ...m,
        scoreA: team === 'A' ? m.scoreA + 1 : m.scoreA,
        scoreB: team === 'B' ? m.scoreB + 1 : m.scoreB,
      }
      return { ...s, activeMatch: finishIfNeeded(updated) }
    })
  }, [])

  const subtractPoint = useCallback((team: 'A' | 'B') => {
    setState((s) => {
      if (!s.activeMatch || s.activeMatch.status !== 'playing') return s
      const m = s.activeMatch
      const current = team === 'A' ? m.scoreA : m.scoreB
      if (current <= 0) return s
      const updated: ActiveMatch = {
        ...m,
        scoreA: team === 'A' ? m.scoreA - 1 : m.scoreA,
        scoreB: team === 'B' ? m.scoreB - 1 : m.scoreB,
      }
      return { ...s, activeMatch: updated }
    })
  }, [])

  const enterPicaPica = useCallback(() => {
    setState((s) => {
      if (!s.activeMatch || s.activeMatch.status !== 'playing') return s
      return {
        ...s,
        activeMatch: {
          ...s.activeMatch,
          inPicaPica: true,
          picaPicaDuels: s.activeMatch.pairings.map(() => ({ scoreA: 0, scoreB: 0 })),
        },
      }
    })
  }, [])

  const cancelPicaPica = useCallback(() => {
    setState((s) => {
      if (!s.activeMatch || !s.activeMatch.inPicaPica) return s
      return { ...s, activeMatch: { ...s.activeMatch, inPicaPica: false, picaPicaDuels: [] } }
    })
  }, [])

  const addPicaPicaPoint = useCallback((duelIndex: number, team: 'A' | 'B') => {
    setState((s) => {
      if (!s.activeMatch || !s.activeMatch.inPicaPica) return s
      const m = s.activeMatch
      const duels = m.picaPicaDuels.map((d, i) =>
        i === duelIndex
          ? { scoreA: team === 'A' ? d.scoreA + 1 : d.scoreA, scoreB: team === 'B' ? d.scoreB + 1 : d.scoreB }
          : d,
      )
      return { ...s, activeMatch: { ...m, picaPicaDuels: duels } }
    })
  }, [])

  const subtractPicaPicaPoint = useCallback((duelIndex: number, team: 'A' | 'B') => {
    setState((s) => {
      if (!s.activeMatch || !s.activeMatch.inPicaPica) return s
      const m = s.activeMatch
      const duel = m.picaPicaDuels[duelIndex]
      const current = team === 'A' ? duel.scoreA : duel.scoreB
      if (current <= 0) return s
      const duels = m.picaPicaDuels.map((d, i) =>
        i === duelIndex
          ? { scoreA: team === 'A' ? d.scoreA - 1 : d.scoreA, scoreB: team === 'B' ? d.scoreB - 1 : d.scoreB }
          : d,
      )
      return { ...s, activeMatch: { ...m, picaPicaDuels: duels } }
    })
  }, [])

  const closePicaPica = useCallback(() => {
    setState((s) => {
      if (!s.activeMatch || !s.activeMatch.inPicaPica) return s
      const m = s.activeMatch
      const sumA = m.picaPicaDuels.reduce((acc, d) => acc + d.scoreA, 0)
      const sumB = m.picaPicaDuels.reduce((acc, d) => acc + d.scoreB, 0)
      const diff = sumA - sumB
      const roundResult = {
        duels: m.pairings.map((p, i) => ({
          aName: p.teamAPlayerName,
          bName: p.teamBPlayerName,
          scoreA: m.picaPicaDuels[i]?.scoreA ?? 0,
          scoreB: m.picaPicaDuels[i]?.scoreB ?? 0,
        })),
      }
      const updated: ActiveMatch = {
        ...m,
        scoreA: m.scoreA + (diff > 0 ? diff : 0),
        scoreB: m.scoreB + (diff < 0 ? -diff : 0),
        inPicaPica: false,
        picaPicaDuels: [],
        picaPicaTotalA: m.picaPicaTotalA + sumA,
        picaPicaTotalB: m.picaPicaTotalB + sumB,
        picaPicaRounds: m.picaPicaRounds + 1,
        picaPicaRoundsHistory: [...m.picaPicaRoundsHistory, roundResult],
      }
      return { ...s, activeMatch: finishIfNeeded(updated) }
    })
  }, [])

  return {
    activeMatch: state.activeMatch,
    isSyncPending,
    startMatch,
    clearMatch,
    rematch,
    addPoint,
    subtractPoint,
    enterPicaPica,
    cancelPicaPica,
    addPicaPicaPoint,
    subtractPicaPicaPoint,
    closePicaPica,
  }
}

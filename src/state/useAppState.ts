import { useCallback, useEffect, useState } from 'react'
import { makeId } from '../lib/id'
import type { ActiveMatch, AppState, Pairing } from '../types'
import { TARGET_SCORE } from '../types'

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
    serverSynced: false,
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Sync a freshly-finished match to the server exactly once.
  useEffect(() => {
    const m = state.activeMatch
    if (!m || m.status !== 'finished' || m.serverSynced) return
    const winner = m.scoreA >= TARGET_SCORE ? 'A' : 'B'
    let cancelled = false
    fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      }),
    })
      .then((res) => {
        if (!res.ok || cancelled) return
        setState((s) =>
          s.activeMatch && s.activeMatch.id === m.id ? { ...s, activeMatch: { ...s.activeMatch, serverSynced: true } } : s,
        )
      })
      .catch(() => {
        // Se reintenta solo: el flag serverSynced sigue en false hasta que ande la conexión.
      })
    return () => {
      cancelled = true
    }
  }, [state.activeMatch])

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
          history: [],
          inPicaPica: false,
          picaPicaDuels: [],
          picaPicaHistory: [],
          picaPicaTotalA: 0,
          picaPicaTotalB: 0,
          picaPicaRounds: 0,
          startedAt: new Date().toISOString(),
          serverSynced: false,
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
        history: [],
        inPicaPica: false,
        picaPicaDuels: [],
        picaPicaHistory: [],
        picaPicaTotalA: 0,
        picaPicaTotalB: 0,
        picaPicaRounds: 0,
        startedAt: new Date().toISOString(),
        serverSynced: false,
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
        history: [...m.history, { team }],
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

  const undoPoint = useCallback(() => {
    setState((s) => {
      const m = s.activeMatch
      if (!m) return s
      if (m.status === 'playing') {
        const last = m.history[m.history.length - 1]
        if (!last) return s
        const updated: ActiveMatch = {
          ...m,
          scoreA: last.team === 'A' ? m.scoreA - 1 : m.scoreA,
          scoreB: last.team === 'B' ? m.scoreB - 1 : m.scoreB,
          history: m.history.slice(0, -1),
        }
        return { ...s, activeMatch: updated }
      }
      if (m.status === 'finished' && !m.serverSynced) {
        const last = m.history[m.history.length - 1]
        if (!last) return s
        const revertedScoreA = last.team === 'A' ? m.scoreA - 1 : m.scoreA
        const revertedScoreB = last.team === 'B' ? m.scoreB - 1 : m.scoreB
        const stillFinished = revertedScoreA >= TARGET_SCORE || revertedScoreB >= TARGET_SCORE
        const updated: ActiveMatch = {
          ...m,
          scoreA: revertedScoreA,
          scoreB: revertedScoreB,
          history: m.history.slice(0, -1),
          status: stillFinished ? 'finished' : 'playing',
          finishedAt: stillFinished ? m.finishedAt : undefined,
        }
        return { ...s, activeMatch: updated }
      }
      return s
    })
  }, [])

  const passMano = useCallback(() => {
    setState((s) => {
      if (!s.activeMatch) return s
      return {
        ...s,
        activeMatch: { ...s.activeMatch, manoTeam: s.activeMatch.manoTeam === 'A' ? 'B' : 'A' },
      }
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
          picaPicaDuels: [
            { scoreA: 0, scoreB: 0 },
            { scoreA: 0, scoreB: 0 },
            { scoreA: 0, scoreB: 0 },
          ],
          picaPicaHistory: [],
        },
      }
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
      return {
        ...s,
        activeMatch: {
          ...m,
          picaPicaDuels: duels,
          picaPicaHistory: [...m.picaPicaHistory, { duelIndex, team }],
        },
      }
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

  const undoPicaPicaPoint = useCallback(() => {
    setState((s) => {
      const m = s.activeMatch
      if (!m || !m.inPicaPica) return s
      const last = m.picaPicaHistory[m.picaPicaHistory.length - 1]
      if (!last) return s
      const duels = m.picaPicaDuels.map((d, i) =>
        i === last.duelIndex
          ? {
              scoreA: last.team === 'A' ? d.scoreA - 1 : d.scoreA,
              scoreB: last.team === 'B' ? d.scoreB - 1 : d.scoreB,
            }
          : d,
      )
      return {
        ...s,
        activeMatch: {
          ...m,
          picaPicaDuels: duels,
          picaPicaHistory: m.picaPicaHistory.slice(0, -1),
        },
      }
    })
  }, [])

  const closePicaPica = useCallback(() => {
    setState((s) => {
      if (!s.activeMatch || !s.activeMatch.inPicaPica) return s
      const m = s.activeMatch
      const sumA = m.picaPicaDuels.reduce((acc, d) => acc + d.scoreA, 0)
      const sumB = m.picaPicaDuels.reduce((acc, d) => acc + d.scoreB, 0)
      const diff = sumA - sumB
      const updated: ActiveMatch = {
        ...m,
        scoreA: m.scoreA + (diff > 0 ? diff : 0),
        scoreB: m.scoreB + (diff < 0 ? -diff : 0),
        inPicaPica: false,
        picaPicaDuels: [],
        picaPicaHistory: [],
        picaPicaTotalA: m.picaPicaTotalA + sumA,
        picaPicaTotalB: m.picaPicaTotalB + sumB,
        picaPicaRounds: m.picaPicaRounds + 1,
      }
      return { ...s, activeMatch: finishIfNeeded(updated) }
    })
  }, [])

  return {
    activeMatch: state.activeMatch,
    startMatch,
    clearMatch,
    rematch,
    addPoint,
    subtractPoint,
    undoPoint,
    passMano,
    enterPicaPica,
    addPicaPicaPoint,
    subtractPicaPicaPoint,
    undoPicaPicaPoint,
    closePicaPica,
  }
}

import { useEffect, useMemo, useState } from 'react'
import type { User } from '../types'
import { BackIcon, FlameIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'

interface LeaderboardEntry {
  id: string
  name: string
  played: number
  won: number
  streak: number
}

const MEDALS = ['🥇', '🥈', '🥉']

type SortMode = 'performance' | 'wins' | 'active' | 'streak'

const SORT_LABEL: Record<SortMode, string> = {
  performance: 'Rendimiento',
  wins: 'Más victorias',
  active: 'Más activo',
  streak: 'Mejor racha',
}

// Desempate siempre igual (más partidos, después nombre) para que el orden
// no "salte" sin sentido entre jugadores empatados en el criterio principal.
function sortRows(rows: LeaderboardEntry[], mode: SortMode): LeaderboardEntry[] {
  const byTiebreak = (a: LeaderboardEntry, b: LeaderboardEntry) => b.played - a.played || a.name.localeCompare(b.name)
  const sorted = [...rows]
  if (mode === 'wins') {
    sorted.sort((a, b) => b.won - a.won || byTiebreak(a, b))
  } else if (mode === 'active') {
    sorted.sort((a, b) => b.played - a.played || b.won - a.won || a.name.localeCompare(b.name))
  } else if (mode === 'streak') {
    sorted.sort((a, b) => b.streak - a.streak || byTiebreak(a, b))
  } else {
    sorted.sort((a, b) => b.won / b.played - a.won / a.played || byTiebreak(a, b))
  }
  return sorted
}

export function RankingScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  useScrollToTop()
  const [sortMode, setSortMode] = useState<SortMode>('performance')
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setRows(null)
    setError(false)
    fetch('/api/leaderboard')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<LeaderboardEntry[]>
      })
      .then(setRows)
      .catch(() => setError(true))
  }, [])

  const sortedRows = useMemo(() => (rows ? sortRows(rows, sortMode) : null), [rows, sortMode])
  const myIndex = sortedRows?.findIndex((r) => r.id === currentUser.id) ?? -1

  const goToMyRow = () => {
    document.getElementById(`rank-row-${currentUser.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Ranking general
        </h2>
        <span className="w-5" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSortMode(m)}
            className="py-2 rounded-lg font-bold text-sm border"
            style={{
              borderColor: sortMode === m ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: sortMode === m ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            {SORT_LABEL[m]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
          No se pudo cargar el ranking.
        </p>
      )}
      {!error && sortedRows === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {!error && sortedRows !== null && sortedRows.length === 0 && (
        <p className="text-sm opacity-60 text-center py-4">Todavía no hay partidos jugados.</p>
      )}

      {myIndex !== -1 && sortedRows && (
        <button
          type="button"
          onClick={goToMyRow}
          className="w-full rounded-xl border px-4 py-2.5 flex items-center justify-between"
          style={{ borderColor: 'var(--color-ember-600)', backgroundColor: 'rgba(203, 170, 106, 0.08)' }}
        >
          <span className="text-sm font-bold" style={{ color: 'var(--color-paper-50)' }}>
            Tu posición: #{myIndex + 1}
          </span>
          <span className="font-num text-sm font-bold" style={{ color: 'var(--color-ember-500)' }}>
            {Math.round((sortedRows[myIndex].won / sortedRows[myIndex].played) * 100)}%
          </span>
        </button>
      )}

      {!error && sortedRows !== null && sortedRows.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {sortedRows.map((r, i) => {
            const pct = Math.round((r.won / r.played) * 100)
            const isMe = r.id === currentUser.id
            const highlight =
              sortMode === 'wins'
                ? String(r.won)
                : sortMode === 'active'
                  ? String(r.played)
                  : sortMode === 'streak'
                    ? r.streak > 0
                      ? (
                          <span className="inline-flex items-center gap-1 justify-end">
                            {r.streak}
                            <FlameIcon className="w-3.5 h-3.5" />
                          </span>
                        )
                      : '0'
                    : `${pct}%`
            return (
              <div key={r.id} id={`rank-row-${r.id}`} className="flex items-center gap-3 py-3">
                <span className="text-sm w-6 text-center shrink-0 opacity-70">{MEDALS[i] ?? i + 1}</span>
                <span
                  className="flex-1 truncate font-bold"
                  style={{ color: isMe ? 'var(--color-ember-500)' : 'var(--color-paper-100)' }}
                >
                  {r.name}
                  {isMe && ' (vos)'}
                </span>
                <span className="font-num text-xs opacity-60 shrink-0">
                  {r.won}V - {r.played - r.won}D
                </span>
                <span
                  className="font-num text-sm font-bold w-14 text-right shrink-0"
                  style={{ color: 'var(--color-ember-500)' }}
                >
                  {highlight}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

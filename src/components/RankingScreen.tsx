import { useEffect, useState } from 'react'
import type { User } from '../types'
import { BackIcon } from './icons'

interface LeaderboardEntry {
  id: string
  name: string
  played: number
  won: number
}

const MEDALS = ['🥇', '🥈', '🥉']

export function RankingScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<LeaderboardEntry[]>
      })
      .then(setRows)
      .catch(() => setError(true))
  }, [])

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

      {error && (
        <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
          No se pudo cargar el ranking.
        </p>
      )}
      {!error && rows === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {!error && rows !== null && rows.length === 0 && (
        <p className="text-sm opacity-60 text-center py-4">Todavía no hay partidos jugados.</p>
      )}
      {!error && rows !== null && rows.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {rows.map((r, i) => {
            const pct = Math.round((r.won / r.played) * 100)
            const isMe = r.id === currentUser.id
            return (
              <div key={r.id} className="flex items-center gap-3 py-3">
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
                  className="font-num text-sm font-bold w-12 text-right shrink-0"
                  style={{ color: 'var(--color-ember-500)' }}
                >
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

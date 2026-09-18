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

type Period = 'all' | 'year' | 'month'

const PERIOD_LABEL: Record<Period, string> = { all: 'Todo', year: 'Este año', month: 'Este mes' }

function sinceFor(period: Period): string | null {
  const now = new Date()
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).toISOString()
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  return null
}

export function RankingScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [period, setPeriod] = useState<Period>('all')
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setRows(null)
    setError(false)
    const since = sinceFor(period)
    const query = since ? `?since=${encodeURIComponent(since)}` : ''
    fetch(`/api/leaderboard${query}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<LeaderboardEntry[]>
      })
      .then(setRows)
      .catch(() => setError(true))
  }, [period])

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

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className="py-2 rounded-lg font-bold text-sm border"
            style={{
              borderColor: period === p ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: period === p ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
          No se pudo cargar el ranking.
        </p>
      )}
      {!error && rows === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {!error && rows !== null && rows.length === 0 && (
        <p className="text-sm opacity-60 text-center py-4">Todavía no hay partidos jugados{period !== 'all' ? ' en este período' : ''}.</p>
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

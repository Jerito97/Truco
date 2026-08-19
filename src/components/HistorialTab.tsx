import { useEffect, useState } from 'react'
import type { FinishedMatch, User } from '../types'

function formatDate(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function HistorialTab({ user, refreshKey }: { user: User; refreshKey: number }) {
  const [matches, setMatches] = useState<FinishedMatch[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMatches(null)
    setError(false)
    fetch(`/api/matches?userId=${encodeURIComponent(user.id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<FinishedMatch[]>
      })
      .then((rows) => {
        if (!cancelled) setMatches(rows)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [user.id, refreshKey])

  if (error) {
    return (
      <div className="paper-card rounded-2xl p-6 text-center">
        <p className="font-poster text-xl mb-2">No se pudo cargar el historial</p>
        <p className="opacity-70">Revisá la conexión e intentá de nuevo más tarde.</p>
      </div>
    )
  }

  if (matches === null) {
    return (
      <div className="paper-card rounded-2xl p-6 text-center opacity-70">
        Cargando...
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="paper-card rounded-2xl p-6 text-center">
        <p className="font-poster text-xl mb-2">Todavía no hay partidos jugados</p>
        <p className="opacity-70">Cuando termine un partido tuyo, va a aparecer acá.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const aWins = m.winner === 'A'
        return (
          <div key={m.id} className="paper-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest opacity-60">{formatDate(m.played_at)}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className={`text-right ${aWins ? 'font-bold' : ''}`}>
                <div className="font-poster truncate">{m.team_a_name}</div>
                <div className="text-xs opacity-60 truncate">{m.team_a_player_names.join(', ')}</div>
              </div>
              <div
                className="font-num text-2xl font-bold px-2 whitespace-nowrap"
                style={{ color: 'var(--color-ember-600)' }}
              >
                {m.score_a} – {m.score_b}
              </div>
              <div className={`${m.winner === 'B' ? 'font-bold' : ''}`}>
                <div className="font-poster truncate">{m.team_b_name}</div>
                <div className="text-xs opacity-60 truncate">{m.team_b_player_names.join(', ')}</div>
              </div>
            </div>
            {m.pica_pica_played && (
              <div
                className="text-center font-num text-sm opacity-70 mt-2 pt-2 border-t"
                style={{ borderColor: 'var(--color-wood-300)' }}
              >
                Pica-pica: {m.pica_pica_total_a} a {m.pica_pica_total_b}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

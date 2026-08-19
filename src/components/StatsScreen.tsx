import type { FinishedMatch, User } from '../types'
import { BackIcon } from './icons'

interface OpponentStat {
  name: string
  played: number
  won: number
}

function computeOpponentStats(matches: FinishedMatch[], userId: string): OpponentStat[] {
  const map = new Map<string, OpponentStat>()
  for (const m of matches) {
    const onA = m.team_a_player_ids.includes(userId)
    const onB = m.team_b_player_ids.includes(userId)
    if (!onA && !onB) continue
    const iWon = (onA && m.winner === 'A') || (onB && m.winner === 'B')
    const opponentIds = onA ? m.team_b_player_ids : m.team_a_player_ids
    const opponentNames = onA ? m.team_b_player_names : m.team_a_player_names
    opponentIds.forEach((oid, i) => {
      if (oid === userId) return
      const entry = map.get(oid) ?? { name: opponentNames[i] ?? '?', played: 0, won: 0 }
      entry.name = opponentNames[i] ?? entry.name
      entry.played += 1
      if (iWon) entry.won += 1
      map.set(oid, entry)
    })
  }
  return Array.from(map.values()).sort((a, b) => b.played - a.played)
}

export function StatsScreen({
  user,
  matches,
  onBack,
}: {
  user: User
  matches: FinishedMatch[] | null
  onBack: () => void
}) {
  const opponents = matches ? computeOpponentStats(matches, user.id) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Estadísticas
        </h2>
        <span className="w-5" />
      </div>

      <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
        Contra cada jugador
      </h3>

      {opponents === null && <p className="text-center opacity-60 py-6">Cargando...</p>}

      {opponents !== null && opponents.length === 0 && (
        <p className="text-sm opacity-60 py-4">Todavía no jugaste contra nadie registrado.</p>
      )}

      {opponents !== null && opponents.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {opponents.map((o) => {
            const lost = o.played - o.won
            const pct = Math.round((o.won / o.played) * 100)
            return (
              <div key={o.name} className="flex items-center justify-between py-3">
                <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
                  {o.name}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-num text-sm opacity-70">
                    {o.won}V - {lost}D
                  </span>
                  <span
                    className="font-num text-sm font-bold w-11 text-right"
                    style={{ color: 'var(--color-ember-500)' }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

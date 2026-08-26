import type { FinishedMatch, User } from '../types'
import { BackIcon } from './icons'

interface PairStat {
  name: string
  played: number
  won: number
}

// Mismo recorrido para ambas relaciones: 'teammate' se queda en el lado del
// usuario, 'opponent' se va al lado contrario. iWon siempre se calcula desde
// la perspectiva del usuario (no del lado que terminamos mirando).
function computePairStats(matches: FinishedMatch[], userId: string, relation: 'teammate' | 'opponent'): PairStat[] {
  const map = new Map<string, PairStat>()
  for (const m of matches) {
    const onA = m.team_a_player_ids.includes(userId)
    const onB = m.team_b_player_ids.includes(userId)
    if (!onA && !onB) continue
    const iWon = (onA && m.winner === 'A') || (onB && m.winner === 'B')
    const sameSide = onA ? 'A' : 'B'
    const side = relation === 'teammate' ? sameSide : sameSide === 'A' ? 'B' : 'A'
    const ids = side === 'A' ? m.team_a_player_ids : m.team_b_player_ids
    const names = side === 'A' ? m.team_a_player_names : m.team_b_player_names
    ids.forEach((id, i) => {
      if (id === userId) return
      const entry = map.get(id) ?? { name: names[i] ?? '?', played: 0, won: 0 }
      entry.name = names[i] ?? entry.name
      entry.played += 1
      if (iWon) entry.won += 1
      map.set(id, entry)
    })
  }
  return Array.from(map.values()).sort((a, b) => b.played - a.played)
}

function PairStatsList({ stats, emptyText }: { stats: PairStat[] | null; emptyText: string }) {
  if (stats === null) return <p className="text-center opacity-60 py-6">Cargando...</p>
  if (stats.length === 0) return <p className="text-sm opacity-60 py-4">{emptyText}</p>
  return (
    <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
      {stats.map((o) => {
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
              <span className="font-num text-sm font-bold w-11 text-right" style={{ color: 'var(--color-ember-500)' }}>
                {pct}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
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
  const teammates = matches ? computePairStats(matches, user.id, 'teammate') : null
  const opponents = matches ? computePairStats(matches, user.id, 'opponent') : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Estadísticas
        </h2>
        <span className="w-5" />
      </div>

      <div className="space-y-3">
        <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
          Con cada compañero
        </h3>
        <PairStatsList stats={teammates} emptyText="Todavía no jugaste en equipo con nadie registrado." />
      </div>

      <div className="space-y-3">
        <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
          Contra cada jugador
        </h3>
        <PairStatsList stats={opponents} emptyText="Todavía no jugaste contra nadie registrado." />
      </div>
    </div>
  )
}

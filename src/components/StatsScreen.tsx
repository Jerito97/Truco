import { useState } from 'react'
import type { FinishedMatch, User } from '../types'
import { useScrollToTop } from '../state/useScrollToTop'
import { ScreenHeader } from './ScreenHeader'

export interface PairStat {
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
  return Array.from(map.values())
}

type SectionMode = 'companeros' | 'rivales'

const SECTION_LABEL: Record<SectionMode, string> = {
  companeros: 'Compañeros',
  rivales: 'Rivales',
}

export type SortMode = 'jugados' | 'rendimiento' | 'victorias'

const SORT_LABEL: Record<SortMode, string> = {
  jugados: 'Más jugados',
  rendimiento: 'Mejor rendimiento',
  victorias: 'Más victorias',
}

// Mismo desempate siempre (más partidos, después nombre), para que el orden
// no "salte" sin sentido entre dos empatados en el criterio principal — igual
// que en el Ranking general.
export function sortPairStats(stats: PairStat[], mode: SortMode): PairStat[] {
  const byTiebreak = (a: PairStat, b: PairStat) => b.played - a.played || a.name.localeCompare(b.name)
  const sorted = [...stats]
  if (mode === 'victorias') {
    sorted.sort((a, b) => b.won - a.won || byTiebreak(a, b))
  } else if (mode === 'rendimiento') {
    sorted.sort((a, b) => b.won / b.played - a.won / a.played || byTiebreak(a, b))
  } else {
    sorted.sort(byTiebreak)
  }
  return sorted
}

function PairStatsList({ stats, mode, emptyText }: { stats: PairStat[] | null; mode: SortMode; emptyText: string }) {
  if (stats === null) return <p className="text-center opacity-60 py-6">Cargando...</p>
  if (stats.length === 0) return <p className="text-sm opacity-60 py-4 text-center">{emptyText}</p>

  const sorted = sortPairStats(stats, mode)

  return (
    <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
      {sorted.map((o) => {
        const lost = o.played - o.won
        const pct = Math.round((o.won / o.played) * 100)
        const highlight = mode === 'victorias' ? String(o.won) : mode === 'jugados' ? String(o.played) : `${pct}%`
        return (
          <div key={o.name} className="flex items-center justify-between py-3">
            <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
              {o.name}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-num text-sm opacity-70">
                {o.won}V - {lost}D
              </span>
              <span className="font-num text-sm font-bold w-12 text-right" style={{ color: 'var(--color-ember-500)' }}>
                {highlight}
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
  useScrollToTop()
  const [section, setSection] = useState<SectionMode>('companeros')
  const [sortMode, setSortMode] = useState<SortMode>('jugados')
  const teammates = matches ? computePairStats(matches, user.id, 'teammate') : null
  const opponents = matches ? computePairStats(matches, user.id, 'opponent') : null

  return (
    <div className="screen-fill flex flex-col gap-6">
      <ScreenHeader title="Estadísticas" onBack={onBack} />

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(SECTION_LABEL) as SectionMode[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className="py-2.5 rounded-lg font-bold text-sm border"
            style={{
              borderColor: section === s ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: section === s ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSortMode(m)}
            className="py-2 rounded-lg font-bold text-xs border"
            style={{
              borderColor: sortMode === m ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: sortMode === m ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            {SORT_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0 gap-3">
        <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
          {section === 'companeros' ? 'Con cada compañero' : 'Contra cada jugador'}
        </h3>
        {/* "safe center" para que el texto de vacío/cargando quede centrado
            en el espacio que sobra, sin cortar la lista de arriba cuando hay
            muchos jugadores y ya no entra en una pantalla. */}
        <div className="flex-1 flex flex-col min-h-0" style={{ justifyContent: 'safe center' }}>
          {section === 'companeros' ? (
            <PairStatsList
              stats={teammates}
              mode={sortMode}
              emptyText="Todavía no jugaste en equipo con nadie registrado."
            />
          ) : (
            <PairStatsList stats={opponents} mode={sortMode} emptyText="Todavía no jugaste contra nadie registrado." />
          )}
        </div>
      </div>
    </div>
  )
}

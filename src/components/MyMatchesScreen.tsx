import { useState } from 'react'
import type { FinishedMatch, User } from '../types'
import { useMatches } from '../state/useMatches'
import { groupMatchesByDay } from '../lib/groupMatchesByDay'
import { MatchRow } from './MatchRow'
import { MatchDetailScreen } from './MatchDetailScreen'
import { BackIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'

// Lo mismo que el Historial, pero ya filtrado a los partidos propios: para
// no tener que ir a Historial y buscarse a uno mismo solo para repasar sus
// propios partidos.
export function MyMatchesScreen({ user, onBack }: { user: User; onBack: () => void }) {
  useScrollToTop()
  const [viewingMatch, setViewingMatch] = useState<FinishedMatch | null>(null)
  const { matches, error } = useMatches(user.id, 0, 'mine')

  if (viewingMatch) {
    return <MatchDetailScreen match={viewingMatch} onBack={() => setViewingMatch(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Mis partidos
        </h2>
        <span className="w-5" />
      </div>

      {error && (
        <div className="text-center py-10 opacity-70">
          <p className="font-poster text-lg mb-1">No se pudieron cargar tus partidos</p>
          <p className="text-sm">Revisá la conexión e intentá de nuevo más tarde.</p>
        </div>
      )}

      {!error && matches === null && <div className="text-center py-10 opacity-60">Cargando...</div>}

      {!error && matches !== null && matches.length === 0 && (
        <div className="text-center py-10 opacity-70">
          <p className="font-poster text-lg mb-1">Todavía no jugaste ningún partido</p>
        </div>
      )}

      {!error && matches !== null && matches.length > 0 && (
        <div className="space-y-5">
          {groupMatchesByDay(matches).map((group) => (
            <div key={group.matches[0].id} className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide opacity-50 pl-1">{group.label}</p>
              {group.matches.map((m) => (
                <MatchRow key={m.id} match={m} onSelect={setViewingMatch} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

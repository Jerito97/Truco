import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { MatchRow } from './MatchRow'

export function HistorialTab({ user, refreshKey }: { user: User; refreshKey: number }) {
  const { matches, error } = useMatches(user.id, refreshKey)

  return (
    <div className="space-y-4">
      <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
        Historial
      </h2>

      {error && (
        <div className="text-center py-10 opacity-70">
          <p className="font-poster text-lg mb-1">No se pudo cargar el historial</p>
          <p className="text-sm">Revisá la conexión e intentá de nuevo más tarde.</p>
        </div>
      )}

      {!error && matches === null && <div className="text-center py-10 opacity-60">Cargando...</div>}

      {!error && matches !== null && matches.length === 0 && (
        <div className="text-center py-10 opacity-70">
          <p className="font-poster text-lg mb-1">Todavía no hay partidos jugados</p>
          <p className="text-sm">Cuando termine un partido tuyo, va a aparecer acá.</p>
        </div>
      )}

      {!error && matches !== null && matches.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  )
}

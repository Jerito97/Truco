import type { Tournament } from '../types'
import { useTournaments } from '../state/useTournaments'
import { BackIcon, ChevronRightIcon, PlusIcon, TrophyIcon } from './icons'
import { formatDate } from '../lib/formatDate'
import { useScrollToTop } from '../state/useScrollToTop'

function TournamentRow({ tournament, onSelect }: { tournament: Tournament; onSelect: (t: Tournament) => void }) {
  const subtitle =
    tournament.status === 'en_curso'
      ? 'En curso'
      : tournament.champion_team_index != null
        ? `Campeón: ${tournament.teams[tournament.champion_team_index]?.name}`
        : 'Terminado'

  return (
    <button
      type="button"
      onClick={() => onSelect(tournament)}
      className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}
    >
      <TrophyIcon
        className="w-6 h-6 shrink-0"
        style={{ color: tournament.status === 'en_curso' ? 'var(--color-ember-500)' : 'var(--color-paper-100)', opacity: tournament.status === 'en_curso' ? 1 : 0.5 }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" style={{ color: 'var(--color-paper-50)' }}>
          {tournament.name}
        </p>
        <p className="text-xs opacity-60 truncate">
          {subtitle} · {formatDate(tournament.created_at)}
        </p>
      </div>
      <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
    </button>
  )
}

export function TournamentsListScreen({
  onBack,
  onCreateNew,
  onOpen,
}: {
  onBack: () => void
  onCreateNew: () => void
  onOpen: (tournament: Tournament) => void
}) {
  useScrollToTop()
  const { tournaments, error } = useTournaments(0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Torneos
        </h2>
        <span className="w-5" />
      </div>

      <button
        type="button"
        onClick={onCreateNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-poster text-lg tracking-wide border"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        <PlusIcon className="w-5 h-5" />
        Nuevo torneo
      </button>

      {error && (
        <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
          No se pudieron cargar los torneos.
        </p>
      )}
      {!error && tournaments === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {!error && tournaments !== null && tournaments.length === 0 && (
        <p className="text-sm opacity-60 text-center py-4">Todavía no se armó ningún torneo.</p>
      )}

      {!error && tournaments !== null && tournaments.length > 0 && (
        <div className="space-y-2.5">
          {tournaments.map((t) => (
            <TournamentRow key={t.id} tournament={t} onSelect={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

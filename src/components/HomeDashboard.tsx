import type { ActiveMatch, User } from '../types'
import { useMatches } from '../state/useMatches'
import { MatchRow } from './MatchRow'
import { CardsIcon, ChevronRightIcon, MenuIcon, PeopleIcon } from './icons'

export function HomeDashboard({
  user,
  activeMatch,
  refreshKey,
  onNewMatch,
  onResumeMatch,
  onSeeHistorial,
}: {
  user: User
  activeMatch: ActiveMatch | null
  refreshKey: number
  onNewMatch: () => void
  onResumeMatch: () => void
  onSeeHistorial: () => void
}) {
  const { matches } = useMatches(user.id, refreshKey)
  const recent = (matches ?? []).slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <MenuIcon className="w-5 h-5 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Inicio
        </h2>
        <button type="button" onClick={onNewMatch} aria-label="Nuevo partido">
          <CardsIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />
        </button>
      </div>

      <button
        type="button"
        onClick={activeMatch ? onResumeMatch : onNewMatch}
        className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left border"
        style={{ borderColor: 'rgba(203, 170, 106, 0.35)', backgroundColor: 'rgba(203, 170, 106, 0.05)' }}
      >
        <PeopleIcon className="w-7 h-7 shrink-0" style={{ color: 'var(--color-ember-500)' }} />
        <div className="flex-1 min-w-0">
          <p className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
            {activeMatch ? 'Partido en curso' : 'Nuevo partido'}
          </p>
          <p className="text-sm opacity-60 truncate">
            {activeMatch
              ? `${activeMatch.teamAName} ${activeMatch.scoreA} – ${activeMatch.scoreB} ${activeMatch.teamBName}`
              : 'Crear un nuevo partido y empezar a jugar.'}
          </p>
        </div>
        <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
      </button>

      <div>
        <h3 className="font-poster text-lg mb-2" style={{ color: 'var(--color-ember-500)' }}>
          Partidos recientes
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm opacity-60">Todavía no jugaste ningún partido.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
            {recent.map((m) => (
              <button key={m.id} type="button" onClick={onSeeHistorial} className="w-full text-left">
                <MatchRow match={m} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

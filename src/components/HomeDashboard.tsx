import type { ActiveMatch } from '../types'
import { CardsIcon, ChevronRightIcon, PeopleIcon } from './icons'

export function HomeDashboard({
  activeMatch,
  onNewMatch,
  onResumeMatch,
}: {
  activeMatch: ActiveMatch | null
  onNewMatch: () => void
  onResumeMatch: () => void
}) {
  return (
    <div className="space-y-8 pt-6">
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center border"
          style={{ borderColor: 'var(--color-ember-600)' }}
        >
          <CardsIcon className="w-7 h-7" style={{ color: 'var(--color-ember-500)' }} />
        </div>
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
    </div>
  )
}

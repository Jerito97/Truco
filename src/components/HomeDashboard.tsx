import type { ActiveMatch } from '../types'
import { ChevronRightIcon, PeopleIcon, PlusIcon } from './icons'

export function HomeDashboard({
  activeMatch,
  onNewMatch,
  onResumeMatch,
  onDiscardAndNew,
}: {
  activeMatch: ActiveMatch | null
  onNewMatch: () => void
  onResumeMatch: () => void
  onDiscardAndNew?: () => void
}) {
  const handleDiscardAndNew = () => {
    if (window.confirm('¿Seguro que querés empezar un partido nuevo? El partido en curso se va a eliminar.')) {
      onDiscardAndNew?.()
    }
  }

  return (
    // Espaciadores 4/3/3 en vez de centrar todo junto: así el logo queda un
    // poco arriba del centro y los botones un poco más abajo, como se pidió.
    <div className="screen-fill-no-header flex flex-col items-center">
      <div className="flex-[4]" />
      <img src="/wordmark.webp" alt="Osobuco" className="w-80" />
      <div className="flex-[3]" />
      <div className="w-full space-y-3">
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

        {activeMatch && (
          <button
            type="button"
            onClick={handleDiscardAndNew}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left border"
            style={{ borderColor: 'var(--color-wood-600)' }}
          >
            <PlusIcon className="w-7 h-7 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
            <div className="flex-1 min-w-0">
              <p className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
                Nuevo partido
              </p>
              <p className="text-sm opacity-60 truncate">Empezar de cero (borra el partido en curso).</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
          </button>
        )}
      </div>
      <div className="flex-[3]" />
    </div>
  )
}

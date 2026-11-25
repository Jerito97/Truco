import { useState } from 'react'
import type { ActiveMatch } from '../types'
import { ChevronRightIcon, PeopleIcon, PlusIcon, TrophyIcon } from './icons'
import { ConfirmDialog } from './Dialog'
import { useLiveMatches } from '../state/useLiveMatches'

export function HomeDashboard({
  activeMatch,
  onNewMatch,
  onResumeMatch,
  onDiscardAndNew,
  onOpenTournaments,
}: {
  activeMatch: ActiveMatch | null
  onNewMatch: () => void
  onResumeMatch: () => void
  onDiscardAndNew?: () => void
  onOpenTournaments?: () => void
}) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const liveMatches = useLiveMatches()
  // El partido propio ya tiene su propia tarjeta ("Partido en curso") más
  // arriba: esta lista es para ver el de los demás.
  const othersLive = liveMatches?.filter((m) => m.id !== activeMatch?.id) ?? []

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
            {activeMatch && (
              <p className="text-sm opacity-60 truncate">
                {activeMatch.teamAName} {activeMatch.scoreA} – {activeMatch.scoreB} {activeMatch.teamBName}
              </p>
            )}
          </div>
          <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
        </button>

        {activeMatch && (
          <button
            type="button"
            onClick={() => setConfirmingDiscard(true)}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left border"
            style={{ borderColor: 'var(--color-wood-600)' }}
          >
            <PlusIcon className="w-7 h-7 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
            <div className="flex-1 min-w-0">
              <p className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
                Nuevo partido
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
          </button>
        )}

        {onOpenTournaments && (
          <button
            type="button"
            onClick={onOpenTournaments}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left border"
            style={{ borderColor: 'var(--color-wood-600)' }}
          >
            <TrophyIcon className="w-7 h-7 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
            <div className="flex-1 min-w-0">
              <p className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
                Torneos
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
          </button>
        )}

        {othersLive.length > 0 && (
          <div className="space-y-2 pt-2">
            <p
              className="text-xs tracking-widest uppercase font-bold text-center flex items-center justify-center gap-1.5"
              style={{ color: 'var(--color-ember-500)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-ember-500)' }} />
              En vivo ahora
            </p>
            {othersLive.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border px-4 py-3"
                style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}
              >
                <p className="text-sm truncate" style={{ color: 'var(--color-paper-100)' }}>
                  {m.team_a_player_names.join(', ')} <span className="opacity-40">vs</span>{' '}
                  {m.team_b_player_names.join(', ')}
                </p>
                <p className="font-num text-lg font-bold mt-0.5" style={{ color: 'var(--color-ember-500)' }}>
                  {m.team_a_name} {m.score_a} – {m.score_b} {m.team_b_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-[3]" />

      <ConfirmDialog
        open={confirmingDiscard}
        title="¿Empezar de cero?"
        message="El partido en curso se va a eliminar."
        confirmLabel="Empezar de cero"
        danger
        onConfirm={() => {
          setConfirmingDiscard(false)
          onDiscardAndNew?.()
        }}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </div>
  )
}

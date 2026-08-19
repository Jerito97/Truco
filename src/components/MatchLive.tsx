import type { ActiveMatch } from '../types'
import { Scoreboard } from './Scoreboard'
import { ManoBadge } from './ManoBadge'
import { BackIcon } from './icons'

export function MatchLive({
  match,
  onAdd,
  onSub,
  onEnterPicaPica,
  onBack,
}: {
  match: ActiveMatch
  onAdd: (team: 'A' | 'B') => void
  onSub: (team: 'A' | 'B') => void
  onEnterPicaPica: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Anotador
        </h2>
        <span className="w-5" />
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <Scoreboard
          left={{
            label: match.teamAName,
            score: match.scoreA,
            onAdd: () => onAdd('A'),
            onSub: () => onSub('A'),
            badge: match.manoTeam === 'A' ? <ManoBadge /> : undefined,
          }}
          right={{
            label: match.teamBName,
            score: match.scoreB,
            onAdd: () => onAdd('B'),
            onSub: () => onSub('B'),
            badge: match.manoTeam === 'B' ? <ManoBadge /> : undefined,
          }}
        />

        {match.picaPicaRounds > 0 && (
          <div className="text-center font-num text-sm opacity-70 shrink-0">
            Pica-pica: {match.picaPicaTotalA} a {match.picaPicaTotalB}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onEnterPicaPica}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        Pica-pica
      </button>
    </div>
  )
}

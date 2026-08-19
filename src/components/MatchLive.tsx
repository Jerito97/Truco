import type { ActiveMatch } from '../types'
import { Scoreboard } from './Scoreboard'
import { ManoBadge } from './ManoBadge'
import { BackIcon, MenuIcon } from './icons'

export function MatchLive({
  match,
  onAdd,
  onSub,
  onUndo,
  onPassMano,
  onEnterPicaPica,
  onBack,
}: {
  match: ActiveMatch
  onAdd: (team: 'A' | 'B') => void
  onSub: (team: 'A' | 'B') => void
  onUndo: () => void
  onPassMano: () => void
  onEnterPicaPica: () => void
  onBack: () => void
}) {
  const canUndo = match.history.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Anotador
        </h2>
        <MenuIcon className="w-5 h-5 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
      </div>

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
        <div className="text-center font-num text-sm opacity-70">
          Pica-pica: {match.picaPicaTotalA} a {match.picaPicaTotalB}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPassMano}
          className="py-2.5 rounded-xl font-bold border"
          style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
        >
          Pasar mano
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="py-2.5 rounded-xl font-bold border disabled:opacity-30"
          style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
        >
          Deshacer
        </button>
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

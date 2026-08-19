import type { ActiveMatch } from '../types'
import { Scoreboard } from './Scoreboard'
import { ManoBadge } from './ManoBadge'

export function MatchLive({
  match,
  onAdd,
  onSub,
  onUndo,
  onPassMano,
  onEnterPicaPica,
}: {
  match: ActiveMatch
  onAdd: (team: 'A' | 'B') => void
  onSub: (team: 'A' | 'B') => void
  onUndo: () => void
  onPassMano: () => void
  onEnterPicaPica: () => void
}) {
  const canUndo = match.history.length > 0

  return (
    <div className="space-y-4">
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
        <div className="text-center font-num text-sm opacity-80">
          Pica-pica: {match.picaPicaTotalA} a {match.picaPicaTotalB}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPassMano}
          className="py-2.5 rounded-xl font-bold border-2"
          style={{ borderColor: 'var(--color-paper-200)', color: 'var(--color-paper-100)' }}
        >
          Pasar mano
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="py-2.5 rounded-xl font-bold border-2 disabled:opacity-30"
          style={{ borderColor: 'var(--color-paper-200)', color: 'var(--color-paper-100)' }}
        >
          Deshacer
        </button>
      </div>

      <button
        type="button"
        onClick={onEnterPicaPica}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide"
        style={{ backgroundColor: 'var(--color-ember-500)', color: 'var(--color-paper-50)' }}
      >
        Pica-pica
      </button>
    </div>
  )
}

import type { ActiveMatch } from '../types'
import { Scoreboard } from './Scoreboard'

export function PicaPica({
  match,
  onAdd,
  onSub,
  onUndo,
  onClose,
}: {
  match: ActiveMatch
  onAdd: (duelIndex: number, team: 'A' | 'B') => void
  onSub: (duelIndex: number, team: 'A' | 'B') => void
  onUndo: () => void
  onClose: () => void
}) {
  const canUndo = match.picaPicaHistory.length > 0

  const sumA = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreA, 0)
  const sumB = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreB, 0)
  const diff = sumA - sumB

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Pica-pica
        </h2>
        <p className="text-sm opacity-70">Tres duelos 1 contra 1, al mismo tiempo</p>
      </div>

      <div className="space-y-3">
        {match.pairings.map((pair, i) => (
          <Scoreboard
            key={i}
            size="compact"
            left={{
              label: pair.teamAPlayerName,
              score: match.picaPicaDuels[i]?.scoreA ?? 0,
              onAdd: () => onAdd(i, 'A'),
              onSub: () => onSub(i, 'A'),
            }}
            right={{
              label: pair.teamBPlayerName,
              score: match.picaPicaDuels[i]?.scoreB ?? 0,
              onAdd: () => onAdd(i, 'B'),
              onSub: () => onSub(i, 'B'),
            }}
          />
        ))}
      </div>

      <div className="text-center font-num text-sm opacity-80">
        {diff === 0 && 'Diferencia: 0 (no suma a nadie todavía)'}
        {diff > 0 && `Diferencia: +${diff} para ${match.teamAName}`}
        {diff < 0 && `Diferencia: +${-diff} para ${match.teamBName}`}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="py-2.5 rounded-xl font-bold border disabled:opacity-30"
          style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 rounded-xl font-bold border"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          Cerrar ronda
        </button>
      </div>
    </div>
  )
}

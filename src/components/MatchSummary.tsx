import type { ActiveMatch } from '../types'

export function MatchSummary({
  match,
  onRematch,
  onNewMatch,
}: {
  match: ActiveMatch
  onRematch: () => void
  onNewMatch: () => void
}) {
  const winnerName = match.scoreA >= match.scoreB ? match.teamAName : match.teamBName

  return (
    <div className="space-y-5">
      <div className="paper-card rounded-2xl p-6 text-center">
        <p className="uppercase tracking-widest text-xs opacity-60 mb-1">Fin del partido</p>
        <h2 className="font-poster text-3xl mb-4" style={{ color: 'var(--color-ember-600)' }}>
          ¡Ganó {winnerName}!
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="font-poster text-lg truncate">{match.teamAName}</div>
            <div className="font-num text-5xl font-bold">{match.scoreA}</div>
          </div>
          <div>
            <div className="font-poster text-lg truncate">{match.teamBName}</div>
            <div className="font-num text-5xl font-bold">{match.scoreB}</div>
          </div>
        </div>

        {match.picaPicaRounds > 0 && (
          <p className="mt-3 font-num text-sm opacity-70">
            Pica-pica: {match.picaPicaTotalA} a {match.picaPicaTotalB}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="w-full py-3 rounded-xl font-poster text-xl tracking-wide"
          style={{ backgroundColor: 'var(--color-ember-500)', color: 'var(--color-paper-50)' }}
        >
          Revancha
        </button>
        <button
          type="button"
          onClick={onNewMatch}
          className="w-full py-2.5 rounded-xl font-bold border-2"
          style={{ borderColor: 'var(--color-paper-200)', color: 'var(--color-paper-100)' }}
        >
          Armar otro partido
        </button>
      </div>
    </div>
  )
}

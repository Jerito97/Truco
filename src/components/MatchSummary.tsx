import type { ActiveMatch } from '../types'
import { TrophyIcon } from './icons'
import { aggregatePicaPicaRounds } from '../lib/picaPica'

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
  const picaPicaTotals = aggregatePicaPicaRounds(match.picaPicaRoundsHistory)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-center border" style={{ borderColor: 'rgba(203, 170, 106, 0.3)' }}>
        <TrophyIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-ember-500)' }} />
        <p className="uppercase tracking-widest text-xs opacity-60 mb-1">Fin del partido</p>
        <h2 className="font-poster text-3xl mb-4" style={{ color: 'var(--color-ember-500)' }}>
          ¡Ganó {winnerName}!
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {match.teamAName}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {match.scoreA}
            </div>
          </div>
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {match.teamBName}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {match.scoreB}
            </div>
          </div>
        </div>

        {match.picaPicaRounds > 0 && (
          <p className="mt-3 font-num text-sm opacity-70">
            Pica-pica: {match.picaPicaTotalA} a {match.picaPicaTotalB}
          </p>
        )}
      </div>

      {picaPicaTotals.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
          <h3 className="font-poster text-lg mb-2 text-center" style={{ color: 'var(--color-ember-500)' }}>
            Mano a mano
          </h3>
          <div className="space-y-1">
            {picaPicaTotals.map((d, j) => {
              const aWon = d.scoreA > d.scoreB
              const bWon = d.scoreB > d.scoreA
              return (
                <div key={j} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span
                    className="truncate text-right"
                    style={{ color: aWon ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: aWon ? 700 : 400 }}
                  >
                    {d.aName}
                  </span>
                  <span className="font-num shrink-0 opacity-70">
                    {d.scoreA} - {d.scoreB}
                  </span>
                  <span
                    className="truncate text-left"
                    style={{ color: bWon ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: bWon ? 700 : 400 }}
                  >
                    {d.bName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          Revancha
        </button>
        <button
          type="button"
          onClick={onNewMatch}
          className="w-full py-2.5 rounded-xl font-bold border"
          style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
        >
          Armar otro partido
        </button>
      </div>
    </div>
  )
}

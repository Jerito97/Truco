import type { PicaPicaRoundResult } from '../types'
import { ClockIcon, TrophyIcon } from './icons'
import { aggregatePicaPicaRounds } from '../lib/picaPica'
import { formatDuration } from '../lib/formatDuration'

// La tarjeta de resultado de un partido terminado: la usan tanto el resumen
// al cerrar un partido en vivo (MatchSummary) como el detalle de un partido
// ya guardado en Historial (MatchDetailScreen) — reciben los mismos datos ya
// calculados en vez de un ActiveMatch/FinishedMatch, para no acoplarse a
// ninguno de los dos formatos.
export function MatchResultCard({
  eyebrow,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  aWins,
  picaPicaPlayed,
  picaPicaTotalA,
  picaPicaTotalB,
  picaPicaRounds,
  durationSeconds,
}: {
  eyebrow: string
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  aWins: boolean
  picaPicaPlayed: boolean
  picaPicaTotalA: number
  picaPicaTotalB: number
  picaPicaRounds: PicaPicaRoundResult[]
  durationSeconds: number | null
}) {
  const winnerName = aWins ? teamAName : teamBName
  const picaPicaTotals = aggregatePicaPicaRounds(picaPicaRounds)
  const hasStatsRow = picaPicaPlayed || durationSeconds != null

  return (
    <>
      <div className="rounded-2xl p-6 text-center border" style={{ borderColor: 'var(--color-ember-600)' }}>
        <TrophyIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-ember-500)' }} />
        <span
          className="inline-block px-4 py-1 rounded-full border text-[11px] font-bold tracking-widest uppercase mb-3"
          style={{ borderColor: 'rgba(203, 170, 106, 0.4)', color: 'var(--color-paper-100)' }}
        >
          {eyebrow}
        </span>
        <h2 className="font-poster text-3xl mb-4" style={{ color: 'var(--color-ember-500)' }}>
          ¡Ganó {winnerName}!
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {teamAName}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {scoreA}
            </div>
            {aWins && (
              <span
                className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                style={{ backgroundColor: 'var(--color-ember-600)', color: 'var(--color-wood-950)' }}
              >
                Ganador
              </span>
            )}
          </div>
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {teamBName}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {scoreB}
            </div>
            {!aWins && (
              <span
                className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                style={{ backgroundColor: 'var(--color-ember-600)', color: 'var(--color-wood-950)' }}
              >
                Ganador
              </span>
            )}
          </div>
        </div>

        {hasStatsRow && (
          <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
            {picaPicaPlayed && (
              <div className="text-center">
                <div className="text-[11px] opacity-60">Pica-pica</div>
                <div className="font-num text-sm font-bold mt-0.5" style={{ color: 'var(--color-ember-500)' }}>
                  {picaPicaTotalA} a {picaPicaTotalB}
                </div>
              </div>
            )}
            {picaPicaPlayed && durationSeconds != null && (
              <div className="w-px h-9" style={{ backgroundColor: 'rgba(203, 170, 106, 0.2)' }} />
            )}
            {durationSeconds != null && (
              <div className="text-center">
                <div className="text-[11px] opacity-60 flex items-center gap-1 justify-center">
                  <ClockIcon className="w-3 h-3" />
                  Duración
                </div>
                <div className="font-num text-sm font-bold mt-0.5" style={{ color: 'var(--color-ember-500)' }}>
                  {formatDuration(durationSeconds)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {picaPicaTotals.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
          <h3 className="font-poster text-lg mb-3 text-center" style={{ color: 'var(--color-ember-500)' }}>
            Mano a mano
          </h3>
          <div className="space-y-2">
            {picaPicaTotals.map((d, j) => {
              const aWon = d.scoreA > d.scoreB
              const bWon = d.scoreB > d.scoreA
              return (
                <div
                  key={j}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm rounded-xl px-3 py-2"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
                >
                  <span
                    className="truncate text-right"
                    style={{ color: aWon ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: aWon ? 700 : 400 }}
                  >
                    {d.aName}
                  </span>
                  <span className="font-num shrink-0 opacity-70 px-1">
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
    </>
  )
}

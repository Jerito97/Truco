import { useState } from 'react'
import type { FinishedMatch } from '../types'
import { BackIcon, ShareIcon, TrophyIcon } from './icons'
import { aggregatePicaPicaRounds } from '../lib/picaPica'
import { generateShareImageBlob } from '../lib/shareImage'
import { formatDate } from '../lib/formatDate'
import { formatDuration } from '../lib/formatDuration'

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function MatchDetailScreen({ match, onBack }: { match: FinishedMatch; onBack: () => void }) {
  const [sharing, setSharing] = useState(false)
  const aWins = match.winner === 'A'
  const winnerName = aWins ? match.team_a_name : match.team_b_name
  const picaPicaTotals = aggregatePicaPicaRounds(match.pica_pica_rounds)

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await generateShareImageBlob({
        teamAName: match.team_a_name,
        teamBName: match.team_b_name,
        scoreA: match.score_a,
        scoreB: match.score_b,
        picaPicaRoundsHistory: match.pica_pica_rounds,
      })
      if (!blob) return
      const file = new File([blob], 'osobuco-resultado.png', { type: 'image/png' })
      const shareData = {
        files: [file],
        title: 'Osobuco',
        text: `¡Ganó ${winnerName}! ${match.score_a} - ${match.score_b}`,
      }
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'osobuco-resultado.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }
    } catch {
      // El usuario cancela el share sheet o el navegador no lo soporta: no hay nada que mostrar.
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Partido
        </h2>
        <span className="w-5" />
      </div>

      <div className="rounded-2xl p-6 text-center border" style={{ borderColor: 'rgba(203, 170, 106, 0.3)' }}>
        <TrophyIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-ember-500)' }} />
        <p className="uppercase tracking-widest text-xs opacity-60 mb-1">{formatDate(match.played_at)}</p>
        <h2 className="font-poster text-3xl mb-4" style={{ color: 'var(--color-ember-500)' }}>
          ¡Ganó {winnerName}!
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {joinNames(match.team_a_player_names)}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {match.score_a}
            </div>
          </div>
          <div>
            <div className="font-poster text-lg truncate" style={{ color: 'var(--color-paper-100)' }}>
              {joinNames(match.team_b_player_names)}
            </div>
            <div className="font-num text-5xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
              {match.score_b}
            </div>
          </div>
        </div>

        {match.pica_pica_played && (
          <p className="mt-3 font-num text-sm opacity-70">
            Pica-pica: {match.pica_pica_total_a} a {match.pica_pica_total_b}
          </p>
        )}
        {match.duration_seconds != null && (
          <p className="mt-1 font-num text-sm opacity-70">Duró {formatDuration(match.duration_seconds)}</p>
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

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold border disabled:opacity-50"
        style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
      >
        <ShareIcon className="w-4 h-4" />
        Compartir resultado
      </button>
    </div>
  )
}

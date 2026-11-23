import { useState } from 'react'
import type { FinishedMatch } from '../types'
import { BackIcon, ShareIcon } from './icons'
import { generateShareImageBlob } from '../lib/shareImage'
import { formatDate } from '../lib/formatDate'
import { MatchResultCard } from './MatchResultCard'

export function MatchDetailScreen({ match, onBack }: { match: FinishedMatch; onBack: () => void }) {
  const [sharing, setSharing] = useState(false)
  // Por puntaje, no por match.winner (ver MatchRow.tsx): el puntaje en
  // pantalla es la verdad que el usuario está mirando.
  const aWins = match.score_a >= match.score_b
  const winnerName = aWins ? match.team_a_name : match.team_b_name

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

      <MatchResultCard
        eyebrow={formatDate(match.played_at)}
        teamAName={match.team_a_name}
        teamBName={match.team_b_name}
        scoreA={match.score_a}
        scoreB={match.score_b}
        aWins={aWins}
        picaPicaPlayed={match.pica_pica_played}
        picaPicaTotalA={match.pica_pica_total_a}
        picaPicaTotalB={match.pica_pica_total_b}
        picaPicaRounds={match.pica_pica_rounds}
        durationSeconds={match.duration_seconds}
      />

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

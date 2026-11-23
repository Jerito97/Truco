import { useState } from 'react'
import type { ActiveMatch } from '../types'
import { RefreshIcon, ShareIcon } from './icons'
import { generateShareImageBlob } from '../lib/shareImage'
import { MatchResultCard } from './MatchResultCard'

export function MatchSummary({
  match,
  isSyncPending,
  onRematch,
  onNewMatch,
}: {
  match: ActiveMatch
  isSyncPending: boolean
  onRematch: () => void
  onNewMatch: () => void
}) {
  const [sharing, setSharing] = useState(false)
  const aWins = match.scoreA >= match.scoreB
  const winnerName = aWins ? match.teamAName : match.teamBName
  const durationSeconds = match.finishedAt
    ? Math.round((new Date(match.finishedAt).getTime() - new Date(match.startedAt).getTime()) / 1000)
    : null

  const handleShare = async () => {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await generateShareImageBlob(match)
      if (!blob) return
      const file = new File([blob], 'osobuco-resultado.png', { type: 'image/png' })
      const shareData = { files: [file], title: 'Osobuco', text: `¡Ganó ${winnerName}! ${match.scoreA} - ${match.scoreB}` }
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
      <MatchResultCard
        eyebrow="Partido finalizado"
        teamAName={match.teamAName}
        teamBName={match.teamBName}
        scoreA={match.scoreA}
        scoreB={match.scoreB}
        aWins={aWins}
        picaPicaPlayed={match.picaPicaRounds > 0}
        picaPicaTotalA={match.picaPicaTotalA}
        picaPicaTotalB={match.picaPicaTotalB}
        picaPicaRounds={match.picaPicaRoundsHistory}
        durationSeconds={durationSeconds}
        scoreEvents={match.scoreEvents}
      />

      <p className="text-center text-xs opacity-60 -mt-2">
        {isSyncPending ? 'Se va a guardar en cuanto haya señal' : 'Guardado ✓'}
      </p>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-poster text-xl tracking-wide"
          style={{ backgroundColor: 'var(--color-ember-600)', color: 'var(--color-wood-950)' }}
        >
          <RefreshIcon className="w-5 h-5" />
          Revancha
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold border disabled:opacity-50"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          <ShareIcon className="w-4 h-4" />
          Compartir resultado
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

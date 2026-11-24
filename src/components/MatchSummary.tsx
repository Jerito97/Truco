import type { ActiveMatch } from '../types'
import { RefreshIcon } from './icons'
import { MatchResultCard } from './MatchResultCard'
import { ShareResultButton } from './ShareResultButton'
import type { ShareableMatch } from '../lib/shareImage'

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
  const aWins = match.scoreA >= match.scoreB
  const winnerName = aWins ? match.teamAName : match.teamBName
  const durationSeconds = match.finishedAt
    ? Math.round((new Date(match.finishedAt).getTime() - new Date(match.startedAt).getTime()) / 1000)
    : null

  const shareableMatch: ShareableMatch = {
    teamAName: match.teamAName,
    teamBName: match.teamBName,
    teamAPlayerNames: match.teamAPlayerNames,
    teamBPlayerNames: match.teamBPlayerNames,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    playedAt: match.finishedAt ?? new Date().toISOString(),
    scoreEvents: match.scoreEvents,
    durationSeconds,
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
        <ShareResultButton
          match={shareableMatch}
          shareText={`¡Ganó ${winnerName}! ${match.scoreA} - ${match.scoreB}`}
          tone="ember"
        />
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

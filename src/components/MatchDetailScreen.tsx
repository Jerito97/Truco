import type { FinishedMatch } from '../types'
import { formatDate } from '../lib/formatDate'
import { MatchResultCard } from './MatchResultCard'
import { ShareResultButton } from './ShareResultButton'
import type { ShareableMatch } from '../lib/shareImage'
import { useScrollToTop } from '../state/useScrollToTop'
import { ScreenHeader } from './ScreenHeader'

export function MatchDetailScreen({ match, onBack }: { match: FinishedMatch; onBack: () => void }) {
  useScrollToTop()
  // Por puntaje, no por match.winner (ver MatchRow.tsx): el puntaje en
  // pantalla es la verdad que el usuario está mirando.
  const aWins = match.score_a >= match.score_b
  const winnerName = aWins ? match.team_a_name : match.team_b_name

  const shareableMatch: ShareableMatch = {
    teamAName: match.team_a_name,
    teamBName: match.team_b_name,
    teamAPlayerNames: match.team_a_player_names,
    teamBPlayerNames: match.team_b_player_names,
    scoreA: match.score_a,
    scoreB: match.score_b,
    playedAt: match.played_at,
    scoreEvents: match.score_events,
    durationSeconds: match.duration_seconds,
  }

  return (
    <div className="screen-fill flex flex-col">
      <ScreenHeader title="Partido" onBack={onBack} />

      <div className="flex-1 flex flex-col justify-center gap-5 min-h-0">
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
          scoreEvents={match.score_events}
        />

        <ShareResultButton
          match={shareableMatch}
          shareText={`¡Ganó ${winnerName}! ${match.score_a} - ${match.score_b}`}
          tone="muted"
        />
      </div>
    </div>
  )
}

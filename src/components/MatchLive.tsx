import type { ActiveMatch } from '../types'
import { Scoreboard } from './Scoreboard'
import { ManoBadge } from './ManoBadge'
import { ChatIcon } from './icons'
import { useElapsedSeconds } from '../state/useElapsedSeconds'
import { formatDuration } from '../lib/formatDuration'
import { ScreenHeader } from './ScreenHeader'

export function MatchLive({
  match,
  onAdd,
  onSub,
  onEnterPicaPica,
  onBack,
  onOpenKak,
}: {
  match: ActiveMatch
  onAdd: (team: 'A' | 'B') => void
  onSub: (team: 'A' | 'B') => void
  onEnterPicaPica: () => void
  onBack: () => void
  onOpenKak?: () => void
}) {
  const elapsed = useElapsedSeconds(match.startedAt)

  return (
    <div className="screen-fill flex flex-col">
      <ScreenHeader
        title="Anotador"
        onBack={onBack}
        subtitle={formatDuration(elapsed)}
        action={
          onOpenKak && (
            <button
              type="button"
              onClick={onOpenKak}
              className="flex items-center gap-1 shrink-0"
              style={{ color: 'var(--color-ember-500)' }}
            >
              <ChatIcon className="w-4 h-4" />
              <span className="text-xs font-bold whitespace-nowrap">Kak</span>
            </button>
          )
        }
      />

      <div className="flex-1 min-h-0 flex flex-col">
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
      </div>

      {match.pairings.length === 3 && (
        <button
          type="button"
          onClick={onEnterPicaPica}
          className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          Pica-pica
        </button>
      )}
    </div>
  )
}

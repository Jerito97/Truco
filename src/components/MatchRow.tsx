import type { FinishedMatch } from '../types'
import { CalendarIcon, ChevronRightIcon, SwordsIcon, TrophyIcon } from './icons'
import { formatDate } from '../lib/formatDate'

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function MatchRow({ match, onSelect }: { match: FinishedMatch; onSelect: (match: FinishedMatch) => void }) {
  const aWins = match.winner === 'A'

  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}
    >
      <div
        className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
        style={{ borderColor: aWins ? 'var(--color-ember-500)' : 'rgba(203, 170, 106, 0.25)' }}
      >
        {aWins ? (
          <TrophyIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />
        ) : (
          <SwordsIcon className="w-5 h-5 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm sm:text-base">
          <span style={{ color: aWins ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: aWins ? 700 : 400 }}>
            {joinNames(match.team_a_player_names)}
          </span>
          <span className="opacity-40 mx-1.5 text-xs">vs</span>
          <span style={{ color: !aWins ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: !aWins ? 700 : 400 }}>
            {joinNames(match.team_b_player_names)}
          </span>
        </p>
        <p className="flex items-center gap-1 text-xs opacity-50 mt-1">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(match.played_at)}
        </p>
      </div>

      <div className="w-px h-8 shrink-0" style={{ backgroundColor: 'rgba(203, 170, 106, 0.2)' }} />

      <span className="font-num font-bold shrink-0 pl-1" style={{ color: 'var(--color-ember-500)' }}>
        {match.score_a} - {match.score_b}
      </span>
      <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
    </button>
  )
}

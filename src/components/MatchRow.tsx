import type { FinishedMatch } from '../types'
import { CalendarIcon, ChevronRightIcon } from './icons'
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
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-base"
          style={{ color: aWins ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: aWins ? 700 : 500 }}
        >
          {joinNames(match.team_a_player_names)}
        </p>
        <p
          className="truncate text-sm mt-0.5"
          style={{ color: !aWins ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: !aWins ? 700 : 400, opacity: !aWins ? 1 : 0.7 }}
        >
          {joinNames(match.team_b_player_names)}
        </p>
        <p className="flex items-center gap-1 text-xs opacity-50 mt-1.5">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(match.played_at)}
        </p>
      </div>

      <div className="w-px h-10 shrink-0" style={{ backgroundColor: 'rgba(203, 170, 106, 0.2)' }} />

      <span className="font-num font-bold shrink-0 pl-1" style={{ color: 'var(--color-ember-500)' }}>
        {match.score_a} - {match.score_b}
      </span>
      <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
    </button>
  )
}

import type { FinishedMatch } from '../types'
import { ChevronRightIcon } from './icons'

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function MatchRow({ match }: { match: FinishedMatch }) {
  const aWins = match.winner === 'A'
  return (
    <div className="flex items-center gap-3 py-3">
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
        <p className="text-xs opacity-50 mt-0.5">{formatDate(match.played_at)} · Finalizado</p>
      </div>
      <span className="font-num font-bold shrink-0" style={{ color: 'var(--color-ember-500)' }}>
        {match.score_a} - {match.score_b}
      </span>
      <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
    </div>
  )
}

import { useState } from 'react'
import type { FinishedMatch } from '../types'
import { ChevronRightIcon } from './icons'
import { aggregatePicaPicaRounds } from '../lib/picaPica'

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function MatchRow({ match, expandable }: { match: FinishedMatch; expandable?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const aWins = match.winner === 'A'
  const picaPicaTotals = aggregatePicaPicaRounds(match.pica_pica_rounds)
  const canExpand = expandable && match.pica_pica_played && picaPicaTotals.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-3 py-3"
        onClick={canExpand ? () => setExpanded((e) => !e) : undefined}
        role={canExpand ? 'button' : undefined}
        style={canExpand ? { cursor: 'pointer' } : undefined}
      >
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
          <p className="text-xs opacity-50 mt-0.5">
            {formatDate(match.played_at)} · Finalizado
            {match.pica_pica_played && ' · pica-pica'}
          </p>
        </div>
        <span className="font-num font-bold shrink-0" style={{ color: 'var(--color-ember-500)' }}>
          {match.score_a} - {match.score_b}
        </span>
        {canExpand ? (
          <ChevronRightIcon
            className="w-4 h-4 shrink-0 opacity-40 transition-transform"
            style={{ color: 'var(--color-paper-100)', transform: expanded ? 'rotate(90deg)' : 'none' }}
          />
        ) : (
          <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
        )}
      </div>

      {canExpand && expanded && (
        <div className="pb-3 space-y-1">
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
                <span className="font-num shrink-0 opacity-70 text-xs">
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
      )}
    </div>
  )
}

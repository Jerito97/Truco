import type { FinishedMatch } from '../types'
import { CalendarIcon, ChevronRightIcon } from './icons'
import { formatDate } from '../lib/formatDate'

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function MatchRow({ match, onSelect }: { match: FinishedMatch; onSelect: (match: FinishedMatch) => void }) {
  // Por puntaje, no por match.winner: ese campo puede quedar desactualizado
  // si el partido se editó después desde Admin (cambiás el puntaje pero no
  // tocás el botón de ganador), y ahí el ojo del usuario manda: gana el que
  // tiene más puntos en pantalla.
  const aWins = match.score_a >= match.score_b
  // El que ganó va siempre arriba (grande y dorado) y el que perdió abajo
  // (chico y apagado), sea cual sea el equipo A o B — no el equipo A fijo
  // arriba y el B abajo, que dejaba a un ganador con letra chica.
  const winnerNames = aWins ? match.team_a_player_names : match.team_b_player_names
  const loserNames = aWins ? match.team_b_player_names : match.team_a_player_names

  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-base font-bold" style={{ color: 'var(--color-ember-500)' }}>
          {joinNames(winnerNames)}
        </p>
        <p className="truncate text-sm mt-0.5 opacity-70" style={{ color: 'var(--color-paper-100)' }}>
          {joinNames(loserNames)}
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

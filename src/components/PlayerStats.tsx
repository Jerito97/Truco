import { useState } from 'react'
import type { FinishedMatch } from '../types'
import { formatDate } from '../lib/formatDate'
import { ChevronRightIcon } from './icons'

// Separada del componente para poder testearla sin armar un match real: para
// cada rival (identificado por id, no por nombre, para no separar a alguien
// que se renombró en dos entradas distintas) suma cuántas veces jugó en el
// equipo contrario y cuántas de esas le ganó o le perdió.
export function computeRivalStats(matches: FinishedMatch[], userId: string) {
  const rivals = new Map<string, { name: string; wins: number; losses: number }>()
  for (const m of matches) {
    const onA = m.team_a_player_ids.includes(userId)
    const won = (onA && m.winner === 'A') || (!onA && m.winner === 'B')
    const oppIds = onA ? m.team_b_player_ids : m.team_a_player_ids
    const oppNames = onA ? m.team_b_player_names : m.team_a_player_names
    oppIds.forEach((id, i) => {
      // El nombre puede haber cambiado entre partidos (renombre): nos
      // quedamos con el primero que aparece, que es el más reciente porque
      // useMatches trae los partidos ordenados del más nuevo al más viejo.
      if (!rivals.has(id)) rivals.set(id, { name: oppNames[i], wins: 0, losses: 0 })
      const r = rivals.get(id)!
      if (won) r.wins++
      else r.losses++
    })
  }
  let best: { name: string; wins: number } | null = null
  let worst: { name: string; losses: number } | null = null
  for (const r of rivals.values()) {
    if (r.wins > 0 && (!best || r.wins > best.wins)) best = { name: r.name, wins: r.wins }
    if (r.losses > 0 && (!worst || r.losses > worst.losses)) worst = { name: r.name, losses: r.losses }
  }
  return { best, worst }
}

export interface PicaPicaDuelEntry {
  matchId: string
  playedAt: string
  rivalName: string
  myScore: number
  rivalScore: number
}

// Mismo criterio que computePicaPicaRecord del backend (api/picaPicaRecord.ts):
// un duelo en 0 a 0 no cuenta (entrar y cerrar sin sumar nada). Se duplica acá
// en vez de compartir código porque uno trabaja con filas crudas de la base y
// este con los FinishedMatch ya tipados que ya tiene el frontend a mano.
export function listPicaPicaDuels(matches: FinishedMatch[], userId: string): PicaPicaDuelEntry[] {
  const entries: PicaPicaDuelEntry[] = []
  for (const m of matches) {
    const aIdx = m.team_a_player_ids.indexOf(userId)
    const bIdx = m.team_b_player_ids.indexOf(userId)
    for (const round of m.pica_pica_rounds) {
      for (const duel of round.duels) {
        const isA = duel.aId !== undefined ? duel.aId === userId : aIdx !== -1 && duel.aName === m.team_a_player_names[aIdx]
        const isB = duel.bId !== undefined ? duel.bId === userId : bIdx !== -1 && duel.bName === m.team_b_player_names[bIdx]
        if (!isA && !isB) continue
        if (duel.scoreA === 0 && duel.scoreB === 0) continue
        entries.push({
          matchId: m.id,
          playedAt: m.played_at,
          rivalName: isA ? duel.bName : duel.aName,
          myScore: isA ? duel.scoreA : duel.scoreB,
          rivalScore: isA ? duel.scoreB : duel.scoreA,
        })
      }
    }
  }
  return entries
}

export function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="font-num text-2xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
        {value}
      </div>
      <div className="text-[11px] opacity-60 mt-0.5">{label}</div>
    </div>
  )
}

const dividerStyle = { backgroundColor: 'rgba(203, 170, 106, 0.25)' }
const blockStyle = { borderColor: 'rgba(203, 170, 106, 0.25)' }

export const TIER_STYLE: Record<1 | 2 | 3, { label: string; color: string; border: string }> = {
  1: { label: 'Tier 1', color: 'var(--color-ember-500)', border: 'var(--color-ember-600)' },
  2: { label: 'Tier 2', color: 'var(--color-paper-100)', border: 'var(--color-wood-600)' },
  3: { label: 'Tier 3', color: 'var(--color-paper-100)', border: 'var(--color-wood-700)' },
}

function TierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const s = TIER_STYLE[tier]
  return (
    <div className="flex justify-center">
      <span
        className="px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide"
        style={{ color: s.color, borderColor: s.border, opacity: tier === 3 ? 0.7 : 1 }}
      >
        {s.label}
      </span>
    </div>
  )
}

// Versión chica para meter en una fila de lista (PlayersScreen, TeamPicker):
// sin el recuadro de insignia, solo el texto con su color.
export function TierTag({ tier }: { tier: 1 | 2 | 3 }) {
  const s = TIER_STYLE[tier]
  return (
    <span className="text-xs font-bold shrink-0" style={{ color: s.color, opacity: tier === 3 ? 0.7 : 1 }}>
      {s.label}
    </span>
  )
}

// Las mismas tarjetas de estadísticas sirven para "Mi perfil" (ProfileTab) y
// para el perfil de cualquier otro jugador (PlayerProfileScreen): reciben los
// valores ya calculados en vez de los hooks, así cada pantalla decide con qué
// id pedirlos. pronoun cambia nomás el texto de la tarjeta de rivales (vos
// vs. él/ella).
export function PlayerStatBlocks({
  played,
  won,
  streaks,
  picaPicaRecord,
  picaPicaDuels,
  rivalStats,
  pronoun,
}: {
  played: number
  won: number
  streaks: { current: number; best: number; tier: 1 | 2 | 3 | null } | null
  picaPicaRecord: { played: number; won: number; drawn: number; lost: number } | null
  picaPicaDuels: PicaPicaDuelEntry[] | null
  rivalStats: { best: { name: string; wins: number } | null; worst: { name: string; losses: number } | null } | null
  pronoun: 'self' | 'other'
}) {
  const [duelsExpanded, setDuelsExpanded] = useState(false)
  const pct = played > 0 ? Math.round((won / played) * 100) : 0
  const bestLabel = pronoun === 'self' ? 'Rival al que más le ganaste' : 'Rival al que más le ganó'
  const worstLabel = pronoun === 'self' ? 'Rival contra el que más perdiste' : 'Rival contra el que más perdió'

  return (
    <>
      {streaks?.tier != null && <TierBadge tier={streaks.tier} />}

      <div className="flex rounded-2xl border py-4" style={blockStyle}>
        <StatBlock value={String(played)} label="Partidos jugados" />
        <div className="w-px" style={dividerStyle} />
        <StatBlock value={String(won)} label="Partidos ganados" />
        <div className="w-px" style={dividerStyle} />
        <StatBlock value={`${pct}%`} label="Porcentaje de victorias" />
      </div>

      {streaks && played > 0 && (
        <div className="flex rounded-2xl border py-4" style={blockStyle}>
          <StatBlock value={streaks.current > 0 ? `${streaks.current} 🔥` : '0'} label="Racha actual" />
          <div className="w-px" style={dividerStyle} />
          <StatBlock value={String(streaks.best)} label="Mejor racha" />
        </div>
      )}

      {picaPicaRecord && picaPicaRecord.played > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={blockStyle}>
          <button
            type="button"
            onClick={() => setDuelsExpanded((v) => !v)}
            className="w-full p-4 space-y-3 text-left"
          >
            <div className="text-center text-[11px] opacity-60">De tus {played} partidos jugados, así te fue en el pica-pica</div>
            <div className="flex pt-1" style={{ borderTop: '1px solid rgba(203, 170, 106, 0.15)' }}>
              <StatBlock value={String(picaPicaRecord.won)} label="Ganados" />
              <div className="w-px" style={dividerStyle} />
              <StatBlock value={String(picaPicaRecord.drawn)} label="Empatados" />
              <div className="w-px" style={dividerStyle} />
              <StatBlock value={String(picaPicaRecord.lost)} label="Perdidos" />
            </div>
            <div className="flex items-center justify-center gap-1 text-xs font-bold pt-1" style={{ color: 'var(--color-ember-500)' }}>
              {duelsExpanded ? 'Ocultar duelos' : 'Ver duelos'}
              <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${duelsExpanded ? '-rotate-90' : 'rotate-90'}`} />
            </div>
          </button>

          {duelsExpanded && picaPicaDuels && picaPicaDuels.length > 0 && (
            <div className="divide-y" style={{ borderTop: '1px solid rgba(203, 170, 106, 0.15)', borderColor: 'rgba(203, 170, 106, 0.15)' }}>
              {picaPicaDuels.map((d, i) => {
                const outcomeColor =
                  d.myScore > d.rivalScore ? 'var(--color-ember-500)' : d.myScore < d.rivalScore ? '#d9695f' : 'var(--color-paper-100)'
                return (
                  <div key={`${d.matchId}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--color-paper-100)' }}>
                        vs {d.rivalName}
                      </p>
                      <p className="text-[11px] opacity-50">{formatDate(d.playedAt)}</p>
                    </div>
                    <span className="font-num font-bold shrink-0" style={{ color: outcomeColor }}>
                      {d.myScore} - {d.rivalScore}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {rivalStats && (rivalStats.best || rivalStats.worst) && (
        <div className="rounded-2xl border p-4 space-y-3" style={blockStyle}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm opacity-70">{bestLabel}</span>
            <span className="font-bold text-sm text-right truncate" style={{ color: 'var(--color-ember-500)' }}>
              {rivalStats.best ? `${rivalStats.best.name} · ${rivalStats.best.wins}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm opacity-70">{worstLabel}</span>
            <span className="font-bold text-sm text-right truncate" style={{ color: 'var(--color-ember-500)' }}>
              {rivalStats.worst ? `${rivalStats.worst.name} · ${rivalStats.worst.losses}` : '—'}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

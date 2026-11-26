import { useState } from 'react'
import type { ReactNode } from 'react'
import type { FinishedMatch } from '../types'
import { ChevronRightIcon, FlameIcon } from './icons'

function isMyDuel(
  duel: { aId?: string; bId?: string; aName: string; bName: string },
  userId: string,
  aIdx: number,
  bIdx: number,
  teamANames: string[],
  teamBNames: string[],
): 'A' | 'B' | null {
  const isA = duel.aId !== undefined ? duel.aId === userId : aIdx !== -1 && duel.aName === teamANames[aIdx]
  const isB = duel.bId !== undefined ? duel.bId === userId : bIdx !== -1 && duel.bName === teamBNames[bIdx]
  if (isA) return 'A'
  if (isB) return 'B'
  return null
}

// A nivel PARTIDO (no duelo): si jugaste pica-pica una sola vez en ese
// partido, es lo mismo; si entraste varias veces en el mismo partido, suma
// todos tus duelos de ESE partido y el resultado neto decide si ese partido
// fue ganado, empatado o perdido en el pica-pica. Un duelo en 0 a 0 no
// cuenta (entrar y cerrar sin sumar nada).
export function computePicaPicaMatchRecord(
  matches: FinishedMatch[],
  userId: string,
): { played: number; won: number; drawn: number; lost: number } {
  let won = 0
  let drawn = 0
  let lost = 0
  for (const m of matches) {
    const aIdx = m.team_a_player_ids.indexOf(userId)
    const bIdx = m.team_b_player_ids.indexOf(userId)
    let myTotal = 0
    let rivalTotal = 0
    let playedAny = false
    for (const round of m.pica_pica_rounds) {
      for (const duel of round.duels) {
        const side = isMyDuel(duel, userId, aIdx, bIdx, m.team_a_player_names, m.team_b_player_names)
        if (!side) continue
        if (duel.scoreA === 0 && duel.scoreB === 0) continue
        playedAny = true
        myTotal += side === 'A' ? duel.scoreA : duel.scoreB
        rivalTotal += side === 'A' ? duel.scoreB : duel.scoreA
      }
    }
    if (!playedAny) continue
    if (myTotal > rivalTotal) won += 1
    else if (myTotal < rivalTotal) lost += 1
    else drawn += 1
  }
  return { played: won + drawn + lost, won, drawn, lost }
}

export interface PicaPicaDuelEntry {
  matchId: string
  playedAt: string
  rivalName: string
  myScore: number
  rivalScore: number
}

// El detalle duelo por duelo (no por partido), para cuando se despliega la
// tarjeta: un mismo partido puede aparecer más de una vez acá si se jugó
// pica-pica más de una vez en él.
export function listPicaPicaDuels(matches: FinishedMatch[], userId: string): PicaPicaDuelEntry[] {
  const entries: PicaPicaDuelEntry[] = []
  for (const m of matches) {
    const aIdx = m.team_a_player_ids.indexOf(userId)
    const bIdx = m.team_b_player_ids.indexOf(userId)
    for (const round of m.pica_pica_rounds) {
      for (const duel of round.duels) {
        const side = isMyDuel(duel, userId, aIdx, bIdx, m.team_a_player_names, m.team_b_player_names)
        if (!side) continue
        if (duel.scoreA === 0 && duel.scoreB === 0) continue
        entries.push({
          matchId: m.id,
          playedAt: m.played_at,
          rivalName: side === 'A' ? duel.bName : duel.aName,
          myScore: side === 'A' ? duel.scoreA : duel.scoreB,
          rivalScore: side === 'A' ? duel.scoreB : duel.scoreA,
        })
      }
    }
  }
  return entries
}

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

export function StatBlock({
  value,
  label,
  valueColor,
  large,
}: {
  value: ReactNode
  label: string
  valueColor?: string
  // El porcentaje de victorias es el dato que más importa de un vistazo: va
  // más grande que sus vecinos de la misma tarjeta, no solo del mismo color.
  large?: boolean
}) {
  return (
    <div className="flex-1 text-center">
      <div
        className={`font-num font-bold ${large ? 'text-4xl' : 'text-2xl'}`}
        style={{ color: valueColor ?? 'var(--color-paper-50)' }}
      >
        {value}
      </div>
      <div className="text-[11px] opacity-60 mt-0.5">{label}</div>
    </div>
  )
}

// Rojo suave usado para "perdió" en todo el resto de la app (TournamentView,
// mensajes de error).
const LOST_COLOR = '#d9695f'

const dividerStyle = { backgroundColor: 'rgba(203, 170, 106, 0.25)' }
// Un fondo apenas tintado (no solo el borde) para que cada tarjeta se note
// como un bloque propio, separado de los demás.
const blockStyle = { borderColor: 'rgba(203, 170, 106, 0.25)', backgroundColor: 'rgba(203, 170, 106, 0.04)' }

export const TIER_STYLE: Record<1 | 2 | 3, { label: string; color: string; border: string }> = {
  1: { label: 'Tier 1', color: 'var(--color-ember-500)', border: 'var(--color-ember-600)' },
  2: { label: 'Tier 2', color: 'var(--color-paper-100)', border: 'var(--color-wood-600)' },
  3: { label: 'Tier 3', color: 'var(--color-paper-100)', border: 'var(--color-wood-700)' },
}

// Versión chica para meter en una fila de lista (PlayersScreen, TeamPicker):
// una pastilla con borde fino (no el recuadro grande y en mayúsculas de
// TierBadge, que es para destacarlo solo, centrado).
export function TierTag({ tier }: { tier: 1 | 2 | 3 }) {
  const s = TIER_STYLE[tier]
  return (
    <span
      className="text-xs font-bold shrink-0 px-2.5 py-1 rounded-full border"
      style={{ color: s.color, borderColor: s.border, opacity: tier === 3 ? 0.7 : 1 }}
    >
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
  picaPicaMatchRecord,
  picaPicaDuels,
  rivalStats,
  pronoun,
}: {
  played: number
  won: number
  streaks: { current: number; best: number; tier: 1 | 2 | 3 | null } | null
  picaPicaMatchRecord: { played: number; won: number; drawn: number; lost: number } | null
  picaPicaDuels: PicaPicaDuelEntry[] | null
  rivalStats: { best: { name: string; wins: number } | null; worst: { name: string; losses: number } | null } | null
  pronoun: 'self' | 'other'
}) {
  const [picaPicaExpanded, setPicaPicaExpanded] = useState(false)
  const pct = played > 0 ? Math.round((won / played) * 100) : 0
  const bestLabel = pronoun === 'self' ? 'Rival al que más le ganaste' : 'Rival al que más le ganó'
  const worstLabel = pronoun === 'self' ? 'Rival contra el que más perdiste' : 'Rival contra el que más perdió'

  return (
    <div className="space-y-4">
      {/* Hero: la única tarjeta grande, con el % de victorias destacado por
          encima de los otros dos números (mismo dato, pero es el que más
          importa de un vistazo). */}
      <div className="flex rounded-2xl border py-5" style={blockStyle}>
        <StatBlock value={String(played)} label="Partidos jugados" />
        <div className="w-px" style={dividerStyle} />
        <StatBlock value={String(won)} label="Partidos ganados" />
        <div className="w-px" style={dividerStyle} />
        <StatBlock value={`${pct}%`} label="Porcentaje de victorias" valueColor="var(--color-ember-500)" large />
      </div>

      {/* Rachas: dos tarjetas chicas lado a lado (no una sola dividida),
          para que no compitan en tamaño con la hero de arriba. */}
      {streaks && played > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border py-3" style={blockStyle}>
            <StatBlock
              value={
                streaks.current > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    {streaks.current}
                    <FlameIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />
                  </span>
                ) : (
                  '0'
                )
              }
              label="Racha actual"
            />
          </div>
          <div className="rounded-xl border py-3" style={blockStyle}>
            <StatBlock value={String(streaks.best)} label="Mejor racha" />
          </div>
        </div>
      )}

      {picaPicaMatchRecord && picaPicaMatchRecord.played > 0 && (
        <button
          type="button"
          onClick={() => setPicaPicaExpanded((v) => !v)}
          className="w-full rounded-2xl border p-4 space-y-3 text-left"
          style={blockStyle}
        >
          <div className="flex items-center justify-between">
            <span className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
              Pica-pica
            </span>
            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--color-ember-500)' }}>
              {picaPicaExpanded ? 'Ocultar duelos' : 'Ver duelos'}
              <ChevronRightIcon
                className={`w-3.5 h-3.5 transition-transform ${picaPicaExpanded ? '-rotate-90' : 'rotate-90'}`}
              />
            </span>
          </div>

          <div className="flex pt-1" style={{ borderTop: '1px solid rgba(203, 170, 106, 0.15)' }}>
            <StatBlock value={String(picaPicaMatchRecord.won)} label="Pica-pica ganados" valueColor="var(--color-ember-500)" />
            <div className="w-px" style={dividerStyle} />
            <StatBlock value={String(picaPicaMatchRecord.drawn)} label="Empatados" />
            <div className="w-px" style={dividerStyle} />
            <StatBlock value={String(picaPicaMatchRecord.lost)} label="Perdidos" valueColor={LOST_COLOR} />
          </div>

          {picaPicaExpanded && picaPicaDuels && (
            <div className="flex pt-1" style={{ borderTop: '1px solid rgba(203, 170, 106, 0.15)' }}>
              <StatBlock
                value={String(picaPicaDuels.filter((d) => d.myScore > d.rivalScore).length)}
                label="Duelos ganados"
                valueColor="var(--color-ember-500)"
              />
              <div className="w-px" style={dividerStyle} />
              <StatBlock
                value={String(picaPicaDuels.filter((d) => d.myScore === d.rivalScore).length)}
                label="Duelos empatados"
              />
              <div className="w-px" style={dividerStyle} />
              <StatBlock
                value={String(picaPicaDuels.filter((d) => d.myScore < d.rivalScore).length)}
                label="Duelos perdidos"
                valueColor={LOST_COLOR}
              />
            </div>
          )}
        </button>
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
    </div>
  )
}

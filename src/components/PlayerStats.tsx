import type { FinishedMatch } from '../types'

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
  rivalStats,
  pronoun,
}: {
  played: number
  won: number
  streaks: { current: number; best: number } | null
  picaPicaRecord: { played: number; won: number } | null
  rivalStats: { best: { name: string; wins: number } | null; worst: { name: string; losses: number } | null } | null
  pronoun: 'self' | 'other'
}) {
  const pct = played > 0 ? Math.round((won / played) * 100) : 0
  const bestLabel = pronoun === 'self' ? 'Rival al que más le ganaste' : 'Rival al que más le ganó'
  const worstLabel = pronoun === 'self' ? 'Rival contra el que más perdiste' : 'Rival contra el que más perdió'

  return (
    <>
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
        <div className="flex rounded-2xl border py-4" style={blockStyle}>
          <StatBlock value={String(picaPicaRecord.won)} label="Duelos ganados" />
          <div className="w-px" style={dividerStyle} />
          <StatBlock value={String(picaPicaRecord.played)} label="Duelos de pica-pica" />
          <div className="w-px" style={dividerStyle} />
          <StatBlock value={`${Math.round((picaPicaRecord.won / picaPicaRecord.played) * 100)}%`} label="Efectividad" />
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

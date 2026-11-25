// El tier (1 el mejor, 3 el peor) se calcula como el handicap de golf: no es
// el rendimiento de toda la vida, sino de los últimos TIER_WINDOW partidos
// (los que tenga, si todavía no llegó a esa cantidad), para que se note
// cuando alguien viene en racha o en bajón. Con menos de TIER_MIN_GAMES
// partidos jugados no alcanza la muestra para asignar ningún tier.
export const TIER_WINDOW = 10
export const TIER_MIN_GAMES = 5

export function tierFromWinCount(wins: number, total: number): 1 | 2 | 3 | null {
  if (total < TIER_MIN_GAMES) return null
  const winRate = wins / total
  if (winRate >= 0.6) return 1
  if (winRate >= 0.4) return 2
  return 3
}

export function computeTier(rows: { winner: 'A' | 'B'; team_a_player_ids: string[] }[], userId: string): 1 | 2 | 3 | null {
  const recent = rows.slice(-TIER_WINDOW)
  const wins = recent.filter((row) => {
    const onA = row.team_a_player_ids.includes(userId)
    return (onA && row.winner === 'A') || (!onA && row.winner === 'B')
  }).length
  return tierFromWinCount(wins, recent.length)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { computeStreaks } from './streaks.js'

interface StreakMatchRow {
  winner: 'A' | 'B'
  team_a_player_ids: string[]
  team_b_player_ids: string[]
}

// Separada del handler para poder testearla sin una base de datos. Arma la
// racha actual de cada jugador a partir de TODOS los partidos del período
// (no solo los de la tabla principal), agrupándolos por jugador una sola vez
// en vez de filtrar la lista completa por cada uno.
export function computeCurrentStreaks(matchRows: StreakMatchRow[], playerIds: string[]): Map<string, number> {
  const matchesByPlayer = new Map<string, StreakMatchRow[]>()
  for (const m of matchRows) {
    for (const pid of [...m.team_a_player_ids, ...m.team_b_player_ids]) {
      const list = matchesByPlayer.get(pid)
      if (list) list.push(m)
      else matchesByPlayer.set(pid, [m])
    }
  }
  const streaks = new Map<string, number>()
  for (const id of playerIds) {
    streaks.set(id, computeStreaks(matchesByPlayer.get(id) ?? [], id).current)
  }
  return streaks
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  // ?since=<ISO date> deja pedir el ranking de una ventana de tiempo (por
  // ejemplo "este año", "este mes") en vez de todo el historial acumulado.
  const sinceParam = typeof req.query.since === 'string' ? req.query.since : ''
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam)) ? sinceParam : null

  // Los jugadores de cada partido viven en dos columnas de arrays (team_a/team_b),
  // no en filas propias: el unnest + union all las aplana en una fila por
  // jugador-partido antes de poder agrupar por jugador. Solo entran los que
  // jugaron al menos un partido (join, no left join).
  const result = await pool.query(
    `
    select u.id, u.name, x.played, x.won
    from users u
    join (
      select player_id, count(*)::int as played, sum(won)::int as won
      from (
        select unnest(team_a_player_ids) as player_id, (winner = 'A')::int as won
        from matches where $1::timestamptz is null or played_at >= $1
        union all
        select unnest(team_b_player_ids) as player_id, (winner = 'B')::int as won
        from matches where $1::timestamptz is null or played_at >= $1
      ) t
      group by player_id
    ) x on x.player_id = u.id
    order by (x.won::float / x.played) desc, x.played desc, u.name asc
  `,
    [since],
  )

  // Para la racha actual hace falta el orden cronológico de los partidos de
  // cada jugador, algo que el agregado de arriba no da: traemos el detalle
  // del período una sola vez y la calculamos acá (reusa la misma lógica que
  // ya usa el perfil de cada jugador).
  const matchRowsResult = await pool.query<StreakMatchRow>(
    `select winner, team_a_player_ids, team_b_player_ids
     from matches
     where $1::timestamptz is null or played_at >= $1
     order by played_at asc`,
    [since],
  )
  const streaks = computeCurrentStreaks(
    matchRowsResult.rows,
    result.rows.map((r) => r.id),
  )

  res.status(200).json(result.rows.map((r) => ({ ...r, streak: streaks.get(r.id) ?? 0 })))
}

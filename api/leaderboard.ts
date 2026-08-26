import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  // Los jugadores de cada partido viven en dos columnas de arrays (team_a/team_b),
  // no en filas propias: el unnest + union all las aplana en una fila por
  // jugador-partido antes de poder agrupar por jugador. Solo entran los que
  // jugaron al menos un partido (join, no left join).
  const result = await pool.query(`
    select u.id, u.name, x.played, x.won
    from users u
    join (
      select player_id, count(*)::int as played, sum(won)::int as won
      from (
        select unnest(team_a_player_ids) as player_id, (winner = 'A')::int as won from matches
        union all
        select unnest(team_b_player_ids) as player_id, (winner = 'B')::int as won from matches
      ) t
      group by player_id
    ) x on x.player_id = u.id
    order by (x.won::float / x.played) desc, x.played desc, u.name asc
  `)
  res.status(200).json(result.rows)
}

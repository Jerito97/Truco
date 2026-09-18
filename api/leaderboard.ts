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
  res.status(200).json(result.rows)
}

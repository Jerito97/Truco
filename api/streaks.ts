import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'

// Separada del handler para poder testearla sin una base de datos: recibe
// las filas ya en orden cronológico ascendente.
export function computeStreaks(
  rows: { winner: 'A' | 'B'; team_a_player_ids: string[] }[],
  userId: string,
): { current: number; best: number } {
  let best = 0
  let running = 0
  for (const row of rows) {
    const onA = row.team_a_player_ids.includes(userId)
    const won = (onA && row.winner === 'A') || (!onA && row.winner === 'B')
    if (won) {
      running += 1
      if (running > best) best = running
    } else {
      running = 0
    }
  }
  // Como las filas vienen en orden cronológico, "running" al final es la
  // racha que sigue vigente hasta el partido más reciente (0 si el último
  // partido lo perdió).
  return { current: running, best }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
  if (!userId || !UUID_RE.test(userId)) {
    res.status(400).json({ error: 'Falta userId' })
    return
  }

  // Traemos TODO el historial del jugador (no los últimos 50 que usa el
  // historial general) porque la mejor racha puede estar en cualquier
  // punto: no alcanza con mirar solo los partidos más recientes.
  const result = await pool.query(
    `select winner, team_a_player_ids
     from matches
     where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)
     order by played_at asc`,
    [userId],
  )

  const { current, best } = computeStreaks(result.rows, userId)
  res.status(200).json({ current, best })
}

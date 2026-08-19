import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const {
      teamAName,
      teamBName,
      teamAPlayerIds,
      teamBPlayerIds,
      teamAPlayerNames,
      teamBPlayerNames,
      scoreA,
      scoreB,
      winner,
      picaPicaPlayed,
      picaPicaTotalA,
      picaPicaTotalB,
      picaPicaRounds,
    } = b

    const valid =
      typeof teamAName === 'string' &&
      typeof teamBName === 'string' &&
      Array.isArray(teamAPlayerIds) &&
      teamAPlayerIds.length === 3 &&
      teamAPlayerIds.every((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) &&
      Array.isArray(teamBPlayerIds) &&
      teamBPlayerIds.length === 3 &&
      teamBPlayerIds.every((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) &&
      Array.isArray(teamAPlayerNames) &&
      teamAPlayerNames.length === 3 &&
      teamAPlayerNames.every((n: unknown) => typeof n === 'string') &&
      Array.isArray(teamBPlayerNames) &&
      teamBPlayerNames.length === 3 &&
      teamBPlayerNames.every((n: unknown) => typeof n === 'string') &&
      typeof scoreA === 'number' &&
      typeof scoreB === 'number' &&
      (winner === 'A' || winner === 'B')

    if (!valid) {
      res.status(400).json({ error: 'Datos de partido inválidos' })
      return
    }

    const result = await pool.query(
      `insert into matches (
        team_a_name, team_b_name,
        team_a_player_ids, team_b_player_ids,
        team_a_player_names, team_b_player_names,
        score_a, score_b, winner,
        pica_pica_played, pica_pica_total_a, pica_pica_total_b, pica_pica_rounds
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
      returning id, played_at`,
      [
        teamAName,
        teamBName,
        teamAPlayerIds,
        teamBPlayerIds,
        teamAPlayerNames,
        teamBPlayerNames,
        scoreA,
        scoreB,
        winner,
        !!picaPicaPlayed,
        picaPicaTotalA || 0,
        picaPicaTotalB || 0,
        JSON.stringify(Array.isArray(picaPicaRounds) ? picaPicaRounds : []),
      ],
    )
    res.status(201).json(result.rows[0])
    return
  }

  if (req.method === 'GET') {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
    if (!userId || !UUID_RE.test(userId)) {
      res.status(400).json({ error: 'Falta userId' })
      return
    }
    const result = await pool.query(
      `select * from matches
       where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)
       order by played_at desc
       limit 50`,
      [userId],
    )
    res.status(200).json(result.rows)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

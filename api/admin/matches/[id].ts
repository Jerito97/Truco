import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../../_lib/db.js'
import { ensureSchema } from '../../_lib/ensureSchema.js'
import { isAdmin } from '../../_lib/requireAdmin.js'
import { UUID_RE } from '../../_lib/validation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Partido inválido' })
    return
  }

  if (req.method === 'PATCH') {
    const requesterId = req.body?.requesterId
    if (!(await isAdmin(pool, requesterId))) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }

    const { teamAName, teamBName, scoreA, scoreB, winner } = req.body ?? {}
    const valid =
      typeof teamAName === 'string' &&
      teamAName.trim().length > 0 &&
      typeof teamBName === 'string' &&
      teamBName.trim().length > 0 &&
      typeof scoreA === 'number' &&
      Number.isInteger(scoreA) &&
      scoreA >= 0 &&
      typeof scoreB === 'number' &&
      Number.isInteger(scoreB) &&
      scoreB >= 0 &&
      (winner === 'A' || winner === 'B')

    if (!valid) {
      res.status(400).json({ error: 'Datos de partido inválidos' })
      return
    }

    const updated = await pool.query(
      `update matches
       set team_a_name = $1, team_b_name = $2, score_a = $3, score_b = $4, winner = $5
       where id = $6
       returning *`,
      [teamAName.trim(), teamBName.trim(), scoreA, scoreB, winner, id],
    )
    if (updated.rows.length === 0) {
      res.status(404).json({ error: 'Partido no encontrado' })
      return
    }
    res.status(200).json(updated.rows[0])
    return
  }

  if (req.method === 'DELETE') {
    const requesterId = typeof req.query.requesterId === 'string' ? req.query.requesterId : ''
    if (!(await isAdmin(pool, requesterId))) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }
    await pool.query('delete from matches where id = $1', [id])
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

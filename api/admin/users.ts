import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'
import { isAdmin } from '../_lib/requireAdmin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const requesterId = typeof req.query.requesterId === 'string' ? req.query.requesterId : ''
  if (!(await isAdmin(pool, requesterId))) {
    res.status(403).json({ error: 'No autorizado' })
    return
  }

  const result = await pool.query('select id, name, created_at, is_admin from users order by created_at desc')
  res.status(200).json(result.rows)
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../../_lib/db.js'
import { ensureSchema } from '../../_lib/ensureSchema.js'
import { isAdmin } from '../../_lib/requireAdmin.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Partido inválido' })
    return
  }

  const requesterId = typeof req.query.requesterId === 'string' ? req.query.requesterId : ''
  if (!(await isAdmin(pool, requesterId))) {
    res.status(403).json({ error: 'No autorizado' })
    return
  }

  await pool.query('delete from matches where id = $1', [id])
  res.status(204).end()
}

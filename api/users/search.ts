import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db'
import { ensureSchema } from '../_lib/ensureSchema'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const excludeParam = typeof req.query.exclude === 'string' ? req.query.exclude : ''
  const excludeIds = new Set(excludeParam.split(',').filter(Boolean))

  const result = q
    ? await pool.query('select id, name from users where name_lower like $1 order by name limit 15', [
        '%' + q.toLowerCase() + '%',
      ])
    : await pool.query('select id, name from users order by name limit 15')

  const rows = result.rows.filter((r) => !excludeIds.has(r.id as string))
  res.status(200).json(rows)
}

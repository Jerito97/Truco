import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name || name.length > 40) {
    res.status(400).json({ error: 'Nombre inválido' })
    return
  }

  const existing = await pool.query('select id, name from users where name_lower = lower($1) limit 1', [name])
  if (existing.rows.length > 0) {
    res.status(200).json(existing.rows[0])
    return
  }

  const created = await pool.query('insert into users (name) values ($1) returning id, name', [name])
  res.status(201).json(created.rows[0])
}

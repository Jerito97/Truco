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
  const confirm = req.body?.confirm === true
  if (!name || name.length > 40) {
    res.status(400).json({ error: 'Nombre inválido' })
    return
  }

  const existing = await pool.query('select id, name, created_at from users where name_lower = lower($1) limit 1', [name])
  if (existing.rows.length > 0) {
    if (!confirm) {
      res.status(200).json({ exists: true, name: existing.rows[0].name })
      return
    }
    res.status(200).json({ exists: false, ...existing.rows[0] })
    return
  }

  const created = await pool.query('insert into users (name) values ($1) returning id, name, created_at', [name])
  res.status(201).json({ exists: false, ...created.rows[0] })
}

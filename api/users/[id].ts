import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Usuario inválido' })
    return
  }

  // Un usuario solo puede renombrarse a sí mismo (a diferencia del endpoint
  // de admin, acá no hace falta ser administrador).
  if (req.body?.requesterId !== id) {
    res.status(403).json({ error: 'No autorizado' })
    return
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name || name.length > 40) {
    res.status(400).json({ error: 'Nombre inválido' })
    return
  }

  const clash = await pool.query('select id from users where name_lower = lower($1) and id <> $2 limit 1', [name, id])
  if (clash.rows.length > 0) {
    res.status(409).json({ error: 'Ya hay otro usuario con ese nombre' })
    return
  }

  const updated = await pool.query(
    'update users set name = $1 where id = $2 returning id, name, created_at, is_admin',
    [name, id],
  )
  if (updated.rows.length === 0) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  res.status(200).json(updated.rows[0])
}

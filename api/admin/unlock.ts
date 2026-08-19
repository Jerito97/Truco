import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const adminCode = process.env.ADMIN_CODE
  if (!adminCode) {
    res.status(500).json({ error: 'No se configuró ADMIN_CODE en las variables de entorno de Vercel.' })
    return
  }

  const userId = req.body?.userId
  const code = typeof req.body?.code === 'string' ? req.body.code : ''

  if (typeof userId !== 'string' || !UUID_RE.test(userId)) {
    res.status(400).json({ error: 'Usuario inválido' })
    return
  }
  if (code !== adminCode) {
    res.status(403).json({ error: 'Código incorrecto' })
    return
  }

  const updated = await pool.query(
    'update users set is_admin = true where id = $1 returning id, name, created_at, is_admin',
    [userId],
  )
  if (updated.rows.length === 0) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  res.status(200).json(updated.rows[0])
}

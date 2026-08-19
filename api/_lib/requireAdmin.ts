import type { Pool } from 'pg'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function isAdmin(pool: Pool, requesterId: unknown): Promise<boolean> {
  if (typeof requesterId !== 'string' || !UUID_RE.test(requesterId)) return false
  const result = await pool.query('select is_admin from users where id = $1', [requesterId])
  return result.rows[0]?.is_admin === true
}

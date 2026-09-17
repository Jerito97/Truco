import type { Pool } from 'pg'
import { UUID_RE } from './validation.js'

export async function isAdmin(pool: Pool, requesterId: unknown): Promise<boolean> {
  if (typeof requesterId !== 'string' || !UUID_RE.test(requesterId)) return false
  const result = await pool.query('select is_admin from users where id = $1', [requesterId])
  return result.rows[0]?.is_admin === true
}

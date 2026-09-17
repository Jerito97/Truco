import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'
import { UUID_RE } from '../_lib/validation.js'

// Escapa % y _ (comodines de LIKE) y la barra invertida (nuestro propio
// carácter de escape) para que el texto buscado se compare literal.
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, '\\$&')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const excludeParam = typeof req.query.exclude === 'string' ? req.query.exclude : ''
  const excludeIds = excludeParam.split(',').filter((id) => UUID_RE.test(id))

  // El exclude se aplica en la consulta (no filtrando la respuesta en JS
  // después), para que el LIMIT 15 no se gaste en filas que van a terminar
  // descartadas y la búsqueda no devuelva menos resultados de los que hay.
  // (Sin ESCAPE explícito: la barra invertida ya es el escape por default
  // de LIKE en Postgres, así que escapeLike() ya alcanza con eso.)
  try {
    const result = q
      ? await pool.query(
          `select id, name from users
           where name_lower like $1 and not (id = any($2::uuid[]))
           order by name limit 15`,
          ['%' + escapeLike(q.toLowerCase()) + '%', excludeIds],
        )
      : await pool.query(
          `select id, name from users
           where not (id = any($1::uuid[]))
           order by name limit 15`,
          [excludeIds],
        )

    res.status(200).json(result.rows)
  } catch (err) {
    console.error('users/search failed', err)
    res.status(500).json({ error: 'No se pudo buscar' })
  }
}

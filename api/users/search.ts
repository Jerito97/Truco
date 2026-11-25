import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../_lib/db.js'
import { ensureSchema } from '../_lib/ensureSchema.js'
import { UUID_RE } from '../_lib/validation.js'
import { TIER_WINDOW, tierFromWinCount } from '../_lib/tier.js'

// Para no tener que entrar al perfil de cada uno solo para ver el tier: una
// consulta aparte (en vez de sumarla a la de arriba) que, por cada jugador
// de la lista, mira sus últimos TIER_WINDOW partidos y cuenta cuántos
// ganó — la misma cuenta que hace computeTier, pero agregada en SQL en vez
// de traer partido por partido al JS, porque acá puede ser una lista larga
// de jugadores a la vez (no uno solo, como en /api/streaks).
async function attachTiers(pool: ReturnType<typeof getPool>, users: { id: string; name: string }[]) {
  if (users.length === 0) return []
  const ids = users.map((u) => u.id)
  const result = await pool.query<{ user_id: string; wins: string; total: string }>(
    `select u.id as user_id, coalesce(t.wins, 0) as wins, coalesce(t.total, 0) as total
     from unnest($1::uuid[]) as u(id)
     left join lateral (
       select
         count(*) as total,
         count(*) filter (
           where (u.id = any(m.team_a_player_ids) and m.winner = 'A')
              or (u.id = any(m.team_b_player_ids) and m.winner = 'B')
         ) as wins
       from (
         select m2.team_a_player_ids, m2.team_b_player_ids, m2.winner
         from matches m2
         where u.id = any(m2.team_a_player_ids) or u.id = any(m2.team_b_player_ids)
         order by m2.played_at desc
         limit $2
       ) m
     ) t on true`,
    [ids, TIER_WINDOW],
  )
  const tierByUserId = new Map(result.rows.map((r) => [r.user_id, tierFromWinCount(Number(r.wins), Number(r.total))]))
  return users.map((u) => ({ ...u, tier: tierByUserId.get(u.id) ?? null }))
}

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
  // Sin texto para buscar no hay límite: es el modo "mostrame a todos" para
  // elegir de una lista en vez de tener que escribir el nombre, así que
  // cortarla en 15 dejaría afuera a cualquier grupo un poco grande.
  try {
    const result = q
      ? await pool.query(
          `select id, name from users
           where name_lower like $1 and not (id = any($2::uuid[]))
           order by name_lower limit 15`,
          ['%' + escapeLike(q.toLowerCase()) + '%', excludeIds],
        )
      : await pool.query(
          `select id, name from users
           where not (id = any($1::uuid[]))
           order by name_lower`,
          [excludeIds],
        )

    res.status(200).json(await attachTiers(pool, result.rows))
  } catch (err) {
    console.error('users/search failed', err)
    res.status(500).json({ error: 'No se pudo buscar' })
  }
}

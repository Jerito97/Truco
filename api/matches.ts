import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const {
      clientId,
      teamAName,
      teamBName,
      teamAPlayerIds,
      teamBPlayerIds,
      teamAPlayerNames,
      teamBPlayerNames,
      scoreA,
      scoreB,
      winner,
      picaPicaPlayed,
      picaPicaTotalA,
      picaPicaTotalB,
      picaPicaRounds,
    } = b

    const teamSize = Array.isArray(teamAPlayerIds) ? teamAPlayerIds.length : 0

    const valid =
      typeof teamAName === 'string' &&
      typeof teamBName === 'string' &&
      teamSize >= 1 &&
      teamSize <= 3 &&
      Array.isArray(teamAPlayerIds) &&
      teamAPlayerIds.every((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) &&
      Array.isArray(teamBPlayerIds) &&
      teamBPlayerIds.length === teamSize &&
      teamBPlayerIds.every((id: unknown) => typeof id === 'string' && UUID_RE.test(id)) &&
      Array.isArray(teamAPlayerNames) &&
      teamAPlayerNames.length === teamSize &&
      teamAPlayerNames.every((n: unknown) => typeof n === 'string') &&
      Array.isArray(teamBPlayerNames) &&
      teamBPlayerNames.length === teamSize &&
      teamBPlayerNames.every((n: unknown) => typeof n === 'string') &&
      typeof scoreA === 'number' &&
      typeof scoreB === 'number' &&
      (winner === 'A' || winner === 'B') &&
      (clientId === undefined || (typeof clientId === 'string' && clientId.length > 0 && clientId.length <= 100))

    if (!valid) {
      res.status(400).json({ error: 'Datos de partido inválidos' })
      return
    }

    const result = await pool.query(
      `insert into matches (
        client_id,
        team_a_name, team_b_name,
        team_a_player_ids, team_b_player_ids,
        team_a_player_names, team_b_player_names,
        score_a, score_b, winner,
        pica_pica_played, pica_pica_total_a, pica_pica_total_b, pica_pica_rounds
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
      on conflict (client_id) where client_id is not null
        do update set client_id = excluded.client_id
      returning id, played_at`,
      [
        clientId || null,
        teamAName,
        teamBName,
        teamAPlayerIds,
        teamBPlayerIds,
        teamAPlayerNames,
        teamBPlayerNames,
        scoreA,
        scoreB,
        winner,
        !!picaPicaPlayed,
        picaPicaTotalA || 0,
        picaPicaTotalB || 0,
        JSON.stringify(Array.isArray(picaPicaRounds) ? picaPicaRounds : []),
      ],
    )

    // Reintento de un partido que ya se había guardado (conflicto por
    // client_id): el "do update" no cambia nada de verdad, pero nos deja
    // devolver la fila existente en la misma consulta en vez de una
    // segunda ida a la base.
    res.status(201).json(result.rows[0])
    return
  }

  if (req.method === 'GET') {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
    if (!userId || !UUID_RE.test(userId)) {
      res.status(400).json({ error: 'Falta userId' })
      return
    }
    // scope=all trae los últimos partidos de todos los jugadores (para el
    // historial general); el default sigue filtrando solo los del usuario
    // (lo sigue usando el perfil para calcular sus propias estadísticas).
    // player filtra por cualquier jugador puntual (buscador del historial) y
    // gana por sobre scope si viene: es el mismo filtro de "partidos donde
    // jugó tal id", solo que con un id distinto al de quien pregunta.
    const playerParam = typeof req.query.player === 'string' ? req.query.player : ''
    const player = UUID_RE.test(playerParam) ? playerParam : null
    const scope = req.query.scope === 'all' ? 'all' : 'mine'
    const filterId = player ?? (scope === 'mine' ? userId : null)

    const result = filterId
      ? await pool.query(
          `select * from matches
           where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)
           order by played_at desc
           limit 50`,
          [filterId],
        )
      : await pool.query('select * from matches order by played_at desc limit 50')
    res.status(200).json(result.rows)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

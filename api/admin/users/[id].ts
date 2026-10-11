import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from '../../_lib/db.js'
import { ensureSchema } from '../../_lib/ensureSchema.js'
import { isAdmin } from '../../_lib/requireAdmin.js'
import { UUID_RE } from '../../_lib/validation.js'

interface Duel {
  aId?: string
  bId?: string
  aName: string
  bName: string
  scoreA: number
  scoreB: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'Usuario inválido' })
    return
  }

  if (req.method === 'PATCH') {
    const requesterId = req.body?.requesterId
    if (!(await isAdmin(pool, requesterId))) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name || name.length > 40) {
      res.status(400).json({ error: 'Nombre inválido' })
      return
    }
    const clash = await pool.query('select id from users where name_lower = lower($1) and id <> $2 limit 1', [
      name,
      id,
    ])
    if (clash.rows.length > 0) {
      res.status(409).json({ error: 'Ya hay otro usuario con ese nombre' })
      return
    }
    const updated = await pool.query('update users set name = $1 where id = $2 returning id, name, created_at, is_admin', [
      name,
      id,
    ])
    if (updated.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.status(200).json(updated.rows[0])
    return
  }

  if (req.method === 'DELETE') {
    const requesterId = typeof req.query.requesterId === 'string' ? req.query.requesterId : ''
    if (!(await isAdmin(pool, requesterId))) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }
    await pool.query('delete from users where id = $1', [id])
    res.status(204).end()
    return
  }

  if (req.method === 'POST') {
    // Fusionar: todos los partidos de `id` (fromUserId) pasan a intoUserId, y se borra `id`.
    const requesterId = req.body?.requesterId
    if (!(await isAdmin(pool, requesterId))) {
      res.status(403).json({ error: 'No autorizado' })
      return
    }

    const fromUserId = id
    const intoUserId = req.body?.intoUserId
    if (typeof intoUserId !== 'string' || !UUID_RE.test(intoUserId) || intoUserId === fromUserId) {
      res.status(400).json({ error: 'Elegí dos usuarios distintos' })
      return
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const usersResult = await client.query('select id, name from users where id = any($1::uuid[])', [
        [fromUserId, intoUserId],
      ])
      const fromUser = usersResult.rows.find((u) => u.id === fromUserId)
      const intoUser = usersResult.rows.find((u) => u.id === intoUserId)
      if (!fromUser || !intoUser) {
        await client.query('ROLLBACK')
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }

      const matchesResult = await client.query(
        `select id, team_a_player_ids, team_a_player_names, team_b_player_ids, team_b_player_names, pica_pica_rounds
         from matches
         where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)`,
        [fromUserId],
      )

      for (const m of matchesResult.rows) {
        const teamAPlayerIds: string[] = [...m.team_a_player_ids]
        const teamAPlayerNames: string[] = [...m.team_a_player_names]
        const teamBPlayerIds: string[] = [...m.team_b_player_ids]
        const teamBPlayerNames: string[] = [...m.team_b_player_names]

        // El índice en el que estaba fromUserId en ESTE partido es también el
        // índice de su duelo de pica-pica (las rondas se arman en el mismo
        // orden que team_a/b_player_ids al empezar el partido, y ese orden
        // nunca cambia después): no hace falta emparejar por nombre.
        const aIdx = teamAPlayerIds.indexOf(fromUserId)
        const bIdx = teamBPlayerIds.indexOf(fromUserId)
        if (aIdx !== -1) {
          teamAPlayerIds[aIdx] = intoUserId
          teamAPlayerNames[aIdx] = intoUser.name
        }
        if (bIdx !== -1) {
          teamBPlayerIds[bIdx] = intoUserId
          teamBPlayerNames[bIdx] = intoUser.name
        }

        const picaPicaRounds: { duels: Duel[] }[] = (m.pica_pica_rounds ?? []).map(
          (round: { duels: Duel[] }) => ({
            duels: round.duels.map((d, i) => {
              const duel = { ...d }
              if (i === aIdx) {
                duel.aId = intoUserId
                duel.aName = intoUser.name
              }
              if (i === bIdx) {
                duel.bId = intoUserId
                duel.bName = intoUser.name
              }
              return duel
            }),
          }),
        )

        await client.query(
          `update matches
           set team_a_player_ids = $1, team_a_player_names = $2,
               team_b_player_ids = $3, team_b_player_names = $4,
               pica_pica_rounds = $5::jsonb
           where id = $6`,
          [teamAPlayerIds, teamAPlayerNames, teamBPlayerIds, teamBPlayerNames, JSON.stringify(picaPicaRounds), m.id],
        )
      }

      await client.query('delete from users where id = $1', [fromUserId])
      await client.query('COMMIT')
      res.status(200).json({ mergedMatches: matchesResult.rowCount, into: intoUser.name })
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

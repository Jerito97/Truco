import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'
import { buildBracket, buildRoundRobin, shuffle } from './_lib/tournament.js'

const MAX_TEAMS = 8

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const { name, format, teams, createdBy } = b

    const teamsValid =
      Array.isArray(teams) &&
      teams.length >= 2 &&
      teams.length <= MAX_TEAMS &&
      teams.every(
        (t: unknown) =>
          typeof t === 'object' &&
          t !== null &&
          typeof (t as { name?: unknown }).name === 'string' &&
          ((t as { name: string }).name as string).trim().length > 0 &&
          Array.isArray((t as { playerIds?: unknown }).playerIds) &&
          ((t as { playerIds: unknown[] }).playerIds as unknown[]).length >= 1 &&
          ((t as { playerIds: unknown[] }).playerIds as unknown[]).length <= 3 &&
          ((t as { playerIds: unknown[] }).playerIds as unknown[]).every(
            (id) => typeof id === 'string' && UUID_RE.test(id),
          ) &&
          Array.isArray((t as { playerNames?: unknown }).playerNames) &&
          ((t as { playerNames: unknown[] }).playerNames as unknown[]).length ===
            ((t as { playerIds: unknown[] }).playerIds as unknown[]).length &&
          ((t as { playerNames: unknown[] }).playerNames as unknown[]).every((n) => typeof n === 'string'),
      )

    const valid =
      typeof name === 'string' &&
      name.trim().length > 0 &&
      (format === 'eliminacion' || format === 'todos_contra_todos') &&
      teamsValid &&
      typeof createdBy === 'string' &&
      UUID_RE.test(createdBy)

    if (!valid) {
      res.status(400).json({ error: 'Datos de torneo inválidos' })
      return
    }

    // El sorteo de la eliminación directa tiene que ser al azar (quién juega
    // contra quién, y a quién le toca bye), no en el orden en que se
    // cargaron los equipos: se baraja antes de armar el bracket y se guarda
    // ya barajado, para que los índices del bracket y de `teams` coincidan.
    const orderedTeams = format === 'eliminacion' ? shuffle(teams) : teams
    const board = format === 'eliminacion' ? buildBracket(orderedTeams.length) : buildRoundRobin(orderedTeams.length)

    const result = await pool.query(
      `insert into tournaments (name, format, teams, board, created_by)
       values ($1, $2, $3::jsonb, $4::jsonb, $5)
       returning *`,
      [name.trim(), format, JSON.stringify(orderedTeams), JSON.stringify(board), createdBy],
    )
    res.status(201).json(result.rows[0])
    return
  }

  if (req.method === 'GET') {
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    if (id) {
      if (!UUID_RE.test(id)) {
        res.status(400).json({ error: 'Id inválido' })
        return
      }
      const result = await pool.query('select * from tournaments where id = $1', [id])
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'No encontrado' })
        return
      }
      res.status(200).json(result.rows[0])
      return
    }

    const status = req.query.status === 'en_curso' || req.query.status === 'finalizado' ? req.query.status : null
    const result = status
      ? await pool.query('select * from tournaments where status = $1 order by created_at desc limit 20', [status])
      : await pool.query('select * from tournaments order by created_at desc limit 20')
    res.status(200).json(result.rows)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'
import {
  applyEliminationResult,
  applyRoundRobinResult,
  buildBracket,
  buildRoundRobin,
  getEliminationChampion,
  getRoundRobinChampion,
  isEliminationComplete,
  isRoundRobinComplete,
  shuffle,
  type Bracket,
  type RoundRobinBoard,
} from './_lib/tournament.js'

const MAX_TOURNAMENT_TEAMS = 8

// Los torneos comparten este archivo con los partidos (en vez de un
// api/tournaments.ts aparte) para no sumar una función serverless más: el
// plan Hobby de Vercel tiene un tope de 12, y ya estábamos justo en el
// límite antes de agregar esto — ver api/_lib/tournament.ts.
async function handleCreateTournament(req: VercelRequest, res: VercelResponse) {
  const pool = getPool()
  const b = req.body ?? {}
  const { name, format, teams, createdBy } = b

  const teamsValid =
    Array.isArray(teams) &&
    teams.length >= 2 &&
    teams.length <= MAX_TOURNAMENT_TEAMS &&
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
  // contra quién, y a quién le toca bye), no en el orden en que se cargaron
  // los equipos: se baraja antes de armar el bracket y se guarda ya
  // barajado, para que los índices del bracket y de `teams` coincidan.
  const orderedTeams = format === 'eliminacion' ? shuffle(teams) : teams
  const board = format === 'eliminacion' ? buildBracket(orderedTeams.length) : buildRoundRobin(orderedTeams.length)

  const result = await pool.query(
    `insert into tournaments (name, format, teams, board, created_by)
     values ($1, $2, $3::jsonb, $4::jsonb, $5)
     returning *`,
    [name.trim(), format, JSON.stringify(orderedTeams), JSON.stringify(board), createdBy],
  )
  res.status(201).json(result.rows[0])
}

async function handleGetTournament(res: VercelResponse, id: string) {
  const pool = getPool()
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
}

async function handleListTournaments(req: VercelRequest, res: VercelResponse) {
  const pool = getPool()
  const status = req.query.status === 'en_curso' || req.query.status === 'finalizado' ? req.query.status : null
  const result = status
    ? await pool.query('select * from tournaments where status = $1 order by created_at desc limit 20', [status])
    : await pool.query('select * from tournaments order by created_at desc limit 20')
  res.status(200).json(result.rows)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema()
  const pool = getPool()

  if (req.method === 'POST' && req.body?.resource === 'tournament') {
    await handleCreateTournament(req, res)
    return
  }

  if (req.method === 'GET' && typeof req.query.tournamentId === 'string') {
    await handleGetTournament(res, req.query.tournamentId)
    return
  }

  if (req.method === 'GET' && req.query.tournaments === '1') {
    await handleListTournaments(req, res)
    return
  }

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
      durationSeconds,
      scoreEvents,
      tournamentId,
      tournamentRound,
      tournamentIndex,
      tournamentWinnerIndex,
    } = b

    // Los 4 campos de torneo van siempre juntos (o ninguno): este partido es
    // un cruce de un torneo, o no lo es.
    const hasTournamentContext = tournamentId !== undefined
    const tournamentContextValid =
      !hasTournamentContext ||
      (typeof tournamentId === 'string' &&
        UUID_RE.test(tournamentId) &&
        (tournamentRound === null || typeof tournamentRound === 'number') &&
        typeof tournamentIndex === 'number' &&
        typeof tournamentWinnerIndex === 'number')

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
      (clientId === undefined || (typeof clientId === 'string' && clientId.length > 0 && clientId.length <= 100)) &&
      (durationSeconds === undefined || (typeof durationSeconds === 'number' && durationSeconds >= 0)) &&
      tournamentContextValid

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
        pica_pica_played, pica_pica_total_a, pica_pica_total_b, pica_pica_rounds,
        duration_seconds, score_events
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16::jsonb)
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
        typeof durationSeconds === 'number' ? durationSeconds : null,
        JSON.stringify(Array.isArray(scoreEvents) ? scoreEvents : []),
      ],
    )

    // Si este partido era un cruce de un torneo, hacemos avanzar su bracket
    // (o su tabla de todos-contra-todos) con el resultado. No corre dentro
    // de una transacción con el insert de arriba: en el peor caso (se cae
    // justo acá en el medio) el partido queda guardado pero el torneo no
    // avanza solo, y hay que tocar "Jugar" de nuevo para ese cruce.
    if (hasTournamentContext) {
      const tRes = await pool.query('select * from tournaments where id = $1', [tournamentId])
      const trow = tRes.rows[0]
      if (trow && trow.status === 'en_curso') {
        const matchId = result.rows[0].id
        let board
        let complete: boolean
        let champion: number | null
        if (trow.format === 'eliminacion') {
          board = applyEliminationResult(trow.board as Bracket, tournamentRound, tournamentIndex, matchId, tournamentWinnerIndex)
          complete = isEliminationComplete(board)
          champion = complete ? getEliminationChampion(board) : null
        } else {
          board = applyRoundRobinResult(trow.board as RoundRobinBoard, tournamentIndex, matchId, tournamentWinnerIndex)
          complete = isRoundRobinComplete(board)
          // Puede dar null igual estando completo (empate en el primer puesto).
          champion = complete ? getRoundRobinChampion(board, (trow.teams as unknown[]).length) : null
        }
        await pool.query(
          `update tournaments
           set board = $1::jsonb, status = $2, champion_team_index = $3, finished_at = $4
           where id = $5`,
          [JSON.stringify(board), complete ? 'finalizado' : 'en_curso', champion, complete ? new Date().toISOString() : null, tournamentId],
        )
      }
    }

    // Reintento de un partido que ya se había guardado (conflicto por
    // client_id): el "do update" no cambia nada de verdad, pero nos deja
    // devolver la fila existente en la misma consulta en vez de una
    // segunda ida a la base.
    res.status(201).json(result.rows[0])
    return
  }

  if (req.method === 'PUT') {
    // Upsert del marcador de un partido en vivo: lo llama el dispositivo que
    // está jugando, solo, cada vez que cambia el resultado (ver
    // useLiveMatchSync) — nadie aprieta un botón aparte para esto.
    const b = req.body ?? {}
    const { id, teamAName, teamBName, teamAPlayerNames, teamBPlayerNames, scoreA, scoreB } = b

    const valid =
      typeof id === 'string' &&
      id.length > 0 &&
      id.length <= 100 &&
      typeof teamAName === 'string' &&
      typeof teamBName === 'string' &&
      Array.isArray(teamAPlayerNames) &&
      teamAPlayerNames.every((n: unknown) => typeof n === 'string') &&
      Array.isArray(teamBPlayerNames) &&
      teamBPlayerNames.every((n: unknown) => typeof n === 'string') &&
      typeof scoreA === 'number' &&
      typeof scoreB === 'number'

    if (!valid) {
      res.status(400).json({ error: 'Datos de partido en vivo inválidos' })
      return
    }

    await pool.query(
      `insert into live_matches (id, team_a_name, team_b_name, team_a_player_names, team_b_player_names, score_a, score_b, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7, now())
       on conflict (id) do update set
         team_a_name = excluded.team_a_name,
         team_b_name = excluded.team_b_name,
         team_a_player_names = excluded.team_a_player_names,
         team_b_player_names = excluded.team_b_player_names,
         score_a = excluded.score_a,
         score_b = excluded.score_b,
         updated_at = now()`,
      [id, teamAName, teamBName, teamAPlayerNames, teamBPlayerNames, scoreA, scoreB],
    )
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'DELETE') {
    // Avisa que un partido dejó de estar en vivo (terminó o se descartó).
    const id = typeof req.query.id === 'string' ? req.query.id : ''
    if (!id) {
      res.status(400).json({ error: 'Falta id' })
      return
    }
    await pool.query('delete from live_matches where id = $1', [id])
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    if (req.query.live === '1') {
      // Limpieza oportunista: un partido abandonado sin terminar (se cerró
      // la app a mitad de partida) no debería quedar "en vivo" para
      // siempre, así que lo que no se actualiza en 12hs se descarta acá
      // mismo en vez de necesitar un cron aparte.
      await pool.query("delete from live_matches where updated_at < now() - interval '12 hours'")
      const liveResult = await pool.query(
        `select id, team_a_name, team_b_name, team_a_player_names, team_b_player_names, score_a, score_b, updated_at
         from live_matches
         order by updated_at desc`,
      )
      res.status(200).json(liveResult.rows)
      return
    }

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
    // against (solo tiene efecto junto con player) arma el cara a cara:
    // partidos donde player y against jugaron en equipos contrarios.
    const playerParam = typeof req.query.player === 'string' ? req.query.player : ''
    const player = UUID_RE.test(playerParam) ? playerParam : null
    const againstParam = typeof req.query.against === 'string' ? req.query.against : ''
    const against = player && UUID_RE.test(againstParam) ? againstParam : null
    const scope = req.query.scope === 'all' ? 'all' : 'mine'
    const filterId = player ?? (scope === 'mine' ? userId : null)

    let result
    if (player && against) {
      result = await pool.query(
        `select * from matches
         where ($1 = any(team_a_player_ids) and $2 = any(team_b_player_ids))
            or ($1 = any(team_b_player_ids) and $2 = any(team_a_player_ids))
         order by played_at desc
         limit 50`,
        [player, against],
      )
    } else if (filterId) {
      result = await pool.query(
        `select * from matches
         where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)
         order by played_at desc
         limit 50`,
        [filterId],
      )
    } else {
      result = await pool.query('select * from matches order by played_at desc limit 50')
    }
    res.status(200).json(result.rows)
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

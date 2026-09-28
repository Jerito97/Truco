import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'

interface Duel {
  aId?: string
  bId?: string
  aName: string
  bName: string
  scoreA: number
  scoreB: number
}

interface MatchForRecord {
  team_a_player_ids: string[]
  team_a_player_names: string[]
  team_b_player_ids: string[]
  team_b_player_names: string[]
  pica_pica_rounds: { duels: Duel[] }[]
}

// Separada del handler para poder testearla sin base de datos. Cada duelo
// guarda aId/bId desde que empezamos a persistirlos; los partidos de antes
// solo tienen el nombre de ese momento, así que para esos caemos al nombre
// tal cual estaba guardado en ESE partido (no el nombre actual del
// jugador, por si se renombró después).
export function computePicaPicaRecord(matches: MatchForRecord[], userId: string): { played: number; won: number } {
  let played = 0
  let won = 0
  for (const m of matches) {
    const aIdx = m.team_a_player_ids.indexOf(userId)
    const bIdx = m.team_b_player_ids.indexOf(userId)
    for (const round of m.pica_pica_rounds) {
      for (const duel of round.duels) {
        const isA = duel.aId !== undefined ? duel.aId === userId : aIdx !== -1 && duel.aName === m.team_a_player_names[aIdx]
        const isB = duel.bId !== undefined ? duel.bId === userId : bIdx !== -1 && duel.bName === m.team_b_player_names[bIdx]
        if (!isA && !isB) continue
        played += 1
        if ((isA && duel.scoreA > duel.scoreB) || (isB && duel.scoreB > duel.scoreA)) won += 1
      }
    }
  }
  return { played, won }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  await ensureSchema()
  const pool = getPool()

  const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
  if (!userId || !UUID_RE.test(userId)) {
    res.status(400).json({ error: 'Falta userId' })
    return
  }

  const result = await pool.query(
    `select team_a_player_ids, team_a_player_names, team_b_player_ids, team_b_player_names, pica_pica_rounds
     from matches
     where pica_pica_played = true
       and ($1 = any(team_a_player_ids) or $1 = any(team_b_player_ids))`,
    [userId],
  )

  const { played, won } = computePicaPicaRecord(result.rows, userId)
  res.status(200).json({ played, won })
}

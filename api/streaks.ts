import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPool } from './_lib/db.js'
import { ensureSchema } from './_lib/ensureSchema.js'
import { UUID_RE } from './_lib/validation.js'
import { computeTier } from './_lib/tier.js'
import { buildGeminiRequestBody, extractReplyText, isValidChatMessages, type ChatMessage } from './_lib/kak.js'

const GEMINI_MODEL = 'gemini-3.8-flash'

// El chat con "Kak" vive en este mismo archivo (en vez de un api/kak.ts
// aparte) por el mismo motivo que los torneos viven en matches.ts: el plan
// Hobby de Vercel tiene un tope de 12 funciones serverless y ya estábamos
// justo en el límite.
async function handleKak(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en las variables de entorno de Vercel.' })
    return
  }

  const messages = req.body?.messages as unknown
  if (!isValidChatMessages(messages)) {
    res.status(400).json({ error: 'Mensajes inválidos' })
    return
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiRequestBody(messages as ChatMessage[])),
        // Si Gemini se cuelga, que falle rápido y avise en vez de dejar al
        // cliente esperando hasta que el límite de tiempo de la función de
        // Vercel la corte de mala manera (eso sí se queda "pensando" para
        // siempre en la app).
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!geminiRes.ok) {
      console.error('Gemini respondió', geminiRes.status, await geminiRes.text())
      res.status(502).json({ error: 'No se pudo conectar con Kak ahora. Probá de nuevo en un rato.' })
      return
    }
    const reply = extractReplyText(await geminiRes.json())
    if (!reply) {
      res.status(502).json({ error: 'Kak se quedó sin palabras. Probá de nuevo.' })
      return
    }
    res.status(200).json({ reply })
  } catch (err) {
    console.error('kak chat failed', err)
    res.status(502).json({ error: 'No se pudo conectar con Kak ahora. Probá de nuevo en un rato.' })
  }
}

// Separada del handler para poder testearla sin una base de datos: recibe
// las filas ya en orden cronológico ascendente.
export function computeStreaks(
  rows: { winner: 'A' | 'B'; team_a_player_ids: string[] }[],
  userId: string,
): { current: number; best: number } {
  let best = 0
  let running = 0
  for (const row of rows) {
    const onA = row.team_a_player_ids.includes(userId)
    const won = (onA && row.winner === 'A') || (!onA && row.winner === 'B')
    if (won) {
      running += 1
      if (running > best) best = running
    } else {
      running = 0
    }
  }
  // Como las filas vienen en orden cronológico, "running" al final es la
  // racha que sigue vigente hasta el partido más reciente (0 si el último
  // partido lo perdió).
  return { current: running, best }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST' && req.body?.resource === 'kak') {
    await handleKak(req, res)
    return
  }

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

  // Traemos TODO el historial del jugador (no los últimos 50 que usa el
  // historial general) porque la mejor racha puede estar en cualquier
  // punto: no alcanza con mirar solo los partidos más recientes.
  const result = await pool.query(
    `select winner, team_a_player_ids
     from matches
     where $1 = any(team_a_player_ids) or $1 = any(team_b_player_ids)
     order by played_at asc`,
    [userId],
  )

  const { current, best } = computeStreaks(result.rows, userId)
  const tier = computeTier(result.rows, userId)
  res.status(200).json({ current, best, tier })
}

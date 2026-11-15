import { useEffect, useState } from 'react'

export interface LiveMatch {
  id: string
  team_a_name: string
  team_b_name: string
  team_a_player_names: string[]
  team_b_player_names: string[]
  score_a: number
  score_b: number
  updated_at: string
}

const POLL_MS = 15000

// Partidos que algún dispositivo del grupo está jugando ahora mismo (ver
// useLiveMatchSync). Sondea en vez de algo más elaborado porque el Inicio es
// la única pantalla que lo necesita y un grupo de amigos no genera tráfico
// como para justificar más que eso.
export function useLiveMatches(): LiveMatch[] | null {
  const [matches, setMatches] = useState<LiveMatch[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetch('/api/matches?live=1')
        .then((r) => {
          if (!r.ok) throw new Error()
          return r.json() as Promise<LiveMatch[]>
        })
        .then((rows) => {
          if (!cancelled) setMatches(rows)
        })
        .catch(() => {
          // Un sondeo fallido no debería hacer desaparecer la lista que ya
          // se había mostrado: simplemente se reintenta en el próximo tick.
        })
    }
    load()
    const interval = window.setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return matches
}

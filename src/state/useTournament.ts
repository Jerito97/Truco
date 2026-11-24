import { useEffect, useState } from 'react'
import type { Tournament } from '../types'

// Un torneo puntual por id, con refreshKey para forzar un refetch (por
// ejemplo al volver de jugar un cruce).
export function useTournament(id: string | null, refreshKey: number) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setTournament(null)
    setError(false)
    fetch(`/api/tournaments?id=${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<Tournament>
      })
      .then((t) => {
        if (!cancelled) setTournament(t)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [id, refreshKey])

  return { tournament, error }
}

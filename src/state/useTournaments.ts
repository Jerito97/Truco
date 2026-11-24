import { useEffect, useState } from 'react'
import type { Tournament } from '../types'

// Lista de torneos (en curso y/o terminados) para la pantalla de Torneos.
export function useTournaments(refreshKey: number) {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setTournaments(null)
    setError(false)
    fetch('/api/matches?tournaments=1')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<Tournament[]>
      })
      .then((rows) => {
        if (!cancelled) setTournaments(rows)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return { tournaments, error }
}

import { useEffect, useState } from 'react'
import type { FinishedMatch } from '../types'

export function useMatches(userId: string, refreshKey: number, scope: 'mine' | 'all' = 'mine') {
  const [matches, setMatches] = useState<FinishedMatch[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setMatches(null)
    setError(false)
    const scopeParam = scope === 'all' ? '&scope=all' : ''
    fetch(`/api/matches?userId=${encodeURIComponent(userId)}${scopeParam}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<FinishedMatch[]>
      })
      .then((rows) => {
        if (!cancelled) setMatches(rows)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey, scope])

  return { matches, error }
}

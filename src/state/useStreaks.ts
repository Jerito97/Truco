import { useEffect, useState } from 'react'

interface Streaks {
  current: number
  best: number
}

export function useStreaks(userId: string, refreshKey: number) {
  const [streaks, setStreaks] = useState<Streaks | null>(null)

  useEffect(() => {
    let cancelled = false
    setStreaks(null)
    fetch(`/api/streaks?userId=${encodeURIComponent(userId)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<Streaks>
      })
      .then((s) => {
        if (!cancelled) setStreaks(s)
      })
      .catch(() => {
        if (!cancelled) setStreaks(null)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  return streaks
}

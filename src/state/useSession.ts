import { useCallback, useEffect, useState } from 'react'
import type { User } from '../types'

const SESSION_KEY = 'la-mesa-session-v1'

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function useSession() {
  const [user, setUser] = useState<User | null>(() => loadSession())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const register = useCallback(async (name: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('No se pudo entrar. Probá de nuevo.')
      const found = (await res.json()) as User
      setUser(found)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => setUser(null), [])

  return { user, loading, error, register, logout }
}

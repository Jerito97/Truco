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
  const [pendingName, setPendingName] = useState<string | null>(null)

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  }, [user])

  const register = useCallback(async (name: string, confirm = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, confirm }),
      })
      if (!res.ok) throw new Error('No se pudo entrar. Probá de nuevo.')
      const data = (await res.json()) as { exists: boolean; id?: string; name: string; created_at?: string }
      if (data.exists) {
        setPendingName(data.name)
        return
      }
      setPendingName(null)
      setUser({ id: data.id as string, name: data.name, created_at: data.created_at })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmPending = useCallback(() => {
    if (pendingName) register(pendingName, true)
  }, [pendingName, register])

  const cancelPending = useCallback(() => setPendingName(null), [])

  const logout = useCallback(() => setUser(null), [])

  return { user, loading, error, pendingName, register, confirmPending, cancelPending, logout }
}

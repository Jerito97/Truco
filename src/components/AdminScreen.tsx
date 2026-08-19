import { useEffect, useState } from 'react'
import type { User } from '../types'
import { BackIcon } from './icons'

interface AdminUser {
  id: string
  name: string
  created_at: string
  is_admin: boolean
}

interface AdminMatch {
  id: string
  played_at: string
  team_a_name: string
  team_b_name: string
  team_a_player_names: string[]
  team_b_player_names: string[]
  score_a: number
  score_b: number
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function UsersPanel({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setError(null)
    fetch(`/api/admin/users?requesterId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<AdminUser[]>
      })
      .then(setUsers)
      .catch(() => setError('No se pudo cargar la lista de usuarios.'))
  }

  useEffect(load, [currentUser.id])

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id)
    setEditValue(u.name)
  }

  const saveEdit = async (id: string) => {
    const name = editValue.trim()
    setEditingId(null)
    if (!name) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id, name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo renombrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (u: AdminUser) => {
    if (!window.confirm(`¿Borrar a "${u.name}"? Esto no se puede deshacer.`)) return
    setBusyId(u.id)
    try {
      const res = await fetch(`/api/admin/users/${u.id}?requesterId=${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo borrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-center py-2" style={{ color: '#d9695f' }}>
          {error}
        </p>
      )}
      {users === null && !error && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {users && users.length === 0 && <p className="text-center opacity-60 py-6">No hay usuarios registrados.</p>}
      {users && users.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 py-3">
              {editingId === u.id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(u.id)}
                  onBlur={() => saveEdit(u.id)}
                  autoFocus
                  maxLength={40}
                  className="flex-1 rounded-md px-2 py-1 border outline-none"
                  style={{
                    borderColor: 'var(--color-ember-600)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--color-paper-50)',
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(u)}
                  disabled={busyId === u.id}
                  className="flex-1 text-left truncate disabled:opacity-30"
                  style={{ color: 'var(--color-paper-100)' }}
                >
                  {u.name}
                  {u.is_admin && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--color-ember-500)' }}>
                      admin
                    </span>
                  )}
                  {u.id === currentUser.id && <span className="ml-2 text-xs opacity-50">(vos)</span>}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(u)}
                disabled={busyId === u.id}
                className="text-xs font-bold px-2 py-1.5 rounded-md border shrink-0 disabled:opacity-30"
                style={{ borderColor: '#8a3f38', color: '#d9695f' }}
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MatchesPanel({ currentUser }: { currentUser: User }) {
  const [matches, setMatches] = useState<AdminMatch[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setError(null)
    fetch(`/api/admin/matches?requesterId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<AdminMatch[]>
      })
      .then(setMatches)
      .catch(() => setError('No se pudo cargar la lista de partidos.'))
  }

  useEffect(load, [currentUser.id])

  const remove = async (m: AdminMatch) => {
    if (!window.confirm(`¿Borrar el partido ${m.team_a_name} ${m.score_a}-${m.score_b} ${m.team_b_name}?`)) return
    setBusyId(m.id)
    try {
      const res = await fetch(`/api/admin/matches/${m.id}?requesterId=${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo borrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-center py-2" style={{ color: '#d9695f' }}>
          {error}
        </p>
      )}
      {matches === null && !error && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {matches && matches.length === 0 && <p className="text-center opacity-60 py-6">No hay partidos registrados.</p>}
      {matches && matches.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {matches.map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm" style={{ color: 'var(--color-paper-100)' }}>
                  {m.team_a_player_names.join(', ')} <span className="opacity-40">vs</span>{' '}
                  {m.team_b_player_names.join(', ')}
                </p>
                <p className="text-xs opacity-50 mt-0.5">
                  {formatDate(m.played_at)} · {m.score_a} - {m.score_b}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(m)}
                disabled={busyId === m.id}
                className="text-xs font-bold px-2 py-1.5 rounded-md border shrink-0 disabled:opacity-30"
                style={{ borderColor: '#8a3f38', color: '#d9695f' }}
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [section, setSection] = useState<'users' | 'matches'>('users')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Administrar
        </h2>
        <span className="w-5" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSection('users')}
          className="py-2 rounded-lg font-bold border text-sm"
          style={{
            borderColor: section === 'users' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
            color: section === 'users' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
          }}
        >
          Usuarios
        </button>
        <button
          type="button"
          onClick={() => setSection('matches')}
          className="py-2 rounded-lg font-bold border text-sm"
          style={{
            borderColor: section === 'matches' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
            color: section === 'matches' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
          }}
        >
          Partidos
        </button>
      </div>

      {section === 'users' ? <UsersPanel currentUser={currentUser} /> : <MatchesPanel currentUser={currentUser} />}
    </div>
  )
}

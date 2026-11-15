import { useEffect, useState } from 'react'
import type { User } from '../types'
import { BackIcon, ChevronRightIcon } from './icons'
import { PlayerProfileScreen } from './PlayerProfileScreen'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function PlayersScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [players, setPlayers] = useState<User[] | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)

  useEffect(() => {
    fetch('/api/users/search')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<User[]>
      })
      .then(setPlayers)
      .catch(() => setError(true))
  }, [])

  if (selected) {
    return <PlayerProfileScreen player={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Jugadores
        </h2>
        <span className="w-5" />
      </div>

      {error && (
        <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
          No se pudo cargar la lista de jugadores.
        </p>
      )}
      {!error && players === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {!error && players && players.length === 0 && (
        <p className="text-center opacity-60 py-6">Todavía no hay nadie registrado.</p>
      )}
      {!error && players && players.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <div
                className="w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shrink-0"
                style={{ borderColor: 'var(--color-ember-500)', color: 'var(--color-ember-500)' }}
              >
                {initials(p.name)}
              </div>
              <span
                className="flex-1 font-bold truncate"
                style={{ color: p.id === currentUser.id ? 'var(--color-ember-500)' : 'var(--color-paper-100)' }}
              >
                {p.name}
                {p.id === currentUser.id && <span className="ml-2 text-xs opacity-50">(vos)</span>}
              </span>
              <ChevronRightIcon className="w-4 h-4 opacity-40 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

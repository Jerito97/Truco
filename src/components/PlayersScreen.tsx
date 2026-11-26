import { useEffect, useState } from 'react'
import type { User } from '../types'
import { ChevronRightIcon } from './icons'
import { PlayerProfileScreen } from './PlayerProfileScreen'
import { TierTag } from './PlayerStats'
import { useScrollToTop } from '../state/useScrollToTop'
import { ScreenHeader } from './ScreenHeader'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function PlayersScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  useScrollToTop()
  const [players, setPlayers] = useState<User[] | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  // Arranca apagado (se ve todo el mundo, con y sin tier); al prenderlo
  // deja solo a los que ya tienen uno asignado.
  const [onlyWithTier, setOnlyWithTier] = useState(false)

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

  const filteredPlayers = onlyWithTier ? (players?.filter((p) => p.tier != null) ?? null) : players

  return (
    <div className="screen-fill flex flex-col gap-4">
      <ScreenHeader title="Jugadores" onBack={onBack} />

      <button
        type="button"
        onClick={() => setOnlyWithTier((v) => !v)}
        className="py-2 rounded-lg font-bold text-sm border self-start px-4"
        style={{
          borderColor: onlyWithTier ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
          color: onlyWithTier ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
          backgroundColor: onlyWithTier ? 'rgba(203, 170, 106, 0.1)' : 'transparent',
        }}
      >
        Con tier
      </button>

      <div className="flex-1 flex flex-col min-h-0" style={{ justifyContent: 'safe center' }}>
        {error && (
          <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
            No se pudo cargar la lista de jugadores.
          </p>
        )}
        {!error && filteredPlayers === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
        {!error && filteredPlayers && filteredPlayers.length === 0 && (
          <p className="text-center opacity-60 py-6">
            {onlyWithTier ? 'Todavía nadie tiene un tier asignado.' : 'Todavía no hay nadie registrado.'}
          </p>
        )}
        {!error && filteredPlayers && filteredPlayers.length > 0 && (
          <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
            {filteredPlayers.map((p) => (
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
                {p.tier != null && <TierTag tier={p.tier} />}
                <ChevronRightIcon className="w-4 h-4 opacity-40 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

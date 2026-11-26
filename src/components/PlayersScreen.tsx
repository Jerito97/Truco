import { useEffect, useState } from 'react'
import type { User } from '../types'
import { ChevronRightIcon, SearchIcon } from './icons'
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

type TierFilter = 'todos' | 'con' | 'sin'

const TIER_FILTER_LABEL: Record<TierFilter, string> = {
  todos: 'Todos',
  con: 'Con tier',
  sin: 'Sin tier',
}

function matchesTierFilter(p: User, filter: TierFilter): boolean {
  if (filter === 'con') return p.tier != null
  if (filter === 'sin') return p.tier == null
  return true
}

export function PlayersScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  useScrollToTop()
  const [players, setPlayers] = useState<User[] | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const [tierFilter, setTierFilter] = useState<TierFilter>('todos')
  // Arranca cerrada (sin teclado saltando solo): hay que tocar la lupa de
  // arriba para pedirla, igual que en Historial.
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

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

  const normalizedQuery = query.trim().toLowerCase()
  const filteredPlayers =
    players
      ?.filter((p) => matchesTierFilter(p, tierFilter))
      .filter((p) => !normalizedQuery || p.name.toLowerCase().includes(normalizedQuery)) ?? null

  return (
    <div className="screen-fill flex flex-col gap-4">
      <ScreenHeader
        title="Jugadores"
        onBack={onBack}
        action={
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v)
              setQuery('')
            }}
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar jugador'}
          >
            <SearchIcon
              className="w-5 h-5"
              style={{ color: searchOpen ? 'var(--color-ember-500)' : 'var(--color-paper-100)' }}
            />
          </button>
        }
      />

      {searchOpen && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          autoFocus
          className="w-full rounded-lg px-3 py-2.5 border outline-none"
          style={{
            borderColor: 'rgba(203, 170, 106, 0.35)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: 'var(--color-paper-50)',
          }}
        />
      )}

      <div className="flex rounded-full border p-1 gap-1" style={{ borderColor: 'var(--color-ember-600)' }}>
        {(['todos', 'con', 'sin'] as const).map((f) => {
          const isActive = tierFilter === f
          const count = players?.filter((p) => matchesTierFilter(p, f)).length
          return (
            <button
              key={f}
              type="button"
              onClick={() => setTierFilter(f)}
              className="flex-1 py-1.5 rounded-full text-[11px] font-bold text-center truncate px-1"
              style={{
                backgroundColor: isActive ? 'var(--color-ember-500)' : 'transparent',
                color: isActive ? 'var(--color-wood-950)' : 'var(--color-paper-100)',
              }}
            >
              {TIER_FILTER_LABEL[f]}
              {count != null && ` (${count})`}
            </button>
          )
        })}
      </div>

      {/* Mientras se está buscando, el resultado va pegado justo debajo de
          los filtros (no centrado): estás mirando algo puntual que
          acabás de pedir, no un estado vacío/corto para acomodar en el
          medio de la pantalla. */}
      <div className="flex-1 flex flex-col min-h-0" style={{ justifyContent: normalizedQuery ? 'flex-start' : 'safe center' }}>
        {error && (
          <p className="text-sm text-center py-4" style={{ color: '#d9695f' }}>
            No se pudo cargar la lista de jugadores.
          </p>
        )}
        {!error && filteredPlayers === null && <p className="text-center opacity-60 py-6">Cargando...</p>}
        {!error && filteredPlayers && filteredPlayers.length === 0 && (
          <p className="text-center opacity-60 py-6">
            {normalizedQuery
              ? 'Nadie coincide con esa búsqueda.'
              : tierFilter === 'con'
                ? 'Todavía nadie tiene un tier asignado.'
                : tierFilter === 'sin'
                  ? 'Todos los jugadores ya tienen un tier asignado.'
                  : 'Todavía no hay nadie registrado.'}
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

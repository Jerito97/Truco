import { useEffect, useState } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { MatchRow } from './MatchRow'
import { SearchIcon } from './icons'

function PlayerFilterBar({
  filter,
  onSelect,
  onClear,
}: {
  filter: User | null
  onSelect: (u: User) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searchError, setSearchError] = useState(false)

  useEffect(() => {
    if (filter) return
    setSearchError(false)
    if (!query.trim()) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error()
          return r.json() as Promise<User[]>
        })
        .then(setResults)
        .catch(() => setSearchError(true))
    }, 250)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, filter])

  if (filter) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center rounded-full border pl-3" style={{ borderColor: 'var(--color-ember-600)' }}>
          <span className="text-sm font-bold py-1.5" style={{ color: 'var(--color-ember-500)' }}>
            Partidos de {filter.name}
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Quitar filtro"
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm opacity-70 shrink-0"
            style={{ color: 'var(--color-paper-100)' }}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <SearchIcon
        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
        style={{ color: 'var(--color-paper-100)' }}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrar por jugador..."
        className="w-full rounded-lg pl-9 pr-3 py-2.5 border outline-none"
        style={{
          borderColor: 'rgba(203, 170, 106, 0.35)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          color: 'var(--color-paper-50)',
        }}
      />
      {query.trim() && !searchError && results.length > 0 && (
        <div
          className="absolute z-10 mt-1 w-full rounded-lg border overflow-hidden"
          style={{ borderColor: 'rgba(203, 170, 106, 0.35)', backgroundColor: 'var(--color-wood-900)' }}
        >
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onSelect(u)
                setQuery('')
                setResults([])
              }}
              className="w-full text-left px-3 py-2.5 text-sm font-bold"
              style={{ color: 'var(--color-paper-100)' }}
            >
              {u.name}
            </button>
          ))}
        </div>
      )}
      {query.trim() && !searchError && results.length === 0 && (
        <p className="text-xs opacity-50 text-center mt-2">Nadie con ese nombre.</p>
      )}
    </div>
  )
}

export function HistorialTab({ user, refreshKey }: { user: User; refreshKey: number }) {
  const [filter, setFilter] = useState<User | null>(null)
  const { matches, error } = useMatches(user.id, refreshKey, 'all', filter?.id)

  return (
    <div className="space-y-4">
      <h2 className="font-poster text-2xl text-center" style={{ color: 'var(--color-paper-50)' }}>
        Historial
      </h2>

      <PlayerFilterBar filter={filter} onSelect={setFilter} onClear={() => setFilter(null)} />

      {error && (
        <div className="text-center py-10 opacity-70">
          <p className="font-poster text-lg mb-1">No se pudo cargar el historial</p>
          <p className="text-sm">Revisá la conexión e intentá de nuevo más tarde.</p>
        </div>
      )}

      {!error && matches === null && <div className="text-center py-10 opacity-60">Cargando...</div>}

      {!error && matches !== null && matches.length === 0 && (
        <div className="text-center py-10 opacity-70">
          {filter ? (
            <p className="font-poster text-lg mb-1">{filter.name} todavía no jugó ningún partido</p>
          ) : (
            <>
              <p className="font-poster text-lg mb-1">Todavía no hay partidos jugados</p>
              <p className="text-sm">Cuando termine un partido, va a aparecer acá.</p>
            </>
          )}
        </div>
      )}

      {!error && matches !== null && matches.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} expandable />
          ))}
        </div>
      )}
    </div>
  )
}

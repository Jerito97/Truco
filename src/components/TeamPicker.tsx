import { useEffect, useMemo, useState } from 'react'
import type { User } from '../types'
import { BackIcon } from './icons'
import { useTeamPresets, type TeamPreset } from '../state/useTeamPresets'

export function TeamPicker({
  title,
  teamSize,
  initialSelectedIds,
  excludeIds,
  knownNames,
  onConfirm,
  onBack,
}: {
  title: string
  teamSize: number
  initialSelectedIds: string[]
  excludeIds: string[]
  knownNames: Record<string, string>
  onConfirm: (ids: string[], names: Record<string, string>) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<string[]>(initialSelectedIds)
  const [known, setKnown] = useState<Record<string, string>>(knownNames)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searchError, setSearchError] = useState(false)
  const { presets, savePreset, deletePreset } = useTeamPresets()

  const matchingPresets = useMemo(
    () =>
      presets.filter(
        (p) => p.playerIds.length === teamSize && p.playerIds.every((id) => !excludeIds.includes(id)),
      ),
    [presets, teamSize, excludeIds],
  )

  useEffect(() => {
    setSearchError(false)
    const controller = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query)}&exclude=${excludeIds.join(',')}`, {
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error()
          return r.json() as Promise<User[]>
        })
        .then((rows) => {
          setResults(rows)
          setKnown((k) => {
            const next = { ...k }
            for (const r of rows) next[r.id] = r.name
            return next
          })
        })
        .catch(() => setSearchError(true))
    }, 250)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= teamSize) return prev
      return [...prev, id]
    })
  }

  const nameOf = (id: string) => known[id] ?? '?'

  const loadPreset = (preset: TeamPreset) => {
    setSelected(preset.playerIds)
    setKnown((k) => ({ ...k, ...preset.playerNames }))
  }

  const handleSavePreset = () => {
    const name = window.prompt('Nombre para este grupo (ej: "Los de siempre")')?.trim()
    if (!name) return
    const names: Record<string, string> = {}
    selected.forEach((id) => {
      names[id] = nameOf(id)
    })
    savePreset(name, selected, names)
  }

  const handleDeletePreset = (preset: TeamPreset) => {
    if (window.confirm(`¿Borrar el grupo "${preset.name}"?`)) deletePreset(preset.id)
  }

  const inputStyle = {
    borderColor: 'rgba(203, 170, 106, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'var(--color-paper-50)',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl truncate max-w-[70%]" style={{ color: 'var(--color-paper-50)' }}>
          {title}
        </h2>
        <span className="w-5" />
      </div>

      {selected.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {selected.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="px-2.5 py-1 rounded-full text-xs font-bold border"
                style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
              >
                {nameOf(id)} ×
              </button>
            ))}
          </div>
          {selected.length === teamSize && (
            <button
              type="button"
              onClick={handleSavePreset}
              className="text-xs font-bold underline"
              style={{ color: 'var(--color-paper-200)' }}
            >
              Guardar este grupo
            </button>
          )}
        </div>
      )}

      {matchingPresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs opacity-50">Grupos guardados</p>
          <div className="flex flex-wrap gap-1.5">
            {matchingPresets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center rounded-full border pl-1"
                style={{ borderColor: 'var(--color-wood-600)' }}
              >
                <button
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="px-2 py-1 text-xs font-bold"
                  style={{ color: 'var(--color-paper-100)' }}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePreset(preset)}
                  aria-label={`Borrar grupo ${preset.name}`}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-50 shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar jugador registrado..."
        className="w-full rounded-lg px-3 py-2 border outline-none"
        style={inputStyle}
      />

      {searchError && (
        <p className="text-sm text-center py-2" style={{ color: '#d9695f' }}>
          No se pudo buscar jugadores. Revisá la conexión e intentá de nuevo.
        </p>
      )}

      {!searchError && results.length === 0 && (
        <p className="text-sm opacity-60 text-center py-3">
          {query ? 'Nadie con ese nombre todavía.' : 'Escribí para buscar jugadores registrados.'}
        </p>
      )}

      <ul className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
        {results.map((u) => {
          const isSelected = selected.includes(u.id)
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => toggle(u.id)}
                disabled={!isSelected && selected.length >= teamSize}
                className="w-full flex items-center justify-between py-2.5 disabled:opacity-30"
              >
                <span style={{ color: 'var(--color-paper-100)' }}>{u.name}</span>
                <span
                  className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold"
                  style={{
                    borderColor: isSelected ? 'var(--color-ember-500)' : 'var(--color-wood-600)',
                    backgroundColor: isSelected ? 'var(--color-ember-500)' : 'transparent',
                    color: isSelected ? 'var(--color-wood-950)' : 'transparent',
                  }}
                >
                  ✓
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => onConfirm(selected, known)}
        disabled={selected.length !== teamSize}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border disabled:opacity-30"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        Confirmar ({selected.length}/{teamSize})
      </button>
    </div>
  )
}

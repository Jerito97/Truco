import { useEffect, useMemo, useState } from 'react'
import type { User } from '../types'
import { BackIcon, CardsIcon, PlusIcon, SearchIcon } from './icons'
import { useTeamPresets, type TeamPreset } from '../state/useTeamPresets'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 text-xs tracking-widest uppercase font-bold"
      style={{ color: 'var(--color-ember-500)' }}
    >
      <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(203, 170, 106, 0.25)' }} />
      <span>◆ {children} ◆</span>
      <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(203, 170, 106, 0.25)' }} />
    </div>
  )
}

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

  // Solo mostramos presets que calzan con el tamaño de equipo actual y que no
  // pisan a nadie ya elegido para el otro equipo.
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

  const remaining = teamSize - selected.length
  const inputStyle = {
    borderColor: 'rgba(203, 170, 106, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'var(--color-paper-50)',
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} aria-label="Volver">
            <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
          </button>
          <div
            className="px-3 py-1 rounded-full border text-sm font-bold"
            style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
          >
            {selected.length}/{teamSize}
          </div>
        </div>

        <div className="text-center space-y-1 mt-1">
          <p className="text-sm tracking-[0.3em]" style={{ color: 'var(--color-ember-500)', opacity: 0.7 }}>
            ♣ ♥ ♦ ♠
          </p>
          <h2 className="font-poster text-2xl truncate" style={{ color: 'var(--color-paper-50)' }}>
            {title}
          </h2>
          <p className="text-sm opacity-60">Elegí a los jugadores de tu equipo</p>
        </div>
      </div>

      <SectionLabel>Tu equipo</SectionLabel>

      <div className="flex justify-center gap-3">
        {Array.from({ length: teamSize }).map((_, i) => {
          const id = selected[i]
          return (
            <button
              key={i}
              type="button"
              onClick={() => id && toggle(id)}
              className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl border flex flex-col items-center justify-center gap-1.5 px-1"
              style={{
                borderStyle: id ? 'solid' : 'dashed',
                borderColor: id ? 'var(--color-ember-600)' : 'rgba(203, 170, 106, 0.35)',
                backgroundColor: id ? 'rgba(203, 170, 106, 0.08)' : 'transparent',
              }}
            >
              {id ? (
                <>
                  <div
                    className="w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm"
                    style={{ borderColor: 'var(--color-ember-500)', color: 'var(--color-ember-500)' }}
                  >
                    {initials(nameOf(id))}
                  </div>
                  <span className="text-xs truncate max-w-full" style={{ color: 'var(--color-paper-100)' }}>
                    {nameOf(id)}
                  </span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-6 h-6 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
                  <span className="text-xs opacity-40">Jugador {i + 1}</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {remaining > 0 ? (
        <p className="text-sm opacity-60 text-center -mt-2">
          Elegí {remaining} jugador{remaining === 1 ? '' : 'es'} para continuar
        </p>
      ) : (
        <button
          type="button"
          onClick={handleSavePreset}
          className="block mx-auto text-xs font-bold underline -mt-2"
          style={{ color: 'var(--color-paper-200)' }}
        >
          Guardar este grupo
        </button>
      )}

      {matchingPresets.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Grupos guardados</SectionLabel>
          <div className="flex flex-wrap justify-center gap-1.5">
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

      <div className="space-y-3">
        <div className="relative">
          <SearchIcon
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
            style={{ color: 'var(--color-paper-100)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador registrado..."
            className="w-full rounded-lg pl-9 pr-3 py-2.5 border outline-none"
            style={inputStyle}
          />
        </div>

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

        {!searchError && results.length > 0 && (
          <>
            <SectionLabel>Jugadores registrados</SectionLabel>
            <div className="space-y-2.5">
              {results.map((u) => {
                const isSelected = selected.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    disabled={!isSelected && selected.length >= teamSize}
                    className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left disabled:opacity-30"
                    style={{
                      borderColor: isSelected ? 'var(--color-ember-600)' : 'rgba(203, 170, 106, 0.2)',
                      backgroundColor: isSelected ? 'rgba(203, 170, 106, 0.08)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-full border flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ borderColor: 'var(--color-ember-500)', color: 'var(--color-ember-500)' }}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--color-paper-50)' }}>
                        {u.name}
                      </p>
                      <p className="text-xs opacity-50">Jugador registrado</p>
                    </div>
                    <span
                      className="w-6 h-6 rounded-full border flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        borderColor: isSelected ? 'var(--color-ember-500)' : 'var(--color-wood-600)',
                        backgroundColor: isSelected ? 'var(--color-ember-500)' : 'transparent',
                        color: isSelected ? 'var(--color-wood-950)' : 'transparent',
                      }}
                    >
                      ✓
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onConfirm(selected, known)}
        disabled={remaining > 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-poster text-lg tracking-wide border disabled:opacity-50"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        <CardsIcon className="w-5 h-5" />
        {remaining > 0 ? `Seleccioná ${remaining} jugador${remaining === 1 ? '' : 'es'}` : 'Confirmar equipo'}
      </button>
    </div>
  )
}

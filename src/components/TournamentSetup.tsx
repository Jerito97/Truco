import { useEffect, useState } from 'react'
import type { Tournament, TournamentFormat, User } from '../types'
import { suggestFormat } from '../lib/tournament'
import { BackIcon, ChevronRightIcon, PeopleIcon, PlusIcon } from './icons'
import { TeamPicker } from './TeamPicker'

const TEAM_SIZE_OPTIONS = [1, 2, 3] as const
const MIN_TEAMS = 2
const MAX_TEAMS = 8

const FORMAT_LABEL: Record<TournamentFormat, string> = {
  eliminacion: 'Eliminación directa',
  todos_contra_todos: 'Todos contra todos',
}

interface DraftTeam {
  name: string
  ids: string[]
}

export function TournamentSetup({
  currentUser,
  onCreated,
  onBack,
}: {
  currentUser: User
  onCreated: (tournament: Tournament) => void
  onBack: () => void
}) {
  const [name, setName] = useState('')
  const [teamSize, setTeamSize] = useState(3)
  const [teams, setTeams] = useState<DraftTeam[]>([{ name: 'Equipo 1', ids: [] }, { name: 'Equipo 2', ids: [] }])
  const [known, setKnown] = useState<Record<string, string>>({ [currentUser.id]: currentUser.name })
  const [pickingIndex, setPickingIndex] = useState<number | null>(null)
  const [formatOverride, setFormatOverride] = useState<TournamentFormat | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const suggested = suggestFormat(teams.length)
  const format = formatOverride ?? suggested

  // Cada vez que cambia la cantidad de equipos, el formato vuelve a ser el
  // sugerido (si eligieron uno a mano antes, puede no tener sentido para la
  // nueva cantidad).
  useEffect(() => {
    setFormatOverride(null)
  }, [teams.length])

  const changeTeamSize = (size: number) => {
    if (size === teamSize) return
    setTeamSize(size)
    setTeams((ts) => ts.map((t) => ({ ...t, ids: [] })))
  }

  const nameOf = (id: string) => known[id] ?? '?'

  const addTeam = () => {
    if (teams.length >= MAX_TEAMS) return
    setTeams((ts) => [...ts, { name: `Equipo ${ts.length + 1}`, ids: [] }])
  }

  const removeTeam = (index: number) => {
    if (teams.length <= MIN_TEAMS) return
    setTeams((ts) => ts.filter((_, i) => i !== index))
  }

  const renameTeam = (index: number, value: string) => {
    setTeams((ts) => ts.map((t, i) => (i === index ? { ...t, name: value } : t)))
  }

  const ready = teams.every((t) => t.ids.length === teamSize)
  const canCreate = !creating && name.trim().length > 0 && ready && teams.every((t) => t.name.trim().length > 0)

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          format,
          teams: teams.map((t) => ({ name: t.name.trim(), playerIds: t.ids, playerNames: t.ids.map(nameOf) })),
          createdBy: currentUser.id,
        }),
      })
      if (!res.ok) throw new Error()
      const tournament = (await res.json()) as Tournament
      onCreated(tournament)
    } catch {
      setCreateError('No se pudo crear el torneo. Revisá la conexión e intentá de nuevo.')
    } finally {
      setCreating(false)
    }
  }

  if (pickingIndex !== null) {
    const otherIds = teams.flatMap((t, i) => (i === pickingIndex ? [] : t.ids))
    return (
      <TeamPicker
        title={teams[pickingIndex].name || `Equipo ${pickingIndex + 1}`}
        teamSize={teamSize}
        initialSelectedIds={teams[pickingIndex].ids}
        excludeIds={otherIds}
        knownNames={known}
        onBack={() => setPickingIndex(null)}
        onConfirm={(ids, names) => {
          setTeams((ts) => ts.map((t, i) => (i === pickingIndex ? { ...t, ids } : t)))
          setKnown((k) => ({ ...k, ...names }))
          setPickingIndex(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Armar torneo
        </h2>
        <span className="w-5" />
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del torneo (ej: Asado de fin de año)"
        className="w-full rounded-xl px-4 py-3 border outline-none font-poster text-lg"
        style={{
          borderColor: 'rgba(203, 170, 106, 0.35)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          color: 'var(--color-paper-50)',
        }}
      />

      <div className="grid grid-cols-3 gap-2">
        {TEAM_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => changeTeamSize(size)}
            className="py-2 rounded-lg font-bold border text-sm"
            style={{
              borderColor: teamSize === size ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: teamSize === size ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            {size} vs {size}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {teams.map((t, i) => (
          <div key={i} className="rounded-2xl border px-4 py-4" style={{ borderColor: 'rgba(203, 170, 106, 0.3)' }}>
            <div className="flex items-center gap-2 mb-3">
              <input
                value={t.name}
                onChange={(e) => renameTeam(i, e.target.value)}
                placeholder={`Equipo ${i + 1}`}
                className="font-poster text-lg bg-transparent outline-none flex-1 min-w-0"
                style={{ color: 'var(--color-paper-50)' }}
              />
              {teams.length > MIN_TEAMS && (
                <button
                  type="button"
                  onClick={() => removeTeam(i)}
                  aria-label={`Quitar ${t.name}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 opacity-60"
                  style={{ color: 'var(--color-paper-100)' }}
                >
                  ×
                </button>
              )}
            </div>
            <button type="button" onClick={() => setPickingIndex(i)} className="w-full flex items-center gap-3 text-left">
              <PeopleIcon className="w-6 h-6 shrink-0" style={{ color: 'var(--color-ember-500)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--color-paper-100)' }}>
                  {t.ids.length === 0 ? 'Elegir jugadores' : t.ids.map(nameOf).join(', ')}
                </p>
                <p className="text-xs opacity-50">
                  {t.ids.length}/{teamSize} seleccionados
                </p>
              </div>
              <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
            </button>
          </div>
        ))}

        {teams.length < MAX_TEAMS && (
          <button
            type="button"
            onClick={addTeam}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold"
            style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
          >
            <PlusIcon className="w-4 h-4" />
            Agregar equipo
          </button>
        )}
      </div>

      {teams.length >= 3 && (
        <div className="space-y-2">
          <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
            Formato
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FORMAT_LABEL) as TournamentFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormatOverride(f)}
                className="py-2.5 rounded-lg font-bold text-sm border"
                style={{
                  borderColor: format === f ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
                  color: format === f ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
                }}
              >
                {FORMAT_LABEL[f]}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-50 text-center">
            {format === suggested ? `Sugerido para ${teams.length} equipos` : 'Elegido a mano'}
          </p>
        </div>
      )}

      {createError && (
        <p className="text-sm text-center" style={{ color: '#d9695f' }}>
          {createError}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={!canCreate}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border disabled:opacity-30"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        {creating ? 'Creando...' : 'Crear torneo'}
      </button>
    </div>
  )
}

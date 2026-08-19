import { useEffect, useMemo, useState } from 'react'
import type { Pairing, User } from '../types'
import { BackIcon } from './icons'

const TEAM_SIZE = 3

export function MatchSetup({
  currentUser,
  onStart,
  onBack,
}: {
  currentUser: User
  onStart: (setup: {
    teamAName: string
    teamBName: string
    teamAPlayerIds: string[]
    teamBPlayerIds: string[]
    teamAPlayerNames: string[]
    teamBPlayerNames: string[]
    pairings: Pairing[]
  }) => void
  onBack: () => void
}) {
  const [teamAName, setTeamAName] = useState('Equipo A')
  const [teamBName, setTeamBName] = useState('Equipo B')
  const [teamAIds, setTeamAIds] = useState<string[]>([])
  const [teamBIds, setTeamBIds] = useState<string[]>([])
  const [pairing, setPairing] = useState<string[]>([])
  const [known, setKnown] = useState<Record<string, string>>({ [currentUser.id]: currentUser.name })

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)

  const selectedIds = useMemo(() => [...teamAIds, ...teamBIds], [teamAIds, teamBIds])

  useEffect(() => {
    setSearching(true)
    setSearchError(false)
    const controller = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(query)}&exclude=${selectedIds.join(',')}`, {
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
        .finally(() => setSearching(false))
    }, 250)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedIds.join(',')])

  const toggleTeam = (userId: string, team: 'A' | 'B') => {
    const setOther = team === 'A' ? setTeamBIds : setTeamAIds
    const otherIds = team === 'A' ? teamBIds : teamAIds
    const setMine = team === 'A' ? setTeamAIds : setTeamBIds
    const mineIds = team === 'A' ? teamAIds : teamBIds

    if (mineIds.includes(userId)) {
      setMine(mineIds.filter((id) => id !== userId))
      return
    }
    if (otherIds.includes(userId)) {
      setOther(otherIds.filter((id) => id !== userId))
    }
    if (mineIds.length >= TEAM_SIZE) return
    setMine([...mineIds, userId])
  }

  const ready = teamAIds.length === TEAM_SIZE && teamBIds.length === TEAM_SIZE

  const effectivePairing = useMemo(() => {
    if (!ready) return []
    if (pairing.length === TEAM_SIZE && pairing.every((id) => teamBIds.includes(id))) return pairing
    return teamBIds
  }, [ready, pairing, teamBIds])

  const setPairSlot = (slotIndex: number, newBId: string) => {
    const current = effectivePairing.slice()
    const swapWith = current.indexOf(newBId)
    const old = current[slotIndex]
    current[slotIndex] = newBId
    if (swapWith !== -1) current[swapWith] = old
    setPairing(current)
  }

  const nameOf = (id: string) => known[id] ?? '?'

  const canStart = ready && teamAName.trim() && teamBName.trim()

  const handleStart = () => {
    if (!canStart) return
    const pairings: Pairing[] = teamAIds.map((aId, i) => ({
      teamAPlayerId: aId,
      teamAPlayerName: nameOf(aId),
      teamBPlayerId: effectivePairing[i],
      teamBPlayerName: nameOf(effectivePairing[i]),
    }))
    onStart({
      teamAName,
      teamBName,
      teamAPlayerIds: teamAIds,
      teamBPlayerIds: teamBIds,
      teamAPlayerNames: teamAIds.map(nameOf),
      teamBPlayerNames: teamBIds.map(nameOf),
      pairings,
    })
  }

  const inputStyle = {
    borderColor: 'rgba(203, 170, 106, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: 'var(--color-paper-50)',
  }
  const panelStyle = { borderColor: 'rgba(203, 170, 106, 0.25)' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Armar partido
        </h2>
        <span className="w-5" />
      </div>

      <div className="rounded-2xl p-4 sm:p-5 border" style={panelStyle}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            value={teamAName}
            onChange={(e) => setTeamAName(e.target.value)}
            className="rounded-lg px-3 py-2 font-poster text-lg border outline-none"
            style={inputStyle}
            placeholder="Equipo A"
          />
          <input
            value={teamBName}
            onChange={(e) => setTeamBName(e.target.value)}
            className="rounded-lg px-3 py-2 font-poster text-lg border outline-none text-right"
            style={inputStyle}
            placeholder="Equipo B"
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60 mb-1">{teamAName || 'Equipo A'}</p>
              <div className="flex flex-wrap gap-1.5">
                {teamAIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTeam(id, 'A')}
                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                    style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
                  >
                    {nameOf(id)} ×
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60 mb-1 text-right">{teamBName || 'Equipo B'}</p>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {teamBIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTeam(id, 'B')}
                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                    style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
                  >
                    {nameOf(id)} ×
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jugador registrado..."
          className="w-full rounded-lg px-3 py-2 border outline-none mb-2"
          style={inputStyle}
        />

        {searchError && (
          <p className="text-sm text-center py-2" style={{ color: 'var(--color-matchhead-600)' }}>
            No se pudo buscar jugadores. Revisá la conexión e intentá de nuevo.
          </p>
        )}

        {!searchError && !searching && results.length === 0 && (
          <p className="text-sm opacity-60 text-center py-3">
            {query ? 'Nadie con ese nombre todavía.' : 'Escribí para buscar jugadores registrados.'}
          </p>
        )}

        <ul className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
          {results.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2 gap-2">
              <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
                {u.name}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleTeam(u.id, 'A')}
                  disabled={teamAIds.length >= TEAM_SIZE}
                  className="px-3 py-1 rounded-md text-sm font-bold border disabled:opacity-30"
                  style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
                >
                  {teamAName || 'A'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleTeam(u.id, 'B')}
                  disabled={teamBIds.length >= TEAM_SIZE}
                  className="px-3 py-1 rounded-md text-sm font-bold border disabled:opacity-30"
                  style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
                >
                  {teamBName || 'B'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {ready && (
        <div className="rounded-2xl p-4 sm:p-5 border" style={panelStyle}>
          <h2 className="font-poster text-xl mb-1" style={{ color: 'var(--color-paper-50)' }}>
            Parejas para pica-pica
          </h2>
          <p className="text-sm opacity-70 mb-3">Quién enfrenta a quién si se juega pica-pica.</p>
          <div className="space-y-2">
            {teamAIds.map((aId, i) => (
              <div key={aId} className="flex items-center gap-2">
                <span className="flex-1 truncate font-bold" style={{ color: 'var(--color-paper-100)' }}>
                  {nameOf(aId)}
                </span>
                <span className="opacity-50">vs</span>
                <select
                  value={effectivePairing[i]}
                  onChange={(e) => setPairSlot(i, e.target.value)}
                  className="flex-1 rounded-md px-2 py-1.5 border"
                  style={inputStyle}
                >
                  {teamBIds.map((bId) => (
                    <option key={bId} value={bId} style={{ color: 'black' }}>
                      {nameOf(bId)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border disabled:opacity-30"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        Empezar partido
      </button>
    </div>
  )
}

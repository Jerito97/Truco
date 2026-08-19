import { useMemo, useState } from 'react'
import type { Pairing, User } from '../types'
import { BackIcon, ChevronRightIcon, PeopleIcon } from './icons'
import { TeamPicker } from './TeamPicker'

const TEAM_SIZE_OPTIONS = [1, 2, 3] as const

function TeamCard({
  name,
  onNameChange,
  placeholder,
  ids,
  teamSize,
  nameOf,
  onOpen,
}: {
  name: string
  onNameChange: (v: string) => void
  placeholder: string
  ids: string[]
  teamSize: number
  nameOf: (id: string) => string
  onOpen: () => void
}) {
  return (
    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'rgba(203, 170, 106, 0.3)' }}>
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={placeholder}
        className="font-poster text-lg bg-transparent outline-none w-full mb-3"
        style={{ color: 'var(--color-paper-50)' }}
      />
      <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 text-left">
        <PeopleIcon className="w-6 h-6 shrink-0" style={{ color: 'var(--color-ember-500)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" style={{ color: 'var(--color-paper-100)' }}>
            {ids.length === 0 ? 'Elegir jugadores' : ids.map(nameOf).join(', ')}
          </p>
          <p className="text-xs opacity-50">{ids.length}/{teamSize} seleccionados</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 shrink-0 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
      </button>
    </div>
  )
}

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
  const [teamSize, setTeamSize] = useState(3)
  const [teamAName, setTeamAName] = useState('Nosotros')
  const [teamBName, setTeamBName] = useState('Ellos')
  const [teamAIds, setTeamAIds] = useState<string[]>([])
  const [teamBIds, setTeamBIds] = useState<string[]>([])
  const [pairing, setPairing] = useState<string[]>([])
  const [known, setKnown] = useState<Record<string, string>>({ [currentUser.id]: currentUser.name })
  const [view, setView] = useState<'hub' | 'pickA' | 'pickB'>('hub')

  const changeTeamSize = (size: number) => {
    if (size === teamSize) return
    setTeamSize(size)
    setTeamAIds([])
    setTeamBIds([])
    setPairing([])
  }

  const nameOf = (id: string) => known[id] ?? '?'
  const ready = teamAIds.length === teamSize && teamBIds.length === teamSize

  const effectivePairing = useMemo(() => {
    if (!ready) return []
    if (pairing.length === teamSize && pairing.every((id) => teamBIds.includes(id))) return pairing
    return teamBIds
  }, [ready, pairing, teamBIds, teamSize])

  const setPairSlot = (slotIndex: number, newBId: string) => {
    const current = effectivePairing.slice()
    const swapWith = current.indexOf(newBId)
    const old = current[slotIndex]
    current[slotIndex] = newBId
    if (swapWith !== -1) current[swapWith] = old
    setPairing(current)
  }

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

  if (view === 'pickA') {
    return (
      <TeamPicker
        title={teamAName || 'Nosotros'}
        teamSize={teamSize}
        initialSelectedIds={teamAIds}
        excludeIds={teamBIds}
        knownNames={known}
        onBack={() => setView('hub')}
        onConfirm={(ids, names) => {
          setTeamAIds(ids)
          setKnown((k) => ({ ...k, ...names }))
          setView('hub')
        }}
      />
    )
  }

  if (view === 'pickB') {
    return (
      <TeamPicker
        title={teamBName || 'Ellos'}
        teamSize={teamSize}
        initialSelectedIds={teamBIds}
        excludeIds={teamAIds}
        knownNames={known}
        onBack={() => setView('hub')}
        onConfirm={(ids, names) => {
          setTeamBIds(ids)
          setKnown((k) => ({ ...k, ...names }))
          setView('hub')
        }}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Armar partido
        </h2>
        <span className="w-5" />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
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
          <TeamCard
            name={teamAName}
            onNameChange={setTeamAName}
            placeholder="Nosotros"
            ids={teamAIds}
            teamSize={teamSize}
            nameOf={nameOf}
            onOpen={() => setView('pickA')}
          />
          <TeamCard
            name={teamBName}
            onNameChange={setTeamBName}
            placeholder="Ellos"
            ids={teamBIds}
            teamSize={teamSize}
            nameOf={nameOf}
            onOpen={() => setView('pickB')}
          />
        </div>

        {ready && teamSize > 1 && (
          <div className="rounded-2xl p-4 sm:p-5 border" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
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
                    style={{
                      borderColor: 'rgba(203, 170, 106, 0.35)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      color: 'var(--color-paper-50)',
                    }}
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
    </div>
  )
}

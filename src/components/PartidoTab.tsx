import { useState } from 'react'
import type { ActiveMatch, Pairing, User } from '../types'
import { HomeDashboard } from './HomeDashboard'
import { MatchSetup } from './MatchSetup'
import { MatchLive } from './MatchLive'
import { PicaPica } from './PicaPica'
import { MatchSummary } from './MatchSummary'

type View = 'dashboard' | 'setup' | 'anotador'

export function PartidoTab({
  currentUser,
  activeMatch,
  onStart,
  onAdd,
  onSub,
  onUndo,
  onPassMano,
  onEnterPicaPica,
  onPicaPicaAdd,
  onPicaPicaSub,
  onPicaPicaUndo,
  onPicaPicaClose,
  onRematch,
  onNewMatch,
}: {
  currentUser: User
  activeMatch: ActiveMatch | null
  onStart: (setup: {
    teamAName: string
    teamBName: string
    teamAPlayerIds: string[]
    teamBPlayerIds: string[]
    teamAPlayerNames: string[]
    teamBPlayerNames: string[]
    pairings: Pairing[]
  }) => void
  onAdd: (team: 'A' | 'B') => void
  onSub: (team: 'A' | 'B') => void
  onUndo: () => void
  onPassMano: () => void
  onEnterPicaPica: () => void
  onPicaPicaAdd: (duelIndex: number, team: 'A' | 'B') => void
  onPicaPicaSub: (duelIndex: number, team: 'A' | 'B') => void
  onPicaPicaUndo: () => void
  onPicaPicaClose: () => void
  onRematch: () => void
  onNewMatch: () => void
}) {
  const [view, setView] = useState<View>(activeMatch && activeMatch.status === 'playing' ? 'anotador' : 'dashboard')

  if (!activeMatch) {
    if (view === 'setup') {
      return <MatchSetup currentUser={currentUser} onStart={onStart} onBack={() => setView('dashboard')} />
    }
    return (
      <HomeDashboard activeMatch={null} onNewMatch={() => setView('setup')} onResumeMatch={() => setView('setup')} />
    )
  }

  if (activeMatch.inPicaPica) {
    return (
      <PicaPica
        match={activeMatch}
        onAdd={onPicaPicaAdd}
        onSub={onPicaPicaSub}
        onUndo={onPicaPicaUndo}
        onClose={onPicaPicaClose}
      />
    )
  }

  if (activeMatch.status === 'finished') {
    return (
      <MatchSummary
        match={activeMatch}
        onRematch={() => {
          onRematch()
          setView('anotador')
        }}
        onNewMatch={() => {
          onNewMatch()
          setView('dashboard')
        }}
      />
    )
  }

  if (view === 'dashboard') {
    return (
      <HomeDashboard
        activeMatch={activeMatch}
        onNewMatch={() => setView('anotador')}
        onResumeMatch={() => setView('anotador')}
      />
    )
  }

  return (
    <MatchLive
      match={activeMatch}
      onAdd={onAdd}
      onSub={onSub}
      onUndo={onUndo}
      onPassMano={onPassMano}
      onEnterPicaPica={onEnterPicaPica}
      onBack={() => setView('dashboard')}
    />
  )
}

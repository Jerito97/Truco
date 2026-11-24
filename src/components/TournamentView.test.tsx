import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { TournamentView } from './TournamentView'
import type { Tournament } from '../types'

const userInFixture0 = { id: 'u-ana', name: 'Ana' }
const userNotPlaying = { id: 'u-espectador', name: 'Espectador' }

const tournament: Tournament = {
  id: 't1',
  name: 'Torneo de prueba',
  format: 'eliminacion',
  teams: [
    { name: 'Equipo 0', playerIds: ['u-ana'], playerNames: ['Ana'] },
    { name: 'Equipo 1', playerIds: ['u-bruno'], playerNames: ['Bruno'] },
    { name: 'Equipo 2', playerIds: ['u-cami'], playerNames: ['Cami'] },
    { name: 'Equipo 3', playerIds: ['u-dani'], playerNames: ['Dani'] },
  ],
  board: {
    format: 'eliminacion',
    rounds: [
      [
        { teamA: 0, teamB: 1, bye: false, matchId: null, winner: null },
        { teamA: 2, teamB: 3, bye: false, matchId: null, winner: null },
      ],
      [{ teamA: null, teamB: null, bye: false, matchId: null, winner: null }],
    ],
  },
  status: 'en_curso',
  champion_team_index: null,
  created_by: 'u-ana',
  created_at: new Date().toISOString(),
  finished_at: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(tournament), { status: 200 })))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TournamentView — quién puede tocar "Jugar"', () => {
  it('un jugador de ese cruce puntual ve "Jugar" para ese cruce, y "Lo juegan ellos" para el otro', async () => {
    render(
      <TournamentView tournamentId="t1" currentUser={userInFixture0} onBack={() => {}} onPlayFixture={() => {}} />,
    )
    await waitFor(() => expect(screen.queryAllByText(/Jugar|Lo juegan ellos/)).toHaveLength(2))
    expect(screen.getAllByText('Jugar', { exact: true })).toHaveLength(1)
    expect(screen.getAllByText('Lo juegan ellos', { exact: true })).toHaveLength(1)
  })

  it('alguien que no juega en ningún cruce no ve ningún "Jugar"', async () => {
    render(
      <TournamentView tournamentId="t1" currentUser={userNotPlaying} onBack={() => {}} onPlayFixture={() => {}} />,
    )
    await waitFor(() => expect(screen.queryAllByText(/Jugar|Lo juegan ellos/)).toHaveLength(2))
    expect(screen.queryByText('Jugar', { exact: true })).not.toBeInTheDocument()
    expect(screen.getAllByText('Lo juegan ellos', { exact: true })).toHaveLength(2)
  })
})

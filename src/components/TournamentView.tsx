import type { Pairing, Tournament, TournamentContext } from '../types'
import type { Bracket, BracketFixture, RoundRobinBoard, RoundRobinFixture } from '../lib/tournament'
import { computeStandings } from '../lib/tournament'
import { BackIcon, TrophyIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'
import { useTournament } from '../state/useTournament'

export interface MatchSetupPayload {
  teamAName: string
  teamBName: string
  teamAPlayerIds: string[]
  teamBPlayerIds: string[]
  teamAPlayerNames: string[]
  teamBPlayerNames: string[]
  pairings: Pairing[]
}

function roundLabel(roundIndex: number, totalRounds: number, fixturesInRound: number): string {
  if (roundIndex === totalRounds - 1) return 'Final'
  if (roundIndex === totalRounds - 2 && fixturesInRound === 2) return 'Semifinal'
  if (roundIndex === totalRounds - 3 && fixturesInRound === 4) return 'Cuartos de final'
  return `Ronda ${roundIndex + 1}`
}

function buildPairings(teamAIds: string[], teamANames: string[], teamBIds: string[], teamBNames: string[]): Pairing[] {
  return teamAIds.map((aId, i) => ({
    teamAPlayerId: aId,
    teamAPlayerName: teamANames[i],
    teamBPlayerId: teamBIds[i],
    teamBPlayerName: teamBNames[i],
  }))
}

function FixtureRow({
  teamAName,
  teamBName,
  state,
  onPlay,
}: {
  teamAName: string | null
  teamBName: string | null
  state: 'tbd' | 'bye' | 'pending' | { winner: 'A' | 'B' }
  onPlay: () => void
}) {
  if (state === 'tbd') {
    return (
      <div className="rounded-xl border px-4 py-3 opacity-50" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
        <p className="text-sm">Por definir</p>
      </div>
    )
  }
  if (state === 'bye') {
    return (
      <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
        <p className="text-sm" style={{ color: 'var(--color-paper-100)' }}>
          {teamAName} <span className="opacity-50">pasa de ronda</span>
        </p>
      </div>
    )
  }
  if (state === 'pending') {
    return (
      <button
        type="button"
        onClick={onPlay}
        className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left"
        style={{ borderColor: 'var(--color-ember-600)' }}
      >
        <span className="text-sm truncate" style={{ color: 'var(--color-paper-100)' }}>
          {teamAName} <span className="opacity-40">vs</span> {teamBName}
        </span>
        <span className="text-xs font-bold shrink-0 ml-2" style={{ color: 'var(--color-ember-500)' }}>
          Jugar
        </span>
      </button>
    )
  }
  const aWon = state.winner === 'A'
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
      <p className="text-sm truncate">
        <span style={{ color: aWon ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: aWon ? 700 : 400, opacity: aWon ? 1 : 0.6 }}>
          {teamAName}
        </span>
        <span className="opacity-40"> vs </span>
        <span style={{ color: !aWon ? 'var(--color-ember-500)' : 'var(--color-paper-100)', fontWeight: !aWon ? 700 : 400, opacity: !aWon ? 1 : 0.6 }}>
          {teamBName}
        </span>
      </p>
    </div>
  )
}

export function TournamentView({
  tournamentId,
  onBack,
  onPlayFixture,
}: {
  tournamentId: string
  onBack: () => void
  onPlayFixture: (setup: MatchSetupPayload, context: TournamentContext) => void
}) {
  useScrollToTop()
  const { tournament, error } = useTournament(tournamentId, 0)

  if (error) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} aria-label="Volver">
            <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
          </button>
          <span className="w-5" />
        </div>
        <p className="text-sm text-center py-6" style={{ color: '#d9695f' }}>
          No se pudo cargar el torneo.
        </p>
      </div>
    )
  }

  if (!tournament) {
    return <p className="text-center opacity-60 py-10">Cargando...</p>
  }

  const { teams } = tournament
  const teamName = (i: number | null) => (i == null ? null : teams[i]?.name)

  const playFixture = (teamAIndex: number, teamBIndex: number, roundIndex: number | null, fixtureIndex: number) => {
    const a = teams[teamAIndex]
    const b = teams[teamBIndex]
    onPlayFixture(
      {
        teamAName: a.name,
        teamBName: b.name,
        teamAPlayerIds: a.playerIds,
        teamBPlayerIds: b.playerIds,
        teamAPlayerNames: a.playerNames,
        teamBPlayerNames: b.playerNames,
        pairings: buildPairings(a.playerIds, a.playerNames, b.playerIds, b.playerNames),
      },
      { tournamentId: tournament.id, roundIndex, fixtureIndex, teamAIndex, teamBIndex },
    )
  }

  const championName = tournament.champion_team_index != null ? teams[tournament.champion_team_index]?.name : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl truncate px-2" style={{ color: 'var(--color-paper-50)' }}>
          {tournament.name}
        </h2>
        <span className="w-5" />
      </div>

      {tournament.status === 'finalizado' && (
        <div
          className="rounded-2xl border p-4 text-center space-y-1"
          style={{ borderColor: 'var(--color-ember-600)', backgroundColor: 'rgba(203, 170, 106, 0.08)' }}
        >
          {championName ? (
            <>
              <TrophyIcon className="w-7 h-7 mx-auto" style={{ color: 'var(--color-ember-500)' }} />
              <p className="font-poster text-xl" style={{ color: 'var(--color-ember-500)' }}>
                Campeón: {championName}
              </p>
            </>
          ) : (
            <p className="font-poster text-lg" style={{ color: 'var(--color-paper-50)' }}>
              Torneo terminado — empate en el primer puesto
            </p>
          )}
        </div>
      )}

      {tournament.format === 'eliminacion' ? (
        <EliminationView board={tournament.board as Bracket} teamName={teamName} onPlay={playFixture} />
      ) : (
        <RoundRobinView board={tournament.board as RoundRobinBoard} teams={teams} onPlay={playFixture} />
      )}
    </div>
  )
}

function fixtureState(f: BracketFixture): 'tbd' | 'bye' | 'pending' | { winner: 'A' | 'B' } {
  if (f.teamA == null && f.teamB == null) return 'tbd'
  if (f.bye) return 'bye'
  if (f.teamA == null || f.teamB == null) return 'tbd'
  if (f.winner == null) return 'pending'
  return { winner: f.winner === f.teamA ? 'A' : 'B' }
}

function EliminationView({
  board,
  teamName,
  onPlay,
}: {
  board: Bracket
  teamName: (i: number | null) => string | null
  onPlay: (teamAIndex: number, teamBIndex: number, roundIndex: number | null, fixtureIndex: number) => void
}) {
  return (
    <div className="space-y-5">
      {board.rounds.map((round, ri) => (
        <div key={ri} className="space-y-2">
          <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
            {roundLabel(ri, board.rounds.length, round.length)}
          </h3>
          <div className="space-y-2">
            {round.map((f, fi) => (
              <FixtureRow
                key={fi}
                teamAName={teamName(f.teamA)}
                teamBName={teamName(f.teamB)}
                state={fixtureState(f)}
                onPlay={() => f.teamA != null && f.teamB != null && onPlay(f.teamA, f.teamB, ri, fi)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function roundRobinFixtureState(f: RoundRobinFixture): 'pending' | { winner: 'A' | 'B' } {
  if (f.winner == null) return 'pending'
  return { winner: f.winner === f.teamA ? 'A' : 'B' }
}

function RoundRobinView({
  board,
  teams,
  onPlay,
}: {
  board: RoundRobinBoard
  teams: Tournament['teams']
  onPlay: (teamAIndex: number, teamBIndex: number, roundIndex: null, fixtureIndex: number) => void
}) {
  const standings = computeStandings(board, teams.length)

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
          Tabla de posiciones
        </h3>
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {standings.map((s, i) => (
            <div key={s.teamIndex} className="flex items-center gap-3 py-2.5">
              <span className="text-sm w-5 text-center shrink-0 opacity-70">{i + 1}</span>
              <span className="flex-1 truncate font-bold" style={{ color: 'var(--color-paper-100)' }}>
                {teams[s.teamIndex].name}
              </span>
              <span className="font-num text-xs opacity-60 shrink-0">PJ {s.played}</span>
              <span className="font-num text-sm font-bold w-16 text-right shrink-0" style={{ color: 'var(--color-ember-500)' }}>
                {s.won}G - {s.lost}P
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-poster text-lg" style={{ color: 'var(--color-ember-500)' }}>
          Partidos
        </h3>
        <div className="space-y-2">
          {board.fixtures.map((f, fi) => (
            <FixtureRow
              key={fi}
              teamAName={teams[f.teamA].name}
              teamBName={teams[f.teamB].name}
              state={roundRobinFixtureState(f)}
              onPlay={() => onPlay(f.teamA, f.teamB, null, fi)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

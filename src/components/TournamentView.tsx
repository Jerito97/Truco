import type { Pairing, Tournament, TournamentContext, User } from '../types'
import type { Bracket, BracketFixture, RoundRobinBoard, RoundRobinFixture } from '../../api/_lib/tournament'
import { computeStandings } from '../../api/_lib/tournament'
import { computeBracketLayout } from '../lib/bracketLayout'
import { TrophyIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'
import { useTournament } from '../state/useTournament'
import { ScreenHeader } from './ScreenHeader'

// Ancho de cada columna de ronda y de cada "carril" de líneas que conecta
// una ronda con la siguiente, en px. Con el máximo de 8 equipos que permite
// armar un torneo (ver TournamentSetup), el bracket entero tiene como mucho
// 3 rondas — entra casi sin scroll horizontal en una pantalla de celular.
const BRACKET_BOX_WIDTH = 128
const BRACKET_BOX_HEIGHT = 64
const BRACKET_SLOT_HEIGHT = 84
const BRACKET_GAP_WIDTH = 22

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
  canPlay,
  onPlay,
}: {
  teamAName: string | null
  teamBName: string | null
  state: 'tbd' | 'bye' | 'pending' | { winner: 'A' | 'B' }
  canPlay: boolean
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
    // Solo puede tocar "Jugar" (y arrancar el partido en su propio
    // celular) alguien que forma parte de uno de los dos equipos de este
    // cruce puntual — así varios cruces del torneo se juegan en simultáneo,
    // cada uno en el celular de sus jugadores, sin pisarse entre sí.
    if (!canPlay) {
      return (
        <div className="w-full flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'rgba(203, 170, 106, 0.2)' }}>
          <span className="text-sm truncate opacity-70" style={{ color: 'var(--color-paper-100)' }}>
            {teamAName} <span className="opacity-40">vs</span> {teamBName}
          </span>
          <span className="text-xs shrink-0 ml-2 opacity-50" style={{ color: 'var(--color-paper-100)' }}>
            Lo juegan ellos
          </span>
        </div>
      )
    }
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
  currentUser,
  onBack,
  onPlayFixture,
}: {
  tournamentId: string
  currentUser: User
  onBack: () => void
  onPlayFixture: (setup: MatchSetupPayload, context: TournamentContext) => void
}) {
  useScrollToTop()
  const { tournament, error } = useTournament(tournamentId, 0)

  if (error) {
    return (
      <div className="screen-fill flex flex-col">
        <ScreenHeader title="Torneo" onBack={onBack} />
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <p className="text-sm text-center py-6" style={{ color: '#d9695f' }}>
            No se pudo cargar el torneo.
          </p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="screen-fill flex flex-col">
        <ScreenHeader title="Torneo" onBack={onBack} />
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <p className="text-center opacity-60 py-10">Cargando...</p>
        </div>
      </div>
    )
  }

  const { teams } = tournament
  const teamName = (i: number | null) => (i == null ? null : teams[i]?.name)
  const isParticipant = (i: number | null) => (i == null ? false : (teams[i]?.playerIds.includes(currentUser.id) ?? false))
  const canPlayFixture = (teamAIndex: number | null, teamBIndex: number | null) =>
    isParticipant(teamAIndex) || isParticipant(teamBIndex)

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
    <div className="screen-fill flex flex-col gap-5">
      <ScreenHeader title={tournament.name} onBack={onBack} />

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

      {/* "safe center" porque un torneo puede tener muchas rondas/equipos y
          ya no entrar en una pantalla; no queremos cortar el bracket. */}
      <div className="flex-1 flex flex-col min-h-0" style={{ justifyContent: 'safe center' }}>
        {tournament.format === 'eliminacion' ? (
          <EliminationView
            board={tournament.board as Bracket}
            teamName={teamName}
            canPlayFixture={canPlayFixture}
            onPlay={playFixture}
          />
        ) : (
          <RoundRobinView
            board={tournament.board as RoundRobinBoard}
            teams={teams}
            canPlayFixture={canPlayFixture}
            onPlay={playFixture}
          />
        )}
      </div>
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

// Tarjeta compacta de un cruce para el árbol del bracket: los dos equipos
// apilados (no "A vs B" en una fila, como en FixtureRow) porque acá el ancho
// es fijo y chico — tiene que convivir con una columna por ronda.
function BracketBox({
  teamAName,
  teamBName,
  state,
  canPlay,
  onPlay,
}: {
  teamAName: string | null
  teamBName: string | null
  state: 'tbd' | 'bye' | 'pending' | { winner: 'A' | 'B' }
  canPlay: boolean
  onPlay: () => void
}) {
  const rowStyle = (side: 'A' | 'B') => {
    if (typeof state !== 'object') return { color: 'var(--color-paper-100)', opacity: state === 'bye' && side === 'B' ? 0.5 : 0.85 }
    const won = state.winner === side
    return {
      color: won ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
      fontWeight: won ? 700 : 400,
      opacity: won ? 1 : 0.55,
    }
  }

  const canPlayNow = state === 'pending' && canPlay

  const card = (
    <div
      className="rounded-lg border px-2 py-1.5 w-full"
      style={{ borderColor: canPlayNow ? 'var(--color-ember-600)' : 'rgba(203, 170, 106, 0.25)' }}
    >
      <p className="text-xs truncate" style={rowStyle('A')}>
        {teamAName ?? 'Por definir'}
      </p>
      <div className="h-px my-1" style={{ backgroundColor: 'rgba(203, 170, 106, 0.15)' }} />
      <p className="text-xs truncate" style={rowStyle('B')}>
        {state === 'bye' ? 'Pasa de ronda' : (teamBName ?? 'Por definir')}
      </p>
      {state === 'pending' && (
        <p
          className="text-[10px] font-bold text-center mt-1 truncate"
          style={{ color: canPlay ? 'var(--color-ember-500)' : 'var(--color-paper-100)', opacity: canPlay ? 1 : 0.5 }}
        >
          {canPlay ? 'Jugar' : 'Lo juegan ellos'}
        </p>
      )}
    </div>
  )

  if (!canPlayNow) return card
  return (
    <button type="button" onClick={onPlay} className="w-full text-left">
      {card}
    </button>
  )
}

// Líneas que conectan cada par de cruces de una ronda con el cruce de la
// siguiente que sale de ellos: una "T" acostada, como en cualquier bracket
// deportivo. `topY`/`botY` son los centros de los dos cruces de origen,
// `midY` el del cruce destino (siempre el promedio de los otros dos, por
// cómo arma las rondas buildBracket).
function BracketConnector({ topY, botY, midY }: { topY: number; botY: number; midY: number }) {
  const half = BRACKET_GAP_WIDTH / 2
  return (
    <path
      d={`M 0 ${topY} H ${half} V ${botY} H 0 M ${half} ${midY} H ${BRACKET_GAP_WIDTH}`}
      stroke="rgba(203, 170, 106, 0.35)"
      strokeWidth={1.5}
      fill="none"
    />
  )
}

function EliminationView({
  board,
  teamName,
  canPlayFixture,
  onPlay,
}: {
  board: Bracket
  teamName: (i: number | null) => string | null
  canPlayFixture: (teamAIndex: number | null, teamBIndex: number | null) => boolean
  onPlay: (teamAIndex: number, teamBIndex: number, roundIndex: number | null, fixtureIndex: number) => void
}) {
  const totalRounds = board.rounds.length
  const layout = computeBracketLayout(
    board.rounds.map((r) => r.length),
    BRACKET_SLOT_HEIGHT,
  )

  return (
    // Scroll horizontal propio: con varias rondas, el árbol completo es más
    // ancho que la pantalla de un celular.
    <div className="overflow-x-auto -mx-4 px-4 pb-1">
      <div style={{ width: 'max-content' }}>
        <div className="flex items-start mb-2">
          {board.rounds.map((round, ri) => (
            <div key={ri} className="flex items-start shrink-0">
              <div style={{ width: BRACKET_BOX_WIDTH }}>
                <h3 className="font-poster text-sm text-center truncate" style={{ color: 'var(--color-ember-500)' }}>
                  {roundLabel(ri, totalRounds, round.length)}
                </h3>
              </div>
              {ri < totalRounds - 1 && <div style={{ width: BRACKET_GAP_WIDTH }} />}
            </div>
          ))}
        </div>

        <div className="flex items-start" style={{ height: layout.totalHeight }}>
          {board.rounds.map((round, ri) => (
            <div key={ri} className="flex items-start shrink-0">
              <div className="relative" style={{ width: BRACKET_BOX_WIDTH, height: layout.totalHeight }}>
                {round.map((f, fi) => {
                  const y = layout.positions[ri][fi]
                  return (
                    <div
                      key={fi}
                      className="absolute left-0"
                      style={{ top: y - BRACKET_BOX_HEIGHT / 2, width: BRACKET_BOX_WIDTH }}
                    >
                      <BracketBox
                        teamAName={teamName(f.teamA)}
                        teamBName={teamName(f.teamB)}
                        state={fixtureState(f)}
                        canPlay={canPlayFixture(f.teamA, f.teamB)}
                        onPlay={() => f.teamA != null && f.teamB != null && onPlay(f.teamA, f.teamB, ri, fi)}
                      />
                    </div>
                  )
                })}
              </div>

              {ri < totalRounds - 1 && (
                <svg
                  width={BRACKET_GAP_WIDTH}
                  height={layout.totalHeight}
                  style={{ overflow: 'visible' }}
                  className="shrink-0"
                >
                  {board.rounds[ri + 1].map((_, pi) => (
                    <BracketConnector
                      key={pi}
                      topY={layout.positions[ri][2 * pi]}
                      botY={layout.positions[ri][2 * pi + 1]}
                      midY={layout.positions[ri + 1][pi]}
                    />
                  ))}
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
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
  canPlayFixture,
  onPlay,
}: {
  board: RoundRobinBoard
  teams: Tournament['teams']
  canPlayFixture: (teamAIndex: number | null, teamBIndex: number | null) => boolean
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
              canPlay={canPlayFixture(f.teamA, f.teamB)}
              onPlay={() => onPlay(f.teamA, f.teamB, null, fi)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

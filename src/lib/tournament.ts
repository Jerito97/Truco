export type TournamentFormat = 'eliminacion' | 'todos_contra_todos'

export interface TournamentTeam {
  name: string
  playerIds: string[]
  playerNames: string[]
}

export interface BracketFixture {
  teamA: number | null
  teamB: number | null
  bye: boolean
  matchId: string | null
  winner: number | null
}

export interface Bracket {
  format: 'eliminacion'
  rounds: BracketFixture[][]
}

export interface RoundRobinFixture {
  teamA: number
  teamB: number
  matchId: string | null
  winner: number | null
}

export interface RoundRobinBoard {
  format: 'todos_contra_todos'
  fixtures: RoundRobinFixture[]
}

export type TournamentBoard = Bracket | RoundRobinBoard

// Con 3 equipos, todos contra todos (nadie queda afuera de ninguna fecha);
// con cualquier otra cantidad, eliminación directa.
export function suggestFormat(teamCount: number): TournamentFormat {
  return teamCount === 3 ? 'todos_contra_todos' : 'eliminacion'
}

function nextPowerOfTwo(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Hace avanzar el ganador de un cruce ya resuelto (jugado o bye) al cruce
// que le toca en la ronda siguiente. Solo pasa en la ronda 0: de ahí en
// adelante todo cruce necesita los dos equipos resueltos antes de jugarse.
function propagateWinner(rounds: BracketFixture[][], round: number, index: number): void {
  const fixture = rounds[round][index]
  if (fixture.winner == null) return
  const nextRound = round + 1
  if (nextRound >= rounds.length) return
  const nextIndex = Math.floor(index / 2)
  const slot = index % 2 === 0 ? 'teamA' : 'teamB'
  rounds[nextRound][nextIndex] = { ...rounds[nextRound][nextIndex], [slot]: fixture.winner }
}

// Arma todas las rondas de una eliminación directa para `teamCount` equipos
// (en el orden en que se cargaron). Si no es potencia de 2, reparte los
// "bye" (pasan de ronda sin jugar) entre los primeros equipos de la lista.
export function buildBracket(teamCount: number): Bracket {
  const size = nextPowerOfTwo(teamCount)
  const firstRoundSize = size / 2
  const numByes = size - teamCount

  const round0: BracketFixture[] = []
  let cursor = 0
  for (let i = 0; i < firstRoundSize; i++) {
    if (i < numByes) {
      round0.push({ teamA: cursor, teamB: null, bye: true, matchId: null, winner: cursor })
      cursor += 1
    } else {
      round0.push({ teamA: cursor, teamB: cursor + 1, bye: false, matchId: null, winner: null })
      cursor += 2
    }
  }

  const rounds: BracketFixture[][] = [round0]
  let prevSize = firstRoundSize
  while (prevSize > 1) {
    const nextSize = prevSize / 2
    rounds.push(
      Array.from({ length: nextSize }, () => ({ teamA: null, teamB: null, bye: false, matchId: null, winner: null })),
    )
    prevSize = nextSize
  }

  round0.forEach((f, i) => {
    if (f.winner != null) propagateWinner(rounds, 0, i)
  })

  return { format: 'eliminacion', rounds }
}

export function applyEliminationResult(
  bracket: Bracket,
  round: number,
  index: number,
  matchId: string,
  winnerIndex: number,
): Bracket {
  const rounds = bracket.rounds.map((r) => r.map((f) => ({ ...f })))
  rounds[round][index] = { ...rounds[round][index], matchId, winner: winnerIndex }
  propagateWinner(rounds, round, index)
  return { ...bracket, rounds }
}

export function isEliminationComplete(bracket: Bracket): boolean {
  const lastRound = bracket.rounds[bracket.rounds.length - 1]
  return lastRound[0].winner != null
}

export function getEliminationChampion(bracket: Bracket): number | null {
  if (!isEliminationComplete(bracket)) return null
  return bracket.rounds[bracket.rounds.length - 1][0].winner
}

export function buildRoundRobin(teamCount: number): RoundRobinBoard {
  const fixtures: RoundRobinFixture[] = []
  for (let a = 0; a < teamCount; a++) {
    for (let b = a + 1; b < teamCount; b++) {
      fixtures.push({ teamA: a, teamB: b, matchId: null, winner: null })
    }
  }
  return { format: 'todos_contra_todos', fixtures }
}

export function applyRoundRobinResult(
  board: RoundRobinBoard,
  index: number,
  matchId: string,
  winnerIndex: number,
): RoundRobinBoard {
  return {
    ...board,
    fixtures: board.fixtures.map((f, i) => (i === index ? { ...f, matchId, winner: winnerIndex } : f)),
  }
}

export interface Standing {
  teamIndex: number
  played: number
  won: number
  lost: number
}

// Desempata por nombre (índice de equipo) para que el orden no "salte" sin
// sentido entre dos empatados en victorias — no hay desempate por
// diferencia de tantos en esta primera versión.
export function computeStandings(board: RoundRobinBoard, teamCount: number): Standing[] {
  const table: Standing[] = Array.from({ length: teamCount }, (_, i) => ({ teamIndex: i, played: 0, won: 0, lost: 0 }))
  for (const f of board.fixtures) {
    if (f.winner == null) continue
    table[f.teamA].played++
    table[f.teamB].played++
    if (f.winner === f.teamA) {
      table[f.teamA].won++
      table[f.teamB].lost++
    } else {
      table[f.teamB].won++
      table[f.teamA].lost++
    }
  }
  return [...table].sort((a, b) => b.won - a.won || a.teamIndex - b.teamIndex)
}

export function isRoundRobinComplete(board: RoundRobinBoard): boolean {
  return board.fixtures.every((f) => f.winner != null)
}

// null también cuando ya se jugaron todos los partidos pero el primer
// puesto quedó empatado en victorias (esta versión no desempata solo).
export function getRoundRobinChampion(board: RoundRobinBoard, teamCount: number): number | null {
  if (!isRoundRobinComplete(board)) return null
  const standings = computeStandings(board, teamCount)
  if (standings.length >= 2 && standings[0].won === standings[1].won) return null
  return standings[0]?.teamIndex ?? null
}

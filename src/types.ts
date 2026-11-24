import type { TournamentBoard } from './lib/tournament'

export interface User {
  id: string
  name: string
  created_at?: string
  is_admin?: boolean
}

export interface Pairing {
  teamAPlayerId: string
  teamAPlayerName: string
  teamBPlayerId: string
  teamBPlayerName: string
}

export interface PicaPicaDuel {
  scoreA: number
  scoreB: number
}

export interface PicaPicaDuelResult {
  // Los partidos guardados antes de que empezáramos a persistir esto no
  // tienen aId/bId (solo el nombre de ese momento): el récord agregado de
  // pica-pica cae al nombre para esos casos viejos.
  aId?: string
  bId?: string
  aName: string
  bName: string
  scoreA: number
  scoreB: number
}

export interface PicaPicaRoundResult {
  duels: PicaPicaDuelResult[]
}

export type MatchStatus = 'playing' | 'finished'

export interface ScoreEvent {
  team: 'A' | 'B'
  // Segundos desde que arrancó el partido, no una fecha absoluta: así no
  // depende del reloj del dispositivo y queda consistente con duration_seconds.
  atSeconds: number
  // Casi siempre 1 (un "+1" tocado a mano), salvo la diferencia que suma de
  // una sola vez el pica-pica al cerrar la ronda.
  delta: number
}

export interface ActiveMatch {
  id: string
  teamAName: string
  teamBName: string
  teamAPlayerIds: string[]
  teamBPlayerIds: string[]
  teamAPlayerNames: string[]
  teamBPlayerNames: string[]
  pairings: Pairing[]
  scoreA: number
  scoreB: number
  manoTeam: 'A' | 'B'
  status: MatchStatus
  inPicaPica: boolean
  picaPicaDuels: PicaPicaDuel[]
  picaPicaTotalA: number
  picaPicaTotalB: number
  picaPicaRounds: number
  picaPicaRoundsHistory: PicaPicaRoundResult[]
  scoreEvents: ScoreEvent[]
  startedAt: string
  finishedAt?: string
  // Presente solo si este partido es un cruce de un torneo.
  tournamentContext?: TournamentContext
}

export interface FinishedMatch {
  id: string
  played_at: string
  team_a_name: string
  team_b_name: string
  team_a_player_ids: string[]
  team_b_player_ids: string[]
  team_a_player_names: string[]
  team_b_player_names: string[]
  score_a: number
  score_b: number
  winner: 'A' | 'B'
  pica_pica_played: boolean
  pica_pica_total_a: number
  pica_pica_total_b: number
  pica_pica_rounds: PicaPicaRoundResult[]
  // Los partidos guardados antes de este campo no lo tienen.
  duration_seconds: number | null
  // Lista vacía en los partidos guardados antes de este campo (no hay forma
  // de reconstruirla después del hecho).
  score_events: ScoreEvent[]
}

// A qué cruce de qué torneo pertenece un partido (si pertenece a alguno):
// roundIndex es null para todos-contra-todos (lista plana de cruces, sin
// rondas), y el número de ronda para eliminación directa.
export interface TournamentContext {
  tournamentId: string
  roundIndex: number | null
  fixtureIndex: number
  // Índice (en tournament.teams) de cada lado de este cruce, para poder
  // calcular qué índice de equipo ganó una vez que termina el partido.
  teamAIndex: number
  teamBIndex: number
}

export interface TournamentTeam {
  name: string
  playerIds: string[]
  playerNames: string[]
}

export type TournamentFormat = 'eliminacion' | 'todos_contra_todos'
export type TournamentStatus = 'en_curso' | 'finalizado'

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  teams: TournamentTeam[]
  board: TournamentBoard
  status: TournamentStatus
  champion_team_index: number | null
  created_by: string
  created_at: string
  finished_at: string | null
}

export interface AppState {
  activeMatch: ActiveMatch | null
}

export const TARGET_SCORE = 30

export interface User {
  id: string
  name: string
  created_at?: string
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

export type PointEvent = { team: 'A' | 'B' }
export type PicaPicaPointEvent = { duelIndex: number; team: 'A' | 'B' }

export interface PicaPicaDuelResult {
  aName: string
  bName: string
  scoreA: number
  scoreB: number
}

export interface PicaPicaRoundResult {
  duels: PicaPicaDuelResult[]
}

export type MatchStatus = 'playing' | 'finished'

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
  history: PointEvent[]
  inPicaPica: boolean
  picaPicaDuels: PicaPicaDuel[]
  picaPicaHistory: PicaPicaPointEvent[]
  picaPicaTotalA: number
  picaPicaTotalB: number
  picaPicaRounds: number
  picaPicaRoundsHistory: PicaPicaRoundResult[]
  startedAt: string
  finishedAt?: string
  serverSynced: boolean
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
}

export interface AppState {
  activeMatch: ActiveMatch | null
}

export const TARGET_SCORE = 30

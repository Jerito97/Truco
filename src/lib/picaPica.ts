import type { PicaPicaDuelResult, PicaPicaRoundResult } from '../types'

export function aggregatePicaPicaRounds(rounds: PicaPicaRoundResult[]): PicaPicaDuelResult[] {
  const totals: PicaPicaDuelResult[] = []
  for (const round of rounds) {
    round.duels.forEach((d, i) => {
      const existing = totals[i]
      if (existing) {
        existing.scoreA += d.scoreA
        existing.scoreB += d.scoreB
      } else {
        totals[i] = { aName: d.aName, bName: d.bName, scoreA: d.scoreA, scoreB: d.scoreB }
      }
    })
  }
  return totals
}

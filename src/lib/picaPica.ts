import type { PicaPicaDuelResult, PicaPicaRoundResult } from '../types'

// Un partido puede tener varias rondas de pica-pica, pero las parejas de
// jugadores (quién enfrenta a quién) no cambian dentro del mismo partido, así
// que el mismo índice de duelo siempre corresponde a la misma pareja: alcanza
// con sumar por índice en vez de reagrupar por nombre.
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

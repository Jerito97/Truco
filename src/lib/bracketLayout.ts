// Matemática pura de un bracket de eliminación directa: dónde (en qué "y")
// va centrado cada cruce de cada ronda, para poder dibujarlo como árbol
// (columnas por ronda + líneas que conectan cada par de cruces con el
// siguiente). Separada del componente para poder testearla sin renderizar
// nada.
export interface BracketLayout {
  // Alto total del árbol (el mismo para todas las rondas: cada ronda
  // siguiente tiene la mitad de cruces, pero el doble de alto por cruce).
  totalHeight: number
  // positions[ronda][índice] = centro vertical (en px) de ese cruce.
  positions: number[][]
}

// `roundSizes` es la cantidad de cruces de cada ronda (de la primera a la
// final), p.ej. [4, 2, 1]. El cruce i de la ronda r+1 siempre sale de los
// cruces 2i y 2i+1 de la ronda r (así arma el bracket buildBracket), así que
// su centro queda a mitad de camino entre esos dos — promediando ronda tras
// ronda se obtiene la posición correcta sin importar cuántas rondas haya.
export function computeBracketLayout(roundSizes: number[], slotHeight: number): BracketLayout {
  if (roundSizes.length === 0) return { totalHeight: 0, positions: [] }

  const positions: number[][] = [
    Array.from({ length: roundSizes[0] }, (_, i) => i * slotHeight + slotHeight / 2),
  ]
  for (let r = 1; r < roundSizes.length; r++) {
    const prev = positions[r - 1]
    positions.push(Array.from({ length: roundSizes[r] }, (_, i) => (prev[2 * i] + prev[2 * i + 1]) / 2))
  }

  return { totalHeight: roundSizes[0] * slotHeight, positions }
}

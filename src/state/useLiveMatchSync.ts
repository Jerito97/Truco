import { useEffect, useRef } from 'react'
import type { ActiveMatch } from '../types'

// Agrupa varios cambios de marcador seguidos (doble toque, deshacer) en un
// solo pedido en vez de uno por cada punto.
const DEBOUNCE_MS = 400

// Mientras el partido está en curso, manda el marcador a la base para que el
// resto del grupo lo vea "en vivo" desde el Inicio — sin que quien está
// anotando tenga que tocar nada aparte de sumar o restar puntos. Apenas el
// partido deja de estar "playing" (termina o se descarta) borra la fila; si
// el dispositivo se queda sin avisar (se cerró la app a mitad de partido) la
// fila expira sola del lado del servidor.
export function useLiveMatchSync(activeMatch: ActiveMatch | null): void {
  const lastLiveId = useRef<string | null>(null)

  useEffect(() => {
    const isLive = activeMatch?.status === 'playing'

    if (!isLive) {
      const staleId = lastLiveId.current
      if (staleId) {
        lastLiveId.current = null
        fetch(`/api/matches?id=${encodeURIComponent(staleId)}`, { method: 'DELETE' }).catch(() => {})
      }
      return
    }

    lastLiveId.current = activeMatch.id
    const timeout = window.setTimeout(() => {
      fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeMatch.id,
          teamAName: activeMatch.teamAName,
          teamBName: activeMatch.teamBName,
          teamAPlayerNames: activeMatch.teamAPlayerNames,
          teamBPlayerNames: activeMatch.teamBPlayerNames,
          scoreA: activeMatch.scoreA,
          scoreB: activeMatch.scoreB,
        }),
      }).catch(() => {})
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [activeMatch])
}

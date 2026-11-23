import { useEffect, useState } from 'react'

// Recalcula a partir de startedAt en cada tick (no acumula sumando de a uno)
// para no desincronizarse si el dispositivo se queda dormido un rato: cuando
// se despierta, el valor ya refleja el tiempo real pasado, no el que hubiera
// acumulado tick a tick.
export function useElapsedSeconds(startedAt: string): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
}

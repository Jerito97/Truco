import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'la-mesa-pending-syncs-v1'

interface PendingMatchSync {
  localId: string
  payload: Record<string, unknown>
}

function loadQueue(): PendingMatchSync[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Partidos terminados sin señal no se pierden: quedan en esta cola
// (persistida en localStorage, separada del partido activo) y se suben
// solos cuando el navegador avisa que volvió la conexión, sin depender de
// que el usuario se quede mirando esa pantalla hasta que termine de subir.
export function useSyncQueue() {
  const [queue, setQueue] = useState<PendingMatchSync[]>(() => loadQueue())
  const queueRef = useRef(queue)
  queueRef.current = queue
  const flushingRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  }, [queue])

  const flush = useCallback(async () => {
    if (flushingRef.current) return
    flushingRef.current = true
    try {
      for (const item of queueRef.current) {
        try {
          const res = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          })
          if (res.ok) {
            setQueue((q) => q.filter((x) => x.localId !== item.localId))
          }
        } catch {
          return // sin conexión: cortamos acá, el resto de la cola espera al próximo intento
        }
      }
    } finally {
      flushingRef.current = false
    }
  }, [])

  useEffect(() => {
    flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flush])

  const enqueue = useCallback(
    (localId: string, payload: Record<string, unknown>) => {
      if (queueRef.current.some((x) => x.localId === localId)) return
      // Actualizamos la ref al toque (no esperamos al próximo render) para
      // que el flush que dispara acá abajo ya vea este ítem nuevo.
      const next = [...queueRef.current, { localId, payload }]
      queueRef.current = next
      setQueue(next)
      flush()
    },
    [flush],
  )

  return { pendingIds: queue.map((q) => q.localId), enqueue }
}

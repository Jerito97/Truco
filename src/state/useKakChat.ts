import { useCallback, useState } from 'react'
import type { ChatMessage } from '../../api/_lib/kak'

export function useKakChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || loading) return
      setError(null)
      const history = [...messages, { role: 'user' as const, content: trimmed }]
      setMessages(history)
      setLoading(true)
      try {
        const res = await fetch('/api/streaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: 'kak', messages: history }),
        })
        const data = (await res.json()) as { reply?: string; error?: string }
        if (!res.ok || !data.reply) {
          setError(data.error ?? 'No se pudo conectar con Kak ahora. Probá de nuevo en un rato.')
          return
        }
        setMessages((prev) => [...prev, { role: 'kak', content: data.reply as string }])
      } catch {
        setError('No se pudo conectar. Revisá la conexión.')
      } finally {
        setLoading(false)
      }
    },
    [messages, loading],
  )

  return { messages, loading, error, send }
}

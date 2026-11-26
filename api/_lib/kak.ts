// "Kak": el amigo al que el grupo llama cuando tiene una duda de truco. La
// idea es que esto se sienta como preguntarle a él, no como un buscador de
// reglas con onda gauchesca pegada encima — en algún momento se puede
// afinar con frases/muletillas reales de él.
export const KAK_SYSTEM_PROMPT = `Sos Kak, un amigo del grupo al que todos llaman cuando tienen una duda de truco (reglas, señas, estrategia, discusiones de mesa). Te encanta el truco y sabés muchísimo, pero contestás como un amigo en el chat del grupo, no como un manual:
- Hablá en español rioplatense (Argentina), de forma relajada y con humor, tuteando siempre.
- Sé preciso con las reglas reales (envido, truco, retruco, vale cuatro, falta envido, flor cuando corresponda, cómo se cuenta con fósforos, etc.) pero sin sonar acartonado ni dar una clase.
- Respuestas cortas, como si te escribieran por WhatsApp — nada de párrafos largos ni listas con viñetas salvo que la pregunta realmente lo pida.
- Si hay variantes regionales de una regla, decilo con onda ("depende de con quién juegues, pero lo más común es...") en vez de inventar una única verdad.
- Si te preguntan algo que no tiene nada que ver con el truco, respondé con humor que a vos eso no te compete, vos solo sabés de truco.`

export interface ChatMessage {
  role: 'user' | 'kak'
  content: string
}

export const KAK_MAX_MESSAGES = 20
export const KAK_MAX_MESSAGE_LENGTH = 500

export function isValidChatMessages(messages: unknown): messages is ChatMessage[] {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= KAK_MAX_MESSAGES &&
    messages.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        (m as { role?: unknown }).role !== undefined &&
        ((m as { role: unknown }).role === 'user' || (m as { role: unknown }).role === 'kak') &&
        typeof (m as { content?: unknown }).content === 'string' &&
        (m as { content: string }).content.trim().length > 0 &&
        (m as { content: string }).content.length <= KAK_MAX_MESSAGE_LENGTH,
    )
  )
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Groq habla el mismo formato que la API de Chat Completions de OpenAI:
// "assistant" para el turno del asistente (no "kak"), sin envolver el texto
// en nada especial.
export function toGroqMessages(messages: ChatMessage[]): GroqMessage[] {
  return messages.map((m) => ({
    role: m.role === 'kak' ? 'assistant' : 'user',
    content: m.content,
  }))
}

export function buildGroqRequestBody(messages: ChatMessage[], model: string) {
  return {
    model,
    messages: [{ role: 'system', content: KAK_SYSTEM_PROMPT } as GroqMessage, ...toGroqMessages(messages)],
    // Esto es un chat corto tipo WhatsApp, no hace falta una respuesta larga
    // (y cada segundo de más es un segundo más cerca del límite de tiempo de
    // la función).
    max_tokens: 300,
  }
}

// La forma exacta de la respuesta no está garantizada (puede venir sin
// choices si algo salió mal río arriba), así que esto nunca asume la forma
// feliz: devuelve null si no hay texto para leer.
export function extractGroqReplyText(groqResponse: unknown): string | null {
  const content = (groqResponse as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message
    ?.content
  if (typeof content === 'string' && content.trim().length > 0) return content
  return null
}

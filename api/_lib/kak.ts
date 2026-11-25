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

// Gemini llama "model" al turno del asistente (no "kak"), y espera el texto
// envuelto en `parts`.
export function toGeminiContents(messages: ChatMessage[]): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  return messages.map((m) => ({
    role: m.role === 'kak' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

export function buildGeminiRequestBody(messages: ChatMessage[]) {
  return {
    system_instruction: { parts: [{ text: KAK_SYSTEM_PROMPT }] },
    contents: toGeminiContents(messages),
  }
}

// La forma exacta de la respuesta de Gemini no está garantizada (puede venir
// sin candidatos si lo bloqueó el filtro de seguridad, por ejemplo), así que
// esto nunca asume la forma feliz: devuelve null si no hay texto para leer.
export function extractReplyText(geminiResponse: unknown): string | null {
  const text = (geminiResponse as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)
    ?.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === 'string' && text.trim().length > 0 ? text : null
}

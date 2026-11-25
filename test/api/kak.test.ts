import { describe, expect, it } from 'vitest'
import {
  KAK_MAX_MESSAGES,
  buildGeminiRequestBody,
  extractReplyText,
  isValidChatMessages,
  toGeminiContents,
} from '../../api/_lib/kak.js'

describe('isValidChatMessages', () => {
  it('rechaza algo que no es un array', () => {
    expect(isValidChatMessages('no')).toBe(false)
    expect(isValidChatMessages(null)).toBe(false)
  })

  it('rechaza un array vacío', () => {
    expect(isValidChatMessages([])).toBe(false)
  })

  it('acepta mensajes válidos de user y kak', () => {
    expect(
      isValidChatMessages([
        { role: 'user', content: '¿Cuánto vale el envido?' },
        { role: 'kak', content: 'Depende de las cartas, pibe.' },
      ]),
    ).toBe(true)
  })

  it('rechaza un rol que no sea user ni kak', () => {
    expect(isValidChatMessages([{ role: 'admin', content: 'hola' }])).toBe(false)
  })

  it('rechaza contenido vacío o solo espacios', () => {
    expect(isValidChatMessages([{ role: 'user', content: '   ' }])).toBe(false)
  })

  it('rechaza más mensajes que el máximo permitido', () => {
    const tooMany = Array.from({ length: KAK_MAX_MESSAGES + 1 }, () => ({ role: 'user', content: 'hola' }))
    expect(isValidChatMessages(tooMany)).toBe(false)
  })

  it('rechaza un mensaje demasiado largo', () => {
    expect(isValidChatMessages([{ role: 'user', content: 'a'.repeat(501) }])).toBe(false)
  })
})

describe('toGeminiContents', () => {
  it('mapea "kak" a "model" (así lo llama Gemini) y deja "user" igual', () => {
    const contents = toGeminiContents([
      { role: 'user', content: 'hola' },
      { role: 'kak', content: 'qué onda' },
    ])
    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'hola' }] },
      { role: 'model', parts: [{ text: 'qué onda' }] },
    ])
  })
})

describe('buildGeminiRequestBody', () => {
  it('incluye el system prompt y los contenidos mapeados', () => {
    const body = buildGeminiRequestBody([{ role: 'user', content: 'hola' }])
    expect(body.system_instruction.parts[0].text).toContain('Kak')
    expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hola' }] }])
  })
})

describe('extractReplyText', () => {
  it('extrae el texto de una respuesta con la forma esperada', () => {
    const response = { candidates: [{ content: { parts: [{ text: 'así se juega' }] } }] }
    expect(extractReplyText(response)).toBe('así se juega')
  })

  it('devuelve null si no hay candidatos (por ejemplo, bloqueado por el filtro de seguridad)', () => {
    expect(extractReplyText({ candidates: [] })).toBeNull()
  })

  it('devuelve null ante cualquier forma inesperada en vez de tirar una excepción', () => {
    expect(extractReplyText(null)).toBeNull()
    expect(extractReplyText({})).toBeNull()
    expect(extractReplyText({ candidates: [{}] })).toBeNull()
  })

  it('devuelve null si el texto viene vacío', () => {
    expect(extractReplyText({ candidates: [{ content: { parts: [{ text: '   ' }] } }] })).toBeNull()
  })
})

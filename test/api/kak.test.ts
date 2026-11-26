import { describe, expect, it } from 'vitest'
import {
  KAK_MAX_MESSAGES,
  buildGroqRequestBody,
  extractGroqReplyText,
  isValidChatMessages,
  toGroqMessages,
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

describe('toGroqMessages', () => {
  it('mapea "kak" a "assistant" (así lo llama Groq/OpenAI) y deja "user" igual', () => {
    const messages = toGroqMessages([
      { role: 'user', content: 'hola' },
      { role: 'kak', content: 'qué onda' },
    ])
    expect(messages).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'qué onda' },
    ])
  })
})

describe('buildGroqRequestBody', () => {
  it('incluye el modelo, el system prompt primero y los mensajes mapeados', () => {
    const body = buildGroqRequestBody([{ role: 'user', content: 'hola' }], 'llama-3.3-70b-versatile')
    expect(body.model).toBe('llama-3.3-70b-versatile')
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('Kak')
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hola' })
  })

  it('pone un tope de largo a la respuesta', () => {
    const body = buildGroqRequestBody([{ role: 'user', content: 'hola' }], 'llama-3.3-70b-versatile')
    expect(body.max_tokens).toBeGreaterThan(0)
  })
})

describe('extractGroqReplyText', () => {
  it('extrae el texto de una respuesta con la forma esperada', () => {
    const response = { choices: [{ message: { content: 'así se juega' } }] }
    expect(extractGroqReplyText(response)).toBe('así se juega')
  })

  it('devuelve null si no hay choices', () => {
    expect(extractGroqReplyText({ choices: [] })).toBeNull()
  })

  it('devuelve null ante cualquier forma inesperada en vez de tirar una excepción', () => {
    expect(extractGroqReplyText(null)).toBeNull()
    expect(extractGroqReplyText({})).toBeNull()
    expect(extractGroqReplyText({ choices: [{}] })).toBeNull()
  })

  it('devuelve null si el texto viene vacío', () => {
    expect(extractGroqReplyText({ choices: [{ message: { content: '   ' } }] })).toBeNull()
  })
})

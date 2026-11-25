import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { KakChat } from './KakChat'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('KakChat', () => {
  it('manda la pregunta y muestra la respuesta de Kak', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: 'Se cuenta con fósforos, campeón.' }), { status: 200 })),
    )
    render(<KakChat onBack={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Preguntale a Kak...'), {
      target: { value: '¿Cómo se cuentan los puntos?' },
    })
    fireEvent.click(screen.getByLabelText('Enviar'))

    expect(screen.getByText('¿Cómo se cuentan los puntos?')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Se cuenta con fósforos, campeón.')).toBeInTheDocument())

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body.resource).toBe('kak')
    expect(body.messages).toEqual([{ role: 'user', content: '¿Cómo se cuentan los puntos?' }])
  })

  it('si falla, muestra el mensaje de error en vez de una respuesta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'No se pudo conectar con Kak ahora.' }), { status: 502 })),
    )
    render(<KakChat onBack={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Preguntale a Kak...'), { target: { value: 'hola' } })
    fireEvent.click(screen.getByLabelText('Enviar'))

    await waitFor(() => expect(screen.getByText('No se pudo conectar con Kak ahora.')).toBeInTheDocument())
  })
})

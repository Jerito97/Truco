import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useSyncQueue } from './useSyncQueue'

const STORAGE_KEY = 'la-mesa-pending-syncs-v1'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useSyncQueue', () => {
  it('encola un partido, lo manda con su clientId y lo saca de la cola si el servidor confirma', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useSyncQueue())

    act(() => {
      result.current.enqueue('match-1', { teamAName: 'Nosotros' })
    })

    await waitFor(() => expect(result.current.pendingIds).not.toContain('match-1'))

    expect(fetchMock).toHaveBeenCalledWith('/api/matches', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body).toMatchObject({ clientId: 'match-1', teamAName: 'Nosotros' })
  })

  it('si el POST falla (sin señal), el partido se queda pendiente para reintentar', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useSyncQueue())
    act(() => {
      result.current.enqueue('match-2', { teamAName: 'Nosotros' })
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(result.current.pendingIds).toContain('match-2')
  })

  it('completa el clientId con el localId para partidos que quedaron encolados antes del fix anti-duplicado', async () => {
    // Simula lo que dejó guardado una versión vieja de la app: el payload no
    // tenía clientId todavía.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ localId: 'old-match', payload: { teamAName: 'Nosotros' } }]),
    )
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useSyncQueue())

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.clientId).toBe('old-match')
  })

  it('enqueue es idempotente: un mismo id ya pendiente no se vuelve a encolar ni reenviar', async () => {
    let resolveFetch!: (v: Response) => void
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useSyncQueue())
    act(() => {
      result.current.enqueue('match-3', { teamAName: 'A' })
    })
    act(() => {
      result.current.enqueue('match-3', { teamAName: 'A (otro intento)' })
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.pendingIds).toEqual(['match-3'])

    resolveFetch(new Response(null, { status: 201 }))
    await waitFor(() => expect(result.current.pendingIds).toEqual([]))
  })
})

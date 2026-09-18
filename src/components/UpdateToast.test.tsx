import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { UpdateToast } from './UpdateToast'

const updateServiceWorker = vi.fn()
let needRefresh = false

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefresh, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}))

afterEach(() => {
  cleanup()
  needRefresh = false
  updateServiceWorker.mockClear()
})

describe('UpdateToast', () => {
  it('no muestra nada si no hay una versión nueva esperando', () => {
    needRefresh = false
    render(<UpdateToast />)
    expect(screen.queryByText(/versión nueva/i)).not.toBeInTheDocument()
  })

  it('muestra el aviso y, al tocar Actualizar, dispara el reemplazo del service worker', async () => {
    needRefresh = true
    render(<UpdateToast />)
    expect(screen.getByText(/versión nueva/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})

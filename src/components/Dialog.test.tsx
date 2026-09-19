import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ConfirmDialog } from './Dialog'

afterEach(() => {
  cleanup()
})

describe('ConfirmDialog', () => {
  it('Escape cancela, igual que el confirm() nativo que reemplaza', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="¿Borrar?" message="..." onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('tocar afuera de la tarjeta (el backdrop) cancela', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="¿Borrar?" message="..." onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByTestId('dialog-backdrop'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('tocar adentro de la tarjeta NO cancela', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="¿Borrar?" message="..." onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByText('¿Borrar?'))
    expect(onCancel).not.toHaveBeenCalled()
  })
})

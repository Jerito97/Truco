import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{
          backgroundColor: 'var(--color-wood-900)',
          borderColor: 'rgba(203, 170, 106, 0.3)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function DialogButtons({
  cancelLabel,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
  confirmDisabled,
}: {
  cancelLabel: string
  confirmLabel: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      <button
        type="button"
        onClick={onCancel}
        className="py-2.5 rounded-xl font-bold border"
        style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled}
        className="py-2.5 rounded-xl font-bold border disabled:opacity-40"
        style={{
          borderColor: danger ? '#8a3f38' : 'var(--color-ember-600)',
          color: danger ? '#d9695f' : 'var(--color-ember-500)',
        }}
      >
        {confirmLabel}
      </button>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <Overlay>
      <h3 className="font-poster text-xl mb-2" style={{ color: 'var(--color-paper-50)' }}>
        {title}
      </h3>
      <p className="text-sm opacity-80" style={{ color: 'var(--color-paper-100)' }}>
        {message}
      </p>
      <DialogButtons
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        danger={danger}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </Overlay>
  )
}

export function PromptDialog({
  open,
  title,
  placeholder,
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onSubmit,
  onCancel,
}: {
  open: boolean
  title: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')

  // Arranca vacío cada vez que se abre (en vez de arrastrar lo que había
  // quedado tipeado la última vez que se usó este diálogo).
  useEffect(() => {
    if (open) setValue('')
  }, [open])

  if (!open) return null

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <Overlay>
      <h3 className="font-poster text-xl mb-3" style={{ color: 'var(--color-paper-50)' }}>
        {title}
      </h3>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        autoFocus
        className="w-full rounded-lg px-3 py-2.5 border outline-none"
        style={{
          borderColor: 'rgba(203, 170, 106, 0.35)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          color: 'var(--color-paper-50)',
        }}
      />
      <DialogButtons
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        onCancel={onCancel}
        onConfirm={submit}
        confirmDisabled={!value.trim()}
      />
    </Overlay>
  )
}

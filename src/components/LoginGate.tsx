import { useState } from 'react'

export function LoginGate({
  loading,
  error,
  pendingName,
  onSubmit,
  onConfirm,
  onCancel,
}: {
  loading: boolean
  error: string | null
  pendingName: string | null
  onSubmit: (name: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim() || loading) return
    onSubmit(name.trim())
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 text-center">
      <img src="/logo.webp" alt="Osobuco" className="w-48 h-48 mb-6" />

      {pendingName ? (
        <div className="w-full max-w-xs">
          <p className="mb-6" style={{ color: 'var(--color-paper-100)' }}>
            Ya hay una cuenta con el nombre <span className="font-bold">"{pendingName}"</span>.
            <br />
            ¿Sos vos?
          </p>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-xl font-poster text-xl tracking-[0.1em] border mb-3 disabled:opacity-40"
            style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
          >
            {loading ? 'Entrando...' : 'Sí, soy yo'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl font-bold border"
            style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
          >
            No, soy otra persona
          </button>
        </div>
      ) : (
        <>
          <p className="mb-8 opacity-70">
            Llevá la cuenta.
            <br />
            Viví el juego.
          </p>

          <div className="w-full max-w-xs">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Tu nombre"
              maxLength={40}
              autoFocus
              className="w-full rounded-lg px-3 py-3 border outline-none text-center font-poster text-xl mb-3"
              style={{
                borderColor: 'rgba(203, 170, 106, 0.35)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'var(--color-paper-50)',
              }}
            />
            {error && (
              <p className="text-sm mb-3" style={{ color: '#d9695f' }}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim() || loading}
              className="w-full py-3 rounded-xl font-poster text-xl tracking-[0.15em] uppercase border disabled:opacity-40"
              style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
            >
              {loading ? 'Entrando...' : 'Comenzar'}
            </button>
            <p className="text-xs opacity-50 mt-4">
              Sin contraseña: si ese nombre ya existe, te vamos a preguntar si sos vos.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

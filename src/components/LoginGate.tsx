import { useState } from 'react'
import { CardsIcon } from './icons'

export function LoginGate({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean
  error: string | null
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState('')

  const submit = () => {
    if (!name.trim() || loading) return
    onSubmit(name.trim())
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center border mb-6"
        style={{ borderColor: 'var(--color-ember-600)' }}
      >
        <CardsIcon className="w-11 h-11" style={{ color: 'var(--color-ember-500)' }} />
      </div>

      <h1 className="font-poster text-5xl tracking-wide" style={{ color: 'var(--color-paper-50)' }}>
        Osobuco
      </h1>
      <p className="text-xs tracking-[0.3em] uppercase opacity-60 mt-2 mb-8">Marcador</p>

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
          style={{ borderColor: 'rgba(203, 170, 106, 0.35)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--color-paper-50)' }}
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
          Sin contraseña: si ya usaste este nombre antes, entrás directo a esa cuenta.
        </p>
      </div>
    </div>
  )
}

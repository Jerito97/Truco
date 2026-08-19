import { useState } from 'react'

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
    <div className="min-h-full flex items-center justify-center px-4">
      <div className="paper-card rounded-2xl p-6 w-full max-w-sm text-center">
        <h1 className="font-poster text-4xl mb-1">La Mesa</h1>
        <p className="text-sm opacity-70 mb-6">Decinos tu nombre para entrar a la mesa</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Tu nombre"
          maxLength={40}
          autoFocus
          className="w-full rounded-lg px-3 py-3 border-2 bg-white/40 outline-none text-center font-poster text-xl mb-3"
          style={{ borderColor: 'var(--color-wood-600)' }}
        />
        {error && (
          <p className="text-sm mb-3" style={{ color: 'var(--color-matchhead-600)' }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || loading}
          className="w-full py-3 rounded-xl font-poster text-xl tracking-wide disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-ember-500)', color: 'var(--color-wood-950)' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-xs opacity-50 mt-4">
          Sin contraseña: si ya usaste este nombre antes, entrás directo a esa cuenta.
        </p>
      </div>
    </div>
  )
}

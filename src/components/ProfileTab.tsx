import type { User } from '../types'

export function ProfileTab({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="space-y-4">
      <div className="paper-card rounded-2xl p-6 text-center">
        <p className="uppercase tracking-widest text-xs opacity-60 mb-2">Tu cuenta</p>
        <h2 className="font-poster text-3xl mb-1">{user.name}</h2>
        <p className="text-sm opacity-60 mb-6">
          Tu historial de partidos está ligado a este nombre, en cualquier dispositivo donde entres con él.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="px-4 py-2 rounded-lg font-bold border-2"
          style={{ borderColor: 'var(--color-wood-700)', color: 'var(--color-wood-700)' }}
        >
          Cambiar de usuario
        </button>
      </div>
    </div>
  )
}

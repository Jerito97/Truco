import { useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import {
  BackIcon,
  ChartIcon,
  ChevronRightIcon,
  GearIcon,
  LogoutIcon,
  PencilIcon,
  PersonIcon,
  ShieldIcon,
  TrophyIcon,
} from './icons'
import { AdminScreen } from './AdminScreen'

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="font-num text-2xl font-bold" style={{ color: 'var(--color-paper-50)' }}>
        {value}
      </div>
      <div className="text-[11px] opacity-60 mt-0.5">{label}</div>
    </div>
  )
}

function MenuRow({ icon, label, danger, onClick }: { icon: ReactNode; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 text-left"
      style={{ color: danger ? '#d9695f' : 'var(--color-paper-100)' }}
    >
      {icon}
      <span className="flex-1 font-medium">{label}</span>
      {!danger && <ChevronRightIcon className="w-4 h-4 opacity-40" />}
    </button>
  )
}

function AdminUnlock({
  onUnlock,
  onBack,
}: {
  onUnlock: (code: string) => Promise<string | null>
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)
    const err = await onUnlock(code.trim())
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Modo administrador
        </h2>
        <span className="w-5" />
      </div>

      <p className="text-sm opacity-70 text-center">Ingresá el código de administrador para continuar.</p>

      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Código"
        autoFocus
        className="w-full rounded-lg px-3 py-3 border outline-none text-center font-num text-lg"
        style={{ borderColor: 'rgba(203, 170, 106, 0.35)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--color-paper-50)' }}
      />
      {error && (
        <p className="text-sm text-center" style={{ color: '#d9695f' }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!code.trim() || loading}
        className="w-full py-3 rounded-xl font-poster text-xl tracking-wide border disabled:opacity-40"
        style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
      >
        {loading ? 'Verificando...' : 'Desbloquear'}
      </button>
    </div>
  )
}

export function ProfileTab({
  user,
  onLogout,
  onUnlockAdmin,
}: {
  user: User
  onLogout: () => void
  onUnlockAdmin: (code: string) => Promise<string | null>
}) {
  const [view, setView] = useState<'profile' | 'unlock' | 'admin'>('profile')
  const { matches } = useMatches(user.id, 0)
  const played = matches?.length ?? 0
  const won =
    matches?.filter(
      (m) =>
        (m.winner === 'A' && m.team_a_player_ids.includes(user.id)) ||
        (m.winner === 'B' && m.team_b_player_ids.includes(user.id)),
    ).length ?? 0
  const pct = played > 0 ? Math.round((won / played) * 100) : 0
  const since = user.created_at ? new Date(user.created_at).getFullYear() : null

  if (view === 'unlock') {
    return (
      <AdminUnlock
        onBack={() => setView('profile')}
        onUnlock={async (code) => {
          const err = await onUnlockAdmin(code)
          if (!err) setView('admin')
          return err
        }}
      />
    )
  }

  if (view === 'admin') {
    return <AdminScreen currentUser={user} onBack={() => setView('profile')} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackIcon className="w-5 h-5 opacity-0" aria-hidden />
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Mi perfil
        </h2>
        <PencilIcon className="w-5 h-5 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
      </div>

      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border"
          style={{ borderColor: 'var(--color-ember-600)' }}
        >
          <PersonIcon className="w-9 h-9" style={{ color: 'var(--color-ember-500)' }} />
        </div>
        <h3 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          {user.name}
        </h3>
        {since && <p className="text-sm opacity-60">Jugando desde {since}</p>}
      </div>

      <div className="flex rounded-2xl border py-4" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
        <StatBlock value={String(played)} label="Partidos jugados" />
        <div className="w-px" style={{ backgroundColor: 'rgba(203, 170, 106, 0.25)' }} />
        <StatBlock value={String(won)} label="Partidos ganados" />
        <div className="w-px" style={{ backgroundColor: 'rgba(203, 170, 106, 0.25)' }} />
        <StatBlock value={`${pct}%`} label="Porcentaje de victorias" />
      </div>

      <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
        <MenuRow icon={<ChartIcon className="w-5 h-5" />} label="Estadísticas" />
        <MenuRow icon={<TrophyIcon className="w-5 h-5" />} label="Logros" />
        <MenuRow icon={<GearIcon className="w-5 h-5" />} label="Configuración" />
        <MenuRow
          icon={<ShieldIcon className="w-5 h-5" />}
          label="Modo administrador"
          onClick={() => setView(user.is_admin ? 'admin' : 'unlock')}
        />
        <MenuRow icon={<LogoutIcon className="w-5 h-5" />} label="Cerrar sesión" danger onClick={onLogout} />
      </div>
    </div>
  )
}

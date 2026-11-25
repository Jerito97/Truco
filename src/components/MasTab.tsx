import { useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { BackIcon, CardsIcon, ChartIcon, ChevronRightIcon, LogoutIcon, PeopleIcon, ShieldIcon, TrophyIcon } from './icons'
import { AdminScreen } from './AdminScreen'
import { StatsScreen } from './StatsScreen'
import { RankingScreen } from './RankingScreen'
import { PlayersScreen } from './PlayersScreen'
import { MyMatchesScreen } from './MyMatchesScreen'

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

export function MasTab({
  user,
  onLogout,
  onUnlockAdmin,
  onOpenTournaments,
}: {
  user: User
  onLogout: () => void
  onUnlockAdmin: (code: string) => Promise<string | null>
  onOpenTournaments?: () => void
}) {
  const [view, setView] = useState<'menu' | 'unlock' | 'admin' | 'stats' | 'ranking' | 'players' | 'matches'>('menu')
  const { matches } = useMatches(user.id, 0)

  if (view === 'unlock') {
    return (
      <AdminUnlock
        onBack={() => setView('menu')}
        onUnlock={async (code) => {
          const err = await onUnlockAdmin(code)
          if (!err) setView('admin')
          return err
        }}
      />
    )
  }

  if (view === 'admin') {
    return <AdminScreen currentUser={user} onBack={() => setView('menu')} />
  }

  if (view === 'stats') {
    return <StatsScreen user={user} matches={matches} onBack={() => setView('menu')} />
  }

  if (view === 'matches') {
    return <MyMatchesScreen user={user} onBack={() => setView('menu')} />
  }

  if (view === 'ranking') {
    return <RankingScreen currentUser={user} onBack={() => setView('menu')} />
  }

  if (view === 'players') {
    return <PlayersScreen currentUser={user} onBack={() => setView('menu')} />
  }

  return (
    <div className="space-y-6">
      <h2 className="font-poster text-2xl text-center" style={{ color: 'var(--color-paper-50)' }}>
        Más
      </h2>

      <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
        <MenuRow icon={<CardsIcon className="w-5 h-5" />} label="Mis partidos" onClick={() => setView('matches')} />
        <MenuRow icon={<ChartIcon className="w-5 h-5" />} label="Estadísticas" onClick={() => setView('stats')} />
        <MenuRow icon={<TrophyIcon className="w-5 h-5" />} label="Ranking general" onClick={() => setView('ranking')} />
        {onOpenTournaments && (
          <MenuRow icon={<TrophyIcon className="w-5 h-5" />} label="Torneos" onClick={onOpenTournaments} />
        )}
        <MenuRow icon={<PeopleIcon className="w-5 h-5" />} label="Jugadores" onClick={() => setView('players')} />
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

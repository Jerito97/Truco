import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import {
  CardsIcon,
  ChartIcon,
  ChevronRightIcon,
  CrownIcon,
  LogoutIcon,
  PeopleIcon,
  ShieldIcon,
  TrophyIcon,
} from './icons'
import { AdminScreen } from './AdminScreen'
import { StatsScreen } from './StatsScreen'
import { RankingScreen, sortRows, type LeaderboardEntry } from './RankingScreen'
import { PlayersScreen } from './PlayersScreen'
import { MyMatchesScreen } from './MyMatchesScreen'
import { ConfirmDialog } from './Dialog'
import { ScreenHeader } from './ScreenHeader'

const cardStyle = { borderColor: 'rgba(203, 170, 106, 0.25)', backgroundColor: 'rgba(203, 170, 106, 0.04)' }
const iconBoxStyle = { backgroundColor: 'rgba(203, 170, 106, 0.14)' }
const GREEN = '#4caf6a'

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide opacity-50 pl-1">{children}</p>
  )
}

function MenuCard({
  icon,
  label,
  subtitle,
  badge,
  onClick,
}: {
  icon: ReactNode
  label: string
  subtitle: string
  badge?: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left"
      style={cardStyle}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={iconBoxStyle}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" style={{ color: 'var(--color-paper-50)' }}>
          {label}
        </p>
        <p className="text-xs opacity-60 truncate">{subtitle}</p>
      </div>
      {badge}
      <ChevronRightIcon className="w-4 h-4 opacity-40 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
    </button>
  )
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className="w-9 h-5 rounded-full border shrink-0 flex items-center px-0.5"
      style={{
        borderColor: on ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
        backgroundColor: on ? 'rgba(203, 170, 106, 0.25)' : 'transparent',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: on ? 'var(--color-ember-500)' : 'var(--color-paper-200)' }} />
    </span>
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
    <div className="screen-fill flex flex-col">
      <ScreenHeader title="Modo administrador" onBack={onBack} />

      <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
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
    </div>
  )
}

export function MasTab({
  user,
  onLogout,
  onUnlockAdmin,
  onOpenTournaments,
  onOpenKak,
}: {
  user: User
  onLogout: () => void
  onUnlockAdmin: (code: string) => Promise<string | null>
  onOpenTournaments?: () => void
  onOpenKak?: () => void
}) {
  const [view, setView] = useState<'menu' | 'unlock' | 'admin' | 'stats' | 'ranking' | 'players' | 'matches'>('menu')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const { matches } = useMatches(user.id, 0)

  const [rankPosition, setRankPosition] = useState<number | null>(null)
  const [activeTournaments, setActiveTournaments] = useState<number | null>(null)
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? (r.json() as Promise<LeaderboardEntry[]>) : Promise.reject()))
      .then((rows) => {
        const idx = sortRows(rows, 'performance').findIndex((r) => r.id === user.id)
        setRankPosition(idx === -1 ? null : idx + 1)
      })
      .catch(() => setRankPosition(null))
  }, [user.id])

  useEffect(() => {
    if (!onOpenTournaments) return
    fetch('/api/matches?tournaments=1&status=en_curso')
      .then((r) => (r.ok ? (r.json() as Promise<unknown[]>) : Promise.reject()))
      .then((rows) => setActiveTournaments(rows.length))
      .catch(() => setActiveTournaments(null))
  }, [onOpenTournaments])

  useEffect(() => {
    fetch('/api/users/search')
      .then((r) => (r.ok ? (r.json() as Promise<unknown[]>) : Promise.reject()))
      .then((rows) => setPlayerCount(rows.length))
      .catch(() => setPlayerCount(null))
  }, [])

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
    return <AdminScreen currentUser={user} onBack={() => setView('menu')} onOpenKak={onOpenKak} />
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
      <ScreenHeader title="Más" subtitle="Torneos, ranking y gestión de la cuenta" />

      {user.is_admin && (
        <div
          className="rounded-xl border px-4 py-2.5 flex items-center gap-2"
          style={{ borderColor: 'var(--color-ember-600)', backgroundColor: 'rgba(203, 170, 106, 0.1)' }}
        >
          <ShieldIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--color-ember-500)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--color-ember-500)' }}>
            Modo administrador activado
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        <SectionLabel>Tu juego</SectionLabel>
        <MenuCard
          icon={<CardsIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
          label="Mis partidos"
          subtitle="Repasá todo lo que jugaste"
          onClick={() => setView('matches')}
        />
        <MenuCard
          icon={<ChartIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
          label="Estadísticas"
          subtitle="Contra cada rival y compañero"
          onClick={() => setView('stats')}
        />
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Competencia y comunidad</SectionLabel>
        <MenuCard
          icon={<CrownIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
          label="Ranking general"
          subtitle="Mirá cómo estás parado"
          badge={
            rankPosition != null && (
              <span className="text-sm font-bold shrink-0" style={{ color: 'var(--color-ember-500)' }}>
                #{rankPosition}
              </span>
            )
          }
          onClick={() => setView('ranking')}
        />
        {onOpenTournaments && (
          <MenuCard
            icon={<TrophyIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
            label="Torneos"
            subtitle="Armá uno o seguí uno en curso"
            badge={
              activeTournaments != null &&
              activeTournaments > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ color: GREEN }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
                  {activeTournaments} activo{activeTournaments === 1 ? '' : 's'}
                </span>
              )
            }
            onClick={onOpenTournaments}
          />
        )}
        <MenuCard
          icon={<PeopleIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
          label="Jugadores"
          subtitle="Todos los registrados"
          badge={
            playerCount != null && (
              <span className="text-sm font-bold shrink-0" style={{ color: 'var(--color-ember-500)' }}>
                {playerCount}
              </span>
            )
          }
          onClick={() => setView('players')}
        />
      </div>

      <div className="space-y-2.5">
        <SectionLabel>Gestión y cuenta</SectionLabel>
        <MenuCard
          icon={<ShieldIcon className="w-5 h-5" style={{ color: 'var(--color-ember-500)' }} />}
          label="Modo administrador"
          subtitle={user.is_admin ? 'Activado' : 'Gestioná usuarios y partidos'}
          badge={<Switch on={user.is_admin ?? false} />}
          onClick={() => setView(user.is_admin ? 'admin' : 'unlock')}
        />
      </div>

      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border font-bold"
        style={{ borderColor: '#d9695f', color: '#d9695f' }}
      >
        <LogoutIcon className="w-5 h-5" />
        Cerrar sesión
      </button>

      <ConfirmDialog
        open={confirmingLogout}
        title="¿Cerrar sesión?"
        message="Vas a tener que volver a entrar con tu nombre la próxima vez."
        confirmLabel="Cerrar sesión"
        danger
        onConfirm={() => {
          setConfirmingLogout(false)
          onLogout()
        }}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  )
}

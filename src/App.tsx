import { useEffect, useRef, useState } from 'react'
import { useAppState } from './state/useAppState'
import { useSession } from './state/useSession'
import { useOnlineStatus } from './state/useOnlineStatus'
import { useLiveMatchSync } from './state/useLiveMatchSync'
import { TabBar, type Tab } from './components/TabBar'
import { PartidoTab } from './components/PartidoTab'
import { HistorialTab } from './components/HistorialTab'
import { ProfileTab } from './components/ProfileTab'
import { MasTab } from './components/MasTab'
import { LoginGate } from './components/LoginGate'
import { UpdateToast } from './components/UpdateToast'
import { TournamentsListScreen } from './components/TournamentsListScreen'
import { TournamentSetup } from './components/TournamentSetup'
import { TournamentView, type MatchSetupPayload } from './components/TournamentView'
import { KakChat } from './components/KakChat'
import type { Tournament, TournamentContext } from './types'

type TournamentRoute = { screen: 'list' } | { screen: 'setup' } | { screen: 'view'; id: string }

function OfflineBanner() {
  return (
    <div
      className="text-center text-xs font-bold py-1.5 px-4"
      style={{ backgroundColor: 'var(--color-wood-800)', color: 'var(--color-paper-200)' }}
    >
      Sin conexión — podés seguir jugando, se guarda todo apenas vuelva la señal
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('inicio')
  const { user, loading, error, pendingName, register, confirmPending, cancelPending, logout, unlockAdmin, renameSelf } =
    useSession()
  const state = useAppState()
  useLiveMatchSync(state.activeMatch)
  const online = useOnlineStatus()
  const [historialRefreshKey, setHistorialRefreshKey] = useState(0)
  const [tournamentRoute, setTournamentRoute] = useState<TournamentRoute | null>(null)
  const [kakOpen, setKakOpen] = useState(false)

  const wasFinished = useRef(false)
  useEffect(() => {
    const justFinished = state.activeMatch?.status === 'finished'
    if (justFinished && !wasFinished.current) {
      setHistorialRefreshKey((k) => k + 1)
    }
    wasFinished.current = justFinished
  }, [state.activeMatch?.status])

  // Al cambiar de pestaña el scroll de la anterior quedaba como estaba (por
  // ejemplo, bajar en Historial y después entrar a Perfil arrancaba a mitad
  // de página en vez de arriba del todo).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  if (!user) {
    return (
      <>
        <UpdateToast />
        {!online && <OfflineBanner />}
        <LoginGate
          loading={loading}
          error={error}
          pendingName={pendingName}
          onSubmit={register}
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
      </>
    )
  }

  const playTournamentFixture = (setup: MatchSetupPayload, context: TournamentContext) => {
    state.startMatch({ ...setup, tournamentContext: context })
    setTab('inicio')
    setTournamentRoute(null)
  }

  const backToTournament = (tournamentId: string) => {
    state.clearMatch()
    setTournamentRoute({ screen: 'view', id: tournamentId })
  }

  return (
    <div className="min-h-full pb-24">
      <UpdateToast />
      {!online && <OfflineBanner />}
      <main className="max-w-md mx-auto px-4 pt-6">
        {kakOpen ? (
          <KakChat onBack={() => setKakOpen(false)} />
        ) : tournamentRoute ? (
          tournamentRoute.screen === 'list' ? (
            <TournamentsListScreen
              onBack={() => setTournamentRoute(null)}
              onCreateNew={() => setTournamentRoute({ screen: 'setup' })}
              onOpen={(t: Tournament) => setTournamentRoute({ screen: 'view', id: t.id })}
            />
          ) : tournamentRoute.screen === 'setup' ? (
            <TournamentSetup
              currentUser={user}
              onBack={() => setTournamentRoute({ screen: 'list' })}
              onCreated={(t) => setTournamentRoute({ screen: 'view', id: t.id })}
            />
          ) : (
            <TournamentView
              tournamentId={tournamentRoute.id}
              currentUser={user}
              onBack={() => setTournamentRoute({ screen: 'list' })}
              onPlayFixture={playTournamentFixture}
            />
          )
        ) : (
          <>
            {tab === 'inicio' && (
              <PartidoTab
                currentUser={user}
                activeMatch={state.activeMatch}
                isSyncPending={state.isSyncPending}
                onStart={state.startMatch}
                onAdd={state.addPoint}
                onSub={state.subtractPoint}
                onEnterPicaPica={state.enterPicaPica}
                onPicaPicaAdd={state.addPicaPicaPoint}
                onPicaPicaSub={state.subtractPicaPicaPoint}
                onPicaPicaClose={state.closePicaPica}
                onPicaPicaCancel={state.cancelPicaPica}
                onRematch={state.rematch}
                onNewMatch={state.clearMatch}
                onBackToTournament={backToTournament}
                onOpenTournaments={() => setTournamentRoute({ screen: 'list' })}
                onOpenKak={() => setKakOpen(true)}
              />
            )}
            {tab === 'historial' && <HistorialTab user={user} refreshKey={historialRefreshKey} />}
            {tab === 'mas' && (
              <MasTab
                user={user}
                onLogout={logout}
                onUnlockAdmin={unlockAdmin}
                onOpenTournaments={() => setTournamentRoute({ screen: 'list' })}
                onOpenKak={() => setKakOpen(true)}
              />
            )}
            {tab === 'perfil' && <ProfileTab user={user} onRenameSelf={renameSelf} />}
          </>
        )}
      </main>

      <TabBar
        active={tab}
        onChange={(t) => {
          setTab(t)
          setTournamentRoute(null)
          setKakOpen(false)
        }}
      />
    </div>
  )
}

export default App

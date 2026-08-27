import { useEffect, useRef, useState } from 'react'
import { useAppState } from './state/useAppState'
import { useSession } from './state/useSession'
import { useOnlineStatus } from './state/useOnlineStatus'
import { TabBar, type Tab } from './components/TabBar'
import { PartidoTab } from './components/PartidoTab'
import { HistorialTab } from './components/HistorialTab'
import { ProfileTab } from './components/ProfileTab'
import { LoginGate } from './components/LoginGate'

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
  const online = useOnlineStatus()
  const [historialRefreshKey, setHistorialRefreshKey] = useState(0)

  const wasFinished = useRef(false)
  useEffect(() => {
    const justFinished = state.activeMatch?.status === 'finished'
    if (justFinished && !wasFinished.current) {
      setHistorialRefreshKey((k) => k + 1)
    }
    wasFinished.current = justFinished
  }, [state.activeMatch?.status])

  if (!user) {
    return (
      <>
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

  return (
    <div className="min-h-full pb-24">
      {!online && <OfflineBanner />}
      <main className="max-w-md mx-auto px-4 pt-6">
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
          />
        )}
        {tab === 'historial' && <HistorialTab user={user} refreshKey={historialRefreshKey} />}
        {tab === 'perfil' && (
          <ProfileTab user={user} onLogout={logout} onUnlockAdmin={unlockAdmin} onRenameSelf={renameSelf} />
        )}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default App

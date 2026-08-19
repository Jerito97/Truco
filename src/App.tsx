import { useEffect, useRef, useState } from 'react'
import { useAppState } from './state/useAppState'
import { useSession } from './state/useSession'
import { TabBar, type Tab } from './components/TabBar'
import { PartidoTab } from './components/PartidoTab'
import { HistorialTab } from './components/HistorialTab'
import { ProfileTab } from './components/ProfileTab'
import { LoginGate } from './components/LoginGate'

function App() {
  const [tab, setTab] = useState<Tab>('inicio')
  const { user, loading, error, pendingName, register, confirmPending, cancelPending, logout } = useSession()
  const state = useAppState()
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
      <LoginGate
        loading={loading}
        error={error}
        pendingName={pendingName}
        onSubmit={register}
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    )
  }

  return (
    <div className="min-h-full pb-24">
      <main className="max-w-md mx-auto px-4 pt-6">
        {tab === 'inicio' && (
          <PartidoTab
            currentUser={user}
            activeMatch={state.activeMatch}
            historialRefreshKey={historialRefreshKey}
            onStart={state.startMatch}
            onAdd={state.addPoint}
            onSub={state.subtractPoint}
            onUndo={state.undoPoint}
            onPassMano={state.passMano}
            onEnterPicaPica={state.enterPicaPica}
            onPicaPicaAdd={state.addPicaPicaPoint}
            onPicaPicaSub={state.subtractPicaPicaPoint}
            onPicaPicaUndo={state.undoPicaPicaPoint}
            onPicaPicaClose={state.closePicaPica}
            onRematch={state.rematch}
            onNewMatch={state.clearMatch}
            onSeeHistorial={() => setTab('historial')}
          />
        )}
        {tab === 'historial' && <HistorialTab user={user} refreshKey={historialRefreshKey} />}
        {tab === 'perfil' && <ProfileTab user={user} onLogout={logout} />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default App

import { useEffect, useRef, useState } from 'react'
import { useAppState } from './state/useAppState'
import { useSession } from './state/useSession'
import { TabBar, type Tab } from './components/TabBar'
import { PartidoTab } from './components/PartidoTab'
import { HistorialTab } from './components/HistorialTab'
import { ProfileTab } from './components/ProfileTab'
import { LoginGate } from './components/LoginGate'

function App() {
  const [tab, setTab] = useState<Tab>('partido')
  const { user, loading, error, register, logout } = useSession()
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
    return <LoginGate loading={loading} error={error} onSubmit={register} />
  }

  return (
    <div className="min-h-full pb-24">
      <header className="max-w-md mx-auto px-4 pt-7 pb-5 text-center">
        <h1 className="font-poster text-4xl sm:text-5xl" style={{ color: 'var(--color-paper-50)' }}>
          Osobuco
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="h-px w-8" style={{ backgroundColor: 'var(--color-ember-500)', opacity: 0.6 }} />
          <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase" style={{ color: 'var(--color-ember-500)' }}>
            Marcador de truco
          </p>
          <span className="h-px w-8" style={{ backgroundColor: 'var(--color-ember-500)', opacity: 0.6 }} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4">
        {tab === 'partido' && (
          <PartidoTab
            currentUser={user}
            activeMatch={state.activeMatch}
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

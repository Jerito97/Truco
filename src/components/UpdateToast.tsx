import { useRegisterSW } from 'virtual:pwa-register/react'

// Con registerType: 'prompt' (vite.config.ts) el service worker nuevo queda
// instalado y esperando en vez de tomar control solo: este aviso es lo que
// le da al usuario la oportunidad de decidir cuándo recargar, en vez de que
// la app se recargue sola en medio de un partido.
export function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      className="flex items-center justify-center gap-3 text-center text-xs font-bold py-1.5 px-4"
      style={{ backgroundColor: 'var(--color-ember-600)', color: 'var(--color-wood-950)' }}
    >
      <span>Hay una versión nueva de la app</span>
      <button type="button" onClick={() => updateServiceWorker(true)} className="underline shrink-0">
        Actualizar
      </button>
    </div>
  )
}

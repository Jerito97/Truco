import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { ConfirmDialog } from './Dialog'

// Con registerType: 'prompt' (vite.config.ts) el service worker nuevo queda
// instalado y esperando en vez de tomar control solo: este aviso es lo que
// le da al usuario la oportunidad de decidir cuándo recargar, en vez de que
// la app se recargue sola en medio de un partido.
//
// Pop-up en vez de una barra fija arriba de todo: esa barra se solapaba con
// el notch/Dynamic Island en algunos celulares y además competía por espacio
// con el resto del encabezado. Un diálogo centrado no tiene ese problema y
// es más difícil de pasar por alto.
export function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const [dismissed, setDismissed] = useState(false)

  return (
    <ConfirmDialog
      open={needRefresh && !dismissed}
      title="Hay una versión nueva de la app"
      message="Actualizá para tener las últimas mejoras. Si estás en medio de un partido, podés hacerlo más tarde."
      confirmLabel="Actualizar"
      cancelLabel="Después"
      onConfirm={() => updateServiceWorker(true)}
      onCancel={() => setDismissed(true)}
    />
  )
}

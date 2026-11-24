import { useEffect } from 'react'

// Estas pantallas se "navegan" con estado local (un onBack que vuelve a la
// anterior), no con rutas reales: sin esto, el scroll de la pantalla previa
// queda como estaba y la nueva puede arrancar mostrada a la mitad en vez de
// arriba del todo (por ejemplo al entrar a Estadísticas habiendo scrolleado
// Mi perfil, o a un partido desde el fondo del Historial).
export function useScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
}

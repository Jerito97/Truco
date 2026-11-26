import { useLayoutEffect } from 'react'

// Estas pantallas se "navegan" con estado local (un onBack que vuelve a la
// anterior), no con rutas reales: sin esto, el scroll de la pantalla previa
// queda como estaba y la nueva puede arrancar mostrada a la mitad en vez de
// arriba del todo (por ejemplo al entrar a Estadísticas habiendo scrolleado
// Mi perfil, o a un partido desde el fondo del Historial).
// useLayoutEffect (no useEffect) para que el reseteo pase antes del primer
// paint: si no, se alcanza a ver la pantalla nueva un instante en el scroll
// viejo y recién ahí salta a 0, lo que en iOS hace que los elementos "fixed"
// (como la TabBar) se vean "moverse" en vez de quedar quietos.
export function useScrollToTop() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
}

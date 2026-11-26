import { useEffect, useState } from 'react'

export interface ViewportMetrics {
  top: number
  height: number
  // true si el visual viewport quedó notoriamente más bajo que el alto de
  // layout: en la práctica, el teclado en pantalla está abierto. 100px de
  // margen para no confundirlo con el ida-y-vuelta normal de la barra de
  // direcciones del navegador (eso achica bastante menos).
  keyboardOpen: boolean
}

const KEYBOARD_THRESHOLD_PX = 100

function readMetrics(): ViewportMetrics {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  if (vv) {
    return { top: vv.offsetTop, height: vv.height, keyboardOpen: window.innerHeight - vv.height > KEYBOARD_THRESHOLD_PX }
  }
  const height = typeof window !== 'undefined' ? window.innerHeight : 0
  return { top: 0, height, keyboardOpen: false }
}

// El alto de "window.innerHeight" (y el de "100dvh") no necesariamente se
// achica cuando aparece el teclado en iOS Safari: depende de la versión y de
// si el teclado "empuja" el layout o solo se superpone. El "visualViewport"
// del navegador sí siempre refleja el área realmente visible (descontando el
// teclado), así que una pantalla que necesita ajustarse en vivo al teclado
// (como el chat de Kak) se guía por esto en vez de CSS puro.
export function useVisualViewportMetrics(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(readMetrics)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () =>
      setMetrics({ top: vv.offsetTop, height: vv.height, keyboardOpen: window.innerHeight - vv.height > KEYBOARD_THRESHOLD_PX })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return metrics
}

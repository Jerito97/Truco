import { useState } from 'react'
import { ShareIcon } from './icons'
import { ShareVariantPicker } from './ShareVariantPicker'
import { availableShareVariants, generateShareImageBlob } from '../lib/shareImage'
import type { ShareableMatch, ShareVariant } from '../lib/shareImage'

// Botón de compartir compartido por MatchSummary (partido recién terminado)
// y MatchDetailScreen (uno ya guardado en Historial): abre el selector de
// las 3 variantes de imagen y arma/comparte la que se elija.
export function ShareResultButton({
  match,
  shareText,
  tone = 'ember',
}: {
  match: ShareableMatch
  shareText: string
  tone?: 'ember' | 'muted'
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sharing, setSharing] = useState(false)

  const variants = availableShareVariants(match)

  const handlePick = async (variant: ShareVariant) => {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await generateShareImageBlob(match, variant)
      if (!blob) return
      const file = new File([blob], 'osobuco-resultado.png', { type: 'image/png' })
      const shareData = { files: [file], title: 'Osobuco', text: shareText }
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'osobuco-resultado.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }
    } catch {
      // El usuario cancela el share sheet o el navegador no lo soporta: no hay nada que mostrar.
    } finally {
      setSharing(false)
      setPickerOpen(false)
    }
  }

  const toneStyle =
    tone === 'ember'
      ? { borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }
      : { borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold border"
        style={toneStyle}
      >
        <ShareIcon className="w-4 h-4" />
        Compartir resultado
      </button>

      <ShareVariantPicker
        open={pickerOpen}
        variants={variants}
        disabled={sharing}
        onPick={handlePick}
        onCancel={() => setPickerOpen(false)}
      />
    </>
  )
}

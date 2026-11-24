import { Overlay } from './Dialog'
import { SHARE_VARIANT_INFO, type ShareVariant } from '../lib/shareImage'
import { ChevronRightIcon } from './icons'

export function ShareVariantPicker({
  open,
  variants,
  disabled,
  onPick,
  onCancel,
}: {
  open: boolean
  variants: ShareVariant[]
  disabled: boolean
  onPick: (variant: ShareVariant) => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <Overlay onDismiss={disabled ? undefined : onCancel}>
      <h3 className="font-poster text-xl mb-1" style={{ color: 'var(--color-paper-50)' }}>
        Compartir resultado
      </h3>
      <p className="text-sm opacity-70 mb-4" style={{ color: 'var(--color-paper-100)' }}>
        Elegí cómo armar la imagen.
      </p>

      <div className="space-y-2.5">
        {variants.map((v) => {
          const info = SHARE_VARIANT_INFO[v]
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => onPick(v)}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left disabled:opacity-50"
              style={{ borderColor: 'rgba(203, 170, 106, 0.3)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--color-ember-500)' }}>
                  {info.title}
                </p>
                <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--color-paper-100)' }}>
                  {info.caption}
                </p>
              </div>
              <ChevronRightIcon className="w-4 h-4 shrink-0 opacity-50" style={{ color: 'var(--color-paper-100)' }} />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="w-full mt-4 py-2.5 rounded-xl font-bold border disabled:opacity-40"
        style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
      >
        Cancelar
      </button>
    </Overlay>
  )
}

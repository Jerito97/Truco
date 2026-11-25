import type { ReactNode } from 'react'
import { BackIcon } from './icons'

// Encabezado ornamental para las pantallas de nivel superior que no tienen
// botón de "volver" (se llega a ellas desde la barra de abajo, no
// navegando): un kicker chico, el título, y un adorno de línea-rombo-línea
// debajo, con un resplandor dorado muy sutil arriba de todo para que el
// título no quede flotando sin ancla visual. También sirve para pantallas
// navegadas con "volver" (onBack) que quieran el mismo tratamiento de título.
export function ScreenHeader({
  title,
  kicker = 'OSOBUCO',
  subtitle,
  action,
  onBack,
}: {
  title: string
  kicker?: string
  subtitle?: string
  action?: ReactNode
  onBack?: () => void
}) {
  return (
    <div
      className="relative -mx-4 px-4 pt-2 pb-1 text-center"
      style={{
        backgroundImage: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(203, 170, 106, 0.16), transparent 72%)',
      }}
    >
      <div className="relative">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="absolute left-0 top-1/2 -translate-y-1/2"
          >
            <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
          </button>
        )}
        {kicker && (
          <p
            className="text-[10px] font-bold uppercase opacity-60"
            style={{ color: 'var(--color-ember-500)', letterSpacing: '0.3em' }}
          >
            {kicker}
          </p>
        )}
        <h2 className="font-poster text-2xl mt-1" style={{ color: 'var(--color-paper-50)' }}>
          {title}
        </h2>
        {action && <div className="absolute right-0 top-1/2 -translate-y-1/2">{action}</div>}
      </div>
      <div className="flex items-center justify-center gap-2.5 mt-2.5">
        <span
          className="h-px w-10"
          style={{ backgroundImage: 'linear-gradient(to left, rgba(203, 170, 106, 0.6), transparent)' }}
        />
        <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: 'var(--color-ember-500)' }} />
        <span
          className="h-px w-10"
          style={{ backgroundImage: 'linear-gradient(to right, rgba(203, 170, 106, 0.6), transparent)' }}
        />
      </div>
      {subtitle && <p className="text-xs opacity-60 mt-2.5">{subtitle}</p>}
    </div>
  )
}

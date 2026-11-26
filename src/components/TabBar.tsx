import type { ComponentType, SVGProps } from 'react'
import { ClockIcon, HouseIcon, MenuIcon, PersonIcon } from './icons'

export type Tab = 'inicio' | 'historial' | 'mas' | 'perfil'

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'inicio', label: 'Inicio', Icon: HouseIcon },
  { id: 'historial', label: 'Historial', Icon: ClockIcon },
  { id: 'mas', label: 'Más', Icon: MenuIcon },
  { id: 'perfil', label: 'Perfil', Icon: PersonIcon },
]

// Alto real de la barra (medido: py-2.5 + ícono + gap + texto). Fijado acá en
// vez de dejarlo flotar con el contenido para que cualquier otra pantalla que
// necesite pegarse justo arriba (ver TeamPicker) tenga un único valor del que
// depender en vez de un número copiado a mano.
export const TABBAR_HEIGHT = 70

// Con el "home indicator" de los iPhone sin botón físico, los íconos quedaban
// pegados al borde mismo de la pantalla (ver queja del usuario: "tengo que
// apretar casi en el borde del celular"). Este es el alto real de la barra
// más el inset seguro de abajo, para que todo lo que se ancle "justo arriba
// de la barra" (el input de Kak, el botón de confirmar en TeamPicker) respete
// ese margen también. Requiere viewport-fit=cover en index.html: sin eso,
// env(safe-area-inset-bottom) siempre da 0.
export const TABBAR_SAFE_BOTTOM = `calc(${TABBAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{
        height: TABBAR_SAFE_BOTTOM,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--color-wood-900)',
        borderTop: '1px solid rgba(203, 170, 106, 0.2)',
        boxShadow: '0 -8px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-3">
        {TABS.map((t) => {
          const isActive = active === t.id
          const color = isActive ? 'var(--color-ember-500)' : 'var(--color-paper-200)'
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className="flex flex-col items-center gap-1 py-1 mx-1 rounded-xl transition-colors"
              style={{
                color,
                opacity: isActive ? 1 : 0.6,
                backgroundColor: isActive ? 'rgba(203, 170, 106, 0.12)' : 'transparent',
              }}
            >
              <t.Icon className="w-6 h-6" />
              <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

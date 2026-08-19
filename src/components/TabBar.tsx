import type { ComponentType, SVGProps } from 'react'
import { ClockIcon, HouseIcon, PersonIcon } from './icons'

export type Tab = 'inicio' | 'historial' | 'perfil'

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'inicio', label: 'Inicio', Icon: HouseIcon },
  { id: 'historial', label: 'Historial', Icon: ClockIcon },
  { id: 'perfil', label: 'Perfil', Icon: PersonIcon },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{
        backgroundColor: 'var(--color-wood-900)',
        borderTop: '1px solid rgba(203, 170, 106, 0.2)',
        boxShadow: '0 -8px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 py-2.5">
        {TABS.map((t) => {
          const isActive = active === t.id
          const color = isActive ? 'var(--color-ember-500)' : 'var(--color-paper-200)'
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className="flex flex-col items-center gap-1"
              style={{ color, opacity: isActive ? 1 : 0.6 }}
            >
              <t.Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

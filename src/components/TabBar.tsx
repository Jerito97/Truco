export type Tab = 'partido' | 'historial' | 'perfil'

const TABS: { id: Tab; label: string }[] = [
  { id: 'partido', label: 'Partido' },
  { id: 'historial', label: 'Historial' },
  { id: 'perfil', label: 'Perfil' },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{
        backgroundColor: 'var(--color-wood-900)',
        borderTop: '1px solid rgba(209, 161, 60, 0.25)',
        boxShadow: '0 -8px 20px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5 px-2 py-2">
        {TABS.map((t) => {
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className="py-2 rounded-xl font-poster text-xs sm:text-sm tracking-wide transition-colors"
              style={{
                color: isActive ? 'var(--color-wood-950)' : 'var(--color-paper-200)',
                backgroundColor: isActive ? 'var(--color-ember-500)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

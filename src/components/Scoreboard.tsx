import type { ReactNode } from 'react'
import { ScoreColumn } from './ScoreColumn'

function CircleButton({
  onClick,
  variant,
  label,
  disabled,
}: {
  onClick: () => void
  variant: 'add' | 'sub'
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center rounded-full w-11 h-11 sm:w-14 sm:h-14 text-2xl sm:text-3xl font-bold select-none
        active:scale-95 transition-transform active:translate-y-[1px]
        disabled:opacity-30 disabled:pointer-events-none border-2"
      style={{
        backgroundColor: variant === 'add' ? 'var(--color-ember-500)' : 'var(--color-wood-800)',
        borderColor: variant === 'add' ? 'var(--color-ember-600)' : 'var(--color-wood-950)',
        color: variant === 'add' ? 'var(--color-wood-950)' : 'var(--color-paper-50)',
        boxShadow:
          variant === 'add'
            ? 'inset 0 0 0 3px rgba(255,255,255,0.25), 0 3px 0 rgba(0,0,0,0.35)'
            : 'inset 0 0 0 3px rgba(255,255,255,0.06), 0 3px 0 rgba(0,0,0,0.35)',
      }}
    >
      {variant === 'add' ? '+' : '−'}
    </button>
  )
}

interface Side {
  label: string
  score: number
  onAdd: () => void
  onSub: () => void
  badge?: ReactNode
}

export function Scoreboard({
  left,
  right,
  size = 'normal',
}: {
  left: Side
  right: Side
  size?: 'normal' | 'compact'
}) {
  return (
    <div className="paper-card rounded-2xl px-3 py-4 sm:px-5 sm:py-6">
      <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 min-w-0">
          {left.badge}
          <h3 className={`font-poster truncate ${size === 'compact' ? 'text-base' : 'text-lg sm:text-2xl'}`}>
            {left.label}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <h3 className={`font-poster truncate text-right ${size === 'compact' ? 'text-base' : 'text-lg sm:text-2xl'}`}>
            {right.label}
          </h3>
          {right.badge}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
        <div className={`font-num font-bold ${size === 'compact' ? 'text-2xl' : 'text-3xl sm:text-4xl'}`} style={{ color: 'var(--color-wood-700)' }}>
          {left.score}
        </div>
        <div className={`font-num font-bold text-right ${size === 'compact' ? 'text-2xl' : 'text-3xl sm:text-4xl'}`} style={{ color: 'var(--color-wood-700)' }}>
          {right.score}
        </div>
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col justify-center gap-2 sm:gap-3 pr-2 sm:pr-3">
          <CircleButton onClick={left.onAdd} variant="add" label={`Sumar punto a ${left.label}`} />
          <CircleButton onClick={left.onSub} variant="sub" label={`Restar punto a ${left.label}`} disabled={left.score <= 0} />
        </div>

        <div className="flex-1 min-w-0 flex">
          <div className="flex-1 min-w-0">
            <ScoreColumn score={left.score} align="left" />
          </div>
          <div className="w-px mx-1 sm:mx-2 self-stretch" style={{ backgroundColor: 'var(--color-wood-700)', opacity: 0.35 }} />
          <div className="flex-1 min-w-0">
            <ScoreColumn score={right.score} align="right" />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2 sm:gap-3 pl-2 sm:pl-3">
          <CircleButton onClick={right.onAdd} variant="add" label={`Sumar punto a ${right.label}`} />
          <CircleButton onClick={right.onSub} variant="sub" label={`Restar punto a ${right.label}`} disabled={right.score <= 0} />
        </div>
      </div>
    </div>
  )
}

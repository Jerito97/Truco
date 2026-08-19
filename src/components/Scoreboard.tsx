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
        backgroundColor: 'transparent',
        borderColor: variant === 'add' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
        color: variant === 'add' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
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
    <div className="px-1 py-3 sm:px-2 sm:py-4">
      <div
        className="grid grid-cols-2 gap-2 pb-3 mb-4 border-b"
        style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {left.badge}
          <h3
            className={`font-poster truncate ${size === 'compact' ? 'text-base' : 'text-lg sm:text-2xl'}`}
            style={{ color: 'var(--color-paper-50)' }}
          >
            {left.label}
          </h3>
          <span className="font-num text-sm opacity-60" style={{ color: 'var(--color-ember-500)' }}>
            {left.score}
          </span>
        </div>
        <div className="flex items-center gap-1.5 justify-end min-w-0">
          <span className="font-num text-sm opacity-60" style={{ color: 'var(--color-ember-500)' }}>
            {right.score}
          </span>
          <h3
            className={`font-poster truncate text-right ${size === 'compact' ? 'text-base' : 'text-lg sm:text-2xl'}`}
            style={{ color: 'var(--color-paper-50)' }}
          >
            {right.label}
          </h3>
          {right.badge}
        </div>
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col justify-center gap-2 sm:gap-3 pr-2 sm:pr-3">
          <CircleButton onClick={left.onAdd} variant="add" label={`Sumar punto a ${left.label}`} />
          <CircleButton onClick={left.onSub} variant="sub" label={`Restar punto a ${left.label}`} disabled={left.score <= 0} />
        </div>

        <div className="flex-1 min-w-0 flex justify-center gap-6 sm:gap-10">
          <ScoreColumn score={left.score} align="left" />
          <div className="w-px self-stretch" style={{ backgroundColor: 'var(--color-wood-600)', opacity: 0.4 }} />
          <ScoreColumn score={right.score} align="right" />
        </div>

        <div className="flex flex-col justify-center gap-2 sm:gap-3 pl-2 sm:pl-3">
          <CircleButton onClick={right.onAdd} variant="add" label={`Sumar punto a ${right.label}`} />
          <CircleButton onClick={right.onSub} variant="sub" label={`Restar punto a ${right.label}`} disabled={right.score <= 0} />
        </div>
      </div>
    </div>
  )
}

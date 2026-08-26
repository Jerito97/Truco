import type { ActiveMatch } from '../types'
import { BackIcon } from './icons'

function MiniButton({
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
      className="flex items-center justify-center rounded-full w-8 h-8 text-lg font-bold select-none
        active:scale-95 transition-transform disabled:opacity-30 border"
      style={{
        borderColor: variant === 'add' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
        color: variant === 'add' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
      }}
    >
      {variant === 'add' ? '+' : '−'}
    </button>
  )
}

function DuelCard({
  aName,
  aScore,
  onAddA,
  onSubA,
  bName,
  bScore,
  onAddB,
  onSubB,
}: {
  aName: string
  aScore: number
  onAddA: () => void
  onSubA: () => void
  bName: string
  bScore: number
  onAddB: () => void
  onSubB: () => void
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border px-2 py-3"
      style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}
    >
      <div className="flex-1 text-center min-w-0">
        <p className="text-xs mb-1.5 truncate" style={{ color: 'var(--color-paper-100)' }}>
          {aName}
        </p>
        <div className="flex items-center justify-center gap-2">
          <MiniButton onClick={onSubA} variant="sub" label={`Restar a ${aName}`} disabled={aScore <= 0} />
          <span className="font-num text-xl font-bold w-6 text-center" style={{ color: 'var(--color-paper-50)' }}>
            {aScore}
          </span>
          <MiniButton onClick={onAddA} variant="add" label={`Sumar a ${aName}`} />
        </div>
      </div>
      <span className="opacity-30 text-xs px-1 shrink-0">vs</span>
      <div className="flex-1 text-center min-w-0">
        <p className="text-xs mb-1.5 truncate" style={{ color: 'var(--color-paper-100)' }}>
          {bName}
        </p>
        <div className="flex items-center justify-center gap-2">
          <MiniButton onClick={onSubB} variant="sub" label={`Restar a ${bName}`} disabled={bScore <= 0} />
          <span className="font-num text-xl font-bold w-6 text-center" style={{ color: 'var(--color-paper-50)' }}>
            {bScore}
          </span>
          <MiniButton onClick={onAddB} variant="add" label={`Sumar a ${bName}`} />
        </div>
      </div>
    </div>
  )
}

const DUEL_COUNT_LABEL: Record<number, string> = {
  1: 'Un duelo 1 contra 1',
  2: 'Dos duelos 1 contra 1, al mismo tiempo',
  3: 'Tres duelos 1 contra 1, al mismo tiempo',
}

export function PicaPica({
  match,
  onAdd,
  onSub,
  onClose,
  onBack,
}: {
  match: ActiveMatch
  onAdd: (duelIndex: number, team: 'A' | 'B') => void
  onSub: (duelIndex: number, team: 'A' | 'B') => void
  onClose: () => void
  onBack: () => void
}) {
  const sumA = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreA, 0)
  const sumB = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreB, 0)
  const diff = sumA - sumB

  return (
    <div className="screen-fill flex flex-col">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Pica-pica
        </h2>
        <span className="w-5" />
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-4">
        <p className="text-sm opacity-70 text-center">
          {DUEL_COUNT_LABEL[match.pairings.length] ?? 'Duelos 1 contra 1, al mismo tiempo'}
        </p>

        <div className="space-y-2.5">
          {match.pairings.map((pair, i) => (
            <DuelCard
              key={i}
              aName={pair.teamAPlayerName}
              aScore={match.picaPicaDuels[i]?.scoreA ?? 0}
              onAddA={() => onAdd(i, 'A')}
              onSubA={() => onSub(i, 'A')}
              bName={pair.teamBPlayerName}
              bScore={match.picaPicaDuels[i]?.scoreB ?? 0}
              onAddB={() => onAdd(i, 'B')}
              onSubB={() => onSub(i, 'B')}
            />
          ))}
        </div>

        <div className="text-center font-num text-sm opacity-80">
          {diff === 0 && 'Diferencia: 0 (no suma a nadie todavía)'}
          {diff > 0 && `Diferencia: +${diff} para ${match.teamAName}`}
          {diff < 0 && `Diferencia: +${-diff} para ${match.teamBName}`}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold border"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          Cerrar ronda
        </button>
      </div>
    </div>
  )
}

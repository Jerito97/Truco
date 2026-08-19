import type { ActiveMatch } from '../types'

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

export function PicaPica({
  match,
  onAdd,
  onSub,
  onUndo,
  onClose,
}: {
  match: ActiveMatch
  onAdd: (duelIndex: number, team: 'A' | 'B') => void
  onSub: (duelIndex: number, team: 'A' | 'B') => void
  onUndo: () => void
  onClose: () => void
}) {
  const canUndo = match.picaPicaHistory.length > 0

  const sumA = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreA, 0)
  const sumB = match.picaPicaDuels.reduce((acc, d) => acc + d.scoreB, 0)
  const diff = sumA - sumB

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Pica-pica
        </h2>
        <p className="text-sm opacity-70">Tres duelos 1 contra 1, al mismo tiempo</p>
      </div>

      {match.picaPicaRoundsHistory.length > 0 && (
        <div className="text-xs opacity-60 space-y-1">
          {match.picaPicaRoundsHistory.map((round, i) => (
            <p key={i}>
              Ronda {i + 1}:{' '}
              {round.duels.map((d, j) => (
                <span key={j}>
                  {j > 0 && ', '}
                  {d.aName} {d.scoreA}-{d.scoreB} {d.bName}
                </span>
              ))}
            </p>
          ))}
        </div>
      )}

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

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="py-2.5 rounded-xl font-bold border disabled:opacity-30"
          style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 rounded-xl font-bold border"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          Cerrar ronda
        </button>
      </div>
    </div>
  )
}

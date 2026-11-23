import { useState } from 'react'
import type { ActiveMatch } from '../types'
import { BackIcon, EyeIcon, EyeOffIcon } from './icons'
import { useElapsedSeconds } from '../state/useElapsedSeconds'
import { formatDuration } from '../lib/formatDuration'
import { aggregatePicaPicaRounds } from '../lib/picaPica'

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
  accumulated,
  revealed,
  onToggleReveal,
}: {
  aName: string
  aScore: number
  onAddA: () => void
  onSubA: () => void
  bName: string
  bScore: number
  onAddB: () => void
  onSubB: () => void
  accumulated: { scoreA: number; scoreB: number } | null
  revealed: boolean
  onToggleReveal: () => void
}) {
  return (
    <div className="rounded-xl border px-2 py-3" style={{ borderColor: 'rgba(203, 170, 106, 0.25)' }}>
      <div className="flex items-center justify-between">
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

      {/* Esta pareja ya jugó alguna ronda de pica-pica antes en este mismo
          partido (el marcador de arriba es solo el de la ronda actual, que
          siempre arranca en 0): lo que llevan acumulado de las rondas
          anteriores queda tapado hasta que lo pidan. */}
      {accumulated && (
        <button
          type="button"
          onClick={onToggleReveal}
          className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 text-xs opacity-70 border-t"
          style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}
        >
          {revealed ? (
            <>
              <EyeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-ember-500)' }} />
              <span className="font-num">
                Acumulado: {accumulated.scoreA} - {accumulated.scoreB}
              </span>
            </>
          ) : (
            <>
              <EyeOffIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Ver cómo venía esta pareja</span>
            </>
          )}
        </button>
      )}
    </div>
  )
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
  const elapsed = useElapsedSeconds(match.startedAt)

  // Lo acumulado de rondas anteriores de pica-pica en este mismo partido
  // (no incluye la ronda actual, que se arma aparte en picaPicaDuels): cada
  // pareja arranca tapada y se destapa individualmente.
  const priorTotals = aggregatePicaPicaRounds(match.picaPicaRoundsHistory)
  const [revealed, setRevealed] = useState<boolean[]>(() => match.pairings.map(() => false))
  const toggleReveal = (i: number) => {
    setRevealed((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

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
      <p className="text-center font-num text-xs opacity-50 -mt-1">{formatDuration(elapsed)}</p>

      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-4">
        {/* El marcador del partido no se toca desde acá (eso pasa en
            MatchLive): es solo para no perder de vista cómo va mientras se
            juega el pica-pica. */}
        <p className="text-center font-num text-sm">
          <span className="truncate" style={{ color: 'var(--color-paper-100)' }}>
            {match.teamAName}
          </span>{' '}
          <span className="font-bold text-lg" style={{ color: 'var(--color-ember-500)' }}>
            {match.scoreA}
          </span>
          <span className="opacity-30 mx-1.5">-</span>
          <span className="font-bold text-lg" style={{ color: 'var(--color-ember-500)' }}>
            {match.scoreB}
          </span>{' '}
          <span style={{ color: 'var(--color-paper-100)' }}>{match.teamBName}</span>
        </p>

        {/* Pica-pica solo es alcanzable con equipos de 3 (ver el gating en
            MatchLive.tsx y MatchSetup.tsx), así que siempre son 3 duelos. */}
        <p className="text-sm opacity-70 text-center">Tres duelos 1 contra 1, al mismo tiempo</p>

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
              accumulated={priorTotals[i] ?? null}
              revealed={revealed[i] ?? false}
              onToggleReveal={() => toggleReveal(i)}
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

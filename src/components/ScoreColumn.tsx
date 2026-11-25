import { TallyGroup } from './MatchstickGroup'
import { TARGET_SCORE } from '../types'

const TOTAL_GROUPS = Math.ceil(TARGET_SCORE / 5)
// A partir de acá empiezan las "buenas" (la segunda mitad del partido):
// una línea separa ese cuadrado del de las "malas" justo antes.
const BUENAS_START_GROUP = Math.ceil(TARGET_SCORE / 2 / 5)

export function ScoreColumn({ score, align }: { score: number; align: 'left' | 'right' }) {
  const full = Math.floor(score / 5)
  const remainder = score % 5

  return (
    <div className={`flex flex-col justify-between h-full gap-1.5 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {Array.from({ length: TOTAL_GROUPS }).map((_, i) => {
        const count = i < full ? 5 : i === full ? remainder : 0
        return (
          <div key={i} className="contents">
            {i === BUENAS_START_GROUP && (
              <div className="w-full h-0.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(203, 170, 106, 0.3)' }} />
            )}
            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0">
              <TallyGroup count={count} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

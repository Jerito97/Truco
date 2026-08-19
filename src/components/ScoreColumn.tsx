import { MatchstickGroup } from './MatchstickGroup'
import { TARGET_SCORE } from '../types'

const TOTAL_GROUPS = Math.ceil(TARGET_SCORE / 5)

export function ScoreColumn({ score, align }: { score: number; align: 'left' | 'right' }) {
  const full = Math.floor(score / 5)
  const remainder = score % 5

  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${align === 'right' ? 'justify-items-end' : 'justify-items-start'}`}>
      {Array.from({ length: TOTAL_GROUPS }).map((_, i) => {
        const count = i < full ? 5 : i === full ? remainder : 0
        return (
          <div key={i} className="w-11 h-11 sm:w-14 sm:h-14">
            <MatchstickGroup count={count} />
          </div>
        )
      })}
    </div>
  )
}

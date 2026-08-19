import { TallyGroup } from './MatchstickGroup'
import { TARGET_SCORE } from '../types'

const TOTAL_GROUPS = Math.ceil(TARGET_SCORE / 5)

export function ScoreColumn({ score, align }: { score: number; align: 'left' | 'right' }) {
  const full = Math.floor(score / 5)
  const remainder = score % 5

  return (
    <div className={`flex flex-col gap-2 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {Array.from({ length: TOTAL_GROUPS }).map((_, i) => {
        const count = i < full ? 5 : i === full ? remainder : 0
        return (
          <div key={i} className="w-7 h-7 sm:w-8 sm:h-8">
            <TallyGroup count={count} />
          </div>
        )
      })}
    </div>
  )
}

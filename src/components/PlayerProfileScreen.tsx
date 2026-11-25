import { useMemo } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { useStreaks } from '../state/useStreaks'
import { usePicaPicaRecord } from '../state/usePicaPicaRecord'
import { computeRivalStats, listPicaPicaDuels, PlayerStatBlocks } from './PlayerStats'
import { BackIcon, PersonIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'

export function PlayerProfileScreen({ player, onBack }: { player: User; onBack: () => void }) {
  useScrollToTop()
  const { matches } = useMatches(player.id, 0)
  const streaks = useStreaks(player.id, 0)
  const picaPicaRecord = usePicaPicaRecord(player.id, 0)
  const rivalStats = useMemo(() => (matches ? computeRivalStats(matches, player.id) : null), [matches, player.id])
  const picaPicaDuels = useMemo(() => (matches ? listPicaPicaDuels(matches, player.id) : null), [matches, player.id])
  const played = matches?.length ?? 0
  const won =
    matches?.filter(
      (m) =>
        (m.winner === 'A' && m.team_a_player_ids.includes(player.id)) ||
        (m.winner === 'B' && m.team_b_player_ids.includes(player.id)),
    ).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl truncate px-2" style={{ color: 'var(--color-paper-50)' }}>
          {player.name}
        </h2>
        <span className="w-5" />
      </div>

      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border"
          style={{ borderColor: 'var(--color-ember-600)' }}
        >
          <PersonIcon className="w-9 h-9" style={{ color: 'var(--color-ember-500)' }} />
        </div>
      </div>

      {matches === null ? (
        <p className="text-center opacity-60 py-6">Cargando...</p>
      ) : played === 0 ? (
        <p className="text-sm opacity-60 text-center py-6">Todavía no jugó ningún partido.</p>
      ) : (
        <PlayerStatBlocks
          played={played}
          won={won}
          streaks={streaks}
          picaPicaRecord={picaPicaRecord}
          picaPicaDuels={picaPicaDuels}
          rivalStats={rivalStats}
          pronoun="other"
        />
      )}
    </div>
  )
}

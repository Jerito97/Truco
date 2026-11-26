import { useMemo } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { useStreaks } from '../state/useStreaks'
import { computePicaPicaMatchRecord, computeRivalStats, listPicaPicaDuels, PlayerStatBlocks } from './PlayerStats'
import { PersonIcon } from './icons'
import { useScrollToTop } from '../state/useScrollToTop'
import { ScreenHeader } from './ScreenHeader'

export function PlayerProfileScreen({ player, onBack }: { player: User; onBack: () => void }) {
  useScrollToTop()
  const { matches } = useMatches(player.id, 0)
  const streaks = useStreaks(player.id, 0)
  const rivalStats = useMemo(() => (matches ? computeRivalStats(matches, player.id) : null), [matches, player.id])
  const picaPicaMatchRecord = useMemo(
    () => (matches ? computePicaPicaMatchRecord(matches, player.id) : null),
    [matches, player.id],
  )
  const picaPicaDuels = useMemo(() => (matches ? listPicaPicaDuels(matches, player.id) : null), [matches, player.id])
  const played = matches?.length ?? 0
  const won =
    matches?.filter(
      (m) =>
        (m.winner === 'A' && m.team_a_player_ids.includes(player.id)) ||
        (m.winner === 'B' && m.team_b_player_ids.includes(player.id)),
    ).length ?? 0

  return (
    <div className="screen-fill flex flex-col">
      <ScreenHeader title={player.name} onBack={onBack} />

      <div className="flex-1 flex flex-col justify-center gap-6 min-h-0">
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
            picaPicaMatchRecord={picaPicaMatchRecord}
            picaPicaDuels={picaPicaDuels}
            rivalStats={rivalStats}
            pronoun="other"
          />
        )}
      </div>
    </div>
  )
}

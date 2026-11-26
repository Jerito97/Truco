import { useMemo } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { useStreaks } from '../state/useStreaks'
import { computePicaPicaMatchRecord, computeRivalStats, listPicaPicaDuels, PlayerStatBlocks, TierTag } from './PlayerStats'
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
        {/* Fila compacta: avatar + nombre + tier, todo junto — el peso
            visual va para las tarjetas de estadísticas de abajo. */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center border shrink-0"
            style={{ borderColor: 'var(--color-ember-600)' }}
          >
            <PersonIcon className="w-7 h-7" style={{ color: 'var(--color-ember-500)' }} />
          </div>
          <h3 className="font-poster text-xl truncate flex-1 min-w-0" style={{ color: 'var(--color-paper-50)' }}>
            {player.name}
          </h3>
          {streaks?.tier != null && <TierTag tier={streaks.tier} />}
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

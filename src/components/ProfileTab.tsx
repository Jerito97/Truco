import { useMemo, useState } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { useStreaks } from '../state/useStreaks'
import { PencilIcon, PersonIcon } from './icons'
import { computePicaPicaMatchRecord, computeRivalStats, listPicaPicaDuels, PlayerStatBlocks, TierTag } from './PlayerStats'
import { ScreenHeader } from './ScreenHeader'

export function ProfileTab({
  user,
  onRenameSelf,
}: {
  user: User
  onRenameSelf: (name: string) => Promise<string | null>
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(user.name)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const { matches } = useMatches(user.id, 0)
  const streaks = useStreaks(user.id, 0)
  const rivalStats = useMemo(() => (matches ? computeRivalStats(matches, user.id) : null), [matches, user.id])
  const picaPicaMatchRecord = useMemo(() => (matches ? computePicaPicaMatchRecord(matches, user.id) : null), [matches, user.id])
  const picaPicaDuels = useMemo(() => (matches ? listPicaPicaDuels(matches, user.id) : null), [matches, user.id])
  const played = matches?.length ?? 0
  const won =
    matches?.filter(
      (m) =>
        (m.winner === 'A' && m.team_a_player_ids.includes(user.id)) ||
        (m.winner === 'B' && m.team_b_player_ids.includes(user.id)),
    ).length ?? 0
  const since = user.created_at ? new Date(user.created_at).getFullYear() : null

  const startEditName = () => {
    setNameDraft(user.name)
    setRenameError(null)
    setEditingName(true)
  }

  const saveEditName = async () => {
    if (renaming) return
    const name = nameDraft.trim()
    if (!name || name === user.name) {
      setEditingName(false)
      return
    }
    setRenaming(true)
    const err = await onRenameSelf(name)
    setRenaming(false)
    if (err) {
      setRenameError(err)
      return
    }
    setEditingName(false)
  }

  return (
    <div className="screen-fill flex flex-col">
      <ScreenHeader title="Mi perfil" />

      <div className="flex-1 flex flex-col justify-center gap-6 min-h-0">
      {/* Fila compacta: avatar + nombre (editable) + tier, todo junto en vez
          de apilado y centrado — el peso visual va para las tarjetas de
          estadísticas de abajo. */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border shrink-0"
          style={{ borderColor: 'var(--color-ember-600)' }}
        >
          <PersonIcon className="w-7 h-7" style={{ color: 'var(--color-ember-500)' }} />
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              onBlur={saveEditName}
              autoFocus
              maxLength={40}
              disabled={renaming}
              className="font-poster text-xl bg-transparent border-b outline-none w-full disabled:opacity-50"
              style={{ color: 'var(--color-paper-50)', borderColor: 'var(--color-ember-600)' }}
            />
          ) : (
            <button type="button" onClick={startEditName} className="inline-flex items-center gap-2 max-w-full">
              <h3 className="font-poster text-xl truncate" style={{ color: 'var(--color-paper-50)' }}>
                {user.name}
              </h3>
              <PencilIcon className="w-4 h-4 opacity-40 shrink-0" style={{ color: 'var(--color-paper-100)' }} />
            </button>
          )}
          {renameError && (
            <p className="text-xs mt-1" style={{ color: '#d9695f' }}>
              {renameError}
            </p>
          )}
          {since && <p className="text-xs opacity-60 truncate">Jugando desde {since}</p>}
        </div>
        {streaks?.tier != null && <TierTag tier={streaks.tier} />}
      </div>

      <PlayerStatBlocks
        played={played}
        won={won}
        streaks={streaks}
        picaPicaMatchRecord={picaPicaMatchRecord}
        picaPicaDuels={picaPicaDuels}
        rivalStats={rivalStats}
        pronoun="self"
      />
      </div>
    </div>
  )
}

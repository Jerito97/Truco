import { useMemo, useState } from 'react'
import type { User } from '../types'
import { useMatches } from '../state/useMatches'
import { useStreaks } from '../state/useStreaks'
import { PencilIcon, PersonIcon } from './icons'
import { computePicaPicaMatchRecord, computeRivalStats, listPicaPicaDuels, PlayerStatBlocks } from './PlayerStats'
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
    <div className="space-y-6">
      <ScreenHeader title="Mi perfil" />

      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border"
          style={{ borderColor: 'var(--color-ember-600)' }}
        >
          <PersonIcon className="w-9 h-9" style={{ color: 'var(--color-ember-500)' }} />
        </div>
        {editingName ? (
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            onBlur={saveEditName}
            autoFocus
            maxLength={40}
            disabled={renaming}
            className="font-poster text-2xl bg-transparent border-b outline-none text-center disabled:opacity-50"
            style={{ color: 'var(--color-paper-50)', borderColor: 'var(--color-ember-600)' }}
          />
        ) : (
          <button type="button" onClick={startEditName} className="inline-flex items-center gap-2">
            <h3 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
              {user.name}
            </h3>
            <PencilIcon className="w-4 h-4 opacity-40" style={{ color: 'var(--color-paper-100)' }} />
          </button>
        )}
        {renameError && (
          <p className="text-xs mt-1" style={{ color: '#d9695f' }}>
            {renameError}
          </p>
        )}
        {since && <p className="text-sm opacity-60">Jugando desde {since}</p>}
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
  )
}

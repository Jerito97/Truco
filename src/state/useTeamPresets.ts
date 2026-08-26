import { useCallback, useEffect, useState } from 'react'
import { makeId } from '../lib/id'

const STORAGE_KEY = 'la-mesa-team-presets-v1'

export interface TeamPreset {
  id: string
  name: string
  playerIds: string[]
  playerNames: Record<string, string>
}

function loadPresets(): TeamPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useTeamPresets() {
  const [presets, setPresets] = useState<TeamPreset[]>(() => loadPresets())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }, [presets])

  const savePreset = useCallback((name: string, playerIds: string[], playerNames: Record<string, string>) => {
    setPresets((prev) => [...prev, { id: makeId(), name, playerIds, playerNames }])
  }, [])

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { presets, savePreset, deletePreset }
}

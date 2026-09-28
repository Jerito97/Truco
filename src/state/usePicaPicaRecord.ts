import { useEffect, useState } from 'react'

interface PicaPicaRecord {
  played: number
  won: number
}

export function usePicaPicaRecord(userId: string, refreshKey: number) {
  const [record, setRecord] = useState<PicaPicaRecord | null>(null)

  useEffect(() => {
    let cancelled = false
    setRecord(null)
    fetch(`/api/picaPicaRecord?userId=${encodeURIComponent(userId)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<PicaPicaRecord>
      })
      .then((rec) => {
        if (!cancelled) setRecord(rec)
      })
      .catch(() => {
        if (!cancelled) setRecord(null)
      })
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  return record
}

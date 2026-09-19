import { useEffect, useMemo, useState } from 'react'
import type { User } from '../types'
import { BackIcon } from './icons'
import { formatDate } from '../lib/formatDate'
import { ConfirmDialog, DialogButtons, Overlay } from './Dialog'

interface AdminUser {
  id: string
  name: string
  created_at: string
  is_admin: boolean
}

interface AdminMatch {
  id: string
  played_at: string
  team_a_name: string
  team_b_name: string
  team_a_player_ids: string[]
  team_b_player_ids: string[]
  team_a_player_names: string[]
  team_b_player_names: string[]
  score_a: number
  score_b: number
  winner: 'A' | 'B'
}

// Ventana generosa (los reintentos de la cola offline pueden tardar en
// disparar si el celular estuvo sin señal un rato) para no cruzar dos
// partidos iguales jugados en días distintos por pura coincidencia.
const DUPLICATE_WINDOW_MS = 3 * 60 * 60 * 1000

function duplicateKey(m: AdminMatch): string {
  const a = [...m.team_a_player_ids].sort().join(',')
  const b = [...m.team_b_player_ids].sort().join(',')
  return `${a}|${b}|${m.score_a}|${m.score_b}|${m.winner}`
}

// Agrupa partidos con exactamente los mismos jugadores (de cada lado),
// mismo resultado y jugados cerca en el tiempo: es la firma que deja el bug
// de sincronización viejo (antes de que el guardado tuviera client_id) al
// reintentar y guardar el mismo partido dos veces.
function findDuplicateIds(matches: AdminMatch[]): Set<string> {
  const groups = new Map<string, AdminMatch[]>()
  for (const m of matches) {
    const key = duplicateKey(m)
    const group = groups.get(key)
    if (group) group.push(m)
    else groups.set(key, [m])
  }
  const duplicateIds = new Set<string>()
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const sorted = [...group].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
    for (let i = 1; i < sorted.length; i++) {
      const gap = new Date(sorted[i].played_at).getTime() - new Date(sorted[i - 1].played_at).getTime()
      if (gap <= DUPLICATE_WINDOW_MS) {
        duplicateIds.add(sorted[i - 1].id)
        duplicateIds.add(sorted[i].id)
      }
    }
  }
  return duplicateIds
}

function UsersPanel({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)

  const load = () => {
    setError(null)
    fetch(`/api/admin/users?requesterId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<AdminUser[]>
      })
      .then(setUsers)
      .catch(() => setError('No se pudo cargar la lista de usuarios.'))
  }

  useEffect(load, [currentUser.id])

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id)
    setEditValue(u.name)
  }

  const saveEdit = async (id: string) => {
    if (busyId === id) return
    const name = editValue.trim()
    setEditingId(null)
    if (!name) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id, name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo renombrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (u: AdminUser) => {
    setPendingDelete(null)
    setBusyId(u.id)
    try {
      const res = await fetch(`/api/admin/users/${u.id}?requesterId=${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo borrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-center py-2" style={{ color: '#d9695f' }}>
          {error}
        </p>
      )}
      {users === null && !error && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {users && users.length === 0 && <p className="text-center opacity-60 py-6">No hay usuarios registrados.</p>}
      {users && users.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 py-3">
              {editingId === u.id ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  onBlur={() => saveEdit(u.id)}
                  autoFocus
                  maxLength={40}
                  className="flex-1 rounded-md px-2 py-1 border outline-none"
                  style={{
                    borderColor: 'var(--color-ember-600)',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    color: 'var(--color-paper-50)',
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(u)}
                  disabled={busyId === u.id}
                  className="flex-1 text-left truncate disabled:opacity-30"
                  style={{ color: 'var(--color-paper-100)' }}
                >
                  {u.name}
                  {u.is_admin && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--color-ember-500)' }}>
                      admin
                    </span>
                  )}
                  {u.id === currentUser.id && <span className="ml-2 text-xs opacity-50">(vos)</span>}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPendingDelete(u)}
                disabled={busyId === u.id}
                className="text-xs font-bold px-2 py-1.5 rounded-md border shrink-0 disabled:opacity-30"
                style={{ borderColor: '#8a3f38', color: '#d9695f' }}
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="¿Borrar usuario?"
        message={pendingDelete ? `¿Borrar a "${pendingDelete.name}"? Esto no se puede deshacer.` : ''}
        confirmLabel="Borrar"
        danger
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

interface MatchEditFields {
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B'
}

const scoreInputStyle = {
  borderColor: 'rgba(203, 170, 106, 0.35)',
  backgroundColor: 'rgba(0,0,0,0.2)',
  color: 'var(--color-paper-50)',
}

function EditMatchDialog({
  match,
  onSave,
  onCancel,
}: {
  match: AdminMatch | null
  onSave: (id: string, fields: MatchEditFields) => void
  onCancel: () => void
}) {
  const [teamAName, setTeamAName] = useState('')
  const [teamBName, setTeamBName] = useState('')
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [winner, setWinner] = useState<'A' | 'B'>('A')

  // Se re-arma con los datos del partido cada vez que se abre uno nuevo (en
  // vez de arrastrar lo que había quedado tipeado del partido anterior).
  useEffect(() => {
    if (!match) return
    setTeamAName(match.team_a_name)
    setTeamBName(match.team_b_name)
    setScoreA(String(match.score_a))
    setScoreB(String(match.score_b))
    setWinner(match.winner)
  }, [match])

  if (!match) return null

  const parsedA = Number(scoreA)
  const parsedB = Number(scoreB)
  const valid =
    teamAName.trim().length > 0 &&
    teamBName.trim().length > 0 &&
    Number.isInteger(parsedA) &&
    parsedA >= 0 &&
    Number.isInteger(parsedB) &&
    parsedB >= 0

  return (
    <Overlay onDismiss={onCancel}>
      <h3 className="font-poster text-xl mb-3" style={{ color: 'var(--color-paper-50)' }}>
        Editar partido
      </h3>
      <div className="space-y-2.5">
        <input
          value={teamAName}
          onChange={(e) => setTeamAName(e.target.value)}
          placeholder="Nombre del equipo A"
          maxLength={40}
          className="w-full rounded-lg px-3 py-2 border outline-none text-sm"
          style={scoreInputStyle}
        />
        <input
          value={teamBName}
          onChange={(e) => setTeamBName(e.target.value)}
          placeholder="Nombre del equipo B"
          maxLength={40}
          className="w-full rounded-lg px-3 py-2 border outline-none text-sm"
          style={scoreInputStyle}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className="w-full rounded-lg px-3 py-2 border outline-none text-center font-num"
            style={scoreInputStyle}
          />
          <span className="opacity-50 shrink-0">-</span>
          <input
            type="number"
            inputMode="numeric"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className="w-full rounded-lg px-3 py-2 border outline-none text-center font-num"
            style={scoreInputStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWinner('A')}
            className="py-2 rounded-lg text-xs font-bold border truncate px-1"
            style={{
              borderColor: winner === 'A' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: winner === 'A' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            Ganó {teamAName.trim() || 'equipo A'}
          </button>
          <button
            type="button"
            onClick={() => setWinner('B')}
            className="py-2 rounded-lg text-xs font-bold border truncate px-1"
            style={{
              borderColor: winner === 'B' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
              color: winner === 'B' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
            }}
          >
            Ganó {teamBName.trim() || 'equipo B'}
          </button>
        </div>
      </div>
      <DialogButtons
        cancelLabel="Cancelar"
        confirmLabel="Guardar"
        confirmDisabled={!valid}
        onCancel={onCancel}
        onConfirm={() =>
          valid &&
          onSave(match.id, { teamAName: teamAName.trim(), teamBName: teamBName.trim(), scoreA: parsedA, scoreB: parsedB, winner })
        }
      />
    </Overlay>
  )
}

function MatchesPanel({ currentUser }: { currentUser: User }) {
  const [matches, setMatches] = useState<AdminMatch[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminMatch | null>(null)
  const [editingMatch, setEditingMatch] = useState<AdminMatch | null>(null)
  const [onlyDuplicates, setOnlyDuplicates] = useState(false)

  const load = () => {
    setError(null)
    fetch(`/api/admin/matches?requesterId=${encodeURIComponent(currentUser.id)}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<AdminMatch[]>
      })
      .then(setMatches)
      .catch(() => setError('No se pudo cargar la lista de partidos.'))
  }

  useEffect(load, [currentUser.id])

  const duplicateIds = useMemo(() => findDuplicateIds(matches ?? []), [matches])
  const visibleMatches = matches && onlyDuplicates ? matches.filter((m) => duplicateIds.has(m.id)) : matches

  const remove = async (m: AdminMatch) => {
    setPendingDelete(null)
    setBusyId(m.id)
    try {
      const res = await fetch(`/api/admin/matches/${m.id}?requesterId=${encodeURIComponent(currentUser.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo borrar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  const saveEdit = async (id: string, fields: MatchEditFields) => {
    setEditingMatch(null)
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id, ...fields }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo guardar.')
      } else {
        load()
      }
    } catch {
      setError('No se pudo conectar.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-sm text-center py-2" style={{ color: '#d9695f' }}>
          {error}
        </p>
      )}
      {matches === null && !error && <p className="text-center opacity-60 py-6">Cargando...</p>}
      {matches && matches.length === 0 && <p className="text-center opacity-60 py-6">No hay partidos registrados.</p>}

      {matches && matches.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOnlyDuplicates((v) => !v)}
            disabled={duplicateIds.size === 0}
            className="w-full text-xs font-bold py-2 mb-2 rounded-lg border disabled:opacity-40"
            style={{
              borderColor: duplicateIds.size > 0 ? '#8a6a2e' : 'var(--color-wood-600)',
              color: duplicateIds.size > 0 ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
              backgroundColor: onlyDuplicates ? 'rgba(203, 170, 106, 0.1)' : 'transparent',
            }}
          >
            {duplicateIds.size === 0
              ? 'No se encontraron posibles duplicados'
              : onlyDuplicates
                ? `Mostrando ${duplicateIds.size} posibles duplicados — tocá para ver todos`
                : `⚠ ${duplicateIds.size} partidos parecen duplicados — tocá para verlos`}
          </button>

          <div className="divide-y" style={{ borderColor: 'rgba(203, 170, 106, 0.15)' }}>
            {visibleMatches?.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm" style={{ color: 'var(--color-paper-100)' }}>
                    {m.team_a_player_names.join(', ')} <span className="opacity-40">vs</span>{' '}
                    {m.team_b_player_names.join(', ')}
                    {duplicateIds.has(m.id) && (
                      <span className="ml-2 text-xs font-bold" style={{ color: '#d9695f' }}>
                        ¿duplicado?
                      </span>
                    )}
                  </p>
                  <p className="text-xs opacity-50 mt-0.5">
                    {formatDate(m.played_at)} · {m.score_a} - {m.score_b}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingMatch(m)}
                  disabled={busyId === m.id}
                  className="text-xs font-bold px-2 py-1.5 rounded-md border shrink-0 disabled:opacity-30"
                  style={{ borderColor: 'var(--color-wood-600)', color: 'var(--color-paper-100)' }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(m)}
                  disabled={busyId === m.id}
                  className="text-xs font-bold px-2 py-1.5 rounded-md border shrink-0 disabled:opacity-30"
                  style={{ borderColor: '#8a3f38', color: '#d9695f' }}
                >
                  Borrar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <EditMatchDialog match={editingMatch} onSave={saveEdit} onCancel={() => setEditingMatch(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="¿Borrar partido?"
        message={
          pendingDelete
            ? `¿Borrar el partido ${pendingDelete.team_a_name} ${pendingDelete.score_a}-${pendingDelete.score_b} ${pendingDelete.team_b_name}?`
            : ''
        }
        confirmLabel="Borrar"
        danger
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export function AdminScreen({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [section, setSection] = useState<'users' | 'matches'>('users')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Volver">
          <BackIcon className="w-5 h-5" style={{ color: 'var(--color-paper-100)' }} />
        </button>
        <h2 className="font-poster text-2xl" style={{ color: 'var(--color-paper-50)' }}>
          Administrar
        </h2>
        <span className="w-5" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSection('users')}
          className="py-2 rounded-lg font-bold border text-sm"
          style={{
            borderColor: section === 'users' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
            color: section === 'users' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
          }}
        >
          Usuarios
        </button>
        <button
          type="button"
          onClick={() => setSection('matches')}
          className="py-2 rounded-lg font-bold border text-sm"
          style={{
            borderColor: section === 'matches' ? 'var(--color-ember-600)' : 'var(--color-wood-600)',
            color: section === 'matches' ? 'var(--color-ember-500)' : 'var(--color-paper-100)',
          }}
        >
          Partidos
        </button>
      </div>

      {section === 'users' ? <UsersPanel currentUser={currentUser} /> : <MatchesPanel currentUser={currentUser} />}
    </div>
  )
}

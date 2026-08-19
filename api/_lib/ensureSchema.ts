import { getPool } from './db'

let ready: Promise<void> | null = null

async function createSchema(): Promise<void> {
  const pool = getPool()

  try {
    await pool.query('create extension if not exists pgcrypto')
  } catch {
    // En bases donde ya viene gen_random_uuid() de fábrica (o sin permiso para
    // crear extensiones) esto puede fallar sin problema: seguimos igual.
  }

  await pool.query(`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      name_lower text generated always as (lower(name)) stored,
      created_at timestamptz not null default now()
    )
  `)
  await pool.query('create unique index if not exists users_name_lower_idx on users (name_lower)')

  await pool.query(`
    create table if not exists matches (
      id uuid primary key default gen_random_uuid(),
      team_a_name text not null,
      team_b_name text not null,
      team_a_player_ids uuid[] not null,
      team_b_player_ids uuid[] not null,
      team_a_player_names text[] not null,
      team_b_player_names text[] not null,
      score_a int not null,
      score_b int not null,
      winner text not null check (winner in ('A', 'B')),
      pica_pica_played boolean not null default false,
      pica_pica_total_a int not null default 0,
      pica_pica_total_b int not null default 0,
      played_at timestamptz not null default now()
    )
  `)
  await pool.query('create index if not exists matches_team_a_idx on matches using gin (team_a_player_ids)')
  await pool.query('create index if not exists matches_team_b_idx on matches using gin (team_b_player_ids)')
}

export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = createSchema().catch((err) => {
      ready = null
      throw err
    })
  }
  return ready
}

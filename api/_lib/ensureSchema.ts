import { getPool } from './db.js'

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
  await pool.query('alter table users add column if not exists is_admin boolean not null default false')

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
  await pool.query(
    "alter table matches add column if not exists pica_pica_rounds jsonb not null default '[]'::jsonb",
  )

  // La app nunca usa la API REST de Supabase (solo se conecta por Postgres
  // directo con DATABASE_URL), pero activamos RLS igual para que las tablas
  // no queden expuestas por esa vía. Al no definir policies, esa API no
  // devuelve ni deja tocar ninguna fila; nuestra conexión no se ve afectada
  // porque usa el rol dueño de la base, que no está sujeto a RLS.
  await pool.query('alter table users enable row level security')
  await pool.query('alter table matches enable row level security')
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

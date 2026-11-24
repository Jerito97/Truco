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
  await pool.query('alter table matches add column if not exists client_id text')
  // Nulo para los partidos guardados antes de este campo (no hay forma de
  // reconstruirlo después del hecho).
  await pool.query('alter table matches add column if not exists duration_seconds int')
  // Lista vacía en los partidos guardados antes de este campo: cada toque de
  // "+1"/la diferencia del pica-pica, con el segundo del partido en que pasó,
  // para poder dibujar la progresión del marcador en el tiempo.
  await pool.query(
    "alter table matches add column if not exists score_events jsonb not null default '[]'::jsonb",
  )
  // Partido ya guardado que se reintenta (reinicio de la app antes de vaciar
  // la cola local, doble POST, etc.): el client_id identifica ese partido
  // desde el dispositivo, así el insert de abajo lo ignora en vez de duplicarlo.
  await pool.query(
    'create unique index if not exists matches_client_id_idx on matches (client_id) where client_id is not null',
  )

  // Partido que se está jugando ahora mismo en algún dispositivo: se
  // actualiza solo (sin que quien anota toque nada aparte de sumar o restar
  // puntos) para que el resto del grupo lo vea "en vivo" desde el Inicio. No
  // tiene relación con la tabla matches (esa solo recibe partidos
  // terminados): esta fila se borra apenas el partido termina o se descarta,
  // o sola a las 12hs sin cambios si el dispositivo lo abandonó a mitad de
  // partido sin avisar (ver el filtro en el GET ?live=1).
  await pool.query(`
    create table if not exists live_matches (
      id text primary key,
      team_a_name text not null,
      team_b_name text not null,
      team_a_player_names text[] not null,
      team_b_player_names text[] not null,
      score_a int not null,
      score_b int not null,
      updated_at timestamptz not null default now()
    )
  `)

  await pool.query(`
    create table if not exists tournaments (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      format text not null check (format in ('eliminacion', 'todos_contra_todos')),
      teams jsonb not null,
      board jsonb not null,
      status text not null default 'en_curso' check (status in ('en_curso', 'finalizado')),
      champion_team_index int,
      created_by uuid not null references users(id),
      created_at timestamptz not null default now(),
      finished_at timestamptz
    )
  `)
  await pool.query('create index if not exists tournaments_status_idx on tournaments (status)')

  // La app nunca usa la API REST de Supabase (solo se conecta por Postgres
  // directo con DATABASE_URL), pero activamos RLS igual para que las tablas
  // no queden expuestas por esa vía. Al no definir policies, esa API no
  // devuelve ni deja tocar ninguna fila; nuestra conexión no se ve afectada
  // porque usa el rol dueño de la base, que no está sujeto a RLS.
  await pool.query('alter table users enable row level security')
  await pool.query('alter table matches enable row level security')
  await pool.query('alter table live_matches enable row level security')
  await pool.query('alter table tournaments enable row level security')
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

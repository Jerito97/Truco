-- Correr esto una sola vez en el editor SQL de la base Postgres de Vercel
-- (pestaña "Storage" del proyecto -> tu base de datos -> "Query").

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_lower text generated always as (lower(name)) stored,
  created_at timestamptz not null default now(),
  is_admin boolean not null default false
);

create unique index if not exists users_name_lower_idx on users (name_lower);

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
  pica_pica_rounds jsonb not null default '[]'::jsonb,
  played_at timestamptz not null default now()
);

create index if not exists matches_team_a_idx on matches using gin (team_a_player_ids);
create index if not exists matches_team_b_idx on matches using gin (team_b_player_ids);

-- La app se conecta por Postgres directo (no usa la API REST de Supabase),
-- pero activamos RLS para que las tablas no queden expuestas por esa vía.
alter table users enable row level security;
alter table matches enable row level security;

-- Tend initial schema: focus (goals/steps), habits (identities/habits/logs), todos
-- Everything lives in the dedicated "tend" schema (not public).
-- NOTE: the "tend" schema must also be added to the API "Exposed schemas" list
-- (Dashboard → Project Settings → API), otherwise PostgREST returns 404/406.

create schema if not exists tend;

-- PostgREST roles need access to the schema; RLS below still guards every row.
grant usage on schema tend to anon, authenticated, service_role;
alter default privileges in schema tend
  grant all on tables to anon, authenticated, service_role;

-- ===== goals =====
create table tend.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  focus_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table tend.steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references tend.goals (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- ===== habits =====
create table tend.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

create table tend.habits (
  id uuid primary key default gen_random_uuid(),
  identity_id uuid not null references tend.identities (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '',
  schedule smallint[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);

create table tend.habit_logs (
  habit_id uuid not null references tend.habits (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  primary key (habit_id, day)
);

-- ===== todos =====
create table tend.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  today boolean not null default false,
  created_at timestamptz not null default now()
);

-- ===== indexes =====
create index goals_user_idx on tend.goals (user_id, created_at desc);
create index steps_goal_idx on tend.steps (goal_id, position);
create index steps_user_idx on tend.steps (user_id);
create index identities_user_idx on tend.identities (user_id, created_at);
create index habits_identity_idx on tend.habits (identity_id, created_at);
create index habits_user_idx on tend.habits (user_id);
create index habit_logs_user_idx on tend.habit_logs (user_id, day);
create index todos_user_idx on tend.todos (user_id, created_at desc);

-- ===== RLS =====
alter table tend.goals enable row level security;
alter table tend.steps enable row level security;
alter table tend.identities enable row level security;
alter table tend.habits enable row level security;
alter table tend.habit_logs enable row level security;
alter table tend.todos enable row level security;

create policy "own goals" on tend.goals
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own steps" on tend.steps
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own identities" on tend.identities
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own habits" on tend.habits
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own habit_logs" on tend.habit_logs
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own todos" on tend.todos
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

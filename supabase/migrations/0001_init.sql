-- Kasa — initial schema (PRD 7.5, 8).
-- Auth, profiles, progress/streaks, lesson completions, and over-the-air packs.
-- Row-level security is ON everywhere: a user can only ever touch their own rows.

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (incl. anonymous sign-ins).
-- Holds the chosen direction and the streak, mirroring the on-device store so
-- progress follows the user across devices/sessions (PRD 3.10).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  direction         text check (direction in ('learn-en', 'learn-twi')),
  streak_days       integer not null default 0,
  last_active_date  date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles are self-insertable" on public.profiles;
create policy "profiles are self-insertable"
  on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles are self-updatable" on public.profiles;
create policy "profiles are self-updatable"
  on public.profiles for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- lesson_completions: one row each time a user finishes a pack. Kept granular
-- (not a counter) so we can later see what users actually practise (PRD 9).
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_completions (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  pack_id       text not null,
  completed_at  timestamptz not null default now()
);

create index if not exists lesson_completions_user_idx
  on public.lesson_completions (user_id, completed_at desc);

alter table public.lesson_completions enable row level security;

drop policy if exists "completions are self-readable" on public.lesson_completions;
create policy "completions are self-readable"
  on public.lesson_completions for select using (auth.uid() = user_id);
drop policy if exists "completions are self-insertable" on public.lesson_completions;
create policy "completions are self-insertable"
  on public.lesson_completions for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- packs: scenario content served over the air and cached for offline use
-- (PRD 5.4, 7.5). `data` is the full pack JSON (phrases + audio references);
-- `version` drives client cache invalidation. Audio files live in the
-- 'packs' Storage bucket. Only published packs are visible to clients; writes
-- are service-role only (content tooling), never from the app.
-- ---------------------------------------------------------------------------
create table if not exists public.packs (
  id          text primary key,
  direction   text not null check (direction in ('learn-en', 'learn-twi')),
  title       text not null,
  emoji       text,
  color       text,
  version     integer not null default 1,
  data        jsonb not null,
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);

alter table public.packs enable row level security;

drop policy if exists "published packs are world-readable" on public.packs;
create policy "published packs are world-readable"
  on public.packs for select using (published = true);
-- No insert/update/delete policies => only the service role can write packs.

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists packs_touch on public.packs;
create trigger packs_touch before update on public.packs
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row when a new auth user appears (incl. anonymous).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

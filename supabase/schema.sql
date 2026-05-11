-- =====================================================================
-- Visa Guide — initial schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1. Profiles table mirrors auth.users with extra app fields.
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  full_name           text,
  avatar_url          text,
  access_expires_at   timestamptz not null default '2026-08-15T23:59:59Z',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. Row-level security: every user can only see / update their own row.
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. On every new auth.users row, create a matching profiles row
--    with the access expiry date pre-set.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, access_expires_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    '2026-08-15T23:59:59Z'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- 5. Visa document checklist progress (one row per user).
--    checked_items is a JSONB array of stable item ids the user ticked.
--    funding_type filters which items are shown in the UI.
-- =====================================================================
create table if not exists public.checklist_progress (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  funding_type   text not null default 'undecided'
                 check (funding_type in ('undecided', 'scholarship', 'self_funded')),
  checked_items  jsonb not null default '[]'::jsonb,
  step_tasks     jsonb not null default '[]'::jsonb,
  updated_at     timestamptz not null default now()
);

-- For existing installations: add the step_tasks column if it isn't there yet.
alter table public.checklist_progress
  add column if not exists step_tasks jsonb not null default '[]'::jsonb;

alter table public.checklist_progress enable row level security;

drop policy if exists "Checklist visible to owner"  on public.checklist_progress;
create policy "Checklist visible to owner"
  on public.checklist_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Checklist insert by owner" on public.checklist_progress;
create policy "Checklist insert by owner"
  on public.checklist_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Checklist update by owner" on public.checklist_progress;
create policy "Checklist update by owner"
  on public.checklist_progress for update
  using (auth.uid() = user_id);

drop trigger if exists checklist_touch_updated_at on public.checklist_progress;
create trigger checklist_touch_updated_at
  before update on public.checklist_progress
  for each row execute function public.touch_updated_at();
